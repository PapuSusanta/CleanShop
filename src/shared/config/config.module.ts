import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypesConfigService } from './config.types';

@Global()
@Module({
  providers: [
    {
      provide: TypesConfigService,
      useExisting: ConfigService,
    },
  ],
  exports: [TypesConfigService],
})
export class TypesConfigModule {}
