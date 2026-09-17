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

// Email stopped being a condition of ordering: plenty of walk-up customers
// don't have one to hand and shouldn't be turned away at the last step. What
// it still buys is a confirmation message and the track-your-order lookup,
// and it is still the only identity a guest coupon can be capped against.
describe('checkoutSchema email', () => {
  it('accepts a guest order with no email at all', () => {
    const { email: _email, ...withoutEmail } = guestOrder;
    expect(checkoutSchema.safeParse(withoutEmail).success).toBe(true);
  });

  it('reads a blank field as no email rather than a bad one', () => {
    const result = parse({ email: '   ' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBeNull();
  });

  it('still rejects an email that is not one', () => {
    const result = parse({ email: 'not-an-address' });
    expect(result.success).toBe(false);
    expect(messagesFor(result, 'email')).toEqual(['Please provide a valid email address']);
  });

  it('keeps a valid email', () => {
    const result = parse({ email: '  Customer@Example.com  ' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe('Customer@Example.com');
  });

  // The per-customer cap is recorded against an account or an email. With
  // neither there is nothing to record, so the code would never be used up.
  it('requires an email from a guest using a coupon', () => {
    const { email: _email, ...withoutEmail } = guestOrder;
    const result = checkoutSchema.safeParse({ ...withoutEmail, couponCode: 'WELCOME10' });
    expect(result.success).toBe(false);
    expect(messagesFor(result, 'email')).toEqual(['An email address is required to use a coupon']);
  });

  it('lets a signed-in customer use a coupon without one', () => {
    const result = checkoutSchema.safeParse({ addressId: 'addr-1', couponCode: 'WELCOME10' });
    expect(result.success).toBe(true);
  });
});
