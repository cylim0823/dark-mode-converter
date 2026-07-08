export function createDownloadUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeDownloadUrls(urls: Array<string | null>): void {
  urls.forEach((url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  });
}

export function getBaseFileName(name: string): string {
  return name.replace(/\.[^.]+$/i, "").replace(/[^\w.-]+/g, "-") || "converted";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
