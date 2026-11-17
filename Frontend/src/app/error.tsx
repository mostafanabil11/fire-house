"use client";

import { useEffect } from "react";

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
    <div className="page-shell flex flex-col items-center text-center">
      <h1 className="mb-4 font-heading text-3xl sm:text-4xl text-foreground">
        Something went wrong
      </h1>
      <p className="mb-8 text-base text-muted-foreground">
        We hit an unexpected error. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="action-primary"
      >
        Try again
      </button>
    </div>
  );
}
