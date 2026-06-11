import * as fs from "fs";
import * as path from "path";

export const DOC_DIR = "alps/docs";
export const INLINE_DOC_MAX_LENGTH = 200;

export function shouldExternalize(doc: string): boolean {
  return doc.length > INLINE_DOC_MAX_LENGTH || doc.includes("\n");
}

export function resolveSafeLocalPath(baseDir: string, href: string): string | undefined {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
    return undefined;
  }
  if (href.startsWith("//") || href.includes("\\") || path.isAbsolute(href)) {
    return undefined;
  }
  const abs = path.resolve(baseDir, href);
  const rel = path.relative(baseDir, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return undefined;
  }
  try {
    const baseReal = fs.realpathSync(baseDir);
    let existing = abs;
    while (!fs.existsSync(existing)) {
      existing = path.dirname(existing);
    }
    const existingReal = fs.realpathSync(existing);
    if (existingReal !== baseReal && !existingReal.startsWith(baseReal + path.sep)) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return abs;
}

export function safeFileName(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]/g, "-");
}
