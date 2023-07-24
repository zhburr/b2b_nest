import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

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
