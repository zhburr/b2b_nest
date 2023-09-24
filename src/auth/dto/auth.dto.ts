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
  IsNumberString,
  isEmail,
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

export class CsvDto {
  @IsNotEmpty()
  Index: number;

  @IsNotEmpty()
  Organization_Id: string;

  @IsNotEmpty()
  Name: string;

  @IsNotEmpty()
  Website: string;

  @IsNotEmpty()
  Country: string;

  @IsNotEmpty()
  Description: string;

  @IsNotEmpty()
  Founded: number;

  @IsNotEmpty()
  Industry: string;

  @IsNotEmpty()
  Number_of_employees: number;

  // Add more properties as needed
}

export class UpdatePasswordDTO {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}

export class ListingRemovalEmails {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  marketplace: string;

  @IsNotEmpty()
  @IsString()
  productURL: string;

  @IsNotEmpty()
  @IsString()
  productName: string;

  @IsNotEmpty()
  @IsString()
  meeting: string;

  @IsString()
  comment: string;
}
