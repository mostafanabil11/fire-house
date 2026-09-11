import { checkoutSchema } from './checkout.dto';

const guestOrder = {
  email: 'customer@example.com',
  shippingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    phone: '01000000000',
    addressLine: '12 Test Street',
    city: 'Nasr City',
    governorate: 'Cairo',
  },
  items: [{ productId: '6aa0d5af357573496977c404', quantity: 1 }],
};

function parse(overrides: Record<string, unknown>) {
  return checkoutSchema.safeParse({ ...guestOrder, ...overrides });
}

function messagesFor(result: ReturnType<typeof parse>, field: string) {
  if (result.success) return [];
  return result.error.issues.filter(i => i.path.join('.') === field).map(i => i.message);
}

describe('checkoutSchema delivery address', () => {
  // Checkout asks for the address line alone; area and governorate are no
  // longer collected, so an order without them must go through.
  it('accepts an address with no area or governorate', () => {
    const { city: _city, governorate: _governorate, ...addressOnly } = guestOrder.shippingAddress;
    expect(parse({ shippingAddress: addressOnly }).success).toBe(true);
  });

  it('still requires the address line', () => {
    const result = parse({ shippingAddress: { ...guestOrder.shippingAddress, addressLine: '' } });
    expect(result.success).toBe(false);
    expect(messagesFor(result, 'shippingAddress.addressLine')).toEqual(['Address is required']);
  });
});

describe('checkoutSchema payment methods', () => {
  it('defaults to cash on delivery', () => {
    const result = checkoutSchema.safeParse(guestOrder);
    expect(result.success).toBe(true);
    expect(result.success && result.data.paymentMethod).toBe('cod');
  });

  it('accepts card without a reference', () => {
    expect(parse({ paymentMethod: 'card' }).success).toBe(true);
  });

  it('rejects a payment method the restaurant does not take', () => {
    expect(parse({ paymentMethod: 'crypto' }).success).toBe(false);
  });

  describe('instapay', () => {
    it('accepts a transfer reference', () => {
      expect(parse({ paymentMethod: 'instapay', paymentReference: '4821990011' }).success).toBe(
        true
      );
    });

    // Without a reference there is no way for staff to match the money that
    // arrived to the order, so the order must not be accepted at all.
    it('requires a transfer reference', () => {
      const result = parse({ paymentMethod: 'instapay' });
      expect(result.success).toBe(false);
      expect(messagesFor(result, 'paymentReference')).toEqual([
        'Enter the reference from your InstaPay transfer',
      ]);
    });

    it('rejects a blank reference', () => {
      expect(parse({ paymentMethod: 'instapay', paymentReference: '  ' }).success).toBe(false);
    });

    // A reference on a cash or card order would be meaningless and would show
    // up in the staff view as though a transfer were waiting to be checked.
    it('rejects a reference on a non-instapay order', () => {
      const result = parse({ paymentMethod: 'cod', paymentReference: '4821990011' });
      expect(result.success).toBe(false);
      expect(messagesFor(result, 'paymentReference')).toEqual([
        'A payment reference only applies to InstaPay orders',
      ]);
    });
  });
});
