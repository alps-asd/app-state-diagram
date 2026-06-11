/**
 * Tag vocabulary - tags.html parsing per the ALPS Tag Vocabulary convention
 * (docs/tag-vocabulary.md)
 *
 * A vocabulary file defines each tag as the id of a <dt> element:
 * <dt id="flow-customer-purchase">Customer purchase</dt>. Extraction is a
 * light regex pass rather than full HTML parsing, so tag ids MUST be on
 * <dt> elements; ids on any other element are ignored.
 */

import * as fs from "fs";
import * as path from "path";

/** Defined tags: tag value -> human-readable title (the dt text content) */
export type TagVocabulary = Map<string, string>;

const DT_PATTERN = /<dt\b([^>]*)>([\s\S]*?)<\/dt>/gi;
const ID_PATTERN = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

/**
 * Extract the defined tags from vocabulary HTML: all id="..." values on
 * <dt> elements, mapped to the element's text content
 */
export function parseTagVocabulary(html: string): TagVocabulary {
  const vocabulary: TagVocabulary = new Map();
  for (const match of html.matchAll(DT_PATTERN)) {
    const idMatch = match[1].match(ID_PATTERN);
    const id = idMatch?.[1] ?? idMatch?.[2];
    if (!id) {
      continue;
    }
    const title = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    vocabulary.set(id, title);
  }
  return vocabulary;
}

/**
 * Read and parse a vocabulary file. The path is user-supplied input like
 * the profile path itself, so it is resolved as given (not sandboxed to
 * the profile directory).
 */
export function loadTagVocabulary(vocabularyPath: string): TagVocabulary {
  const absPath = path.resolve(vocabularyPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Vocabulary file not found: ${vocabularyPath}`);
  }
  return parseTagVocabulary(fs.readFileSync(absPath, "utf-8"));
}
