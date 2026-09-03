import { DomainException } from '../exceptions/domain.exception';

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DEFAULT_CURRENCY = 'INR';

/**
 * Immutable monetary amount. Amounts are normalised to two decimals and
 * arithmetic between different currencies is rejected.
 */
export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {}

  static create(amount: number, currency: string = DEFAULT_CURRENCY): Money {
    if (!Number.isFinite(amount)) {
      throw new DomainException('Amount must be a finite number');
    }
    if (amount < 0) {
      throw new DomainException('Amount cannot be negative');
    }

    const normalizedCurrency = currency?.trim().toUpperCase() ?? '';
    if (!CURRENCY_PATTERN.test(normalizedCurrency)) {
      throw new DomainException(
        `'${currency}' is not a valid ISO 4217 currency code`,
      );
    }

    return new Money(Money.round(amount), normalizedCurrency);
  }

  static zero(currency: string = DEFAULT_CURRENCY): Money {
    return Money.create(0, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this._amount + other.amount, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this._amount - other.amount, this._currency);
  }

  multiply(factor: number): Money {
    return Money.create(this._amount * factor, this._currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount > other.amount;
  }

  equals(other?: Money | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Money)) {
      return false;
    }
    return other.amount === this._amount && other.currency === this._currency;
  }

  toString(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this._currency) {
      throw new DomainException(
        `Cannot operate on ${this._currency} and ${other.currency} amounts`,
      );
    }
  }

  private static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
