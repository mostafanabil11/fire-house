"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { getCustomers } from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", page, q],
    queryFn: () => getCustomers({ page, limit: 20, q: q.trim() || undefined }),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Customers"
        description="People with an account. Guests who ordered without one are on their orders."
      />

      <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 sm:max-w-md">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
          aria-label="Search customers"
          className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none"
        />
      </label>

      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Users aria-hidden />} title="No customers found." />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {data.items.map((customer) => (
              <li
                key={customer._id}
                className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold" data-i18n-ignore>
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm break-all text-muted-foreground" data-i18n-ignore>
                    {customer.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customer.role === "admin" && <StatusPill tone="danger-solid" className="bg-foreground">Admin</StatusPill>}
                  <StatusPill>{customer.authProvider === "google" ? "Google" : "Email"}</StatusPill>
                  {!customer.isEmailVerified && <StatusPill tone="warning">Unverified</StatusPill>}
                </div>
              </li>
            ))}
          </ul>

          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
