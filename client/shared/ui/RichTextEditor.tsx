/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { EditorContent, useEditor, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { classNames } from "../styles/classNames";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
} from "lucide-react";
import {
  HTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { ProjectMember } from "@/features/projects/types";

export type RichTextValue = {
  html: string;
  plainText: string;
  mentions?: {
    id: string;
    label: string;
  }[];
};

type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  className,
  mentionOptions = [],
  placeholder,
}: {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
  mentionOptions?: ProjectMember[];
  placeholder?: string;
  className?: HTMLAttributes<HTMLDivElement>["className"];
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class:
            "rounded-md bg-[var(--surface-secondary)] px-1 font-medium text-[var(--primary)]",
        },

        renderText({ node }) {
          return `@${node.attrs.label}`;
        },

        renderHTML({ node, options }) {
          return [
            "span",
            {
              ...options.HTMLAttributes,
              "data-type": "mention",
              "data-id": node.attrs.id,
              "data-label": node.attrs.label,
            },
            `@${node.attrs.label}`,
          ];
        },

        suggestion: {
          char: "@",
          items: ({ query }) => {
            return mentionOptions
              .filter((item) => {
                return (
                  item.username.toLowerCase().includes(query.toLowerCase()) ||
                  item.email?.toLowerCase().includes(query.toLowerCase())
                );
              })
              .slice(0, 6);
          },
          render: () => {
            let component: ReactRenderer<MentionListRef>;
            let popup: TippyInstance[];

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props) ?? false;
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: value.html || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `min-h-36 rounded-b-lg border-x border-b bg-transparent px-4 py-3 text-sm leading-6 outline-none ${classNames.border}`,
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();

      const mentions: { id: string; label: string }[] = [];

      function walk(node: any) {
        if (node.type === "mention") {
          mentions.push({
            id: node.attrs.id,
            label: node.attrs.label,
          });
        }

        node.content?.forEach(walk);
      }

      walk(json);

      onChange({
        html: editor.getHTML(),
        plainText: editor.getText(),
        mentions,
      });
    },
  });

  if (!editor) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border ${classNames.border} ${className}`}
    >
      <div
        className={`
          flex flex-wrap items-center gap-1 border-b px-2 py-2
          ${classNames.border}
          ${classNames.surface}
        `}
      >
        <EditorTool
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={16} />
        </EditorTool>

        <EditorTool
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </EditorTool>

        <EditorDivider />

        <EditorTool
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </EditorTool>

        <EditorTool
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </EditorTool>

        <EditorDivider />

        <EditorTool
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </EditorTool>

        <EditorTool
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </EditorTool>

        <EditorTool
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </EditorTool>

        <EditorDivider />

        <EditorTool onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} />
        </EditorTool>

        <EditorTool onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} />
        </EditorTool>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

const MentionList = forwardRef<MentionListRef, any>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (!item) return;

    props.command({
      id: item.id,
      label: item.email,
    });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (!props.items.length) {
    return (
      <div className="rounded-xl border bg-[var(--surface-primary)] p-2 text-sm text-[var(--text-secondary)] shadow-xl">
        No members found
      </div>
    );
  }

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xl">
      {props.items.map((item: ProjectMember, index: number) => (
        <button
          key={item.id}
          type="button"
          onClick={() => selectItem(index)}
          className={`
            flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm cursor-pointer
            ${
              index === selectedIndex
                ? "bg-[var(--surface-secondary)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
          `}
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-xs font-semibold">
            {item.username.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--text-primary)]">
              {item.username}
            </p>
            {item.email && (
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {item.email}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";

function EditorTool({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-8 w-8 items-center justify-center rounded-md transition
        ${
          active
            ? "bg-[var(--primary)] text-[var(--on-primary)]"
            : classNames.text.secondary
        }
        hover:bg-[var(--surface)]
      `}
    >
      {children}
    </button>
  );
}

function EditorDivider() {
  return <div className={`mx-1 h-5 w-px ${classNames.border}`} />;
}
