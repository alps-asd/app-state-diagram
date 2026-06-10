import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addDescriptor } from "./descriptor-store.js";

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
