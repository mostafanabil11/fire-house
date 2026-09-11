import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import { OrderAlert } from './order-alert';

export interface WhatsAppSendResult {
  providerMessageId: string;
}

export class WhatsAppNotConfiguredError extends Error {
  constructor() {
    super('WhatsApp is not configured');
    this.name = 'WhatsAppNotConfiguredError';
  }
}

/**
 * Distinguishes "this will never work, stop retrying" from "try again in a
 * minute". Retrying a rejected template forever just burns quota and buries
 * the real error.
 */
export class WhatsAppSendError extends Error {
  constructor(
    message: string,
    readonly permanent: boolean
  ) {
    super(message);
    this.name = 'WhatsAppSendError';
  }
}

const GRAPH_VERSION = 'v21.0';

/**
 * The one place that knows how a WhatsApp message is actually sent.
 *
 * Kept behind this small surface (`isConfigured` + `send`) so the restaurant
 * can start on Meta's own Cloud API and move to a Business Solution Provider
 * later — several of which are easier to onboard in Egypt — without order
 * creation or the dashboard changing at all.
 */
@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(private configService: ConfigService) {}

  isConfigured(): boolean {
    return this.configService.isWhatsAppConfigured;
  }

  async send(to: string, alert: OrderAlert): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      throw new WhatsAppNotConfiguredError();
    }

    const phoneNumberId = this.configService.whatsappPhoneNumberId;
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildPayload(to, alert)),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      // Network-level: DNS, TLS, timeout. Always worth another attempt.
      throw new WhatsAppSendError(`WhatsApp request failed: ${(err as Error).message}`, false);
    }

    const text = await response.text();

    if (!response.ok) {
      // 4xx is us — a bad token, an unapproved template, a number that is not
      // on WhatsApp. Retrying cannot fix any of those. 429 is the exception:
      // rate limiting clears on its own.
      const permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
      throw new WhatsAppSendError(
        `WhatsApp API ${response.status}: ${text.slice(0, 400)}`,
        permanent
      );
    }

    try {
      const body = JSON.parse(text) as { messages?: { id?: string }[] };
      return { providerMessageId: body.messages?.[0]?.id ?? 'unknown' };
    } catch {
      // Accepted but unparseable. The message is gone either way, so treat it
      // as sent rather than sending it twice.
      this.logger.warn(`WhatsApp returned unparseable success body: ${text.slice(0, 200)}`);
      return { providerMessageId: 'unknown' };
    }
  }

  private buildPayload(to: string, alert: OrderAlert) {
    // WhatsApp only allows free-form text within 24 hours of the recipient
    // messaging the business. A new-order alert is business-initiated and
    // arrives at any hour, so production has to use an approved template.
    // Plain text stays available because it needs no approval, which makes it
    // the only way to test the whole path while the template is in review.
    if (!this.configService.whatsappTemplateName) {
      return {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: alert.body },
      };
    }

    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: this.configService.whatsappTemplateName,
        language: { code: this.configService.whatsappTemplateLanguage },
        components: [
          {
            type: 'body',
            parameters: alert.templateVariables.map(text => ({ type: 'text', text })),
          },
        ],
      },
    };
  }
}
