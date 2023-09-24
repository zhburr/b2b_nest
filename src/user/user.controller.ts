import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '@prisma/client';
import { Roles as Role } from 'src/roles.decorator';
import { UserService } from './user.service';
import { AddNewPaymentDTO, GetPaymentDTO, UpdateUserDTO } from './dto';
import { SharedService } from 'src/shared/shared.service';
import { Response, Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { deleteFile } from 'src/common/helper';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Get('getAllUsers')
  @Role(Roles.Admin)
  getAllUsers() {
    return this.userService.getAllUser();
  }

  @Get('getUserData')
  @Role(Roles.Admin, Roles.Client)
  async getUserData(@Res() res: Response, @Query('email') email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      delete user.password;
      delete user.otp;
      const access_toke = await this.jwtService.signAsync(user);

      if (user.role !== Roles.Admin) {
        const latestPayment = await this.prisma.payment.findFirst({
          where: {
            userId: user.id,
            user: {
              email: email,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        Object.assign(user, {
          balance: latestPayment ? latestPayment.availableBalance : 0,
        });
      }

      Object.assign(user, {
        access_toke,
      });

      return res.status(200).send(this.sharedService.sendResponse(user, true));
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

      return res
        .status(200)
        .send(this.sharedService.sendResponse(paymentList, true));
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

  @Post('uploadUserImage')
  @Role(Roles.Client)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/usersImage',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadUserImage(
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: Response,
    @Body('email') email: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (user.avatar) {
        console.log('deleted sucessfully');

        await deleteFile(`uploads\\usersImage\\${user.avatar}`);
      }

      const updateUser = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          avatar: file.filename,
        },
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Image updated sucessfully.',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }
}
