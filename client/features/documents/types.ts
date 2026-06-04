export type FindProjectDocumentsParams = {
  creatorId?: string;
  title?: string;
  page?: number;
  limit?: number;
  orderBy?: "latest" | "oldest";
};

export type Document = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
  slug: string;
  creator: {
    id: string;
    email: string;
    fullName: string | null;
    avatarURL: string | null;
    username: string;
  };
};

export type FindProjectDocumentsResponse = {
  items: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
