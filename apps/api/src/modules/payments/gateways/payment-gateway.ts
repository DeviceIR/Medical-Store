import { Currency, PaymentProvider } from "@prisma/client";

export type PaymentRequestInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: Currency;
  callbackUrl: string;
  customerEmail?: string | null;
  description: string;
};

export type PaymentRequestResult = {
  redirectUrl: string;
  authority: string;
};

export type PaymentVerifyResult = {
  success: boolean;
  refId?: string;
  raw?: unknown;
};

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  request(input: PaymentRequestInput): Promise<PaymentRequestResult>;
  verify(authority: string, amount: number, currency: Currency): Promise<PaymentVerifyResult>;
}
