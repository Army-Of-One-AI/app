import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from 'src/shared/config/config';
import { AuthUser } from 'src/shared/types/types';

@Injectable()
export default class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const cfg = config.getJWTConfig();
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = req.cookies as Record<string, unknown>;
          const accessToken = cookies.access_token;
          return typeof accessToken === 'string' ? accessToken : null;
        },
      ]),
      secretOrKey: cfg.secret,
      ignoreExpiration: false,
    });
  }

  validate(payload: { sub: string }): AuthUser {
    return { id: payload.sub };
  }
}
