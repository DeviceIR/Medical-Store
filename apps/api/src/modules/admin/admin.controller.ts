import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AdminService } from "./admin.service";
import {
  AdjustWalletDto,
  BannerDto,
  BlogAdminDto,
  CouponAdminDto,
  ShippingRateDto,
  UpdateOrderDto,
  UpsertCategoryDto,
  UpsertProductDto,
} from "./dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Get("products")
  products() {
    return this.admin.products();
  }

  @Post("products")
  createProduct(@Body() dto: UpsertProductDto) {
    return this.admin.upsertProduct(dto);
  }

  @Patch("products/:id")
  updateProduct(@Param("id") id: string, @Body() dto: UpsertProductDto) {
    return this.admin.upsertProduct(dto, id);
  }

  @Delete("products/:id")
  @Roles("ADMIN")
  deleteProduct(@Param("id") id: string) {
    return this.admin.deleteProduct(id);
  }

  @Get("categories")
  categories() {
    return this.admin.categories();
  }

  @Post("categories")
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.admin.upsertCategory(dto);
  }

  @Get("orders")
  orders() {
    return this.admin.orders();
  }

  @Patch("orders/:id")
  updateOrder(@Param("id") id: string, @Body() dto: UpdateOrderDto) {
    return this.admin.updateOrder(id, dto);
  }

  @Get("users")
  users() {
    return this.admin.users();
  }

  @Patch("users/:id/wallet")
  @Roles("ADMIN")
  wallet(@Param("id") id: string, @Body() dto: AdjustWalletDto) {
    return this.admin.adjustWallet(id, dto);
  }

  @Get("coupons")
  coupons() {
    return this.admin.coupons();
  }

  @Post("coupons")
  coupon(@Body() dto: CouponAdminDto) {
    return this.admin.upsertCoupon(dto);
  }

  @Post("shipping")
  shipping(@Body() dto: ShippingRateDto) {
    return this.admin.upsertShipping(dto);
  }

  @Get("banners")
  banners() {
    return this.admin.banners();
  }

  @Post("banners")
  banner(@Body() dto: BannerDto) {
    return this.admin.createBanner(dto);
  }

  @Post("blog")
  blog(@Body() dto: BlogAdminDto, @CurrentUser() user: JwtPayload) {
    return this.admin.createBlog(dto, user.sub);
  }
}
