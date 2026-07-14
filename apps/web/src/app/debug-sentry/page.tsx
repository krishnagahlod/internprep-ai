"use client";

import { Button } from "@/components/ui/button";

export default function DebugSentry() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-bold">Sentry Debug Page</h1>
      <p>Click the button below to intentionally throw a frontend error and test Sentry.</p>
      <Button
        variant="destructive"
        onClick={() => {
          throw new Error("Test frontend error for Sentry!");
        }}
      >
        Throw Error
      </Button>
    </div>
  );
}
