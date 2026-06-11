import * as fs from "fs";
import * as path from "path";
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import type { AddDescriptorInput, AddDescriptorResult, RenameResult, SetTagsInput, SetTagsResult } from "./descriptor-store.js";
import type { DocPlacement, SetDocResult } from "./doc-store.js";
import { DOC_DIR, resolveSafeLocalPath, safeFileName, shouldExternalize } from "./doc-utils.js";

const ATTRS = ":@";
const ATTR_PREFIX = "@_";
const TEXT = "#text";
const COMMENT = "#comment";
const CDATA = "#cdata";
const XML_OPTIONS = {
  preserveOrder: true,
  ignoreAttributes: false,
  commentPropName: COMMENT,
  cdataPropName: CDATA,
} as const;

type XmlAttrs = Record<string, string>;
type XmlNode = Record<string, unknown>;
interface LoadedXmlProfile { absPath: string; baseDir: string; tree: XmlNode[]; alpsNode: XmlNode }

export function setXmlDescriptorDoc(profilePath: string, id: string, doc: string, placement: DocPlacement = "auto"): SetDocResult {
  const profile = loadXmlProfile(profilePath);
  const descriptor = findXmlDescriptorById(profile.alpsNode, id);
  if (!descriptor) throw new Error(`Descriptor not found: ${id}`);

  const existingDocNode = directChildElement(descriptor, "doc");
  const existingHref = existingDocNode ? getAttr(existingDocNode, "href") : undefined;
  const hasExternalDoc = existingHref !== undefined && resolveSafeLocalPath(profile.baseDir, existingHref) !== undefined;
  const external = placement === "auto" ? hasExternalDoc || shouldExternalize(doc) : placement === "external";
  const result: SetDocResult = { id, placement: external ? "external" : "inline" };
  const docNode = existingDocNode ?? insertDocNode(descriptor);

  if (external) {
    const docFile = hasExternalDoc ? existingHref! : `${DOC_DIR}/${safeFileName(id)}.md`;
    const docFilePath = resolveSafeLocalPath(profile.baseDir, docFile);
    if (!docFilePath) throw new Error(`Unsafe doc path: ${docFile}`);
    fs.mkdirSync(path.dirname(docFilePath), { recursive: true });
    fs.writeFileSync(docFilePath, doc.endsWith("\n") ? doc : `${doc}\n`, "utf-8");
    const format = hasExternalDoc && getAttr(docNode, "format") ? getAttr(docNode, "format")! : "markdown";
    setElementAttrs(docNode, orderedAttrs([["href", docFile], ["format", format]]));
    setElementChildren(docNode, []);
    result.docFile = docFile;
  } else {
    if (hasExternalDoc) {
      result.orphanedDocFile = existingHref;
      setElementAttrs(docNode, {});
    } else if (existingDocNode) {
      deleteAttr(docNode, "href");
    }
    setElementChildren(docNode, [textNode(doc)]);
  }
  writeXmlProfile(profile);
  return result;
}

export function addXmlDescriptor(profilePath: string, input: AddDescriptorInput): AddDescriptorResult {
  const profile = loadXmlProfile(profilePath);
  if (findXmlDescriptorById(profile.alpsNode, input.id)) {
    throw new Error(`Descriptor already exists: ${input.id} (use alps_set_doc to update its documentation)`);
  }
  const warnings: string[] = [];
  const attrs: Array<[string, string | undefined]> = [["id", input.id]];
  if (input.type && input.type !== "semantic") attrs.push(["type", input.type]);
  if (input.title) attrs.push(["title", input.title]);
  if (input.rt) {
    const rt = /^#|:|\//.test(input.rt) || input.rt.includes("#") ? input.rt : `#${input.rt}`;
    attrs.push(["rt", rt]);
    const target = rt.startsWith("#") ? rt.substring(1) : null;
    if (target && !findXmlDescriptorById(profile.alpsNode, target)) warnings.push(`rt target "#${target}" does not exist yet`);
  }
  if (input.tag) attrs.push(["tag", input.tag]);

  const descriptor = makeElement("descriptor", [], orderedAttrs(attrs));
  const createdChildren: string[] = [];
  if (input.children?.length) {
    setElementChildren(descriptor, input.children.map((childId) => makeElement("descriptor", [], orderedAttrs([["href", `#${childId}`]]))));
    for (const childId of input.children) {
      if (!findXmlDescriptorById(profile.alpsNode, childId) && childId !== input.id) {
        alpsChildren(profile.alpsNode).push(makeElement("descriptor", [], orderedAttrs([["id", childId]])));
        createdChildren.push(childId);
      }
    }
  }

  if (input.parent) {
    const parent = findXmlDescriptorById(profile.alpsNode, input.parent);
    if (!parent) throw new Error(`Parent descriptor not found: ${input.parent}`);
    elementChildren(parent).push(descriptor);
  } else {
    alpsChildren(profile.alpsNode).push(descriptor);
  }
  writeXmlProfile(profile);
  return { id: input.id, createdChildren, warnings };
}

