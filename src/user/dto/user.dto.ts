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
