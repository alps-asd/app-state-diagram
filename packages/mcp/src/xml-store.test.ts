import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addDescriptor, renameDescriptor, setDescriptorTags } from "./descriptor-store.js";
import { DOC_DIR, setDescriptorDoc } from "./doc-store.js";
import { parseXmlPreserveOrder, serializeXml } from "./xml-store.js";

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

  it("rejects unsupported mixed-content descriptor structures", () => {
    fs.writeFileSync(profilePath, '<alps><descriptor id="Home">text<descriptor id="child"/></descriptor></alps>');
    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["nav"] })).toThrow('Unsupported XML structure: descriptor "Home" contains mixed text content');
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

  it("nests new XML descriptors under a parent", () => {
    addDescriptor(profilePath, { id: "headline", parent: "section" });
    expectXmlEquivalentTo(XML_FIXTURE.replace(
      '<descriptor id="section">\n      <descriptor href="#Cart"/>\n    </descriptor>',
      '<descriptor id="section"><descriptor href="#Cart"/><descriptor id="headline"/></descriptor>'
    ));
    expect(() => addDescriptor(profilePath, { id: "stray", parent: "ghost" })).toThrow("Parent descriptor not found: ghost");
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
