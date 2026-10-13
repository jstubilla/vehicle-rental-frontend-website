/** The longest side, in pixels, a photo is scaled down to before it is stored. */
const MAX_SIDE = 1400;
const JPEG_QUALITY = 0.75;
/** The largest original file accepted (phone photos are usually 2 to 8 MB). */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export type PhotoError = "notImage" | "tooLarge" | "unreadable";

/**
 * Turns a photo the visitor picked into a smaller JPEG data URL, so ID photos stay readable
 * but light enough to keep. Throws a PhotoError code when the file cannot be used.
 */
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw "notImage" satisfies PhotoError;
  if (file.size > MAX_PHOTO_BYTES) throw "tooLarge" satisfies PhotoError;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw "unreadable" satisfies PhotoError;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw "unreadable" satisfies PhotoError;
  // JPEG has no transparency: give see-through PNGs a white background instead of black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
