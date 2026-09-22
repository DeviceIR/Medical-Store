import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), "storage"), { prefix: "/uploads/" });

  const swagger = new DocumentBuilder()
    .setTitle("Medical Instruments API")
    .setDescription("Bilingual medical e-commerce API")
    .setVersion("1.0")
    .addCookieAuth("access_token")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API http://localhost:${port}/api/v1`);
  console.log(`Swagger http://localhost:${port}/api/docs`);
}

bootstrap();
