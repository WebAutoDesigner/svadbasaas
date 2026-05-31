import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Адаптер файлового хранилища. Сейчас — локальная ФС (UPLOAD_DIR).
 * При масштабе заменяется на S3-реализацию без изменения вызывающего кода.
 */

const UPLOAD_DIR = process.env["UPLOAD_DIR"] ?? path.join(process.cwd(), "uploads");

function resolveKey(key: string): string {
  // Защита от path traversal: ключ не должен выходить за UPLOAD_DIR
  const full = path.resolve(UPLOAD_DIR, key);
  if (!full.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error("Invalid storage key");
  }
  return full;
}

/** Генерирует storageKey вида weddingId/uuid.ext */
export function makeStorageKey(weddingId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 12);
  return `${weddingId}/${randomUUID()}${ext}`;
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  return readFile(resolveKey(key));
}

export function getObjectStream(key: string): NodeJS.ReadableStream {
  return createReadStream(resolveKey(key));
}

export async function deleteObject(key: string): Promise<void> {
  const full = resolveKey(key);
  if (existsSync(full)) await unlink(full);
}
