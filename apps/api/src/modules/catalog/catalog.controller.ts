import { Controller, Get, Param, Query } from "@nestjs/common";
import { Locale } from "@prisma/client";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  categories(@Query("locale") locale?: Locale) {
    return this.catalog.categories(locale ?? "fa");
  }

  @Get("brands")
  brands() {
    return this.catalog.brands();
  }

  @Get("featured")
  featured(@Query("locale") locale?: Locale) {
    return this.catalog.featured(locale ?? "fa");
  }

  @Get("banners")
  banners() {
    return this.catalog.banners();
  }

  @Get("products")
  products(
    @Query("locale") locale?: Locale,
    @Query("category") category?: string,
    @Query("brand") brand?: string,
    @Query("tag") tag?: string,
    @Query("q") q?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("sort") sort?: string,
    @Query("page") page?: string,
  ) {
    return this.catalog.products({
      locale: locale ?? "fa",
      category,
      brand,
      tag,
      q,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: page ? Number(page) : 1,
    });
  }

  @Get("banners")
  banners() {
    return this.catalog.banners();
  }

  @Get("products/:slug")
  bySlug(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug);
  }
}
