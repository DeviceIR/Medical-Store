import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class CreateAddressDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsString()
  provinceId!: string;

  @IsString()
  cityId!: string;

  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}
