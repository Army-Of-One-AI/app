import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TeamRole, WorkspaceRole } from '../../../generated/prisma/client.cjs';
import { AccessService } from '../common/services/access.service';
import { toSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  UpdateTeamDto,
  UpdateTeamMemberDto,
} from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateTeamDto) {
    await this.access.assertWorkspaceRole(userId, workspaceId, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    try {
      return await this.prisma.team.create({
        data: {
          name: dto.name,
          slug: toSlug(dto.slug ?? dto.name),
          description: dto.description,
          icon_url: dto.icon_url,
          workspace_id: workspaceId,
          members: {
            create: {
              member_id: userId,
              role: TeamRole.Leader,
            },
          },
        },
        include: { members: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findByWorkspace(userId: string, workspaceId: string) {
    await this.access.assertWorkspaceMember(userId, workspaceId);

    return this.prisma.team.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(userId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);
    await this.access.assertWorkspaceMember(userId, team.workspace_id);
    return team;
  }

  async update(userId: string, teamId: string, dto: UpdateTeamDto) {
    const team = await this.getActiveTeam(teamId);
    await this.assertCanManageTeam(userId, teamId, team.workspace_id);

    return this.prisma.team.update({ where: { id: teamId }, data: dto });
  }

  async remove(userId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);
    await this.access.assertWorkspaceRole(userId, team.workspace_id, [
      WorkspaceRole.Owner,
      WorkspaceRole.Admin,
    ]);

    return this.prisma.team.update({
      where: { id: teamId },
      data: { deleted_at: new Date() },
    });
  }

  async members(userId: string, teamId: string) {
    const team = await this.getActiveTeam(teamId);
    await this.access.assertWorkspaceMember(userId, team.workspace_id);

    return this.prisma.teamMember.findMany({
      where: { team_id: teamId },
      include: { member: { include: { userInfo: true } } },
    });
  }

  async addMember(userId: string, teamId: string, dto: AddTeamMemberDto) {
    const team = await this.getActiveTeam(teamId);
    await this.assertCanManageTeam(userId, teamId, team.workspace_id);
    await this.access.assertWorkspaceMember(dto.user_id, team.workspace_id);

    try {
      return await this.prisma.teamMember.create({
        data: {
          team_id: teamId,
          member_id: dto.user_id,
          role: dto.role ?? TeamRole.Member,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMember(
    userId: string,
    teamId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
  ) {
    const team = await this.getActiveTeam(teamId);
    await this.assertCanManageTeam(userId, teamId, team.workspace_id);
    const member = await this.findMember(teamId, memberId);

    return this.prisma.teamMember.update({
      where: { id: member.id },
      data: { role: dto.role },
    });
  }

  async removeMember(userId: string, teamId: string, memberId: string) {
    const team = await this.getActiveTeam(teamId);
    await this.assertCanManageTeam(userId, teamId, team.workspace_id);
    const member = await this.findMember(teamId, memberId);

    return this.prisma.teamMember.delete({ where: { id: member.id } });
  }

  private async assertCanManageTeam(
    userId: string,
    teamId: string,
    workspaceId: string,
  ) {
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: { workspace_id_member_id: { workspace_id: workspaceId, member_id: userId } },
    });

    const teamMember = await this.prisma.teamMember.findUnique({
      where: { team_id_member_id: { team_id: teamId, member_id: userId } },
    });

    if (
      workspaceMember?.role === WorkspaceRole.Owner ||
      workspaceMember?.role === WorkspaceRole.Admin ||
      teamMember?.role === TeamRole.Leader
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient team permissions');
  }

  private async getActiveTeam(teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deleted_at: null },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private async findMember(teamId: string, memberId: string) {
    const id = Number(memberId);
    const member = Number.isInteger(id)
      ? await this.prisma.teamMember.findFirst({ where: { id, team_id: teamId } })
      : await this.prisma.teamMember.findFirst({
          where: { member_id: memberId, team_id: teamId },
        });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Team value already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Team not found');
      }
    }

    throw new BadRequestException('Team operation failed');
  }
}
