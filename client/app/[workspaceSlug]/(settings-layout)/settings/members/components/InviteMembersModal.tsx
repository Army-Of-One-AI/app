"use client";

import useInviteByEmails from "@/features/workspaces/hooks/useInviteByEmails";
import { WorkspaceInvite } from "@/features/workspaces/types";
import useSlugs from "@/shared/hooks/useSlugs";
import { classNames } from "@/shared/styles/classNames";
import Button from "@/shared/ui/Button";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { CheckCircle2, Info, Loader2, MailPlus, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type InviteResponse = {
  invited: {
    id: string;
    email: string;
    expires_at: string;
  }[];
  skipped: {
    email: string;
    reason: "already_accepted" | "already_pending" | "invalid_email" | string;
  }[];
};

const skippedReasonLabels: Record<string, string> = {
  already_accepted: "Already a member",
  already_pending: "Invite already pending",
  invalid_email: "Invalid email",
};

export default function InviteMembersModal({
  refetchInvitations,
}: {
  refetchInvitations?: (
    options?: RefetchOptions | undefined
  ) => Promise<QueryObserverResult<NoInfer<WorkspaceInvite[]>, Error>>;
}) {
  const slugs = useSlugs();
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: inviteByEmails, isPending } = useInviteByEmails();

  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InviteResponse | null>(null);

  const canSubmit = useMemo(() => {
    return emails.length > 0 || emailInput.trim().length > 0;
  }, [emails.length, emailInput]);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const addEmail = () => {
    const email = normalizeEmail(emailInput);

    if (!email) return false;

    if (!emailRegex.test(email)) {
      setError(`"${email}" is not a valid email address`);
      return false;
    }

    if (emails.includes(email)) {
      setError(`"${email}" is already added`);
      return false;
    }

    setEmails((curr) => [...curr, email]);
    setEmailInput("");
    setError("");
    setResult(null);

    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    let finalEmails = emails;

    if (emailInput.trim()) {
      const email = normalizeEmail(emailInput);

      if (!emailRegex.test(email)) {
        setError(`"${email}" is not a valid email address`);
        return;
      }

      if (emails.includes(email)) {
        setError(`"${email}" is already added`);
        return;
      }

      finalEmails = [...emails, email];
      setEmails(finalEmails);
      setEmailInput("");
    }

    if (finalEmails.length === 0) {
      setError("Add at least one email address");
      return;
    }

    try {
      setError("");

      const response = await inviteByEmails({
        workspaceSlug: slugs.workspace.slug,
        emails: finalEmails,
      });

      const inviteResult = response as InviteResponse;

      setResult(inviteResult);

      const skippedEmails = new Set(
        inviteResult.skipped.map((item) => item.email)
      );

      setEmails(finalEmails.filter((email) => skippedEmails.has(email)));

      await refetchInvitations?.();
    } catch {
      setError("Could not send invites. Please try again.");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (emailInput.trim()) {
        e.preventDefault();
        addEmail();
      }
    }

    if (e.key === "Backspace" && !emailInput && emails.length > 0) {
      setEmails((curr) => curr.slice(0, -1));
      setResult(null);
    }
  };

  const handleRemove = (email: string) => {
    setEmails((curr) => curr.filter((item) => item !== email));
    setError("");
    setResult(null);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[520px] space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-(--border) text-(--text-primary)">
          <MailPlus size={18} />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-(--text-primary)">
            Invite members
          </h2>

          <p className="text-sm leading-6 text-(--text-secondary)">
            Add teammates by email. Press Enter, comma, or Tab to add each
            address.
          </p>
        </div>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className={`
          min-h-14 w-full cursor-text rounded-2xl border px-3 py-3
          ${classNames.border}
          flex flex-wrap items-center gap-2 bg-(--surface)
          transition
          focus-within:border-(--primary)
          focus-within:ring-4 focus-within:ring-(--primary)/10
        `}
      >
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-(--border) px-3 py-1.5 text-sm text-(--text-primary)"
          >
            <span className="max-w-[260px] truncate">{email}</span>

            <button
              type="button"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(email);
              }}
              className="
                rounded-full p-0.5 text-(--text-secondary)
                transition hover:bg-black/10 hover:text-(--text-primary)
                disabled:pointer-events-none disabled:opacity-50
              "
              aria-label={`Remove ${email}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={emailInput}
          disabled={isPending}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setError("");
            setResult(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={emails.length === 0 ? "name@example.com" : ""}
          className="
            min-w-[180px] flex-1 border-none bg-transparent py-1.5
            text-sm text-(--text-primary) outline-none
            placeholder:text-(--text-muted)
            disabled:cursor-not-allowed disabled:opacity-60
          "
          autoFocus
        />
      </div>

      {error && (
        <p className="rounded-xl bg-(--danger)/10 px-3 py-2 text-sm font-medium text-(--danger)">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-2xl border border-(--border) bg-(--surface) p-3">
          {result.invited.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} />
              {result.invited.length} invite
              {result.invited.length === 1 ? "" : "s"} sent
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                <Info size={16} />
                {result.skipped.length} skipped
              </div>

              <div className="space-y-1.5">
                {result.skipped.map((item) => (
                  <div
                    key={item.email}
                    className="flex items-center justify-between gap-3 rounded-xl bg-(--border) px-3 py-2 text-sm"
                  >
                    <span className="truncate text-(--text-primary)">
                      {item.email}
                    </span>

                    <span className="shrink-0 text-xs font-medium text-(--text-secondary)">
                      {skippedReasonLabels[item.reason] ?? "Skipped"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--text-secondary)">
          {emails.length} {emails.length === 1 ? "email" : "emails"} ready
        </p>

        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </span>
          ) : (
            "Send invites"
          )}
        </Button>
      </div>
    </form>
  );
}
