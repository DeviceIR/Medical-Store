import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { BlogModule } from "./modules/blog/blog.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SmsModule } from "./modules/sms/sms.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 80 }]),
    PrismaModule,
    SmsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    UploadsModule,
    WalletModule,
    WishlistModule,
    BlogModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
