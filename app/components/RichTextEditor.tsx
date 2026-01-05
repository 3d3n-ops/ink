"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { useCallback, useRef, useState } from "react";

// Available fonts for the editor
const FONTS = [
  { name: "Default", value: "" },
  { name: "Serif", value: "Georgia, serif" },
  { name: "Sans", value: "system-ui, sans-serif" },
  { name: "Mono", value: "ui-monospace, monospace" },
  { name: "Merriweather", value: "Merriweather, Georgia, serif" },
  { name: "Playfair", value: "Playfair Display, Georgia, serif" },
  { name: "Lora", value: "Lora, Georgia, serif" },
  { name: "Source Sans", value: "Source Sans 3, system-ui, sans-serif" },
  { name: "Libre Baskerville", value: "Libre Baskerville, Georgia, serif" },
];

interface RichTextEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
}

// Helper to count words from text
function countWords(text: string): number {
  const cleanText = text.trim();
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
}

export default function RichTextEditor({
  content = "",
  onUpdate,
  onWordCountChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#FEBC2F] underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      TextStyle,
      FontFamily.configure({
        types: ["textStyle"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
      // Update word count
      const text = editor.getText();
      onWordCountChange?.(countWords(text));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[60vh] text-[#171717]",
      },
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // For now, convert to base64 (in production, upload to cloud storage)
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-10 bg-[#FFFAF0] border-b border-[#171717]/10 pb-3 mb-6">
        <div className="flex flex-wrap items-center gap-1">
          {/* Font Selector */}
          <div className="flex items-center border-r border-[#171717]/10 pr-2 mr-1">
            <FontSelector editor={editor} />
          </div>

          {/* Text Type Dropdown */}
          <div className="flex items-center gap-0.5 border-r border-[#171717]/10 pr-2 mr-1">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-0.5 border-r border-[#171717]/10 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <ItalicIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline"
            >
              <UnderlineIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <StrikeIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              title="Highlight"
            >
              <HighlightIcon />
            </ToolbarButton>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 border-r border-[#171717]/10 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <BulletListIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <OrderedListIcon />
            </ToolbarButton>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center gap-0.5 border-r border-[#171717]/10 pr-2 mr-1">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeftIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <AlignCenterIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <AlignRightIcon />
            </ToolbarButton>
          </div>

          {/* Other Tools */}
          <div className="flex items-center gap-0.5 border-r border-[#171717]/10 pr-2 mr-1">
            <ToolbarButton
              onClick={setLink}
              isActive={editor.isActive("link")}
              title="Add Link"
            >
              <LinkIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
            >
              <ImageIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={addImageFromUrl}
              title="Add Image from URL"
            >
              <ImageUrlIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Quote"
            >
              <QuoteIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="Inline Code"
            >
              <CodeIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="Code Block"
            >
              <CodeBlockIcon />
            </ToolbarButton>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <UndoIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <RedoIcon />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Editor Content */}
      <EditorContent editor={editor} className="editor-content" />

      <style jsx global>{`
        .ProseMirror {
          min-height: 60vh;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #171717;
          opacity: 0.3;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #FEBC2F;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 0.75rem;
          font-style: italic;
          color: #171717;
          opacity: 0.8;
        }
        .ProseMirror code {
          background: #171717;
          color: #FEBC2F;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-family: ui-monospace, monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre {
          background: #171717;
          color: #f8f8f2;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        .ProseMirror mark {
          background: #FEBC2F;
          color: #171717;
          padding: 0.1rem 0.2rem;
          border-radius: 2px;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #171717;
          opacity: 0.1;
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #FEBC2F;
        }
      `}</style>
    </div>
  );
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-all text-sm font-medium
        ${isActive ? "bg-[#FEBC2F] text-[#171717]" : "text-[#171717]/70 hover:bg-[#171717]/5"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

// Font Selector Component
function FontSelector({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!editor) return null;

  const currentFont = editor.getAttributes("textStyle").fontFamily || "";
  const currentFontName = FONTS.find(f => f.value === currentFont)?.name || "Default";

  const setFont = (fontValue: string) => {
    if (fontValue === "") {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontValue).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium text-[#171717]/70 hover:bg-[#171717]/5 transition-all min-w-[100px]"
        title="Change Font"
      >
        <FontIcon />
        <span className="truncate">{currentFontName}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-[#FFFAF0] border border-[#171717]/10 rounded-lg shadow-lg z-20 min-w-[160px] py-1 max-h-[280px] overflow-y-auto">
            {FONTS.map((font) => (
              <button
                key={font.name}
                onClick={() => setFont(font.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#171717]/5 transition-colors flex items-center justify-between
                  ${currentFont === font.value ? "bg-[#FEBC2F]/20 text-[#171717]" : "text-[#171717]/70"}
                `}
                style={{ fontFamily: font.value || "inherit" }}
              >
                <span>{font.name}</span>
                {currentFont === font.value && <CheckIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Icons
const FontIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
);

const UnderlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
    <line x1="4" y1="21" x2="20" y2="21"/>
  </svg>
);

const StrikeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12"/>
    <path d="M17.5 7.5A5 5 0 0 0 12 5a5 5 0 0 0-5 5c0 2.5 2 4 5 5s5 2.5 5 5a5 5 0 0 1-5 5 5 5 0 0 1-4.5-2.5"/>
  </svg>
);

const HighlightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 11-6 6v3h9l3-3"/>
    <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
);

const BulletListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="6" x2="20" y2="6"/>
    <line x1="9" y1="12" x2="20" y2="12"/>
    <line x1="9" y1="18" x2="20" y2="18"/>
    <circle cx="4" cy="6" r="1" fill="currentColor"/>
    <circle cx="4" cy="12" r="1" fill="currentColor"/>
    <circle cx="4" cy="18" r="1" fill="currentColor"/>
  </svg>
);

const OrderedListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <text x="3" y="7" fontSize="6" fill="currentColor" stroke="none">1</text>
    <text x="3" y="13" fontSize="6" fill="currentColor" stroke="none">2</text>
    <text x="3" y="19" fontSize="6" fill="currentColor" stroke="none">3</text>
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="15" y2="12"/>
    <line x1="3" y1="18" x2="18" y2="18"/>
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="6" y1="12" x2="18" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="9" y1="12" x2="21" y2="12"/>
    <line x1="6" y1="18" x2="21" y2="18"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QuoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const CodeBlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <polyline points="8 10 5 12 8 14"/>
    <polyline points="16 10 19 12 16 14"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6"/>
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const ImageUrlIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
    <path d="M14 14l2-2 2 2"/>
    <path d="M16 12v4"/>
  </svg>
);

