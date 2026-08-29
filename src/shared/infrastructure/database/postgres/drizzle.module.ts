import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './drizzle.provider';
import { DrizzleService } from './drizzle.service';

@Global()
@Module({
  providers: [DrizzleService, DrizzleProvider],
  exports: [DrizzleProvider, DrizzleService],
})
export class DrizzleModule {}
