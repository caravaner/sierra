"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "reset">("verify");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const reset = trpc.user.resetPassword.useMutation({
    onSuccess: () => router.push("/auth/signin?reset=1"),
    onError: (err) => setError(err.message),
  });

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("reset");
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    reset.mutate({ phone, name, newPassword });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {step === "verify"
                ? "Enter your registered phone number and full name to continue."
                : "Choose a new password for your account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}

            {step === "verify" ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-phone">Phone Number</Label>
                  <Input
                    id="fp-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-name">Full Name</Label>
                  <Input
                    id="fp-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Continue</Button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-new">New Password</Label>
                  <Input
                    id="fp-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-confirm">Confirm Password</Label>
                  <Input
                    id="fp-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={reset.isPending}>
                  {reset.isPending ? "Saving…" : "Set New Password"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("verify")}>
                  Back
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <a href="/auth/signin" className="font-medium text-foreground underline underline-offset-4">
                Back to Sign In
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
