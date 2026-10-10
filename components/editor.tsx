"use client";

import { useEffect, useState } from "react";
import type { Editor as TipTapEditor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink2,
} from "lucide-react";

import { MediaLibraryDialog } from "@/components/admin/media/media-library-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { richContentExtensions } from "@/components/rich-content-extensions";
import { cn } from "@/lib/utils";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-9 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
      )}
    >
      {children}
    </Button>
  );
}

export const Editor = ({ value, onChange, compact = false }: EditorProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const editor = useEditor({
    extensions: richContentExtensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "rich-content px-4 py-4 text-sm leading-7 text-foreground focus:outline-none sm:text-base",
          compact ? "min-h-40" : "min-h-72"
        ),
      },
    },
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const href = linkValue.trim();
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
    setLinkValue("");
  };

  const insertImage = (url: string, alt: string) => {
    if (!url.trim()) return;
    editor.chain().focus().insertContent({
      type: "image",
      attrs: { src: url.trim(), alt: alt.trim() || null },
    }).run();
    setImageOpen(false);
    setImageUrl("");
    setImageAlt("");
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <Toolbar
          editor={editor}
          onLink={() => {
            setLinkValue(editor.getAttributes("link").href ?? "");
            setLinkOpen(true);
          }}
          onImageUrl={() => setImageOpen(true)}
          onLibrary={() => setLibraryOpen(true)}
        />
        <EditorContent editor={editor} />
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
            <DialogDescription>Add the destination URL for the selected text.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://example.com"
            className="h-11 rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button onClick={setLink}>Apply link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert image URL</DialogTitle>
            <DialogDescription>Paste an existing public image URL into the article.</DialogDescription>
          </DialogHeader>
          <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." className="h-11 rounded-xl" />
          <Input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Accessible image description" className="h-11 rounded-xl" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageOpen(false)}>Cancel</Button>
            <Button onClick={() => insertImage(imageUrl, imageAlt)}>Insert image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        accept="image"
        title="Choose editor image"
        onSelect={(asset, altText) => {
          insertImage(asset.url, altText);
          setLibraryOpen(false);
        }}
      />
    </>
  );
};

function Toolbar({
  editor,
  onLink,
  onImageUrl,
  onLibrary,
}: {
  editor: TipTapEditor;
  onLink: () => void;
  onImageUrl: () => void;
  onLibrary: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 p-2" role="toolbar" aria-label="Rich text formatting">
      <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton>
      <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
      <ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></ToolButton>
      <ToolButton label="Strike through" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /></ToolButton>
      <ToolButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /></ToolButton>
      <ToolButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolButton>
      <ToolButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
      <ToolButton label="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
      <ToolButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></ToolButton>
      <ToolButton label="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Insert link" active={editor.isActive("link")} onClick={onLink}><Link2 className="size-4" /></ToolButton>
      <ToolButton label="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink2 className="size-4" /></ToolButton>
      <ToolButton label="Choose image from media library" onClick={onLibrary}><ImagePlus className="size-4" /></ToolButton>
      <ToolButton label="Insert image URL" onClick={onImageUrl}><ImagePlus className="size-4 opacity-60" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolButton>
      <ToolButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolButton>
      <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="size-4" /></ToolButton>
    </div>
  );
}
