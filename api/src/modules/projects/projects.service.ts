import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectRole,
  WorkspaceRole,
} from '../../../generated/prisma/client.cjs';
import { AccessService } from '../common/services/access.service';
import { getPagination, paginated } from '../common/utils/pagination';
import { toSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from './dto/project.dto';

const PROJECT_MANAGERS = [
  ProjectRole.Owner,
  ProjectRole.ProductOwner,
  ProjectRole.ProjectManager,
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateProjectDto) {
    await this.access.assertWorkspaceMember(userId, workspaceId);

    try {
      return await this.prisma.project.create({
        data: {
          workspace_id: workspaceId,
          name: dto.name,
          slug: toSlug(dto.slug ?? dto.name),
          description: dto.description ?? undefined,
          members: {
            create: {
              member_id: userId,
              role: ProjectRole.Owner,
            },
          },
        },
        include: { members: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findByWorkspace(
    userId: string,
    workspaceId: string,
    query: ProjectQueryDto,
  ) {
    await this.access.assertWorkspaceMember(userId, workspaceId);
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.ProjectWhereInput = {
      workspace_id: workspaceId,
      deleted_at: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(userId: string, projectId: string) {
    await this.access.assertProjectMember(userId, projectId);
    return this.access.getActiveProject(projectId);
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.access.assertProjectRole(userId, projectId, PROJECT_MANAGERS);

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(userId: string, projectId: string) {
    await this.access.assertProjectRole(userId, projectId, [ProjectRole.Owner]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { deleted_at: new Date() },
    });
  }

  async members(userId: string, projectId: string) {
    await this.access.assertProjectMember(userId, projectId);

    return this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: { member: { include: { userInfo: true } } },
    });
  }

  async addMember(userId: string, projectId: string, dto: AddProjectMemberDto) {
    const project = await this.access.getActiveProject(projectId);
    await this.access.assertProjectRole(userId, projectId, PROJECT_MANAGERS);
    await this.access.assertWorkspaceMember(dto.user_id, project.workspace_id);

    try {
      return await this.prisma.projectMember.create({
        data: {
          project_id: projectId,
          member_id: dto.user_id,
          role: dto.role ?? ProjectRole.Member,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMember(
    userId: string,
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ) {
    await this.access.assertProjectRole(userId, projectId, [ProjectRole.Owner]);
    const member = await this.findMember(projectId, memberId);

    return this.prisma.projectMember.update({
      where: { id: member.id },
      data: { role: dto.role },
    });
  }

  async removeMember(userId: string, projectId: string, memberId: string) {
    await this.access.assertProjectRole(userId, projectId, PROJECT_MANAGERS);
    const member = await this.findMember(projectId, memberId);

    return this.prisma.projectMember.delete({ where: { id: member.id } });
  }

  private async findMember(projectId: string, memberId: string) {
    const id = Number(memberId);
    const member = Number.isInteger(id)
      ? await this.prisma.projectMember.findFirst({
          where: { id, project_id: projectId },
        })
      : await this.prisma.projectMember.findFirst({
          where: { member_id: memberId, project_id: projectId },
        });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    return member;
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Project value already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
    }

    throw new BadRequestException('Project operation failed');
  }
}
