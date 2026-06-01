import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'src/shared/config/config';
import PrismaService from 'src/shared/services/prisma.service';
import GoogleStrategy from './strategies/google.strategy';
import JWTStrategy from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: config.getJWTConfig().secret,
      signOptions: {
        expiresIn: config.getJWTConfig().expiresIn,
      },
    }),
    UsersModule,
    WorkspacesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, GoogleStrategy, JWTStrategy],
})
export class AuthModule {}
