# 3D Browse Mode — Development Manual

Practical guide for working on the 3D browse mode of app-state-diagram. Read this
before touching the 3D code; it captures the file layout, the embedding/escaping
rules, the per-frame architecture, and the step-by-step recipes for the changes you
will most often make (adding a settings slider, tuning visuals).

## 1. Where the code lives

The 3D browse mode spans two files:

```text
packages/app-state-diagram/src/generator/html-generator-3d.ts  # the 3D app itself
packages/app-state-diagram/src/generator/html-generator.ts     # generateHtml(): entry control, URL state, splicing
```

`html-generator-3d.ts` exports three things, all consumed by `generateHtml()`:

| Export | Type | What it is |
|--------|------|-----------|
| `asd3dStyles` | `string` (template literal) | the `<style>` CSS for the 3D overlay |
| `asd3dOverlay(safeAlpsTitle)` | `string` function | the overlay markup (topbar, HUD, settings panel, info panel, canvas) |
| `asd3dScript` | `string` (template literal) | the entire browse-mode JS as one IIFE |

`html-generator.ts` owns the integration contract: the `--3d` opt-in flag, the "3D View"
entry control, the `mode=3d` URL state (`readUrlState` / `collectUrlState` /
`replaceUrlState` / `applyUrlState`), and the unconditional Viz.js `<script>` for 2D.

`generateHtml()` splices these into the generated HTML document. So the "3D app" is
JavaScript-inside-a-TypeScript-template-literal-string. **This shapes every edit you
make** — see the escaping rules below.

## 2. The golden rules of editing `asd3dScript`

