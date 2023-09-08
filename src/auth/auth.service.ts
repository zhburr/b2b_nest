import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto, resetPasswordDto, verifyEmailDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SharedService } from 'src/shared/shared.service';
import { Roles } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private sharedService: SharedService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) return new ForbiddenException('Credentials incorrect');

    const pwMatch = await bcrypt.compare(dto.password, user.password);
    if (!pwMatch) return new ForbiddenException('Credentials incorrect');
    if (!user.emailVerified) {
      const otp = this.sharedService.generateRandomOtp();
      await this.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          otp: otp,
        },
      });

      const emailHtml: any = `<h3>Dear ${user.firstName}</h3><p>Thank you for joining B2BDirect team! We are thrilled to have you as a new member of our platform.This eamil serves as confirmation email of your account creation. To access your account and start exploring the exciting features of B2B Direct, please enter the OTP : ${otp} to verify your eamil</p><h4>Best Regards</h4><h4>B2B Direct</h4>`;

      await this.sharedService.sendEmail(
        user.email,
        'Email Verification',
        emailHtml,
      );

      delete user.password;
      delete user.otp;

      return this.sharedService.sendResponse(
        user,
        false,
        'Verify your account first',
      );
    }

    delete user.password;
    delete user.otp;
    const access_toke = await this.jwtService.signAsync(user);
    Object.assign(user, { access_toke });
    return this.sharedService.sendResponse(user, true);
  }

  async register(dto: RegisterDto) {
    try {
      console.log({ dto });

      const hash = await bcrypt.hash(dto.password, 10);
      const otp = this.sharedService.generateRandomOtp();

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isVat: dto.isVat,
          otp: otp,
          role: Roles[dto.registerAsa],
        },
      });

      const emailHtml: any = `<h3>Dear ${user.firstName}</h3><p>Thank you for joining B2BDirect team! We are thrilled to have you as a new member of our platform.This eamil serves as confirmation email of your account creation. To access your account and start exploring the exciting features of B2B Direct, please enter the OTP : ${user.otp} to verify your eamil</p><h4>Best Regards</h4><h4>B2B Direct</h4>`;

      await this.sharedService.sendEmail(
        dto.email,
        'Email Verification',
        emailHtml,
      );

      delete user.password;
      delete user.otp;

      return this.sharedService.sendResponse(
        user,
        true,
        'Your account has been created please verify your account now',
      );
    } catch (error) {
      console.log(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
    }
  }

  async verifyEmail(dto: verifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) return new ForbiddenException('Credentials incorrect');

    if (dto.otp !== user.otp) return new ForbiddenException('OTP is incorrect');

    await this.prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        otp: null,
        emailVerified: true,
      },
    });

    delete user.password;
    delete user.otp;

    return this.sharedService.sendResponse(
      {},
      true,
      'Your account has been verified',
    );
  }

  async emailForgetPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) return new ForbiddenException('Email not found');

    const otp = this.sharedService.generateRandomOtp();
    const frontendURL = this.configService.get<string>('FRONTEND_URL');
    const emailHtml = `<h3>Dear ${user.firstName}</h3>
    <p>
      You can reset your password by clicking on link below.
      if you didn't request changing your password ignore it
    </p>
    <a style="color:blue;cursor:pointer;text-decoration:underline" href="${frontendURL}/reset-password/${otp}/${user.email}" target="_blank">Reset Password</a>
    <h4>Best Regards</h4><h4>B2B Direct</h4>`;

    await this.prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        otp: otp,
      },
    });

    await this.sharedService.sendEmail(user.email, 'Reset password', emailHtml);

    return this.sharedService.sendResponse(
      {},
      true,
      'An email has been sent to reset your password',
    );
  }

  async resetPassword(dto: resetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    if (!user) return new ForbiddenException('Email not found');

    if (dto.otp !== user.otp)
      return new ForbiddenException('Generate a new link to continue');

    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        otp: null,
        password: hash,
      },
    });

    return this.sharedService.sendResponse(
      {},
      true,
      'Your password has been reset',
    );
  }

  async test(file: Express.Multer.File) {
    // const csvjson = await csv().fromFile(file.path);
    // console.log(csvjson);
    // fs.unlink(file.path, (err) => {
    //   if (err) {
    //     console.error(err);
    //   }
    // });
  }
}
