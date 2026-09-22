import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class CouponDto {
  @IsString()
  code!: string;
}

export class CurrencyDto {
  @IsOptional()
  @IsString()
  currency?: string;
}
