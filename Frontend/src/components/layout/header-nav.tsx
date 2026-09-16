"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useLanguage } from "@/i18n/language-provider";
export function HeaderNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return <nav aria-label={t("Primary navigation")} className="ms-auto hidden items-center gap-6 text-sm font-bold md:flex">
    {[['/menu','Menu'],['/track-order','Track order'],['/contact','Contact']].map(([href,label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined} className={`py-3 transition-colors hover:text-primary ${pathname.startsWith(href) ? 'text-primary' : ''}`}>{t(label)}</Link>)}
    <Link href="/search" aria-label={t("Search the menu")} className="grid size-11 place-items-center rounded-full hover:bg-muted"><Search className="size-5" /></Link>
    <AccountMenu />
  </nav>;
}
