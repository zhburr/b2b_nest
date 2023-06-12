import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SharedService {
  constructor(private mailService: MailerService) {}
  generateRandomOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async sendEmail(toEmail: string, subject: string, emailHtml: string) {
    await this.mailService.sendMail({
      from: '"B2bDirect" <zohaib.ur.rehman97@gmail.com>',
      to: toEmail, // list of receivers
      subject: subject, // Subject line
      text: '',
      html: emailHtml,
    });
  }

  sendResponse<Type>(
    body: Type,
    succeed: boolean,
    message?: string,
  ): { Content: Type; Succeed: boolean; message?: string } {
    return {
      Content: body,
      Succeed: succeed,
      message: message,
    };
  }
}
