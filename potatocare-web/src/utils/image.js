// Center-crops the picked photo to a square and re-encodes it as JPEG (max 1024px,
// quality 0.8). That is what expo-image-picker did on the phone (aspect [1, 1],
// quality 0.8); it also makes uploads much smaller than raw camera photos.
export async function prepareImage(file, { size = 1024, quality = 0.8 } = {}) {
  const { source, width, height } = await loadSource(file);
  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  const out = Math.min(size, side);

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // JPEG has no alpha: avoid black backgrounds for PNGs
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(source, sx, sy, side, side, 0, 0, out, out);
  if (typeof source.close === "function") source.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      quality
    );
  });
}

async function loadSource(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file); // honours EXIF orientation
      return { source: bmp, width: bmp.width, height: bmp.height };
    } catch {
      /* fall back to <img> decoding below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Unsupported image"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
