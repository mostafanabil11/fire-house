import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getBestSellersServer } from "@/lib/api/products";
import { getCategoryTreeServer } from "@/lib/api/categories";
import { DishCard } from "@/components/menu/dish-card";
import { RESTAURANT } from "@/config/restaurant";

export default async function Home() {
  // Real menu data, not a hardcoded list: prices, availability and links stay
  // correct without anyone remembering to edit this page.
  const [sections, popular] = await Promise.all([getCategoryTreeServer(), getBestSellersServer()]);

  return (
    <div className="pb-16 sm:pb-24">
      <section className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="relative mx-auto min-h-[440px] max-w-7xl overflow-hidden rounded-[2rem] bg-foreground sm:min-h-[520px] lg:min-h-[570px]">
          <Image
            src="/images/restaurant/hero.png"
            alt="A spread of gourmet burgers, crispy fried chicken and loaded fries"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[center_35%] opacity-90 sm:object-center"
          />
          {/* Two gradients, because the text sits in a different place on each
              form factor: bottom-up on a phone, where the copy spans the full
              width, and left-to-right on desktop, where it occupies a column
              and the food should stay visible beside it. */}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,19,17,0.95)_0%,rgba(20,19,17,0.78)_45%,rgba(20,19,17,0.25)_100%)] sm:bg-[linear-gradient(90deg,rgba(20,19,17,0.92)_0%,rgba(20,19,17,0.72)_42%,rgba(20,19,17,0.18)_78%)]" />

          <div className="relative z-10 flex min-h-[440px] max-w-xl flex-col justify-end p-6 text-white sm:min-h-[520px] sm:p-10 lg:min-h-[570px] lg:p-14">
            <div className="mb-auto flex flex-wrap gap-2 pt-1">
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
                Order direct
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
                {RESTAURANT.estimatedDelivery}
              </span>
            </div>
            <p className="mb-3 text-sm font-black tracking-[0.18em] text-[#ff7a5c] uppercase">
              Fresh from our kitchen
            </p>
            <h1 className="font-heading text-[2.75rem] leading-[0.95] font-black tracking-[-0.05em] sm:text-7xl sm:leading-[0.92]">
              Good food.
              <br />
              No detours.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/80 sm:mt-5 sm:text-lg">
              Choose your favourites, customize your meal, and order directly with us.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
              <Link
                href="/menu"
                className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Browse the menu <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/track-order"
                className="inline-flex min-h-13 w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
              >
                Track an order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {sections.length > 0 && (
        <section className="pt-10 sm:pt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="sr-only">Menu sections</h2>
            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Menu sections"
            >
              {sections.map((section) => (
                <Link
                  key={section._id}
                  href={`/menu#${section.slug}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-5 text-sm font-bold transition-colors hover:border-foreground/30"
                >
                  {section.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="pt-8 sm:pt-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-black tracking-[0.16em] text-primary uppercase">
                  Order what you love
                </p>
                <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                  Most ordered
                </h2>
              </div>
              <Link
                href="/menu"
                className="hidden min-h-11 items-center gap-1 text-sm font-black sm:inline-flex"
              >
                See full menu <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {popular.map((dish) => (
                <DishCard key={dish._id} product={dish} />
              ))}
            </div>

            <Link
              href="/menu"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-1 rounded-full border border-foreground text-sm font-black sm:hidden"
            >
              See full menu <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
