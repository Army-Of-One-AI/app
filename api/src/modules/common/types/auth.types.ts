export interface JwtUser {
  sub: string;
  email: string;
  username: string;
}

export interface GoogleProfileUser {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
}
