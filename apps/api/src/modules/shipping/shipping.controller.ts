import { Controller, Get, Param, Query } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("shipping")
export class ShippingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("provinces")
  provinces() {
    return this.prisma.province.findMany({
      include: { cities: true, shippingRates: true },
      orderBy: { nameFa: "asc" },
    });
  }

  @Get("provinces/:id/cities")
  cities(@Param("id") id: string) {
    return this.prisma.city.findMany({ where: { provinceId: id }, orderBy: { nameFa: "asc" } });
  }

  @Get("quote")
  async quote(@Query("provinceId") provinceId?: string, @Query("currency") currency?: string) {
    if (!provinceId) return { shippingCost: 0, estimatedDays: 0 };
    const rate = await this.prisma.shippingRate.findUnique({ where: { provinceId } });
    if (!rate) return { shippingCost: 0, estimatedDays: 0 };
    const shippingCost =
      currency === "USD" ? rate.priceUsd : currency === "EUR" ? rate.priceEur : rate.priceIrr;
    return { shippingCost, estimatedDays: rate.estimatedDays, provinceId };
  }
}
