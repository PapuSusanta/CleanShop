import { Global, Module } from '@nestjs/common';
import { MongoProvider } from './mongo.provider';
import { MongoService } from './mongo.service';

@Global()
@Module({
  providers: [MongoService, MongoProvider],
  exports: [MongoService, MongoProvider],
})
export class MongoModule {}
