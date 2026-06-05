"use client";

import { useParams } from "next/navigation";

export default function useSlugs() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug ?? "";
  const projectSlug = params.projectSlug ?? "";

  return {
    workspace: {
      slug: workspaceSlug as string,
    },
    project: {
      slug: projectSlug as string,
    },
  };
}
