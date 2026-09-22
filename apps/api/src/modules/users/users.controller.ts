import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { CreateAddressDto, UpdateProfileDto } from "./dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch("me")
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @Get("me/addresses")
  addresses(@CurrentUser() user: JwtPayload) {
    return this.users.listAddresses(user.sub);
  }

  @Post("me/addresses")
  createAddress(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(user.sub, dto);
  }

  @Delete("me/addresses/:id")
  deleteAddress(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.users.deleteAddress(user.sub, id);
  }
}
