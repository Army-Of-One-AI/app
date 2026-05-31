import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMeDto } from './dto/update-me.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(userId: string) {
    return this.findById(userId);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    await this.ensureExists(userId);

    return this.prisma.userInfo.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...dto,
      },
      update: dto,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userInfo: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.user.count({ where: { id } });

    if (!count) {
      throw new NotFoundException('User not found');
    }
  }
}
