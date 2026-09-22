import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { ACCESS_COOKIE } from "@medical/shared";
import { JwtPayload } from "./jwt-auth.guard";

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return true;
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      req.user = undefined;
    }
    return true;
  }
}
