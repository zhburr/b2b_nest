import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { env } from 'process';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: 'mysql://b2b_dev:@Aamjed12345@141.136.42.56:3306/b2b_dev',
        },
      },
    });
  }
}
