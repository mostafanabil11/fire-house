import Link from "next/link";
import { Flame } from "lucide-react";
import { T } from "@/i18n/language-provider";
import { RESTAURANT } from "@/config/restaurant";

export function Brand() {
  return <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Fire House home">
    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-white"><Flame className="size-6" fill="currentColor" strokeWidth={1.5} aria-hidden /></span>
    <span className="whitespace-nowrap font-heading text-base font-extrabold sm:text-xl"><T>{RESTAURANT.name}</T><span className="block text-[9px] font-semibold tracking-[.2em] uppercase text-muted-foreground"><T>Kitchen & delivery</T></span></span>
  </Link>;
}
