import { IsEmail, IsOptional, IsString } from "class-validator";
import { PaymentProvider } from "@prisma/client";

export class CheckoutDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  provinceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  provider?: PaymentProvider;
}

export class VerifyPaymentDto {
  @IsString()
  authority!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  provider?: PaymentProvider;
}
