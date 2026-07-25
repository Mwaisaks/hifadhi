import { put, get } from "@vercel/blob";

/** Pathname within the Blob store — this is what's stored in the DB as file_path. */
export function documentBlobPathname(userId: string, documentId: string): string {
  return `documents/${userId}/${documentId}.enc`;
}

export async function uploadDocumentBlob(
  pathname: string,
  data: Buffer
): Promise<string> {
  const blob = await put(pathname, data, {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/octet-stream",
  });
  return blob.pathname;
}

export async function downloadDocumentBlob(pathname: string): Promise<Buffer> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error("Document blob not found");
  }
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}
