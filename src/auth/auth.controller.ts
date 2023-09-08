import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CsvDto,
  LoginDto,
  RegisterDto,
  resetPasswordDto,
  verifyEmailDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CsvValidationPipe } from './csv-validation.pipe';
import { Public } from 'src/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
