import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Currency, PaymentProvider, Prisma } from "@prisma/client";
import { Request } from "express";
import { CART_COOKIE } from "@medical/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentRegistry } from "../payments/payment-registry";
import { SmsService } from "../sms/sms.service";

const STATUS_FA: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت",
};

const RESERVE_MS = 20 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentRegistry,
    private readonly sms: SmsService,
  ) {}

  private unitPrice(variant: { priceIrr: number; priceUsd: number; priceEur: number }, currency: Currency) {
    if (currency === "USD") return variant.priceUsd;
    if (currency === "EUR") return variant.priceEur;
    return variant.priceIrr;
  }

  private async nextNumber() {
    const count = await this.prisma.order.count();
    return `MED-${String(count + 1).padStart(6, "0")}`;
  }

  async checkout(
    req: Request,
    input: {
      userId?: string;
      addressId?: string;
      guestName?: string;
      guestPhone?: string;
      guestEmail?: string;
      provinceId?: string;
      notes?: string;
      provider: PaymentProvider;
    },
  ) {
    const cookieCart = req.cookies?.[CART_COOKIE] as string | undefined;
    const cart = input.userId
      ? await this.prisma.cart.findUnique({
          where: { userId: input.userId },
          include: { items: { include: { variant: { include: { product: { include: { translations: true } } } } } }, coupon: true },
        })
      : cookieCart
        ? await this.prisma.cart.findUnique({
            where: { id: cookieCart },
            include: { items: { include: { variant: { include: { product: { include: { translations: true } } } } } }, coupon: true },
          })
        : null;
    if (!cart?.items.length) throw new BadRequestException("Cart is empty");

    const currency = cart.currency;
    let subtotal = 0;
    for (const item of cart.items) {
      const available = item.variant.stock - item.variant.reserved;
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.variant.sku}`);
      }
      subtotal += this.unitPrice(item.variant, currency) * item.quantity;
    }

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.expiresAt && cart.coupon.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException("COUPON_EXPIRED");
      }
      if (currency === "IRR" && cart.coupon.minOrderIrr > 0 && subtotal < cart.coupon.minOrderIrr) {
        throw new BadRequestException("COUPON_MIN_ORDER");
      }
      if (cart.coupon.percentOff) discount = Math.round((subtotal * cart.coupon.percentOff) / 100);
      if (cart.coupon.amountIrr && currency === "IRR") discount += cart.coupon.amountIrr;
    }

    let address:
      | {
          id: string;
          fullName: string;
          phone: string;
          line1: string;
          postalCode: string | null;
          city: { nameFa: string; nameEn: string };
          province: { id: string; nameFa: string; nameEn: string };
        }
      | null = null;
    if (input.addressId) {
      if (!input.userId) throw new BadRequestException("ADDRESS_REQUIRES_LOGIN");
      address = await this.prisma.address.findFirst({
        where: { id: input.addressId, userId: input.userId },
        include: { city: true, province: true },
      });
      if (!address) throw new BadRequestException("ADDRESS_NOT_FOUND");
    }

    const provinceId = address?.province.id ?? input.provinceId;
    let shippingCost = 0;
    if (provinceId) {
      const rate = await this.prisma.shippingRate.findUnique({ where: { provinceId } });
      if (rate) {
        shippingCost =
          currency === "USD" ? rate.priceUsd : currency === "EUR" ? rate.priceEur : rate.priceIrr;
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCost);
    const number = await this.nextNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: { reserved: { increment: item.quantity } },
        });
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!updated.count || !variant || variant.stock - variant.reserved < 0) {
          throw new BadRequestException(`Could not reserve ${item.variant.sku}`);
        }
      }

      const created = await tx.order.create({
        data: {
          number,
          userId: input.userId,
          addressId: address?.id,
          guestName: input.guestName ?? address?.fullName,
          guestPhone: input.guestPhone ?? address?.phone,
          guestEmail: input.guestEmail,
          shipName: address?.fullName ?? input.guestName,
          shipPhone: address?.phone ?? input.guestPhone,
          shipLine1: address?.line1,
          shipPostalCode: address?.postalCode,
          shipCityFa: address?.city.nameFa,
          shipCityEn: address?.city.nameEn,
          shipProvinceFa: address?.province.nameFa,
          shipProvinceEn: address?.province.nameEn,
          currency,
          subtotal,
          shippingCost,
          discount,
          total,
          couponId: cart.couponId,
          notes: input.notes,
          reservedUntil: new Date(Date.now() + RESERVE_MS),
          items: {
            create: cart.items.map((item) => {
              const unit = this.unitPrice(item.variant, currency);
              const title =
                item.variant.product.translations.find((t) => t.locale === (currency === "IRR" ? "fa" : "en"))
                  ?.name ?? item.variant.sku;
              return {
                variantId: item.variantId,
                title,
                sku: item.variant.sku,
                quantity: item.quantity,
                unitPrice: unit,
                totalPrice: unit * item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
      return created;
    });

    const locale = currency === "IRR" ? "fa" : "en";
    const callbackUrl = `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/${locale}/checkout/callback`;
    const gateway = this.payments.get(input.provider);
    const requested = await gateway.request({
      orderId: order.id,
      orderNumber: order.number,
      amount: order.total,
      currency,
      callbackUrl,
      customerEmail: input.guestEmail,
      description: `Order ${order.number}`,
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        userId: input.userId,
        purpose: "ORDER",
        provider: input.provider,
        amount: order.total,
        currency,
        authority: requested.authority,
        status: "PENDING",
      },
    });

    return { order, redirectUrl: requested.redirectUrl, authority: requested.authority };
  }

  async verify(authority: string, provider: PaymentProvider, status?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { authority, purpose: "ORDER" },
      include: { order: { include: { items: true, user: true } } },
    });
    if (!payment?.order) throw new NotFoundException("Payment not found");
    if (payment.status === "PAID") return payment.order;

    if (status && status !== "OK") {
      await this.failPayment(payment.id, payment.orderId!);
      return this.prisma.order.findUnique({ where: { id: payment.orderId! } });
    }

    const result = await this.payments.get(provider).verify(authority, payment.amount, payment.currency);
    if (!result.success) {
      await this.failPayment(payment.id, payment.orderId!, result.raw);
      throw new BadRequestException("Payment verification failed");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", refId: result.refId, rawPayload: result.raw as object | undefined },
      });
      await tx.order.update({
        where: { id: payment.orderId! },
        data: { status: "PAID", reservedUntil: null },
      });
      for (const item of payment.order!.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            reserved: { decrement: item.quantity },
            stock: { decrement: item.quantity },
          },
        });
      }
      await this.ensureInvoice(tx, payment.orderId!);
    });

    const phone = payment.order.guestPhone ?? payment.order.user?.phone;
    if (phone) {
      await this.sms.sendOrderStatus(phone, payment.order.number, STATUS_FA.PAID);
      await this.prisma.order.update({
        where: { id: payment.orderId! },
        data: { smsNotifiedAt: new Date() },
      });
    }

    return this.prisma.order.findUnique({
      where: { id: payment.orderId! },
      include: { items: true, payments: true, invoice: true },
    });
  }

  private async failPayment(paymentId: string, orderId: string, raw?: unknown) {
    await this.release(orderId);
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED", rawPayload: raw as object | undefined },
    });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", reservedUntil: null },
    });
  }

  async releaseExpired() {
    const expired = await this.prisma.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        reservedUntil: { lt: new Date() },
      },
      select: { id: true },
    });
    for (const order of expired) {
      await this.release(order.id);
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", reservedUntil: null },
      });
      await this.prisma.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
    return expired.length;
  }

  async refund(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, user: true },
    });
    if (!order) throw new NotFoundException();
    if (order.status === "REFUNDED") return order;
    const paid = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
    await this.prisma.$transaction(async (tx) => {
      if (paid) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        if (order.userId) {
          const wallet = await tx.wallet.upsert({
            where: { userId: order.userId },
            update: {},
            create: { userId: order.userId },
          });
          const field =
            order.currency === "USD" ? "balanceUsd" : order.currency === "EUR" ? "balanceEur" : "balanceIrr";
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { [field]: { increment: order.total } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount: order.total,
              currency: order.currency,
              description: `Refund ${order.number}`,
              orderId: order.id,
            },
          });
        }
      } else if (order.status === "PENDING_PAYMENT") {
        await this.releaseInTx(tx, order.items);
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED", reservedUntil: null } });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: { in: ["PENDING", "PAID"] } },
        data: { status: "REFUNDED" },
      });
    });
    return this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
  }

  async release(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING_PAYMENT") return;
    await this.releaseInTx(this.prisma, order.items);
  }

  private async releaseInTx(
    tx: Prisma.TransactionClient | PrismaService,
    items: { variantId: string; quantity: number }[],
  ) {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reserved: { decrement: item.quantity } },
      });
    }
  }

  private async ensureInvoice(tx: Prisma.TransactionClient, orderId: string) {
    const existing = await tx.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;
    const count = await tx.invoice.count();
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return null;
    return tx.invoice.create({
      data: {
        orderId,
        serial: `INV-${String(count + 1).padStart(6, "0")}`,
        sellerName: process.env.INVOICE_SELLER_NAME ?? "مدیکال استور",
        sellerNationalId: process.env.INVOICE_SELLER_NATIONAL_ID || null,
        vatPercent: 0,
        vatAmount: order.vatAmount,
      },
    });
  }

  listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true, shipment: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOne(id: string, userId?: string, isStaff = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        shipment: true,
        invoice: true,
        address: { include: { city: true, province: true } },
        user: true,
      },
    });
    if (!order) throw new NotFoundException();
    if (!isStaff && userId && order.userId !== userId) throw new NotFoundException();
    return order;
  }

  async invoice(id: string, userId?: string, isStaff = false) {
    const order = await this.getOne(id, userId, isStaff);
    if (!order.invoice && (order.status === "PAID" || order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED")) {
      await this.prisma.$transaction(async (tx) => {
        await this.ensureInvoice(tx, order.id);
      });
      return this.getOne(id, userId, isStaff);
    }
    return order;
  }
}
