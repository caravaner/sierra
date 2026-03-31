"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DeliveryArea {
  id: string;
  name: string;
  description?: string | null;
}

export interface AddressFields {
  street: string;
  deliveryAreaId: string;
  areaName: string;
}

interface AddressPickerProps {
  areas: DeliveryArea[];
  value: AddressFields;
  onChange: (address: AddressFields) => void;
}

export function AddressPicker({ areas, value, onChange }: AddressPickerProps) {
  function handleAreaChange(areaId: string) {
    const area = areas.find((a) => a.id === areaId);
    onChange({ ...value, deliveryAreaId: areaId, areaName: area?.name ?? "" });
  }

  function handleStreetChange(street: string) {
    onChange({ ...value, street });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="delivery-area">Delivery Area</Label>
        <select
          id="delivery-area"
          value={value.deliveryAreaId}
          onChange={(e) => handleAreaChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select a delivery area…</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {areas.length === 0 && (
          <p className="text-sm text-destructive">
            No delivery areas are currently available. Please contact us for assistance.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="street-detail">House / Block / Street Detail</Label>
        <Input
          id="street-detail"
          type="text"
          placeholder="e.g. Block 5, Flat 12A"
          value={value.street}
          onChange={(e) => handleStreetChange(e.target.value)}
        />
      </div>
    </div>
  );
}
