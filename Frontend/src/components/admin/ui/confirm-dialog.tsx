"use client";

import { useRef, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The in-app "are you sure", for the few decisions on the staff screens that
// involve money. Replaces window.confirm, whose small text and OK/Cancel
// buttons say nothing about what is being agreed to.
//
// A centred card from `sm` up; anchored to the bottom of the screen with a
// rounded top on a phone, where the thumb already is.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  tone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          initialFocus={confirmRef}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-card-foreground shadow-2xl transition duration-200 data-ending-style:translate-y-6 data-ending-style:opacity-0 data-starting-style:translate-y-6 data-starting-style:opacity-0 sm:inset-x-auto sm:start-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(28rem,calc(100vw-2rem))] sm:-translate-y-1/2 sm:rounded-3xl sm:p-6 sm:ltr:-translate-x-1/2 sm:rtl:translate-x-1/2 sm:data-ending-style:-translate-y-[45%] sm:data-starting-style:-translate-y-[45%]"
        >
          <Dialog.Title className="font-heading text-xl">{title}</Dialog.Title>
          {children && (
            <Dialog.Description render={<div />} className="mt-3 text-base text-muted-foreground">
              {children}
            </Dialog.Description>
          )}
          <div className="mt-6 grid gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={cn(
                "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold text-white transition disabled:opacity-60",
                tone === "danger" ? "bg-danger-strong hover:brightness-110" : "bg-primary hover:brightness-110",
              )}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </button>
            <Dialog.Close
              disabled={pending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-base font-bold hover:bg-muted disabled:opacity-60"
            >
              {cancelLabel}
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
