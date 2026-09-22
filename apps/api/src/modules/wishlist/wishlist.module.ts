import { Module } from "@nestjs/common";
import { WishlistController } from "./wishlist.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [WishlistController],
})
export class WishlistModule {}
