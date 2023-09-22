import { PaymentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';

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
