"use client";

import { useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const libraries: ("places")[] = ["places"];

interface AddressFields {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressPickerProps {
  onAddressSelect: (address: AddressFields) => void;
  defaultValue?: AddressFields;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const defaultCenter = { lat: 37.7749, lng: -122.4194 };

function parsePlace(place: google.maps.places.PlaceResult): AddressFields {
  const components = place.address_components ?? [];
  let street = "";
  let city = "";
  let state = "";
  let zipCode = "";
  let country = "";

  for (const c of components) {
    const types = c.types;
    if (types.includes("street_number")) {
      street = c.long_name + " " + street;
    } else if (types.includes("route")) {
      street = street + c.long_name;
    } else if (types.includes("locality") || types.includes("sublocality")) {
      city = c.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = c.short_name;
    } else if (types.includes("postal_code")) {
      zipCode = c.long_name;
    } else if (types.includes("country")) {
      country = c.short_name;
    }
  }

  return { street: street.trim(), city, state, zipCode, country: country || "US" };
}

function AddressFormFields({
  fields,
  onChange,
}: {
  fields: AddressFields;
  onChange: (field: keyof AddressFields, value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>Street</Label>
        <Input
          type="text"
          value={fields.street}
          onChange={(e) => onChange("street", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>City</Label>
        <Input
          type="text"
          value={fields.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>State</Label>
        <Input
          type="text"
          value={fields.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Zip Code</Label>
        <Input
          type="text"
          value={fields.zipCode}
          onChange={(e) => onChange("zipCode", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Country</Label>
        <Input
          type="text"
          value={fields.country}
          onChange={(e) => onChange("country", e.target.value)}
        />
      </div>
    </div>
  );
}

export function AddressPicker({ onAddressSelect, defaultValue }: AddressPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries,
  });

  const [fields, setFields] = useState<AddressFields>(
    defaultValue ?? { street: "", city: "", state: "", zipCode: "", country: "US" },
  );
  const [markerPos, setMarkerPos] = useState(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleFieldChange = useCallback(
    (field: keyof AddressFields, value: string) => {
      const updated = { ...fields, [field]: value };
      setFields(updated);
      onAddressSelect(updated);
    },
    [fields, onAddressSelect],
  );

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;

    const parsed = parsePlace(place);
    setFields(parsed);
    onAddressSelect(parsed);

    if (place.geometry?.location) {
      setMarkerPos({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  }, [onAddressSelect]);

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const parsed = parsePlace(results[0]);
          setFields(parsed);
          onAddressSelect(parsed);
        }
      });
    },
    [onAddressSelect],
  );

  // No API key or failed to load — show manual fields only
  if (!MAPS_API_KEY || !isLoaded) {
    return (
      <div className="space-y-4">
        {MAPS_API_KEY && (
          <p className="text-sm text-muted-foreground">Loading map...</p>
        )}
        <AddressFormFields fields={fields} onChange={handleFieldChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Autocomplete
        onLoad={(a) => (autocompleteRef.current = a)}
        onPlaceChanged={handlePlaceSelect}
      >
        <Input
          type="text"
          placeholder="Search for an address..."
        />
      </Autocomplete>

      <div className="overflow-hidden rounded-md border">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "300px" }}
          center={markerPos}
          zoom={14}
        >
          <Marker position={markerPos} draggable onDragEnd={handleMarkerDragEnd} />
        </GoogleMap>
      </div>

      <AddressFormFields fields={fields} onChange={handleFieldChange} />
    </div>
  );
}
