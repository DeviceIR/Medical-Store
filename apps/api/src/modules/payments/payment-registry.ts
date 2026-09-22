import { Injectable } from "@nestjs/common";
import { PaymentProvider } from "@prisma/client";
import { PaymentGateway } from "./gateways/payment-gateway";
import { ZarinpalGateway } from "./gateways/zarinpal.gateway";
import { StripeGateway } from "./gateways/stripe.gateway";
import { WalletGateway } from "./gateways/wallet.gateway";

@Injectable()
export class PaymentRegistry {
  constructor(
    private readonly zarinpal: ZarinpalGateway,
    private readonly stripe: StripeGateway,
    private readonly wallet: WalletGateway,
  ) {}

  get(provider: PaymentProvider): PaymentGateway {
    if (provider === "STRIPE") return this.stripe;
    if (provider === "WALLET") return this.wallet;
    return this.zarinpal;
  }
}
