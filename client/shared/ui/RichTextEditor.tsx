"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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

type RichTextValue = {
  html: string;
  plainText: string;
};

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value.html || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `min-h-36 rounded-b-lg border-x border-b bg-transparent px-4 py-3 text-sm leading-6 outline-none ${classNames.border}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        plainText: editor.getText(),
      });
    },
  });

  if (!editor) return null;

  return (
    <div className={`overflow-hidden rounded-lg border ${classNames.border}`}>
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
