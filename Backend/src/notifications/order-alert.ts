import { OrderDocument } from '@/orders/schemas/order.schema';

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on delivery',
  instapay: 'InstaPay',
  card: 'Card',
};

function money(minorUnits: number, currency: string): string {
  return `${Math.round(minorUnits / 100)} ${currency}`;
}

/**
 * One line per dish, including what the customer changed about it. The
 * variant and add-ons are the difference between a burger the kitchen makes
 * correctly and one that comes back, so they belong in the alert rather than
 * only in the dashboard.
 */
export function describeItems(order: OrderDocument): string {
  return order.items
    .map(item => {
      const details = [
        ...(item.variant?.name ? [item.variant.name] : []),
        ...item.modifiers.map(modifier => modifier.name),
      ];
      const suffix = details.length > 0 ? ` (${details.join(', ')})` : '';
      const note = item.note ? ` — "${item.note}"` : '';
      return `${item.quantity}x ${item.name}${suffix}${note}`;
    })
    .join('\n');
}

export interface OrderAlert {
  body: string;
  /** Positional variables for the approved WhatsApp template, in order. */
  templateVariables: string[];
}

/**
 * Builds the alert the restaurant's team receives on their phones.
 *
 * Deliberately short and scannable: the team reads this standing in a
 * kitchen, and the message exists to get them into the dashboard, not to
 * replace it. WhatsApp templates cannot contain newlines inside a variable,
 * so each variable stays a single line and the template supplies the layout.
 */
export function buildNewOrderAlert(order: OrderDocument, staffOrderUrl: string): OrderAlert {
  const customer =
    `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim() || 'Customer';
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const payment = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const paymentLine =
    order.paymentStatus === 'paid' ? `${payment} · PAID` : `${payment} · not yet paid`;

  const summary = `${itemCount} item${itemCount === 1 ? '' : 's'} · ${money(order.total, order.currency)}`;
  const address = [
    order.shippingAddress.addressLine,
    order.shippingAddress.city,
    order.shippingAddress.governorate,
  ]
    .filter(Boolean)
    .join(', ');

  const body = [
    `New order ${order.orderNumber}`,
    '',
    `${customer} · ${order.shippingAddress.phone}`,
    address,
    '',
    describeItems(order),
    '',
    `Total: ${money(order.total, order.currency)}`,
    `Payment: ${paymentLine}`,
    ...(order.paymentReference ? [`InstaPay ref: ${order.paymentReference}`] : []),
    '',
    `Open: ${staffOrderUrl}`,
  ].join('\n');

  return {
    body,
    // Kept to five single-line variables so one approved template can carry
    // every order. Adding a variable later means getting the template
    // re-approved, so the item list is collapsed into a count rather than
    // expanded per dish.
    templateVariables: [
      order.orderNumber,
      `${customer} (${order.shippingAddress.phone})`,
      summary,
      paymentLine,
      staffOrderUrl,
    ],
  };
}

export function buildCancelledOrderAlert(
  order: OrderDocument,
  staffOrderUrl: string
): OrderAlert {
  const customer =
    `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim() || 'Customer';
  const summary = `Cancelled · ${money(order.total, order.currency)}`;

  return {
    body: [
      `Order ${order.orderNumber} was cancelled`,
      '',
      `${customer} · ${order.shippingAddress.phone}`,
      `Total was ${money(order.total, order.currency)}`,
      '',
      `Open: ${staffOrderUrl}`,
    ].join('\n'),
    templateVariables: [
      order.orderNumber,
      `${customer} (${order.shippingAddress.phone})`,
      summary,
      'Cancelled',
      staffOrderUrl,
    ],
  };
}
