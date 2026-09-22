import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { Request, Response } from "express";
import {
  REFRESH_COOKIE,
  isIranMobile,
  looksLikeEmail,
  normalizeIranPhone,
} from "@medical/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { SmsService } from "../sms/sms.service";
import { AuthTokensService } from "./auth-tokens.service";
import { LoginDto, RegisterDto, RequestOtpDto, VerifyOtpDto } from "./dto";
import { JwtPayload } from "../../common/guards/jwt-auth.guard";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 45_000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly tokens: AuthTokensService,
    private readonly jwt: JwtService,
  ) {}

  private publicUser(user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    role: string;
    locale: string;
    nationalId: string | null;
    companyId: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      locale: user.locale,
      nationalId: user.nationalId,
      companyId: user.companyId,
    };
  }

  async requestOtp(dto: RequestOtpDto) {
    const phone = dto.phone;
    const recent = await this.prisma.otpCode.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - OTP_RESEND_MS) } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
      throw new HttpException(
        { message: "OTP_COOLDOWN", retryAfter: Math.max(wait, 1) },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.otpCode.updateMany({
      where: { phone, consumed: false },
      data: { consumed: true },
    });

    const preview = this.sms.isPreview();
    const fixed = process.env.OTP_DEV_CODE?.trim();
    const code = preview && fixed && /^\d{4,8}$/.test(fixed) ? fixed : String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 8);
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const sms = await this.sms.sendOtp(phone, code);
    return {
      ok: true,
      phone,
      expiresIn: OTP_TTL_MS / 1000,
      resendAfter: OTP_RESEND_MS / 1000,
      channel: sms.channel,
      delivered: sms.delivered,
      ...(preview ? { code } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto, res: Response) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone: dto.phone, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) throw new UnauthorizedException("OTP_EXPIRED");
    if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new UnauthorizedException("OTP_LOCKED");
    const ok = await bcrypt.compare(dto.code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("OTP_INVALID");
    }
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, wallet: { create: {} } },
      });
    }
    await this.tokens.issue(user, res);
    return this.publicUser(user);
  }

  async register(dto: RegisterDto, res: Response) {
    if (!dto.email && !dto.phone) throw new BadRequestException("EMAIL_OR_PHONE_REQUIRED");
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new BadRequestException("EMAIL_TAKEN");
    }
    if (dto.phone) {
      const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (exists) throw new BadRequestException("PHONE_TAKEN");
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
        wallet: { create: {} },
      },
    });
    await this.tokens.issue(user, res);
    return this.publicUser(user);
  }

  async login(dto: LoginDto, res: Response) {
    const raw = (dto.identifier ?? dto.email ?? dto.phone ?? "").trim();
    if (!raw) throw new BadRequestException("EMAIL_OR_PHONE_REQUIRED");

    const user = looksLikeEmail(raw)
      ? await this.prisma.user.findUnique({ where: { email: raw.toLowerCase() } })
      : isIranMobile(raw)
        ? await this.prisma.user.findUnique({ where: { phone: normalizeIranPhone(raw) } })
        : null;
    if (!user && !looksLikeEmail(raw) && !isIranMobile(raw)) {
      throw new BadRequestException("EMAIL_OR_PHONE_REQUIRED");
    }

    if (!user) throw new UnauthorizedException("INVALID_CREDENTIALS");
    if (!user.passwordHash) throw new UnauthorizedException("PASSWORD_NOT_SET");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("INVALID_CREDENTIALS");
    await this.tokens.issue(user, res);
    return this.publicUser(user);
  }

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new UnauthorizedException("REFRESH_INVALID");
    let payload: JwtPayload & { typ?: string };
    try {
      payload = await this.jwt.verifyAsync<JwtPayload & { typ?: string }>(raw, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException("REFRESH_INVALID");
    }
    if (payload.typ !== "refresh" || !payload.sub) throw new UnauthorizedException("REFRESH_INVALID");

    const stored = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, expiresAt: { gt: new Date() } },
    });
    let matchedId: string | undefined;
    for (const row of stored) {
      if (await bcrypt.compare(raw, row.tokenHash)) {
        matchedId = row.id;
        break;
      }
    }
    if (!matchedId) throw new UnauthorizedException("REFRESH_INVALID");
    await this.prisma.refreshToken.delete({ where: { id: matchedId } });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException("REFRESH_INVALID");
    await this.tokens.issue(user, res);
    return this.publicUser(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async logout(res: Response, userId?: string, refreshRaw?: string) {
    let uid = userId;
    if (!uid && refreshRaw) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(refreshRaw, {
          secret: process.env.JWT_REFRESH_SECRET,
        });
        uid = payload.sub;
      } catch {
        uid = undefined;
      }
    }
    if (uid) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: uid } });
    }
    this.tokens.clear(res);
    return { ok: true };
  }
}
