# 3D Browse Mode — Development Journal

Running log to hand off between sessions. Newest entry on top. Pair this with
[`3d-browse-dev-manual.md`](./3d-browse-dev-manual.md).

---

## 2026-06-15 — settings sliders, persistence, label fog, card 4-col

### Git state at handoff (READ THIS FIRST)

- Working branch: **`claude/hopeful-hertz-8389d9`**, HEAD = **`9802b59`** ("3D: card
  close (x) button").
- This session's work is **UNCOMMITTED** on top of `9802b59` — a single modified file
  `packages/app-state-diagram/src/generator/html-generator-3d.ts` (~+181/−22). Nothing
  committed; commit when you/the user are ready (exclude the untracked
  `.claude/launch.json`).
- An **earlier, larger** line of work is preserved on branch
  **`asd3d-enhancements-backup`** @ **`789ccf7`** ("3D: reference grid + starfield,
  settings sliders, persistence, drag-to-pin"). We deliberately **reset back to
  `9802b59`** and re-did a smaller, more conservative subset, because the user wanted
  to proceed carefully from the "x button" baseline. Treat `789ccf7` as a parts bin,
  not the trunk.

### Why we reset to 9802b59

The user felt the big-bang branch (`789ccf7`: floor/wall grid, dense camera-following
starfield, drag-to-pin, link defog/width) had drifted. We `git reset --hard 9802b59`
(work safe on the backup branch) and rebuilt only what was explicitly requested, one
small change at a time, verifying each. Lesson: **make one scoped change, verify, move
on**; the user steers tightly here.

### What changed this session (uncommitted, on top of 9802b59)

Tweaks:
- `FLY_DIST` 140 → **170** — focus camera settles a bit further from the box.
- Card billboard **+15%** by default, now a live slider (was a fixed `CARD_SCALE`,
  refactored to per-frame `cardScale`).
- Star diffraction **cross weakened** (bar opacity 0.85 → default 0.45) and made tunable.
- Card props grid **`gridCells(props, 8, 3)` → `(8, 4)`** — up to 4 columns (e.g.
  ProductDetail's 32 props now show in one 4-col card instead of 3 cols + "+9 more").
- **Label fog**: `chip.material.fog = true` (was false). Subtle — `fog.near` sits ~a
  graph-width out, so focused/near labels stay crisp; only distant labels soften. Tuned
  by the Fog depth slider.

New settings sliders (all in the `S` panel, all persisted):
- **Box hue** (−180…180°) — rotates the glass-box colour only (orb unchanged).
- **Box size** (0.3–2.5×) — `boxScale`; grains' spread + wall track it.
- **Box opacity** (0–3.0×) — `boxOpacity`, multiplied into the per-frame body opacity.
- **Bloom brightness** (0–3.0×) — `bloomBright`, multiplied into the per-frame orb opacity.
- **Cross strength** (0–1.0) — `crossStrength`; redraws the shared star texture (`rebuildStarTexture`).
- **Fog depth** (0.6–4.0×) — `fogScale` scales `fog.near/far`. Min raised from 0.3× to
  **0.6×** so fog can't be cranked strong enough to swallow everything.
- **Card size** (0.5–3.0×) — `cardScale`, applied per-frame.

Infrastructure:
- **localStorage persistence** (`asd3dSaveSettings` / `asd3dRestoreSettings`, key
  `asd3d-settings-v1`). Every slider value is saved on change and restored once after
  the first layout settles, so the user never re-hunts for good values. Visibility
  toggles are intentionally NOT persisted (there are none in this baseline).

### Open issues / ideas raised by the user (next-session backlog)

1. **Far-zoom invisibility (highest priority).** Zooming far out fogs/dims EVERYTHING
   — boxes, orbs, labels — to nothing (see the user's two screenshots: crisp up close,
   blank when pulled back). The user wants a **floor so things never fully disappear**.
   Root cause: linear `THREE.Fog` reaches 100% at `fog.far`, and the aerial dimmer also
   fades. The Fog-depth min bump (0.6×) only caps the *slider*, not the default fade.
   Ideas to try: clamp the effective fog factor for boxes/orbs (custom fog via
   `onBeforeCompile`, or a min-opacity floor by distance like the chip's 0.22), or make
   `fog.far` scale with how far the camera can zoom so the cluster never leaves the fog
   volume. Decide whether labels should keep fully fogging while boxes/orbs get a floor.

2. **Links barely visible — "is it the opacity?"** Partly, but mostly the **colour**.
   At this baseline links use `stemColor` (dark root, e.g. `#103246`) at opacity 0.45,
   width 0.5 — a dark line on a near-black, fogged background. Opacity alone won't fix
   it. In the backup branch we tried bright `l.color` + width 1.1 → user called it
   "気持ち悪い" (too much); a calm middle (slightly lighter stem, width ~1.0, and taking
   links out of the fog so they don't dissolve at distance — `defogLinks` exists on
   `789ccf7`) read better. Consider a **Link width / Link opacity slider** (both exist
   on `789ccf7`) rather than hard-coding, and keep the colour calm.

3. **Orb-as-cell metaphor (creative direction).** The orb feels small; idea: the box is
   a **cell**, and **nutrients arrive from outside** to feed it — when an incoming
   grain/particle "collides" with the centre, the **orb brightens** (a pulse of
   brightness on delivery) rather than the orb just being statically sized. This would
   tie the descriptor-grain swarm and the link particles into a feeding animation. Worth
   prototyping: on grain-reaches-centre (or link-particle-arrival), bump
   `s.bloomOpacity`/scale briefly and decay. Could replace/augment the current passive
   breathing.

### How to resume

1. Read [`3d-browse-dev-manual.md`](./3d-browse-dev-manual.md) (escaping rules + slider recipe).
2. `pnpm --filter @alps-asd/app-state-diagram build` then generate both themes to /tmp.
3. The current working tree already has this session's sliders + persistence. If you
   want a clean A/B, `asd3d-cosmos-PREV.html` / `c47feec-ORIGINAL.html` may still be in
   /tmp; otherwise regenerate from `9802b59` and `789ccf7`.
4. Tackle backlog #1 (far-zoom floor) first — it's the user's main remaining complaint.

### Verified this session

`tsc` clean; `pnpm test` 127/127. Each slider checked numerically via `preview_eval`
(e.g. box scale 34→68 at 2.0×, fog.far tripled at 3.0×, cross bar pixel 0→bright,
persistence round-trips across reload). Label fog confirmed `true` on all 89 chips.
