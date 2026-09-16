import { Bike, Check, ChefHat, PackageCheck, ReceiptText } from "lucide-react";
import type { ComponentType } from "react";
import { orderSteps, type OrderStage } from "@/lib/order-progress";
import type { FulfillmentStatus } from "@/types/order";

const STAGE_ICON: Record<OrderStage, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  placed: ReceiptText,
  kitchen: ChefHat,
  delivery: Bike,
  delivered: PackageCheck,
};

/**
 * The order's journey as four steps. A food order is short and the customer is
 * usually still holding the phone, so this answers "is anything happening?"
 * without them having to go and look the order up.
 *
 * The steps run down the screen on a phone and across it from `sm`, which is
 * why each one carries two connector rails: only one is ever displayed.
 */
export function OrderProgress({ status }: { status: FulfillmentStatus }) {
  const steps = orderSteps(status);
  if (steps.length === 0) return null;

  return (
    <ol className="grid gap-5 sm:grid-cols-4 sm:gap-3">
      {steps.map((step, index) => {
        const Icon = STAGE_ICON[step.key];
        // The rail belongs to the step it leads *into*, and is filled when
        // that step has been reached — so the coloured run always ends at the
        // circle the order has actually got to.
        const reached = step.state !== "upcoming";

        return (
          <li
            key={step.key}
            className="relative flex items-start gap-3.5 sm:block sm:text-center"
          >
            {index > 0 && (
              <>
                {/* Horizontal rail, sm and up: from the previous circle's
                    centre to this one's. Both run behind the circles, which
                    are opaque, so the overlap never shows. */}
                <span
                  aria-hidden
                  className={`absolute top-5 hidden h-0.5 sm:block ${reached ? "bg-primary" : "bg-border"}`}
                  style={{ insetInlineEnd: "50%", insetInlineStart: "calc(-50% - 0.75rem)" }}
                />
                {/* Vertical rail, phone: the circles are 2.5rem tall and the
                    rows are 1.25rem apart, so this spans the gap above. */}
                <span
                  aria-hidden
                  className={`absolute start-5 w-0.5 sm:hidden ${
                    reached ? "bg-primary" : "bg-border"
                  }`}
                  style={{ top: "-1.25rem", height: "1.25rem" }}
                />
              </>
            )}

            <span
              className={`relative z-1 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors sm:mx-auto ${
                step.state === "done"
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.state === "current"
                    ? "border-primary bg-card text-primary"
                    : "border-border bg-card text-muted-foreground"
              }`}
            >
              {step.state === "done" ? (
                <Check className="size-5" strokeWidth={3} />
              ) : (
                <Icon className="size-5" strokeWidth={2.25} />
              )}
              {step.state === "current" && (
                <span
                  aria-hidden
                  className="absolute -inset-0.5 animate-ping rounded-full border-2 border-primary opacity-60"
                />
              )}
            </span>

            <div className="min-w-0 sm:mt-3">
              <p
                className={`text-sm font-black tracking-tight ${
                  reached ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              {step.state === "current" && (
                <p className="mt-1 text-xs text-muted-foreground">{step.hint}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
