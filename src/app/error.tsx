"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

type RouteErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function RouteError({ error, retry }: RouteErrorProps) {
  return <ErrorFallback error={error} retry={retry} />;
}
