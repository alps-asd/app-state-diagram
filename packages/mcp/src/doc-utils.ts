// Path safety and profile serialization are shared with the CLI (HTML
// output reads the same doc files), so they live in one place
export { resolveSafeLocalPath, serializeLike, XML_ROUNDTRIP_OPTIONS } from "@alps-asd/app-state-diagram/resolver/doc-inliner.js";

export const DOC_DIR = "alps/docs";
export const INLINE_DOC_MAX_LENGTH = 200;

export function shouldExternalize(doc: string): boolean {
  return doc.length > INLINE_DOC_MAX_LENGTH || doc.includes("\n");
}

export function safeFileName(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]/g, "-");
}
