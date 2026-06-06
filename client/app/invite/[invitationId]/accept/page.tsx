/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { apiClient } from "@/shared/api/apiClient";
import Button from "@/shared/ui/Button";

type PageState =
  | "loading"
  | "pending"
  | "accepting"
  | "accepted"
  | "alreadyAccepted"
  | "error";

type InviteDetails = {
  id: string;
  createdAt: string;
  email: string;
  acceptedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  creator: {
    id: string;
    email: string;
    fullName: string | null;
    avatarURL: string | null;
  };
  workspace: {
    id: string;
    logoURL: string | null;
    name: string;
    slug: string;
  };
};

function getInitial(value?: string | null) {
  return value?.trim()?.[0]?.toUpperCase() || "?";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDaysUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();

  const inviteId = useMemo(() => {
    const value = params?.invitationId;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState<InviteDetails | null>(null);

  useEffect(() => {
    if (!inviteId) {
      setState("error");
      setMessage("Invalid invitation link.");
      return;
    }

    const fetchInvite = async () => {
      try {
        const response = await apiClient.get(`/invitations/${inviteId}`);
        const data = response.data as InviteDetails;

        setInvite(data);

        if (data.acceptedAt) {
          setState("alreadyAccepted");
          return;
        }

        if (data.revokedAt) {
          setState("error");
          setMessage("This invitation has been revoked.");
          return;
        }

        if (new Date(data.expiresAt).getTime() < Date.now()) {
          setState("error");
          setMessage("This invitation has expired.");
          return;
        }

        setState("pending");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            const returnTo = `/invite/${inviteId}/accept`;
            router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
          }

          setMessage(
            error.response?.data?.message ||
              "This invitation is invalid, expired, or revoked."
          );
        } else {
          setMessage("Something went wrong while loading this invitation.");
        }

        setState("error");
      }
    };

    fetchInvite();
  }, [inviteId, router]);

  const acceptInvite = async () => {
    if (!inviteId) return;

    try {
      setState("accepting");

      const response = await apiClient.post(`/invitations/${inviteId}/accept`);
      const workspaceSlug =
        response.data?.workspace?.slug || invite?.workspace.slug;

      setState("accepted");

      setTimeout(() => {
        router.replace(workspaceSlug ? `/${workspaceSlug}` : "/workspaces");
      }, 900);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          const returnTo = `/invite/${inviteId}/accept`;
          router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }

        const errorMessage = error.response?.data?.message || "";

        if (errorMessage.toLowerCase().includes("already accepted")) {
          setState("alreadyAccepted");
          return;
        }

        setMessage(
          errorMessage ||
            "This invitation is invalid, expired, revoked, or belongs to another email."
        );
      } else {
        setMessage("Something went wrong while accepting this invitation.");
      }

      setState("error");
    }
  };

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d8d8d8] px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/5">
          <Loader2 className="size-5 animate-spin text-[#555]" />
          <p className="text-sm font-medium text-[#444]">
            Loading invitation...
          </p>
        </div>
      </main>
    );
  }

  if (state === "alreadyAccepted") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d8d8d8] px-4">
        <section className="w-full max-w-[462px] rounded-lg bg-white px-8 py-9 text-center shadow-sm ring-1 ring-black/5">
          <CheckCircle2 className="mx-auto mb-5 size-10 text-[#6671dc]" />

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#202020]">
            Invitation already accepted
          </h1>

          <p className="mx-auto mt-7 max-w-sm text-base leading-7 text-[#4f4f4f]">
            If you think this is a mistake or if you have trouble logging into
            the workspace, please contact the workspace administrators.
          </p>

          <Button
            variant="primary"
            onClick={() => router.back()}
            className="mt-8 h-11 w-full rounded-full bg-[#6f78db] text-sm font-semibold text-white transition hover:bg-[#626bd0]"
          >
            Go back
          </Button>
        </section>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d8d8d8] px-4">
        <section className="w-full max-w-[462px] rounded-lg bg-white px-8 py-9 text-center shadow-sm ring-1 ring-black/5">
          <XCircle className="mx-auto size-11 text-red-500" />

          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#202020]">
            Invitation unavailable
          </h1>

          <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-[#4f4f4f]">
            {message}
          </p>

          <Button
            variant="primary"
            onClick={() => router.replace("/workspaces")}
            className="mt-8 h-11 w-full rounded-full bg-[#6f78db] text-sm font-semibold text-white transition hover:bg-[#626bd0]"
          >
            View workspaces
          </Button>
        </section>
      </main>
    );
  }

  const creatorName =
    invite?.creator.fullName || invite?.creator.email || "Someone";
  const workspaceName = invite?.workspace.name || "this workspace";
  const daysLeft = invite?.expiresAt ? getDaysUntil(invite.expiresAt) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d8d8d8] px-4 py-10">
      <section className="w-full max-w-[548px] rounded-lg bg-white px-7 py-8 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#2f2f2f]">
              Today, {formatDate(new Date().toISOString())}
            </p>

            <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-black">
              Pending invite
            </h1>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex size-9 items-center justify-center rounded-full text-[#555] transition hover:bg-[#f2f2f2] hover:text-black"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-[#268bd2] text-3xl font-medium text-white shadow-sm ring-1 ring-black/10">
            {invite?.workspace.logoURL ? (
              <img
                src={invite.workspace.logoURL}
                alt={workspaceName}
                className="size-full object-cover"
              />
            ) : (
              getInitial(workspaceName)
            )}
          </div>

          <h2 className="mx-auto mt-6 max-w-[430px] text-2xl font-medium leading-snug tracking-[-0.03em] text-black">
            {creatorName} invited you to the workspace “{workspaceName}”
          </h2>

          <p className="mx-auto mt-3 max-w-[370px] text-base leading-6 text-[#444]">
            Join this workspace to collaborate with your team, manage projects,
            and keep everything organized in one place.
          </p>

          <div className="mt-10 flex justify-center">
            <div className="flex max-w-full items-center gap-3 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#111] text-sm font-medium text-white">
                {invite?.creator.avatarURL ? (
                  <img
                    src={invite.creator.avatarURL}
                    alt={creatorName}
                    className="size-full object-cover"
                  />
                ) : (
                  getInitial(creatorName)
                )}
              </div>

              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-black">
                  {creatorName}
                </p>
                <p className="truncate text-xs text-[#666]">
                  {invite?.creator.email}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full bg-[#f6f6f6] px-3 py-1.5 text-xs text-[#555]">
            <Mail className="size-3.5" />
            <span>Invited as {invite?.email}</span>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4">
          <p className="text-center text-xs text-[#444]">
            {daysLeft !== null
              ? `Your invitation expires in ${daysLeft} day${
                  daysLeft === 1 ? "" : "s"
                }.`
              : "Your invitation expires soon."}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="h-11 rounded-md bordertext-sm font-medium"
            >
              Decline
            </Button>

            <Button
              variant="primary"
              onClick={acceptInvite}
              disabled={state === "accepting" || state === "accepted"}
              className="inline-flex h-11 items-center justify-center rounded-md bordertext-sm font-medium"
            >
              {state === "accepting" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Accepting
                </>
              ) : state === "accepted" ? (
                <>
                  <Check className="mr-2 size-4" />
                  Accepted
                </>
              ) : (
                "Accept invitation"
              )}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
