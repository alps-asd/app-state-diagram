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
