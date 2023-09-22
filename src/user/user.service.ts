import { Injectable } from '@nestjs/common';
import { PaymentType, Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import { AddNewPaymentDTO, GetPaymentDTO, UpdateUserDTO } from './dto';

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
        id: true,
        role: true,
        canUploadOrder: true,
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

  async addNewPayment(payload: AddNewPaymentDTO): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      const latestPayment = await tx.payment.findFirst({
        where: {
          userId: user.id,
          user: {
            email: payload.email,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const availableBalance = latestPayment
        ? payload.paymentType === PaymentType.Credit
          ? Number(latestPayment.availableBalance) + Number(payload.amount)
          : Number(latestPayment.availableBalance) - Number(payload.amount)
        : payload.paymentType === PaymentType.Credit
        ? Number(payload.amount)
        : Number(payload.amount) * -1;

      const addNewPayment = await tx.payment.create({
        data: {
          userId: user.id,
          paymentType: payload.paymentType,
          amount: payload.amount,
          description: payload.description,
          availableBalance: availableBalance,
        },
      });
    });

    return true;
  }

  async getPaymentList(dto: GetPaymentDTO) {
    const data = await this.prisma.payment.findMany({
      where: {
        user: {
          email: dto.email,
        },
        createdAt: {
          gte: `${dto.startDate}T00:00:00.000Z`, // Correctly formatted ISO-8601 DateTime
          lte: `${dto.endDate}T23:59:59.999Z`, // Correctly formatted ISO-8601 DateTime
        },
      },
    });

    return data;
  }
}
