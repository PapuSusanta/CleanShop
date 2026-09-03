import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { Email } from './email.vo';

describe('email value object', () => {
  it('normalises case and surrounding whitespace', () => {
    expect(Email.create('  Ada@Example.COM ').value).toBe('ada@example.com');
  });

  it('compares normalised values', () => {
    expect(Email.create('ada@example.com').equals(Email.create('ADA@EXAMPLE.COM'))).toBe(true);
    expect(Email.create('ada@example.com').equals(Email.create('grace@example.com'))).toBe(false);
  });

  it.each(['', '   ', 'not-an-email', 'ada@', '@example.com', 'ada@example'])(
    'rejects %p',
    (value) => {
      expect(() => Email.create(value)).toThrow(DomainException);
    },
  );
});
