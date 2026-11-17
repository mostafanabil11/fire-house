"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStoreSettingsClient, updateStoreSettings } from "@/lib/api/settings";
import { errorMessage } from "@/lib/api/error-message";
import type { StoreSettings } from "@/types/settings";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { inputClass } from "@/components/admin/ui/field";

const labelClass = "mb-1.5 block text-sm font-bold text-foreground";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getStoreSettingsClient,
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Settings" description="Payment and delivery rules customers see at checkout." />

      {isLoading || !settings ? (
        <div className="h-64 max-w-xl animate-pulse rounded-2xl bg-muted" />
      ) : (
        <AdminSettingsForm key={JSON.stringify(settings)} settings={settings} />
      )}
    </div>
  );
}

function AdminSettingsForm({ settings }: { settings: StoreSettings }) {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState(settings.currency);
  const [taxRatePercent, setTaxRatePercent] = useState(String(settings.taxRateBasisPoints / 100));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(settings.freeShippingThresholdMinorUnits / 100),
  );
  const [flatShippingRate, setFlatShippingRate] = useState(
    String(settings.flatShippingRateMinorUnits / 100),
  );
  const [instapayAddress, setInstapayAddress] = useState(settings.instapayAddress);

  const mutation = useMutation({
    mutationFn: () =>
      updateStoreSettings({
        currency,
        taxRateBasisPoints: Math.round(parseFloat(taxRatePercent || "0") * 100),
        freeShippingThresholdMinorUnits: Math.round(parseFloat(freeShippingThreshold || "0") * 100),
        flatShippingRateMinorUnits: Math.round(parseFloat(flatShippingRate || "0") * 100),
        instapayAddress: instapayAddress.trim(),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      toast.success("Settings updated");
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not update settings")),
  });

  return (
    <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="grid max-w-xl gap-4"
        >
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg">Payment</h2>

            <div className="mt-4">
              <label className={labelClass} htmlFor="instapay">
                InstaPay address
              </label>
              <input
                id="instapay"
                value={instapayAddress}
                onChange={(e) => setInstapayAddress(e.target.value)}
                placeholder="firehouse@instapay"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Your InstaPay handle or wallet number. Customers see it at checkout and transfer to
                it directly. <strong>Leave this empty and InstaPay is not offered at all</strong> —
                so nobody can send money to an address that does not exist.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg">Delivery &amp; pricing</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="flat-rate">
                  Delivery fee ({currency})
                </label>
                <input
                  id="flat-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={flatShippingRate}
                  onChange={(e) => setFlatShippingRate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="free-threshold">
                  Free delivery over ({currency})
                </label>
                <input
                  id="free-threshold"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Orders at or above the threshold get free delivery; below it, the flat fee applies.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="currency">
                  Currency code
                </label>
                <input
                  id="currency"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className={inputClass}
                  maxLength={3}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="tax">
                  Tax / service (%)
                </label>
                <input
                  id="tax"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="action-primary min-h-12 w-full rounded-xl px-8 sm:w-auto sm:justify-self-start"
          >
            {mutation.isPending ? "Saving…" : "Save settings"}
          </button>
    </form>
  );
}
