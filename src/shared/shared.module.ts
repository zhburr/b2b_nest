import { Global, Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Global()
@Module({
  providers: [SharedService],
  exports: [SharedService],
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'zohaib.ur.rehman97@gmail.com',
          pass: 'piygwpnqberxzray',
        },
      },
    }),
  ],
})
export class SharedModule {}
