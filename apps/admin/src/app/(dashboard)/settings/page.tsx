"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { data, isLoading } = trpc.settings.deliveryConfig.useQuery();
  const updateConfig = trpc.settings.updateDeliveryConfig.useMutation({
    onSuccess: () => toast.success("Settings updated"),
    onError: (err) => toast.error(err.message),
  });

  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeDeliveryFrom, setFreeDeliveryFrom] = useState("");

  useEffect(() => {
    if (data) {
      setDeliveryFee(String(data.deliveryFee / 100));
      setFreeDeliveryFrom(String(data.freeDeliveryFrom / 100));
    }
  }, [data]);

  function handleSave() {
    const fee = Math.round(parseFloat(deliveryFee) * 100);
    const threshold = Math.round(parseFloat(freeDeliveryFrom) * 100);
    if (isNaN(fee) || isNaN(threshold)) {
      toast.error("Please enter valid numbers");
      return;
    }
    updateConfig.mutate({ deliveryFee: fee, freeDeliveryFrom: threshold });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure store-wide settings</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Delivery Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="5.00"
                />
                <p className="text-xs text-muted-foreground">
                  Fee charged for orders below the free delivery threshold
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeDeliveryFrom">Free Delivery From ($)</Label>
                <Input
                  id="freeDeliveryFrom"
                  type="number"
                  min="0"
                  step="0.01"
                  value={freeDeliveryFrom}
                  onChange={(e) => setFreeDeliveryFrom(e.target.value)}
                  placeholder="100.00"
                />
                <p className="text-xs text-muted-foreground">
                  Orders at or above this amount get free delivery
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending}
              >
                {updateConfig.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
