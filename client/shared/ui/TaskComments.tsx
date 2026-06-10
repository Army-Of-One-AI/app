"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../api/apiClient";
import Button from "./Button";
import RichTextEditor, { RichTextValue } from "./RichTextEditor";
import { ProjectMember } from "@/features/projects/types";

type CommentContent = {
  html: string;
  plainText: string;
};

type CommentUser = {
  id: string;
  email: string;
  userInfo?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type TaskComment = {
  id: string;
  content: CommentContent;
  user_id: string;
  reply_to_comment_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  user?: CommentUser;
  _count?: {
    replied_comments: number;
  };
};

type Cursor = {
  createdAt: string;
  id: string;
} | null;

type CommentsResponse = {
  data: TaskComment[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: Cursor;
  };
};

type TaskCommentsProps = {
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
  projectMembers: ProjectMember[];
};

function buildTaskCommentsUrl(
  workspaceSlug: string,
  projectSlug: string,
  taskId: string
) {
  return `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/comments`;
}

export default function TaskComments({
  workspaceSlug,
  projectSlug,
  taskId,
  projectMembers,
}: TaskCommentsProps) {
  const queryClient = useQueryClient();

  const baseUrl = buildTaskCommentsUrl(workspaceSlug, projectSlug, taskId);
  const commentsQueryKey = ["task-comments", taskId];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: commentsQueryKey,
      initialPageParam: null as Cursor,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();

        params.set("limit", "2");

        if (pageParam?.createdAt && pageParam?.id) {
          params.set("cursorCreatedAt", pageParam.createdAt);
          params.set("cursorId", pageParam.id);
        }

        const res = await apiClient.get<CommentsResponse>(
          `${baseUrl}?${params.toString()}`
        );

        return res.data;
      },
      getNextPageParam: (lastPage) => {
        return lastPage.pagination.hasNextPage
          ? lastPage.pagination.nextCursor
          : undefined;
      },
    });

  const comments = data?.pages.flatMap((page) => page.data) ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: {
      content: CommentContent;
      mentionedUserIds: string[];
    }) => {
      const res = await apiClient.post<TaskComment>(baseUrl, {
        content: payload.content,
        ...(payload.mentionedUserIds.length > 0 && {
          mentionedUserIds: payload.mentionedUserIds,
        }),
      });

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsQueryKey,
      });
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-[var(--text-secondary)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Comments
        </h2>
      </div>

      <section className="flex h-full flex-col">
        <CommentInput
          projectMembers={projectMembers}
          isLoading={createMutation.isPending}
          onSubmit={({ content, mentionedUserIds }) =>
            createMutation.mutate({ content, mentionedUserIds })
          }
        />

        <div className="comments-scrollbar max-h-[min(70vh,700px)] mt-4 space-y-3 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Loader2 className="size-4 animate-spin" />
              Loading comments...
            </div>
          ) : comments.length ? (
            <>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  workspaceSlug={workspaceSlug}
                  projectSlug={projectSlug}
                  taskId={taskId}
                  projectMembers={projectMembers}
                />
              ))}

              {hasNextPage && (
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  className="w-full rounded-xl"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading more...
                    </span>
                  ) : (
                    "Load more comments"
                  )}
                </Button>
              )}
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-[var(--text-secondary)]">
              No comments yet.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}

function CommentInput({
  placeholder = "Write a comment...",
  isLoading,
  projectMembers = [],
  onSubmit,
}: {
  placeholder?: string;
  isLoading?: boolean;
  projectMembers?: ProjectMember[];
  onSubmit: (payload: {
    content: CommentContent;
    mentionedUserIds: string[];
  }) => void;
}) {
  const [value, setValue] = useState<RichTextValue>({
    html: "",
    plainText: "",
    mentions: [],
  });

  function handleSubmit() {
    const plainText = value.plainText.trim();

    if (!plainText) return;

    onSubmit({
      content: {
        html: value.html,
        plainText,
      },
      mentionedUserIds: value.mentions?.map((mention) => mention.id) ?? [],
    });

    setValue({
      html: "",
      plainText: "",
      mentions: [],
    });
  }

  return (
    <div className="space-y-2 rounded-xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        mentionOptions={projectMembers}
        placeholder={placeholder}
        className="shadow-2xl"
      />

      <div className="flex justify-end">
        <Button
          variant="secondary"
          type="button"
          disabled={isLoading || !value.plainText.trim()}
          onClick={handleSubmit}
          className="flex h-10 items-center gap-2 rounded-xl px-4 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send className="size-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  workspaceSlug,
  projectSlug,
  taskId,
  projectMembers,
}: {
  comment: TaskComment;
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
  projectMembers: ProjectMember[];
}) {
  const queryClient = useQueryClient();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const baseUrl = buildTaskCommentsUrl(workspaceSlug, projectSlug, taskId);

  const repliesQueryKey = ["task-comment-replies", comment.id];

  const { data: replies, isLoading: isRepliesLoading } = useQuery({
    queryKey: repliesQueryKey,
    queryFn: async () => {
      const res = await apiClient.get<CommentsResponse>(
        `${baseUrl}/${comment.id}/replies?limit=10`
      );

      return res.data;
    },
    enabled: showReplies,
  });

  const replyMutation = useMutation({
    mutationFn: async (params: {
      content: CommentContent;
      mentionedUserIds: string[];
    }) => {
      const res = await apiClient.post<TaskComment>(baseUrl, {
        content: params.content,
        replyToCommentId: comment.id,
        ...(params.mentionedUserIds.length > 0 && {
          mentionedUserIds: params.mentionedUserIds,
        }),
      });

      return res.data;
    },
    onSuccess: () => {
      setShowReplyBox(false);
      setShowReplies(true);

      queryClient.invalidateQueries({
        queryKey: repliesQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: ["task-comments", taskId],
      });
    },
  });

  const name =
    comment.user?.userInfo?.full_name || comment.user?.email || "Unknown user";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-primary)] p-4">
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-sm font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {name}
            </p>

            <span className="shrink-0 text-xs text-[var(--text-secondary)]">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>

          <div
            className="rich-text comment-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(comment.content.html),
            }}
          />

          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setShowReplyBox((prev) => !prev)}
              className="hover:text-[var(--text-primary)]"
            >
              Reply
            </button>

            {!!comment._count?.replied_comments && (
              <button
                type="button"
                onClick={() => setShowReplies((prev) => !prev)}
                className="hover:text-[var(--text-primary)]"
              >
                {showReplies
                  ? "Hide replies"
                  : `View ${comment._count.replied_comments} replies`}
              </button>
            )}
          </div>

          {showReplyBox && (
            <div className="mt-3">
              <CommentInput
                projectMembers={projectMembers}
                isLoading={replyMutation.isPending}
                onSubmit={({ content, mentionedUserIds }) =>
                  replyMutation.mutate({ content, mentionedUserIds })
                }
              />
            </div>
          )}

          {showReplies && (
            <div className="mt-4 space-y-3 border-l border-[var(--border)] pl-4">
              {isRepliesLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="size-4 animate-spin" />
                  Loading replies...
                </div>
              ) : (
                replies?.data.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    workspaceSlug={workspaceSlug}
                    projectSlug={projectSlug}
                    taskId={taskId}
                    projectMembers={projectMembers}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
