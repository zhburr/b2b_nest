import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { Roles as Role } from 'src/roles.decorator';
import { UserService } from './user.service';
import { AddNewPaymentDTO, GetPaymentDTO, UpdateUserDTO } from './dto';
import { SharedService } from 'src/shared/shared.service';
import { Response, Request } from 'express';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private sharedService: SharedService,
  ) {}

  @Get('getAllUsers')
  @Role(Roles.Admin)
  getAllUsers() {
    return this.userService.getAllUser();
  }

  @Post('updateUser')
  @Role(Roles.Admin)
  updateUser(@Body() dto: UpdateUserDTO) {
    return this.userService.updateUser(dto);
  }

  @Post('addPayment')
  @Role(Roles.Admin)
  async addNewPayment(@Res() res: Response, @Body() dto: AddNewPaymentDTO) {
    try {
      const newPayment = await this.userService.addNewPayment(dto);
      if (!newPayment) {
        return res
          .status(500)
          .send(
            this.sharedService.sendResponse(
              '',
              false,
              'Something went wrong.Try again later.',
            ),
          );
      }

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Payment added sucessfully.',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(
            '',
            false,
            'Something went wrong.Try again later.',
          ),
        );
    }
  }

  @Post('getPaymentList')
  @Role(Roles.Admin, Roles.Client)
  async getPayment(@Res() res: Response, @Body() dto: GetPaymentDTO) {
    try {
      const paymentList = await this.userService.getPaymentList(dto);
      console.log(paymentList);

      return res
        .status(200)
        .send(this.sharedService.sendResponse(paymentList, true));
    } catch (error) {
      console.log(error);

      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(
            '',
            false,
            'Something went wrong.Try again later.',
          ),
        );
    }
  }
}
