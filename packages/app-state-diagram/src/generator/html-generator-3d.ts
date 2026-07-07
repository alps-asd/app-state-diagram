/**
 * 3D browse-mode assets for the generated HTML diagram.
 *
 * Extracted verbatim from html-generator.ts to keep that file readable.
 * `asd3dStyles` (CSS) and `asd3dScript` (the browse-mode IIFE) are fully
 * static; `asd3dOverlay` is the modal markup, parameterised by the escaped
 * profile title. All three are embedded into the generated HTML by
 * generateHtml(); editing the 3D mode happens here.
 */

export const asd3dStyles = `/* 3D browse mode */
.asd3d-open-btn{background:none;border:0;border-radius:0;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer;}
.asd3d-open-btn:hover{text-decoration:underline;}
#asd3d-overlay{position:fixed;inset:0;z-index:9999;background:#0b1226;display:none;}
#asd3d-overlay.active{display:block;}
#asd3d-canvas{position:absolute;inset:0;}
.asd3d-vignette{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.55) 100%);}
#asd3d-canvas .scene-tooltip{color:#dbe6ff;font-size:13px;}
.asd3d-topbar{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;padding:10px 16px;background:rgba(8,13,28,0.82);backdrop-filter:blur(8px);border-bottom:1px solid rgba(120,144,200,0.25);color:#e7ecf5;font-size:13px;box-sizing:border-box;}
.asd3d-topbar .asd3d-title{font-weight:700;font-size:14px;margin-right:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:30vw;}
.asd3d-btn{padding:4px 12px;border:1px solid rgba(150,170,220,0.4);border-radius:6px;background:rgba(30,42,80,0.6);color:#e7ecf5;font-size:12.5px;cursor:pointer;}
.asd3d-btn:hover{background:rgba(52,70,124,0.8);}
.asd3d-tagbar{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;}
.asd3d-taglabel{color:#9fb0d0;margin-right:2px;}
.asd3d-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border:1px solid rgba(150,170,220,0.35);border-radius:999px;background:rgba(24,34,66,0.6);cursor:pointer;user-select:none;color:#cdd9f2;}
.asd3d-tag input{margin:0;cursor:pointer;}
.asd3d-tag.checked{background:#2f4a8a;border-color:#7aa2ff;color:#fff;}
.asd3d-mode{display:inline-flex;border:1px solid rgba(150,170,220,0.35);border-radius:6px;overflow:hidden;}
.asd3d-mode button{padding:4px 12px;border:0;background:transparent;color:#9fb0d0;font-size:12px;cursor:pointer;}
.asd3d-mode button.on{background:#2f4a8a;color:#fff;}
.asd3d-hud{position:absolute;left:16px;bottom:14px;z-index:3;color:#8fa2c8;font-size:12px;line-height:1.7;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,0.6);}
.asd3d-stats{position:absolute;right:16px;bottom:14px;z-index:3;color:#8fa2c8;font-size:12px;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,0.6);}
.asd3d-status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;color:#c6d4f2;font-size:15px;flex-direction:column;gap:14px;text-align:center;padding:0 24px;}
.asd3d-status[hidden]{display:none;}
.asd3d-spinner{width:34px;height:34px;border:3px solid rgba(140,165,230,0.25);border-top-color:#7aa2ff;border-radius:50%;animation:asd3dspin 0.9s linear infinite;}
@keyframes asd3dspin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.asd3d-spinner{animation:none;}}
.asd3d-info{position:absolute;left:50%;transform:translateX(-50%);bottom:52px;z-index:3;display:none;flex-direction:column;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(13,20,42,0.92);border:1px solid rgba(122,162,255,0.45);color:#e7ecf5;font-size:13px;max-width:80vw;}
.asd3d-info.show{display:flex;}
.asd3d-info-head{display:flex;align-items:center;gap:10px;}
.asd3d-info-title{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw;}
.asd3d-info-actions{display:flex;flex-wrap:wrap;gap:6px;max-width:76vw;}
.asd3d-info-actions:empty{display:none;}
.asd3d-action{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border:2px solid #6f87c0;border-radius:7px;background:rgba(244,248,255,0.92);color:#1c2a4a;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}
.asd3d-action:hover{background:#fff;}
.asd3d-spacer{flex:1;}
.asd3d-btn:focus-visible,.asd3d-action:focus-visible,.asd3d-mode button:focus-visible,.asd3d-tag:focus-within{outline:2px solid #7aa2ff;outline-offset:2px;}
.asd3d-inert{pointer-events:none;}
.asd3d-tip{position:fixed;z-index:5;display:none;max-width:320px;padding:6px 10px;border-radius:8px;background:rgba(13,20,42,0.96);border:1px solid rgba(122,162,255,0.5);color:#eef3ff;font-size:13px;line-height:1.35;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,0.4);}
.asd3d-tip b{font-weight:700;}
.asd3d-tip .asd3d-tip-sub{display:block;margin-top:2px;color:#9fb0d0;font-size:11.5px;}
/* tactile feedback: the clicked transition button springs once, so a bottom-bar
   click reads even when no card is open to bounce */
.asd3d-action.asd3d-pop{animation:asd3dpop 300ms ease;}
@keyframes asd3dpop{0%{transform:scale(1);}30%{transform:scale(0.9);}65%{transform:scale(1.09);}100%{transform:scale(1);}}
@media (prefers-reduced-motion: reduce){.asd3d-action.asd3d-pop{animation:none;}}
/* settings flyout (toggled with the S key) */
.asd3d-settings{position:absolute;right:16px;top:58px;z-index:4;display:none;flex-direction:column;gap:11px;padding:12px 14px;border-radius:10px;background:rgba(13,20,42,0.92);border:1px solid rgba(122,162,255,0.45);color:#cdd9f2;font-size:12px;min-width:184px;box-shadow:0 6px 20px rgba(0,0,0,0.4);}
.asd3d-settings.show{display:flex;}
.asd3d-settings h4{margin:0 0 2px;font-size:12px;font-weight:700;color:#e7ecf5;}
.asd3d-settings-row{display:flex;flex-direction:column;gap:3px;}
.asd3d-settings-row span{display:flex;justify-content:space-between;color:#9fb0d0;}
.asd3d-settings-row b{font-weight:600;color:#cdd9f2;font-variant-numeric:tabular-nums;}
.asd3d-settings input[type=range]{width:100%;accent-color:#7aa2ff;cursor:pointer;}
.asd3d-settings input[type=range]:disabled{opacity:0.4;cursor:not-allowed;}
.asd3d-settings-note{margin:2px 0 0;font-size:11px;line-height:1.4;color:#9fb0d0;}
.asd3d-settings-note[hidden]{display:none;}`;

export function asd3dOverlay(safeAlpsTitle: string): string {
  return `<div id="asd3d-overlay" role="dialog" aria-modal="true" aria-label="3D state diagram browser">
    <div id="asd3d-canvas"></div>
    <div class="asd3d-vignette"></div>
    <div class="asd3d-topbar" id="asd3d-topbar">
        <button type="button" id="asd3d-exit" class="asd3d-btn" title="Back to 2D (Esc)">&#8592; 2D</button>
        <span class="asd3d-title">${safeAlpsTitle}</span>
        <span class="asd3d-mode" role="group" aria-label="Node label mode">
            <button type="button" id="asd3d-label-id">ID</button>
            <button type="button" id="asd3d-label-title">Title</button>
        </span>
        <span id="asd3d-tagbar" class="asd3d-tagbar"></span>
        <span class="asd3d-spacer"></span>
        <button type="button" id="asd3d-fs" class="asd3d-btn" title="Toggle fullscreen">&#x26F6;</button>
    </div>
    <div class="asd3d-hud" id="asd3d-hud"></div>
    <div class="asd3d-stats" id="asd3d-stats"></div>
    <div class="asd3d-settings" id="asd3d-settings" role="group" aria-label="Display settings" hidden>
        <h4>Settings</h4>
        <label class="asd3d-settings-row"><span>Orb size<b id="asd3d-orb-size-val">2.0&#215;</b></span><input type="range" id="asd3d-orb-size" min="3" max="25" value="20"></label>
        <label class="asd3d-settings-row"><span>Ball speed<b id="asd3d-ball-speed-val">0.2&#215;</b></span><input type="range" id="asd3d-ball-speed" min="0" max="20" value="2"></label>
        <label class="asd3d-settings-row"><span>Particle speed<b id="asd3d-speed-particle-val">0.8&#215;</b></span><input type="range" id="asd3d-speed-particle" min="0" max="20" value="4"></label>
        <label class="asd3d-settings-row"><span>Idle rotation<b id="asd3d-speed-orbit-val">1.1&#215;</b></span><input type="range" id="asd3d-speed-orbit" min="0" max="30" value="9"></label>
        <label class="asd3d-settings-row"><span>Box hue<b id="asd3d-box-hue-val">0&#176;</b></span><input type="range" id="asd3d-box-hue" min="-180" max="180" step="5" value="0"></label>
        <label class="asd3d-settings-row"><span>Box size<b id="asd3d-box-size-val">1.0&#215;</b></span><input type="range" id="asd3d-box-size" min="3" max="25" step="1" value="10"></label>
        <label class="asd3d-settings-row"><span>Box opacity<b id="asd3d-box-opacity-val">1.0&#215;</b></span><input type="range" id="asd3d-box-opacity" min="0" max="30" step="1" value="10"></label>
        <label class="asd3d-settings-row"><span>Bloom brightness<b id="asd3d-bloom-bright-val">1.0&#215;</b></span><input type="range" id="asd3d-bloom-bright" min="0" max="30" step="1" value="10"></label>
        <label class="asd3d-settings-row"><span>Cross strength<b id="asd3d-cross-val">0.45</b></span><input type="range" id="asd3d-cross" min="0" max="100" step="5" value="45"></label>
        <label class="asd3d-settings-row"><span>Fog depth<b id="asd3d-fog-val">1.0&#215;</b></span><input type="range" id="asd3d-fog" min="6" max="40" step="1" value="10"></label>
        <label class="asd3d-settings-row"><span>Card size<b id="asd3d-card-size-val">1.15&#215;</b></span><input type="range" id="asd3d-card-size" min="50" max="300" step="5" value="115"></label>
        <label class="asd3d-settings-row"><span>Link width<b id="asd3d-link-width-val">0.8</b></span><input type="range" id="asd3d-link-width" min="2" max="30" step="1" value="8"></label>
        <label class="asd3d-settings-row"><span>Link opacity<b id="asd3d-link-opacity-val">0.60</b></span><input type="range" id="asd3d-link-opacity" min="10" max="100" step="5" value="60"></label>
        <p class="asd3d-settings-note" id="asd3d-settings-note" hidden></p>
    </div>
    <div class="asd3d-info" id="asd3d-info">
        <div class="asd3d-info-head">
            <span class="asd3d-info-title" id="asd3d-info-title"></span>
            <button type="button" class="asd3d-btn" id="asd3d-info-table">Show in table</button>
            <button type="button" class="asd3d-btn" id="asd3d-info-clear" title="Clear selection" aria-label="Clear selection">&#10005;</button>
        </div>
        <div class="asd3d-info-actions" id="asd3d-info-actions" role="group" aria-label="Transitions from this state"></div>
    </div>
    <div class="asd3d-tip" id="asd3d-tip"></div>
    <div class="asd3d-status" id="asd3d-status" hidden>
        <div class="asd3d-spinner" id="asd3d-spinner"></div>
        <div id="asd3d-status-text">Loading 3D engine&#8230;</div>
    </div>
</div>`;
}

