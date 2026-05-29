import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModelProviderDto } from './dto/create-model-provider.dto';
import { UpdateModelProviderDto } from './dto/update-model-provider.dto';

@Injectable()
export class ModelProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateModelProviderDto) {
    return this.prisma.modelProvider.create({
      data: {
        name: dto.name,
        type: dto.type,
        base_url: dto.baseUrl,
        model_name: dto.modelName,
        api_key: dto.apiKey,
      },
    });
  }

  findAll() {
    return this.prisma.modelProvider.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        base_url: true,
        model_name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const provider = await this.prisma.modelProvider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        base_url: true,
        model_name: true,
        created_at: true,
        updated_at: true,
        agents: true,
      },
    });
    if (!provider) throw new NotFoundException('Model provider not found');
    return provider;
  }

  async update(id: string, dto: UpdateModelProviderDto) {
    await this.findOne(id);
    return this.prisma.modelProvider.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        base_url: dto.baseUrl,
        model_name: dto.modelName,
        api_key: dto.apiKey,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.modelProvider.delete({ where: { id } });
  }
}
