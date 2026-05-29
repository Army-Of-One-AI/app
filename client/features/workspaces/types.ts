export type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
};

export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;
