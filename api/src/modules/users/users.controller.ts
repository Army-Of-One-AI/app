import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserInfoResponseDto, UserResponseDto } from '../common/dto/response.dto';
import type { JwtUser } from '../common/types/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

class IdParamDto {
  @IsUUID()
  id: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: JwtUser) {
    return this.usersService.me(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my user info fields' })
  @ApiBody({ type: UpdateMeDto })
  @ApiOkResponse({ type: UserInfoResponseDto })
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param() params: IdParamDto) {
    return this.usersService.findById(params.id);
  }
}
