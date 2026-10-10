import { mergeAttributes, Node } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export const RichImage = Node.create({
  name: "image",
  inline: false,
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        class: "my-4 max-h-[480px] w-auto max-w-full rounded-xl object-cover",
      }),
    ];
  },
});

export const richContentExtensions = [
  StarterKit.configure({
    link: false,
    underline: false,
  }),
  Link.configure({
    autolink: true,
    defaultProtocol: "https",
    openOnClick: false,
  }),
  Underline,
  RichImage,
];
