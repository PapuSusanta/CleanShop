import type { TokenPayload } from '../../../shared/domain/interfaces/token-payload.interface';
import type { TokenProviderPort } from '../../application/ports/token.port';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenProvider implements TokenProviderPort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwtService.sign(payload);
  }
}
