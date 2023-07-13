import { Packaging, Status } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  isNumber,
} from 'class-validator';

export class ProductCSVDto {
  @IsNotEmpty()
  Name: string;

  @IsNotEmpty()
  SKU: string;

  Description: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  Quantity: number;

  @Transform(({ value }) => {
    return Number(value);
  })
  Price: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  Weight: number;
}

export class UpdateProductApprovalStatus {
  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  id: number;

  @IsNotEmpty()
  @IsString()
  status: Status;

  @IsString()
  remarks: string;
}

export class GetProductsDTO {
  @IsNotEmpty()
  pageIndex: number;

  @IsNotEmpty()
  pageSize: number;
}

export class GetProductByUserIdDTO {
  @IsNotEmpty()
  pageIndex: number;

  @IsNotEmpty()
  pageSize: number;

  @IsNotEmpty()
  @IsNumber()
  selectedUserId: number;
}

export class UpdateUserProductAdminDTO {
  @IsNotEmpty()
  productPackaging: Packaging;

  @IsString()
  productLocation: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  productWeight: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  productQuantity: number;

  @IsNotEmpty()
  productId: number;
}
