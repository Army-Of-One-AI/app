"use client";

import { useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import type { Document as ProjectDocument } from "../types";
import { Badge, Button, EmptyState } from "@/shared/ui/components";

type OutlineItem = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

export function DocumentReader({ document }: { document: ProjectDocument }) {
  const [copied, setCopied] = useState(false);
  const cleanedContent = useMemo(
    () => cleanDocumentContent(document.content ?? ""),
    [document.content],
  );
  const parsedContent = useMemo(
    () => parseJsonContent(cleanedContent),
    [cleanedContent],
  );

  async function copyContent() {
    if (!cleanedContent) return;
    await navigator.clipboard.writeText(cleanedContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="mx-auto max-w-[900px] rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <header className="border-b border-[#E5E7EB] px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{document.source_type}</Badge>
            <span className="text-xs font-medium text-[#6B7280]">
              Created {formatDocumentDate(document.created_at)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="min-h-9 gap-2 px-3 py-1.5"
              onClick={copyContent}
              disabled={!cleanedContent}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              className="min-h-9 px-3 py-1.5"
              disabled
              title="Regeneration will be available in a later workflow."
            >
              Regenerate
            </Button>
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-semibold leading-tight text-[#111827]">
          {document.title}
        </h1>
      </header>

      <div className="px-8 py-8">
        {!cleanedContent ? (
          <EmptyState
            title="No document content"
            description="This document does not have body content yet."
          />
        ) : parsedContent !== null ? (
          <StructuredJson value={parsedContent} />
        ) : (
          <MarkdownDocument content={cleanedContent} />
        )}
      </div>
    </article>
  );
}

export function cleanDocumentContent(content: string) {
  return content
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "-")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getDocumentOutline(content: string): OutlineItem[] {
  return cleanDocumentContent(content)
    .split("\n")
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
      if (!match) return null;
      const text = match[2].trim();
      return {
        id: slugify(text),
        text,
        level: match[1].length as 1 | 2 | 3,
      };
    })
    .filter((item): item is OutlineItem => item !== null);
}

export function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-0 text-2xl font-semibold leading-tight text-[#111827]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-t border-[#E5E7EB] pt-6 text-xl font-semibold leading-tight text-[#111827] first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-base font-semibold leading-tight text-[#111827]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-4 text-sm leading-7 text-[#374151]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 grid list-disc gap-2 pl-5 text-sm leading-7 text-[#374151]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 grid list-decimal gap-2 pl-5 text-sm leading-7 text-[#374151]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-4 border-[#4F46E5] bg-[#F7F8FC] px-4 py-3 text-sm leading-7 text-[#374151]">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-[#F7F8FC] px-1.5 py-0.5 font-mono text-xs text-[#111827]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#111827] p-4 text-sm leading-6 text-white">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-[#E5E7EB]" />,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[#E5E7EB]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-[#E5E7EB] bg-[#F7F8FC] px-3 py-2 text-left font-semibold text-[#111827]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[#E5E7EB] px-3 py-2 text-[#374151]">
      {children}
    </td>
  ),
};

function MarkdownDocument({ content }: { content: string }) {
  return (
    <div className="document-reader-typography">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function StructuredJson({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div className="grid gap-3">
        {value.length === 0 ? (
          <EmptySection />
        ) : (
          value.map((item, index) => (
            <StructuredJsonSection
              key={index}
              title={`Item ${index + 1}`}
              value={item}
            />
          ))
        )}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, entry]) =>
      hasRenderableValue(entry),
    );
    return (
      <div className="grid gap-4">
        {entries.length === 0 ? (
          <EmptySection />
        ) : (
          entries.map(([key, entry]) => (
            <StructuredJsonSection
              key={key}
              title={humanizeKey(key)}
              value={entry}
            />
          ))
        )}
      </div>
    );
  }

  return <p className="text-sm leading-7 text-[#374151]">{String(value)}</p>;
}

function StructuredJsonSection({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  if (Array.isArray(value)) {
    return (
      <section className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-5">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        {value.length === 0 ? (
          <EmptySection />
        ) : (
          <ul className="mt-3 grid gap-2">
            {value.filter(hasRenderableValue).map((item, index) => (
              <li
                key={index}
                className="rounded-lg bg-white px-3 py-2 text-sm leading-7 text-[#374151]"
              >
                {isRecord(item) || Array.isArray(item) ? (
                  <StructuredJson value={item} />
                ) : (
                  String(item)
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, entry]) =>
      hasRenderableValue(entry),
    );
    return (
      <section className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-5">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        <div className="mt-3 grid gap-3">
          {entries.length === 0 ? (
            <EmptySection />
          ) : (
            entries.map(([key, entry]) => (
              <StructuredJsonSection
                key={key}
                title={humanizeKey(key)}
                value={entry}
              />
            ))
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] p-5">
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      {hasRenderableValue(value) ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#374151]">
          {String(value)}
        </p>
      ) : (
        <EmptySection />
      )}
    </section>
  );
}

function EmptySection() {
  return (
    <p className="mt-2 text-sm leading-7 text-[#6B7280]">
      No content provided for this section.
    </p>
  );
}

function parseJsonContent(content: string): unknown | null {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function hasRenderableValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasRenderableValue);
  if (isRecord(value)) return Object.values(value).some(hasRenderableValue);
  return value !== null && value !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
