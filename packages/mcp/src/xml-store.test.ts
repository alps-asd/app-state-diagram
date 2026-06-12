import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addDescriptor, renameDescriptor, setDescriptorTags } from "./descriptor-store.js";
import { DOC_DIR, setDescriptorDoc } from "./doc-store.js";
import {
  addXmlDescriptor,
  parseXmlPreserveOrder,
  renameXmlDescriptor,
  serializeXml,
  setXmlDescriptorDoc,
  setXmlDescriptorTags,
} from "./xml-store.js";

const XML_FIXTURE = `<?xml version="1.0"?>
<alps version="1.0">
  <!-- profile comment -->
  <descriptor id="Home" type="semantic" title="Homepage" tag="nav old">
    <doc><![CDATA[Keep <xml> docs]]></doc>
    <descriptor href="#goCart"/>
    <descriptor id="section">
      <descriptor href="#Cart"/>
    </descriptor>
  </descriptor>
  <descriptor id="Cart">
    <doc href="alps/docs/Cart.md" format="markdown"/>
  </descriptor>
  <descriptor id="goCart" type="safe" rt="#Cart"/>
  <descriptor id="shared" href="shared.xml#Cart"/>
</alps>
`;
let dir: string;
let profilePath: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "xml-store-"));
  profilePath = path.join(dir, "profile.xml");
  fs.writeFileSync(profilePath, XML_FIXTURE);
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));
const readXml = () => fs.readFileSync(profilePath, "utf-8");
function expectXmlEquivalentTo(expected: string): void {
  const actual = readXml();
  expect(parseXmlPreserveOrder(actual)).toEqual(parseXmlPreserveOrder(expected));
  expect(actual).toContain("<!-- profile comment -->");
  expect(actual).toContain("<![CDATA[Keep <xml> docs]]>");
  expect(serializeXml(parseXmlPreserveOrder(actual))).toBe(actual);
}

