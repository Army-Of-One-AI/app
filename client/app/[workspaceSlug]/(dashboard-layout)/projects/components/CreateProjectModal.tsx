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

const labelClassName = `mb-1 block text-sm font-medium ${classNames.text.primary}`;
const fieldClassName = `
  h-10 w-full rounded-lg border px-3 text-sm outline-none transition
  ${classNames.input.bg}
  ${classNames.input.border}
  ${classNames.input.text}
  ${classNames.input.placeholder}
  ${classNames.input.focus}
`;

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
    <form onSubmit={handleSubmit} className={`w-125 max-w-[100vw] space-y-4`}>
      <div>
        <label className={labelClassName}>Project name</label>
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Website Redesign"
          className={fieldClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Slug</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="website-redesign"
          className={fieldClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Description</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div>
        <label className={labelClassName}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className={fieldClassName}
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
          <label className={labelClassName}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      {status === ProjectStatus.Completed && (
        <div>
          <label className={labelClassName}>Completed at</label>
          <input
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            className={fieldClassName}
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
