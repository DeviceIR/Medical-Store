import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { Currency, PaymentProvider } from "@prisma/client";
import {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-gateway";

@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly provider: PaymentProvider = "STRIPE";

  private client() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
  }

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const stripe = this.client();
    const web = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    if (!stripe) {
      const authority = `MOCK-ST-${input.orderId}`;
      const sep = input.callbackUrl.includes("?") ? "&" : "?";
      return {
        authority,
        redirectUrl: `${input.callbackUrl}${sep}Authority=${authority}&Status=OK&provider=STRIPE`,
      };
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${input.callbackUrl}?Authority={CHECKOUT_SESSION_ID}&Status=OK&provider=STRIPE`,
      cancel_url: `${web}/en/checkout?cancelled=1`,
      customer_email: input.customerEmail ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: { name: input.description },
          },
        },
      ],
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
    });
    return {
      authority: session.id,
      redirectUrl: session.url ?? `${web}/en/checkout`,
    };
  }

  async verify(authority: string, _amount: number, _currency: Currency): Promise<PaymentVerifyResult> {
    if (authority.startsWith("MOCK-")) {
      return { success: true, refId: `ST-${Date.now()}`, raw: { mock: true } };
    }
    const stripe = this.client();
    if (!stripe) return { success: false };
    const session = await stripe.checkout.sessions.retrieve(authority);
    return {
      success: session.payment_status === "paid",
      refId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
      raw: session,
    };
  }
}
