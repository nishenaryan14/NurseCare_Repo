"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Enable CORS
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3000'], // Allow both frontend and backend origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, // Allow cookies and authorization headers
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true, // 👈 this is critical
        transformOptions: { enableImplicitConversion: true },
    }));
    await app.listen(3001);
}
bootstrap();
