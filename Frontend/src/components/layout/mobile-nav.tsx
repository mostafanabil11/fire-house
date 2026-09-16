"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ArrowUpRight } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Brand } from "./brand";
import { MobileAccountLinks } from "./mobile-account-links";
import { T, useLanguage } from "@/i18n/language-provider";
import type { Category } from "@/types/category";
export function MobileNav({sections}:{sections:Category[]}) {
 const [open,setOpen]=useState(false);
 const pathname=usePathname();
 const {isArabic,t}=useLanguage();
 const close=()=>setOpen(false);
 return <Sheet open={open} onOpenChange={setOpen}>
   <SheetTrigger render={<button type="button" aria-label={t("Open navigation")} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden" />}><Menu className="size-5" /></SheetTrigger>
   <SheetContent side={isArabic?"right":"left"} showCloseButton={false} className="flex w-[min(90vw,380px)] max-w-none flex-col gap-0 p-0">
     <SheetTitle className="sr-only"><T>Main navigation</T></SheetTitle>
     <SheetDescription className="sr-only"><T>Browse the menu, manage your order, or get help.</T></SheetDescription>
     <div className="flex items-center justify-between border-b p-5"><Brand /><button onClick={close} aria-label={t("Close navigation")} className="grid size-10 place-items-center rounded-full hover:bg-muted"><X className="size-5" /></button></div>
     <nav aria-label={t("Main navigation")} className="flex-1 overflow-y-auto p-5">
       <Link href="/search" onClick={close} className="mb-5 flex min-h-12 items-center gap-3 rounded-xl border bg-muted/40 px-4 text-sm text-muted-foreground"><Search className="size-4" aria-hidden /><T>Search the menu</T></Link>
       {[["/menu","Full menu"],["/cart","Your order"],["/track-order","Track an order"]].map(([href,label])=><Link key={href} href={href} onClick={close} aria-current={pathname===href?"page":undefined} className={`flex min-h-14 items-center justify-between border-b text-lg font-bold ${pathname===href?"text-primary":""}`}><T>{label}</T><ArrowUpRight className="size-4 text-muted-foreground" aria-hidden /></Link>)}
       {sections.map(section=><Link key={section._id} href={`/menu#${section.slug}`} onClick={close} className="block py-3 text-sm"><T>{section.name}</T></Link>)}
       <div className="my-5"><MobileAccountLinks onNavigate={close} /></div>
       <div className="border-t pt-5"><p className="eyebrow mb-2"><T>Here to help</T></p>{[["/contact","Contact us"],["/faq","FAQ"],["/shipping-returns","Delivery information"]].map(([href,label])=><Link key={href} href={href} onClick={close} className="block py-3 text-sm font-semibold text-muted-foreground"><T>{label}</T></Link>)}</div>
     </nav>
   </SheetContent>
 </Sheet>;
}
