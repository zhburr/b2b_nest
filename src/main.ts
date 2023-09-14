import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RolesGuard } from './role.guard';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'OPTIONS', 'PATCH', 'DELETE', 'POST', 'PUT'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalGuards(new RolesGuard(new Reflector()));
  await app.listen(process.env.PORT);
}
bootstrap();
