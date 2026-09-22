import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { ReservationService } from "./reservation.service";
import { PaymentsModule } from "../payments/payments.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService, ReservationService],
  exports: [OrdersService],
})
export class OrdersModule {}
