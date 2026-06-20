import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`NestJS backend listening on port ${port}`);
}

bootstrap();