export function setXmlDescriptorTags(profilePath: string, input: SetTagsInput): SetTagsResult {
  if (!input.add?.length && !input.remove?.length) throw new Error("At least one of add or remove is required");
  const profile = loadXmlProfile(profilePath);
  const descriptor = findXmlDescriptorById(profile.alpsNode, input.id);
  if (!descriptor) throw new Error(`Descriptor not found: ${input.id}`);

  const existing = [...new Set((getAttr(descriptor, "tag") || "").split(/\s+/).filter(Boolean))];
  const removeSet = new Set(input.remove || []);
  const removed = existing.filter((tag) => removeSet.has(tag));
  const tags = existing.filter((tag) => !removeSet.has(tag));
  const added: string[] = [];
  for (const tag of input.add || []) {
    if (!tags.includes(tag) && !added.includes(tag)) added.push(tag);
  }
  tags.push(...added);
  if (tags.length === 0) deleteAttr(descriptor, "tag"); else setAttr(descriptor, "tag", tags.join(" "));
  writeXmlProfile(profile);
  return { id: input.id, tags, added, removed };
}

export function renameXmlDescriptor(profilePath: string, oldId: string, newId: string): RenameResult {
  const profile = loadXmlProfile(profilePath);
  const target = findXmlDescriptorById(profile.alpsNode, oldId);
  if (!target) throw new Error(`Descriptor not found: ${oldId}`);
  if (findXmlDescriptorById(profile.alpsNode, newId)) throw new Error(`Descriptor already exists: ${newId}`);

  setAttr(target, "id", newId);
  let referencesUpdated = 0;
  walkXmlDescriptors(profile.alpsNode, (descriptor) => {
    if (getAttr(descriptor, "href") === `#${oldId}`) { setAttr(descriptor, "href", `#${newId}`); referencesUpdated++; }
    if (getAttr(descriptor, "rt") === `#${oldId}`) { setAttr(descriptor, "rt", `#${newId}`); referencesUpdated++; }
  });
  const result: RenameResult = { id: newId, previousId: oldId, referencesUpdated };
  const docFile = directChildElement(target, "doc") ? getAttr(directChildElement(target, "doc")!, "href") : undefined;
  if (docFile) result.docFile = docFile;
  writeXmlProfile(profile);
  return result;
}

export function parseXmlPreserveOrder(content: string): XmlNode[] {
  const validation = XMLValidator.validate(content) as true | { err?: { msg?: string; line?: number; col?: number } };
  if (validation !== true) {
    const err = validation.err;
    const location = err?.line !== undefined && err?.col !== undefined ? ` (line ${err.line}, col ${err.col})` : "";
    throw new Error(`Invalid XML format: ${err?.msg || "Malformed XML"}${location}`);
  }
  try {
    const parsed = new XMLParser(XML_OPTIONS).parse(content);
    if (!Array.isArray(parsed)) throw new Error("Expected preserveOrder XML tree");
    return parsed as XmlNode[];
  } catch (e) {
    throw new Error(`Invalid XML format: ${(e as Error).message}`);
  }
}

