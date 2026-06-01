import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import GoogleAuthGuard from './guards/google-auth.guard';
import { AuthUser, GoogleUser } from 'src/shared/types/types';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import JWTAuthGuard from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    const data = await this.authService.verifyGoogleUser(req.user);

    res.cookie('access_token', data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const frontendURL = this.configService.getOrThrow<string>('FRONTEND_URL');

    return res.redirect(`${frontendURL}/dashboard`);
  }

  @UseGuards(JWTAuthGuard)
  @Get('me')
  async getCurrentUserInfo(@CurrentUser() user: AuthUser) {
    return this.userService.findByID(user.id);
  }
}