export const asd3dScript = `// ===== 3D Browse Mode =====
// Fullscreen WebGL exploration of the state diagram. Three.js and 3d-force-graph
// are lazy-loaded from CDN on first use so the 2D page stays untouched.
// Node/edge derivation mirrors generateDotFromAlps() and reuses its global helpers.
(function () {
    'use strict';
    // Version-locked pair: 3d-force-graph 1.80.0 requires three >=0.179 <1 and
    // prefers window.THREE over its bundled copy, so we import the matching three
    // ESM build and expose it as the global before loading the UMD bundle. That
    // way the renderer and our sprite code share a single three instance.
    var THREE_SRC = 'https://unpkg.com/three@0.180.0/build/three.module.js';
    var FG3D_SRC = 'https://unpkg.com/3d-force-graph@1.80.0/dist/3d-force-graph.min.js';
    // ---- Theme sets -------------------------------------------------------
    // All of the 3D scene design lives here so the whole look can be swapped.
    // The active set is chosen at build time via window.ASD3D_THEME (injected by
    // the generator from the --theme CLI flag); unknown names fall back to
    // botanical. Each theme declares its palette (background, per-type transition
    // tip/root colours, hub-glow colour), the glow shape ('halo' soft disc vs
    // 'star' diffraction flare), cone material, fog, and a background starfield
    // count. botanical = a living garden; cosmos = deep space.
    var THEMES = {
        botanical: {
            bg: '#0a120d', // forest-black: near-black with a drop of green
            fog: { near: 400, far: 1600 },
            tip:  { safe: '#74e29c', idempotent: '#b8923a', unsafe: '#9a3340', other: '#8fae9d' },
            root: { safe: '#173f2e', idempotent: '#5c4a22', unsafe: '#4a1f25', other: '#2a3d33' },
            bloomColor: '#3fa66a', glow: 'halo',
            cone: { opacity: 0.8, emissive: 0.4, gradLo: 0.32 },
            starfield: 0
        },
        cosmos: {
            bg: '#05060f', // deep space
            fog: { near: 600, far: 2600 },
            tip:  { safe: '#76e7ff', idempotent: '#c7a4ff', unsafe: '#ff6f91', other: '#aab6d6' },
            root: { safe: '#103246', idempotent: '#271c4a', unsafe: '#3a1130', other: '#1a2440' },
            bloomColor: '#aaccff', glow: 'star',
            cone: { opacity: 0.62, emissive: 0.9, gradLo: 0.2 },
            starfield: 20000
        }
    };
    var THEME_NAME = (typeof window !== 'undefined' && window.ASD3D_THEME) || 'botanical';
    var theme = THEMES[THEME_NAME] || THEMES.botanical;
    var BG_COLOR = theme.bg;

    // Per-transition palette (the 2D SVG keeps its own colours via getTransitionColor).
    // Each transition reads as a tapered shape: a dark root colour and a brighter tip,
    // semantics preserved (safe / idempotent / unsafe).
    var GARDEN_TIP = theme.tip;
    var GARDEN_ROOT = theme.root;
    function gardenTip(type) { return GARDEN_TIP[type] || GARDEN_TIP.other; }
    function gardenRoot(type) { return GARDEN_ROOT[type] || GARDEN_ROOT.other; }
    var SPRITE_SCALE = 16;  // canvas px per world unit
    var BODY_FACE_OPACITY = 0.12; // translucent glass-box faces (tunable)
    var BODY_EDGE_OPACITY = 0.5;  // brighter box edges for 3D definition
    // uniform box edge -- big enough to enclose the cone burst (cones reach ~11-15
    // world units, so half-edge >=~15). Content is shown by the inner glow, not size.
    var BOX_SIZE = 34;
    // nudge the label off the busy centre toward the bottom-right (racing-game
    // nameplate style) while keeping it attached to the node cluster. Tied to the
    // chip's own constant on-screen size, so it stays a fixed, modest screen offset.
    var LABEL_OFF_X = -0.22; // node sits this fraction-of-width left of the chip -> chip to the right
    var LABEL_OFF_Y = 2.0;   // node sits above the chip top -> chip hangs below
    var CARD_NEAR = 60;     // camera distance where the property card is fully visible
    var CARD_FADE = 35;     // fade range beyond CARD_NEAR
    var MAX_OPEN_CARDS = 4; // only the nearest few nodes open into cards
    // Clamped label scaling: chips scale with distance like real objects
    // (keeps the sense of depth) but are clamped to a readable minimum and a
    // sane maximum on screen, so far states stay identifiable.
    var CHIP_WORLD_H = 3.2; // natural world height of a label chip
    var CHIP_PX_MIN = 12;   // labels never shrink below this on-screen height
    var CHIP_PX_MAX = 26;   // ...nor grow beyond this
    var FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

    var overlay = document.getElementById('asd3d-overlay');
    var canvasEl = document.getElementById('asd3d-canvas');
    var openBtn = document.getElementById('asd3d-open');
    var exitBtn = document.getElementById('asd3d-exit');
    var fsBtn = document.getElementById('asd3d-fs');
    var tagbar = document.getElementById('asd3d-tagbar');
    var hudEl = document.getElementById('asd3d-hud');
    var statsEl = document.getElementById('asd3d-stats');
    var statusEl = document.getElementById('asd3d-status');
    var statusText = document.getElementById('asd3d-status-text');
    var spinnerEl = document.getElementById('asd3d-spinner');
    var infoPanel = document.getElementById('asd3d-info');
    var infoTitle = document.getElementById('asd3d-info-title');
    var infoTableBtn = document.getElementById('asd3d-info-table');
    var infoClearBtn = document.getElementById('asd3d-info-clear');
    var infoActions = document.getElementById('asd3d-info-actions');
    var btnLabelId = document.getElementById('asd3d-label-id');
    var btnLabelTitle = document.getElementById('asd3d-label-title');
    var cardTip = document.getElementById('asd3d-tip');
    var settingsEl = document.getElementById('asd3d-settings');
    var topbarEl = document.querySelector('.asd3d-topbar');
    var speedParticleEl = document.getElementById('asd3d-speed-particle');
    var speedOrbitEl = document.getElementById('asd3d-speed-orbit');
    var orbSizeEl = document.getElementById('asd3d-orb-size');
    var ballSpeedEl = document.getElementById('asd3d-ball-speed');
    var speedParticleValEl = document.getElementById('asd3d-speed-particle-val');
    var speedOrbitValEl = document.getElementById('asd3d-speed-orbit-val');
    var orbSizeValEl = document.getElementById('asd3d-orb-size-val');
    var ballSpeedValEl = document.getElementById('asd3d-ball-speed-val');
    var boxHueEl = document.getElementById('asd3d-box-hue');
    var boxHueValEl = document.getElementById('asd3d-box-hue-val');
    var boxSizeEl = document.getElementById('asd3d-box-size');
    var boxSizeValEl = document.getElementById('asd3d-box-size-val');
    var boxOpacityEl = document.getElementById('asd3d-box-opacity');
    var boxOpacityValEl = document.getElementById('asd3d-box-opacity-val');
    var bloomBrightEl = document.getElementById('asd3d-bloom-bright');
    var bloomBrightValEl = document.getElementById('asd3d-bloom-bright-val');
    var crossEl = document.getElementById('asd3d-cross');
    var crossValEl = document.getElementById('asd3d-cross-val');
    var fogEl = document.getElementById('asd3d-fog');
    var fogValEl = document.getElementById('asd3d-fog-val');
    var cardSizeEl = document.getElementById('asd3d-card-size');
    var cardSizeValEl = document.getElementById('asd3d-card-size-val');
    var linkWidthEl = document.getElementById('asd3d-link-width');
    var linkWidthValEl = document.getElementById('asd3d-link-width-val');
    var linkOpacityEl = document.getElementById('asd3d-link-opacity');
    var linkOpacityValEl = document.getElementById('asd3d-link-opacity-val');
    var settingsNoteEl = document.getElementById('asd3d-settings-note');
    var mainContent = document.querySelector('.markdown-body');
    if (!overlay || !canvasEl || !openBtn || !exitBtn) return;

    var reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var graph = null;
    var active = false;
    var libsPromise = null;
    var lodTimer = null;
    var selectedNodeId = '';   // the focused node (camera flew to it, info panel shows it)
    var cardOpenId = '';       // the node whose detail card is open (explicit click only)
    var currentNodes = [];
    var lastTagKey = null;
    var lastLabelMode = '';
    var fitDone = false;
    var tagBarBuilt = false;
    var particlesEnabled = false;
    var lastInteractAt = 0;    // for the always-on idle orbit: pause while the user acts
    function noteInteract() { lastInteractAt = performance.now(); }
    var cardPulseAt = 0;       // self-loop feedback: a quick card bounce when an action returns to the same state
    var particleSpeed = 0.004; // photon flight speed, adjustable from the settings flyout
    var idleOrbitSpeed = 0.09; // idle-drift angular speed (rad/s), adjustable too
    var orbScale = 2.0;        // global multiplier on the inner "orb" glow size (Orb size slider)
    var grainSpeed = 0.1;      // speed of the descriptor-grain swarm (0 = frozen)
    var boxHue = 0;            // hue rotation (deg) applied to the glass-box colour only (Box hue slider)
    var boxScale = 1.0;        // glass-box size multiplier (Box size slider)
    var boxOpacity = 1.0;      // glass-box face/edge opacity multiplier (Box opacity slider)
    var bloomBright = 1.0;     // orb/bloom brightness multiplier (Bloom brightness slider)
    var crossStrength = 0.45;  // star-glow diffraction-cross opacity (Cross strength slider)
    var fogScale = 1.0;        // multiplier on the fog near/far distances (Fog depth slider)
    var baseFogNear = 0, baseFogFar = 0; // the fog distances the slider scales from
    var bloomSeq = 0;          // per-node counter to desync the bloom breathing phase
    var arrowSeq = 0;          // per-arrow counter to desync the cone shimmer phase

    hudEl.innerHTML = 'Drag: rotate \\u00b7 Right-drag: pan \\u00b7 Scroll: zoom<br>' +
        'Click node: focus \\u00b7 Right-click: table \\u00b7 S: settings \\u00b7 Esc: back to 2D<br>Depth: entry near \\u2192 deep states far';

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () { resolve(); };
            s.onerror = function () { reject(new Error('Failed to load ' + src)); };
            document.head.appendChild(s);
        });
    }

    function ensureLibs() {
        if (!libsPromise) {
            var threeReady = window.THREE
                ? Promise.resolve()
                : import(THREE_SRC).then(function (mod) { window.THREE = mod; });
            libsPromise = threeReady.then(function () {
                return typeof ForceGraph3D === 'undefined' ? loadScript(FG3D_SRC) : null;
            });
            libsPromise.catch(function () { libsPromise = null; });
        }
        return libsPromise;
    }

    function labelModeIs(mode) { return getCurrentLabelMode() === mode; }
    function getNodeLabel(node) { return labelModeIs('title') ? (node.title || node.id) : node.id; }

    // ---- graph model (same derivation rules as generateDotFromAlps) ----
    function buildFlatMap(descs, map) {
        (descs || []).forEach(function (d) {
            if (d.id && !map[d.id]) { map[d.id] = d; }
            if (Array.isArray(d.descriptor)) { buildFlatMap(d.descriptor, map); }
        });
        return map;
    }

    function resolveChildId(child) {
        if (child.id) return child.id;
        if (child.href) {
            var idx = child.href.indexOf('#');
            return idx >= 0 ? child.href.substring(idx + 1) : '';
        }
        return '';
    }

    function buildGraphModel(filterIds) {
        var data = window.alpsData || {};
        var descriptors = (data.alps && data.alps.descriptor) || [];
        var flatMap = buildFlatMap(descriptors, {});
        var transitions = descriptors.filter(function (d) { return d.type && d.rt; });
        var transitionEntries = transitions
            .filter(function (t) { return t.id && t.rt; })
            .map(function (t) {
                return {
                    trans: t,
                    targetState: String(t.rt).replace('#', ''),
                    sourceStates: findSourceStatesForTransition(t.id, descriptors)
                };
            });
        var diagramNodeIds = new Set(transitions.map(function (t) { return String(t.rt).replace('#', ''); }));
        transitionEntries.forEach(function (entry) {
            entry.sourceStates.forEach(function (s) { diagramNodeIds.add(s); });
        });

        var visibleNodeIds = diagramNodeIds;
        var visibleEntries = transitionEntries;
        if (filterIds && filterIds.size > 0) {
            visibleNodeIds = new Set();
            diagramNodeIds.forEach(function (id) { if (filterIds.has(id)) visibleNodeIds.add(id); });
            transitionEntries.forEach(function (entry) {
                if (filterIds.has(entry.trans.id)) {
                    visibleNodeIds.add(entry.targetState);
                    entry.sourceStates.forEach(function (s) { visibleNodeIds.add(s); });
                }
            });
            visibleEntries = transitionEntries
                .map(function (entry) {
                    return {
                        trans: entry.trans,
                        targetState: entry.targetState,
                        sourceStates: entry.sourceStates.filter(function (s) {
                            return visibleNodeIds.has(s) && visibleNodeIds.has(entry.targetState);
                        })
                    };
                })
                .filter(function (entry) { return entry.sourceStates.length > 0; });
        }

        function collectChildren(d, semanticOnly) {
            var out = [];
            (Array.isArray(d.descriptor) ? d.descriptor : []).forEach(function (child) {
                var cid = resolveChildId(child);
                if (!cid) return;
                var resolved = flatMap[cid] || child;
                var type = resolved.type || 'semantic';
                if (!semanticOnly || type === 'semantic') {
                    out.push({ id: cid, title: resolved.title || '' });
                }
            });
            return out;
        }

        var nodes = [];
        visibleNodeIds.forEach(function (id) {
            var d = flatMap[id] || { id: id };
            nodes.push({ id: id, title: d.title || '', props: collectChildren(d, true) });
        });

        var links = [];
        var pairCount = {};
        visibleEntries.forEach(function (entry) {
            entry.sourceStates.forEach(function (s) {
                var key = s + '\\t' + entry.targetState;
                pairCount[key] = (pairCount[key] || 0) + 1;
            });
        });
        var pairSeen = {};
        visibleEntries.forEach(function (entry) {
            var t = entry.trans;
            var tProps = collectChildren(t, false);
            entry.sourceStates.forEach(function (s) {
                var key = s + '\\t' + entry.targetState;
                var idx = pairSeen[key] || 0;
                pairSeen[key] = idx + 1;
                var n = pairCount[key];
                var hasReverse = Boolean(pairCount[entry.targetState + '\\t' + s]) && s !== entry.targetState;
                // straight by default; curve only where geometry would otherwise
                // overlap (parallel edges, opposite directions, self-loops)
                var curvature = 0;
                var rotation = 0;
                if (s === entry.targetState) {
                    curvature = 0.5;
                    rotation = (2 * Math.PI * idx) / n;
                } else if (n > 1) {
                    curvature = 0.2;
                    rotation = (2 * Math.PI * idx) / n + (hasReverse ? 0.5 : 0);
                } else if (hasReverse) {
                    curvature = 0.15;
                    rotation = 0.5;
                }
                links.push({
                    source: s,
                    target: entry.targetState,
                    transId: t.id,
                    transTitle: t.title || t.id,
                    transType: t.type || '',
                    color: gardenTip(t.type),       // shoot tip (also used by card borders, glow, particles)
                    stemColor: gardenRoot(t.type),  // dark root of the stem
                    props: tProps,
                    curvature: curvature,
                    rotation: rotation
                });
            });
        });

        // outgoing transitions per node, used as action buttons on the card
        var actionsByNode = Object.create(null);
        links.forEach(function (l) {
            (actionsByNode[l.source] = actionsByNode[l.source] || []).push(l);
        });
        nodes.forEach(function (n) {
            var seen = {};
            n.actions = (actionsByNode[n.id] || []).filter(function (l) {
                var k = l.transId + '\\u0001' + l.target;
                if (seen[k]) return false;
                seen[k] = true;
                return true;
            }).map(function (l) {
                return {
                    transId: l.transId,
                    transTitle: l.transTitle,
                    transType: l.transType,
                    color: l.color,
                    targetId: l.target
                };
            }).sort(function (a, b) {
                // do-actions (unsafe/idempotent) first, then go-actions (safe);
                // alphabetical within each group. Column-major layout then fills a
                // column with do's and lets go's continue in the same column.
                var ga = a.transType === 'safe' ? 1 : 0;
                var gb = b.transType === 'safe' ? 1 : 0;
                if (ga !== gb) return ga - gb;
                return a.transId.localeCompare(b.transId);
            });
        });

        // degree = how many transitions touch a node; hubs bloom larger/brighter
        var degreeOf = Object.create(null);
        links.forEach(function (l) {
            degreeOf[l.source] = (degreeOf[l.source] || 0) + 1;
            degreeOf[l.target] = (degreeOf[l.target] || 0) + 1;
        });
        var maxDeg = 1;
        nodes.forEach(function (n) { n.degree = degreeOf[n.id] || 0; if (n.degree > maxDeg) maxDeg = n.degree; });
        // richness = how much a state holds (properties + outgoing transitions);
        // it drives the bloom SIZE so content-heavy states (Cart, ProductDetail)
        // glow large, while degree drives the bloom BRIGHTNESS (graph prominence)
        var maxRich = 1;
        nodes.forEach(function (n) {
            n.rich = (n.props ? n.props.length : 0) + (n.actions ? n.actions.length : 0);
            if (n.rich > maxRich) maxRich = n.rich;
        });
        nodes.forEach(function (n) {
            n.bloom = n.degree / maxDeg;       // 0..1 connectivity prominence (brightness)
            n.bloomSize = n.rich / maxRich;    // 0..1 content richness (size)
        });
        return { nodes: nodes, links: links };
    }

    // ---- sprite rendering ----
    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawChipCanvas(text) {
        var font = '600 28px ' + FONT_STACK;
        var measure = makeCanvas(1, 1).getContext('2d');
        measure.font = font;
        var tw = Math.ceil(measure.measureText(text).width);
        var padX = 16;
        var h = 40;
        var w = Math.min(tw + padX * 2, 520);
        var c = makeCanvas(w, h);
        var ctx = c.getContext('2d');
        roundRectPath(ctx, 1, 1, w - 2, h - 2, 10);
        ctx.fillStyle = 'rgba(245,249,255,1)'; // fully opaque so the label reads as a solid plate over the cones
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(122,162,255,0.7)';
        ctx.stroke();
        ctx.font = font;
        ctx.fillStyle = '#101c38';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h / 2 + 1, w - padX);
        return c;
    }

    function fitText(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        var t = text;
        while (t.length > 1 && ctx.measureText(t + '\\u2026').width > maxW) t = t.slice(0, -1);
        return t + '\\u2026';
    }

    // Renders a state card: header, ALL properties in a multi-column grid, and
    // ALL outgoing transitions as color-coded buttons in a grid. Returns hit
    // rects (with titles) for properties and buttons so hover can show the title
    // and clicks can fire the transition.
    function drawCardCanvas(node) {
        var headFont = '700 28px ' + FONT_STACK;
        var subFont = '400 21px ' + FONT_STACK;
        var rowFont = '400 22px ' + FONT_STACK;
        var btnFont = '600 21px ' + FONT_STACK;
        var titleMode = labelModeIs('title');
        var head = getNodeLabel(node);
        var sub = (node.title && node.title !== node.id) ? (titleMode ? node.id : node.title) : '';

        var props = node.props.map(function (p) {
            return { id: p.id, title: p.title || '', label: titleMode ? (p.title || p.id) : p.id };
        });
        var actions = (node.actions || []).map(function (a) {
            return { transId: a.transId, transTitle: a.transTitle, transType: a.transType, color: a.color,
                targetId: a.targetId, label: '\\u25B8 ' + (titleMode ? (a.transTitle || a.transId) : a.transId) };
        });

        var measure = makeCanvas(1, 1).getContext('2d');
        var MARGIN = 22, COL_GAP = 16, MARKER_W = 22, MAX_TEXT = 230, rowH = 32;
        var btnH = 34, btnGapY = 8;
        var cellLabel = function (cell) { return cell.more ? ('+ ' + cell.more + ' more') : cell.label; };

        // Lay items column-major into a grid bounded by maxRows (height) and
        // maxCols (width). Overflow collapses into a trailing "+N more" cell;
        // the complete list is always in the info panel and the 2D table.
        function gridCells(items, maxRows, maxCols) {
            var cap = maxRows * maxCols;
            if (items.length <= cap) {
                return { cells: items.slice(), cols: Math.max(1, Math.ceil(items.length / maxRows)) };
            }
            var shown = items.slice(0, cap - 1);
            shown.push({ more: items.length - (cap - 1) });
            return { cells: shown, cols: maxCols };
        }

        var pg = gridCells(props, 10, 4);
        var propCells = pg.cells, propCols = pg.cols;
        var propRowsPer = propCells.length ? Math.ceil(propCells.length / propCols) : 0;
        measure.font = rowFont;
        var propColW = [];
        for (var ci = 0; ci < propCols; ci++) {
            var wmax = 60;
            for (var ri = 0; ri < propRowsPer; ri++) {
                var idx = ci * propRowsPer + ri;
                if (idx < propCells.length) wmax = Math.max(wmax, measure.measureText(cellLabel(propCells[idx])).width);
            }
            propColW[ci] = Math.min(wmax, MAX_TEXT) + MARKER_W;
        }
        var propsGridW = propColW.reduce(function (a, b) { return a + b; }, 0) + COL_GAP * (propCols - 1);

        var bg = gridCells(actions, 8, 4);
        var btnCells = bg.cells, btnCols = actions.length ? bg.cols : 0;
        var btnRowsPer = btnCells.length ? Math.ceil(btnCells.length / btnCols) : 0;
        measure.font = btnFont;
        var btnColW = [];
        for (var cj = 0; cj < btnCols; cj++) {
            var bmax = 130;
            for (var rj = 0; rj < btnRowsPer; rj++) {
                var bidx = cj * btnRowsPer + rj;
                if (bidx < btnCells.length) bmax = Math.max(bmax, measure.measureText(cellLabel(btnCells[bidx])).width + 28);
            }
            btnColW[cj] = Math.min(bmax, 300);
        }
        var btnsGridW = actions.length ? (btnColW.reduce(function (a, b) { return a + b; }, 0) + COL_GAP * (btnCols - 1)) : 0;

        measure.font = headFont;
        var headerW = measure.measureText(head).width;
        if (sub) { measure.font = subFont; headerW = Math.max(headerW, measure.measureText(sub).width); }

        var w = Math.ceil(Math.min(Math.max(Math.max(headerW, propsGridW, btnsGridW) + MARGIN * 2, 240), 1040));
        var headerH = 52 + (sub ? 28 : 0);
        var propsH = propCells.length ? propRowsPer * rowH : rowH;
        var btnsH = btnCells.length ? (16 + btnRowsPer * (btnH + btnGapY)) : 0;
        var h = headerH + 12 + propsH + btnsH + 16;

        var c = makeCanvas(w, h);
        var ctx = c.getContext('2d');
        roundRectPath(ctx, 2, 2, w - 4, h - 4, 16);
        ctx.fillStyle = 'rgba(248,250,255,0.97)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(90,130,220,0.5)';
        ctx.stroke();
        ctx.fillStyle = '#0d1a36';
        ctx.font = headFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(head, MARGIN, 32, w - MARGIN * 2 - 34); // leave room for the close button
        if (sub) {
            ctx.fillStyle = '#5d6f94';
            ctx.font = subFont;
            ctx.fillText(sub, MARGIN, 60, w - MARGIN * 2);
        }
        // close (x) button, top-right
        var closeRect = { x: w - 42, y: 8, w: 34, h: 34 };
        var ccx = closeRect.x + closeRect.w / 2, ccy = closeRect.y + closeRect.h / 2;
        ctx.beginPath();
        ctx.arc(ccx, ccy, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,120,180,0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,85,130,0.85)';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ccx - 6, ccy - 6); ctx.lineTo(ccx + 6, ccy + 6);
        ctx.moveTo(ccx + 6, ccy - 6); ctx.lineTo(ccx - 6, ccy + 6);
        ctx.stroke();
        ctx.lineCap = 'butt';

        var y = headerH;
        ctx.strokeStyle = 'rgba(90,130,220,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 16, y); ctx.stroke();
        y += 10;

        var propRects = [];
        ctx.font = rowFont;
        if (props.length === 0) {
            ctx.fillStyle = '#93a1bd';
            ctx.fillText('(no properties)', MARGIN, y + rowH / 2);
        } else {
            var colX = MARGIN;
            for (var cc = 0; cc < propCols; cc++) {
                for (var rr = 0; rr < propRowsPer; rr++) {
                    var pidx = cc * propRowsPer + rr;
                    if (pidx >= propCells.length) break;
                    var pcell = propCells[pidx];
                    var py = y + rr * rowH;
                    if (pcell.more) {
                        ctx.fillStyle = '#7d8db1';
                        ctx.fillText('+ ' + pcell.more + ' more', colX, py + rowH / 2 + 1);
                    } else {
                        ctx.fillStyle = '#6f87c0';
                        ctx.fillRect(colX, py + rowH / 2 - 5, 10, 10);
                        ctx.fillStyle = '#22304f';
                        ctx.fillText(fitText(ctx, pcell.label, propColW[cc] - MARKER_W), colX + MARKER_W, py + rowH / 2 + 1);
                        propRects.push({ x: colX, y: py, w: propColW[cc], h: rowH, id: pcell.id, title: pcell.title });
                    }
                }
                colX += propColW[cc] + COL_GAP;
            }
        }
        y += propsH;

        var buttons = [];
        if (btnCells.length) {
            y += 8;
            ctx.strokeStyle = 'rgba(90,130,220,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 16, y); ctx.stroke();
            y += 10;
            ctx.font = btnFont;
            var bColX = MARGIN;
            for (var bc = 0; bc < btnCols; bc++) {
                for (var br = 0; br < btnRowsPer; br++) {
                    var aidx = bc * btnRowsPer + br;
                    if (aidx >= btnCells.length) break;
                    var a = btnCells[aidx];
                    var by = y + br * (btnH + btnGapY);
                    var bw = btnColW[bc];
                    if (a.more) {
                        ctx.fillStyle = '#7d8db1';
                        ctx.fillText('+ ' + a.more + ' more', bColX + 4, by + btnH / 2 + 1);
                    } else {
                        roundRectPath(ctx, bColX, by, bw, btnH, 9);
                        ctx.fillStyle = 'rgba(255,255,255,0.9)';
                        ctx.fill();
                        ctx.strokeStyle = a.color;
                        ctx.lineWidth = 2.5;
                        ctx.stroke();
                        ctx.fillStyle = '#1c2a4a';
                        ctx.fillText(fitText(ctx, a.label, bw - 24), bColX + 13, by + btnH / 2 + 1);
                        buttons.push({ x: bColX, y: by, w: bw, h: btnH, targetId: a.targetId, transId: a.transId, color: a.color, title: a.transTitle });
                    }
                }
                bColX += btnColW[bc] + COL_GAP;
            }
        }
        return { canvas: c, buttons: buttons, props: propRects, close: closeRect };
    }

    function makeTexture(canvas) {
        var texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        try { texture.colorSpace = 'srgb'; } catch (e) {}
        return texture;
    }

    // Label chips use sizeAttenuation:false so they keep a constant on-screen
    // size at any camera distance — far states stay identifiable, which a 2D
    // fit-to-width view of a large graph cannot offer. depthTest:false keeps
    // chips and cards always in front of lines, arrow cones and particles.
    function canvasSprite(canvas, constantSize) {
        var material = new THREE.SpriteMaterial({
            map: makeTexture(canvas),
            transparent: true,
            depthWrite: false,
            depthTest: false
        });
        if (constantSize) {
            material.sizeAttenuation = false;
            material.fog = false;
        }
        var sprite = new THREE.Sprite(material);
        if (constantSize) {
            sprite.userData.aspect = canvas.width / canvas.height;
            applyChipScale(sprite);
        } else {
            sprite.scale.set(canvas.width / SPRITE_SCALE, canvas.height / SPRITE_SCALE, 1);
        }
        return sprite;
    }

    function projectionTerm() {
        var p11 = 1.303; // projection term for the default 75-degree fov
        try { p11 = graph.camera().projectionMatrix.elements[5] || p11; } catch (e) {}
        return p11;
    }

    function applyChipScale(sprite) {
        // placeholder scale until the per-frame LOD loop takes over
        var sy = 2 * CHIP_PX_MIN / (projectionTerm() * (window.innerHeight || 900));
        sprite.scale.set(sy * sprite.userData.aspect, sy, 1);
    }

    function makeNodeObject(node) {
        var group = new THREE.Group();
        // hub bloom: a soft green glow behind the label, larger and brighter for
        // high-degree hubs (the biggest bloom in the garden); distance + fog make
        // far blooms recede (aerial perspective)
        // inner glow: the content INDICATOR inside the uniform box. Its SIZE encodes
        // how much the state holds (content richness + connectivity); its COLOUR marks
        // whether the state only navigates (get-only) or also has effects (has do).
        var btDeg = node.bloom || 0;        // connectivity
        var btRich = node.bloomSize || 0;   // content richness
        var sizeF = Math.max(btRich, btDeg * 0.6);
        var bmat = new THREE.SpriteMaterial({
            map: getGlowTexture(), transparent: true, depthWrite: false,
            depthTest: false, blending: THREE.AdditiveBlending
        });
        bmat.color.set(bodyColor(node));
        var bloomOpacity = 0.16 + Math.max(btDeg, btRich * 0.7) * 0.4;
        bmat.opacity = bloomOpacity;
        var bloom = new THREE.Sprite(bmat);
        var bloomBase = 10 + sizeF * 30; // "orb" size ~10..40 -- the biggest (ProductDetail-class) spill a little past the box
        bloom.scale.set(bloomBase, bloomBase, 1);
        bloom.renderOrder = 7; // behind chip(10) and card(11)
        group.add(bloom);
        // node body: a translucent 3D glass box (faces + glowing edges) around the
        // node. UNIFORM size -- big enough to enclose the cone burst -- so it reads as
        // a consistent container; the amount of content is shown by the inner glow,
        // and the colour (get-only vs has-do) by bodyColor. A real cube (not a
        // billboard), so it turns with the view.
        var body = null, bodyMat = null, bodyEdgeMat = null;
        if ((node.degree || 0) >= 1) {
            var bcol = withBoxHue(new THREE.Color(bodyColor(node)));
            bodyMat = new THREE.MeshBasicMaterial({ color: bcol, transparent: true, opacity: BODY_FACE_OPACITY, depthWrite: false });
            var boxMesh = new THREE.Mesh(getBoxGeometry(), bodyMat);
            boxMesh.renderOrder = 5;
            bodyEdgeMat = new THREE.LineBasicMaterial({ color: bcol, transparent: true, opacity: BODY_EDGE_OPACITY, depthWrite: false });
            var boxEdgeLines = new THREE.LineSegments(getBoxEdges(), bodyEdgeMat);
            boxEdgeLines.renderOrder = 6;
            body = new THREE.Group();
            body.add(boxMesh);
            body.add(boxEdgeLines);
            body.scale.set(BOX_SIZE * boxScale, BOX_SIZE * boxScale, BOX_SIZE * boxScale); // uniform, live-scalable
            group.add(body);
        }
        // descriptor grains: one small translucent grey sphere per contained
        // descriptor, scattered inside the box -- the literal, countable "contents"
        var grains = null, grainPos = null, grainVel = null, grainScl = null;
        var pc = node.props ? node.props.length : 0;
        if (pc > 0) {
            grains = new THREE.InstancedMesh(getGrainGeo(), getGrainMat(), pc);
            grains.renderOrder = 8; // over the additive orb (7) so the grey grains stay countable
            grainPos = new Float32Array(pc * 3); // local positions, animated each frame
            grainVel = new Float32Array(pc * 3); // velocities (centre-seeking guidance)
            grainScl = new Float32Array(pc);
            var gm = new THREE.Matrix4(), gspread = BOX_SIZE * 0.32 * boxScale, j;
            for (var gi = 0; gi < pc; gi++) {
                j = gi * 3;
                grainScl[gi] = (0.7 + Math.random() * 0.5) * 1.4; // small grain (+40% radius)
                grainPos[j] = (Math.random() * 2 - 1) * gspread;
                grainPos[j + 1] = (Math.random() * 2 - 1) * gspread;
                grainPos[j + 2] = (Math.random() * 2 - 1) * gspread;
                grainVel[j] = (Math.random() * 2 - 1) * 0.4;
                grainVel[j + 1] = (Math.random() * 2 - 1) * 0.4;
                grainVel[j + 2] = (Math.random() * 2 - 1) * 0.4;
                gm.makeScale(grainScl[gi], grainScl[gi], grainScl[gi]);
                gm.setPosition(grainPos[j], grainPos[j + 1], grainPos[j + 2]);
                grains.setMatrixAt(gi, gm);
                grains.setColorAt(gi, grainColor(node.props[gi].id)); // colourful per descriptor
            }
            grains.instanceMatrix.needsUpdate = true;
            if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
            group.add(grains);
        }
        var chip = canvasSprite(drawChipCanvas(getNodeLabel(node)), true);
        // subtle depth: let labels recede into the fog with distance. fog.near sits
        // ~one graph-width out, so focused/near labels stay crisp and only distant
        // ones soften -- and the Fog depth slider tunes the amount.
        chip.material.fog = true;
        chip.center.set(LABEL_OFF_X, LABEL_OFF_Y); // nameplate: hang the label at the node's bottom-right
        chip.renderOrder = 10;
        group.add(chip);
        node.__asd3d = {
            group: group, chip: chip, card: null, bloom: bloom, body: body,
            grains: grains, grainPos: grainPos, grainVel: grainVel, grainScl: grainScl,
            // breathing: base scale/opacity + a desynced phase so blooms pulse
            // organically rather than strobing in unison
            bloomBase: bloomBase, bloomOpacity: bloomOpacity,
            bodyMat: bodyMat, bodyEdgeMat: bodyEdgeMat,
            bloomPhase: (bloomSeq++ * 2.39996) % 6.28318
        };
        return group;
    }

    function disposeSprite(sprite) {
        if (!sprite) return;
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
    }

    function ensureCard(node) {
        var s = node.__asd3d;
        if (!s || s.card) return;
        var drawn = drawCardCanvas(node);
        var card = canvasSprite(drawn.canvas);
        card.renderOrder = 11;
        card.material.opacity = 0;
        card.visible = false;
        s.group.add(card);
        s.card = card;
        s.cardButtons = drawn.buttons;
        s.cardProps = drawn.props;
        s.cardClose = drawn.close;
        s.cardSize = { w: drawn.canvas.width, h: drawn.canvas.height };
        s.cardBaseScale = { x: card.scale.x, y: card.scale.y }; // raw; cardScale applied per-frame
        s.cardShownAt = 0;
        s.cardVisPrev = false;
    }

    function dropCard(s) {
        if (!s || !s.card) return;
        s.group.remove(s.card);
        disposeSprite(s.card);
        s.card = null;
        s.cardButtons = null;
        s.cardProps = null;
        s.cardClose = null;
        s.cardSize = null;
    }

    // ---- arrival glow: a halo flares on the target card when a particle
    // reaches it (or when a transition button is used), then fades out ----
    var haloTexture = null;

    function getHaloTexture() {
        if (haloTexture) return haloTexture;
        var c = makeCanvas(128, 128);
        var ctx = c.getContext('2d');
        // bright at a mid radius (a soft ring) so when scaled to a card the glow
        // lights up the card's edges — reads as the particle striking the border
        var grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
        grad.addColorStop(0.0, 'rgba(255,255,255,0.35)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0.9)');
        grad.addColorStop(0.72, 'rgba(255,255,255,0.45)');
        grad.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        haloTexture = makeTexture(c);
        return haloTexture;
    }

    var starField = null;    // background starfield THREE.Points (cosmos only)
    var starTexture = null;
    var starCanvas = null;
    function drawStarCanvas() {
        var ctx = starCanvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.globalCompositeOperation = 'source-over';
        // soft round core
        var core = ctx.createRadialGradient(64, 64, 0, 64, 64, 44);
        core.addColorStop(0.0, 'rgba(255,255,255,0.95)');
        core.addColorStop(0.25, 'rgba(255,255,255,0.5)');
        core.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = core;
        ctx.fillRect(0, 0, 128, 128);
        // 4-point diffraction flare (a crossed pair of fading bars); strength is the
        // bar opacity, driven by the Cross strength slider
        var cs = Math.max(0, Math.min(1, crossStrength));
        ctx.globalCompositeOperation = 'lighter';
        var hg = ctx.createLinearGradient(2, 64, 126, 64);
        hg.addColorStop(0, 'rgba(255,255,255,0)');
        hg.addColorStop(0.5, 'rgba(255,255,255,' + cs + ')');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg; ctx.fillRect(2, 62.5, 124, 3);
        var vg = ctx.createLinearGradient(64, 2, 64, 126);
        vg.addColorStop(0, 'rgba(255,255,255,0)');
        vg.addColorStop(0.5, 'rgba(255,255,255,' + cs + ')');
        vg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = vg; ctx.fillRect(62.5, 2, 3, 124);
        ctx.globalCompositeOperation = 'source-over';
    }
    function getStarTexture() {
        if (starTexture) return starTexture;
        starCanvas = makeCanvas(128, 128);
        drawStarCanvas();
        starTexture = makeTexture(starCanvas);
        return starTexture;
    }
    // redraw the shared star texture at the current crossStrength; all bloom sprites
    // using it update at once (no-op until the cosmos star glow has been built)
    function rebuildStarTexture() {
        if (!starCanvas) return;
        drawStarCanvas();
        if (starTexture) starTexture.needsUpdate = true;
    }
    // the hub glow shape is theme-driven: a soft disc (botanical) or a star flare (cosmos)
    function getGlowTexture() { return theme.glow === 'star' ? getStarTexture() : getHaloTexture(); }

    // shared unit cube geometry + its edge lines for the node "body" box (scaled per node)
    var boxGeometry = null, boxEdges = null;
    function getBoxGeometry() { if (!boxGeometry) boxGeometry = new THREE.BoxGeometry(1, 1, 1); return boxGeometry; }
    function getBoxEdges() { if (!boxEdges) boxEdges = new THREE.EdgesGeometry(getBoxGeometry()); return boxEdges; }
    // shared low-poly sphere + material for the "descriptor grains"; per-instance
    // colour (instanceColor) tints each grain, so the white base lets the colour show
    var grainGeo = null, grainMat = null;
    function getGrainGeo() { if (!grainGeo) grainGeo = new THREE.SphereGeometry(1, 6, 5); return grainGeo; }
    function getGrainMat() { if (!grainMat) grainMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }); return grainMat; }
    // stable colourful hue per descriptor id (same descriptor -> same colour everywhere)
    var grainColorTmp = null;
    function grainColor(id) {
        if (!grainColorTmp) grainColorTmp = new THREE.Color();
        var h = 0; for (var k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
        grainColorTmp.setHSL((h % 360) / 360, 0.62, 0.62);
        return grainColorTmp;
    }
    // body/glow tint marks the state's character: a "get-only" state (every outgoing
    // transition is safe/navigation) reads in the safe colour; a state that also has
    // any non-get effect (do = unsafe/idempotent) reads in the unsafe colour.
    function bodyColor(node) {
        var actions = node.actions || [];
        var hasNonGet = actions.some(function (a) { return a.transType && a.transType !== 'safe'; });
        return gardenTip(hasNonGet ? 'unsafe' : 'safe');
    }
    // rotate a THREE.Color's hue by the current boxHue (deg); mutates + returns it.
    // applied to the GLASS BOX only (not the orb), so the box can be recoloured live.
    function withBoxHue(color) {
        if (!boxHue) return color;
        var hsl = {}; color.getHSL(hsl);
        var h = (hsl.h + boxHue / 360) % 1; if (h < 0) h += 1;
        color.setHSL(h, hsl.s, hsl.l);
        return color;
    }
    // recolour every existing glass box from its canonical bodyColor + boxHue (no
    // compounding, since it re-derives from bodyColor each time)
    function applyBoxHue() {
        currentNodes.forEach(function (n) {
            var s = n.__asd3d;
            if (!s || !s.bodyMat) return;
            var col = withBoxHue(new THREE.Color(bodyColor(n)));
            s.bodyMat.color.copy(col);
            if (s.bodyEdgeMat) s.bodyEdgeMat.color.copy(col);
        });
    }
    // live-resize every glass box to the current boxScale (new nodes pick it up in
    // makeNodeObject; grain walls track it in updateGrains)
    function applyBoxScale() {
        var sz = BOX_SIZE * boxScale;
        currentNodes.forEach(function (n) {
            var s = n.__asd3d;
            if (s && s.body) s.body.scale.set(sz, sz, sz);
        });
    }
    // push the current fogScale onto the live fog (Fog depth slider)
    function applyFog() {
        try {
            var fog = graph.scene().fog;
            if (fog && baseFogFar) { fog.near = baseFogNear * fogScale; fog.far = baseFogFar * fogScale; }
        } catch (e) {}
    }
    // links use the scene fog, so the dark stems dissolve into the background with
    // distance ("hard to see"). Take the link tubes out of the fog so they keep their
    // colour at any distance. Re-applied after every layout/width-rebuild.
    function defogLinks() {
        try {
            var ls = graph.graphData().links;
            for (var i = 0; i < ls.length; i++) {
                var lo = ls[i].__lineObj;
                if (lo && lo.material && lo.material.fog) { lo.material.fog = false; lo.material.needsUpdate = true; }
            }
        } catch (e) {}
    }
    // ---- persist the settings sliders to localStorage so a user's tuning (card
    // size, box look, fog, etc.) carries to the next visit -- no need to re-find
    // good values. Raw slider values keyed by element id; restored once the graph
    // is built by replaying each slider's input handler.
    var SETTINGS_KEY = 'asd3d-settings-v1';
    var settingsRestored = false;
    function settingsSliders() {
        return [orbSizeEl, ballSpeedEl, speedParticleEl, speedOrbitEl, boxHueEl, linkWidthEl, linkOpacityEl,
                boxSizeEl, boxOpacityEl, bloomBrightEl, crossEl, fogEl, cardSizeEl];
    }
    function asd3dSaveSettings() {
        try {
            var v = {};
            settingsSliders().forEach(function (el) { if (el) v[el.id] = el.value; });
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
        } catch (e) {}
    }
    function asd3dRestoreSettings() {
        if (settingsRestored) return;
        settingsRestored = true;
        var v;
        try { v = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { v = null; }
        if (!v || typeof v !== 'object') return;
        var els = settingsSliders();
        // set every value first so a save() during apply sees the complete set
        els.forEach(function (el) { if (el && (el.id in v)) el.value = v[el.id]; });
        // then apply each by replaying its input handler (all are side-effect-safe)
        els.forEach(function (el) { if (el && (el.id in v)) el.dispatchEvent(new Event('input', { bubbles: true })); });
    }

    function glowNode(node, color) {
        var s = node.__asd3d;
        if (!s) return;
        // rate-limit: don't re-arm while the previous burst is still bright, so a
        // node with many incoming links pulses gently instead of strobing
        if (s.haloStrength > 0.4) return;
        if (!s.halo) {
            var material = new THREE.SpriteMaterial({
                map: getHaloTexture(),
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending // flash of light, not an occluder
            });
            s.halo = new THREE.Sprite(material);
            s.halo.renderOrder = 20; // in FRONT of the card (11) so the burst is visible
            s.group.add(s.halo);
        }
        s.halo.material.color.set(color || '#7aa2ff');
        s.haloStrength = 1;
    }

    function checkParticleArrivals() {
        if (!particlesEnabled) return; // no photons => nothing can arrive
        var links = graph.graphData().links;
        for (var i = 0; i < links.length; i++) {
            var group = links[i].__photonsObj;
            if (!group || !group.children || !group.children.length) continue;
            var tgt = links[i].target;
            if (!tgt || typeof tgt !== 'object') continue;
            for (var j = 0; j < group.children.length; j++) {
                var photon = group.children[j];
                var p = photon.__progressRatio || 0;
                var prev = photon.__asd3dPrev;
                photon.__asd3dPrev = p;
                if (typeof prev === 'number' && p < prev - 0.5) {
                    // progress wrapped past 1: the particle reached the target
                    glowNode(tgt, links[i].color);
                }
            }
        }
    }

    // ---- level of detail (runs every frame) ----
    // Chips: perspective-scaled with readability clamp + aerial-perspective
    // dimming tied to the scene fog so far labels melt into the background.
    // Cards: the nearest few nodes cross-fade from chip into a property card.
    var lastLodTime = 0;

    function graphCentroid() {
        var cx = 0, cy = 0, cz = 0, k = 0;
        currentNodes.forEach(function (n) {
            if (typeof n.x === 'number') { cx += n.x; cy += n.y; cz += n.z; k++; }
        });
        k = k || 1;
        return { x: cx / k, y: cy / k, z: cz / k };
    }

    function recoverCamera() {
        // self-heal if the camera position ever goes non-finite (a degenerate
        // controls update can NaN it, which blanks the whole view)
        var c = graphCentroid();
        var cam = graph.camera();
        var ctr = graph.controls();
        cam.position.set(c.x, c.y + 20, c.z + 160);
        if (ctr && ctr.target) { ctr.target.set(c.x, c.y, c.z); ctr.update(); }
        camTween = null;
        noteInteract();
    }

    // ---- shoot-tip cones: give the directional arrows a botanical, living look ----
    // root->tip brightness ramp baked into the cone's vertex colours (multiplied by
    // each arrow's own tip colour, so it works whether geometries are shared or not)
    function applyConeGradient(geo) {
        if (!geo || geo.__asd3dGrad || !geo.attributes || !geo.attributes.position) return;
        var pos = geo.attributes.position, n = pos.count, i, y;
        var ymin = Infinity, ymax = -Infinity;
        for (i = 0; i < n; i++) { y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
        var span = (ymax - ymin) || 1;
        var col = new Float32Array(n * 3);
        for (i = 0; i < n; i++) {
            var t = (pos.getY(i) - ymin) / span;  // 0 = wide base (root), 1 = apex (shoot tip)
            var b = theme.cone.gradLo + (1 - theme.cone.gradLo) * t; // dark root -> full-tint tip
            col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.__asd3dGrad = true;
    }
    // ---- semantic balls: the descriptor grains drift inside their box using the
    // reference "centre-seeking" guidance -- each grain steers toward the box centre
    // and keeps its momentum, so the cluster swirls -- softly reflected off the walls.
    var GRAIN_ACCEL = 0.03, GRAIN_HALF = 0, grainTmp = null;
    function updateGrains(step) {
        if (reducedMotion || grainSpeed <= 0) return;
        if (!grainTmp) grainTmp = new THREE.Matrix4();
        var sp = grainSpeed, acc = GRAIN_ACCEL * step, half = BOX_SIZE * 0.46 * boxScale; // wall tracks box size
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s || !s.grains) return;
            var pos = s.grainPos, vel = s.grainVel, scl = s.grainScl, n = s.grains.count, i, j, x, y, z, d, gr;
            for (i = 0; i < n; i++) {
                j = i * 3; x = pos[j]; y = pos[j + 1]; z = pos[j + 2];
                d = Math.sqrt(x * x + y * y + z * z) || 1;   // unit direction toward the box centre
                vel[j] -= (x / d) * acc; vel[j + 1] -= (y / d) * acc; vel[j + 2] -= (z / d) * acc;
                x += vel[j] * sp * step; y += vel[j + 1] * sp * step; z += vel[j + 2] * sp * step;
                if (x > half) { x = half; vel[j] *= -0.6; } else if (x < -half) { x = -half; vel[j] *= -0.6; }
                if (y > half) { y = half; vel[j + 1] *= -0.6; } else if (y < -half) { y = -half; vel[j + 1] *= -0.6; }
                if (z > half) { z = half; vel[j + 2] *= -0.6; } else if (z < -half) { z = -half; vel[j + 2] *= -0.6; }
                pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
                gr = scl[i];
                grainTmp.makeScale(gr, gr, gr);
                grainTmp.setPosition(x, y, z);
                s.grains.setMatrixAt(i, grainTmp);
            }
            s.grains.instanceMatrix.needsUpdate = true;
        });
    }

    function updateArrows(now) {
        if (!graph) return;
        var links = graph.graphData().links;
        for (var i = 0; i < links.length; i++) {
            var arrow = links[i].__arrowObj;
            if (!arrow || !arrow.material) continue;
            var m = arrow.material;
            if (!m.__asd3dStyled) {
                m.transparent = true;
                m.opacity = theme.cone.opacity;              // (1) translucent: layered petals, label shows through
                if (!m.emissive) m.emissive = new THREE.Color();
                m.emissive.set(links[i].color);              // (2) self-glow in the tip colour
                applyConeGradient(arrow.geometry);           // (3) root->tip gradient
                m.vertexColors = true;
                m.__asd3dEmissiveBase = theme.cone.emissive;
                m.__asd3dPhase = (arrowSeq++ * 2.39996) % 6.28318;
                m.needsUpdate = true;
                m.__asd3dStyled = true;
            }
            if (reducedMotion) {                             // (4) shimmer: slow emissive breath, desynced
                m.emissiveIntensity = m.__asd3dEmissiveBase;
            } else {
                var sh = Math.sin(now * 0.0016 + m.__asd3dPhase); // ~3.9s period
                m.emissiveIntensity = m.__asd3dEmissiveBase * (0.7 + 0.3 * (sh * 0.5 + 0.5));
            }
        }
    }

    function updateLod() {
        if (!active || !graph) return;
        var now = performance.now();
        var dt = lastLodTime ? Math.min(0.1, (now - lastLodTime) / 1000) : 0.016;
        lastLodTime = now;
        var camPos0 = graph.camera().position;
        if (!isFinite(camPos0.x) || !isFinite(camPos0.y) || !isFinite(camPos0.z)) {
            recoverCamera();
            return;
        }
        if (introStart) {
            // opening dolly-in: ease the camera from far to the cluster while it
            // rotates; bail the moment a node fly or the user takes over
            if (camTween || lastInteractAt > introStart + 50) {
                introStart = 0;
            } else {
                var it = (now - introStart) / INTRO_DUR;
                if (it >= 1) { introStart = 0; } // hand off to the idle orbit next frame
                else {
                    var ie = 1 - Math.pow(1 - it, 3); // ease-out: decelerate into arrival
                    placeIntroCamera(introFrom + (introTo - introFrom) * ie, introAz + INTRO_SWEEP * ie);
                }
            }
        } else if (camTween) {
            applyCamTween(camTween.dur > 0 ? Math.min(1, (now - camTween.start) / camTween.dur) : 1);
        } else if (!reducedMotion && !cardOpenId && (now - lastInteractAt) > 1400) {
            // always-on gentle drift: orbit the look-at point (the focused node,
            // if any) for a floating feel; paused while a card is open (reading)
            // and right after the user acts. The NaN guard above self-heals if a
            // controls update ever degenerates the camera.
            var ctr = graph.controls();
            var cp = graph.camera().position;
            if (ctr && ctr.target) {
                var ox = cp.x - ctr.target.x, oz = cp.z - ctr.target.z;
                if (ox * ox + oz * oz > 1) {
                    var ang = dt * idleOrbitSpeed;
                    var csA = Math.cos(ang), snA = Math.sin(ang);
                    cp.x = ctr.target.x + ox * csA - oz * snA;
                    cp.z = ctr.target.z + ox * snA + oz * csA;
                    ctr.update();
                }
            }
        }
        try { checkParticleArrivals(); } catch (e) {}
        try { updateArrows(now); } catch (e) {}
        try { updateGrains(Math.min(dt * 60, 3)); } catch (e) {}
        // very slow starfield rotation for a subtle drift against the camera
        if (starField && !reducedMotion) {
            try {
                starField.rotation.y = now * 0.00003;
                starField.rotation.x = now * 0.00002;
            } catch (e) {}
        }
        var cam = graph.camera().position;
        var p11 = projectionTerm();
        var vh = window.innerHeight || 900;
        var fog = graph.scene().fog;
        // camera distance to the cluster centre -- both the fog and the depth fade are
        // made RELATIVE to it so pulling the camera back can't fade the whole graph to
        // the background. The fog band is bracketed around the camera distance when the
        // slider range would otherwise leave the cluster fully fogged ("visibility floor").
        var cdx = cam.x - introCx, cdy = cam.y - introCy, cdz = cam.z - introCz;
        var camDist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 1;
        if (fog && baseFogFar) {
            var bn = baseFogNear * fogScale, bf = baseFogFar * fogScale;
            fog.near = Math.max(bn, camDist - sceneSpan * 0.5);
            fog.far = Math.max(bf, camDist + sceneSpan * 1.35);
        }
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s || typeof node.x !== 'number') return;
            var dx = cam.x - node.x;
            var dy = cam.y - node.y;
            var dz = cam.z - node.z;
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            var pxNatural = CHIP_WORLD_H * p11 * vh / (2 * dist);
            var px = Math.max(CHIP_PX_MIN, Math.min(CHIP_PX_MAX, pxNatural));
            var sy = 2 * px / (p11 * vh);
            s.chip.scale.set(sy * s.chip.userData.aspect, sy, 1);
            // aerial perspective relative to the centre: a node only fades when it is
            // FARTHER than the cluster centre, so zooming out (all nodes ~equidistant)
            // keeps everything visible instead of dimming the whole graph to nothing.
            var rel = (dist - camDist) / Math.max(sceneSpan, 1); // <0 nearer, >0 farther
            node.__asd3dDim = Math.max(0.35, Math.min(1, 1 - Math.max(0, rel) * 0.55));
        });
        // cards open ONLY on an explicit click (cardOpenId), so focusing a node
        // shows its botanical form rather than instantly hiding it behind a card
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s) return;
            var open = (node.id === cardOpenId);
            if (open) ensureCard(node);
            // smooth cross-fade between the box/label and the card (snappy in, ~1s out)
            // so a card doesn't pop in/out when focusing or navigating away
            if (s.cardFade === undefined) s.cardFade = 0;
            var fadeTarget = open ? 1 : 0;
            if (reducedMotion) s.cardFade = fadeTarget;
            else s.cardFade += (fadeTarget - s.cardFade) * Math.min(1, dt * (open ? CARD_FADE_IN : CARD_FADE_OUT));
            var cf = s.cardFade;
            if (s.card) {
                if (open && !s.cardVisPrev) s.cardShownAt = now; // just unfurled
                s.cardVisPrev = open;
                s.card.material.opacity = cf;
                s.card.visible = cf > 0.02;
                if (cf > 0.02 && s.cardBaseScale) {
                    // bud unfurl: ease scale 0.9 -> 1.0 as the card opens
                    var unf = s.cardShownAt ? Math.min(1, (now - s.cardShownAt) / 280) : 1;
                    var k = 0.9 + 0.1 * easeInOut(unf);
                    // self-loop feedback: a single smooth bounce so an action that
                    // returns to this same state still visibly reacts to the click
                    if (cardPulseAt) {
                        var pt = now - cardPulseAt;
                        if (pt >= 0 && pt < 540) k *= 1 + 0.14 * Math.sin(pt / 540 * Math.PI);
                        else cardPulseAt = 0;
                    }
                    s.card.scale.set(s.cardBaseScale.x * cardScale * k, s.cardBaseScale.y * cardScale * k, 1);
                }
                // evict a closed card's texture once it has fully faded out
                if (!open && cf < 0.02) {
                    s.cardIdle = (s.cardIdle || 0) + 1;
                    if (s.cardIdle > 60) dropCard(s);
                } else {
                    s.cardIdle = 0;
                }
            }
            s.chip.material.opacity = (1 - cf) * (node.__asd3dDim || 1);
            s.chip.visible = cf < 0.98;
            if (s.body) {
                // box fades back in as the card fades out (and vice versa)
                s.body.visible = cf < 0.98;
                var bd = node.__asd3dDim || 1;
                if (s.bodyMat) s.bodyMat.opacity = BODY_FACE_OPACITY * boxOpacity * bd * (1 - cf);
                if (s.bodyEdgeMat) s.bodyEdgeMat.opacity = BODY_EDGE_OPACITY * boxOpacity * bd * (1 - cf);
            }
            if (s.halo) {
                if (s.haloStrength > 0) {
                    s.haloStrength = Math.max(0, s.haloStrength - dt * 2.2); // quick, light tap
                    // a soft pulse sized to the card (not enveloping past it), so
                    // it reads as a gentle absorption rather than a hard impact
                    var base = (open && s.cardSize)
                        ? Math.max(s.cardSize.w, s.cardSize.h) / SPRITE_SCALE * 0.72
                        : CHIP_WORLD_H * 2.8;
                    var sc = base * (0.92 + 0.14 * s.haloStrength);
                    s.halo.scale.set(sc, sc, 1);
                    s.halo.material.opacity = s.haloStrength * 0.4;
                    s.halo.visible = s.haloStrength > 0.02;
                } else if (s.halo.visible) {
                    s.halo.visible = false;
                }
            }
            // living glow: a slow breath in size + brightness so the garden feels
            // alive; phase-offset per node, dimmed by aerial perspective, frozen
            // when the user prefers reduced motion
            if (s.bloom && s.bloomBase) {
                var bdim = node.__asd3dDim || 1;
                var ob = s.bloomBase * orbScale; // Orb size slider
                if (reducedMotion) {
                    s.bloom.scale.set(ob, ob, 1);
                    s.bloom.material.opacity = s.bloomOpacity * bloomBright * bdim;
                } else {
                    var breath = Math.sin(now * 0.0015 + s.bloomPhase); // ~4.2s period
                    var bsc = ob * (1 + 0.06 * breath);
                    s.bloom.scale.set(bsc, bsc, 1);
                    s.bloom.material.opacity = s.bloomOpacity * bloomBright * (0.82 + 0.18 * (breath * 0.5 + 0.5)) * bdim;
                }
            }
        });
    }

    function startLod() {
        stopLod();
        lastLodTime = 0;
        var loop = function () {
            updateLod();
            lodTimer = window.requestAnimationFrame(loop);
        };
        lodTimer = window.requestAnimationFrame(loop);
    }

    function stopLod() {
        if (lodTimer) {
            window.cancelAnimationFrame(lodTimer);
            lodTimer = null;
        }
    }

    // ---- tooltips ----
    function nodeTooltip(node) {
        var text = node.id + (node.title && node.title !== node.id ? ' \\u2014 ' + node.title : '');
        return escapeHtmlLabel(text);
    }

    function linkTooltip(link) {
        var label = labelModeIs('title') ? link.transTitle : link.transId;
        var html = '<div style="text-align:left">' +
            '<span style="color:' + link.color + '">\\u25A0</span> <b>' + escapeHtmlLabel(label) + '</b>';
        if (link.transType) {
            html += ' <span style="opacity:0.75">(' + escapeHtmlLabel(link.transType) + ')</span>';
        }
        var props = link.props || [];
        props.slice(0, 8).forEach(function (p) {
            html += '<br>\\u2022 ' + escapeHtmlLabel(labelModeIs('title') ? (p.title || p.id) : p.id);
        });
        if (props.length > 8) {
            html += '<br>+ ' + (props.length - 8) + ' more';
        }
        return html + '</div>';
    }

    // ---- selection / camera ----
    var nodeById = {};

    // Pin the focused node so the still-cooling force simulation can't drift it
    // out from under the camera mid-flight (which left the card off to the side).
    // Clear every pin first so stray pins can never accumulate and freeze the layout.
    function unpinNode() {
        currentNodes.forEach(function (n) {
            if (typeof n.fx === 'number') { n.fx = undefined; n.fy = undefined; n.fz = undefined; }
        });
    }

    function pinNode(node) {
        unpinNode();
        if (!node || typeof node.x !== 'number') return;
        node.fx = node.x; node.fy = node.y; node.fz = node.z;
    }

    // Mirror the in-card transition buttons as real DOM buttons in the info
    // panel: keyboard/screen-reader operable, and a reliable click path that
    // does not depend on raycasting the (possibly faded/overlapped) card sprite.
    function populateInfoActions(node) {
        infoActions.textContent = '';
        var actions = node.actions || [];
        actions.forEach(function (a) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'asd3d-action';
            btn.style.borderColor = a.color;
            var label = labelModeIs('title') ? (a.transTitle || a.transId) : a.transId;
            var tgt = nodeById[a.targetId];
            var tgtLabel = tgt ? (labelModeIs('title') ? (tgt.title || tgt.id) : tgt.id) : a.targetId;
            btn.textContent = '\\u25B8 ' + label;
            btn.setAttribute('aria-label', (a.transType || 'transition') + ' ' + label + ' to ' + tgtLabel);
            btn.addEventListener('click', function () {
                // springy press feedback. It visibly plays for a self-loop click
                // (the camera doesn't move, so this is the only cue alongside the
                // node glow); on a navigation click the camera flight is the cue and
                // this panel is immediately rebuilt for the destination node.
                btn.classList.remove('asd3d-pop');
                void btn.offsetWidth; // reflow so the animation restarts on rapid clicks
                btn.classList.add('asd3d-pop');
                triggerTransition(a);
            });
            btn.addEventListener('animationend', function () { btn.classList.remove('asd3d-pop'); });
            infoActions.appendChild(btn);
        });
    }

    // ---- crafted camera flight ----
    // A transition click should feel like travelling along the edge, not a flat
    // dolly: the camera swings along a gentle arc and lands at an angle that
    // shows the edge it just traversed. Driven frame-by-frame from updateLod.
    var FLY_DUR = 1150;
    var FLY_DIST = 170;      // focus: settle far back to show the node AND its neighbourhood spread
    var CARD_READ_DIST = 78; // when a card opens, dive closer so the (world-sized) card stays legible
    var cardScale = 1.15;    // card billboard size multiplier (Card size slider), applied per-frame
    var CARD_FADE_IN = 7, CARD_FADE_OUT = 3; // exp lerp rates: snappy appear, ~1s smooth fade-out
    var camTween = null;

    function easeInOut(u) {
        return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    function flyToNode(node, fromNode, dist) {
        dist = dist || FLY_DIST;
        if (typeof node.x !== 'number' || !graph) return;
        var cam = graph.camera();
        var controls = graph.controls();
        var T1 = new THREE.Vector3(node.x, node.y, node.z);
        var T0 = (controls && controls.target) ? controls.target.clone() : T1.clone();
        var P0 = cam.position.clone();

        // base approach = keep the current viewing direction (continuity)
        var base = P0.clone().sub(T1);
        if (base.lengthSq() < 1e-6) base.set(0, 0, 1);
        base.normalize();

        var approach = base;
        if (fromNode && typeof fromNode.x === 'number') {
            // reframe toward a side-on view of the traversed edge so it stays visible
            var edge = new THREE.Vector3(node.x - fromNode.x, node.y - fromNode.y, node.z - fromNode.z);
            if (edge.lengthSq() > 1e-6) {
                edge.normalize();
                var worldUp = new THREE.Vector3(0, 1, 0);
                var side = new THREE.Vector3().crossVectors(edge, worldUp);
                if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
                side.normalize();
                var up2 = new THREE.Vector3().crossVectors(side, edge).normalize();
                // keep the camera on the same side it is already on (no jarring flip)
                if (side.dot(base) < 0) side.multiplyScalar(-1);
                var sideView = side.multiplyScalar(0.8).add(up2.multiplyScalar(0.42)).add(edge.multiplyScalar(0.25)).normalize();
                approach = base.clone().multiplyScalar(0.5).add(sideView.multiplyScalar(0.5)).normalize();
            }
        }

        // nudge the orbit centre slightly off the node, in the view plane, so the
        // focused label is NOT pinned to the exact pivot. With pivot == label the
        // idle orbit spins the world while the label sits dead-centre and looks
        // frozen; a small offset makes the label itself drift gently as it floats.
        var rt = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), approach);
        if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0);
        rt.normalize();
        var upv = new THREE.Vector3().crossVectors(approach, rt).normalize();
        T1.add(rt.multiplyScalar(dist * 0.07)).add(upv.multiplyScalar(dist * 0.045));

        var P1 = T1.clone().add(approach.multiplyScalar(dist));

        // arc control point: lift the midpoint perpendicular to travel for a swing
        var mid = P0.clone().add(P1).multiplyScalar(0.5);
        var travel = P1.clone().sub(P0);
        var len = travel.length() || 1;
        var perp = new THREE.Vector3().crossVectors(travel.clone().normalize(), new THREE.Vector3(0, 1, 0));
        if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
        perp.normalize();
        var lift = Math.min(len * 0.28, 70);
        var ctrl = mid.add(perp.multiplyScalar(lift * 0.45)).add(new THREE.Vector3(0, lift * 0.6, 0));

        camTween = { P0: P0, ctrl: ctrl, P1: P1, T0: T0, T1: T1, start: performance.now(), dur: reducedMotion ? 0 : FLY_DUR };
        if (camTween.dur === 0) applyCamTween(1);
    }

    function applyCamTween(u) {
        if (!camTween || !graph) return;
        var e = easeInOut(u);
        var w0 = (1 - e) * (1 - e), w1 = 2 * (1 - e) * e, w2 = e * e;
        var c = camTween;
        var cam = graph.camera();
        cam.position.set(
            w0 * c.P0.x + w1 * c.ctrl.x + w2 * c.P1.x,
            w0 * c.P0.y + w1 * c.ctrl.y + w2 * c.P1.y,
            w0 * c.P0.z + w1 * c.ctrl.z + w2 * c.P1.z
        );
        var tx = c.T0.x + (c.T1.x - c.T0.x) * e;
        var ty = c.T0.y + (c.T1.y - c.T0.y) * e;
        var tz = c.T0.z + (c.T1.z - c.T0.z) * e;
        var controls = graph.controls();
        if (controls && controls.target) {
            controls.target.set(tx, ty, tz);
            controls.update();
        } else {
            cam.lookAt(tx, ty, tz);
        }
        if (u >= 1) { camTween = null; noteInteract(); } // settle before the idle orbit resumes
    }

    function selectNode(node, fromNode) {
        selectedNodeId = node.id;
        cardOpenId = '';   // focus shows the node's form; the card opens on a second click
        noteInteract();
        pinNode(node); // hold it still so the camera lands centered
        infoTitle.textContent = node.id + (node.title && node.title !== node.id ? ' \\u2014 ' + node.title : '');
        populateInfoActions(node);
        infoPanel.classList.add('show');
        flyToNode(node, fromNode);
    }

    function clearSelection() {
        selectedNodeId = '';
        cardOpenId = '';
        unpinNode();
        infoPanel.classList.remove('show');
        infoActions.textContent = '';
    }

    function exitToTable(id) {
        close3D();
        if (id) {
            setDescriptorHash(id);
            scrollToDescriptor(id);
        }
    }

    // ---- status ----
    function showStatus(text, withSpinner) {
        statusText.textContent = text;
        spinnerEl.style.display = withSpinner ? '' : 'none';
        statusEl.hidden = false;
    }

    function hideStatus() {
        statusEl.hidden = true;
    }

    // ---- data refresh ----
    function tagKey() {
        return getSelectedTags().slice().sort().join(',');
    }

    function disposeAllNodeSprites() {
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s) return;
            disposeSprite(s.chip);
            dropCard(s);
            if (s.halo) {
                s.group.remove(s.halo);
                s.halo.material.dispose(); // texture is shared, keep it
                s.halo = null;
            }
            if (s.bloom) {
                s.group.remove(s.bloom);
                s.bloom.material.dispose(); // shared texture kept
                s.bloom = null;
            }
            if (s.body) {
                s.group.remove(s.body);
                if (s.bodyMat) s.bodyMat.dispose();
                if (s.bodyEdgeMat) s.bodyEdgeMat.dispose();
                s.body = null; // shared box geometry + edges kept
            }
            if (s.grains) {
                s.group.remove(s.grains);
                s.grains.dispose(); // instance buffers; shared geometry + material kept
                s.grains = null;
            }
            node.__asd3d = null;
        });
    }

    // ---- card action buttons: raycast the click into the card texture ----
    var raycaster = null;
    var pointerNdc = null;
    var pressedAt = null;
    var cardClickAt = 0; // when a card button last fired, to swallow the trailing node/bg click

    function hitRect(px, py, r) {
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    // Raycast the pointer into the visible cards and return the property or
    // button under it. Walks hits nearest-first so a transparent gap on a front
    // card doesn't swallow an item on the card behind it.
    function pickCardItem(cx, cy, includeProps) {
        if (!raycaster || !graph) return null;
        var rect = canvasEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        var cards = [];
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            // only the actively-open card is interactive (not one fading out after a move)
            if (node.id === cardOpenId && s && s.card && s.card.visible && s.card.material.opacity > 0.1 && s.cardSize) {
                s.card.__asd3dNode = node;
                cards.push(s.card);
            }
        });
        if (!cards.length) return null;
        pointerNdc.set(
            ((cx - rect.left) / rect.width) * 2 - 1,
            -((cy - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerNdc, graph.camera());
        var hits = raycaster.intersectObjects(cards, false);
        var onCard = false;
        for (var h = 0; h < hits.length; h++) {
            if (!hits[h].uv) continue;
            onCard = true; // the pointer is over a card (even if not on an item)
            var node = hits[h].object.__asd3dNode;
            var s = node.__asd3d;
            if (!s || !s.cardSize) continue;
            var px = hits[h].uv.x * s.cardSize.w;
            var py = (1 - hits[h].uv.y) * s.cardSize.h;
            var i;
            if (s.cardClose && hitRect(px, py, s.cardClose)) return { type: 'close', node: node };
            if (s.cardButtons) {
                for (i = 0; i < s.cardButtons.length; i++) {
                    if (hitRect(px, py, s.cardButtons[i])) return { type: 'button', item: s.cardButtons[i], node: node };
                }
            }
            if (includeProps && s.cardProps) {
                for (i = 0; i < s.cardProps.length; i++) {
                    if (hitRect(px, py, s.cardProps[i])) return { type: 'prop', item: s.cardProps[i], node: node };
                }
            }
        }
        // over a card but not on a button/prop (header, padding, gaps): still a
        // card hit, so the caller can swallow the click and keep the card open
        return onCard ? { type: 'card' } : null;
    }

    function pickCardButton(cx, cy) {
        var r = pickCardItem(cx, cy, false);
        return (r && r.type === 'button') ? r.item : null;
    }

    function showCardTip(cx, cy, hit) {
        if (!cardTip) return;
        var it = hit.item;
        var title, idLine;
        if (hit.type === 'prop') {
            title = it.title || it.id;
            idLine = (it.title && it.title !== it.id) ? it.id : '';
        } else {
            title = it.title || it.transId;
            idLine = (it.title && it.title !== it.transId) ? it.transId : '';
            idLine = (idLine ? idLine + ' ' : '') + '\\u2192 ' + it.targetId;
        }
        cardTip.innerHTML = '<b>' + escapeHtmlLabel(title) + '</b>' +
            (idLine ? '<span class="asd3d-tip-sub">' + escapeHtmlLabel(idLine) + '</span>' : '');
        cardTip.style.display = 'block';
        var tw = cardTip.offsetWidth, th = cardTip.offsetHeight;
        var x = Math.min(cx + 16, window.innerWidth - tw - 8);
        var y = Math.min(cy + 16, window.innerHeight - th - 8);
        cardTip.style.left = x + 'px';
        cardTip.style.top = y + 'px';
    }

    function hideCardTip() {
        if (cardTip) cardTip.style.display = 'none';
    }

    function triggerTransition(btn) {
        var target = nodeById[btn.targetId];
        if (!target) return;
        var from = nodeById[selectedNodeId];
        var wasCardMode = !!cardOpenId; // were we navigating with a card open?
        // self-loop: the action returns to the SAME state, so the camera won't
        // move and the destination glow would land behind the open card. Give an
        // unmistakable in-place reaction instead: bounce the card and glow now.
        var selfLoop = target.id === selectedNodeId;
        if (selfLoop) {
            cardPulseAt = performance.now();
            window.setTimeout(function () { glowNode(target, btn.color); }, reducedMotion ? 30 : 90);
            return; // stay put — no fly, keep the card exactly where it is
        }
        selectNode(target, from);       // selectNode resets cardOpenId to '' and flies to the spread distance
        // continuity: if we moved from an open card, land with the card open too,
        // and at the closer card-reading distance so the card stays legible
        if (wasCardMode) { cardOpenId = target.id; flyToNode(target, from, CARD_READ_DIST); }
        // glow the destination as the flight lands
        window.setTimeout(function () { glowNode(target, btn.color); }, reducedMotion ? 50 : FLY_DUR);
    }

    var hoverPending = false;

    var pressedOnCard = false;

    function setupCardButtonEvents() {
        raycaster = new THREE.Raycaster();
        pointerNdc = new THREE.Vector2();
        canvasEl.addEventListener('pointerdown', function (e) {
            pressedAt = { x: e.clientX, y: e.clientY };
            camTween = null; // user is taking control of the camera
            noteInteract(); // pause the idle orbit while the user acts
            hideCardTip();
            // If the press starts on a card, OWN the whole gesture: stop it
            // reaching the controls / force-graph so the card click can never be
            // turned into a node-click (which re-selected) or background-click
            // (which cleared) — those made the card revert or just vanish.
            pressedOnCard = !!pickCardItem(e.clientX, e.clientY, true);
            if (pressedOnCard) e.stopPropagation();
        }, true);
        canvasEl.addEventListener('wheel', noteInteract, { passive: true, capture: true });
        canvasEl.addEventListener('pointerup', function (e) {
            if (!active || !pressedAt) return;
            var moved = Math.abs(e.clientX - pressedAt.x) + Math.abs(e.clientY - pressedAt.y);
            var wasCard = pressedOnCard;
            pressedAt = null; pressedOnCard = false;
            if (!wasCard) return; // a node/background gesture — let force-graph handle it
            e.stopPropagation();
            cardClickAt = Date.now();
            if (moved > 6) return; // it was a drag over the card, not a click
            var picked = pickCardItem(e.clientX, e.clientY, true);
            if (picked && picked.type === 'button') triggerTransition(picked.item);
            else if (picked && picked.type === 'close') { cardOpenId = ''; noteInteract(); } // x button
            // a click on the card body does nothing (the card stays open)
        }, true);
        // block the trailing 'click' of a card gesture from reaching force-graph
        canvasEl.addEventListener('click', function (e) {
            if (Date.now() - cardClickAt < 350) e.stopPropagation();
        }, true);
        // hover: cursor affordance for buttons + a tooltip showing the title of
        // whatever property/transition is under the pointer. Coalesced to one
        // rAF per move burst so high-frequency events don't each pay a raycast.
        canvasEl.addEventListener('pointermove', function (e) {
            if (!active || !graph) return;
            if (e.buttons) { noteInteract(); return; } // dragging: keep the orbit paused
            if (hoverPending) return;
            hoverPending = true;
            var cx = e.clientX, cy = e.clientY;
            window.requestAnimationFrame(function () {
                hoverPending = false;
                if (!active) return;
                var hit = pickCardItem(cx, cy, true);
                canvasEl.style.cursor = (hit && (hit.type === 'button' || hit.type === 'close')) ? 'pointer' : '';
                if (hit && (hit.type === 'button' || hit.type === 'prop')) showCardTip(cx, cy, hit);
                else hideCardTip();
            });
        }, true);
        canvasEl.addEventListener('pointerleave', hideCardTip, true);
    }

    // ---- semantic Z-axis: depth-from-entry layering ----
    // The entry state is the first state descriptor in the ALPS profile order
    // (ALPS convention: the author lists the entry state first). We BFS from it
    // and fix each node's Z to its depth, so the 3D space reads as "how deep
    // into the app you are." Cycles are handled naturally by BFS (a node keeps
    // the depth at which it was first reached). Self-loops are ignored.
    var DEPTH_LEVEL_DISTANCE = 80;
    function assignDepthLevels(model, descriptors) {
        var nodeIds = {};
        model.nodes.forEach(function (n) { nodeIds[n.id] = true; });
        // find the entry state: first top-level descriptor that is a diagram node
        var entryId = null;
        (descriptors || []).forEach(function (d) {
            if (entryId || !d.id) return;
            if (nodeIds[d.id]) entryId = d.id;
        });
        if (!entryId && model.nodes.length > 0) entryId = model.nodes[0].id;
        // BFS from the entry state
        var depth = {};
        var queue = [];
        depth[entryId] = 0;
        queue.push(entryId);
        // adjacency: source -> [target states]
        var adj = {};
        model.links.forEach(function (l) {
            var s = typeof l.source === 'object' ? l.source.id : l.source;
            var t = typeof l.target === 'object' ? l.target.id : l.target;
            if (s === t) return; // skip self-loops
            if (!adj[s]) adj[s] = [];
            adj[s].push(t);
        });
        while (queue.length) {
            var cur = queue.shift();
            var neighbors = adj[cur] || [];
            for (var i = 0; i < neighbors.length; i++) {
                var nb = neighbors[i];
                if (depth[nb] === undefined && nodeIds[nb]) {
                    depth[nb] = depth[cur] + 1;
                    queue.push(nb);
                }
            }
        }
        // assign fz: deeper states go further back (negative Z = away from camera)
        model.nodes.forEach(function (n) {
            var d = depth[n.id] !== undefined ? depth[n.id] : 0;
            n.fz = -d * DEPTH_LEVEL_DISTANCE;
            n.z = n.fz; // start at the fixed position
        });
    }

    function refreshGraphData(force) {
        if (!graph) return;
        var key = tagKey();
        if (!force && key === lastTagKey) return;
        lastTagKey = key;
        lastLabelMode = getCurrentLabelMode();
        var filterIds = getSelectedTags().length > 0 ? getSelectedDescriptorIds() : null;
        var model = buildGraphModel(filterIds);
        disposeAllNodeSprites();
        CHIP_PX_MIN = model.nodes.length > 400 ? 10 : 12;
        currentNodes = model.nodes;
        nodeById = {};
        model.nodes.forEach(function (n) { nodeById[n.id] = n; });
        clearSelection();
        fitDone = false;
        var data = window.alpsData || {};
        var descriptors = (data.alps && data.alps.descriptor) || [];
        assignDepthLevels(model, descriptors);
        graph.graphData(model);
        statsEl.textContent = model.nodes.length + ' states \\u00b7 ' + model.links.length + ' transitions';
        particlesEnabled = !reducedMotion && model.links.length > 0 && model.links.length <= 400;
        graph.linkDirectionalParticles(particlesEnabled ? 2 : 0);
        syncSettingsState();
        if (model.nodes.length === 0) {
            showStatus('No diagram nodes match the selected tags.', false);
        } else {
            hideStatus();
        }
    }

    function refreshLabels() {
        if (!graph) return;
        var mode = getCurrentLabelMode();
        if (mode === lastLabelMode) return;
        lastLabelMode = mode;
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s) return;
            var canvas = drawChipCanvas(getNodeLabel(node));
            var old = s.chip.material.map;
            s.chip.material.map = makeTexture(canvas);
            s.chip.material.needsUpdate = true;
            s.chip.userData.aspect = canvas.width / canvas.height;
            applyChipScale(s.chip);
            if (old) old.dispose();
            dropCard(s);
        });
        // re-render the DOM action buttons for the selected node in the new mode
        var sel = nodeById[selectedNodeId];
        if (sel) populateInfoActions(sel);
    }

    // ---- graph init ----
    // ---- opening dolly-in: rather than snapping to a far fit, start the camera way
    // out and slip it slowly in toward the cluster while gently rotating, then hand
    // off to the idle orbit. Cancelled the instant the user takes control.
    var introStart = 0, introFrom = 0, introTo = 0, introAz = 0;
    var introCx = 0, introCy = 0, introCz = 0;
    var sceneSpan = 600; // graph extent; updateLod keeps fog + depth cues relative to it
    var INTRO_DUR = 7000, INTRO_EL = 0.42, INTRO_SWEEP = 0.9;
    function placeIntroCamera(dist, az) {
        var cam = graph.camera(), ctr = graph.controls();
        var ce = Math.cos(INTRO_EL), se = Math.sin(INTRO_EL);
        cam.position.set(introCx + ce * Math.sin(az) * dist, introCy + se * dist, introCz + ce * Math.cos(az) * dist);
        if (ctr && ctr.target) { ctr.target.set(introCx, introCy, introCz); ctr.update(); }
        else cam.lookAt(introCx, introCy, introCz);
    }
    function applySceneExtents() {
        try {
            if (!currentNodes.length) return;
            var bbox = graph.getGraphBbox();
            var span = 600;
            if (bbox) {
                span = Math.max(bbox.x[1] - bbox.x[0], bbox.y[1] - bbox.y[0], bbox.z[1] - bbox.z[0], 120);
                introCx = (bbox.x[0] + bbox.x[1]) / 2;
                introCy = (bbox.y[0] + bbox.y[1]) / 2;
                introCz = (bbox.z[0] + bbox.z[1]) / 2;
                var fog = graph.scene().fog;
                if (fog) { baseFogNear = span * 1.1; baseFogFar = span * 3.2; applyFog(); }
            } else {
                var c = graphCentroid(); introCx = c.x; introCy = c.y; introCz = c.z;
            }
            sceneSpan = span; // used by updateLod to keep fog/depth relative to zoom
            defogLinks(); // keep link stems visible at distance
            asd3dRestoreSettings(); // replay saved slider values once, now that nodes/fog/star texture exist
            var fit = span * 1.15;
            introFrom = fit * 1.7;   // start a bit beyond the fit
            introTo = fit * 0.78;    // arrive amongst the cluster
            var camp = graph.camera().position;
            introAz = Math.atan2(camp.x - introCx, camp.z - introCz); // continue from the current heading
            if (reducedMotion) { placeIntroCamera(introTo, introAz); introStart = 0; return; }
            placeIntroCamera(introFrom, introAz); // jump out to the far start, then ease in
            introStart = performance.now();
        } catch (e) {}
    }

    function initGraph() {
        if (graph) return;
        // trackball controls: our custom arc fly (applyCamTween) drives the camera
        // position directly each frame, which integrates cleanly with trackball
        graph = ForceGraph3D({ controlType: 'trackball' })(canvasEl)
            .backgroundColor(BG_COLOR)
            .showNavInfo(false)
            .width(window.innerWidth)
            .height(window.innerHeight)
            .nodeThreeObject(makeNodeObject)
            .nodeLabel(nodeTooltip)
            // stem: dark root colour, translucent so overlaps read as foliage
            .linkColor(function (l) { return l.stemColor; })
            .linkOpacity(0.6)
            .linkWidth(0.8)
            .linkCurvature(function (l) { return l.curvature; }) // keep the vine curls / self-loops
            .linkCurveRotation(function (l) { return l.rotation; })
            // shoot tip: a long pointed cone in the bright tip colour replaces the
            // old stubby arrowhead, so the stem ends in a new-shoot point
            .linkDirectionalArrowLength(7)
            .linkDirectionalArrowRelPos(1) // tips reach the node (label stays readable via the always-on-top chip)
            .linkDirectionalArrowColor(function (l) { return l.color; })
            .linkDirectionalParticleColor(function (l) { return l.color; })
            .linkDirectionalParticleWidth(0.45)
            .linkDirectionalParticleSpeed(particleSpeed)
            .linkLabel(linkTooltip)
            .onNodeClick(function (n, ev) {
                // swallow the trailing click of a card-button gesture, which would
                // otherwise re-select the source node and undo the transition
                if (Date.now() - cardClickAt < 350) return;
                if (ev && pickCardButton(ev.clientX, ev.clientY)) return;
                // first click focuses (card stays closed, form visible);
                // clicking the already-focused node OPENS its card. We never close
                // on node-click (that made a near-miss on a button drop the card,
                // and double-fired clicks open-then-close it) — close via the
                // info-panel x, the background, or by focusing another node.
                if (n.id !== selectedNodeId) selectNode(n);
                else if (cardOpenId !== n.id) { cardOpenId = n.id; noteInteract(); flyToNode(n, null, CARD_READ_DIST); }
            })
            .onNodeRightClick(function (node) { exitToTable(node.id); })
            .onBackgroundClick(function (ev) {
                if (Date.now() - cardClickAt < 350) return; // trailing click of a card-button gesture
                if (ev && pickCardButton(ev.clientX, ev.clientY)) return; // a card button got it
                // a click off an open card just dismisses the card (keeps the node
                // focused); a second background click then clears the selection
                if (cardOpenId) { cardOpenId = ''; noteInteract(); return; }
                clearSelection();
            })
            .onEngineStop(function () {
                if (fitDone) return;
                fitDone = true;
                applySceneExtents();
            });
        if (reducedMotion) {
            graph.warmupTicks(120).cooldownTicks(0);
        } else {
            graph.cooldownTime(5000);
        }
        window.asd3dGraph = graph; // debug / power-user handle
        setupCardButtonEvents();
        try {
            // clamp zoom so a stray gesture can't fly the camera into a node and
            // blow a card up to fill the screen; tame the (sensitive) zoom speed
            var ctrls = graph.controls();
            if (ctrls) {
                ctrls.minDistance = 45;
                ctrls.maxDistance = 5000;
                ctrls.zoomSpeed = 0.7;
                ctrls.staticMoving = true; // no inertia drift; predictable with the idle orbit
            }
        } catch (e) {}
        try {
            graph.d3Force('link').distance(90);
            graph.d3Force('charge').strength(-300);
        } catch (e) {}
        try {
            baseFogNear = theme.fog.near; baseFogFar = theme.fog.far;
            graph.scene().fog = new THREE.Fog(new THREE.Color(BG_COLOR), theme.fog.near, theme.fog.far);
            applyFog();
            if (theme.starfield) addStarfield(graph.scene(), theme.starfield);
        } catch (e) {}
    }

    // deep-space backdrop: a distant shell of unfogged points far beyond the graph.
    // Stars sit at the outermost depth so they appear tiny and never clip through fog.
    function addStarfield(scene, count) {
        var pos = new Float32Array(count * 3);
        var col = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2;
            var r = 1400 + Math.random() * 1500, s = Math.sqrt(1 - u * u);
            pos[i * 3] = r * s * Math.cos(t);
            pos[i * 3 + 1] = r * u * 0.6;
            pos[i * 3 + 2] = r * s * Math.sin(t);
            // subtle colour variation: mostly cool white with occasional warm tints
            var base = 0.7 + Math.random() * 0.3;
            col[i * 3] = base;
            col[i * 3 + 1] = base * (0.82 + Math.random() * 0.18);
            col[i * 3 + 2] = 0.82 + Math.random() * 0.18;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        var mat = new THREE.PointsMaterial({
            size: 2.0, sizeAttenuation: true, vertexColors: true,
            transparent: true, opacity: 0.9, depthWrite: false, fog: false
        });
        starField = new THREE.Points(geo, mat);
        starField.renderOrder = -1;
        scene.add(starField);
    }

    // ---- tag bar (mirrors the 2D tag checkboxes; selected tags filter the 3D subgraph) ----
    function findMainTagCheckbox(tag) {
        return Array.from(document.querySelectorAll('.tag-trigger-checkbox')).find(function (el) {
            return el.getAttribute('data-tag') === tag;
        });
    }

    function buildTagBar() {
        if (tagBarBuilt) return;
        tagBarBuilt = true;
        var tags = Object.keys(tagDescriptorMap);
        if (!tags.length) return;
        var lbl = document.createElement('span');
        lbl.className = 'asd3d-taglabel';
        lbl.textContent = 'Tags:';
        tagbar.appendChild(lbl);
        tags.forEach(function (tag) {
            var wrap = document.createElement('label');
            wrap.className = 'asd3d-tag';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.setAttribute('data-tag', tag);
            var txt = document.createElement('span');
            txt.textContent = tag;
            wrap.appendChild(cb);
            wrap.appendChild(txt);
            tagbar.appendChild(wrap);
            cb.addEventListener('change', function () {
                wrap.classList.toggle('checked', cb.checked);
                var main = findMainTagCheckbox(tag);
                if (main && main.checked !== cb.checked) {
                    main.checked = cb.checked;
                    main.dispatchEvent(new Event('change'));
                }
                refreshGraphData(false);
            });
        });
        Array.from(document.querySelectorAll('.tag-trigger-checkbox')).forEach(function (cb) {
            cb.addEventListener('change', function () {
                if (!active) return;
                syncTagBar();
                refreshGraphData(false);
            });
        });
    }

    function syncTagBar() {
        var selected = new Set(getSelectedTags());
        Array.from(tagbar.querySelectorAll('input[type="checkbox"]')).forEach(function (cb) {
            var tag = cb.getAttribute('data-tag');
            cb.checked = selected.has(tag);
            cb.parentElement.classList.toggle('checked', cb.checked);
        });
    }

    // ---- label mode buttons ----
    function syncLabelButtons() {
        var mode = getCurrentLabelMode();
        btnLabelId.classList.toggle('on', mode === 'id');
        btnLabelTitle.classList.toggle('on', mode === 'title');
        btnLabelId.setAttribute('aria-pressed', mode === 'id' ? 'true' : 'false');
        btnLabelTitle.setAttribute('aria-pressed', mode === 'title' ? 'true' : 'false');
    }

    function setLabelMode(mode) {
        var radio = document.querySelector('input[name="labelMode"][value="' + mode + '"]');
        if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
        syncLabelButtons();
        refreshLabels();
    }

    btnLabelId.addEventListener('click', function () { setLabelMode('id'); });
    btnLabelTitle.addEventListener('click', function () { setLabelMode('title'); });

    // ---- open / close ----
    function handleResize() {
        if (graph && active) {
            graph.width(window.innerWidth);
            graph.height(window.innerHeight);
        }
    }

    function setBackgroundInert(on) {
        if (!mainContent) return;
        if (on) {
            try { mainContent.inert = true; } catch (e) {}
            mainContent.setAttribute('aria-hidden', 'true');
        } else {
            try { mainContent.inert = false; } catch (e) {}
            mainContent.removeAttribute('aria-hidden');
        }
    }

    function getFocusable() {
        return Array.from(overlay.querySelectorAll(
            'button, input, [href], [tabindex]:not([tabindex="-1"])'
        )).filter(function (el) {
            return !el.disabled && el.offsetParent !== null;
        });
    }

    function open3D() {
        if (active) return;
        active = true;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setBackgroundInert(true);
        noteInteract(); // don't orbit until the scene has settled after entry
        publishUrlState();
        showStatus('Loading 3D engine\\u2026', true);
        ensureLibs().then(function () {
            if (!active) return;
            initGraph();
            if (graph.resumeAnimation) graph.resumeAnimation();
            handleResize();
            buildTagBar();
            syncTagBar();
            syncLabelButtons();
            refreshLabels();
            refreshGraphData(false);
            if (lastTagKey === null) refreshGraphData(true);
            if (currentNodes.length > 0) hideStatus();
            startLod();
            exitBtn.focus();
        }).catch(function (err) {
            console.error('3D mode failed to load:', err);
            showStatus('Failed to load the 3D libraries (network error). Press Esc to return to 2D and try again.', false);
        });
    }

    function close3D() {
        if (!active) return;
        active = false;
        stopLod();
        if (graph && graph.pauseAnimation) graph.pauseAnimation();
        try {
            if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        } catch (e) {}
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setBackgroundInert(false);
        hideCardTip();
        toggleSettings(false);
        publishUrlState();
        openBtn.focus();
    }

    // ---- settings flyout (S): tune the photon speed and the idle drift live ----
    function settingsMult(el, def) { return (Math.round((+el.value) / def * 10) / 10).toFixed(1) + '\\u00d7'; }
    function setSliderReadout(el, valEl, def) {
        if (!el) return;
        var m = settingsMult(el, def);
        if (valEl) valEl.textContent = m;
        el.setAttribute('aria-valuetext', m);
    }
    // reflect what is actually animating: particles are off under reduced-motion or
    // on very large graphs, the idle orbit is off under reduced-motion. Disable the
    // matching slider (rather than leave a live-looking control that does nothing)
    // and explain why, so the "Motion" panel never lies to the user.
    function syncSettingsState() {
        if (speedParticleEl) speedParticleEl.disabled = !particlesEnabled;
        if (speedOrbitEl) speedOrbitEl.disabled = reducedMotion;
        setSliderReadout(speedParticleEl, speedParticleValEl, 5);
        setSliderReadout(speedOrbitEl, speedOrbitValEl, 8);
        setSliderReadout(orbSizeEl, orbSizeValEl, 10); // orb size works in any mode
        if (ballSpeedEl) ballSpeedEl.disabled = reducedMotion; // grains are frozen under reduced motion
        setSliderReadout(ballSpeedEl, ballSpeedValEl, 9);
        if (settingsNoteEl) {
            var note = reducedMotion ? 'Motion is reduced by your system setting.'
                : (!particlesEnabled ? 'Particles are off for large graphs.' : '');
            settingsNoteEl.textContent = note;
            settingsNoteEl.hidden = !note;
        }
    }
    var settingsReturnFocus = null;
    function toggleSettings(force) {
        if (!settingsEl) return;
        var show = (typeof force === 'boolean') ? force : !settingsEl.classList.contains('show');
        settingsEl.classList.toggle('show', show);
        settingsEl.hidden = !show;
        if (show) {
            syncSettingsState();
            // anchor just below the ACTUAL (possibly wrapped) top bar so the panel
            // never covers the tag pills / fullscreen button on narrow viewports
            if (topbarEl) settingsEl.style.top = (topbarEl.offsetHeight + 8) + 'px';
            settingsReturnFocus = document.activeElement;
            var first = [orbSizeEl, ballSpeedEl, speedParticleEl, speedOrbitEl].filter(function (el) { return el && !el.disabled; })[0];
            if (first) first.focus();
        } else if (active && settingsReturnFocus && overlay.contains(settingsReturnFocus)) {
            try { settingsReturnFocus.focus(); } catch (e) {}
            settingsReturnFocus = null;
        }
    }
    if (orbSizeEl) orbSizeEl.addEventListener('input', function () {
        orbScale = (+orbSizeEl.value) / 10; // slider 3..25 -> 0.3x..2.5x (live, no rebuild)
        setSliderReadout(orbSizeEl, orbSizeValEl, 10);
        asd3dSaveSettings();
    });
    if (ballSpeedEl) ballSpeedEl.addEventListener('input', function () {
        grainSpeed = (+ballSpeedEl.value) * 0.05; // slider 0..20 -> 0 (frozen) .. 1.0
        setSliderReadout(ballSpeedEl, ballSpeedValEl, 9);
        asd3dSaveSettings();
    });
    if (speedParticleEl) speedParticleEl.addEventListener('input', function () {
        particleSpeed = (+speedParticleEl.value) * 0.001; // slider 0..20 -> 0..0.02
        if (graph) graph.linkDirectionalParticleSpeed(particleSpeed);
        setSliderReadout(speedParticleEl, speedParticleValEl, 5);
        asd3dSaveSettings();
    });
    if (speedOrbitEl) speedOrbitEl.addEventListener('input', function () {
        idleOrbitSpeed = (+speedOrbitEl.value) * 0.01; // slider 0..30 -> 0..0.30 rad/s
        setSliderReadout(speedOrbitEl, speedOrbitValEl, 8);
        asd3dSaveSettings();
    });
    if (boxHueEl) boxHueEl.addEventListener('input', function () {
        boxHue = +boxHueEl.value; // -180..180 deg, recolours the glass boxes only
        if (boxHueValEl) boxHueValEl.textContent = boxHue + '\\u00b0';
        applyBoxHue();
        asd3dSaveSettings();
    });
    if (boxSizeEl) boxSizeEl.addEventListener('input', function () {
        boxScale = (+boxSizeEl.value) / 10; // slider 3..25 -> 0.3x..2.5x
        if (boxSizeValEl) boxSizeValEl.textContent = boxScale.toFixed(1) + '\\u00d7';
        applyBoxScale();
        asd3dSaveSettings();
    });
    if (boxOpacityEl) boxOpacityEl.addEventListener('input', function () {
        boxOpacity = (+boxOpacityEl.value) / 10; // slider 0..30 -> 0..3.0 (applied per-frame)
        if (boxOpacityValEl) boxOpacityValEl.textContent = boxOpacity.toFixed(1) + '\\u00d7';
        asd3dSaveSettings();
    });
    if (bloomBrightEl) bloomBrightEl.addEventListener('input', function () {
        bloomBright = (+bloomBrightEl.value) / 10; // slider 0..30 -> 0..3.0 (applied per-frame)
        if (bloomBrightValEl) bloomBrightValEl.textContent = bloomBright.toFixed(1) + '\\u00d7';
        asd3dSaveSettings();
    });
    if (crossEl) crossEl.addEventListener('input', function () {
        crossStrength = (+crossEl.value) / 100; // slider 0..100 -> 0..1.0 cross opacity
        if (crossValEl) crossValEl.textContent = crossStrength.toFixed(2);
        rebuildStarTexture();
        asd3dSaveSettings();
    });
    if (fogEl) fogEl.addEventListener('input', function () {
        fogScale = (+fogEl.value) / 10; // slider 3..40 -> 0.3x..4.0x fog distance
        if (fogValEl) fogValEl.textContent = fogScale.toFixed(1) + '\\u00d7';
        applyFog();
        asd3dSaveSettings();
    });
    if (cardSizeEl) cardSizeEl.addEventListener('input', function () {
        cardScale = (+cardSizeEl.value) / 100; // slider 50..300 -> 0.5x..3.0x (applied per-frame)
        if (cardSizeValEl) cardSizeValEl.textContent = cardScale.toFixed(2) + '\\u00d7';
        asd3dSaveSettings();
    });
    if (linkWidthEl) linkWidthEl.addEventListener('input', function () {
        var w = (+linkWidthEl.value) / 10; // slider 2..30 -> 0.2..3.0
        if (linkWidthValEl) linkWidthValEl.textContent = w.toFixed(1);
        if (graph) { graph.linkWidth(w); defogLinks(); setTimeout(defogLinks, 60); } // width rebuilds tubes -> re-defog
        asd3dSaveSettings();
    });
    if (linkOpacityEl) linkOpacityEl.addEventListener('input', function () {
        var o = (+linkOpacityEl.value) / 100; // slider 10..100 -> 0.10..1.00
        if (linkOpacityValEl) linkOpacityValEl.textContent = o.toFixed(2);
        if (graph) graph.linkOpacity(o);
        asd3dSaveSettings();
    });

    openBtn.addEventListener('click', open3D);
    exitBtn.addEventListener('click', close3D);
    infoTableBtn.addEventListener('click', function () { exitToTable(selectedNodeId); });
    infoClearBtn.addEventListener('click', clearSelection);
    window.addEventListener('resize', handleResize);

    fsBtn.addEventListener('click', function () {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (overlay.requestFullscreen) {
                overlay.requestFullscreen();
            }
        } catch (e) {}
    });

    document.addEventListener('keydown', function (e) {
        if (!active) {
            // Esc also ENTERS 3D from the 2D page (so Esc toggles 2D<->3D), unless a
            // form field is focused
            if (e.key === 'Escape') {
                var et = e.target, etg = (et && et.tagName) || '';
                if (etg === 'INPUT' || etg === 'TEXTAREA' || etg === 'SELECT') return;
                e.preventDefault();
                open3D();
            }
            return;
        }
        if (e.key === 'Escape') {
            if (document.fullscreenElement) return; // browser exits fullscreen first
            e.preventDefault();
            // with a card open, Esc jumps to that descriptor's row in the 2D table;
            // otherwise it just switches back to 2D
            if (cardOpenId) exitToTable(cardOpenId);
            else close3D();
            return;
        }
        if (e.key === 's' || e.key === 'S') {
            // only block when the user is actually typing into a text field; range
            // sliders and checkboxes must NOT swallow S, or the panel can't be closed
            // with S once a slider is focused
            var tgt = e.target;
            var tg = (tgt && tgt.tagName) || '';
            var typing = tg === 'TEXTAREA' || (tg === 'INPUT' && /^(text|search|email|url|tel|password|number)$/.test(tgt.type || ''));
            if (typing) return;
            e.preventDefault();
            toggleSettings();
            return;
        }
        if (e.key === 'Tab') {
            // trap focus inside the modal overlay
            var focusable = getFocusable();
            if (!focusable.length) return;
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            var activeEl = document.activeElement;
            if (!overlay.contains(activeEl)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            } else if (e.shiftKey && activeEl === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && activeEl === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // ---- URL state hooks (script above reads these) ----
    window.asd3dIsActive = function () { return active; };
    window.asd3dApplyMode = function (on) {
        if (on && !active) {
            open3D();
        } else if (!on && active) {
            close3D();
        } else if (active && graph) {
            syncTagBar();
            syncLabelButtons();
            refreshLabels();
            refreshGraphData(false);
        }
    };

    // honor ?mode=3d on initial load (the first applyUrlState ran before these hooks existed)
    try {
        if (new URLSearchParams(window.location.search).get('mode') === '3d') {
            open3D();
        }
    } catch (e) {}
})();`;
