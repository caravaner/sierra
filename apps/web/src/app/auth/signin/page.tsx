"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@sierra/shared";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { login, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email/username or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="login">Phone, email or username</Label>
        <Input
          id="login"
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your {APP_NAME} account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<p className="py-4 text-center text-muted-foreground text-sm">Loading...</p>}>
              <SignInForm />
            </Suspense>
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Don&apos;t have an account?{" "}
                <a href="/auth/signup" className="font-medium text-foreground underline underline-offset-4">
                  Sign Up
                </a>
              </p>
              <p>
                <a href="/auth/forgot-password" className="font-medium text-foreground underline underline-offset-4">
                  Forgot password?
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
