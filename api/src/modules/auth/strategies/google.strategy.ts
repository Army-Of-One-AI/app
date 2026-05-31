import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { getRequiredConfig } from '../../common/config/required-config';
import type { GoogleProfileUser } from '../../common/types/auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: getRequiredConfig(configService, 'GOOGLE_CLIENT_ID'),
      clientSecret: getRequiredConfig(configService, 'GOOGLE_CLIENT_SECRET'),
      callbackURL: getRequiredConfig(configService, 'GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(new Error('Google account email is required'), undefined);
    }

    const user: GoogleProfileUser = {
      email,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, user);
  }
}
