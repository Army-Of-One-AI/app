import { Controller, Get, Redirect, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from '../common/dto/response.dto';
import type { GoogleProfileUser, JwtUser } from '../common/types/auth.types';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Start Google OAuth login',
    description: 'Redirects the browser to Google login.',
  })
  @ApiFoundResponse({ description: 'Redirects to Google OAuth consent screen.' })
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @Redirect()
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description:
      'Creates or finds the Google user, generates a JWT access token, and redirects to FRONTEND_URL/auth/callback?access_token=<token>.',
  })
  @ApiFoundResponse({
    description: 'Redirects to the frontend auth callback with access_token.',
  })
  async googleCallback(@Req() req: Request & { user: GoogleProfileUser }) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    return {
      url: `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(
        result.access_token,
      )}`,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid.' })
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.sub);
  }
}
