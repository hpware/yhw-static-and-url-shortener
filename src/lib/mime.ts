// MIME type mapping for common file extensions
const mimeTypes: Record<string, string> = {
  // HTML
  html: "text/html",
  htm: "text/html",

  // CSS
  css: "text/css",

  // JavaScript
  js: "application/javascript",
  mjs: "application/javascript",
  cjs: "application/javascript",

  // JSON
  json: "application/json",

  // XML
  xml: "application/xml",

  // Text
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",

  // Images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  bmp: "image/bmp",
  avif: "image/avif",

  // Fonts
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",

  // Video
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  avi: "video/x-msvideo",
  mov: "video/quicktime",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Archives
  zip: "application/zip",
  tar: "application/x-tar",
  gz: "application/gzip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",

  // WebAssembly
  wasm: "application/wasm",

  // Manifests
  webmanifest: "application/manifest+json",
  manifest: "text/cache-manifest",

  // Source maps
  map: "application/json",

  // TypeScript (for serving raw files)
  ts: "application/typescript",
  tsx: "application/typescript",

  // YAML
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
};

// Get MIME type from file extension
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  return mimeTypes[ext] || "application/octet-stream";
}

// Get file extension from MIME type
export function getExtensionFromMime(mimeType: string): string | null {
  for (const [ext, mime] of Object.entries(mimeTypes)) {
    if (mime === mimeType) return ext;
  }
  return null;
}

// Check if MIME type is text-based (for encoding handling)
export function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/javascript" ||
    mimeType === "application/xml" ||
    mimeType === "application/typescript" ||
    mimeType === "image/svg+xml"
  );
}

// Check if file should be served with gzip compression
export function isCompressible(mimeType: string): boolean {
  return (
    isTextMimeType(mimeType) ||
    mimeType === "application/wasm" ||
    mimeType === "application/manifest+json"
  );
}
