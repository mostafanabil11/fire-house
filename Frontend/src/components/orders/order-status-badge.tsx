import { StatusPill, type StatusTone } from "@/components/admin/ui/status-pill";
import type { FulfillmentStatus, PaymentStatus } from "@/types/order";

const FULFILLMENT: Record<FulfillmentStatus, { label: string; tone: StatusTone }> = {
  unfulfilled: { label: "Waiting", tone: "neutral" },
  processing: { label: "Waiting", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "success" },
  shipped: { label: "Shipped", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const PAYMENT: Record<PaymentStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "Payment pending", tone: "neutral" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Payment failed", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export function OrderStatusBadge({
  fulfillmentStatus,
  paymentStatus,
}: {
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
}) {
  const fulfillment = FULFILLMENT[fulfillmentStatus];
  const payment = PAYMENT[paymentStatus];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone={fulfillment.tone}>{fulfillment.label}</StatusPill>
      <StatusPill tone={payment.tone}>{payment.label}</StatusPill>
    </div>
  );
}
