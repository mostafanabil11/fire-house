"use client";
import { useState } from "react";
import { validEmail } from "@/lib/checkout-validation";
import { T } from "@/i18n/language-provider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddressFormFields, type AddressFormValues } from "./address-form-fields";

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-foreground";

// The guest delivery step, as one card rather than the separate "Contact" and
// "Delivery" sections the storefront had. A person ordering food is answering
// a single question — where do we bring it and how do we reach you — and
// splitting that across two headed sections made a short form feel long.
//
// Deliberately not a <form> and with no save action: these values go straight
// into the order being placed and nowhere else. Nothing is persisted, so there
// is no account to create and nothing to clean up if checkout is abandoned.
export function DeliveryDetailsSection({
  address,
  onAddressChange,
  email,
  onEmailChange,
  signedInEmail,
  disabled = false,
}: {
  address: AddressFormValues;
  onAddressChange: (next: AddressFormValues) => void;
  email: string;
  onEmailChange: (email: string) => void;
  signedInEmail: string | null;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const [emailTouched, setEmailTouched] = useState(false);

  return (
    <div className="space-y-4">
      <AddressFormFields
        value={address}
        onChange={onAddressChange}
        idPrefix="guest"
        disabled={disabled}
      />

      <div className="border-t border-border pt-4">
        {signedInEmail ? (
          <p className="text-sm">
            <span className="font-bold">Receipt goes to</span>{" "}
            <span className="text-muted-foreground">{signedInEmail}</span>
          </p>
        ) : (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label className="text-sm font-bold" htmlFor="checkout-email">
                Email
              </label>
              {/* Round-trips back to checkout so signing in mid-flow doesn't
                  cost the customer the order they were about to place. */}
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="text-sm font-bold text-primary hover:underline"
              >
                Sign in instead
              </Link>
            </div>
            <input
              id="checkout-email"
              type="email"
              inputMode="email"
              required
              maxLength={200}
              aria-invalid={emailTouched && !validEmail(email)}
              aria-describedby="checkout-email-help"
              onBlur={() => setEmailTouched(true)}
              disabled={disabled}
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={inputClass}
            />
            <p id="checkout-email-help" className={`mt-1.5 text-xs ${emailTouched && !validEmail(email) ? "text-destructive" : "text-muted-foreground"}`}>
              <T>{emailTouched && !validEmail(email) ? "Enter a valid email address." : "Your order confirmation and tracking link are sent here."}</T>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
