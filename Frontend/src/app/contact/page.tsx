import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Clock3, ReceiptText, CircleHelp, Bike } from "lucide-react";
import { RESTAURANT } from "@/config/restaurant";
import { T } from "@/i18n/language-provider";
export const metadata:Metadata={title:`Contact — ${RESTAURANT.name}`,description:"Help with your restaurant order, delivery and menu."};
export default function ContactPage() {
 return <div className="page-shell">
   <div className="max-w-xl"><p className="eyebrow"><T>Here to help</T></p><h1 className="mt-3 font-heading text-4xl sm:text-5xl"><T>How can we help?</T></h1><p className="mt-4 text-base leading-7 text-muted-foreground"><T>Find your order, explore delivery information, or get answers before your next meal.</T></p></div>
   <div className="mt-9 grid gap-4 md:grid-cols-3">{[
    {href:"/track-order",icon:ReceiptText,title:"An update on your order",copy:"Have your order number and checkout email ready.",action:"Track order"},
    {href:"/shipping-returns",icon:Bike,title:"Delivery information",copy:"Understand delivery fees, timing and order changes.",action:"About delivery"},
    {href:"/faq",icon:CircleHelp,title:"A quick answer",copy:"Payments, customizations and other common questions.",action:"Read the FAQ"}
   ].map(({href,icon:Icon,title,copy,action})=><Link key={href} href={href} className="surface group flex flex-col transition-shadow hover:shadow-md"><span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span><h2 className="mt-6 font-heading text-xl"><T>{title}</T></h2><p className="mt-3 text-sm leading-7 text-muted-foreground"><T>{copy}</T></p><span className="mt-6 flex items-center gap-2 text-sm font-bold text-primary"><T>{action}</T><ArrowUpRight className="size-4" aria-hidden /></span></Link>)}</div>
   {(RESTAURANT.phone || RESTAURANT.email || RESTAURANT.address || RESTAURANT.hours) && <section className="surface mt-8"><h2 className="font-heading text-2xl"><T>Contact the restaurant</T></h2><div className="mt-5 grid gap-5 sm:grid-cols-2">
     {RESTAURANT.phone && <a href={`tel:${RESTAURANT.phone.replace(/[^+\d]/g,"")}`} className="flex items-center gap-3 text-sm"><Phone className="size-5 text-primary" /><bdi>{RESTAURANT.phone}</bdi></a>}
     {RESTAURANT.email && <a href={`mailto:${RESTAURANT.email}`} className="flex items-center gap-3 break-all text-sm"><Mail className="size-5 shrink-0 text-primary" />{RESTAURANT.email}</a>}
     {RESTAURANT.address && <p className="flex items-start gap-3 text-sm"><MapPin className="size-5 shrink-0 text-primary" /><T>{RESTAURANT.address}</T></p>}
     {RESTAURANT.hours && <p className="flex items-start gap-3 text-sm"><Clock3 className="size-5 shrink-0 text-primary" /><T>{RESTAURANT.hours}</T></p>}
   </div></section>}
 </div>;
}
