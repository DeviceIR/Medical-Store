import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CART_COOKIE } from "@medical/shared";
import { Currency } from "@prisma/client";
import { Request, Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreate(req: Request, res: Response, userId?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: this.include(),
      });
      const cookieId = req.cookies?.[CART_COOKIE] as string | undefined;
      if (cookieId && cart) {
        await this.merge(cookieId, cart.id);
        res.clearCookie(CART_COOKIE, { path: "/" });
        cart = await this.prisma.cart.findUniqueOrThrow({
          where: { id: cart.id },
          include: this.include(),
        });
      }
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: this.include(),
        });
      }
      return cart;
    }
    const cookieId = req.cookies?.[CART_COOKIE] as string | undefined;
    if (cookieId) {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cookieId },
        include: this.include(),
      });
      if (cart) return cart;
    }
    const cart = await this.prisma.cart.create({ data: {}, include: this.include() });
    res.cookie(CART_COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return cart;
  }

  private include() {
    return {
      coupon: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  translations: true,
                  images: { take: 1, orderBy: { sortOrder: "asc" as const } },
                },
              },
            },
          },
        },
      },
    };
  }

  private async merge(fromId: string, toId: string) {
    const from = await this.prisma.cart.findUnique({
      where: { id: fromId },
      include: { items: true },
    });
    if (!from || from.id === toId) return;
    for (const item of from.items) {
      await this.prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: toId, variantId: item.variantId } },
        update: { quantity: { increment: item.quantity } },
        create: { cartId: toId, variantId: item.variantId, quantity: item.quantity },
      });
    }
    await this.prisma.cart.delete({ where: { id: fromId } }).catch(() => undefined);
  }

  get(req: Request, res: Response, userId?: string) {
    return this.getOrCreate(req, res, userId);
  }

  async add(req: Request, res: Response, variantId: string, quantity: number, userId?: string) {
    const cart = await this.getOrCreate(req, res, userId);
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException("Variant not found");
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, variantId, quantity },
    });
    return this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: this.include() });
  }

  async updateItem(req: Request, res: Response, itemId: string, quantity: number, userId?: string) {
    const cart = await this.getOrCreate(req, res, userId);
    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else {
      await this.prisma.cartItem.updateMany({
        where: { id: itemId, cartId: cart.id },
        data: { quantity },
      });
    }
    return this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: this.include() });
  }

  async applyCoupon(req: Request, res: Response, code: string, userId?: string) {
    const cart = await this.getOrCreate(req, res, userId);
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), active: true },
    });
    if (!coupon) throw new NotFoundException("Invalid coupon");
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("COUPON_EXPIRED");
    }
    const subtotal = cart.items.reduce((sum, item) => {
      const unit =
        cart.currency === "USD"
          ? item.variant.priceUsd
          : cart.currency === "EUR"
            ? item.variant.priceEur
            : item.variant.priceIrr;
      return sum + unit * item.quantity;
    }, 0);
    if (cart.currency === "IRR" && coupon.minOrderIrr > 0 && subtotal < coupon.minOrderIrr) {
      throw new BadRequestException("COUPON_MIN_ORDER");
    }
    return this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
      include: this.include(),
    });
  }

  async setCurrency(req: Request, res: Response, currency: Currency, userId?: string) {
    const cart = await this.getOrCreate(req, res, userId);
    return this.prisma.cart.update({
      where: { id: cart.id },
      data: { currency },
      include: this.include(),
    });
  }
}
