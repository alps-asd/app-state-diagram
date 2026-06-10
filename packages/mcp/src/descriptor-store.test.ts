import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addDescriptor, setDescriptorTags } from "./descriptor-store.js";

let dir: string;
let profilePath: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "descriptor-store-"));
  profilePath = path.join(dir, "profile.json");
  fs.writeFileSync(
    profilePath,
    JSON.stringify({ alps: { descriptor: [{ id: "Home", type: "semantic" }] } }, null, 2) + "\n"
  );
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const read = () => JSON.parse(fs.readFileSync(profilePath, "utf-8"));

describe("addDescriptor", () => {
  it("creates a container with href children, creating missing leaves", () => {
    const result = addDescriptor(profilePath, {
      id: "person",
      title: "Person",
      children: ["name", "age"],
    });
    expect(result.createdChildren).toEqual(["name", "age"]);
    const profile = read();
    const person = profile.alps.descriptor.find((d: { id?: string }) => d.id === "person");
    expect(person).toEqual({
      id: "person",
      title: "Person",
      descriptor: [{ href: "#name" }, { href: "#age" }],
    });
    expect(profile.alps.descriptor.map((d: { id?: string }) => d.id)).toContain("name");
    expect(profile.alps.descriptor.map((d: { id?: string }) => d.id)).toContain("age");
  });

  it("does not recreate existing children", () => {
    const result = addDescriptor(profilePath, { id: "Page", children: ["Home"] });
    expect(result.createdChildren).toEqual([]);
    expect(read().alps.descriptor.filter((d: { id?: string }) => d.id === "Home")).toHaveLength(1);
  });

  it("creates transitions with normalized rt and warns on missing targets", () => {
    const result = addDescriptor(profilePath, { id: "goCart", type: "safe", rt: "Cart" });
    expect(result.warnings).toEqual(['rt target "#Cart" does not exist yet']);
    const goCart = read().alps.descriptor.find((d: { id?: string }) => d.id === "goCart");
    expect(goCart).toEqual({ id: "goCart", type: "safe", rt: "#Cart" });
  });

  it("nests inside an existing parent", () => {
    addDescriptor(profilePath, { id: "greeting", parent: "Home" });
    const home = read().alps.descriptor.find((d: { id?: string }) => d.id === "Home");
    expect(home.descriptor).toEqual([{ id: "greeting" }]);
  });

  it("rejects duplicate ids", () => {
    expect(() => addDescriptor(profilePath, { id: "Home" })).toThrow("already exists");
  });

  it("rejects unknown parents and XML profiles", () => {
    expect(() => addDescriptor(profilePath, { id: "x", parent: "nope" })).toThrow("Parent descriptor not found");
    const xml = path.join(dir, "p.xml");
    fs.writeFileSync(xml, "<alps/>");
    expect(() => addDescriptor(xml, { id: "x" })).toThrow("JSON profiles only");
  });

  it("preserves indentation", () => {
    addDescriptor(profilePath, { id: "person", children: ["name"] });
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain('\n  "alps"');
    expect(content.endsWith("\n")).toBe(true);
  });
});

describe("setDescriptorTags", () => {
  const writeTagged = (tag: string) =>
    fs.writeFileSync(
      profilePath,
      JSON.stringify({ alps: { descriptor: [{ id: "Home", tag }] } }, null, 2) + "\n"
    );

  it("adds tags to a descriptor without tags", () => {
    const result = setDescriptorTags(profilePath, { id: "Home", add: ["nav", "core"] });
    expect(result).toEqual({ id: "Home", tags: ["nav", "core"], added: ["nav", "core"], removed: [] });
    expect(read().alps.descriptor[0].tag).toBe("nav core");
  });

  it("removes tags, preserving the order of kept tags", () => {
    writeTagged("nav core checkout");
    const result = setDescriptorTags(profilePath, { id: "Home", remove: ["core", "nope"] });
    expect(result).toEqual({ id: "Home", tags: ["nav", "checkout"], added: [], removed: ["core"] });
    expect(read().alps.descriptor[0].tag).toBe("nav checkout");
  });

  it("adds and removes in one call", () => {
    writeTagged("nav old");
    const result = setDescriptorTags(profilePath, { id: "Home", add: ["new"], remove: ["old"] });
    expect(result).toEqual({ id: "Home", tags: ["nav", "new"], added: ["new"], removed: ["old"] });
    expect(read().alps.descriptor[0].tag).toBe("nav new");
  });

  it("dedupes existing and added tags", () => {
    writeTagged("nav nav");
    const result = setDescriptorTags(profilePath, { id: "Home", add: ["nav", "core", "core"] });
    expect(result).toEqual({ id: "Home", tags: ["nav", "core"], added: ["core"], removed: [] });
    expect(read().alps.descriptor[0].tag).toBe("nav core");
  });

  it("deletes the tag property when it becomes empty", () => {
    writeTagged("nav");
    const result = setDescriptorTags(profilePath, { id: "Home", remove: ["nav"] });
    expect(result).toEqual({ id: "Home", tags: [], added: [], removed: ["nav"] });
    expect("tag" in read().alps.descriptor[0]).toBe(false);
  });

  it("requires add or remove", () => {
    expect(() => setDescriptorTags(profilePath, { id: "Home" })).toThrow(
      "At least one of add or remove is required"
    );
  });

  it("rejects unknown ids and XML profiles", () => {
    expect(() => setDescriptorTags(profilePath, { id: "nope", add: ["x"] })).toThrow(
      "Descriptor not found"
    );
    const xml = path.join(dir, "p.xml");
    fs.writeFileSync(xml, "<alps/>");
    expect(() => setDescriptorTags(xml, { id: "Home", add: ["x"] })).toThrow("JSON profiles only");
  });

  it("preserves indentation", () => {
    setDescriptorTags(profilePath, { id: "Home", add: ["nav"] });
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain('\n  "alps"');
    expect(content.endsWith("\n")).toBe(true);
  });
});
