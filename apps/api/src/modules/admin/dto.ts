import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Currency, MedicalTag, OrderStatus, ProductStatus } from "@prisma/client";

export class UpsertProductDto {
  @IsString()
  slug!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  datasheetUrl?: string;

  @IsString()
  nameFa!: string;

  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsString()
  descriptionFa?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  variants?: {
    sku: string;
    titleFa: string;
    titleEn: string;
    priceIrr: number;
    priceUsd?: number;
    priceEur?: number;
    stock: number;
  }[];

  @IsOptional()
  images?: { url: string; altFa?: string; altEn?: string }[];

  @IsOptional()
  relatedIds?: string[];
}

export class UpsertCategoryDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  medicalTag?: MedicalTag;

  @IsString()
  nameFa!: string;

  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CouponAdminDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsInt()
  percentOff?: number;

  @IsOptional()
  @IsInt()
  amountIrr?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateOrderDto {
  @IsOptional()
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsString()
  carrier?: string;
}

export class ShippingRateDto {
  @IsString()
  provinceId!: string;

  @IsInt()
  @Min(0)
  priceIrr!: number;

  @IsOptional()
  @IsInt()
  priceUsd?: number;

  @IsOptional()
  @IsInt()
  priceEur?: number;
}

export class BannerDto {
  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  href?: string;

  @IsOptional()
  @IsString()
  titleFa?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;
}

export class BlogAdminDto {
  @IsString()
  slug!: string;

  @IsString()
  titleFa!: string;

  @IsString()
  titleEn!: string;

  @IsString()
  excerptFa!: string;

  @IsString()
  excerptEn!: string;

  @IsString()
  bodyFa!: string;

  @IsString()
  bodyEn!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

export class AdjustWalletDto {
  @IsInt()
  amount!: number;

  @IsOptional()
  currency?: Currency;
}
