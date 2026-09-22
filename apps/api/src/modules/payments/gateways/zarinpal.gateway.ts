import { Injectable } from "@nestjs/common";
import { Currency, PaymentProvider } from "@prisma/client";
import {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-gateway";

@Injectable()
export class ZarinpalGateway implements PaymentGateway {
  readonly provider: PaymentProvider = "ZARINPAL";

  private base() {
    return process.env.ZARINPAL_SANDBOX === "true"
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
  }

  private startUrl(authority: string) {
    return process.env.ZARINPAL_SANDBOX === "true"
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;
  }

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const merchant = process.env.ZARINPAL_MERCHANT_ID ?? "sandbox";
    if (merchant === "sandbox" || process.env.NODE_ENV !== "production") {
      const authority = `MOCK-ZP-${input.orderId}`;
      const sep = input.callbackUrl.includes("?") ? "&" : "?";
      return {
        authority,
        redirectUrl: `${input.callbackUrl}${sep}Authority=${authority}&Status=OK&provider=ZARINPAL`,
      };
    }

    const res = await fetch(`${this.base()}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: input.amount,
        callback_url: input.callbackUrl,
        description: input.description,
        metadata: { email: input.customerEmail, order_id: input.orderNumber },
      }),
    });
    const data = (await res.json()) as {
      data?: { authority?: string; code?: number };
      errors?: unknown;
    };
    const authority = data.data?.authority;
    if (!authority) {
      throw new Error(`Zarinpal request failed: ${JSON.stringify(data)}`);
    }
    return { authority, redirectUrl: this.startUrl(authority) };
  }

  async verify(authority: string, amount: number, _currency: Currency): Promise<PaymentVerifyResult> {
    if (authority.startsWith("MOCK-") || process.env.ZARINPAL_MERCHANT_ID === "sandbox") {
      return { success: true, refId: `ZP-${Date.now()}`, raw: { mock: true } };
    }
    const res = await fetch(`${this.base()}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount,
        authority,
      }),
    });
    const data = (await res.json()) as {
      data?: { code?: number; ref_id?: number };
    };
    const code = data.data?.code;
    return {
      success: code === 100 || code === 101,
      refId: data.data?.ref_id ? String(data.data.ref_id) : undefined,
      raw: data,
    };
  }
}
