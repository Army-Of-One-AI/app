import { TaskStatus } from "../types/enums";

export const classNames = {
  /* Layout */
  background: "bg-[var(--background)]",
  surface: "bg-[var(--surface)]",
  border: "border-[var(--border)]",
  primaryColor: "var(--primary)",

  /* Text */
  text: {
    primary: "text-[var(--text-primary)]",
    secondary: "text-[var(--text-secondary)]",
    danger: "text-[var(--danger-text)]",
  },

  /* Brand */
  primary: {
    bg: "bg-[var(--primary)]",
    text: "text-[var(--on-primary)]",
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

  danger: {
    bg: "bg-[var(--danger-bg)]",
    border: "border-[var(--danger-border)]",
    text: "text-[var(--danger-text)]",
    ring: "focus:ring-2 focus:ring-[var(--focus-danger)]",
    focus: "focus:border-[var(--danger)]",
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

  overlay: "bg-[var(--overlay)]",
  skeleton: "bg-[var(--skeleton)]",
} as const;

export const projectStatusColors = {
  Planning: "bg-[var(--status-planning-bg)] text-[var(--status-planning-text)]",

  Active: "bg-[var(--status-active-bg)] text-[var(--status-active-text)]",

  On_Hold: "bg-[var(--status-onhold-bg)] text-[var(--status-onhold-text)]",

  Completed:
    "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)]",

  Archived: "bg-[var(--status-archived-bg)] text-[var(--status-archived-text)]",
} as const;

export const taskPriorityColors = {
  Low: "bg-[var(--priority-low-bg)] text-[var(--priority-low-text)]",

  Medium: "bg-[var(--priority-medium-bg)] text-[var(--priority-medium-text)]",

  High: "bg-[var(--priority-high-bg)] text-[var(--priority-high-text)]",

  Urgent: "bg-[var(--priority-critical-bg)] text-[var(--priority-critical-text)]",
} as const;

export const taskStatusConfig: Record<TaskStatus, {
  label: string;
  bg: string;
  text: string;
}> = {
  Backlog: {
    label: "BACKLOG",
    bg: "#4b556320",
    text: "#d1d5db",
  },
  Todo: {
    label: "TODO",
    bg: "#dbeafe",
    text: "#1e293b",
  },
  In_Progress: {
    label: "IN PROGRESS",
    bg: "#bfdbfe",
    text: "#1e293b",
  },
  Review: {
    label: "REVIEW",
    bg: "#fde68a",
    text: "#1e293b",
  },
  Done: {
    label: "DONE",
    bg: "#bef264",
    text: "#1e293b",
  },
  Canceled: {
    label: "CANCELED",
    bg: "#fca5a5",
    text: "#1e293b",
  },
};