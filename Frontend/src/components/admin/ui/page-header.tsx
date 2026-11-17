import type { ReactNode } from "react";

// The top of every staff screen: a title, an optional line saying what the
// screen is for, and the screen's own actions at the end of the row. On a
// phone the actions wrap under the title rather than squeezing it.
export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
