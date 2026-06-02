export const classNames = {
  /* Layout */
  background: "bg-[var(--background)]",
  surface: "bg-[var(--surface)]",
  border: "border-[var(--border)]",

  /* Text */
  text: {
    primary: "text-[var(--text-primary)]",
    secondary: "text-[var(--text-secondary)]",
  },

  /* Brand */
  primary: {
    bg: "bg-[var(--primary)]",
    text: "text-[var(--text-primary)]",
  },

  secondary: {
    bg: "bg-[var(--secondary)]",
    text: "text-[var(--text-primary)]",
  },

  /* Semantic */
  success: {
    bg: "bg-[var(--success)]",
    text: "text-[var(--text-primary)]",
  },

  accent: {
    bg: "bg-[var(--accent)]",
    text: "text-[var(--text-primary)]",
  },

  /* Buttons */
  button: {
    primary: {
      bg: "bg-[var(--btn-primary-bg)]",
      hover: "hover:bg-[var(--btn-primary-bg-hover)]",
      text: "text-[var(--btn-primary-color)]",
      border: "border-transparent",
    },

    secondary: {
      bg: "bg-[var(--btn-secondary-bg)]",
      hover: "hover:bg-[var(--btn-secondary-bg-hover)]",
      text: "text-[var(--btn-secondary-color)]",
      border: "border-[var(--btn-secondary-border)]",
    },
  },

  /* Inputs */
  input: {
    bg: "bg-[var(--surface)]",
    border: "border-[var(--border)]",
    text: "text-[var(--text-primary)]",
    placeholder: "placeholder:text-[var(--text-secondary)]",
    focus: "focus:border-[var(--primary)]",
  },

  /* Cards */
  card: {
    bg: "bg-[var(--surface)]",
    border: "border-[var(--border)]",
  },

  /* Sidebar */
  sidebar: {
    bg: "bg-[var(--surface)]",
    border: "border-[var(--border)]",
  },

  hover: {
    surface: "hover:bg-[var(--surface)]",
  },
} as const;
