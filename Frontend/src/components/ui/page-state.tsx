"use client";
import Link from "next/link";
import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { T } from "@/i18n/language-provider";
export function PageSkeleton() {
  return <div className="page-shell" role="status" aria-label="Loading">
    <span className="sr-only"><T>Loading…</T></span>
    <div aria-hidden className="space-y-6">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      <div className="h-10 w-2/3 max-w-sm animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>
    </div>
  </div>;
}
export function PageState({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) {
  return <div className="mx-auto my-8 max-w-xl rounded-3xl border bg-card px-6 py-12 text-center">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><UtensilsCrossed aria-hidden /></span>
    <h2 className="mt-5 font-heading text-2xl font-extrabold"><T>{title}</T></h2>
    <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground"><T>{description}</T></p>
    {onRetry ? <button onClick={onRetry} className="action-primary mt-6"><RefreshCw className="size-4" aria-hidden /><T>Try again</T></button> : <Link href="/menu" className="action-primary mt-6"><T>Browse the menu</T></Link>}
  </div>;
}
