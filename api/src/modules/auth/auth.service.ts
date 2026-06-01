import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import PrismaService from 'src/shared/services/prisma.service';
import { GoogleUser } from 'src/shared/types/types';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  generateJWT(userID: string) {
    const payload = { sub: userID };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async verifyGoogleUser(gUser: GoogleUser) {
    const { email, firstName, lastName, image } = gUser;

    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const user = await this.usersService.upsert({
      email,
      fullName,
      avatarImageURL: image,
    });

    return this.generateJWT(user.id);
  }
}
