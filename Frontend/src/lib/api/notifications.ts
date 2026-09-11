import { apiClient } from "./client";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";
export type NotificationDeliveryStatus = "sent" | "delivered" | "read" | "failed" | null;

export interface NotificationEntry {
  _id: string;
  event: "order.new" | "order.cancelled";
  orderNumber: string;
  recipient: string;
  status: NotificationStatus;
  body: string;
  attempts: number;
  providerMessageId: string | null;
  deliveryStatus: NotificationDeliveryStatus;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationHealth {
  entries: NotificationEntry[];
  whatsappConfigured: boolean;
  recipients: string[];
  usingTemplate: boolean;
}

interface Envelope {
  success: boolean;
  message: string;
  data: NotificationEntry[];
  meta: { whatsappConfigured: boolean; recipients: string[]; usingTemplate: boolean };
}

export async function getNotifications(limit = 50): Promise<NotificationHealth> {
  const res = await apiClient.get<Envelope>("/notifications", { params: { limit } });
  return { entries: res.data.data, ...res.data.meta };
}

export async function retryNotification(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/retry`);
}
