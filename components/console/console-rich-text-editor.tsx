"use client";

import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { normalizeRichTextHtml } from "@/lib/rich-text/normalize-html";

type ConsoleRichTextEditorProps = {
  name: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  minHeight?: string;
  error?: string;
};

type ToolbarButtonProps = {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function ToolbarButton({ title, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`console-rich-editor__btn ${active ? "console-rich-editor__btn--active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      title={title}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="console-rich-editor__divider" aria-hidden />;
}

function IconBold() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7V5zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7z" fill="currentColor" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M10 5h9v2h-3.5l-3 10H16v2H7v-2h3.5l3-10H10V5z" fill="currentColor" />
    </svg>
  );
}

function IconUnderline() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 5v6a5 5 0 0 0 10 0V5h2v6a7 7 0 0 1-14 0V5h2zm-2 14h14v2H5v-2z" fill="currentColor" />
    </svg>
  );
}

function IconStrike() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 5h10v2H7V5zm3 4h4a3 3 0 1 1 0 6H8v2h6a5 5 0 1 0 0-10h-4V9zM4 13h16v2H4v-2z" fill="currentColor" />
    </svg>
  );
}

function IconHighlight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15.24 3.75l4.01 4.01-8.49 8.49-4.01-4.01 8.49-8.49zm-1.06 1.06L7.69 11.3l1.41 1.41 6.49-6.49-1.41-1.41zM3 21h7.5l-3.75-3.75L3 21z" fill="currentColor" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M10.6 13.4a3.5 3.5 0 0 0 4.95 0l2.83-2.83a3.5 3.5 0 0 0-4.95-4.95l-1.06 1.06"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.4 10.6a3.5 3.5 0 0 0-4.95 0L5.62 13.43a3.5 3.5 0 1 0 4.95 4.95l1.06-1.06"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconListBullet() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="5" cy="7" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="17" r="1.5" fill="currentColor" />
      <path d="M9 7h10M9 12h10M9 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconListOrdered() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 7h10M9 12h10M9 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 6v3l-1.5 1.5M5 18v-3l-1.5-1.5M5 12h1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconQuote() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 7h4v6H7V7zm6 0h4v6h-4V7z" fill="currentColor" opacity="0.35" />
      <path d="M7 17h4v-4H7v4zm6 0h4v-4h-4v4z" fill="currentColor" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 8L4 12l4 4M16 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCodeBlock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10l-2 2 2 2M16 10l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconHr() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 7H5v3M5 10a7 7 0 1 0 1.4 4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconRedo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 7h3v3M19 10a7 7 0 1 1-1.4 4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAlignLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16M4 10h10M4 14h14M4 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAlignCenter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16M7 10h10M5 14h14M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAlignRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16M10 10h10M6 14h14M12 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconHtml() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 8L4 12l4 4M16 8l4 4-4 4M13 4l-2 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ConsoleRichTextEditor({
  name,
  label,
  initialValue = "",
  placeholder = "Tulis konten…",
  minHeight = "8rem",
  error,
}: ConsoleRichTextEditorProps) {
  const [html, setHtml] = useState(initialValue);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(initialValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: "console-rich-editor__prose",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const next = normalizeRichTextHtml(currentEditor.getHTML());
      setHtml(next);
      setSourceValue(next);
    },
  });

  useEffect(() => {
    if (!editor || sourceMode) return;
    const normalized = normalizeRichTextHtml(initialValue);
    const current = normalizeRichTextHtml(editor.getHTML());
    if (normalized !== current) {
      editor.commands.setContent(normalized || "", { emitUpdate: false });
      setHtml(normalized);
      setSourceValue(normalized);
    }
  }, [editor, initialValue, sourceMode]);

  function setLink() {
    if (!editor) return;

    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL link", previous ?? "https://");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function toggleSourceMode() {
    if (sourceMode) {
      const normalized = normalizeRichTextHtml(sourceValue);
      editor?.commands.setContent(normalized || "", { emitUpdate: false });
      setHtml(normalized);
      setSourceMode(false);
      return;
    }

    const current = normalizeRichTextHtml(editor?.getHTML() ?? html);
    setSourceValue(current);
    setHtml(current);
    setSourceMode(true);
  }

  function handleSourceChange(value: string) {
    setSourceValue(value);
    setHtml(value);
  }

  const toolbarLocked = sourceMode;

  return (
    <div className="console-field console-field--full">
      <span className="console-field__label">{label}</span>

      <input type="hidden" name={name} value={html} />

      <div className="console-rich-editor" style={{ "--rich-editor-min-height": minHeight } as CSSProperties}>
        <div className={`console-rich-editor__toolbar ${toolbarLocked ? "console-rich-editor__toolbar--locked" : ""}`}>
          <ToolbarButton
            title="Undo"
            disabled={toolbarLocked || !editor?.can().chain().focus().undo().run()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <IconUndo />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            disabled={toolbarLocked || !editor?.can().chain().focus().redo().run()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <IconRedo />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Paragraf"
            active={editor?.isActive("paragraph")}
            disabled={toolbarLocked}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          >
            P
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Bold"
            active={editor?.isActive("bold")}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <IconBold />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor?.isActive("italic")}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <IconUnderline />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor?.isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <IconStrike />
          </ToolbarButton>
          <ToolbarButton
            title="Highlight"
            active={editor?.isActive("highlight")}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <IconHighlight />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Bullet list"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <IconListBullet />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <IconListOrdered />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            active={editor?.isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <IconQuote />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Align left"
            active={editor?.isActive({ textAlign: "left" })}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <IconAlignLeft />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor?.isActive({ textAlign: "center" })}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <IconAlignCenter />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor?.isActive({ textAlign: "right" })}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            <IconAlignRight />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Inline code"
            active={editor?.isActive("code")}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <IconCode />
          </ToolbarButton>
          <ToolbarButton
            title="Code block"
            active={editor?.isActive("codeBlock")}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <IconCodeBlock />
          </ToolbarButton>
          <ToolbarButton title="Insert link" active={editor?.isActive("link")} onClick={setLink}>
            <IconLink />
          </ToolbarButton>
          <ToolbarButton
            title="Remove link"
            disabled={!editor?.isActive("link")}
            onClick={() => editor?.chain().focus().unsetLink().run()}
          >
            Unlink
          </ToolbarButton>
          <ToolbarButton
            title="Horizontal rule"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <IconHr />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Clear formatting"
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <IconClear />
          </ToolbarButton>
          <ToolbarButton
            title={sourceMode ? "Visual editor" : "Edit HTML"}
            active={sourceMode}
            onClick={toggleSourceMode}
          >
            <IconHtml />
          </ToolbarButton>
        </div>

        {sourceMode ? (
          <textarea
            className="console-input console-textarea console-rich-editor__source"
            value={sourceValue}
            onChange={(event) => handleSourceChange(event.target.value)}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} className="console-rich-editor__content" />
        )}
      </div>

      <p className="console-field__hint">Disimpan otomatis sebagai HTML. Geser toolbar ke kanan untuk opsi lainnya.</p>
      {error ? <p className="console-field__error">{error}</p> : null}
    </div>
  );
}
