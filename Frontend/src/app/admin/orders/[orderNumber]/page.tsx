"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, MapPin, Phone, SearchX } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/social-icons";
import { getAdminOrder, updateOrderStatus } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { paymentInstruction, paymentMethodLabel } from "@/lib/payment-label";
import { whatsAppLink, telLink, mapsLink } from "@/lib/contact-links";
import { orderConfirmationMessage } from "@/lib/order-confirmation-message";
import { addressText } from "@/lib/address-text";
import { canConfirm, clockTime, customerName, formatAge, staffOrderState } from "@/lib/staff-orders";
import { ConfirmOrderButton } from "@/components/admin/confirm-order-button";
import { ContactButtons } from "@/components/admin/order-ticket";
import { OrderItemLines } from "@/components/admin/order-item-lines";
import { Panel } from "@/components/admin/ui/panel";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useLanguage, T } from "@/i18n/language-provider";
import { RESTAURANT } from "@/config/restaurant";

function BackLink() {
  return (
    <Link
      href="/admin/orders"
      className="-ms-1 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      All orders
    </Link>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const queryClient = useQueryClient();
  const { isArabic, t } = useLanguage();
  const [confirmingRefund, setConfirmingRefund] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders", params.orderNumber],
    queryFn: () => getAdminOrder(params.orderNumber),
    // Someone else on the team may be working the same order from their own
    // phone; this screen should not show a stale one.
    refetchInterval: 20_000,
    retry: false,
  });

  const refund = useMutation({
    mutationFn: () => updateOrderStatus(params.orderNumber, { paymentStatus: "refunded" }),
    onSuccess: () => {
      toast.success(t("Order updated"));
      setConfirmingRefund(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(t(message ?? "Could not update order"));
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="h-11 w-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="grid gap-4">
        <BackLink />
        <EmptyState
          icon={<SearchX aria-hidden />}
          title="We couldn't find that order"
          description="Check the order number, or search for it on the orders screen."
          action={
            <Link href="/admin/orders" className="action-primary">
              Back to orders
            </Link>
          }
        />
      </div>
    );
  }

  const name = customerName(order);
  const phone = order.shippingAddress.phone;
  // Built here rather than on click so the link is a plain anchor: the screen
  // re-reads the order every 20 seconds, which keeps the arrival window fresh.
  const message = orderConfirmationMessage(order, {
    restaurantName: RESTAURANT.name,
    locale: isArabic ? "ar-EG" : "en-US",
    t,
  });
  const chat = whatsAppLink(phone, message);
  const call = telLink(phone);
  const address = addressText(order.shippingAddress);
  const email = order.user?.email ?? order.guestEmail ?? null;
  const confirmable = canConfirm(order);
  const state = staffOrderState(order);
  const payment = paymentInstruction(order);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const nextStep = confirmable ? (
    <ConfirmOrderButton order={order} />
  ) : (
    <p className="text-base text-muted-foreground">
      {order.fulfillmentStatus === "cancelled"
        ? "This order was cancelled."
        : ["unfulfilled", "processing"].includes(order.fulfillmentStatus)
          ? "Waiting on the customer's card payment."
          : "This order is confirmed."}
    </p>
  );

  return (
    <div className={confirmable ? "pb-24 lg:pb-0" : undefined}>
      <BackLink />

      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl" data-i18n-ignore>
            {order.orderNumber}
          </h1>
          <StatusPill
            tone={state.tone}
            icon={state.tone === "danger-solid" ? <AlertTriangle aria-hidden /> : undefined}
            className="px-3 py-1.5 text-sm"
          >
            {state.label}
          </StatusPill>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {`Placed ${clockTime(order.createdAt)}`}
          <span aria-hidden> · </span>
          {formatAge(order.createdAt)}
        </p>
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title={`${itemCount} ${itemCount === 1 ? "item" : "items"}`}>
          <OrderItemLines items={order.items} showPrices />

          <dl className="mt-5 grid gap-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums"><T>{formatPrice(order.subtotal)}</T></dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {order.shippingCost === 0 ? "Free" : <T>{formatPrice(order.shippingCost)}</T>}
              </dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
                </dt>
                <dd className="tabular-nums">
                  −<T>{formatPrice(order.discountAmount)}</T>
                </dd>
              </div>
            )}
            <div className="mt-1 flex justify-between gap-4 border-t border-border pt-2.5 text-lg font-extrabold">
              <dt>Total</dt>
              <dd className="tabular-nums"><T>{formatPrice(order.total)}</T></dd>
            </div>
          </dl>
        </Panel>

        <div className="grid gap-4 lg:sticky lg:top-6">
          <Panel className={confirmable ? "hidden lg:block" : undefined}>{nextStep}</Panel>

          <Panel title="Customer">
            <p className="text-base font-bold break-words" data-i18n-ignore>
              {name}
            </p>
            <p
              dir="ltr"
              data-i18n-ignore
              className="mt-1 text-start text-lg font-bold tracking-wide break-all tabular-nums"
            >
              {phone}
            </p>
            {call || chat ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {call && (
                  <a href={call} className="action-secondary min-h-12 rounded-xl px-3">
                    <Phone className="size-4" aria-hidden />
                    Call
                  </a>
                )}
                {chat && (
                  <a
                    href={chat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-extrabold text-white transition hover:brightness-105"
                  >
                    <WhatsAppIcon className="size-5" aria-hidden />
                    WhatsApp
                  </a>
                )}
              </div>
            ) : null}
            {!call && (
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                Not a valid number — dial it by hand
              </p>
            )}
            {email && (
              <p className="mt-3 text-sm break-all text-muted-foreground" data-i18n-ignore>
                {email}
              </p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <p className="flex items-start gap-2 text-base">
                <MapPin className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span data-i18n-ignore className="min-w-0 break-words">
                  {address}
                </span>
              </p>
              <a
                href={mapsLink([address])}
                target="_blank"
                rel="noopener noreferrer"
                className="action-secondary mt-3 min-h-11 w-full rounded-xl"
              >
                Open in Maps
              </a>
            </div>
          </Panel>

          <Panel title="Payment">
            <StatusPill tone={payment.tone} className="px-3 py-1.5 text-sm">
              {payment.label}
            </StatusPill>
            <dl className="mt-3 grid gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-semibold">{paymentMethodLabel(order.paymentMethod)}</dd>
              </div>
              {order.paymentReference && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">InstaPay reference</dt>
                  <dd dir="ltr" data-i18n-ignore className="font-bold">
                    {order.paymentReference}
                  </dd>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tracking</dt>
                  <dd data-i18n-ignore className="font-semibold">
                    {order.trackingNumber}
                  </dd>
                </div>
              )}
            </dl>
            {order.paymentStatus === "paid" && (
              <div className="mt-4 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmingRefund(true)}
                  className="inline-flex min-h-11 items-center text-sm font-bold text-danger-strong hover:underline"
                >
                  Mark as refunded
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* On phones and tablets the one action stays in reach, above the tabs. */}
      {confirmable && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <ContactButtons phone={phone} name={name} message={message} />
            <ConfirmOrderButton order={order} className="flex-1" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingRefund}
        onOpenChange={setConfirmingRefund}
        title="Mark this order as refunded?"
        confirmLabel="Mark as refunded"
        cancelLabel="Keep as paid"
        tone="danger"
        pending={refund.isPending}
        onConfirm={() => refund.mutate()}
      >
        This only records the status — send the money back through Paymob or InstaPay separately.
      </ConfirmDialog>
    </div>
  );
}
