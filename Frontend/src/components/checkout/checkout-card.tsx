import type { ReactNode } from "react";

// Every checkout step is one of these: a titled card in a single column. The
// storefront this grew out of used a wide two-column form with section rules,
// which reads as paperwork on a phone. A short stack of cards is what food
// ordering apps use, and it survives being scrolled with one thumb.
export function CheckoutCard({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[1.5rem] border border-border bg-card p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-heading text-lg font-black tracking-tight">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
