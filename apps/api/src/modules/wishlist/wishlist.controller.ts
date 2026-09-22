import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class WishlistDto {
  @IsString()
  productId!: string;
}

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.prisma.wishlistItem.findMany({
      where: { userId: user.sub },
      include: {
        product: {
          include: {
            translations: true,
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            variants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post()
  add(@CurrentUser() user: JwtPayload, @Body() dto: WishlistDto) {
    return this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.sub, productId: dto.productId } },
      update: {},
      create: { userId: user.sub, productId: dto.productId },
    });
  }

  @Delete(":productId")
  async remove(@CurrentUser() user: JwtPayload, @Param("productId") productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId: user.sub, productId } });
    return { ok: true };
  }
}
