import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'src/shared/config/config';
import { GoogleUser } from 'src/shared/types/types';

@Injectable()
export default class GoogleStrategy extends PassportStrategy(
  Strategy,
  'google',
) {
  constructor() {
    const cfg = config.getGoogleOAuthConfig();
    super({
      clientID: cfg.clientID,
      clientSecret: cfg.clientSecret,
      callbackURL: cfg.callbackURL,
      scope: cfg.scope,
    });
  }

  validate(_: string, __: string, profile: Profile, done: VerifyCallback) {
    const { emails, photos, name } = profile;
    const user: GoogleUser = {
      email: emails ? emails[0].value : '',
      firstName: name ? name.givenName : '',
      lastName: name ? name.familyName : '',
      image: photos ? photos[0].value : '',
    };
    done(null, user);
  }
}
