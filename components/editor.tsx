"use client";

import { useEffect, useState } from "react";
import type { Editor as TipTapEditor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
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
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink2,
} from "lucide-react";

import { MediaLibraryDialog } from "@/components/admin/media/media-library-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "editor-tool-button size-9 cursor-pointer rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground",
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
          "rich-content bg-white px-4 py-4 text-sm leading-7 text-foreground focus:outline-none sm:text-base",
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
      <div className="relative rounded-xl border bg-background shadow-xs">
        <Toolbar
          editor={editor}
          onLink={() => {
            setLinkValue(editor.getAttributes("link").href ?? "");
            setLinkOpen(true);
          }}
          onImageUrl={() => setImageOpen(true)}
          onLibrary={() => setLibraryOpen(true)}
        />
        <div className="overflow-hidden rounded-b-xl"><EditorContent editor={editor} /></div>
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
    <div className="sticky top-20 z-30 flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-background/10 bg-foreground p-2 shadow-lg shadow-foreground/15 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button.editor-tool-button]:text-background/80 [&>button.editor-tool-button]:hover:bg-background/10 [&>button.editor-tool-button]:hover:text-background" role="toolbar" aria-label="Rich text formatting">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="h-9 min-w-28 justify-between rounded-lg border-0 px-3 text-sm text-background hover:bg-background/10 hover:text-background">
            {editor.isActive("heading", { level: 1 }) ? "Heading 1" : editor.isActive("heading", { level: 2 }) ? "Heading 2" : editor.isActive("heading", { level: 3 }) ? "Heading 3" : editor.isActive("heading", { level: 4 }) ? "Heading 4" : editor.isActive("heading", { level: 5 }) ? "Heading 5" : editor.isActive("heading", { level: 6 }) ? "Heading 6" : "Paragraph"}
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-36 bg-white text-foreground shadow-xl">
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" />Paragraph</DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 1 }).run(); }}><Heading1 className="size-4" />Heading 1</DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 2 }).run(); }}><Heading2 className="size-4" />Heading 2</DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 3 }).run(); }}><Heading3 className="size-4" />Heading 3</DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 4 }).run(); }}>H4 <span>Heading 4</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 5 }).run(); }}>H5 <span>Heading 5</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); editor.chain().focus().setHeading({ level: 6 }).run(); }}>H6 <span>Heading 6</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="mx-1 h-6 w-px bg-border" />
      <Popover><PopoverTrigger asChild><Button type="button" size="icon-sm" variant="ghost" title="Text styles" className="size-9 rounded-lg text-background/80 hover:bg-background/10 hover:text-background"><Bold className="size-4" /></Button></PopoverTrigger><PopoverContent align="start" sideOffset={8} className="w-auto rounded-xl border-border/50 bg-popover p-1.5 shadow-xl"><div className="flex gap-1"><ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton><ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton><ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></ToolButton><ToolButton label="Strike through" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToolButton></div></PopoverContent></Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Text alignment" title="Text alignment" className={cn("size-9 rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white", editor.isActive({ textAlign: "center" }) || editor.isActive({ textAlign: "right" }) || editor.isActive({ textAlign: "justify" }) ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "")}>
            {editor.isActive({ textAlign: "center" }) ? <AlignCenter className="size-4" /> : editor.isActive({ textAlign: "right" }) ? <AlignRight className="size-4" /> : editor.isActive({ textAlign: "justify" }) ? <AlignJustify className="size-4" /> : <AlignLeft className="size-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-auto rounded-xl border-border/50 bg-white p-1.5 text-foreground shadow-xl">
          <div className="flex items-center gap-1">
            {[["left", AlignLeft, "Align left"], ["center", AlignCenter, "Align center"], ["right", AlignRight, "Align right"], ["justify", AlignJustify, "Justify"]].map(([alignment, Icon, label]) => (
              <Button key={alignment as string} type="button" size="icon" variant="ghost" title={label as string} aria-label={label as string} onClick={() => editor.chain().focus().setTextAlign(alignment as "left" | "center" | "right" | "justify").run()} className={cn("size-9 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground", editor.isActive({ textAlign: alignment }) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}><Icon className="size-4" /></Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
      <ToolButton label="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
      <ToolButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></ToolButton>
      <Popover>
        <PopoverTrigger asChild><Button type="button" size="icon-sm" variant="ghost" title="Insert table" aria-label="Insert table" className="size-9 rounded-lg text-background/80 hover:bg-background/10 hover:text-background"><Table2 className="size-4" /></Button></PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-48 rounded-xl border-border/50 bg-white p-2 text-foreground shadow-xl">
          <p className="px-2 pb-1 text-xs font-semibold text-foreground">Insert table</p>
          <div className="grid grid-cols-3 gap-1">
            {[2, 3, 4].map((size) => <Button key={size} type="button" variant="ghost" className="h-9 rounded-lg text-xs text-foreground hover:bg-accent hover:text-accent-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: size, cols: size, withHeaderRow: true }).run()}>{size} × {size}</Button>)}
          </div>
          <div className="mt-2 border-t pt-2">
            <p className="px-2 pb-1 text-xs font-semibold text-foreground">Edit selected table</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                ["Add row above", () => editor.chain().focus().addRowBefore().run()],
                ["Add row below", () => editor.chain().focus().addRowAfter().run()],
                ["Add column before", () => editor.chain().focus().addColumnBefore().run()],
                ["Add column after", () => editor.chain().focus().addColumnAfter().run()],
                ["Toggle header row", () => editor.chain().focus().toggleHeaderRow().run()],
                ["Delete table", () => editor.chain().focus().deleteTable().run()],
              ].map(([label, action]) => <Button key={label as string} type="button" variant="ghost" className={cn("h-8 justify-start rounded-lg px-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground", label === "Delete table" && "text-destructive hover:text-destructive")} onMouseDown={(event) => event.preventDefault()} onClick={action as () => void}>{label as string}</Button>)}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ToolButton label="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolButton>
      <ToolButton label="Insert link" active={editor.isActive("link")} onClick={onLink}><Link2 className="size-4" /></ToolButton>
      <ToolButton label="Choose image from media library" onClick={onLibrary}><ImagePlus className="size-4" /></ToolButton>
      <ToolButton label="Insert image URL" onClick={onImageUrl}><ImagePlus className="size-4 opacity-60" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-background/20" />
      <ToolButton label="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink2 className="size-4" /></ToolButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolButton>
      <ToolButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolButton>
      <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="size-4" /></ToolButton>
    </div>
  );
}
