import { OrderDocument } from '@/orders/schemas/order.schema';
import { buildNewOrderAlert, buildCancelledOrderAlert, describeItems } from './order-alert';

const STAFF_URL = 'https://firehouse.example/admin/orders/FH-20260909-0005';

function order(overrides: Partial<OrderDocument> = {}): OrderDocument {
  return {
    orderNumber: 'FH-20260909-0005',
    currency: 'EGP',
    total: 42000,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    paymentReference: null,
    shippingAddress: {
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phone: '01001234567',
      addressLine: '12 Ahmed Fakhry St, flat 9',
      city: 'Nasr City',
      governorate: 'Cairo',
    },
    items: [
      {
        name: 'Classic Beef Burger',
        quantity: 2,
        variant: null,
        modifiers: [{ name: 'Make It a Combo' }],
        note: 'No pickles',
        lineTotal: 42000,
      },
    ],
    ...overrides,
  } as unknown as OrderDocument;
}

describe('describeItems', () => {
  it('spells out the variant, add-ons and note the kitchen has to act on', () => {
    expect(describeItems(order())).toBe(
      '2x Classic Beef Burger (Make It a Combo) — "No pickles"'
    );
  });

  it('includes the variant alongside the add-ons', () => {
    const withVariant = order({
      items: [
        {
          name: 'Fried Chicken Meal',
          quantity: 1,
          variant: { name: 'Large' },
          modifiers: [{ name: 'Extra Crispy' }, { name: 'Garlic Dip' }],
          note: null,
          lineTotal: 20000,
        },
      ],
    } as unknown as Partial<OrderDocument>);

    expect(describeItems(withVariant)).toBe(
      '1x Fried Chicken Meal (Large, Extra Crispy, Garlic Dip)'
    );
  });

  it('stays plain for a dish ordered as-is', () => {
    const plain = order({
      items: [
        { name: 'Coke', quantity: 3, variant: null, modifiers: [], note: null, lineTotal: 4500 },
      ],
    } as unknown as Partial<OrderDocument>);

    expect(describeItems(plain)).toBe('3x Coke');
  });

  it('lists one line per dish', () => {
    const two = order({
      items: [
        { name: 'Coke', quantity: 1, variant: null, modifiers: [], note: null, lineTotal: 1500 },
        { name: 'Fries', quantity: 2, variant: null, modifiers: [], note: null, lineTotal: 6000 },
      ],
    } as unknown as Partial<OrderDocument>);

    expect(describeItems(two).split('\n')).toHaveLength(2);
  });
});

describe('buildNewOrderAlert', () => {
  it('leads with the order number, the customer and how to reach them', () => {
    const { body } = buildNewOrderAlert(order(), STAFF_URL);

    expect(body).toContain('New order FH-20260909-0005');
    expect(body).toContain('Ahmed Hassan · 01001234567');
    expect(body).toContain('12 Ahmed Fakhry St, flat 9, Nasr City, Cairo');
    expect(body).toContain('Total: 420 EGP');
    expect(body).toContain(STAFF_URL);
  });

  it('says plainly whether the money has been taken', () => {
    expect(buildNewOrderAlert(order(), STAFF_URL).body).toContain(
      'Payment: Cash on delivery · not yet paid'
    );
    expect(
      buildNewOrderAlert(order({ paymentMethod: 'card', paymentStatus: 'paid' } as never), STAFF_URL)
        .body
    ).toContain('Payment: Card · PAID');
  });

  it('surfaces the InstaPay reference so staff can match the transfer', () => {
    const instapay = order({
      paymentMethod: 'instapay',
      paymentReference: '4821990011',
    } as never);

    expect(buildNewOrderAlert(instapay, STAFF_URL).body).toContain('InstaPay ref: 4821990011');
  });

  it('omits the reference line for every other method', () => {
    expect(buildNewOrderAlert(order(), STAFF_URL).body).not.toContain('InstaPay ref');
  });

  // WhatsApp rejects a template variable containing a newline, so a message
  // that renders fine as text would fail to send as a template.
  it('keeps every template variable on a single line', () => {
    const { templateVariables } = buildNewOrderAlert(order(), STAFF_URL);

    expect(templateVariables).toHaveLength(5);
    templateVariables.forEach(variable => {
      expect(variable).not.toContain('\n');
      expect(variable.length).toBeGreaterThan(0);
    });
  });

  it('counts items rather than listing them in the template variables', () => {
    const { templateVariables } = buildNewOrderAlert(order(), STAFF_URL);
    expect(templateVariables[2]).toBe('2 items · 420 EGP');
  });

  it('says "1 item" for a single-item order', () => {
    const single = order({
      items: [
        { name: 'Coke', quantity: 1, variant: null, modifiers: [], note: null, lineTotal: 1500 },
      ],
    } as unknown as Partial<OrderDocument>);

    expect(buildNewOrderAlert(single, STAFF_URL).templateVariables[2]).toContain('1 item ·');
  });

  it('falls back to "Customer" when no name was given', () => {
    const anonymous = order({
      shippingAddress: { ...order().shippingAddress, firstName: '', lastName: '' },
    } as never);

    expect(buildNewOrderAlert(anonymous, STAFF_URL).body).toContain('Customer · 01001234567');
  });
});

describe('buildCancelledOrderAlert', () => {
  it('names the order and the customer', () => {
    const { body, templateVariables } = buildCancelledOrderAlert(order(), STAFF_URL);

    expect(body).toContain('Order FH-20260909-0005 was cancelled');
    expect(body).toContain('Ahmed Hassan · 01001234567');
    expect(templateVariables[3]).toBe('Cancelled');
  });
});
