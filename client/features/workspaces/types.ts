export type CreateWorkspacePayload = {
  name: string;
  slug: string;
  logoURL?: string;
};

export type WorkspaceDetails = {
  id: string;
  name: string;
  slug: string;
  logoURL?: string;
  createdAt: string;
  updatedAt?: string;
};

export type UpdateWorkspaceSettingsPayload = {
  name?: string;
  slug?: string;
  logoURL?: string;
};
