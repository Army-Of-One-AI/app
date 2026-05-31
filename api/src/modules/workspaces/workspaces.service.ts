import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkspaceRole } from '../../../generated/prisma/client.cjs';
import { AccessService } from '../common/services/access.service';
import { getPagination, paginated } from '../common/utils/pagination';
import { toSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddWorkspaceMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceMemberDto,
  WorkspaceQueryDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = toSlug(dto.slug ?? dto.name);

    try {
      return await this.prisma.workspace.create({
        data: {
          name: dto.name,
          slug,
          logo_url: dto.logo_url,
          members: {
            create: {
              member_id: userId,
              role: WorkspaceRole.Owner,
            },
          },
        },
        include: { members: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(userId: string, query: WorkspaceQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.WorkspaceWhereInput = {
      deleted_at: null,
      members: { some: { member_id: userId } },
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.workspace.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(userId: string, workspaceId: string) {
    await this.access.assertWorkspaceMember(userId, workspaceId);
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deleted_at: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    try {
      return await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: dto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(userId: string, workspaceId: string) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
    ]);

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deleted_at: new Date() },
    });
  }

  async members(userId: string, workspaceId: string) {
    await this.access.assertWorkspaceMember(userId, workspaceId);

    return this.prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: { member: { include: { userInfo: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async addMember(
    userId: string,
    workspaceId: string,
    dto: AddWorkspaceMemberDto,
  ) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    const elevatedRoles: WorkspaceRole[] = [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ];

    if (dto.role && elevatedRoles.includes(dto.role)) {
      await this.access.assertWorkspaceRole(userId, workspaceId, [
        WorkspaceRole.Owner,
      ]);
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      return await this.prisma.workspaceMember.create({
        data: {
          workspace_id: workspaceId,
          member_id: dto.user_id,
          role: dto.role ?? WorkspaceRole.Member,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMember(
    userId: string,
    workspaceId: string,
    memberId: string,
    dto: UpdateWorkspaceMemberDto,
  ) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    const member = await this.findMember(workspaceId, memberId);
    if (
      [member.role, dto.role].some((role) =>
        ([WorkspaceRole.Owner, WorkspaceRole.Admin] as WorkspaceRole[]).includes(role),
      )
    ) {
      await this.access.assertWorkspaceRole(userId, workspaceId, [
        WorkspaceRole.Owner,
      ]);
    }

    return this.prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: dto.role },
    });
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    const member = await this.findMember(workspaceId, memberId);
    if (member.role === WorkspaceRole.Owner) {
      throw new ForbiddenException('Owner members cannot be removed here');
    }

    return this.prisma.workspaceMember.delete({ where: { id: member.id } });
  }

  private async findMember(workspaceId: string, memberId: string) {
    const id = Number(memberId);
    const member = Number.isInteger(id)
      ? await this.prisma.workspaceMember.findFirst({
          where: { id, workspace_id: workspaceId },
        })
      : await this.prisma.workspaceMember.findFirst({
          where: { member_id: memberId, workspace_id: workspaceId },
        });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    return member;
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Workspace value already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Workspace not found');
      }
    }

    throw new BadRequestException('Workspace operation failed');
  }
}
