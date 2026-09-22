import { Module } from "@nestjs/common";
import { PaymentRegistry } from "./payment-registry";
import { ZarinpalGateway } from "./gateways/zarinpal.gateway";
import { StripeGateway } from "./gateways/stripe.gateway";
import { WalletGateway } from "./gateways/wallet.gateway";
import { PaymentsController } from "./payments.controller";

@Module({
  controllers: [PaymentsController],
  providers: [ZarinpalGateway, StripeGateway, WalletGateway, PaymentRegistry],
  exports: [PaymentRegistry],
})
export class PaymentsModule {}
