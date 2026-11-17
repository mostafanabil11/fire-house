"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { getAuditLog } from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", page],
    queryFn: () => getAuditLog({ page, limit: 50 }),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Audit log" description="Every change made from this dashboard, newest first." />

      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<ScrollText aria-hidden />} title="No admin actions recorded yet." />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {data.items.map((entry) => (
              <li key={entry._id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold" data-i18n-ignore>
                    {entry.action}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground" data-i18n-ignore>
                  {entry.adminEmail ?? "Unknown admin"}
                  {entry.resultSummary?.id && ` · ${entry.resultSummary.id}`}
                </p>
              </li>
            ))}
          </ul>

          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
