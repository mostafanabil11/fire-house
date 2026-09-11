"use client";

export interface AddressFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  addressLine: "",
};

// text-base, not a smaller size: iOS Safari zooms the whole page in when a
// focused input's text is under 16px, which on a checkout form throws the
// layout sideways on every single tap.
const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-foreground";
const labelClass = "mb-1.5 block text-sm font-bold text-foreground";

// The delivery fields themselves, with no opinion about what happens to them.
// Shared by the signed-in "add a new address" form (which POSTs them to the
// address book) and the guest checkout form (which just hands them to the
// order) — so the two can never drift into asking for different things.
//
// Ordered the way a delivery is actually dispatched: how to reach you, then
// who you are, then where to go. The phone comes first because it is the one
// field the kitchen will use if anything about the order is unclear. The
// address is one free-text field — the restaurant delivers locally, so area,
// governorate and postal code only slowed people down.
//
// idPrefix keeps the label/input wiring unique when more than one instance is
// on the page.
export function AddressFormFields({
  value,
  onChange,
  idPrefix = "addr",
  disabled = false,
}: {
  value: AddressFormValues;
  onChange: (next: AddressFormValues) => void;
  idPrefix?: string;
  disabled?: boolean;
}) {
  function set<K extends keyof AddressFormValues>(key: K, v: AddressFormValues[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-phone`}>
          Mobile number
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          required
          disabled={disabled}
          autoComplete="tel"
          placeholder="01xxxxxxxxx"
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          The rider calls this number when they arrive.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-firstName`}>
            First name
          </label>
          <input
            id={`${idPrefix}-firstName`}
            required
            disabled={disabled}
            autoComplete="given-name"
            value={value.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-lastName`}>
            Last name
          </label>
          <input
            id={`${idPrefix}-lastName`}
            required
            disabled={disabled}
            autoComplete="family-name"
            value={value.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-addressLine`}>
          Address
        </label>
        <textarea
          id={`${idPrefix}-addressLine`}
          required
          disabled={disabled}
          autoComplete="street-address"
          rows={2}
          placeholder="Street, building, floor, flat and a landmark"
          value={value.addressLine}
          onChange={(e) => set("addressLine", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>
    </>
  );
}
