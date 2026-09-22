import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import * as bcrypt from "bcryptjs";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@medical/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthTokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  cookieOpts(maxAge: number) {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    };
  }

  async issue(user: { id: string; role: string }, res: Response) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });
    const access = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "15m" },
    );
    const refreshRaw = await this.jwt.signAsync(
      { sub: user.id, role: user.role, typ: "refresh" },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "7d" },
    );
    const tokenHash = await bcrypt.hash(refreshRaw, 8);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    res.cookie(ACCESS_COOKIE, access, this.cookieOpts(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE, refreshRaw, this.cookieOpts(7 * 24 * 60 * 60 * 1000));
  }

  clear(res: Response) {
    const base = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  }
}
