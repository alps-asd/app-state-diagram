/**
 * Doc store - descriptor documentation with automatic externalization
 *
 * Short docs are stored inline in the ALPS profile. When a doc is too large
 * for inline use (long text, multi-line Markdown), it is written to
 * `alps/docs/<descriptor-id>.md` next to the profile and linked from the
 * descriptor via `doc.href`, keeping the profile compact while allowing
 * rich documentation.
 *
 * The `alps/` directory is the home for auxiliary design information:
 * docs/ (descriptor documentation), rels/ (link relation definitions),
 * links/ (compacted summaries of external link targets).
 */

import * as fs from "fs";
import * as path from "path";
import { findDescriptorById } from "@alps-asd/app-state-diagram/parser/alps-parser.js";
import type { AlpsDoc } from "@alps-asd/app-state-diagram/parser/alps-parser.js";

export const DOC_DIR = "alps/docs";

/** Docs longer than this (or multi-line) are stored in an external file */
export const INLINE_DOC_MAX_LENGTH = 200;

export type DocPlacement = "auto" | "inline" | "external";

export interface SetDocResult {
  id: string;
  placement: "inline" | "external";
  /** Path of the external doc file (relative to the profile), when external */
  docFile?: string;
  /** Previous external doc file left behind after switching to inline */
  orphanedDocFile?: string;
}

/**
 * Decide whether a doc should be stored in an external file
 */
export function shouldExternalize(doc: string): boolean {
  return doc.length > INLINE_DOC_MAX_LENGTH || doc.includes("\n");
}

/**
 * Set or update the doc of a descriptor in a JSON ALPS profile file.
 *
 * With placement 'auto', the doc is stored externally when it is large
 * (see shouldExternalize) or when the descriptor already links a local
 * doc file via doc.href (to avoid churn between inline and external).
 */
export function setDescriptorDoc(
  profilePath: string,
  id: string,
  doc: string,
  placement: DocPlacement = "auto"
): SetDocResult {
  const absPath = path.resolve(profilePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Profile file not found: ${profilePath}`);
  }

  const content = fs.readFileSync(absPath, "utf-8");
  if (!content.trim().startsWith("{")) {
    throw new Error(
      "Writing docs is currently supported for JSON profiles only. " +
        "Convert the XML profile to JSON, or edit the XML directly."
    );
  }

  let root: any;
  try {
    root = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format: ${(e as Error).message}`);
  }

  const descriptor = findDescriptorById(root?.alps?.descriptor, id);
  if (!descriptor) {
    throw new Error(`Descriptor not found: ${id}`);
  }

  const baseDir = path.dirname(absPath);
  const existingDoc: string | AlpsDoc | undefined = descriptor.doc;
  const existingHref =
    typeof existingDoc === "object" && existingDoc?.href ? existingDoc.href : undefined;
  // Unsafe hrefs (absolute, ../ traversal, schemes) are never reused as write targets
  const hasExternalDoc =
    existingHref !== undefined && resolveSafeLocalPath(baseDir, existingHref) !== undefined;

  let external: boolean;
  if (placement === "auto") {
    external = hasExternalDoc || shouldExternalize(doc);
  } else {
    external = placement === "external";
  }

  const result: SetDocResult = { id, placement: external ? "external" : "inline" };

  if (external) {
    // Reuse the existing local doc file location when present
    const docFile = hasExternalDoc ? existingHref! : `${DOC_DIR}/${safeFileName(id)}.md`;
    const docFilePath = resolveSafeLocalPath(baseDir, docFile);
    if (!docFilePath) {
      // Reachable only when the default doc dir is a symlink escaping baseDir
      throw new Error(`Unsafe doc path: ${docFile}`);
    }
    fs.mkdirSync(path.dirname(docFilePath), { recursive: true });
    fs.writeFileSync(docFilePath, doc.endsWith("\n") ? doc : `${doc}\n`, "utf-8");
    const format =
      typeof existingDoc === "object" && hasExternalDoc && existingDoc.format
        ? existingDoc.format
        : "markdown";
    descriptor.doc = { href: docFile, format };
    result.docFile = docFile;
  } else {
    if (hasExternalDoc) {
      // The previous external file is kept; deleting user files silently is unsafe
      result.orphanedDocFile = existingHref;
    }
    if (typeof existingDoc === "object" && existingDoc !== null && !hasExternalDoc) {
      // Preserve object form (and format) of an existing inline doc
      const inlineDoc: AlpsDoc = { ...existingDoc, value: doc };
      delete inlineDoc.href;
      descriptor.doc = inlineDoc;
    } else {
      descriptor.doc = doc;
    }
  }

  fs.writeFileSync(absPath, serializeLike(root, content), "utf-8");
  return result;
}

/**
 * Resolve the doc of a descriptor, reading external doc files (e.g. alps/docs/)
 */
export function resolveDoc(
  baseDir: string,
  doc: string | AlpsDoc | undefined
): { text: string; href?: string; format?: string } | undefined {
  if (doc === undefined || doc === null) {
    return undefined;
  }
  if (typeof doc === "string") {
    return { text: doc };
  }
  if (doc.href) {
    const docPath = resolveSafeLocalPath(baseDir, doc.href);
    if (docPath && fs.existsSync(docPath)) {
      return { text: fs.readFileSync(docPath, "utf-8"), href: doc.href, format: doc.format };
    }
  }
  return { text: doc.value || "", href: doc.href, format: doc.format };
}

/**
 * Resolve a doc href against the profile directory, rejecting anything
 * that escapes it: URL schemes ("http:", "file:", Windows drives),
 * protocol-relative or absolute paths, backslashes, and ../ traversal.
 * Symlinks inside the profile directory are legitimate (e.g. compat
 * links keeping old layouts working), but their real targets must stay
 * inside it. Returns the absolute path, or undefined when unsafe.
 */
function resolveSafeLocalPath(baseDir: string, href: string): string | undefined {
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
  // Compare real paths so a symlinked component cannot escape baseDir.
  // The target file may not exist yet (first write), so check the
  // deepest existing ancestor instead.
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

/**
 * Turn a descriptor id into a safe file name for alps/docs/
 */
function safeFileName(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]/g, "-");
}

/**
 * Serialize JSON keeping the original file's indentation and trailing newline
 */
function serializeLike(root: unknown, original: string): string {
  const indentMatch = original.match(/^([ \t]+)"/m);
  const indent = indentMatch ? indentMatch[1] : "  ";
  const json = JSON.stringify(root, null, indent);
  return original.endsWith("\n") ? `${json}\n` : json;
}
