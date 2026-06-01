import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import GoogleAuthGuard from './guards/google-auth.guard';
import { AuthUser, GoogleUser } from 'src/shared/types/types';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import JWTAuthGuard from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
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
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const frontendURL = this.configService.getOrThrow<string>('FRONTEND_URL');

    return res.redirect(`${frontendURL}`);
  }

  @UseGuards(JWTAuthGuard)
  @Get('me')
  async getCurrentUserInfo(@CurrentUser() currentUser: AuthUser) {
    const user = await this.usersService.findById(currentUser.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userInfo = await this.usersService.getUserInfoById(user.id);
    const workspaces = await this.workspacesService.getWorkspacesByUserId(
      user.id,
    );
    return {
      id: user.id,
      username: user.username,
      createdAt: user.created_at,
      email: user.email,
      ...userInfo,
      workspaces,
    };
  }

  @Post('logout')
  logOut(@Res() res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
