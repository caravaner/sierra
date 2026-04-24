"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        We&apos;re having trouble loading this page. Please try again in a moment.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/">Back to home</a>
        </Button>
      </div>
    </div>
  );
}
