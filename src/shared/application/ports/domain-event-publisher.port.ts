import type { DomainEvent } from '../../domain/events/domain-event';

export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');

/**
 * Hands the events recorded by an aggregate to whatever dispatches them.
 * The application layer depends on this port, never on a concrete event bus.
 */
export interface DomainEventPublisherPort {
  publishAll: (events: readonly DomainEvent[]) => Promise<void>;
}
