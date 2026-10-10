import type { ContentDraft, ReelScene } from "@/lib/content-pipeline/reel-draft";

type ReelRenderInput = {
  draft: ContentDraft;
  scenes: ReelScene[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  showTextOverlay: boolean;
};

type RenderedReel = {
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
  audioAttached: boolean;
};

type AudioBundle = {
  stream: MediaStream;
  start: () => Promise<void>;
  stop: () => void;
};

const width = 1080;
const height = 1920;
const frameRate = 30;

function renderableMediaUrl(url: string) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;

  try {
    const parsedUrl = new URL(url, window.location.href);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return url;
    if (parsedUrl.origin === window.location.origin) return parsedUrl.toString();

    return `/api/admin/content-pipeline/media-proxy?url=${encodeURIComponent(
      parsedUrl.toString()
    )}`;
  } catch {
    return url;
  }
}

function supportedRecorderMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the recipe image for rendering."));
    image.src = renderableMediaUrl(url);
  });
}

function loadOptionalImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = renderableMediaUrl(url);
  });
}

function waitForMedia(element: HTMLMediaElement) {
  return new Promise<void>((resolve, reject) => {
    if (element.readyState >= 2) {
      resolve();
      return;
    }

    element.onloadeddata = () => resolve();
    element.onerror = () => reject(new Error("Unable to load the selected reel media."));
  });
}

async function loadVideo(url: string) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = renderableMediaUrl(url);
  await waitForMedia(video);
  return video;
}

async function loadAudio(url: string, durationSeconds: number): Promise<AudioBundle> {
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("This browser cannot attach audio to the rendered reel.");
  }

  const response = await fetch(renderableMediaUrl(url));
  if (!response.ok) {
    throw new Error("Unable to load the voiceover audio for rendering.");
  }

  const audioContext = new AudioContextClass();
  const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
  const destination = audioContext.createMediaStreamDestination();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);

  return {
    stream: destination.stream,
    start: async () => {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      source.start(0, 0, Math.min(durationSeconds, buffer.duration));
    },
    stop: () => {
      try {
        source.stop();
      } catch {
        // Source may already be stopped when the render reaches the end.
      }
      void audioContext.close().catch(() => undefined);
    },
  };
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  context.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawContain(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const scale = Math.min(dw / sourceWidth, dh / sourceHeight);
  const renderWidth = sourceWidth * scale;
  const renderHeight = sourceHeight * scale;
  context.drawImage(
    source,
    dx + (dw - renderWidth) / 2,
    dy + (dh - renderHeight) / 2,
    renderWidth,
    renderHeight
  );
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
  context.fill();
}

function wrapLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 5
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = testLine;
  });

  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/\s+\S+$/, "")}...`;
  return clipped;
}

function sceneStartSecond(seconds: string, fallbackIndex: number) {
  const start = Number(seconds.split("-")[0]);
  return Number.isFinite(start) ? start : fallbackIndex * 4;
}

function sceneAtTime(scenes: ReelScene[], elapsed: number) {
  if (!scenes.length) return { scene: null, index: 0, sceneProgress: 0 };

  const starts = scenes.map((scene, index) => sceneStartSecond(scene.seconds, index));
  let index = starts.findIndex((start, startIndex) => {
    const nextStart = starts[startIndex + 1] ?? Number.POSITIVE_INFINITY;
    return elapsed >= start && elapsed < nextStart;
  });
  if (index < 0) index = scenes.length - 1;

  const start = starts[index] ?? 0;
  const end = starts[index + 1] ?? start + 4;
  const sceneProgress = Math.min(Math.max((elapsed - start) / Math.max(end - start, 1), 0), 1);

  return { scene: scenes[index] ?? null, index, sceneProgress };
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  scenes: ReelScene[],
  elapsed: number,
  durationSeconds: number,
  showTextOverlay: boolean,
  brandLogo: HTMLImageElement | null
) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(0,0,0,0.46)");
  gradient.addColorStop(0.32, "rgba(0,0,0,0.06)");
  gradient.addColorStop(1, "rgba(0,0,0,0.76)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  if (!showTextOverlay) return;

  const { scene } = sceneAtTime(scenes, elapsed);
  context.save();

  context.fillStyle = "rgba(255,255,255,0.92)";
  roundedRect(context, 72, 72, 72, 72, 36);
  if (brandLogo) {
    drawContain(
      context,
      brandLogo,
      brandLogo.naturalWidth,
      brandLogo.naturalHeight,
      83,
      88,
      62,
      50
    );
  }

  context.fillStyle = "#ffffff";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.font = "800 36px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("Kya Khayen?", 164, 109);

  if (scene) {
    const bottom = height - 150;
    context.fillStyle = "#ffffff";
    context.font = `900 ${scene.text.length > 62 ? 72 : scene.text.length > 36 ? 84 : 98}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    context.textBaseline = "alphabetic";
    const titleLines = wrapLines(context, scene.text, width - 144, 3);
    titleLines.forEach((line, lineIndex) => {
      context.fillText(line, 72, bottom - 420 + lineIndex * 92);
    });

    const speechLines = wrapLines(context, scene.speechLine, width - 204, 3);
    context.fillStyle = "rgba(0,0,0,0.54)";
    roundedRect(context, 72, bottom - 6, width - 144, 132, 28);
    context.fillStyle = "#ffffff";
    context.font = "800 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    speechLines.forEach((line, lineIndex) => {
      context.fillText(line, 104, bottom + 42 + lineIndex * 38);
    });
  }

  context.fillStyle = "rgba(255,255,255,0.22)";
  roundedRect(context, 72, height - 68, width - 144, 10, 5);
  context.fillStyle = "#f3b33d";
  roundedRect(
    context,
    72,
    height - 68,
    (width - 144) * Math.min(elapsed / Math.max(durationSeconds, 1), 1),
    10,
    5
  );

  context.restore();
}

