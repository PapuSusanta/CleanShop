export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasherPort {
  hash: (plain: string) => Promise<string>;
  compare: (plain: string, hashed: string) => Promise<boolean>;
}
