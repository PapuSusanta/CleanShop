import { mkdirSync, writeFileSync } from 'node:fs'

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger'

import { AppModule } from '../src/app.module'

async function generate() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('Clean Shop API')
    .setDescription('REST API for Clean Shop')
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Local')
    .build()

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config)

  // Optional: make the output more Postman-friendly
  document.info.contact = {
    name: 'API Team',
  }

  document.info.license = {
    name: 'MIT',
  }

  mkdirSync('./docs', { recursive: true })

  writeFileSync(
    './docs/openapi.json',
    JSON.stringify(document, null, 2),
    'utf8',
  )

  await app.close()
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
