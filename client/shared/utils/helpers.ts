import { ProjectStatus } from "../types/enums";

type RichTextValue = {
  html: string;
  plainText: string;
};

export function parseRichText(value: unknown): RichTextValue {
  if (!value) {
    return {
      html: "",
      plainText: "",
    };
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return {
        html: parsed.html ?? "",
        plainText: parsed.plainText ?? "",
      };
    } catch {
      return {
        html: value,
        plainText: value,
      };
    }
  }

  if (typeof value === "object" && value !== null && "html" in value) {
    const richText = value as Partial<RichTextValue>;

    return {
      html: richText.html ?? "",
      plainText: richText.plainText ?? "",
    };
  }

  return {
    html: "",
    plainText: "",
  };
}

export function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const date = new Date(value).getTime();
  const diff = Date.now() - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatStatus(value: ProjectStatus) {
  return value.split("_").join(" ");
}

export function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

export function isSameSet(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  const values = new Set(a);

  return b.every((item) => values.has(item));
}
