import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, resetPasswordDto, verifyEmailDto } from './dto';
import { IsNotEmpty } from 'class-validator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verifyEmail')
  verifyEmail(@Body() dto: verifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('emailForgetPassword')
  emailForgetPassword(@Query() dto: { email: string }) {
    console.log(dto);

    return this.authService.emailForgetPassword(dto.email);
  }

  @Post('resetPassword')
  resetPassword(@Body() dto: resetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
