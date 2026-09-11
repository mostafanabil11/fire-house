"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, Check, Copy, CreditCard, Lock, Smartphone } from "lucide-react";
import { VisaMark, MastercardMark, MeezaMark } from "./card-marks";

// Countdown starts turning red once this many seconds remain, to give the
// customer visible warning before the session dies mid-entry.
const COUNTDOWN_WARN_AT = 60;

export type PaymentMethodType = "cod" | "instapay" | "card";

interface PaymentSectionProps {
  selected: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  instapayAddress: string;
  paymentReference: string;
  onPaymentReferenceChange: (reference: string) => void;
  total: number | null;
  formatAmount: (minorUnits: number) => string;
  iframeUrl: string | null;
  expiresAt: string | null;
  onExpire: () => void;
  disabled?: boolean;
}

function useCountdown(expiresAt: string | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState<number | null>(null);
  // Kept in a ref so the interval below doesn't need onExpire in its deps —
  // otherwise a new inline callback each render would restart the timer.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        onExpireRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard access can be refused (insecure context, permission
          // denied). The address is on screen either way, so this stays a
          // convenience rather than the only way to get it.
        }
      }}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-black text-background"
    >
      {copied ? (
        <>
          <Check className="size-4" strokeWidth={2.5} aria-hidden /> Copied
        </>
      ) : (
        <>
          <Copy className="size-4" strokeWidth={2.5} aria-hidden /> Copy
        </>
      )}
    </button>
  );
}

export function PaymentSection({
  selected,
  onSelect,
  instapayAddress,
  paymentReference,
  onPaymentReferenceChange,
  total,
  formatAmount,
  iframeUrl,
  expiresAt,
  onExpire,
  disabled,
}: PaymentSectionProps) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const remaining = useCountdown(expiresAt, onExpire);

  useEffect(() => {
    setFrameLoaded(false);
  }, [iframeUrl]);

  // Cash first, then InstaPay: between them they are how almost every order
  // is actually paid for. Card is offered last and only matters to the few
  // customers who want it.
  const options: {
    value: PaymentMethodType;
    label: string;
    hint: string;
    icon: typeof Banknote;
  }[] = [
    {
      value: "cod",
      label: "Cash on delivery",
      hint: "Pay the rider when your food arrives",
      icon: Banknote,
    },
    // Hidden entirely when the restaurant has not published an InstaPay
    // address — offering it would send the customer's money nowhere.
    ...(instapayAddress
      ? [
          {
            value: "instapay" as const,
            label: "InstaPay",
            hint: "Transfer now from your banking app",
            icon: Smartphone,
          },
        ]
      : []),
    {
      value: "card",
      label: "Pay by card",
      hint: "Secure payment, handled by Paymob",
      icon: CreditCard,
    },
  ];

  return (
    <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5">
      {options.map((option) => {
        const isSelected = selected === option.value;
        const Icon = option.icon;
        return (
          <div key={option.value}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
              className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-foreground bg-foreground/[0.04] ring-2 ring-foreground/15"
                  : "border-border bg-background hover:border-foreground/30"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-11 shrink-0 place-items-center rounded-full ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-black">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>

              {option.value === "card" && (
                <span className="hidden shrink-0 items-center gap-1 sm:flex">
                  <MastercardMark className="h-[22px] w-[34px] rounded-[3px] border border-border/50 bg-white" />
                  <VisaMark className="h-[22px] w-[34px] rounded-[3px] border border-border/50 bg-white" />
                  <MeezaMark className="h-[22px] w-[34px] rounded-[3px] border border-border/50 bg-white" />
                </span>
              )}

              <span
                aria-hidden
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  isSelected ? "border-foreground" : "border-border"
                }`}
              >
                {isSelected && <span className="size-2.5 rounded-full bg-foreground" />}
              </span>
            </button>

            {isSelected && option.value === "instapay" && (
              <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-4">
                <ol className="space-y-3 text-sm">
                  <li>
                    <span className="font-bold">1. Send</span>{" "}
                    {total === null ? "the order total" : <strong>{formatAmount(total)}</strong>} to
                    this InstaPay address:
                    <span className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                      <code className="min-w-0 flex-1 font-mono text-[15px] font-bold break-all">
                        {instapayAddress}
                      </code>
                      <CopyButton value={instapayAddress} />
                    </span>
                  </li>
                  <li>
                    <label htmlFor="instapay-reference" className="font-bold">
                      2. Enter the reference your bank gave you
                    </label>
                    <input
                      id="instapay-reference"
                      required
                      disabled={disabled}
                      value={paymentReference}
                      onChange={(e) => onPaymentReferenceChange(e.target.value)}
                      placeholder="e.g. 4821XXXXXX"
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-foreground"
                    />
                  </li>
                  <li>
                    <span className="font-bold">3. Place your order.</span>{" "}
                    <span className="text-muted-foreground">
                      We start cooking as soon as we confirm the transfer, usually within a few
                      minutes.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {isSelected && option.value === "card" && iframeUrl && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background">
                <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Lock className="size-3.5" strokeWidth={2} />
                    Secure card payment
                  </span>
                  {remaining !== null && (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        remaining <= COUNTDOWN_WARN_AT ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      Expires in {formatCountdown(remaining)}
                    </span>
                  )}
                </div>

                <div className="relative">
                  {!frameLoaded && (
                    <div className="absolute inset-0 z-10 flex flex-col justify-center gap-3 bg-background px-5">
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-10 w-full animate-pulse rounded bg-muted" />
                      <div className="flex gap-3">
                        <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
                        <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  )}
                  <iframe
                    key={iframeUrl}
                    src={iframeUrl}
                    title="Secure card payment"
                    onLoad={() => setFrameLoaded(true)}
                    className="block h-[380px] w-full border-0"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
                  />
                </div>

                <p className="border-t border-border bg-muted/60 px-4 py-2 text-[11px] text-muted-foreground">
                  Processed securely by Paymob. We never see or store your card details.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
