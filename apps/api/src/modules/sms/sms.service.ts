import { Injectable, Logger } from "@nestjs/common";
import { SmsStatus, SmsTemplate } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type SmsChannel = "preview" | "sms";

export type SmsSendResult = {
  channel: SmsChannel;
  delivered: boolean;
};

type KavenegarResponse = {
  return?: { status?: number; message?: string };
  entries?: { messageid?: number; cost?: number; status?: number }[];
};

@Injectable()
export class SmsService {
  private readonly log = new Logger(SmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  isPreview() {
    return !process.env.KAVENEGAR_API_KEY;
  }

  async sendOtp(phone: string, code: string): Promise<SmsSendResult> {
    if (this.isPreview()) {
      this.log.log(`[SMS preview OTP -> ${phone}] ${code}`);
      await this.record({
        phone,
        template: "OTP",
        token: code,
        status: "PREVIEW",
      });
      return { channel: "preview", delivered: false };
    }

    const template = process.env.KAVENEGAR_OTP_TEMPLATE;
    try {
      const sent = template
        ? await this.lookup(phone, template, [code])
        : await this.plainSend(phone, `کد ورود مدیکال استور: ${code}`);
      await this.record({
        phone,
        template: "OTP",
        status: "SENT",
        providerId: sent.providerId,
        cost: sent.cost,
      });
      return { channel: "sms", delivered: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`OTP SMS failed for ${phone}: ${message}`);
      await this.record({
        phone,
        template: "OTP",
        status: "FAILED",
        error: message,
      });
      return { channel: "sms", delivered: false };
    }
  }

  async sendOrderStatus(phone: string, orderNumber: string, statusFa: string) {
    if (this.isPreview()) {
      this.log.log(`[SMS preview order -> ${phone}] ${orderNumber} ${statusFa}`);
      await this.record({
        phone,
        template: "ORDER_STATUS",
        token: orderNumber,
        status: "PREVIEW",
      });
      return;
    }

    const template = process.env.KAVENEGAR_ORDER_TEMPLATE;
    try {
      const sent = template
        ? await this.lookup(phone, template, [orderNumber, statusFa])
        : await this.plainSend(phone, `سفارش ${orderNumber} به وضعیت «${statusFa}» تغییر کرد. مدیکال استور`);
      await this.record({
        phone,
        template: "ORDER_STATUS",
        token: orderNumber,
        status: "SENT",
        providerId: sent.providerId,
        cost: sent.cost,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`Order SMS failed for ${phone}: ${message}`);
      await this.record({
        phone,
        template: "ORDER_STATUS",
        token: orderNumber,
        status: "FAILED",
        error: message,
      });
    }
  }

  private async record(data: {
    phone: string;
    template: SmsTemplate;
    token?: string;
    providerId?: string;
    status: SmsStatus;
    cost?: number;
    error?: string;
  }) {
    await this.prisma.smsLog.create({ data }).catch((err) => {
      this.log.error(`SmsLog write failed: ${err instanceof Error ? err.message : err}`);
    });
  }

  private apiKey() {
    const key = process.env.KAVENEGAR_API_KEY;
    if (!key) throw new Error("KAVENEGAR_API_KEY missing");
    return key;
  }

  private async lookup(phone: string, template: string, tokens: string[]) {
    const params = new URLSearchParams({ receptor: phone, template });
    tokens.forEach((token, i) => {
      params.set(i === 0 ? "token" : `token${i + 1}`, token);
    });
    return this.call(`https://api.kavenegar.com/v1/${this.apiKey()}/verify/lookup.json?${params}`);
  }

  private async plainSend(phone: string, message: string) {
    const params = new URLSearchParams({ receptor: phone, message });
    return this.call(`https://api.kavenegar.com/v1/${this.apiKey()}/sms/send.json?${params}`);
  }

  private async call(url: string) {
    const res = await fetch(url);
    const body = (await res.json().catch(() => ({}))) as KavenegarResponse;
    const okHttp = res.ok;
    const okApi = (body.return?.status ?? 0) >= 200 && (body.return?.status ?? 0) < 300;
    if (!okHttp || !okApi) {
      throw new Error(body.return?.message ?? `Kavenegar HTTP ${res.status}`);
    }
    const entry = body.entries?.[0];
    return {
      providerId: entry?.messageid ? String(entry.messageid) : undefined,
      cost: entry?.cost,
    };
  }
}
