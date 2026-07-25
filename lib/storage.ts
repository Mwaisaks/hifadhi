import fs from "fs";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export function userStorageDir(userId: string): string {
  const dir = path.join(STORAGE_ROOT, userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Relative path (userId/documentId.enc) — this is what's stored in the DB. */
export function relativeDocumentPath(userId: string, documentId: string): string {
  return path.join(userId, `${documentId}.enc`);
}

/** Absolute path on disk for a document's relative file_path. */
export function absoluteDocumentPath(relativePath: string): string {
  return path.join(STORAGE_ROOT, relativePath);
}
