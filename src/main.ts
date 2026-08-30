import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TypesConfigService } from './shared/config/config.types';
import { ApplicationExceptionFilter } from './shared/infrastructure/filters/application-exception.filter';
import { DomainExceptionFilter } from './shared/infrastructure/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuration = app.get(TypesConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Clean Shop API')
    .setDescription('The clean shop API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  const options: SwaggerCustomOptions = {
    ui: true,
    raw: ['json', 'yaml'],
    customSiteTitle: 'User Service',
    explorer: true,
    customCss: '.topbar { display:none; }',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      docExpansion: 'none',
      displayRequestDuration: true,
    },

    // Modify the OpenAPI document before serving
    patchDocumentOnRequest: (req, res, doc) => {
      doc.info.title = 'Modified API';
      return doc;
    },
  };

  SwaggerModule.setup('docs', app, documentFactory, options);

  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new ApplicationExceptionFilter(),
  );

  app.enableShutdownHooks();

  const PORT = configuration.getOrThrow<number>('PORT');
  await app.listen(PORT);
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
