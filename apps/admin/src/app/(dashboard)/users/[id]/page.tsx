"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@sierra/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: customer, isLoading } = trpc.customer.byId.useQuery({ id: params.id });

  if (isLoading) {
    return <p className="py-10 text-center text-muted-foreground">Loading...</p>;
  }

  if (!customer) {
    return <p className="py-10 text-center text-muted-foreground">User not found.</p>;
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <a href="/users">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </a>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-muted-foreground">{customer.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {formatDate(customer.createdAt)}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Addresses ({customer.addresses.length})
        </h2>
        {customer.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No addresses on file.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customer.addresses.map((addr) => (
              <Card key={addr.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {addr.street}
                    </CardTitle>
                    {addr.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