function loadXmlProfile(profilePath: string): LoadedXmlProfile {
  const absPath = path.resolve(profilePath);
  if (!fs.existsSync(absPath)) throw new Error(`Profile file not found: ${profilePath}`);
  const tree = parseXmlPreserveOrder(fs.readFileSync(absPath, "utf-8"));
  const alpsNode = tree.find((node) => elementName(node) === "alps");
  if (!alpsNode) throw new Error("No alps element found in XML");
  assertSupportedWritableStructure(alpsNode);
  return { absPath, baseDir: path.dirname(absPath), tree, alpsNode };
}
function writeXmlProfile(profile: LoadedXmlProfile): void { fs.writeFileSync(profile.absPath, serializeXml(profile.tree), "utf-8"); }
export function serializeXml(tree: XmlNode[]): string {
  const xml = new XMLBuilder({ ...XML_OPTIONS, format: true }).build(tree).replace(/^\n/, "");
  return xml.endsWith("\n") ? xml : `${xml}\n`;
}
function assertSupportedWritableStructure(alpsNode: XmlNode): void {
  if (elementChildren(alpsNode).some((child) => elementName(child) === TEXT || elementName(child) === CDATA)) {
    throw new Error("Unsupported XML structure: alps contains mixed text content");
  }
  walkXmlDescriptors(alpsNode, (descriptor) => {
    const id = getAttr(descriptor, "id") || "(without id)";
    for (const child of elementChildren(descriptor)) {
      const name = elementName(child);
      if (name === TEXT || name === CDATA) throw new Error(`Unsupported XML structure: descriptor "${id}" contains mixed text content`);
      if (name === "doc") assertSupportedDocNode(child, id);
    }
  });
}
function assertSupportedDocNode(docNode: XmlNode, descriptorId: string): void {
  if (elementChildren(docNode).some((child) => {
    const name = elementName(child);
    return name !== TEXT && name !== CDATA && name !== COMMENT;
  })) throw new Error(`Unsupported XML structure: doc for descriptor "${descriptorId}" contains mixed content`);
}
function findXmlDescriptorById(container: XmlNode, id: string): XmlNode | null {
  let found: XmlNode | null = null;
  walkXmlDescriptors(container, (descriptor) => { if (!found && getAttr(descriptor, "id") === id) found = descriptor; });
  return found;
}
function walkXmlDescriptors(container: XmlNode, visit: (descriptor: XmlNode) => void): void {
  for (const child of elementChildren(container)) {
    if (elementName(child) !== "descriptor") continue;
    visit(child);
    walkXmlDescriptors(child, visit);
  }
}
function alpsChildren(alpsNode: XmlNode): XmlNode[] { return elementChildren(alpsNode); }
function directChildElement(node: XmlNode, name: string): XmlNode | undefined { return elementChildren(node).find((child) => elementName(child) === name); }
function insertDocNode(descriptor: XmlNode): XmlNode {
  const docNode = makeElement("doc", []);
  const children = elementChildren(descriptor);
  const index = children.findIndex((child) => elementName(child) === "descriptor");
  if (index === -1) children.push(docNode); else children.splice(index, 0, docNode);
  return docNode;
}
function elementName(node: XmlNode): string | undefined { return Object.keys(node).find((key) => key !== ATTRS); }
function elementChildren(node: XmlNode): XmlNode[] {
  const name = elementName(node);
  if (!name) throw new Error("Invalid XML structure: element without a name");
  const children = node[name];
  return Array.isArray(children) ? children as XmlNode[] : [];
}
function setElementChildren(node: XmlNode, children: XmlNode[]): void {
  const name = elementName(node);
  if (!name) throw new Error("Invalid XML structure: element without a name");
  node[name] = children;
}
function makeElement(name: string, children: XmlNode[], attrs?: XmlAttrs): XmlNode {
  const node: XmlNode = { [name]: children };
  if (attrs && Object.keys(attrs).length > 0) node[ATTRS] = attrs;
  return node;
}
function textNode(text: string): XmlNode { return { [TEXT]: text }; }
function attrsOf(node: XmlNode, create = false): XmlAttrs | undefined {
  const attrs = node[ATTRS];
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) return attrs as XmlAttrs;
  if (!create) return undefined;
  const next: XmlAttrs = {};
  node[ATTRS] = next;
  return next;
}
function getAttr(node: XmlNode, name: string): string | undefined {
  const value = attrsOf(node)?.[`${ATTR_PREFIX}${name}`];
  return value === undefined ? undefined : String(value);
}
function setAttr(node: XmlNode, name: string, value: string): void { attrsOf(node, true)![`${ATTR_PREFIX}${name}`] = value; }
function deleteAttr(node: XmlNode, name: string): void {
  const attrs = attrsOf(node);
  if (!attrs) return;
  delete attrs[`${ATTR_PREFIX}${name}`];
  if (Object.keys(attrs).length === 0) delete node[ATTRS];
}
function setElementAttrs(node: XmlNode, attrs: XmlAttrs): void { if (Object.keys(attrs).length === 0) delete node[ATTRS]; else node[ATTRS] = attrs; }
function orderedAttrs(entries: Array<[string, string | undefined]>): XmlAttrs {
  const attrs: XmlAttrs = {};
  for (const [name, value] of entries) if (value !== undefined) attrs[`${ATTR_PREFIX}${name}`] = value;
  return attrs;
}
