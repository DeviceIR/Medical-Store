import { Controller, Get } from "@nestjs/common";
import { PAYMENT_PROVIDERS } from "@medical/shared";

@Controller("payments")
export class PaymentsController {
  @Get("providers")
  providers() {
    return PAYMENT_PROVIDERS.map((id) => ({
      id,
      enabled:
        id === "ZARINPAL" ||
        id === "WALLET" ||
        Boolean(process.env.STRIPE_SECRET_KEY) ||
        process.env.NODE_ENV !== "production",
    }));
  }
}
