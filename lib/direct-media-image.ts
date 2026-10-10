export function shouldServeDirectMediaImage(src: string | null | undefined) {
  if (!src || src.startsWith("/")) return false;

  try {
    const url = new URL(src);
    return (
      url.hostname.endsWith(".cloudfront.net") ||
      url.hostname.endsWith(".amazonaws.com")
    );
  } catch {
    return false;
  }
}
