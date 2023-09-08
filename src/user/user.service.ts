import { Injectable } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import { UpdateUserDTO } from './dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private shareService: SharedService,
  ) {}

  async getAllUser() {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [Roles.Client, Roles.Customer],
        },
      },
      select: {
        firstName: true,
        lastName: true,
        isVat: true,
        email: true,
        balance: true,
        id: true,
        role: true,
        canUploadOrder: true,
        credit: true,
      },
    });

    return this.shareService.sendResponse(users, true);
  }

  async updateUser(dto: UpdateUserDTO) {
    const updateUser = await this.prisma.user.update({
      where: {
        id: dto.selectedUserId,
      },
      data: {
        isVat: dto.selectedUserVat,
        balance: dto.selecteUserBalance,
        canUploadOrder: dto.selectedUserCanUploadOrder,
      },
    });

    return this.shareService.sendResponse(
      updateUser,
      true,
      'User updated sucessfully',
    );
  }

  async updateUserFields(userId: number, updateData: any) {
    const update = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });

    return update;
  }
}
