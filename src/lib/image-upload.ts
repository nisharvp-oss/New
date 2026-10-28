/** Scales a photo down to maxEdge on its long side and re-encodes it as JPEG, so pages stay fast. */
export async function prepareImage(file: File, maxEdge = 2400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read this image"))), "image/jpeg", 0.82));
}

export const RECEIPT_MAX_BYTES = 50 * 1024;

/** Sizes tried in order, from sharpest to smallest: long edge in px and JPEG quality. */
export const SHRINK_STEPS = [1600, 1280, 1024, 800, 640, 480, 360].flatMap((edge) => [0.72, 0.55, 0.4].map((quality) => ({ edge, quality })));

/**
 * Re-encodes an image with ever smaller settings until it fits in maxBytes, keeping the sharpest
 * version that fits. `encode` does the drawing, so this stays testable without a browser.
 */
export async function shrinkToFit(encode: (edge: number, quality: number) => Promise<Blob>, maxBytes = RECEIPT_MAX_BYTES): Promise<Blob> {
  let smallest: Blob | null = null;
  for (const { edge, quality } of SHRINK_STEPS) {
    const blob = await encode(edge, quality);
    if (blob.size <= maxBytes) return blob;
    if (!smallest || blob.size < smallest.size) smallest = blob;
  }
  throw new Error(`Couldn't shrink this photo below ${Math.round(maxBytes / 1024)} KB${smallest ? ` (smallest was ${Math.round(smallest.size / 1024)} KB)` : ""}`);
}

/** A receipt photo as a JPEG of at most 50 KB, shrunk on the device before upload. */
export async function prepareReceipt(file: File, maxBytes = RECEIPT_MAX_BYTES): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo of the receipt");
  const bitmap = await createImageBitmap(file);
  try {
    return await shrinkToFit((edge, quality) => {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      // Receipts are mostly white paper: a white background keeps transparent PNGs readable.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read this photo"))), "image/jpeg", quality));
    }, maxBytes);
  } finally {
    bitmap.close();
  }
}
