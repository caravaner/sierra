"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/lib/cart-context";
import { AddressPicker, type AddressFields } from "@/components/address-picker";
import { formatCurrency } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, Landmark, CreditCard, Pencil } from "lucide-react";

const ADDRESS_STORAGE_KEY = "sierra-checkout-address";
const PENDING_ORDER_KEY = "sierra-pending-order";

function loadSavedAddress(): AddressFields | null {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AddressFields>;
    // Only restore if it has the new format
    if (!parsed.deliveryAreaId) return null;
    return parsed as AddressFields;
  } catch {
    return null;
  }
}

export type PendingOrder = {
  address: AddressFields;
  paymentMethod: "BANK_TRANSFER" | "ONLINE";
  name?: string;
  phone?: string;
  email?: string;
};

const EMPTY_ADDRESS: AddressFields = { street: "", deliveryAreaId: "", areaName: "" };

export default function CheckoutPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { items, total } = useCart();

  const customerQuery = trpc.customer.me.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
  });
  const addressesQuery = trpc.customer.listAddresses.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
  });
  const areasQuery = trpc.deliveryArea.list.useQuery();
  const deliveryConfigQuery = trpc.settings.deliveryConfig.useQuery();
  const syncCustomer = trpc.customer.sync.useMutation();
  const addAddress = trpc.customer.addAddress.useMutation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [localAddress, setLocalAddress] = useState<AddressFields | null>(null);
  const [useLocalAddress, setUseLocalAddress] = useState(true);
  const [newAddress, setNewAddress] = useState<AddressFields>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "ONLINE">("BANK_TRANSFER");
  const [error, setError] = useState("");
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    const saved = loadSavedAddress();
    if (saved) setLocalAddress(saved);
  }, []);

  useEffect(() => {
    const addresses = addressesQuery.data?.addresses;
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault);
      setSelectedAddressId(def ? def.id : addresses[0]!.id);
    }
  }, [addressesQuery.data]);

  if (sessionStatus === "loading") {
    return <p className="py-10 text-center text-muted-foreground">Loading...</p>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold">Sign in to checkout</h1>
        <p className="mb-6 text-muted-foreground">You need an account to complete your order.</p>
        <Button asChild size="lg">
          <a href={`/auth/signin?callbackUrl=/checkout`}>Sign In</a>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/auth/signup" className="font-medium text-foreground underline underline-offset-4">
            Sign Up
          </a>
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold">Your cart is empty</h1>
        <Button variant="outline" asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  const areasData = areasQuery.data ?? [];
  // Strip deliveryFee for the picker (only needs id/name/description)
  const areas: import("@/components/address-picker").DeliveryArea[] = areasData.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
  }));

  const savedAddresses = addressesQuery.data?.addresses ?? [];
  const needsProfile = customerQuery.isFetched && !customerQuery.data;
  const selectedSaved = savedAddresses.find((a) => a.id === selectedAddressId);
  const deliveryConfig = deliveryConfigQuery.data ?? { deliveryFee: 500, freeDeliveryFrom: 10000 };

  // Determine active area for fee computation using raw tRPC data (includes deliveryFee as Decimal)
  function getActiveAreaData() {
    if (selectedSaved) {
      return areasData.find((a) => a.id === selectedSaved.deliveryAreaId) ?? null;
    }
    if (useLocalAddress && localAddress) {
      return areasData.find((a) => a.id === localAddress.deliveryAreaId) ?? null;
    }
    return areasData.find((a) => a.id === newAddress.deliveryAreaId) ?? null;
  }

  const activeAreaData = getActiveAreaData();
  const activeAreaFee = activeAreaData?.deliveryFee != null ? Number(activeAreaData.deliveryFee) : null;
  const deliveryFee =
    activeAreaFee !== null
      ? activeAreaFee
      : total >= deliveryConfig.freeDeliveryFrom
        ? 0
        : deliveryConfig.deliveryFee;
  const orderTotal = total + deliveryFee;

  async function handleContinue() {
    setError("");
    setProceeding(true);

    try {
      if (needsProfile) {
        const trimmedName = name.trim();
        if (!trimmedName || !phone) {
          setError("Please fill in your name and phone number.");
          setProceeding(false);
          return;
        }
        const parts = trimmedName.split(/\s+/);
        const firstName = parts[0]!;
        const lastName = parts.slice(1).join(" ") || firstName;
        await syncCustomer.mutateAsync({
          phone,
          email: email || undefined,
          firstName,
          lastName,
        });
      }

      let shippingAddress: AddressFields;
      if (selectedSaved) {
        if (!selectedSaved.deliveryArea.isActive) {
          setError("The delivery area for this saved address is no longer available. Please select a different address.");
          setProceeding(false);
          return;
        }
        shippingAddress = {
          street: selectedSaved.street,
          deliveryAreaId: selectedSaved.deliveryAreaId,
          areaName: selectedSaved.deliveryArea.name,
        };
      } else if (useLocalAddress && localAddress) {
        // Validate the saved area is still active
        const area = areas.find((a) => a.id === localAddress.deliveryAreaId);
        if (!area) {
          setError("Your last-used delivery area is no longer available. Please enter a new address.");
          setUseLocalAddress(false);
          setProceeding(false);
          return;
        }
        shippingAddress = localAddress;
      } else {
        if (!newAddress.deliveryAreaId) {
          setError("Please select a delivery area.");
          setProceeding(false);
          return;
        }
        if (!newAddress.street.trim()) {
          setError("Please enter your house / street detail.");
          setProceeding(false);
          return;
        }
        shippingAddress = newAddress;
        if (saveAddress) {
          await addAddress.mutateAsync({
            street: newAddress.street,
            deliveryAreaId: newAddress.deliveryAreaId,
            isDefault: savedAddresses.length === 0,
          });
        }
      }

      // Persist pending order details for the payment page
      const pendingOrder: PendingOrder = {
        address: shippingAddress,
        paymentMethod,
        name: needsProfile ? name : undefined,
        phone: needsProfile ? phone : undefined,
        email: needsProfile ? email : undefined,
      };
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pendingOrder));

      router.push("/checkout/payment");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setProceeding(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Details</CardTitle>
                {customerQuery.data && !editingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = customerQuery.data!;
                      setName(`${c.firstName} ${c.lastName}`);
                      setPhone(c.phone);
                      setEmail(c.email ?? "");
                      setEditingProfile(true);
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {customerQuery.data && !editingProfile ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {customerQuery.data.firstName} {customerQuery.data.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{customerQuery.data.phone}</p>
                  {customerQuery.data.email && (
                    <p className="text-sm text-muted-foreground">{customerQuery.data.email}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email{" "}
                      <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {editingProfile && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          const trimmedName = name.trim();
                          if (!trimmedName || !phone) return;
                          const parts = trimmedName.split(/\s+/);
                          await syncCustomer.mutateAsync({
                            phone,
                            email: email || undefined,
                            firstName: parts[0]!,
                            lastName: parts.slice(1).join(" ") || parts[0]!,
                          });
                          await customerQuery.refetch();
                          setEditingProfile(false);
                        }}
                        disabled={syncCustomer.isPending}
                      >
                        {syncCustomer.isPending ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => {
                    const inactive = !addr.deliveryArea.isActive;
                    return (
                      <label
                        key={addr.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                          inactive ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50"
                        } ${selectedAddressId === addr.id && !inactive ? "border-primary bg-muted/30" : ""}`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => !inactive && setSelectedAddressId(addr.id)}
                          disabled={inactive}
                          className="mt-0.5"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{addr.street}</p>
                          <p className="text-muted-foreground">{addr.deliveryArea.name}</p>
                          {inactive && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Area no longer available
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setSelectedAddressId("new"); setUseLocalAddress(false); }}
                  >
                    <Plus className="h-4 w-4" />
                    Add new address
                  </Button>
                </div>
              )}

              {selectedAddressId === "new" && (
                <>
                  {localAddress && useLocalAddress ? (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Last used address
                      </p>
                      <p className="text-sm font-medium">{localAddress.street}</p>
                      <p className="text-sm text-muted-foreground">{localAddress.areaName}</p>
                      <button
                        type="button"
                        onClick={() => setUseLocalAddress(false)}
                        className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Ship to a different address
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        {localAddress && (
                          <button
                            type="button"
                            onClick={() => setUseLocalAddress(true)}
                            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            ← Use my last address
                          </button>
                        )}
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAddressId(savedAddresses[0]!.id)}
                            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <AddressPicker
                        areas={areas}
                        value={newAddress}
                        onChange={setNewAddress}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="rounded"
                        />
                        Save this address to my account
                      </label>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40 ${
                  paymentMethod === "BANK_TRANSFER" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="mt-1"
                />
                <div className="flex flex-1 items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">
                      Send payment directly to our bank account. We&apos;ll confirm and process
                      your order once payment is received.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40 ${
                  paymentMethod === "ONLINE" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="mt-1"
                />
                <div className="flex flex-1 items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Pay Online</p>
                    <p className="text-sm text-muted-foreground">
                      Pay securely with your card or bank via Paystack. Your order is confirmed
                      instantly.
                    </p>
                  </div>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} <span className="font-medium text-foreground">×{item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                {deliveryFee === 0 ? (
                  <span className="font-medium text-green-600">Free</span>
                ) : (
                  <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                )}
              </div>

              {deliveryFee > 0 && activeAreaFee === null && (
                <p className="text-xs text-muted-foreground">
                  Add {formatCurrency(deliveryConfig.freeDeliveryFrom - total)} more for free delivery
                </p>
              )}

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(orderTotal)}</span>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                onClick={handleContinue}
                disabled={proceeding || areas.length === 0 || editingProfile}
                className="mt-2 w-full rounded-full"
                size="lg"
              >
                {proceeding ? "Saving..." : "Continue to Payment →"}
              </Button>

              {areas.length === 0 && !areasQuery.isLoading && (
                <p className="text-center text-xs text-destructive">
                  Delivery is temporarily unavailable. Please try again later.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
