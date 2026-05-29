export type DocumentSourceType = "MANUAL" | "UPLOAD" | "CODEBASE" | "TASK" | "URL";

export type Document = {
  id: string;
  project_id: string | null;
  title: string;
  content: string | null;
  source_type: DocumentSourceType;
  created_at: string;
  updated_at: string;
  chunks?: Array<{
    id: string;
    document_id: string;
    content: string;
    index: number;
    embedding?: unknown;
    created_at: string;
  }>;
};

export type CreateDocumentInput = {
  projectId?: string;
  title: string;
  content?: string;
  sourceType?: DocumentSourceType;
};