`asd3dScript` is a backtick-delimited template literal. The JS text inside it must
**never contain a backturnstile (`` ` ``) or a `${...}`** — those would terminate
the string or inject a TS interpolation. Consequences:

- **String building uses concatenation**, not template literals:
  `'rgba(255,255,255,' + cs + ')'` ✓ — not `` `rgba(...,${cs})` `` ✗
- **Unicode escapes are double-backslashed**: write `'\\u00d7'` in the source so the
  generated JS string contains `×`, which the browser then renders as `×`.
  (`°` → `°`, `▸` → `▸`, `…` → `…`.) If you write a single backslash
  it will be consumed by the TS template literal and disappear.
- `asd3dStyles` and `asd3dOverlay` follow the same no-backtick rule;
  `asd3dOverlay`'s only interpolation is `${safeAlpsTitle}`.

If a build error mentions an unterminated template or a stray identifier, you almost
certainly typed a backtick or `${` inside the JS.

## 3. Runtime tech

- **three@0.180.0** (loaded as an ESM module via dynamic `import()` from unpkg; lands
  on `window.THREE`) and **3d-force-graph@1.80.0** (UMD `<script>`).
- Both are **lazy-loaded on `open3D()`** and fetched from unpkg only when you enter 3D.
  Viz.js is emitted unconditionally by `html-generator.ts`, so once you are in 3D both
  the 2D and the 3D engines are live in the same document.
- A debug handle is exposed: `window.asd3dGraph` is the ForceGraph3D instance.

## 4. Build / generate / test / preview

```bash
# build (tsc only; required before generating)
pnpm --filter @alps-asd/app-state-diagram build

# generate a demo HTML to inspect (--3d is required to embed 3D browse mode; default theme = botanical)
node packages/app-state-diagram/dist/asd.js --3d docs/demo/amazon/alps.json -o /tmp/asd3d.html
# cosmos theme
node packages/app-state-diagram/dist/asd.js --3d --theme cosmos docs/demo/amazon/alps.json -o /tmp/asd3d-cosmos.html

# tests — must stay green (currently 127: 86 app + 41 mcp)
pnpm test
```

The 3D code is embedded JS, so the test suite (dot/mermaid/validator/merger) does NOT
cover it. **Verify 3D changes in a browser**, not just by tests.

### Preview workflow & its traps

- A static server serves `/tmp` (see `.claude/launch.json`, port 8742). Open
  `http://localhost:8742/<file>.html?mode=3d` — `?mode=3d` auto-enters 3D.
- **The preview tab freezes `requestAnimationFrame` when backgrounded.** That means
  the force engine never settles, `onEngineStop` never fires, and anything done there
  (e.g. `applySceneExtents`, the settings restore) won't run. Symptoms: grid/extent
  code "missing". Work around it by **driving state via `preview_eval` and asserting
  numerically**, and by opening the file in the user's real foreground browser (`open
  <url>`), where the engine runs normally.
- The WebGL canvas screenshots from a hidden tab are unreliable; prefer numeric
  assertions (read `material.opacity`, `mesh.scale.x`, `geometry.attributes…`, etc.).
- The managed preview server is periodically reaped at turn boundaries; just restart
  it (`preview_start`) or run your own `python3 -m http.server 8742 --directory /tmp`.
- A cache-buster query (`?mode=3d&v=<n>`) forces the browser to reload the new HTML.

## 5. Scene anatomy — what a node is made of

`makeNodeObject(node)` builds a `THREE.Group` per node, stored on `node.__asd3d`:

| Layer | Object | renderOrder | Notes |
|-------|--------|-------------|-------|
| orb / bloom | additive `THREE.Sprite` (glow texture) | 7 | size by content (`bloomBase * orbScale`), colour by `bodyColor`, **breathes** in `updateLod` |
| body (glass box) | `THREE.Group` { box `Mesh` + edge `LineSegments` } | 5 / 6 | unit geometry scaled by `BOX_SIZE * boxScale`; only for nodes with degree ≥ 1 |
| grains | `THREE.InstancedMesh` (one sphere per `node.props`) | 8 | colourful per descriptor; centre-seeking swarm animated in `updateGrains` |
| chip (label) | constant-size `THREE.Sprite` (canvas texture) | 10 | `sizeAttenuation:false`, `depthTest:false`; `fog` ON (subtle depth) |
| card | lazy `THREE.Sprite` (canvas texture) | 11 | created by `ensureCard` on first open; `drawCardCanvas` |

Shared/cached textures: `getGlowTexture` → `getStarTexture` (cosmos, with the
diffraction cross) or `getHaloTexture` (botanical); `getBoxGeometry`/`getBoxEdges`;
`getGrainGeo`/`getGrainMat`.

### Themes

`THEMES` registry (`botanical`, `cosmos`) carries colours, fog near/far, glow shape
(`halo` vs `star`), cone material, and starfield count. `--theme <name>` CLI flag →
`window.ASD3D_THEME`. The active theme is `var theme = THEMES[THEME_NAME]`.

## 6. The per-frame loop (`updateLod`)

`updateLod()` runs every rAF while active. It owns the live, distance-driven visuals:

- **orb breathing & brightness**: `s.bloom.material.opacity = s.bloomOpacity *
  bloomBright * (breath…) * bdim` and scale `s.bloomBase * orbScale`.
- **aerial perspective dimmer**: `node.__asd3dDim` fades chips/boxes with distance
  (`aerialNear = fog.near*0.6`, `aerialFar = fog.far*0.9`), clamped to a 0.22 floor.
- **box opacity**: `s.bodyMat.opacity = BODY_FACE_OPACITY * boxOpacity * bd * (1-cf)`
  (and the edge); `cf` = card cross-fade.
- **card scale**: `s.card.scale = s.cardBaseScale * cardScale * k` (k = open ease).
- **grain swarm** (`updateGrains`): centre-seeking velocity integration, soft wall
  reflect at `BOX_SIZE * 0.46 * boxScale`.

If a value must change **with distance or over time**, it belongs here (set it from a
`var` the slider writes). If it is static-at-creation, set it in `makeNodeObject`.
Many sliders need BOTH: the var is read per-frame AND used for newly built nodes.

## 7. Recipe: add a settings slider

This is the most common task. There are seven existing examples to copy. A slider has
four pieces plus (optionally) persistence:

1. **Markup** — add a row inside the settings panel in `asd3dOverlay`:
   ```html
   <label class="asd3d-settings-row"><span>My thing<b id="asd3d-mything-val">1.0&#215;</b></span><input type="range" id="asd3d-mything" min="3" max="30" step="1" value="10"></label>
   ```
   (`&#215;` = `×`, `&#176;` = `°`.)
2. **Element refs** — near the other `document.getElementById('asd3d-…')` lines:
   ```js
   var myThingEl = document.getElementById('asd3d-mything');
   var myThingValEl = document.getElementById('asd3d-mything-val');
   ```
3. **State var + how it applies**:
   - Per-frame value (size/opacity/brightness): add `var myThing = 1.0;` and multiply
     it into the relevant `updateLod` line. New nodes pick it up automatically only if
     `makeNodeObject` also reads it.
   - Needs a rebuild (texture/geometry/colour): add an `applyMyThing()` that iterates
     `currentNodes` and mutates materials, and call it from the handler. Follow
     `applyBoxScale` / `applyBoxHue` / `rebuildStarTexture` / `applyFog`.
4. **Input handler** — with the same `\\u00d7` readout style and a persistence call:
   ```js
   if (myThingEl) myThingEl.addEventListener('input', function () {
       myThing = (+myThingEl.value) / 10;          // map slider → value
       if (myThingValEl) myThingValEl.textContent = myThing.toFixed(1) + '\\u00d7';
       applyMyThing();                              // or rely on per-frame
       asd3dSaveSettings();                         // persist
   });
   ```
5. **Persistence** — add `myThingEl` to the array returned by `settingsSliders()`.
   That is all: `asd3dSaveSettings()` (called from each handler) serialises every
   slider value by element id to `localStorage['asd3d-settings-v1']`, and
   `asd3dRestoreSettings()` (called once from `applySceneExtents`) sets every value
   then replays each handler. **Restore is dispatch-based**, so the handler's effect
   must be safe to call at restore time (graph/nodes exist by then). Avoid handlers
   with side effects beyond their own value (e.g. don't auto-toggle visibility on
   input) — or restore them manually, not by dispatch.

## 8. Other systems worth knowing

- **Camera / focus**: `flyToNode(node, fromNode, dist)` (Bezier arc, `applyCamTween`);
  `FLY_DIST` = focus distance, `CARD_READ_DIST` = closer dive when a card opens.
  `selectNode` pins the focused node (`pinNode`/`unpinNode`) so the cooling sim can't
  drift it out from under the camera.
- **Card layout**: `drawCardCanvas(node)` renders header + props grid + transition
  buttons onto a canvas. `gridCells(items, maxRows, maxCols)` lays items **column-major**
  and collapses overflow into a `+N more` cell. Props grid = `gridCells(props, 8, 4)`,
  buttons = `gridCells(actions, 6, 2)`. Card width is clamped to 760px.
- **Card hit-testing**: clicks on the card raycast the sprite, then map the **UV (0–1)
  to canvas pixels** to find which prop/button/close was hit (`pickCardItem`,
  `pickCardButton`). UV is scale-independent, so resizing the card (cardScale) does NOT
  break hit-testing.
- **Fog**: linear `THREE.Fog`; near/far come from the layout span (`applySceneExtents`)
  or theme. The **Fog depth slider** scales them via `fogScale` (`applyFog`); `baseFogNear/
  baseFogFar` hold the un-scaled values. NB linear fog reaches 100% at `fog.far` — distant
  objects fully dissolve (see the journal's open issue on far-zoom invisibility).
- **Reduced motion**: `prefers-reduced-motion` freezes breathing/particles/idle-orbit;
  several sliders disable themselves and `syncSettingsState` explains why.

## 9. Gotchas checklist

- [ ] No `` ` `` or `${` inside `asd3dScript`; unicode is `\\uXXXX`.
- [ ] `tsc` clean + `pnpm test` still 127.
- [ ] Verified in a **foreground** browser (engine runs), not just the hidden preview tab.
- [ ] New slider added to `settingsSliders()` if it should persist.
- [ ] Restore is dispatch-based — handler must be side-effect-safe at restore time.
- [ ] Regenerate **both** themes (`botanical` and `cosmos`) when touching themed visuals.
