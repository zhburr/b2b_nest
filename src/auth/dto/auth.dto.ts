import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
const roles: string[] = ['Admin', 'Client', 'Customer'];

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Matches(/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/, {
    message:
      'Password must be AlphaNumeric and should include a special character.',
  })
  @MinLength(8)
  @MaxLength(20)
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsBoolean()
  isVat: boolean;

  @IsNotEmpty()
  @IsIn(roles)
  @IsString()
  registerAsa: string;
}

export class verifyEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  otp: number;
}

export class resetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  otp: number;

  @Matches(/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/, {
    message:
      'Password must be AlphaNumeric and should include a special character.',
  })
  @MinLength(8)
  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  password: string;
}
