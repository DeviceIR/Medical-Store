import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../guards/jwt-auth.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<{ user?: JwtPayload }>().user,
);
