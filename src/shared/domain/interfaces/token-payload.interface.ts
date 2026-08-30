import type { Role } from '../enums/role.enum';

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}
