"use client";

import slugify from "slugify";
import {
  CreateProjectPayload,
  ProjectDescription,
} from "@/features/projects/types";
import { ProjectStatus } from "@/shared/types/enums";
import { useState } from "react";
import { classNames } from "@/shared/styles/classNames";
import RichTextEditor from "@/shared/ui/RichTextEditor";
import Button from "@/shared/ui/Button";

export default function CreateProjectModal({
  onCreate,
  isLoading,
}: {
  onCreate: (payload: CreateProjectPayload) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [description, setDescription] = useState<ProjectDescription>({
    html: "",
    plainText: "",
  });

  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.Planning);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [completedAt, setCompletedAt] = useState("");

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
      ...(description.plainText.trim() && { description }),
      ...(startDate && { startDate }),
      ...(targetDate && { targetDate }),
      ...(completedAt && { completedAt }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-125 max-w-[100vw] space-y-4">
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
        <RichTextEditor value={description} onChange={setDescription} />
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
              {val.split("_").join(" ")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          />
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
      </div>

      {status === ProjectStatus.Completed && (
        <div>
          <label className="mb-1 block text-sm font-medium">Completed at</label>
          <input
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none ${classNames.border}`}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !name.trim() || !slug.trim()}
        className="w-full"
      >
        {isLoading ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}
