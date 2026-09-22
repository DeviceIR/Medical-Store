import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Locale } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories(locale: Locale = "fa") {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale } },
        _count: { select: { products: true } },
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            translations: { where: { locale } },
            _count: { select: { products: true } },
          },
        },
      },
      where: { parentId: null },
    });
  }

  brands() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } });
  }

  async products(query: {
    locale?: Locale;
    category?: string;
    brand?: string;
    tag?: string;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    take?: number;
  }) {
    const locale = query.locale ?? "fa";
    const page = Math.max(1, query.page ?? 1);
    const take = Math.min(48, query.take ?? 12);
    const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };

    if (query.category) {
      where.category = {
        OR: [{ slug: query.category }, { parent: { slug: query.category } }],
      };
    }
    if (query.brand) where.brand = { slug: query.brand };
    if (query.tag) where.category = { ...(where.category as object), medicalTag: query.tag as never };
    if (query.q) {
      where.translations = {
        some: {
          locale,
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        },
      };
    }
    if (query.minPrice || query.maxPrice) {
      where.variants = {
        some: {
          priceIrr: {
            gte: query.minPrice,
            lte: query.maxPrice,
          },
        },
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "newest" ? { createdAt: "desc" } : { featured: "desc" };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy,
        include: {
          translations: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          brand: true,
          category: { include: { translations: { where: { locale } } } },
          variants: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, take };
  }

  async bySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        translations: true,
        images: { orderBy: { sortOrder: "asc" } },
        brand: true,
        category: { include: { translations: true } },
        variants: true,
        relatedFrom: {
          include: {
            to: {
              include: {
                translations: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
                variants: true,
              },
            },
          },
        },
        certRecords: true,
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  banners() {
    return this.prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  featured(locale: Locale = "fa") {
    return this.prisma.product.findMany({
      where: { featured: true, status: "PUBLISHED" },
      take: 8,
      include: {
        translations: { where: { locale } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        variants: true,
        brand: true,
        category: { include: { translations: { where: { locale } } } },
      },
    });
  }
}
