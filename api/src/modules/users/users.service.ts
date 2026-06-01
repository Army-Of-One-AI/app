import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import PrismaService from 'src/shared/services/prisma.service';
import UpsertUserDto from './dto/upsert-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async upsert(dto: UpsertUserDto) {
    const { email, fullName, phoneNo, avatarImageURL } = dto;

    const username = slugify(`${email.split('@')[0]} ${nanoid(6)}`);
    const userInfo = {
      avatar_url: avatarImageURL || '',
      full_name: fullName || '',
      phone_no: phoneNo || '',
    };

    return await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        is_active: true,
        username,
        userInfo: {
          create: userInfo,
        },
      },
      update: {
        userInfo: {
          upsert: {
            create: userInfo,
            update: userInfo,
          },
        },
      },
      include: {
        userInfo: true,
      },
    });
  }

  async getUserInfoById(id: string) {
    const userInfo = await this.prisma.userInfo.findUnique({
      where: { user_id: id },
    });

    return {
      fullName: userInfo?.full_name || '',
      avatarImageURL: userInfo?.avatar_url || '',
      phoneNo: userInfo?.phone_no || '',
      title: userInfo?.title || '',
    };
  }

  async getUserWorkspaceMembership(userId: string, workspaceSlug: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        member_id: userId,
        workspace: {
          slug: workspaceSlug,
        },
      },
    });

    return membership;
  }
}
