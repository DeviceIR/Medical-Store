import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { PaymentProvider } from "@prisma/client";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { OrdersService } from "./orders.service";
import { CheckoutDto, VerifyPaymentDto } from "./dto";

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("checkout")
  @UseGuards(OptionalJwtGuard)
  checkout(
    @Req() req: Request,
    @Body() dto: CheckoutDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.orders.checkout(req, {
      userId: user?.sub,
      addressId: dto.addressId,
      guestName: dto.guestName,
      guestPhone: dto.guestPhone,
      guestEmail: dto.guestEmail,
      provinceId: dto.provinceId,
      notes: dto.notes,
      provider: dto.provider ?? "ZARINPAL",
    });
  }

  @Post("payments/verify")
  verify(@Body() dto: VerifyPaymentDto) {
    return this.orders.verify(dto.authority, (dto.provider as PaymentProvider) ?? "ZARINPAL", dto.status);
  }

  @Get("orders")
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: JwtPayload) {
    return this.orders.listForUser(user.sub);
  }

  @Get("orders/:id")
  @UseGuards(JwtAuthGuard)
  one(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const isStaff = user.role === "ADMIN" || user.role === "STAFF";
    return this.orders.getOne(id, user.sub, isStaff);
  }

  @Get("orders/:id/invoice")
  @UseGuards(JwtAuthGuard)
  invoice(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const isStaff = user.role === "ADMIN" || user.role === "STAFF";
    return this.orders.invoice(id, user.sub, isStaff);
  }
}
