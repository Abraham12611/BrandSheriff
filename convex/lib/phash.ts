import { decode as jpegDecode } from "jpeg-js";
import UPNG from "upng-js";

// 16x16 average hash — 256 bits. Robust to resize/recompression/minor crops,
// which is exactly what re-hosted copycat images look like. Deliberately not
// semantic: it says "same image", never "same product".
const SIZE = 16;
const MAX_BYTES = 4 * 1024 * 1024;

type Pixels = { width: number; height: number; data: Uint8Array | Uint8ClampedArray };

function sniff(bytes: Uint8Array): "jpeg" | "png" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  return null;
}

function decode(bytes: Uint8Array, contentType?: string): Pixels | null {
  const kind =
    sniff(bytes) ??
    (contentType?.includes("jpeg") ? "jpeg" : contentType?.includes("png") ? "png" : null);
  if (kind === "jpeg") {
    const img = jpegDecode(bytes, { maxMemoryUsageInMB: 256, useTArray: true });
    if (!img?.data) return null;
    return { width: img.width, height: img.height, data: img.data };
  }
  if (kind === "png") {
    const img = UPNG.decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    if (!img) return null;
    const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
    return { width: img.width, height: img.height, data: rgba };
  }
  return null;
}

// Box-sample downscale to SIZE×SIZE, average luma per cell, threshold at the
// mean → hex string of SIZE*SIZE bits.
export function hashPixels(px: Pixels): string {
  const cells: number[] = new Array(SIZE * SIZE).fill(0);
  const counts: number[] = new Array(SIZE * SIZE).fill(0);
  for (let y = 0; y < px.height; y++) {
    const cy = Math.min(SIZE - 1, Math.floor((y / px.height) * SIZE));
    for (let x = 0; x < px.width; x++) {
      const i = (y * px.width + x) * 4;
      const luma = 0.299 * px.data[i] + 0.587 * px.data[i + 1] + 0.114 * px.data[i + 2];
      const cell = cy * SIZE + Math.min(SIZE - 1, Math.floor((x / px.width) * SIZE));
      cells[cell] += luma;
      counts[cell]++;
    }
  }
  let sum = 0;
  for (let c = 0; c < cells.length; c++) {
    cells[c] = counts[c] > 0 ? cells[c] / counts[c] : 0;
    sum += cells[c];
  }
  const mean = sum / cells.length;
  let hex = "";
  for (let i = 0; i < cells.length; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) {
      if (cells[i + b] >= mean) nibble |= 1 << (3 - b);
    }
    hex += nibble.toString(16);
  }
  return hex;
}

export function hashBytes(
  bytes: Uint8Array,
  contentType?: string,
): string | null {
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
  const px = decode(bytes, contentType);
  if (!px) return null;
  if (px.width * px.height > 25_000_000) return null; // avoid huge RGBA allocations
  return hashPixels(px);
}

export async function fetchAndHash(
  imageUrl: string,
): Promise<{ hash: string; bytes: Uint8Array; contentType: string } | null> {
  const res = await fetch(imageUrl);
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  const buf = new Uint8Array(await res.arrayBuffer());
  const hash = hashBytes(buf, contentType);
  if (!hash) return null;
  return { hash, bytes: buf, contentType: contentType || "image/jpeg" };
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let dist = 0;
  for (let i = 0; i < a.length; i += 16) {
    let x = BigInt("0x" + a.slice(i, i + 16)) ^ BigInt("0x" + b.slice(i, i + 16));
    while (x > 0n) {
      dist += Number(x & 1n);
      x >>= 1n;
    }
  }
  return dist;
}

// 0-1 similarity score: 1.0 = identical hash.
export function similarity(a: string, b: string): number {
  const bits = a.length * 4;
  if (bits === 0) return 0;
  return 1 - hammingDistance(a, b) / bits;
}
