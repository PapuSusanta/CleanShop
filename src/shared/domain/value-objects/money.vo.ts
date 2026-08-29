import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../exceptions/application.exception';

export class Money {
  constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {}

  create(amount: number, currency: string = 'INR'): Money {
    if (amount < 0) {
      throw new ApplicationException(
        'Amount cannot be negative',
        ApplicationExceptionCode.VALIDATION_ERROR,
      );
    }
    const normalizedAmount = Math.round(amount * 100) / 100;
    return new Money(normalizedAmount, currency.toUpperCase());
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }
}
