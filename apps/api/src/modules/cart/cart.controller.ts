import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { Currency } from "@prisma/client";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../common/guards/jwt-auth.guard";
import { CartService } from "./cart.service";
import { AddCartItemDto, CouponDto, CurrencyDto, UpdateCartItemDto } from "./dto";

@Controller("cart")
@UseGuards(OptionalJwtGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user?: JwtPayload) {
    return this.cart.get(req, res, user?.sub);
  }

  @Post("items")
  add(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddCartItemDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.cart.add(req, res, dto.variantId, dto.quantity, user?.sub);
  }

  @Patch("items/:id")
  update(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.cart.updateItem(req, res, id, dto.quantity, user?.sub);
  }

  @Post("coupon")
  coupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CouponDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.cart.applyCoupon(req, res, dto.code, user?.sub);
  }

  @Post("currency")
  currency(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CurrencyDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.cart.setCurrency(req, res, (dto.currency as Currency) ?? "IRR", user?.sub);
  }
}
