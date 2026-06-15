# 3D Browse Mode — Development Journal

Running log to hand off between sessions. Newest entry on top. Pair this with
[`3d-browse-dev-manual.md`](./3d-browse-dev-manual.md).

---

## 2026-06-15 — sliders & persistence, then depth/link/orb-feed pass

### Git state at handoff (READ THIS FIRST)

- Working branch: **`claude/hopeful-hertz-8389d9`**, pushed to **`origin`**
  (koriym/app-state-diagram fork). Everything below is **committed and pushed** — the
  working tree is clean apart from the untracked `.claude/launch.json` (intentionally
  excluded).
- Baseline for this session was **`9802b59`** ("3D: card close (x) button"). We reset
  back to it from an earlier big-bang branch and rebuilt a smaller, scoped subset.
- The earlier big-bang work (floor/wall grid, camera-following starfield, drag-to-pin)
  is parked on **`asd3d-enhancements-backup` @ `789ccf7`** — a parts bin, NOT the trunk.
- No PR opened. To raise one: `koriym:claude/hopeful-hertz-8389d9` → `alps-asd:2.x`.

### What shipped (all in `html-generator-3d.ts`)

**Part 1 — settings sliders + persistence (commit `ecb7795`)**
- `S`-panel sliders: Box hue / Box size / Box opacity / Bloom brightness / Cross
  strength / Fog depth / Card size (plus the original Orb/Ball/Particle/Idle). Each is
  live; box/bloom/card apply per-frame, hue/size/cross/fog via small `apply*` helpers.
- **localStorage persistence** (`asd3dSaveSettings` / `asd3dRestoreSettings`, key
  `asd3d-settings-v1`): every slider value saved on change, restored once after the
  first layout — no re-hunting good values.
- **Label fog**: `chip.material.fog = true` (subtle; near labels stay crisp, distant
  soften; tuned by the Fog depth slider).
- **Card props grid → max 4 columns** (was 3; e.g. ProductDetail's 32 props in one
  4-col card).
- Tweaks: `FLY_DIST` 140→170, card billboard +15%, star cross weakened+tunable, Fog
  depth slider min capped at 0.6× so fog can't be cranked to swallow everything.

**Part 2 — the three backlog items, now implemented (a later commit on this branch)**
1. **Far-zoom visibility floor.** The absolute fog + aerial dimmer used to fade the
   WHOLE graph to nothing when you pulled the camera back. Both are now **relative to
   the camera's distance to the cluster centre** (`updateLod`): a node only fades when
   it is farther than the centre, and the fog band is bracketed to the camera distance
   so the cluster never falls fully into fog. Floors: depth dim ≥ 0.35; fog `near =
   max(base, camDist − span·0.5)`, `far = max(base, camDist + span·1.35)`. `sceneSpan`
   is captured in `applySceneExtents`.
2. **Link legibility.** Links were dark stems dissolving into the fog. Now `defogLinks`
   takes the link tubes **out of the fog** (re-run after layout and after any width
   change), defaults bumped (opacity 0.45→0.6, width 0.5→0.8, colour still the calm
   stem), and new **Link width / Link opacity sliders** (persisted) let the user tune.
3. **Orb-as-cell feeding.** `updateGrains` tracks the fraction of descriptor-grains
   gathered within a central radius (`s.feed`, smoothed); the orb's brightness and size
   **pulse with it** (`opacity *= 1 + feed·1.5`, scale `+feed·0.2`). The box reads as a
   cell whose orb glows as nutrients arrive at the core and dims as they disperse.

### Verification status — IMPORTANT

- `tsc` clean; `pnpm test` **127/127**.
- Sliders, persistence round-trip, the Part-2 #1 dim/fog **formulas**, #2 defog (all 291
  links), and #3 feed **were verified numerically / by simulation** against real node
  data via `preview_eval` (e.g. zoomed-out dim avg 0.68 vs the old 0.22; fog factor 0.27
  vs the old 1.0=invisible; orb feed pulses 0.06–0.98 → up to +150% brightness).
- **NOT yet seen running live.** The headless preview tab freezes `requestAnimationFrame`
  when backgrounded, so the engine never settles and `updateLod`/`onEngineStop` don't
  run there. **First task next session: open in a real foreground browser and eyeball
  Part 2.** Likely tuning: the +150% feed peak may be too strong (lower the `feed·1.5`
  factor); confirm the 0.35 dim floor / fog bracket feel right when zoomed out; check
  link width 0.8 reads well without looking heavy.

### Tuning knobs (constants in `html-generator-3d.ts`)

- Depth dim floor `0.35` and slope `·0.55`; fog bracket factors `·0.5` / `·1.35`.
- Link defaults `.linkOpacity(0.6) .linkWidth(0.8)`; sliders cover the rest.
- Feed: central radius `half·0.34`, smoothing `step·0.15`, orb boost `feed·1.5`
  (opacity) / `feed·0.2` (scale).

### How to resume

1. Read [`3d-browse-dev-manual.md`](./3d-browse-dev-manual.md) (escaping rules + slider recipe).
2. `pnpm --filter @alps-asd/app-state-diagram build`, generate both themes to /tmp,
   open `?mode=3d` in a real browser.
3. Eyeball Part 2 live; tune the magnitudes above; commit.
