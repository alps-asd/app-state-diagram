/**
 * Tests for the tag filter and file output options of the diagram tools.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { handleAlps2Mermaid, handleAlps2Svg } from "./index.js";

const PROFILE = JSON.stringify({
  alps: {
    descriptor: [
      { id: "Home", type: "semantic", descriptor: [{ href: "#goCart" }, { href: "#goAdmin" }] },
      { id: "Cart", type: "semantic" },
      { id: "AdminTop", type: "semantic" },
      { id: "goCart", type: "safe", rt: "#Cart", tag: "cart" },
      { id: "goAdmin", type: "safe", rt: "#AdminTop", tag: "admin" },
    ],
  },
});

const NON_GRAPH_TAG_PROFILE = JSON.stringify({
  alps: {
    descriptor: [
      { id: "Home", type: "semantic", descriptor: [{ href: "#goCart" }] },
      { id: "Cart", type: "semantic" },
      { id: "goCart", type: "safe", rt: "#Cart" },
      { id: "price", type: "semantic", tag: "field" },
    ],
  },
});

describe("alps2mermaid tag filter", () => {
  it("renders only the tagged slice", async () => {
    const result = await handleAlps2Mermaid({ alps_content: PROFILE, tag: "cart" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Home --> Cart");
    expect(text).not.toContain("AdminTop");
  });

  it("accepts comma or space separated tags", async () => {
    const result = await handleAlps2Mermaid({ alps_content: PROFILE, tag: "cart, admin" });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Cart");
    expect(text).toContain("AdminTop");
  });

  it("errors on tags matching nothing", async () => {
    const result = await handleAlps2Mermaid({ alps_content: PROFILE, tag: "nope" });
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain("No descriptors match");
  });

  it("treats a whitespace-only tag filter as absent", async () => {
    const result = await handleAlps2Mermaid({ alps_content: PROFILE, tag: " ,  " });
    const text = (result.content[0] as { text: string }).text;

    expect(result.isError).toBe(false);
    expect(text).toContain("Cart");
    expect(text).toContain("AdminTop");
  });

  it("reports when matching tags do not produce visible diagram nodes", async () => {
    const result = await handleAlps2Mermaid({ alps_content: NON_GRAPH_TAG_PROFILE, tag: "field" });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as { text: string }).text).toBe("No diagram nodes match the selected tags.");
  });
});

describe("alps2svg tag filter and output", () => {
  it("writes the filtered SVG to a file and returns the path", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alps-svg-"));
    const outPath = path.join(dir, "cart.svg");
    try {
      const result = await handleAlps2Svg({ alps_content: PROFILE, tag: "cart", output: outPath });
      const text = (result.content[0] as { text: string }).text;
      expect(text).toContain(outPath);
      const svg = fs.readFileSync(outPath, "utf-8");
      expect(svg).toContain("<svg");
      expect(svg).toContain("Cart");
      expect(svg).not.toContain("AdminTop");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("errors on tags matching nothing", async () => {
    const result = await handleAlps2Svg({ alps_content: PROFILE, tag: "nope" });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain("No descriptors match");
  });

  it("reports when matching tags do not produce visible diagram nodes", async () => {
    const result = await handleAlps2Svg({ alps_content: NON_GRAPH_TAG_PROFILE, tag: "field" });

    expect(result.isError).not.toBe(true);
    expect((result.content[0] as { text: string }).text).toBe("No diagram nodes match the selected tags.");
  });
});

describe("alps_search markdown format", () => {
  it("renders a Markdown table", async () => {
    const { handleAlpsSearch } = await import("./index.js");
    const dir = (await import("os")).tmpdir();
    const file = (await import("path")).join(dir, `alps-table-${Date.now()}.json`);
    fs.writeFileSync(file, PROFILE);
    try {
      const result = await handleAlpsSearch({ file, tag: "cart", format: "markdown" });
      const text = (result.content[0] as { text: string }).text;
      expect(text).toContain("| ID | Type | Title | Tags | Doc |");
      expect(text).toContain("| goCart | safe |");
      expect(text).not.toContain("goAdmin");

      const multi = await handleAlpsSearch({ file, tag: "cart, admin", format: "markdown" });
      const multiText = (multi.content[0] as { text: string }).text;
      expect(multiText).toContain("goCart");
      expect(multiText).toContain("goAdmin");
    } finally {
      fs.rmSync(file, { force: true });
    }
  });
});

describe("alps_add_descriptor rollback and alps_paths clamping", () => {
  it("restores the profile when the doc write fails after the add", async () => {
    const { handleAlpsAddDescriptor } = await import("./index.js");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alps-rollback-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "alps-rollback-out-"));
    const file = path.join(dir, "profile.json");
    const original = JSON.stringify({ alps: { descriptor: [] } }, null, 2) + "\n";
    try {
      fs.writeFileSync(file, original);
      fs.symlinkSync(outside, path.join(dir, "alps")); // makes alps/docs writes unsafe
      const result = await handleAlpsAddDescriptor({
        file,
        id: "person",
        doc: "line1\nline2 forces external placement",
      });
      expect(result.isError).toBe(true);
      expect(fs.readFileSync(file, "utf-8")).toBe(original); // unchanged
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("clamps out-of-range maxPaths instead of failing", async () => {
    const { handleAlpsPaths } = await import("./index.js");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alps-paths-"));
    const file = path.join(dir, "profile.json");
    try {
      fs.writeFileSync(file, PROFILE);
      for (const maxPaths of [-5, 0, 100000, 2.7]) {
        const result = await handleAlpsPaths({ file, from: "Home", to: "Cart", maxPaths });
        expect(result.isError).not.toBe(true);
        expect(JSON.parse((result.content[0] as { text: string }).text).count).toBeGreaterThanOrEqual(1);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
