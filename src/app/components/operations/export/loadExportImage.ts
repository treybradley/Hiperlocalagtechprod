function loadImageElement(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/** Load a photo for canvas export (handles signed URLs + base64). */
export async function loadExportImage(url: string): Promise<HTMLImageElement> {
  if (url.startsWith('data:')) {
    return loadImageElement(url);
  }

  try {
    return await loadImageElement(url, 'anonymous');
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
      return await loadImageElement(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
