import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addDescriptor, setDescriptorTags, renameDescriptor } from "./descriptor-store.js";

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

  it("appends to an existing parent descriptor array", () => {
    fs.writeFileSync(
      profilePath,
      JSON.stringify(
        {
          alps: {
            descriptor: [{ id: "Home", descriptor: [{ href: "#existing" }] }, { id: "existing" }],
          },
        },
        null,
        2
      ) + "\n"
    );

    addDescriptor(profilePath, { id: "greeting", parent: "Home" });

    const home = read().alps.descriptor.find((d: { id?: string }) => d.id === "Home");
    expect(home.descriptor).toEqual([{ href: "#existing" }, { id: "greeting" }]);
  });

  it("rejects empty or whitespace ids", () => {
    expect(() => addDescriptor(profilePath, { id: "" })).toThrow("non-empty");
    expect(() => addDescriptor(profilePath, { id: "   " })).toThrow("non-empty");
    expect(() => addDescriptor(profilePath, { id: "ok", children: ["", "x"] })).toThrow("non-empty");
  });

  it("rejects duplicate ids", () => {
    expect(() => addDescriptor(profilePath, { id: "Home" })).toThrow("already exists");
  });

  it("rejects unknown parents", () => {
    expect(() => addDescriptor(profilePath, { id: "x", parent: "nope" })).toThrow("Parent descriptor not found");
  });

  it("preserves indentation", () => {
    addDescriptor(profilePath, { id: "person", children: ["name"] });
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain('\n  "alps"');
    expect(content.endsWith("\n")).toBe(true);
  });

  it("rejects missing files, invalid JSON, and missing alps roots", () => {
    expect(() => addDescriptor(path.join(dir, "missing.json"), { id: "x" })).toThrow(
      "Profile file not found"
    );

    fs.writeFileSync(profilePath, "{");
    expect(() => addDescriptor(profilePath, { id: "x" })).toThrow("Invalid JSON format");

    fs.writeFileSync(profilePath, JSON.stringify({ notAlps: {} }));
    expect(() => addDescriptor(profilePath, { id: "x" })).toThrow("Missing alps property");
  });

  it("initializes a missing descriptor array and preserves optional fields", () => {
    fs.writeFileSync(profilePath, JSON.stringify({ alps: {} }, null, 2) + "\n");

    const result = addDescriptor(profilePath, {
      id: "profile",
      type: "semantic",
      title: "Profile",
      tag: "core",
      rt: "https://example.com/alps#Profile",
    });

    expect(result).toEqual({ id: "profile", createdChildren: [], warnings: [] });
    expect(read().alps.descriptor[0]).toEqual({
      id: "profile",
      title: "Profile",
      tag: "core",
      rt: "https://example.com/alps#Profile",
    });
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

  it("rejects unknown ids", () => {
    expect(() => setDescriptorTags(profilePath, { id: "nope", add: ["x"] })).toThrow(
      "Descriptor not found"
    );
  });

  it("preserves indentation", () => {
    setDescriptorTags(profilePath, { id: "Home", add: ["nav"] });
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain('\n  "alps"');
    expect(content.endsWith("\n")).toBe(true);
  });

  it("rejects missing files and invalid JSON", () => {
    expect(() => setDescriptorTags(path.join(dir, "missing.json"), { id: "Home", add: ["x"] })).toThrow(
      "Profile file not found"
    );

    fs.writeFileSync(profilePath, "{");
    expect(() => setDescriptorTags(profilePath, { id: "Home", add: ["x"] })).toThrow(
      "Invalid JSON format"
    );
  });
});

describe("renameDescriptor", () => {
  beforeEach(() => {
    fs.writeFileSync(
      profilePath,
      JSON.stringify(
        {
          alps: {
            descriptor: [
              {
                id: "Home",
                descriptor: [
                  { href: "#goCart" },
                  { id: "section", descriptor: [{ href: "#Cart" }] },
                ],
              },
              { id: "Cart", doc: { href: "alps/docs/Cart.md", format: "markdown" } },
              { id: "goCart", type: "safe", rt: "#Cart" },
              { id: "shared", href: "shared.json#Cart" },
            ],
          },
        },
        null,
        2
      ) + "\n"
    );
  });

  it("renames the id and updates nested href and rt references", () => {
    const result = renameDescriptor(profilePath, "Cart", "Basket");
    expect(result).toEqual({
      id: "Basket",
      previousId: "Cart",
      referencesUpdated: 2,
      docFile: "alps/docs/Cart.md",
    });
    const profile = read();
    expect(profile.alps.descriptor[1].id).toBe("Basket");
    expect(profile.alps.descriptor[0].descriptor[1].descriptor[0].href).toBe("#Basket");
    expect(profile.alps.descriptor[2].rt).toBe("#Basket");
    // Only exact-id matches are rewritten; #goCart is not a #Cart reference
    expect(profile.alps.descriptor[0].descriptor[0].href).toBe("#goCart");
    // The doc file keeps its old name and stays linked via doc.href
    expect(profile.alps.descriptor[1].doc).toEqual({ href: "alps/docs/Cart.md", format: "markdown" });
  });

  it("leaves external references untouched", () => {
    renameDescriptor(profilePath, "Cart", "Basket");
    expect(read().alps.descriptor[3].href).toBe("shared.json#Cart");
  });

  it("renames descriptors without doc files", () => {
    const result = renameDescriptor(profilePath, "Home", "Start");

    expect(result).toEqual({
      id: "Start",
      previousId: "Home",
      referencesUpdated: 0,
    });
  });

  it("renames descriptors with non-external doc objects", () => {
    const profile = read();
    profile.alps.descriptor[0].doc = { value: "Home doc" };
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2) + "\n");

    const result = renameDescriptor(profilePath, "Home", "Start");

    expect(result).toEqual({
      id: "Start",
      previousId: "Home",
      referencesUpdated: 0,
    });
  });

  it("rejects collisions and unknown ids", () => {
    expect(() => renameDescriptor(profilePath, "Cart", "Home")).toThrow(
      "Descriptor already exists: Home"
    );
    expect(() => renameDescriptor(profilePath, "Nope", "Whatever")).toThrow(
      "Descriptor not found: Nope"
    );
  });

  it("preserves indentation", () => {
    renameDescriptor(profilePath, "Cart", "Basket");
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain('\n  "alps"');
    expect(content.endsWith("\n")).toBe(true);
  });

  it("rejects empty new ids, missing files, and invalid JSON", () => {
    expect(() => renameDescriptor(profilePath, "Cart", "")).toThrow("non-empty");
    expect(() => renameDescriptor(path.join(dir, "missing.json"), "Cart", "Basket")).toThrow(
      "Profile file not found"
    );

    fs.writeFileSync(profilePath, "{");
    expect(() => renameDescriptor(profilePath, "Cart", "Basket")).toThrow("Invalid JSON format");
  });

  it("reports not found when the descriptor array is missing", () => {
    fs.writeFileSync(profilePath, JSON.stringify({ alps: {} }));

    expect(() => renameDescriptor(profilePath, "Cart", "Basket")).toThrow(
      "Descriptor not found: Cart"
    );
  });
});

export {};
