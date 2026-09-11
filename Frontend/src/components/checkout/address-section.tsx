"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { createAddress } from "@/lib/api/addresses";
import { addressText } from "@/lib/address-text";
import type { Address } from "@/types/address";
import { AddressFormFields, EMPTY_ADDRESS_FORM, type AddressFormValues } from "./address-form-fields";

// The signed-in delivery step: pick a saved address, or add one to the book.
// Guests get DeliveryDetailsSection instead — same fields, but nowhere to
// save them to.
export function AddressSection({
  addresses,
  selectedId,
  onSelect,
}: {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (address) => {
      queryClient.setQueryData<Address[]>(["addresses"], (prev) => [...(prev ?? []), address]);
      onSelect(address._id);
      setShowForm(false);
      setForm(EMPTY_ADDRESS_FORM);
      toast.success("Address added");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not save address";
      toast.error(message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      addressLine: form.addressLine,
      isDefault: addresses.length === 0,
    });
  }

  return (
    <div>
      {addresses.length > 0 && (
        <div role="radiogroup" aria-label="Saved addresses" className="grid gap-2.5">
          {addresses.map((address) => {
            const isSelected = selectedId === address._id;
            return (
              <button
                key={address._id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(address._id)}
                className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-foreground bg-foreground/[0.04] ring-2 ring-foreground/15"
                    : "border-border bg-background hover:border-foreground/30"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <MapPin className="size-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-black">
                      {address.firstName} {address.lastName}
                    </span>
                    {address.isDefault && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-black tracking-wide text-muted-foreground uppercase">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {addressText(address)}
                  </span>
                  <span className="block text-sm text-muted-foreground">{address.phone}</span>
                </span>
              </button>
            );
          })}

          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-bold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Deliver somewhere else
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`space-y-4 ${addresses.length > 0 ? "mt-5 border-t border-border pt-5" : ""}`}
        >
          <AddressFormFields
            value={form}
            onChange={setForm}
            idPrefix="saved"
            disabled={createMutation.isPending}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-black text-primary-foreground transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving…" : "Save address"}
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex min-h-12 items-center px-4 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
