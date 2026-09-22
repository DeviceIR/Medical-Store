import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { WalletService } from "./wallet.service";
import { ConfirmTopUpDto, TopUpDto } from "./dto";

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.wallet.get(user.sub);
  }

  @Post("top-up")
  topUp(@CurrentUser() user: JwtPayload, @Body() dto: TopUpDto) {
    return this.wallet.topUp(user.sub, dto.amount, dto.currency ?? "IRR", dto.provider ?? "ZARINPAL");
  }

  @Post("top-up/confirm")
  confirm(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmTopUpDto) {
    return this.wallet.confirmTopUp(user.sub, dto.authority, dto.provider);
  }
}
