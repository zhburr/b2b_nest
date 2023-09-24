import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ListingRemovalEmails,
  LoginDto,
  RegisterDto,
  UpdatePasswordDTO,
  resetPasswordDto,
  verifyEmailDto,
} from './dto';
import { Public } from 'src/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response, Request } from 'express';
import { SharedService } from 'src/shared/shared.service';
import { Roles } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private sharedService: SharedService,
  ) {}

  @Post('login')
  @Public()
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @Public()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verifyEmail')
  @Public()
  verifyEmail(@Body() dto: verifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('emailForgetPassword')
  @Public()
  emailForgetPassword(@Query() dto: { email: string }) {
    return this.authService.emailForgetPassword(dto.email);
  }

  @Post('resetPassword')
  @Public()
  resetPassword(@Body() dto: resetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('updatePassword')
  // @Role(Roles.Admin, Roles.Client)
  @Public()
  async updatePassword(@Res() res: Response, @Body() dto: UpdatePasswordDTO) {
    try {
      const checkCurrentPassword = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      const pwMatch = await bcrypt.compare(
        dto.currentPassword,
        checkCurrentPassword.password,
      );

      if (!pwMatch) {
        return res
          .status(500)
          .send(
            this.sharedService.sendResponse(
              null,
              false,
              'Your current password is not correct.',
            ),
          );
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);
      const update = await this.prisma.user.update({
        where: {
          email: dto.email,
        },
        data: {
          password: hash,
        },
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Password has been updated sucessfully',
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

  @Post('listingRemovalEmail')
  @Public()
  async listingRemovalEmails(
    @Res() res: Response,
    @Body() dto: ListingRemovalEmails,
  ) {
    try {
      const allAdmin = await this.prisma.user.findMany({
        where: {
          role: Roles.Admin,
        },
      });

      const adminEmailHtml = `
      <p>Hi</p>
      <p>${dto.name} has requested for listing removal. Following are the details</p>
      <p>Email : ${dto.email}</p>
      <p>Marketplace : ${dto.marketplace}</p>
      <p>Product name : ${dto.productName} </p>
      <p>Product url : ${dto.productURL}</p>
      <p>Meeting date : ${dto.meeting}</p>
      <p>Additional comment : ${dto.comment}</p>
      `;

      for (let admin of allAdmin) {
        await this.sharedService.sendEmail(
          admin.email,
          'Listing removal request.',
          adminEmailHtml,
        );
      }

      const userEmailHtml = `
      <p>Hi</p>
      <p>Your request has been received for listing removal. Following are the details</p>
      <p>Email : ${dto.email}</p>
      <p>Marketplace : ${dto.marketplace}</p>
      <p>Product name : ${dto.productName} </p>
      <p>Product url : ${dto.productURL}</p>
      <p>Meeting date : ${dto.meeting}</p>
      <p>Additional comment : ${dto.comment}</p>
      `;

      await this.sharedService.sendEmail(
        dto.email,
        'Listing removal request.',
        userEmailHtml,
      );

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Email has been sent for listing removal.',
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
