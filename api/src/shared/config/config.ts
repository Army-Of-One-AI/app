import { StringValue } from 'ms';
import 'dotenv/config';

type JWTConfig = {
  secret: string;
  expiresIn: StringValue;
};

type GoogleOAuthScopeType = 'email' | 'profile';

type GoogleAuthConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: GoogleOAuthScopeType[];
};

type Config = {
  getJWTConfig: () => JWTConfig;
  getGoogleOAuthConfig: () => GoogleAuthConfig;
};

export const config: Config = {
  getJWTConfig: (): JWTConfig => ({
    secret: process.env.JWT_ACCESS_TOKEN_SECRET || '',
    expiresIn: '7d',
  }),
  getGoogleOAuthConfig: (): GoogleAuthConfig => ({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    scope: ['email', 'profile'],
  }),
};