describe("XML write support", () => {
  it("sets descriptor docs in XML and externalizes long docs", () => {
    const doc = "# Shared\n\nDetailed documentation.";
    expect(setDescriptorDoc(profilePath, "shared", doc)).toEqual({ id: "shared", placement: "external", docFile: `${DOC_DIR}/shared.md` });
    expect(fs.readFileSync(path.join(dir, DOC_DIR, "shared.md"), "utf-8")).toBe(`${doc}\n`);
    expectXmlEquivalentTo(`<?xml version="1.0"?>
<alps version="1.0">
  <!-- profile comment -->
  <descriptor id="Home" type="semantic" title="Homepage" tag="nav old">
    <doc><![CDATA[Keep <xml> docs]]></doc>
    <descriptor href="#goCart"/>
    <descriptor id="section"><descriptor href="#Cart"/></descriptor>
  </descriptor>
  <descriptor id="Cart"><doc href="alps/docs/Cart.md" format="markdown"/></descriptor>
  <descriptor id="goCart" type="safe" rt="#Cart"/>
  <descriptor id="shared" href="shared.xml#Cart"><doc href="alps/docs/shared.md" format="markdown"/></descriptor>
</alps>
`);
  });

  it("updates existing external XML docs in place preserving format", () => {
    const docFile = path.join(dir, DOC_DIR, "Cart.md");
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    const doc = "Already newline\n";

    expect(setDescriptorDoc(profilePath, "Cart", doc)).toEqual({
      id: "Cart",
      placement: "external",
      docFile: "alps/docs/Cart.md",
    });

    expect(fs.readFileSync(docFile, "utf-8")).toBe(doc);
    expect(readXml()).toContain('<doc href="alps/docs/Cart.md" format="markdown">');
  });

  it("adds descriptors in XML, preserving existing comments and CDATA", () => {
    expect(addDescriptor(profilePath, { id: "person", title: "Person", children: ["name", "age"] })).toEqual({ id: "person", createdChildren: ["name", "age"], warnings: [] });
    expectXmlEquivalentTo(`<?xml version="1.0"?>
<alps version="1.0">
  <!-- profile comment -->
  <descriptor id="Home" type="semantic" title="Homepage" tag="nav old">
    <doc><![CDATA[Keep <xml> docs]]></doc>
    <descriptor href="#goCart"/>
    <descriptor id="section"><descriptor href="#Cart"/></descriptor>
  </descriptor>
  <descriptor id="Cart"><doc href="alps/docs/Cart.md" format="markdown"/></descriptor>
  <descriptor id="goCart" type="safe" rt="#Cart"/>
  <descriptor id="shared" href="shared.xml#Cart"/>
  <descriptor id="name"/>
  <descriptor id="age"/>
  <descriptor id="person" title="Person"><descriptor href="#name"/><descriptor href="#age"/></descriptor>
</alps>
`);
  });

  it("sets XML descriptor tags without moving existing attributes", () => {
    expect(setDescriptorTags(profilePath, { id: "Home", add: ["core"], remove: ["old"] })).toEqual({ id: "Home", tags: ["nav", "core"], added: ["core"], removed: ["old"] });
    expect(readXml()).toContain('<descriptor id="Home" type="semantic" title="Homepage" tag="nav core">');
    expectXmlEquivalentTo(XML_FIXTURE.replace('tag="nav old"', 'tag="nav core"'));
  });

  it("renames XML descriptors and local references only", () => {
    expect(renameDescriptor(profilePath, "Cart", "Basket")).toEqual({ id: "Basket", previousId: "Cart", referencesUpdated: 2, docFile: "alps/docs/Cart.md" });
    expectXmlEquivalentTo(`<?xml version="1.0"?>
<alps version="1.0">
  <!-- profile comment -->
  <descriptor id="Home" type="semantic" title="Homepage" tag="nav old">
    <doc><![CDATA[Keep <xml> docs]]></doc>
    <descriptor href="#goCart"/>
    <descriptor id="section"><descriptor href="#Basket"/></descriptor>
  </descriptor>
  <descriptor id="Basket"><doc href="alps/docs/Cart.md" format="markdown"/></descriptor>
  <descriptor id="goCart" type="safe" rt="#Basket"/>
  <descriptor id="shared" href="shared.xml#Cart"/>
</alps>
`);
  });

  it("reports malformed XML clearly", () => {
    fs.writeFileSync(profilePath, '<alps><descriptor id="Home"></alps>');
    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["nav"] })).toThrow(/Invalid XML format: Expected closing tag/);
  });

  it("reports malformed empty XML without a location suffix", () => {
    expect(() => parseXmlPreserveOrder("")).toThrow("Invalid XML format: Start tag expected.");
  });

  it("reports missing XML descriptors and missing files", () => {
    expect(() => setDescriptorDoc(profilePath, "Missing", "doc")).toThrow("Descriptor not found: Missing");
    expect(() => setXmlDescriptorDoc(path.join(dir, "missing.xml"), "Home", "doc")).toThrow(
      "Profile file not found"
    );
  });

  it("rejects XML doc paths that resolve outside the profile directory", () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "xml-store-outside-"));
    try {
      fs.symlinkSync(outside, path.join(dir, "alps"));

      expect(() => setXmlDescriptorDoc(profilePath, "shared", "x\ny", "external")).toThrow(
        "Unsafe doc path: alps/docs/shared.md"
      );
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("rejects XML without an alps element", () => {
    fs.writeFileSync(profilePath, '<profile><descriptor id="Home"/></profile>');

    expect(() => setDescriptorDoc(profilePath, "Home", "doc")).toThrow("No alps element found in XML");
  });

  it("rejects unsupported mixed-content descriptor structures", () => {
    fs.writeFileSync(profilePath, '<alps><descriptor id="Home">text<descriptor id="child"/></descriptor></alps>');
    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["nav"] })).toThrow('Unsupported XML structure: descriptor "Home" contains mixed text content');
  });

  it("rejects XML doc elements with nested markup", () => {
    fs.writeFileSync(profilePath, '<alps><descriptor id="Home"><doc><p>Rich</p></doc></descriptor></alps>');

    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["nav"] })).toThrow(
      'Unsupported XML structure: doc for descriptor "Home" contains mixed content'
    );
  });
  it("updates an existing inline XML doc in place", () => {
    expect(setDescriptorDoc(profilePath, "Home", "Plain doc.")).toEqual({ id: "Home", placement: "inline" });
    const xml = readXml();
    expect(xml).toContain("<doc>Plain doc.</doc>");
    expect(xml).not.toContain("Keep <xml> docs");
  });

  it("forces inline placement on an external XML doc and reports the orphan", () => {
    expect(setDescriptorDoc(profilePath, "Cart", "Inline now.", "inline")).toEqual({
      id: "Cart",
      placement: "inline",
      orphanedDocFile: "alps/docs/Cart.md",
    });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '<doc href="alps/docs/Cart.md" format="markdown"/>',
      '<doc>Inline now.</doc>'
    ));
  });

  it("rejects duplicate descriptor ids in XML", () => {
    expect(() => addDescriptor(profilePath, { id: "Home" })).toThrow("Descriptor already exists: Home");
  });

  it("does not create duplicate XML children when children already exist or reference self", () => {
    expect(addDescriptor(profilePath, { id: "person", children: ["Cart", "person"] })).toEqual({
      id: "person",
      createdChildren: [],
      warnings: [],
    });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '</alps>',
      '  <descriptor id="person"><descriptor href="#Cart"/><descriptor href="#person"/></descriptor>\n</alps>'
    ));
  });

  it("normalizes rt fragments and warns about missing XML targets", () => {
    expect(addDescriptor(profilePath, { id: "goNowhere", type: "safe", title: "Go", rt: "Nowhere", tag: "nav" })).toEqual({
      id: "goNowhere",
      createdChildren: [],
      warnings: ['rt target "#Nowhere" does not exist yet'],
    });
    expect(addDescriptor(profilePath, { id: "goCartAgain", type: "safe", rt: "#Cart" })).toEqual({ id: "goCartAgain", createdChildren: [], warnings: [] });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '</alps>',
      '  <descriptor id="goNowhere" type="safe" title="Go" rt="#Nowhere" tag="nav"/>\n  <descriptor id="goCartAgain" type="safe" rt="#Cart"/>\n</alps>'
    ));
  });

  it("leaves external XML rt references untouched without warnings", () => {
    expect(addXmlDescriptor(profilePath, { id: "goExternal", type: "safe", rt: "shared.xml#Cart" })).toEqual({
      id: "goExternal",
      createdChildren: [],
      warnings: [],
    });
    expect(readXml()).toContain('<descriptor id="goExternal" type="safe" rt="shared.xml#Cart">');
  });

  it("nests new XML descriptors under a parent", () => {
    addDescriptor(profilePath, { id: "headline", parent: "section" });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '<descriptor id="section">\n      <descriptor href="#Cart"/>\n    </descriptor>',
      '<descriptor id="section"><descriptor href="#Cart"/><descriptor id="headline"/></descriptor>'
    ));
    expect(() => addDescriptor(profilePath, { id: "stray", parent: "ghost" })).toThrow("Parent descriptor not found: ghost");
  });

  it("inserts XML docs before existing child descriptors", () => {
    expect(setDescriptorDoc(profilePath, "section", "Section doc.")).toEqual({
      id: "section",
      placement: "inline",
    });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '<descriptor id="section">\n      <descriptor href="#Cart"/>\n    </descriptor>',
      '<descriptor id="section"><doc>Section doc.</doc><descriptor href="#Cart"/></descriptor>'
    ));
  });

  it("sets, removes, and validates XML descriptor tags", () => {
    expect(setDescriptorTags(profilePath, { id: "shared", add: ["nav", "nav"] })).toEqual({
      id: "shared",
      tags: ["nav"],
      added: ["nav"],
      removed: [],
    });
    expect(setDescriptorTags(profilePath, { id: "shared", remove: ["nav"] })).toEqual({
      id: "shared",
      tags: [],
      added: [],
      removed: ["nav"],
    });
    expect(readXml()).toContain('<descriptor id="shared" href="shared.xml#Cart">');
    expect(() => setDescriptorTags(profilePath, { id: "Home" })).toThrow(
      "At least one of add or remove is required"
    );
    expect(() => setXmlDescriptorTags(profilePath, { id: "Home" })).toThrow(
      "At least one of add or remove is required"
    );
    expect(() => setDescriptorTags(profilePath, { id: "Missing", add: ["nav"] })).toThrow(
      "Descriptor not found: Missing"
    );
    fs.writeFileSync(profilePath, "<alps><descriptor/></alps>");
    expect(() => setXmlDescriptorTags(profilePath, { id: "Missing", add: ["nav"] })).toThrow(
      "Descriptor not found: Missing"
    );
  });

  it("renames XML descriptors without doc files and validates rename errors", () => {
    expect(renameDescriptor(profilePath, "shared", "sharedNew")).toEqual({
      id: "sharedNew",
      previousId: "shared",
      referencesUpdated: 0,
    });
    expect(() => renameXmlDescriptor(profilePath, "Missing", "Other")).toThrow("Descriptor not found: Missing");
    expect(() => renameXmlDescriptor(profilePath, "Home", "Cart")).toThrow("Descriptor already exists: Cart");
  });

  it("rejects alps elements with mixed text content", () => {
    fs.writeFileSync(profilePath, '<alps>stray text<descriptor id="Home"/></alps>');
    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["nav"] })).toThrow(
      "Unsupported XML structure: alps contains mixed text content"
    );
  });
  it("does not reuse unsafe XML doc.href values as write targets", () => {
    fs.writeFileSync(profilePath, '<alps><descriptor id="Home"><doc href="../escape.md"/></descriptor></alps>');
    expect(setDescriptorDoc(profilePath, "Home", "Safe doc.")).toEqual({ id: "Home", placement: "inline" });
    expect(readXml()).toContain("<doc>Safe doc.</doc>");
    expect(readXml()).not.toContain("escape.md");
    expect(fs.existsSync(path.join(dir, "..", "escape.md"))).toBe(false);
  });
});

export {};
