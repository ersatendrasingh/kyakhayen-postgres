export type MediaType = "image" | "video" | "file";

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  storageKey: string;
  mimeType: string;
  mediaType: MediaType;
  fileSize: number;
  altText: string | null;
  createdAt: string;
  updatedAt: string;
};
