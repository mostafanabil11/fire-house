"use client";
import { useDeferredValue, useState } from "react";
import { Search, X } from "lucide-react";
import { DishCard } from "./dish-card";
import { MenuSectionNav } from "./menu-section-nav";
import { T, useLanguage } from "@/i18n/language-provider";
import type { Product } from "@/types/product";

export interface MenuSection { id: string; name: string; items: Product[] }
export function MenuBrowser({ sections }: { sections: MenuSection[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const search = useDeferredValue(query.trim().toLocaleLowerCase());
  const { t } = useLanguage();
  const visible = sections.map(section => ({ ...section, items: section.items.filter(item =>
    (!search || [item.name, item.description ?? "", t(item.name), t(item.description ?? "")].some(text => text.toLocaleLowerCase().includes(search))) &&
    (filter === "all" || (filter === "popular" ? item.isBestSeller : item.dietaryTags.includes(filter)))
  )})).filter(section => section.items.length);
  const tags = Array.from(new Set(sections.flatMap(section => section.items.flatMap(item => item.dietaryTags))));
  return <div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex flex-1 items-center gap-3 rounded-2xl border bg-card px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input className="min-h-12 w-full border-0 bg-transparent py-3 text-base outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search burgers, fries, drinks…")} aria-label={t("Search the menu")} />
        {query && <button onClick={()=>setQuery("")} aria-label={t("Clear search")} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>}
      </div>
      <select className="form-field min-h-12 sm:max-w-[190px]" value={filter} onChange={e=>setFilter(e.target.value)} aria-label={t("Filter menu")}>
        <option value="all">{t("All dishes")}</option><option value="popular">{t("Most ordered")}</option>
        {tags.map(tag=><option key={tag} value={tag}>{t(tag.replace(/_/g," ").replace(/^./, c=>c.toUpperCase()))}</option>)}
      </select>
    </div>
    <MenuSectionNav sections={visible.map(section=>({id:section.id,name:section.name,count:section.items.length}))} />
    <p role="status" className="sr-only">{visible.reduce((count,section)=>count+section.items.length,0)} <T>dishes</T></p>
    {visible.length === 0 && <div className="surface my-8 text-center"><h2 className="font-heading text-xl"><T>No dishes found</T></h2><p className="mt-2 text-sm text-muted-foreground"><T>Try another search or clear your filters.</T></p><button className="action-secondary mt-5" onClick={()=>{setQuery("");setFilter("all");}}><T>Clear filters</T></button></div>}
    {visible.map(section=><section key={section.id} className="pt-7 sm:pt-9" aria-labelledby={section.id}>
      <div className="mb-4 flex items-baseline gap-3"><h2 id={section.id} className="scroll-mt-[calc(var(--header-height)+90px)] font-heading text-2xl sm:text-3xl"><T>{section.name}</T></h2><span className="text-xs font-semibold text-muted-foreground">{section.items.length} <T>dishes</T></span></div>
      <div className="grid gap-3 md:grid-cols-2">{section.items.map(item=><DishCard key={item._id} product={item} />)}</div>
    </section>)}
  </div>;
}
