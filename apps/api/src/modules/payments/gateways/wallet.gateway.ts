import { BadRequestException, Injectable } from "@nestjs/common";
import { Currency, PaymentProvider } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-gateway";

@Injectable()
export class WalletGateway implements PaymentGateway {
  readonly provider: PaymentProvider = "WALLET";

  constructor(private readonly prisma: PrismaService) {}

  private field(currency: Currency) {
    if (currency === "USD") return "balanceUsd" as const;
    if (currency === "EUR") return "balanceEur" as const;
    return "balanceIrr" as const;
  }

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order?.userId) throw new BadRequestException("Wallet checkout requires a logged-in user");
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) throw new BadRequestException("Wallet not found");
    const field = this.field(input.currency);
    if (wallet[field] < input.amount) {
      throw new BadRequestException("Insufficient wallet balance");
    }
    const authority = `WALLET-${input.orderId}`;
    const sep = input.callbackUrl.includes("?") ? "&" : "?";
    return {
      authority,
      redirectUrl: `${input.callbackUrl}${sep}Authority=${authority}&Status=OK&provider=WALLET`,
    };
  }

  async verify(authority: string, amount: number, currency: Currency): Promise<PaymentVerifyResult> {
    const orderId = authority.replace("WALLET-", "");
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.userId) return { success: false };
    const field = this.field(currency);
    try {
      await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: order.userId! } });
        if (wallet[field] < amount) throw new Error("insufficient");
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { [field]: { decrement: amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount,
            currency,
            description: `Order ${order.number}`,
          },
        });
      });
      return { success: true, refId: authority };
    } catch {
      return { success: false };
    }
  }
}
