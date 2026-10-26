const MAX_SIDE = 1024;

/**
 * Shrinks a picked photo to a web-sized JPEG. Phone photos are often 5MB or more
 * and some are HEIC, which browsers cannot show. If the browser cannot decode the
 * file, the original is returned as is.
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff'; // PNGs with see-through areas would turn black in a JPEG
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (blob) return { blob, ext: 'jpg', type: 'image/jpeg' };
    }
  } catch {
    // fall through to the original file
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, ext, type: file.type || 'image/jpeg' };
}
