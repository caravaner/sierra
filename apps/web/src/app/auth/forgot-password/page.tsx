"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    forgotPassword.mutate({ email });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Forgot password?</CardTitle>
            <CardDescription>
              {submitted
                ? "Check your inbox for a reset link."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitted ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, you&apos;ll receive an email
                  with instructions shortly. The link expires in 1 hour.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                  Send another email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email address</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
                  {forgotPassword.isPending ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
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
