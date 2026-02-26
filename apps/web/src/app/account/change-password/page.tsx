"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const change = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrent("");
      setNewPw("");
      setConfirm("");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    change.mutate({ currentPassword: current, newPassword: newPw });
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update the password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden username satisfies browser accessibility requirement for password forms */}
            <input type="hidden" autoComplete="username" value={session?.user?.email ?? ""} readOnly />
            <div className="space-y-2">
              <Label htmlFor="cp-current">Current Password</Label>
              <PasswordInput
                id="cp-current"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                autoFocus
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-new">New Password</Label>
              <PasswordInput
                id="cp-new"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-confirm">Confirm New Password</Label>
              <PasswordInput
                id="cp-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={change.isPending}>
              {change.isPending ? "Saving…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
