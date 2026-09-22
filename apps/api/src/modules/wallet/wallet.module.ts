import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { PaymentsModule } from "../payments/payments.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
