import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Currency } from "@prisma/client";

export class TopUpDto {
  @IsInt()
  @Min(1000)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  provider?: "ZARINPAL" | "STRIPE";
}

export class ConfirmTopUpDto {
  @IsString()
  authority!: string;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  provider?: "ZARINPAL" | "STRIPE";
}
