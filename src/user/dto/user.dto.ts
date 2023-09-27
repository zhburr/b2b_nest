import { PaymentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDTO {
  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  selectedUserId: number;

  @IsNotEmpty()
  @IsBoolean()
  selectedUserVat: boolean;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  selecteUserBalance: number;

  @IsNotEmpty()
  @IsBoolean()
  selectedUserCanUploadOrder: boolean;
}

export class AddNewPaymentDTO {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  paymentType: PaymentType;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  amount: number;

  @IsNotEmpty()
  description: string;
}

export class GetPaymentDTO {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  startDate: string;

  @IsNotEmpty()
  endDate: string;
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
