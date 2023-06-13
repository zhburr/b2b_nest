import { Global, Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Mailer } from './constant';

@Global()
@Module({
  providers: [SharedService],
  exports: [SharedService],
  imports: [
    MailerModule.forRoot({
      transport: {
        service: Mailer.mailerService,
        auth: {
          user: Mailer.mailerUser,
          pass: Mailer.mailerUserPass,
        },
      },
    }),
  ],
})
export class SharedModule {}
