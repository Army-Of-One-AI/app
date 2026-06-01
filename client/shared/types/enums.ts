export const WorkspaceRole = {
  Owner: "Owner",
  Admin: "Admin",
  Member: "Member",
} as const;

export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export const TeamRole = {
  Leader: "Leader",
  Member: "Member",
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const ProjectRole = {
  Owner: "Owner",
  ProductOwner: "ProductOwner",
  ProjectManager: "ProjectManager",
  TechLead: "TechLead",
  Designer: "Designer",
  Developer: "Developer",
  QC: "QC",
  DevOps: "DevOps",
  Member: "Member",
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const TaskStatus = {
  Backlog: "Backlog",
  Todo: "Todo",
  InProgress: "InProgress",
  Review: "Review",
  Done: "Done",
  Canceled: "Canceled",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Urgent: "Urgent",
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const DocumentStatus = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];
