"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/lib/cart-context";
import { AddressPicker } from "@/components/address-picker";
import { formatCurrency } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

const ADDRESS_STORAGE_KEY = "sierra-checkout-address";

interface AddressFields {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

function loadSavedAddress(): AddressFields | null {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AddressFields) : null;
  } catch {
    return null;
  }
}

function persistAddress(address: AddressFields) {
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
  } catch {
    // storage unavailable — silently ignore
  }
}

export default function CheckoutPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const customerQuery = trpc.customer.me.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
  });
  const addressesQuery = trpc.customer.listAddresses.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
  });
  const deliveryConfigQuery = trpc.settings.deliveryConfig.useQuery();
  const syncCustomer = trpc.customer.sync.useMutation();
  const addAddress = trpc.customer.addAddress.useMutation();
  const placeOrder = trpc.order.place.useMutation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  // localAddress: the address card shown from the last order (localStorage)
  const [localAddress, setLocalAddress] = useState<AddressFields | null>(null);
  // useLocalAddress: true = ship to the card, false = show the form for a different address
  const [useLocalAddress, setUseLocalAddress] = useState(true);
  const [newAddress, setNewAddress] = useState<AddressFields>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  // Load persisted address from localStorage on mount
  useEffect(() => {
    const saved = loadSavedAddress();
    if (saved) setLocalAddress(saved);
  }, []);

  // Auto-select default saved address when addresses load
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

  const savedAddresses = addressesQuery.data?.addresses ?? [];
  const needsProfile = !customerQuery.data;
  const selectedSaved = savedAddresses.find((a) => a.id === selectedAddressId);
  const deliveryConfig = deliveryConfigQuery.data ?? { deliveryFee: 500, freeDeliveryFrom: 10000 };
  const deliveryFee = total >= deliveryConfig.freeDeliveryFrom ? 0 : deliveryConfig.deliveryFee;
  const orderTotal = total + deliveryFee;

  async function handlePlaceOrder() {
    setError("");
    setPlacing(true);

    try {
      if (needsProfile) {
        const trimmedName = name.trim();
        if (!trimmedName || !phone) {
          setError("Please fill in your name and phone number.");
          setPlacing(false);
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
        shippingAddress = {
          street: selectedSaved.street,
          city: selectedSaved.city,
          state: selectedSaved.state,
          zipCode: selectedSaved.zipCode,
          country: selectedSaved.country,
        };
      } else if (useLocalAddress && localAddress) {
        shippingAddress = localAddress;
      } else {
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
          setError("Please fill in all address fields.");
          setPlacing(false);
          return;
        }
        shippingAddress = newAddress;
        if (saveAddress) {
          await addAddress.mutateAsync({ ...newAddress, isDefault: savedAddresses.length === 0 });
        }
      }

      await placeOrder.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        shippingAddress,
      });

      persistAddress(shippingAddress);
      clearCart();
      toast.success("Order placed successfully!");
      router.push("/checkout/success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order.";
      setError(message);
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {needsProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    placeholder="+1 555 000 0000"
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
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        selectedAddressId === addr.id ? "border-primary bg-muted/30" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{addr.street}</p>
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                        <p className="text-muted-foreground">{addr.country}</p>
                      </div>
                    </label>
                  ))}
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
                      <p className="text-sm text-muted-foreground">
                        {localAddress.city}, {localAddress.state} {localAddress.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">{localAddress.country}</p>
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
                      <AddressPicker onAddressSelect={setNewAddress} defaultValue={newAddress} />
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

              {deliveryFee > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatCurrency(deliveryConfig.freeDeliveryFrom - total)} more for free delivery
                </p>
              )}

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="mt-2 w-full"
                size="lg"
              >
                {placing ? "Placing order..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
