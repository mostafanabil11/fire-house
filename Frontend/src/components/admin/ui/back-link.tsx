import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function AdminBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ms-1 mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {children}
    </Link>
  );
}
