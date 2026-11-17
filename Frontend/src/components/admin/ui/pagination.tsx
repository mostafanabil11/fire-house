"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-5 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="action-secondary min-h-11 px-4"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Previous
      </button>
      <span className="text-sm font-semibold text-muted-foreground tabular-nums">
        {`Page ${page} of ${pages}`}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="action-secondary min-h-11 px-4"
      >
        Next
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
