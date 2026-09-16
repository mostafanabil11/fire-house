"use client";
import { useEffect, useRef, useState } from "react";
import { T, useLanguage } from "@/i18n/language-provider";
interface Section { id:string; name:string; count:number }
export function MenuSectionNav({sections}:{sections:Section[]}) {
  const [activeId,setActiveId] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const {t} = useLanguage();
  const ids = sections.map(section=>section.id).join("|");
  useEffect(()=>{
    const headings = ids.split("|").map(id=>document.getElementById(id)).filter((element):element is HTMLElement=>!!element);
    let frame = 0;
    function update() {
      const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
      const current = headings.filter(heading=>heading.getBoundingClientRect().top <= headerHeight + 125).at(-1) ?? headings[0];
      if(current) setActiveId(current.id);
    }
    function onScroll() { cancelAnimationFrame(frame); frame=requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll);
    return ()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);cancelAnimationFrame(frame);};
  },[ids]);
  useEffect(()=>{
    const active=navRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if(active && navRef.current) {
      const nav=navRef.current.getBoundingClientRect(), rect=active.getBoundingClientRect();
      if(rect.left<nav.left || rect.right>nav.right) navRef.current.scrollBy({left:rect.left-nav.left-(nav.width-rect.width)/2,behavior:"instant"});
    }
  },[activeId]);
  if(!sections.length) return null;
  return <div className="sticky top-[var(--header-height)] z-30 -mx-4 border-y border-border/70 bg-background/95 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
    <nav ref={navRef} aria-label={t("Menu sections")} className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sections.map(section=><a key={section.id} href={`#${section.id}`} onClick={()=>setActiveId(section.id)} aria-current={activeId===section.id ? "true" : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-bold transition-colors sm:text-sm ${activeId===section.id ? "bg-foreground text-background" : "border border-border bg-card hover:border-foreground/30"}`}><T>{section.name}</T><span className="opacity-60">{section.count}</span></a>)}
    </nav>
  </div>;
}
