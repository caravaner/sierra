"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const reset = trpc.auth.resetPasswordWithToken.useMutation({
    onSuccess: () => router.push("/auth/signin?reset=1"),
    onError: (err) => setError(err.message),
  });

  if (!token) {
    return (
      <p className="text-center text-sm text-destructive">
        Invalid link. Please{" "}
        <Link href="/auth/forgot-password" className="underline underline-offset-4">
          request a new one
        </Link>
        .
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    reset.mutate({ token, newPassword });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <input type="hidden" autoComplete="username" value="" readOnly className="hidden" />
      <div className="space-y-2">
        <Label htmlFor="rp-new">New password</Label>
        <PasswordInput
          id="rp-new"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoFocus
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rp-confirm">Confirm new password</Label>
        <PasswordInput
          id="rp-confirm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={reset.isPending}>
        {reset.isPending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/auth/signin" className="font-medium text-foreground underline underline-offset-4">
                Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
