import { OrderUpload } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class OrderCSVDTO {
  @IsNotEmpty()
  BuyerName: string;

  @IsNotEmpty()
  BuyerAddress1: string;

  BuyerAddress2: string;

  @IsNotEmpty()
  BuyerCity: string;

  @IsNotEmpty()
  BuyerCountry: string;

  @IsNotEmpty()
  BuyerPostCode: string;

  @IsNotEmpty()
  ProductSKU: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  ProductQuantity: number;
}

export class UpsertPostageDTO {
  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  weightFrom: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  weightTo: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  id: number;
}

export class UpdateOrderDTO {
  @IsBoolean()
  @IsNotEmpty()
  paid: boolean;

  @IsBoolean()
  @IsNotEmpty()
  delivered: boolean;

  @IsNotEmpty()
  @IsNumber()
  orderId: number;
}

export class OrderLinePaginationDTO {
  @IsNotEmpty()
  @IsNumber()
  pageIndex: number;

  @IsNotEmpty()
  @IsNumber()
  pageSize: number;

  @IsNotEmpty()
  @IsNumber()
  orderId: number;
}

export class UpdateOrderLineDTO {
  @IsNotEmpty()
  @IsNumber()
  orderLineId: number;

  @IsString()
  trackingNo: string;

  @IsString()
  trackingCompany: string;
}
