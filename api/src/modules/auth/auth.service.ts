import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomSuffix } from '../common/utils/slug';
import { GoogleProfileUser, JwtUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfileUser) {
    const email = profile.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { userInfo: true },
    });

    if (!user) {
      const username = await this.generateUniqueUsername(email);

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          is_active: true,
          userInfo: {
            create: {
              full_name:
                profile.fullName ??
                [profile.firstName, profile.lastName].filter(Boolean).join(' ') ??
                null,
              avatar_url: profile.avatarUrl,
            },
          },
        },
        include: { userInfo: true },
      });
    } else if (!user.is_active) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { is_active: true },
        include: { userInfo: true },
      });
    }

    const payload: JwtUser = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userInfo: true },
      omit: { },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async generateUniqueUsername(email: string) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    let username = prefix || `user${randomSuffix(8)}`;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${prefix || 'user'}_${randomSuffix()}`;
    }

    return username;
  }
}
