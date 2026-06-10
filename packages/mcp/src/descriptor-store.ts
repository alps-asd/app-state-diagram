/**
 * Descriptor store - create descriptors in a JSON ALPS profile
 *
 * Like doc-store, edits the raw JSON surgically (preserving indentation
 * and everything else in the profile) rather than re-serializing a
 * normalized parse. Containers reference their children via href
 * fragments, following ALPS best practice; missing children are created
 * as top-level semantic descriptors.
 */

import * as fs from "fs";
import * as path from "path";
import { findDescriptorById } from "@alps-asd/app-state-diagram/parser/alps-parser.js";
import type { AlpsDescriptor } from "@alps-asd/app-state-diagram/parser/alps-parser.js";
import { serializeLike } from "./doc-store.js";

export interface AddDescriptorInput {
  id: string;
  type?: "semantic" | "safe" | "unsafe" | "idempotent";
  title?: string;
  rt?: string;
  tag?: string;
  /** Child descriptor ids; referenced as href fragments from the new descriptor */
  children?: string[];
  /** Id of an existing descriptor to nest the new one inside (default: top level) */
  parent?: string;
}

export interface AddDescriptorResult {
  id: string;
  /** Child ids that did not exist and were created as top-level semantic descriptors */
  createdChildren: string[];
  /** Warnings (e.g. rt target does not exist yet) */
  warnings: string[];
}

export interface SetTagsInput {
  id: string;
  /** Tags to append (ones already present are ignored) */
  add?: string[];
  /** Tags to remove */
  remove?: string[];
}

export interface SetTagsResult {
  id: string;
  /** Final tag list after the edit */
  tags: string[];
  /** Tags actually added (not already present) */
  added: string[];
  /** Tags actually removed (present before the edit) */
  removed: string[];
}

/**
 * Add a new descriptor to a JSON ALPS profile file
 */
export function addDescriptor(profilePath: string, input: AddDescriptorInput): AddDescriptorResult {
  const absPath = path.resolve(profilePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Profile file not found: ${profilePath}`);
  }
  const content = fs.readFileSync(absPath, "utf-8");
  if (!content.trim().startsWith("{")) {
    throw new Error(
      "Writing descriptors is currently supported for JSON profiles only. " +
        "Convert the XML profile to JSON, or edit the XML directly."
    );
  }

  let root: { alps?: { descriptor?: unknown } };
  try {
    root = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format: ${(e as Error).message}`);
  }
  if (!root.alps || typeof root.alps !== "object") {
    throw new Error("Missing alps property");
  }
  if (!Array.isArray(root.alps.descriptor)) {
    root.alps.descriptor = [];
  }
  const topLevel = root.alps.descriptor as AlpsDescriptor[];

  if (findDescriptorById(topLevel, input.id)) {
    throw new Error(`Descriptor already exists: ${input.id} (use alps_set_doc to update its documentation)`);
  }

  const warnings: string[] = [];
  const descriptor: AlpsDescriptor = { id: input.id };
  if (input.type && input.type !== "semantic") {
    descriptor.type = input.type;
  }
  if (input.title) {
    descriptor.title = input.title;
  }
  if (input.tag) {
    descriptor.tag = input.tag;
  }
  if (input.rt) {
    // Normalize a bare local id to a fragment reference
    const rt = /^#|:|\//.test(input.rt) || input.rt.includes("#") ? input.rt : `#${input.rt}`;
    descriptor.rt = rt;
    const target = rt.startsWith("#") ? rt.substring(1) : null;
    if (target && !findDescriptorById(topLevel, target)) {
      warnings.push(`rt target "#${target}" does not exist yet`);
    }
  }

  // Children: reference by href; create missing ones as top-level semantic descriptors
  const createdChildren: string[] = [];
  if (input.children && input.children.length > 0) {
    descriptor.descriptor = input.children.map(childId => ({ href: `#${childId}` }));
    for (const childId of input.children) {
      if (!findDescriptorById(topLevel, childId) && childId !== input.id) {
        topLevel.push({ id: childId });
        createdChildren.push(childId);
      }
    }
  }

  if (input.parent) {
    const parent = findDescriptorById(topLevel, input.parent);
    if (!parent) {
      throw new Error(`Parent descriptor not found: ${input.parent}`);
    }
    if (!Array.isArray(parent.descriptor)) {
      parent.descriptor = [];
    }
    parent.descriptor.push(descriptor);
  } else {
    topLevel.push(descriptor);
  }

  fs.writeFileSync(absPath, serializeLike(root, content), "utf-8");
  return { id: input.id, createdChildren, warnings };
}

/**
 * Add and/or remove tags in a descriptor's space-separated tag attribute.
 * Removals are applied first, then additions are appended after the kept
 * tags, which preserve their original order. The list is deduped and the
 * tag property is deleted when it becomes empty.
 */
export function setDescriptorTags(profilePath: string, input: SetTagsInput): SetTagsResult {
  if (!input.add?.length && !input.remove?.length) {
    throw new Error("At least one of add or remove is required");
  }
  const absPath = path.resolve(profilePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Profile file not found: ${profilePath}`);
  }
  const content = fs.readFileSync(absPath, "utf-8");
  if (!content.trim().startsWith("{")) {
    throw new Error(
      "Writing tags is currently supported for JSON profiles only. " +
        "Convert the XML profile to JSON, or edit the XML directly."
    );
  }

  let root: { alps?: { descriptor?: unknown } };
  try {
    root = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format: ${(e as Error).message}`);
  }
  const descriptor = findDescriptorById(root.alps?.descriptor, input.id);
  if (!descriptor) {
    throw new Error(`Descriptor not found: ${input.id}`);
  }

  const existing = [...new Set((descriptor.tag || "").split(/\s+/).filter(Boolean))];
  const removeSet = new Set(input.remove || []);
  const removed = existing.filter((tag) => removeSet.has(tag));
  const tags = existing.filter((tag) => !removeSet.has(tag));
  const added: string[] = [];
  for (const tag of input.add || []) {
    if (!tags.includes(tag) && !added.includes(tag)) {
      added.push(tag);
    }
  }
  tags.push(...added);

  if (tags.length === 0) {
    delete descriptor.tag;
  } else {
    descriptor.tag = tags.join(" ");
  }
  fs.writeFileSync(absPath, serializeLike(root, content), "utf-8");
  return { id: input.id, tags, added, removed };
}
