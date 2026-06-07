import { ProjectRole } from "./enums";

export type CurrentProjectUser = {
  projectRole: ProjectRole | null;
  permissions: {
    project: {
      canViewProject: boolean;
      canUpdateProject: boolean;
      canDeleteProject: boolean;
      canManageProjectMembers: boolean;
    };
    task: {
      canCreateTask: boolean;
      canUpdateTask: boolean;
      canDeleteTask: boolean;
      canAssignTask: boolean;
      canArchiveTask: boolean;
      canUpdateTaskStatus: boolean;
    };
  };
};
