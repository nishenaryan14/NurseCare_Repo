import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for production and development
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    // Add your Vercel domain here after deployment
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Use PORT from environment or default to 3001
  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();

