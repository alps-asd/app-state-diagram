/**
 * Tag vocabulary tests
 *
 * Covers tags.html parsing (docs/tag-vocabulary.md convention), the
 * vocabulary option of validate_alps, and the alps_tags tool, against
 * real temp files.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { handleAlpsTags, handleValidateAlps } from "./index.js";
import { parseTagVocabulary } from "./tag-vocabulary.js";

const VOCABULARY_HTML = `<!DOCTYPE html>
<html lang="en">
<body>
  <h1 id="top">Store Tag Vocabulary</h1>
  <section data-facet="flow">
    <dl>
      <dt id="flow-customer-purchase" data-actor="customer"
          data-spans="feature-browse feature-purchase">Customer <em>purchase</em></dt>
      <dd>A customer completes an order.
        <p data-role="goal">Order recorded.</p>
      </dd>
    </dl>
  </section>
  <section data-facet="domain">
    <dl>
      <dt id='checkout'>Checkout</dt><dd>Order placement vocabulary.</dd>
      <dt id="catalog">Catalog</dt><dd>Product vocabulary.</dd>
    </dl>
  </section>
</body>
</html>
`;

const PROFILE = JSON.stringify({
  alps: {
    title: "Store",
    descriptor: [
      {
        id: "Cart",
        type: "semantic",
        title: "Cart",
        tag: "checkout flow-customer-purchase",
        descriptor: [{ id: "goCheckout", type: "safe", rt: "#Checkout", title: "Go", tag: "checkout" }],
      },
      { id: "Checkout", type: "semantic", title: "Checkout", tag: "checkout" },
    ],
  },
});

describe("parseTagVocabulary", () => {
  it("extracts dt ids with markup-stripped titles, ignoring ids on other elements", () => {
    const vocabulary = parseTagVocabulary(VOCABULARY_HTML);

    expect([...vocabulary.keys()].sort()).toEqual(["catalog", "checkout", "flow-customer-purchase"]);
    expect(vocabulary.get("flow-customer-purchase")).toBe("Customer purchase");
    expect(vocabulary.get("checkout")).toBe("Checkout");
    expect(vocabulary.has("top")).toBe(false);
  });

  it("ignores dt elements without id attributes", () => {
    const vocabulary = parseTagVocabulary("<dl><dt>No id</dt><dt id=\"known\">Known</dt></dl>");

    expect([...vocabulary.entries()]).toEqual([["known", "Known"]]);
  });
});

describe("validate_alps vocabulary option", () => {
  let dir: string;
  let vocabularyPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "tag-vocabulary-"));
    vocabularyPath = path.join(dir, "tags.html");
    fs.writeFileSync(vocabularyPath, VOCABULARY_HTML);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("accepts profiles whose tags are all defined", async () => {
    const result = await handleValidateAlps({ alps_content: PROFILE, vocabulary: vocabularyPath });

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("✅ ALPS Validation SUCCESSFUL");
    expect(result.content[0].text).not.toContain("W005");
  });

  it("warns W005 for each used tag missing from the vocabulary", async () => {
    const profile = JSON.stringify({
      alps: {
        title: "Store",
        descriptor: [
          { id: "Cart", type: "semantic", title: "Cart", tag: "checkout flow-purchace" },
          { id: "price", type: "semantic", title: "Price", tag: "pricing" },
        ],
      },
    });

    const result = await handleValidateAlps({ alps_content: profile, vocabulary: vocabularyPath });

    expect(result.isError).toBe(false);
    const text = result.content[0].text;
    expect(text).toContain(`- [W005] Unknown tag "flow-purchace" (not defined in ${vocabularyPath})`);
    expect(text).toContain(`- [W005] Unknown tag "pricing" (not defined in ${vocabularyPath})`);
    expect(text).not.toContain('Unknown tag "checkout"');
  });

  it("lists defined but unused tags informationally", async () => {
    const result = await handleValidateAlps({ alps_content: PROFILE, vocabulary: vocabularyPath });

    expect(result.content[0].text).toContain(
      `**Defined but unused tags** (${vocabularyPath}): catalog`
    );
  });

  it("returns error when the vocabulary file does not exist", async () => {
    const missing = path.join(dir, "none.html");

    const result = await handleValidateAlps({ alps_content: PROFILE, vocabulary: missing });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(`Error: Vocabulary file not found: ${missing}`);
  });

  it("does not check tags when vocabulary is omitted", async () => {
    const result = await handleValidateAlps({ alps_content: PROFILE });

    expect(result.isError).toBe(false);
    expect(result.content[0].text).not.toContain("W005");
    expect(result.content[0].text).not.toContain("unused");
  });
});

describe("handleAlpsTags", () => {
  const TAGS_PROFILE = JSON.stringify({
    alps: {
      title: "Store",
      descriptor: [
        {
          id: "Cart",
          type: "semantic",
          title: "Cart",
          tag: "checkout flow-customer-purchase actor-customer",
        },
        { id: "Checkout", type: "semantic", title: "Checkout", tag: "checkout page-edit" },
        {
          id: "goCheckout",
          type: "safe",
          rt: "#Checkout",
          title: "Go",
          tag: "checkout flow-customer-purchase",
        },
        { id: "price", type: "semantic", title: "Price", tag: "src-entity" },
        { id: "feature", type: "semantic", title: "Bare", tag: "feature" },
      ],
    },
  });

  let dir: string;
  let profilePath: string;
  let vocabularyPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "alps-tags-"));
    profilePath = path.join(dir, "profile.json");
    vocabularyPath = path.join(dir, "tags.html");
    fs.writeFileSync(profilePath, TAGS_PROFILE);
    fs.writeFileSync(vocabularyPath, VOCABULARY_HTML);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const parseResult = (result: { content: { text: string }[] }) =>
    JSON.parse(result.content[0].text);

  it("groups tags by facet with usage counts", async () => {
    const result = await handleAlpsTags({ file: profilePath });

    expect(result.isError).toBe(false);
    const tags = parseResult(result);
    expect(tags.count).toBe(6);
    expect(Object.keys(tags.facets)).toEqual(["actor", "flow", "src", "page", "domain"]);
    expect(tags.facets.flow).toEqual([{ tag: "flow-customer-purchase", count: 2 }]);
    expect(tags.facets.src).toEqual([{ tag: "src-entity", count: 1 }]);
    // Unprefixed tags are domain vocabulary, even when they spell a facet name
    expect(tags.facets.domain).toEqual([
      { tag: "checkout", count: 3 },
      { tag: "feature", count: 1 },
    ]);
  });

  it("joins tags with their vocabulary definitions", async () => {
    const result = await handleAlpsTags({ file: profilePath, vocabulary: vocabularyPath });

    const tags = parseResult(result);
    expect(tags.facets.flow).toEqual([
      { tag: "flow-customer-purchase", count: 2, defined: true, title: "Customer purchase" },
    ]);
    expect(tags.facets.actor).toEqual([{ tag: "actor-customer", count: 1, defined: false }]);
    expect(tags.facets.domain).toContainEqual({
      tag: "checkout",
      count: 3,
      defined: true,
      title: "Checkout",
    });
  });

  it("renders a Markdown table", async () => {
    const result = await handleAlpsTags({
      file: profilePath,
      vocabulary: vocabularyPath,
      format: "markdown",
    });

    const text = result.content[0].text;
    expect(text).toContain("| Tag | Facet | Count | Defined | Title |");
    expect(text).toContain("| checkout | domain | 3 | yes | Checkout |");
    expect(text).toContain("| actor-customer | actor | 1 | no |  |");
  });

  it("renders a Markdown table without vocabulary definitions", async () => {
    const result = await handleAlpsTags({ file: profilePath, format: "markdown" });

    const text = result.content[0].text;
    expect(text).toContain("| checkout | domain | 3 |  |  |");
    expect(text).toContain("| actor-customer | actor | 1 |  |  |");
  });

  it("renders a no-tags message for markdown output", async () => {
    fs.writeFileSync(profilePath, JSON.stringify({ alps: { descriptor: [{ id: "Home" }] } }));

    const result = await handleAlpsTags({ file: profilePath, format: "markdown" });

    expect(result.content[0].text).toBe("No tags in use.");
  });

  it("returns error when the vocabulary file does not exist", async () => {
    const missing = path.join(dir, "none.html");

    const result = await handleAlpsTags({ file: profilePath, vocabulary: missing });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(`Error: Vocabulary file not found: ${missing}`);
  });

  it("returns error when file is missing", async () => {
    const result = await handleAlpsTags({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error: file is required");
  });
});

export {};
