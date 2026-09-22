import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { OrdersService } from "./orders.service";

const TICK_MS = 60_000;

@Injectable()
export class ReservationService implements OnModuleInit {
  private readonly log = new Logger(ReservationService.name);

  constructor(private readonly orders: OrdersService) {}

  onModuleInit() {
    this.tick().catch((err) => this.log.error(err));
    setInterval(() => {
      this.tick().catch((err) => this.log.error(err));
    }, TICK_MS);
  }

  private async tick() {
    const n = await this.orders.releaseExpired();
    if (n) this.log.log(`Released ${n} expired checkout reservation(s)`);
  }
}
