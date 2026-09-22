import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { IRAN_PHONE_REGEX, normalizeIranPhone, normalizeOtpCode } from "@medical/shared";

/** Normalize Iranian mobiles before validation. */

function emptyToUndef({ value }: { value: unknown }) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function toPhone({ value }: { value: unknown }) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return normalizeIranPhone(value);
}

export class RequestOtpDto {
  @Transform(toPhone)
  @Matches(IRAN_PHONE_REGEX, { message: "INVALID_PHONE" })
  phone!: string;
}

export class VerifyOtpDto {
  @Transform(toPhone)
  @Matches(IRAN_PHONE_REGEX, { message: "INVALID_PHONE" })
  phone!: string;

  @Transform(({ value }) => (typeof value === "string" ? normalizeOtpCode(value) : value))
  @IsString()
  @MinLength(4, { message: "OTP_INVALID" })
  @MaxLength(8, { message: "OTP_INVALID" })
  code!: string;
}

export class RegisterDto {
  @Transform(({ value }) => {
    const v = emptyToUndef({ value });
    return typeof v === "string" ? v.toLowerCase() : v;
  })
  @IsOptional()
  @IsEmail({}, { message: "INVALID_EMAIL" })
  email?: string;

  @Transform(toPhone)
  @IsOptional()
  @Matches(IRAN_PHONE_REGEX, { message: "INVALID_PHONE" })
  phone?: string;

  @IsString()
  @MinLength(8, { message: "PASSWORD_SHORT" })
  password!: string;

  @Transform(emptyToUndef)
  @IsString()
  @MinLength(2, { message: "NAME_REQUIRED" })
  name!: string;
}

export class LoginDto {
  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  identifier?: string;

  @Transform(({ value }) => {
    const v = emptyToUndef({ value });
    return typeof v === "string" ? v.toLowerCase() : v;
  })
  @IsOptional()
  @IsEmail({}, { message: "INVALID_EMAIL" })
  email?: string;

  @Transform(toPhone)
  @IsOptional()
  @Matches(IRAN_PHONE_REGEX, { message: "INVALID_PHONE" })
  phone?: string;

  @IsString()
  @MinLength(1, { message: "INVALID_CREDENTIALS" })
  password!: string;
}
