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
