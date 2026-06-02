'use client';

import Link from 'next/link';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import slugify from 'slugify';

import { classNames } from '@/shared/styles/classNames';
import PageContent from '@/shared/ui/DashboardLayout/PageContent';
import { ProjectStatus } from '@/shared/types/enums';
import { apiClient } from '@/shared/api/apiClient';
import Button from '@/shared/ui/Button';
import useDebounce from '@/shared/hooks/useDebounce';
import useModal from '@/shared/hooks/useModal';

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  targetDate: string | null;
  taskCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

type FindProjectsResponse = {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CreateProjectPayload = {
  name: string;
  slug: string;
  description?: string;
  status: ProjectStatus;
  targetDate?: string;
};

export default function ProjectsPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const workspaceSlug = params.workspaceSlug;

  const queryClient = useQueryClient();
  const { openModal, closeModal } = useModal();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<ProjectStatus | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-projects', workspaceSlug, debouncedSearch, status],
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
        },
      );

      return res.data;
    },
    enabled: Boolean(workspaceSlug),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const res = await apiClient.post(
        `/workspaces/${workspaceSlug}/projects`,
        payload,
      );

      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['workspace-projects', workspaceSlug],
      });

      closeModal();
    },
  });

  const openCreateProjectModal = () => {
    openModal({
      title: 'Create new project',
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
              <FilterPill active={status === ''} onClick={() => setStatus('')}>
                All
              </FilterPill>

              {Object.values(ProjectStatus).map((val) => (
                <FilterPill
                  key={val}
                  active={status === val}
                  onClick={() => setStatus(val)}
                >
                  {val.split('_').join(' ')}
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
      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`
                h-56 animate-pulse rounded-xl border
                ${classNames.card.bg}
                ${classNames.card.border}
              `}
            />
          ))}

        {!isLoading &&
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/${workspaceSlug}/projects/${project.slug}`}
              className={`
                rounded-xl border p-5 transition
                ${classNames.card.bg}
                ${classNames.card.border}
                hover:bg-[var(--surface)]
              `}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <p className={`mt-3 line-clamp-2 text-sm ${classNames.text.secondary}`}>
                    {project.description || 'No description'}
                  </p>
                </div>

                <div
                  className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold
                    ${classNames.surface}
                  `}
                >
                  {project.name[0]}
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span>{project.status.split('_').join(' ')}</span>
                <span className={classNames.text.secondary}>
                  {project.targetDate
                    ? new Date(project.targetDate).toLocaleDateString()
                    : 'No target date'}
                </span>
              </div>

              <p className="mb-4 text-sm">Tasks Overview</p>

              <div className="mb-7 grid grid-cols-2 gap-3">
                <Stat value={project.taskCount} label="Tasks" />
                <Stat value={project.memberCount} label="Members" />
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs ${classNames.text.secondary}`}>
                  Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
                </span>

                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className={`
                    rounded-md p-1
                    ${classNames.text.secondary}
                    hover:bg-[var(--surface)]
                  `}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </Link>
          ))}

        {!isLoading && projects.length === 0 && (
          <div className={`col-span-full py-20 text-center ${classNames.text.secondary}`}>
            No projects found.
          </div>
        )}
      </div>
    </PageContent>
  );
}

function CreateProjectModal({
  onCreate,
  isLoading,
}: {
  onCreate: (payload: CreateProjectPayload) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.Planning);
  const [targetDate, setTargetDate] = useState('');

  const handleNameChange = (value: string) => {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value, { lower: true, strict: true }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) return;

    onCreate({
      name: name.trim(),
      slug: slugify(slug, { lower: true, strict: true }),
      status,
      ...(description.trim() && { description: description.trim() }),
      ...(targetDate && { targetDate }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-[100vw] w-125">
      <div>
        <label className="mb-1 block text-sm font-medium">Project name</label>
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Website Redesign"
          className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="website-redesign"
          className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          rows={3}
          className={`w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none ${classNames.border}`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
        >
          {Object.values(ProjectStatus).map((val) => (
            <option key={val} value={val}>
              {val.split('_').join(' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Target date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !name.trim() || !slug.trim()}
        className="w-full"
      >
        {isLoading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
}

function FilterPill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full border px-3 py-1 text-sm
        ${classNames.border}
        ${active ? classNames.text.primary : classNames.text.secondary}
        ${active ? 'border-[var(--primary)]' : ''}
        hover:bg-[var(--surface)]
      `}
    >
      {children}
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-xl font-semibold">{value}</div>
      <div className={`text-xs ${classNames.text.secondary}`}>{label}</div>
    </div>
  );
}