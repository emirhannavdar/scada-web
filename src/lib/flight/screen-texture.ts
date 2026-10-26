import * as T from "three";
/** Preserve every pixel of the real SCADA screenshot inside the physical display. */
export function prepareDisplayTexture(texture: T.Texture, source = "") {
  const image = texture.image as { width: number; height: number };
  if (!image?.width || typeof document === "undefined") return texture;
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1096;
  const context = canvas.getContext("2d");
  if (!context) return texture;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f1820");
  gradient.addColorStop(1, "#0a1117");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  // A soft background fills ratio differences; the sharp foreground is always contained.
  const cover = Math.max(canvas.width / image.width, canvas.height / image.height);
  context.save();
  context.globalAlpha = 0.28;
  context.filter = "blur(28px) brightness(.58)";
  context.drawImage(
    texture.image as CanvasImageSource,
    (canvas.width - image.width * cover) / 2,
    (canvas.height - image.height * cover) / 2,
    image.width * cover,
    image.height * cover,
  );
  context.restore();
  // A small optical safe-area keeps the original browser and task bars away from the bezel.
  const firstDashboard = source.includes("monitor-dashboard-1.png"),
    safeWidth = canvas.width * 0.975,
    safeHeight = canvas.height * 0.955,
    fit = Math.min(safeWidth / image.width, safeHeight / image.height),
    w = firstDashboard ? canvas.width : image.width * fit,
    h = firstDashboard ? canvas.height : image.height * fit,
    x = firstDashboard ? 0 : (canvas.width - w) / 2,
    y = firstDashboard ? 0 : (canvas.height - h) / 2;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(texture.image as CanvasImageSource, x, y, w, h);
  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 2;
  context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  const glare = context.createLinearGradient(0, 0, canvas.width * 0.75, canvas.height * 0.45);
  glare.addColorStop(0, "rgba(255,255,255,0.08)");
  glare.addColorStop(0.16, "rgba(255,255,255,0.025)");
  glare.addColorStop(0.33, "rgba(255,255,255,0)");
  context.fillStyle = glare;
  context.fillRect(0, 0, canvas.width, canvas.height * 0.58);
  const vignette = context.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.15,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.72,
  );
  vignette.addColorStop(0.78, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.18)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);
  texture.image = canvas;
  texture.colorSpace = T.SRGBColorSpace;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
