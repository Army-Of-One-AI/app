import type { AgentRole, AgentRoleType } from "./types";

export type CoreTeamRoleConfig = {
  role: AgentRoleType;
  name: string;
  shortName: string;
  purpose: string;
  responsibilitySummary: string;
  systemPromptPreview: string;
  skills: string[];
};

export const CORE_TEAM: AgentRoleType[] = ["PRODUCT_OWNER", "PM", "DESIGNER", "DEVELOPER", "QC"];

export const coreTeamRoles: CoreTeamRoleConfig[] = [
  {
    role: "PRODUCT_OWNER",
    name: "Product Owner",
    shortName: "Owner",
    purpose: "AI co-founder for product direction.",
    responsibilitySummary: "Expands raw ideas, clarifies direction, shapes feature concepts, priorities, stories, and roadmap direction.",
    systemPromptPreview:
      "Act as an AI co-founder. Expand raw product ideas into clear product direction, feature concepts, priorities, user stories, and roadmap guidance.",
    skills: ["feature concepting", "user story shaping", "roadmap direction", "priority framing"],
  },
  {
    role: "PM",
    name: "PM",
    shortName: "PM",
    purpose: "Execution owner for turning direction into work.",
    responsibilitySummary: "Creates tasks, acceptance criteria, dependencies, priorities, and keeps the Kanban board organized.",
    systemPromptPreview:
      "Convert product direction into implementation-ready tasks with acceptance criteria, dependencies, priority, and board-ready execution details.",
    skills: ["ticket formatting", "acceptance criteria", "dependency mapping", "Kanban organization"],
  },
  {
    role: "DESIGNER",
    name: "Designer",
    shortName: "Design",
    purpose: "UX/UI guide for usable product decisions.",
    responsibilitySummary: "Reviews layout, interaction flow, accessibility, visual consistency, and practical UI improvements.",
    systemPromptPreview:
      "Guide UX/UI decisions with layout suggestions, accessibility checks, interaction critique, and visual consistency recommendations.",
    skills: ["Tailwind conventions", "accessibility checklist", "brand palette", "interaction critique"],
  },
  {
    role: "DEVELOPER",
    name: "Developer",
    shortName: "Dev",
    purpose: "Technical owner for implementation.",
    responsibilitySummary: "Handles implementation, architecture, code generation, refactoring, debugging, and technical decisions.",
    systemPromptPreview:
      "Implement pragmatic software changes, make technical decisions, refactor carefully, debug issues, and document architecture tradeoffs.",
    skills: ["TypeScript style", "clean architecture", "Prisma patterns", "NestJS conventions"],
  },
  {
    role: "QC",
    name: "QC",
    shortName: "QC",
    purpose: "Quality owner for validation.",
    responsibilitySummary: "Reviews bugs, edge cases, regressions, test coverage, and UX quality issues before delivery.",
    systemPromptPreview:
      "Validate quality through edge case analysis, bug review, regression checks, test recommendations, and UX issue review.",
    skills: ["regression review", "edge case testing", "bug triage", "UX validation"],
  },
];

export const coreTeamRoleTypes = CORE_TEAM;

export function getCoreTeamRoleConfig(roleType: AgentRoleType) {
  return coreTeamRoles.find((role) => role.role === roleType);
}

export function isCoreTeamRole(role: AgentRole): role is AgentRole {
  return coreTeamRoleTypes.includes(role.role);
}

export function findCoreTeamRole(roles: AgentRole[] | undefined, roleType: AgentRoleType) {
  return roles?.find((role) => role.role === roleType);
}

export function getRoleDisplayName(roleType: AgentRoleType | string | null | undefined) {
  if (!roleType) return "Unassigned";
  return getCoreTeamRoleConfig(roleType as AgentRoleType)?.name ?? roleType.replaceAll("_", " ");
}
