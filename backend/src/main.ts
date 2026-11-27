import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const defaultOrigins = [
    'http://localhost:3041',
    'http://127.0.0.1:3041',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];
  const corsFromEnv = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsFromEnv.length > 0 ? corsFromEnv : defaultOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('port', 3000);
  await app.listen(port);

  Logger.log(`Dental NEU AI API listening on :${port}/api`, 'Bootstrap');
}

void bootstrap();
