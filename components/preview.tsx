"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

import Loader from "@/components/loader";
import { richContentExtensions } from "@/components/rich-content-extensions";
import { cn } from "@/lib/utils";

interface PreviewProps {
  value: string;
  className?: string;
}

export const Preview = ({ value, className }: PreviewProps) => {
  const editor = useEditor({
    extensions: richContentExtensions,
    content: value,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <Loader />;
  }

  return (
    <EditorContent
      editor={editor}
      className={cn("rich-content text-base leading-7 text-gray-700", className)}
    />
  );
};
