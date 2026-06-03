"use client";

import { Plus, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { classNames, projectStatusColors } from "@/shared/styles/classNames";
import PageContent from "@/shared/ui/DashboardLayout/PageContent";
import { ProjectStatus } from "@/shared/types/enums";
import { apiClient } from "@/shared/api/apiClient";
import Button from "@/shared/ui/Button";
import useDebounce from "@/shared/hooks/useDebounce";
import useModal from "@/shared/hooks/useModal";
import FilterPill from "./components/FilterPill";
import { DateTime } from "luxon";
import {
  CreateProjectPayload,
  FindProjectsResponse,
} from "@/features/projects/types";
import CreateProjectModal from "./components/CreateProjectModal";
import DataTable from "@/shared/ui/Table";
import Drawer, { DrawerDirection } from "@/shared/ui/Drawer";
import { useMediaQuery } from "usehooks-ts";
import ProjectOverview from "./components/ProjectOverview";

export default function ProjectsPage() {
  const router = useRouter();
  const params = useParams<{ workspaceSlug: string }>();
  const matches = useMediaQuery("(min-width: 768px)");
  const workspaceSlug = params.workspaceSlug;

  const queryClient = useQueryClient();
  const { openModal, closeModal } = useModal();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-projects", workspaceSlug, debouncedSearch, status],
    queryFn: async () => {
      const res = await apiClient.get<FindProjectsResponse>(
        `/workspaces/${workspaceSlug}/projects`,
        {
          params: {
            page: 1,
            limit: 20,
            ...(debouncedSearch.trim() && { name: debouncedSearch.trim() }),
            ...(status && { status }),
          },
        }
      );

      return res.data;
    },
    enabled: Boolean(workspaceSlug),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects`,
        payload
      );

      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace-projects", workspaceSlug],
      });

      closeModal();
    },
  });

  const openCreateProjectModal = () => {
    openModal({
      title: "Create new project",
      modalContent: (
        <CreateProjectModal
          isLoading={createProjectMutation.isPending}
          onCreate={(payload) => createProjectMutation.mutate(payload)}
        />
      ),
    });
  };

  const projects = data?.items ?? [];

  return (
    <PageContent
      title="Projects"
      customHeader={
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <FilterPill active={status === ""} onClick={() => setStatus("")}>
                All
              </FilterPill>

              {Object.values(ProjectStatus).map((val) => (
                <FilterPill
                  key={val}
                  active={status === val}
                  onClick={() => setStatus(val)}
                >
                  {val.split("_").join(" ")}
                </FilterPill>
              ))}
            </div>

            <Button
              onClick={openCreateProjectModal}
              className="flex shrink-0 items-center gap-2"
            >
              <Plus size={16} />
              Create Project
            </Button>
          </div>

          <div
            className={`
              flex h-10 max-w-md items-center gap-2 rounded-lg border px-3
              ${classNames.card.bg}
              ${classNames.border}
            `}
          >
            <Search size={16} className={classNames.text.secondary} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-full flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      }
    >
      <DataTable
        className={`relative w-full table-auto`}
        getRowKey={(row) => row.id}
        stickyHeader
        stickyTopGap={16}
        skeletonRows={8}
        isLoading={isLoading}
        columns={[
          {
            field: "name",
            label: "Name",
            render: (rowVal) => (
              <button
                type="button"
                className="cursor-pointer hover:underline"
                onClick={() => {
                  setSelectedProjectId(rowVal.id);
                }}
                onDoubleClick={() => {
                  router.push(`/${workspaceSlug}/projects/${rowVal.slug}`);
                }}
              >
                {rowVal.name}
              </button>
            ),
          },
          {
            field: "members",
            label: "Members",
            render: (rowValue) => {
              const visibleMembers = rowValue.members.slice(0, 5);
              const remainingCount =
                rowValue.members.length - visibleMembers.length;

              return (
                <div className="flex items-center">
                  {visibleMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className={`
                      relative
                      flex h-7 w-7 items-center justify-center
                      rounded-full
                      border-2 border-[var(--surface)]
                      bg-[var(--primary)]
                      text-xs font-semibold
                      ${classNames.primary.text}
                      shadow-sm
                      -ml-2 first:ml-0
                      hover:z-20 hover:scale-110
                      transition-all
                    `}
                      style={{
                        zIndex: visibleMembers.length - index,
                      }}
                      title={member.fullName}
                    >
                      {member.fullName
                        ?.split(" ")
                        .slice(0, 2)
                        .map((x) => x[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  ))}

                  {remainingCount > 0 && (
                    <div
                      className="
                      relative
                      -ml-2
                      flex h-7 w-7 items-center justify-center
                      rounded-full
                      border-2 border-[var(--surface)]
                      bg-[var(--secondary)]
                      text-[10px]
                      font-semibold
                      text-[var(--text-secondary)]
                    "
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            field: "taskCount",
            label: "Tasks",
          },
          {
            field: "status",
            label: "Status",
            render: (rowValue) => {
              return (
                <span
                  className={`
                    inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                    ${projectStatusColors[rowValue.status]}`}
                >
                  {rowValue.status.split("_").join(" ")}
                </span>
              );
            },
          },
          {
            field: "createdAt",
            label: "Created Date",
            render: (rowVal) => {
              if (!rowVal.targetDate) return <h1>-</h1>;

              return (
                <h1>
                  {DateTime.fromJSDate(new Date(rowVal.createdAt)).toFormat(
                    "dd/MM/yyyy"
                  )}
                </h1>
              );
            },
          },
          {
            field: "targetDate",
            label: "Target Date",
            render: (rowVal) => {
              if (!rowVal.targetDate) return <h1>-</h1>;

              return (
                <h1>
                  {DateTime.fromJSDate(new Date(rowVal.targetDate)).toFormat(
                    "dd/MM/yyyy"
                  )}
                </h1>
              );
            },
          },
        ]}
        data={projects}
      />

      <Drawer
        onClose={() => setSelectedProjectId(null)}
        isOpen={Boolean(selectedProjectId)}
        direction={matches ? DrawerDirection.Right : DrawerDirection.Bottom}
        className={`${!matches && "h-screen"}`}
      >
        <ProjectOverview
          project={projects.find((ele) => ele.id === selectedProjectId)}
        />
      </Drawer>
    </PageContent>
  );
}