function drawTemplateFrame(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  elapsed: number,
  durationSeconds: number
) {
  if (!image) {
    context.fillStyle = "#24130d";
    context.fillRect(0, 0, width, height);
    return;
  }

  const progress = Math.min(elapsed / Math.max(durationSeconds, 1), 1);
  const scale = 1.08 + progress * 0.16;
  const offsetX = Math.sin(progress * Math.PI * 2) * 80;
  const offsetY = Math.cos(progress * Math.PI) * 52;
  context.save();
  context.translate(width / 2 + offsetX, height / 2 + offsetY);
  context.scale(scale, scale);
  drawCover(
    context,
    image,
    image.naturalWidth,
    image.naturalHeight,
    -width / 2,
    -height / 2,
    width,
    height
  );
  context.restore();
}

export async function renderReelToBlob({
  draft,
  scenes,
  imageUrl,
  videoUrl,
  audioUrl,
  showTextOverlay,
}: ReelRenderInput): Promise<RenderedReel> {
  if (!("MediaRecorder" in window)) {
    throw new Error("This browser cannot render video. Use Chrome/Safari with MediaRecorder support.");
  }

  const mimeType = supportedRecorderMimeType();
  if (!mimeType) {
    throw new Error("This browser cannot create MP4/WebM video from the reel preview.");
  }

  if (!audioUrl) {
    throw new Error("Render needs a voiceover. Upload an audio file first.");
  }

  const durationSeconds = Math.max(draft.durationSeconds || 24, 6);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the reel render canvas.");

  const video = videoUrl ? await loadVideo(videoUrl) : null;
  const image = !video && imageUrl ? await loadImage(imageUrl) : null;
  const brandLogo = await loadOptionalImage("/assets/images/kyakhayen-logo.png");
  const audioBundle = await loadAudio(audioUrl, durationSeconds);
  const audioTracks = audioBundle.stream.getAudioTracks();
  if (!audioTracks.length) {
    throw new Error("The selected voiceover did not provide an audio track.");
  }

  const canvasStream = canvas.captureStream(frameRate);
  const stream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks,
  ]);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  return await new Promise<RenderedReel>((resolve, reject) => {
    let animationFrame = 0;
    let startedAt = 0;

    const cleanup = () => {
      window.cancelAnimationFrame(animationFrame);
      video?.pause();
      audioBundle.stop();
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      cleanup();
      reject(new Error("Unable to record the reel preview."));
    };
    recorder.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: mimeType });
      resolve({
        blob,
        mimeType,
        extension: mimeType.includes("mp4") ? "mp4" : "webm",
        audioAttached: true,
      });
    };

    const renderFrame = (timestamp: number) => {
      if (!startedAt) startedAt = timestamp;
      const elapsed = Math.min((timestamp - startedAt) / 1000, durationSeconds);

      context.clearRect(0, 0, width, height);
      if (video) {
        drawCover(
          context,
          video,
          video.videoWidth || width,
          video.videoHeight || height,
          0,
          0,
          width,
          height
        );
      } else {
        drawTemplateFrame(context, image, elapsed, durationSeconds);
      }
      drawOverlay(context, scenes, elapsed, durationSeconds, showTextOverlay, brandLogo);

      if (elapsed >= durationSeconds) {
        recorder.stop();
        return;
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    void (async () => {
      try {
        recorder.start(1000);
        if (video) await video.play();
        await audioBundle.start();
        animationFrame = window.requestAnimationFrame(renderFrame);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error("Unable to start reel rendering."));
      }
    })();
  });
}
