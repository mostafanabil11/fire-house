import type { Metadata } from "next";
import { getMenuServer } from "@/lib/api/products";
import { getCategoryTreeServer } from "@/lib/api/categories";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { T } from "@/i18n/language-provider";
import { RESTAURANT } from "@/config/restaurant";
export const metadata: Metadata = { title: `Menu — ${RESTAURANT.name}`, description: "Burgers, crispy chicken, sides and drinks. Customize your meal and order direct." };
export default async function MenuPage() {
  const [categories,dishes] = await Promise.all([getCategoryTreeServer(),getMenuServer()]);
  const sections = categories.map(category=>({id:category.slug,name:category.name,items:dishes.filter(dish=>(typeof dish.category === "string" ? dish.category : dish.category?._id) === category._id)})).filter(section=>section.items.length);
  const placed = new Set(sections.flatMap(section=>section.items.map(item=>item._id)));
  const more = dishes.filter(dish=>!placed.has(dish._id));
  if(more.length) sections.push({id:"more",name:"More",items:more});
  return <div className="page-shell pb-28">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow"><T>Fresh from our kitchen</T></p><h1 className="mt-2 font-heading text-4xl sm:text-5xl"><T>Our menu</T></h1><p className="mt-3 text-sm text-muted-foreground"><T>Your favourites, made your way.</T></p></div>
      <span className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"><T>Estimated delivery</T> · <T>{RESTAURANT.estimatedDelivery}</T></span>
    </div>
    {sections.length ? <MenuBrowser sections={sections} /> : <div className="surface text-center"><h2 className="font-heading text-xl"><T>The menu is not available right now</T></h2><p className="mt-2 text-muted-foreground"><T>Please refresh in a moment.</T></p></div>}
  </div>;
}
