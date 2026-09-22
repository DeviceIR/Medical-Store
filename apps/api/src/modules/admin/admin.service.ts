import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SmsService } from "../sms/sms.service";
import { OrdersService } from "../orders/orders.service";
import {
  AdjustWalletDto,
  BannerDto,
  BlogAdminDto,
  CouponAdminDto,
  ShippingRateDto,
  UpdateOrderDto,
  UpdateUserRoleDto,
  UpsertCategoryDto,
  UpsertProductDto,
} from "./dto";

const STATUS_FA: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت",
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly orders: OrdersService,
  ) {}

  stats() {
    return this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } }),
      this.prisma.product.count(),
      this.prisma.user.count(),
    ]).then(([orders, revenue, products, users]) => ({
      orders,
      revenueIrr: revenue._sum.total ?? 0,
      products,
      users,
    }));
  }

  products() {
    return this.prisma.product.findMany({
      include: { translations: true, variants: true, category: true, brand: true, images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsertProduct(dto: UpsertProductDto, id?: string) {
    const data = {
      slug: dto.slug,
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      status: dto.status ?? "PUBLISHED",
      certifications: dto.certifications ?? [],
      featured: dto.featured ?? false,
      datasheetUrl: dto.datasheetUrl,
    };
    const product = id
      ? await this.prisma.product.update({ where: { id }, data })
      : await this.prisma.product.create({ data });

    await this.prisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "fa" } },
      update: { name: dto.nameFa, description: dto.descriptionFa ?? "" },
      create: { productId: product.id, locale: "fa", name: dto.nameFa, description: dto.descriptionFa ?? "" },
    });
    await this.prisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "en" } },
      update: { name: dto.nameEn, description: dto.descriptionEn ?? "" },
      create: { productId: product.id, locale: "en", name: dto.nameEn, description: dto.descriptionEn ?? "" },
    });

    if (dto.variants) {
      for (const v of dto.variants) {
        await this.prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {
            titleFa: v.titleFa,
            titleEn: v.titleEn,
            priceIrr: v.priceIrr,
            priceUsd: v.priceUsd ?? 0,
            priceEur: v.priceEur ?? 0,
            stock: v.stock,
            productId: product.id,
          },
          create: {
            sku: v.sku,
            titleFa: v.titleFa,
            titleEn: v.titleEn,
            priceIrr: v.priceIrr,
            priceUsd: v.priceUsd ?? 0,
            priceEur: v.priceEur ?? 0,
            stock: v.stock,
            productId: product.id,
          },
        });
      }
    }

    if (dto.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: product.id } });
      await this.prisma.productImage.createMany({
        data: dto.images.map((img, i) => ({
          productId: product.id,
          url: img.url,
          altFa: img.altFa,
          altEn: img.altEn,
          sortOrder: i,
        })),
      });
    }

    if (dto.relatedIds) {
      await this.prisma.relatedProduct.deleteMany({ where: { fromId: product.id } });
      if (dto.relatedIds.length) {
        await this.prisma.relatedProduct.createMany({
          data: dto.relatedIds.map((toId) => ({ fromId: product.id, toId })),
        });
      }
    }

    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: { translations: true, variants: true, images: true },
    });
  }

  deleteProduct(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  categories() {
    return this.prisma.category.findMany({ include: { translations: true } });
  }

  async upsertCategory(dto: UpsertCategoryDto, id?: string) {
    const category = id
      ? await this.prisma.category.update({
          where: { id },
          data: { slug: dto.slug, parentId: dto.parentId, medicalTag: dto.medicalTag, sortOrder: dto.sortOrder },
        })
      : await this.prisma.category.create({
          data: { slug: dto.slug, parentId: dto.parentId, medicalTag: dto.medicalTag, sortOrder: dto.sortOrder ?? 0 },
        });
    await this.prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: "fa" } },
      update: { name: dto.nameFa },
      create: { categoryId: category.id, locale: "fa", name: dto.nameFa },
    });
    await this.prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
      update: { name: dto.nameEn },
      create: { categoryId: category.id, locale: "en", name: dto.nameEn },
    });
    return category;
  }

  orders() {
    return this.prisma.order.findMany({
      include: { items: true, payments: true, shipment: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    if (dto.status === "REFUNDED") {
      return this.orders.refund(id);
    }
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: true },
    });
    if (!order) throw new NotFoundException();
    if (dto.status === "CANCELLED" && order.status === "PENDING_PAYMENT") {
      await this.orders.release(id);
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status, reservedUntil: dto.status === "CANCELLED" ? null : undefined },
    });
    if (dto.trackingCode || dto.carrier) {
      await this.prisma.shipment.upsert({
        where: { orderId: id },
        update: { trackingCode: dto.trackingCode, carrier: dto.carrier, status: dto.status ?? "processing" },
        create: {
          orderId: id,
          trackingCode: dto.trackingCode,
          carrier: dto.carrier,
          status: dto.status ?? "processing",
          shippedAt: dto.status === "SHIPPED" ? new Date() : undefined,
        },
      });
    }
    const phone = order.user?.phone ?? order.guestPhone;
    if (dto.status && phone) {
      await this.sms.sendOrderStatus(phone, order.number, STATUS_FA[dto.status] ?? dto.status);
      await this.prisma.order.update({ where: { id }, data: { smsNotifiedAt: new Date() } });
    }
    return updated;
  }

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        wallet: true,
      },
    });
  }

  coupons() {
    return this.prisma.coupon.findMany({ orderBy: { code: "asc" } });
  }

  upsertCoupon(dto: CouponAdminDto) {
    return this.prisma.coupon.upsert({
      where: { code: dto.code.toUpperCase() },
      update: {
        percentOff: dto.percentOff,
        amountIrr: dto.amountIrr,
        active: dto.active ?? true,
        minOrderIrr: dto.minOrderIrr,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      create: {
        code: dto.code.toUpperCase(),
        percentOff: dto.percentOff,
        amountIrr: dto.amountIrr,
        active: dto.active ?? true,
        minOrderIrr: dto.minOrderIrr ?? 0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  upsertShipping(dto: ShippingRateDto) {
    return this.prisma.shippingRate.upsert({
      where: { provinceId: dto.provinceId },
      update: { priceIrr: dto.priceIrr, priceUsd: dto.priceUsd ?? 0, priceEur: dto.priceEur ?? 0 },
      create: {
        provinceId: dto.provinceId,
        priceIrr: dto.priceIrr,
        priceUsd: dto.priceUsd ?? 0,
        priceEur: dto.priceEur ?? 0,
      },
    });
  }

  banners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  }

  createBanner(dto: BannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  updateBanner(id: string, dto: BannerDto) {
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  deleteBanner(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  blogs() {
    return this.prisma.blogPost.findMany({ include: { translations: true }, orderBy: { createdAt: "desc" } });
  }

  createBlog(dto: BlogAdminDto, authorId?: string) {
    return this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        coverUrl: dto.coverUrl,
        published: dto.published ?? true,
        authorId,
        translations: {
          create: [
            { locale: "fa", title: dto.titleFa, excerpt: dto.excerptFa, body: dto.bodyFa },
            { locale: "en", title: dto.titleEn, excerpt: dto.excerptEn, body: dto.bodyEn },
          ],
        },
      },
      include: { translations: true },
    });
  }

  async updateBlog(id: string, dto: BlogAdminDto) {
    await this.prisma.blogPost.update({
      where: { id },
      data: { slug: dto.slug, coverUrl: dto.coverUrl, published: dto.published },
    });
    await this.prisma.blogPostTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "fa" } },
      update: { title: dto.titleFa, excerpt: dto.excerptFa, body: dto.bodyFa },
      create: { postId: id, locale: "fa", title: dto.titleFa, excerpt: dto.excerptFa, body: dto.bodyFa },
    });
    await this.prisma.blogPostTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "en" } },
      update: { title: dto.titleEn, excerpt: dto.excerptEn, body: dto.bodyEn },
      create: { postId: id, locale: "en", title: dto.titleEn, excerpt: dto.excerptEn, body: dto.bodyEn },
    });
    return this.prisma.blogPost.findUnique({ where: { id }, include: { translations: true } });
  }

  deleteBlog(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  updateUserRole(id: string, dto: UpdateUserRoleDto) {
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, phone: true, name: true, role: true },
    });
  }

  async adjustWallet(userId: string, dto: AdjustWalletDto) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const currency = dto.currency ?? "IRR";
    const field = currency === "USD" ? "balanceUsd" : currency === "EUR" ? "balanceEur" : "balanceIrr";
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { [field]: { increment: dto.amount } },
    });
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: dto.amount >= 0 ? "CREDIT" : "DEBIT",
        amount: Math.abs(dto.amount),
        currency,
        description: "Admin adjustment",
      },
    });
    return this.prisma.wallet.findUnique({ where: { id: wallet.id } });
  }
}
