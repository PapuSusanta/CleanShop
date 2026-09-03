import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER } from '../../application/ports/domain-event-publisher.port';
import { CqrsDomainEventPublisher } from './cqrs-domain-event-publisher';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [
    {
      provide: DOMAIN_EVENT_PUBLISHER,
      useClass: CqrsDomainEventPublisher,
    },
  ],
  exports: [DOMAIN_EVENT_PUBLISHER],
})
export class DomainEventsModule {}
