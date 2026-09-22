import { BadRequestException, Injectable } from "@nestjs/common";
import { Currency } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentRegistry } from "../payments/payment-registry";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentRegistry,
  ) {}

  async get(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
  }

  async topUp(userId: string, amount: number, currency: Currency, provider: "ZARINPAL" | "STRIPE") {
    if (amount <= 0) throw new BadRequestException("Invalid amount");
    const wallet = await this.get(userId);
    const gateway = this.payments.get(provider);
    const locale = currency === "IRR" ? "fa" : "en";
    const web = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    const requested = await gateway.request({
      orderId: `wallet-${wallet.id}-${Date.now()}`,
      orderNumber: `WALLET-${wallet.id.slice(0, 6)}`,
      amount,
      currency,
      callbackUrl: `${web}/${locale}/account/wallet/callback`,
      description: `Wallet top-up ${amount} ${currency}`,
    });
    await this.prisma.payment.create({
      data: {
        userId,
        purpose: "WALLET_TOPUP",
        provider,
        amount,
        currency,
        authority: requested.authority,
        status: "PENDING",
      },
    });
    return { ...requested, amount, currency, walletId: wallet.id };
  }

  async confirmTopUp(userId: string, authority: string, provider?: "ZARINPAL" | "STRIPE") {
    const payment = await this.prisma.payment.findFirst({
      where: { authority, purpose: "WALLET_TOPUP", userId },
    });
    if (!payment) throw new BadRequestException("Top-up payment not found");
    if (payment.status === "PAID") return this.get(userId);

    const result = await this.payments.get(provider ?? payment.provider).verify(
      authority,
      payment.amount,
      payment.currency,
    );
    if (!result.success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", rawPayload: result.raw as object | undefined },
      });
      throw new BadRequestException("Top-up verification failed");
    }

    const field =
      payment.currency === "USD" ? "balanceUsd" : payment.currency === "EUR" ? "balanceEur" : "balanceIrr";
    const wallet = await this.get(userId);

    try {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id, status: "PENDING" },
          data: { status: "PAID", refId: result.refId, rawPayload: result.raw as object | undefined },
        }),
        this.prisma.wallet.update({
          where: { id: wallet.id },
          data: { [field]: { increment: payment.amount } },
        }),
        this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: payment.amount,
            currency: payment.currency,
            description: `Top-up via ${payment.provider}`,
            paymentId: payment.id,
          },
        }),
      ]);
    } catch {
      const latest = await this.prisma.payment.findUnique({ where: { id: payment.id } });
      if (latest?.status !== "PAID") throw new BadRequestException("Top-up already processed");
    }

    return this.get(userId);
  }
}
