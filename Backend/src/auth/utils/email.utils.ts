interface OrderConfirmationLine {
  name: string;
  variant: string | null;
  modifiers: string[];
  note: string | null;
  quantity: number;
  lineTotal: number;
}

interface OrderConfirmationData {
  orderNumber: string;
  items: OrderConfirmationLine[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine: string;
    city: string;
    governorate: string;
  };
}

export class EmailUtils {
  private static escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[character];
    });
  }

  private static formatMoney(minorUnits: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minorUnits / 100);
  }

  static generateOrderConfirmationEmailTemplate(
    userName: string,
    order: OrderConfirmationData
  ): string {
    const rows = order.items
      .map(item => {
        const details = [item.variant, ...item.modifiers, `Qty ${item.quantity}`]
          .filter(Boolean)
          .map(detail => this.escapeHtml(String(detail)))
          .join(' · ');
        const note = item.note
          ? `<br><span style="color: #777; font-size: 13px;">Note: ${this.escapeHtml(item.note)}</span>`
          : '';

        return `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                  <strong>${this.escapeHtml(item.name)}</strong><br>
                  <span style="color: #777; font-size: 13px;">${details}</span>${note}
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; white-space: nowrap;">
                  ${this.formatMoney(item.lineTotal, order.currency)}
                </td>
              </tr>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; margin-bottom: 20px; }
            .content { color: #666; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; }
            .totals td { padding: 6px 0; }
            .totals .label { color: #777; }
            .totals .grand-total { font-weight: bold; color: #333; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; }
            .address { background-color: #f9f9f9; padding: 16px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We've received your order <strong>${order.orderNumber}</strong>. The restaurant will confirm it shortly.</p>

              <table>${rows}</table>

              <table class="totals">
                <tr><td class="label">Subtotal</td><td style="text-align: right;">${this.formatMoney(order.subtotal, order.currency)}</td></tr>
                <tr><td class="label">Delivery fee</td><td style="text-align: right;">${order.shippingCost === 0 ? 'Free' : this.formatMoney(order.shippingCost, order.currency)}</td></tr>
                ${order.discountAmount > 0 ? `<tr><td class="label">Discount</td><td style="text-align: right;">-${this.formatMoney(order.discountAmount, order.currency)}</td></tr>` : ''}
                <tr class="grand-total"><td>Total</td><td style="text-align: right;">${this.formatMoney(order.total, order.currency)}</td></tr>
              </table>

              <div class="address">
                <strong>Delivery address:</strong><br>
                ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                ${[order.shippingAddress.addressLine, order.shippingAddress.city, order.shippingAddress.governorate].filter(Boolean).join(', ')}
              </div>

              <p style="margin-top: 20px;">We'll keep you updated as your order is prepared and delivered.</p>
              <p>Thank you for ordering with us,<br><strong>The restaurant team</strong></p>
            </div>
            <div class="footer">
              <p>Your local restaurant ordering service</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static wrap(title: string, bodyHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; margin-bottom: 20px; }
            .content { color: #666; line-height: 1.6; }
            .tracking-box { background-color: #f0f0f0; padding: 16px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .tracking-code { font-size: 20px; font-weight: bold; color: #333; letter-spacing: 1px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>${title}</h1></div>
            <div class="content">${bodyHtml}</div>
            <div class="footer"><p>Fire House restaurant ordering</p></div>
          </div>
        </body>
      </html>
    `;
  }

  static generateOrderShippedEmailTemplate(
    userName: string,
    orderNumber: string,
    trackingNumber: string | null
  ): string {
    return this.wrap(
      'Your Order Has Shipped',
      `
        <p>Hi ${userName},</p>
        <p>Good news — your order <strong>${orderNumber}</strong> is on its way.</p>
        ${
          trackingNumber
            ? `<div class="tracking-box"><p style="margin: 0 0 6px;">Tracking number</p><div class="tracking-code">${trackingNumber}</div></div>`
            : ''
        }
        <p>We'll let you know as soon as it's delivered.</p>
        <p>Thank you for ordering with us,<br><strong>Fire House</strong></p>
      `
    );
  }

  static generateOrderDeliveredEmailTemplate(userName: string, orderNumber: string): string {
    return this.wrap(
      'Your Order Has Arrived',
      `
        <p>Hi ${userName},</p>
        <p>Your order <strong>${orderNumber}</strong> has been delivered. We hope you love it.</p>
        <p>Thank you for ordering with us,<br><strong>Fire House</strong></p>
      `
    );
  }

  static generateOrderRefundedEmailTemplate(
    userName: string,
    orderNumber: string,
    total: number,
    currency: string
  ): string {
    return this.wrap(
      'Your Refund Has Been Processed',
      `
        <p>Hi ${userName},</p>
        <p>We've processed a refund of <strong>${this.formatMoney(total, currency)}</strong> for order <strong>${orderNumber}</strong>. It should appear on your original payment method within a few business days.</p>
        <p>If you have any questions, just reply to this email.</p>
        <p><strong>Fire House</strong></p>
      `
    );
  }

  static generateOrderCancelledEmailTemplate(userName: string, orderNumber: string): string {
    return this.wrap(
      'Your Order Has Been Cancelled',
      `
        <p>Hi ${userName},</p>
        <p>Order <strong>${orderNumber}</strong> has been cancelled as requested. You have not been charged.</p>
        <p>If this wasn't you, please contact us right away.</p>
        <p><strong>Fire House</strong></p>
      `
    );
  }

  static generateBackInStockEmailTemplate(
    productName: string,
    size: string,
    productUrl: string
  ): string {
    return this.wrap(
      "It's Back",
      `
        <p>Good news — <strong>${productName}</strong> (size ${size}) is back in stock.</p>
        <div class="tracking-box"><a href="${productUrl}" style="color:#111;text-decoration:underline;">Shop it now</a></div>
        <p>Stock is limited, so grab it before it sells out again.</p>
        <p><strong>Fire House</strong></p>
      `
    );
  }

  static generateAbandonedCartEmailTemplate(
    userName: string,
    items: { name: string; color: string; size: string; image: string | null }[],
    cartUrl: string
  ): string {
    const rows = items
      .map(
        item => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
              <strong>${item.name}</strong><br>
              <span style="color: #777; font-size: 13px;">${item.color} · Size ${item.size}</span>
            </td>
          </tr>`
      )
      .join('');

    return this.wrap(
      'You Left Something Behind',
      `
        <p>Hi ${userName},</p>
        <p>You still have items waiting in your bag:</p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div class="tracking-box"><a href="${cartUrl}" style="color:#111;text-decoration:underline;">Return to your bag</a></div>
        <p>Items aren't reserved, so act soon if something's low on stock.</p>
        <p><strong>Fire House</strong></p>
      `
    );
  }

  static generateOtpEmailTemplate(userName: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; margin-bottom: 20px; }
            .content { color: #666; line-height: 1.6; }
            .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>

              <div class="otp-box">
                <p>Your verification code:</p>
                <div class="otp-code">${otp}</div>
              </div>

              <p>This code will expire in 10 minutes.</p>
              <p class="warning">⚠️ If you didn't request this code, please ignore this email.</p>

              <p>Best regards,<br><strong>Fire House</strong></p>
            </div>
            <div class="footer">
              <p>Fire House restaurant ordering</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static generateWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; margin-bottom: 20px; }
            .content { color: #666; line-height: 1.6; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Fire House! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Your email has been verified successfully. Your account is now active and ready to use!</p>
              <p>You can now sign in, order your favourite dishes, and keep track of every order.</p>
              <p>If you have any questions or need assistance, feel free to contact our support team.</p>
              <p>Enjoy your meal!<br><strong>Fire House</strong></p>
            </div>
            <div class="footer">
              <p>Fire House restaurant ordering</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static generatePasswordResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #333; margin-bottom: 20px; }
            .content { color: #666; line-height: 1.6; }
            .button-box { text-align: center; margin: 24px 0; }
            .button { display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; }
            .fallback-link { word-break: break-all; font-size: 12px; color: #666; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We received a request to reset your password. Click the button below to choose a new one:</p>

              <div class="button-box">
                <a class="button" href="${resetUrl}">Reset Password</a>
              </div>

              <p>Or paste this link into your browser:</p>
              <p class="fallback-link">${resetUrl}</p>

              <p>This link will expire in 1 hour.</p>
              <p class="warning">⚠️ If you didn't request a password reset, please ignore this email.</p>

              <p>Best regards,<br><strong>Fire House</strong></p>
            </div>
            <div class="footer">
              <p>Fire House restaurant ordering</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
