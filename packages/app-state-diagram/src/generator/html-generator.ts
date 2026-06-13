/**
 * HTML Generator for Node.js
 *
 * Generates complete HTML documentation from ALPS data.
 * Ported from public/js/diagramAdapters.js
 */

import type { AlpsDocument, AlpsDescriptor, AlpsLink } from '../parser/alps-parser';
import { buildRelationshipMap } from './dot-generator';
import {
  descriptor2table,
  flattenDescriptors,
  extractTags,
  generateTagSelector,
  getDescriptorIdsByTag,
  extractLinks,
  generateLinksHtml,
  escapeHtml,
} from './table-functions';

/**
 * Escape JSON for safe embedding in <script> tags
 */
function escapeJsonForScript(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Generate complete HTML documentation
 */
export function generateHtml(
  alpsData: AlpsDocument,
  svgContent: string,
  originalContent: string
): string {
  // Create relationship data for highlighting
  const relationships = buildRelationshipMap(alpsData);

  // Generate Semantic Descriptors table
  const descriptors = flattenDescriptors(alpsData);
  const tableHtml = descriptor2table(descriptors);

  // Extract tags and generate selector
  const tags = extractTags(descriptors);
  const tagSelectorHtml = generateTagSelector(tags);

  // Build tag-to-descriptorIds map
  const tagDescriptorMap: Record<string, string[]> = {};
  for (const tag of tags) {
    tagDescriptorMap[tag] = getDescriptorIdsByTag(descriptors, tag);
  }

  // Extract links
  const links = extractLinks(alpsData);
  const linksHtml = generateLinksHtml(links);

  // Escape ALPS source for hidden embedding
  const escapedContent = originalContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Get title and doc from ALPS
  const alpsTitle = alpsData?.alps?.title || 'ALPS Profile';
  const alpsDocRaw = alpsData?.alps?.doc;
  const alpsDoc = typeof alpsDocRaw === 'object' ? (alpsDocRaw as { value?: string })?.value || '' : alpsDocRaw || '';
  const safeAlpsTitle = escapeHtml(alpsTitle);
  const safeAlpsDoc = escapeHtml(alpsDoc);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${safeAlpsTitle}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/3.0.1/github-markdown.min.css">
<style>
html{scroll-behavior:smooth;}
body{margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
.markdown-body{background:#fff;padding:45px;max-width:none;margin:0 auto;overflow:visible;}
a{cursor:pointer;}
#svg-container{display:flex;overflow-x:scroll;margin:20px 0;}
#svg-graph{flex-shrink:0;text-align:center;}
#svg-graph svg{display:block;max-width:none;}
#svg-container.fit-width #svg-graph svg{max-width:100% !important;height:auto !important;}
#svg-container.fit-width #svg-graph{flex-shrink:1;width:100%;}
#svg-container.half-size #svg-graph svg{max-width:60% !important;width:60% !important;height:auto !important;}
#svg-container.half-size #svg-graph{flex-shrink:0;}
h1,h2{margin-top:0;}
.empty-diagram-message{color:#666;text-align:center;margin:30px 0;}
/* Legend */
.legend{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap;}
table .legend{background-color:transparent;padding:0;margin:0;display:inline-flex;align-items:center;}
.legend-item{display:flex;align-items:center;font-size:14px;color:#333;}
.legend-icon{width:16px;height:16px;border:1px solid #000;margin-right:8px;}
.legend-icon.semantic{background-color:#FFFFFF;}
.legend-icon.safe{
    background-color:#00A86B;
    background-image:linear-gradient(45deg,#008000 25%,transparent 25%,transparent 75%,#008000 75%,#008000),linear-gradient(45deg,#008000 25%,transparent 25%,transparent 75%,#008000 75%,#008000);
    background-size:8px 8px;
    background-position:0 0,4px 4px;
}
.legend-icon.unsafe{
    background-color:#FF4136;
    background-image:repeating-linear-gradient(45deg,#FF4136,#FF4136 4px,#FF725C 4px,#FF725C 8px);
}
.legend-icon.idempotent{
    background-color:#D4A000;
    background-image:radial-gradient(#FFB700 20%,transparent 20%),radial-gradient(#FFB700 20%,transparent 20%);
    background-size:8px 8px;
    background-position:0 0,4px 4px;
}
/* Type indicator in table (small version) */
.type-indicator-small{display:inline-block;width:10px;height:10px;margin-right:4px;border:1px solid #000;vertical-align:middle;}
.type-indicator-small.semantic{background-color:#FFFFFF;}
.type-indicator-small.safe{
    background-color:#00A86B;
    background-image:linear-gradient(45deg,#008000 25%,transparent 25%,transparent 75%,#008000 75%,#008000),linear-gradient(45deg,#008000 25%,transparent 25%,transparent 75%,#008000 75%,#008000);
    background-size:6px 6px;
    background-position:0 0,3px 3px;
}
.type-indicator-small.unsafe{
    background-color:#FF4136;
    background-image:repeating-linear-gradient(45deg,#FF4136,#FF4136 3px,#FF725C 3px,#FF725C 6px);
}
.type-indicator-small.idempotent{
    background-color:#D4A000;
    background-image:radial-gradient(#FFB700 20%,transparent 20%),radial-gradient(#FFB700 20%,transparent 20%);
    background-size:6px 6px;
    background-position:0 0,3px 3px;
}
/* Table */
table{width:100%;border-collapse:collapse;margin:20px 0;}
th,td{padding:8px 12px;border:1px solid #ddd;text-align:left;vertical-align:top;}
th{background:#f6f8fa;font-weight:600;}
tr:hover{background-color:#f5f5f5;}
td a{color:#0366d6;text-decoration:none;}
td a:hover{text-decoration:underline;}
/* Selector container */
.selector-container{margin:15px 0;padding:10px;background:#f6f8fa;border-radius:5px;}
.selector-row{margin-bottom:8px;}
.selector-row:last-child{margin-bottom:0;}
.selector-label{font-weight:600;display:inline-block;width:48px;margin-right:8px;}
.selector-option{margin-right:15px;display:inline-block;cursor:pointer;}
.selector-option label{cursor:pointer;}
.tag-trigger-checkbox{margin-right:3px;}
.tag-only-option{border-left:1px solid #d0d7de;padding-left:12px;margin-left:4px;}
.tag-only-checkbox{margin-right:3px;}
/* Meta container for def, rt, tag */
.meta-container{display:flex;flex-direction:column;gap:4px;}
.meta-container br{display:none;}
.meta-item{display:flex;align-items:center;line-height:normal;}
.meta-label{font-size:0.85em;color:#777;width:45px;text-align:right;padding-right:10px;flex-shrink:0;}
.meta-values{display:inline-flex;flex-wrap:wrap;}
.meta-tag{display:inline-block;padding:3px 10px;border-radius:4px;font-size:0.8em;background-color:#f7f7f7;border:1px solid #e0e0e0;color:#3b71ca;margin:0 8px 4px 0;}
.def-tag{background-color:#EAF5FF;border-color:#B8DFFF;color:#0366D6;}
.rt-tag{background-color:#FFF5E6;border-color:#FFE1B3;color:#D97506;}
.tag-tag{background-color:#E6FFED;border-color:#C6EFC7;color:#22863A;}
.doc-tag{background-color:#FFFBEA;border-color:#FFE8A1;color:#8A6D1B;border:1px solid #FFE8A1;padding:3px 8px;font-size:0.8em;border-radius:4px;}
.doc-tag.clickable{cursor:pointer;}
.doc-tag.clickable:hover{background-color:#FFF3CC;}
/* 3D browse mode */
.asd3d-open-btn{display:inline-flex;align-items:center;gap:6px;padding:5px 16px;border:1px solid #2a3a66;border-radius:6px;background:linear-gradient(180deg,#1d2b50,#0e1730);color:#e7ecf5;font-size:13px;font-weight:600;cursor:pointer;}
.asd3d-open-btn:hover{background:linear-gradient(180deg,#27396a,#142046);}
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
</style>
<script>
// ALPS relationship data for parent-child highlighting
window.alpsRelationships = ${escapeJsonForScript(relationships)};

// Scroll to descriptor row and highlight it
function scrollToDescriptor(id) {
    const targetRow = document.getElementById('descriptor-' + id);
    if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRow.style.backgroundColor = '#ffffd0';
        setTimeout(() => {
            targetRow.style.backgroundColor = '';
        }, 2000);
    }
}

function setDescriptorHash(id) {
    if (!id) return;
    if (window.updateDiagramHash) {
        window.updateDiagramHash(id);
        return;
    }
    const url = new URL(window.location.href);
    url.hash = '#' + encodeURIComponent(id);
    window.history.replaceState(null, '', url.toString());
}

function setupSvgEventHandlers() {
    // Add click handlers to all SVG elements with href="#something"
    const svgLinks = document.querySelectorAll('svg a[href^="#"], svg a[*|href^="#"]');

    svgLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const href = this.getAttribute('href') || this.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (href && href.startsWith('#')) {
                const id = href.substring(1);
                setDescriptorHash(id);
                scrollToDescriptor(id);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupSvgEventHandlers();

    // Handle table internal links
    document.querySelectorAll('table a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let href = this.getAttribute('href');
            while (href.startsWith('##')) {
                href = href.substring(1);
            }
            const id = href.substring(1);

            // Highlight SVG element for ID column links
            if (this.classList.contains('descriptor-id-link')) {
                setTimeout(() => {
                    highlightElementInSVG(id);
                    setTimeout(() => fadeOutHighlightsInSVG(), 2000);
                }, 100);
            }

            // Scroll to target row if different
            const currentRow = this.closest('tr');
            const targetRow = document.getElementById('descriptor-' + id);
            if (targetRow) setDescriptorHash(id);

            if (targetRow && targetRow !== currentRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.style.backgroundColor = '#ffffd0';
                setTimeout(() => {
                    targetRow.style.backgroundColor = '';
                }, 2000);
            }
        });
    });

    function highlightElementInSVG(text) {
        clearHighlightsInSVG();

        const svgElements = document.querySelectorAll('svg text, svg title');
        svgElements.forEach(element => {
            if (element.textContent && element.textContent.toLowerCase().includes(text.toLowerCase())) {
                let parentShape = element.closest('g');
                if (parentShape) {
                    parentShape.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
                    parentShape.style.opacity = '0.8';
                    parentShape.classList.add('highlighted');
                }
            }
        });
    }

    function clearHighlightsInSVG() {
        const highlighted = document.querySelectorAll('.highlighted');
        highlighted.forEach(element => {
            element.style.transition = '';
            element.style.filter = '';
            element.style.opacity = '';
            element.classList.remove('highlighted');
        });
    }

    function fadeOutHighlightsInSVG() {
        const highlighted = document.querySelectorAll('.highlighted');
        highlighted.forEach(element => {
            element.style.transition = 'filter 0.5s ease-out, opacity 0.5s ease-out';
            element.style.filter = '';
            element.style.opacity = '';
        });
        setTimeout(() => {
            highlighted.forEach(element => {
                element.style.transition = '';
                element.classList.remove('highlighted');
            });
        }, 500);
    }
});
</script>
<script src="https://unpkg.com/@viz-js/viz@3/dist/viz-global.js"></script>
</head>
<body>
<div class="markdown-body">
<h1>${safeAlpsTitle}</h1>
<p>${safeAlpsDoc}</p>
<div id="svg-container"><div id="svg-graph">${svgContent}</div></div>
<div class="legend">
    <div class="legend-item" title="Semantic"><span class="legend-icon semantic"></span> Semantic</div>
    <div class="legend-item" title="Safe"><span class="legend-icon safe"></span> Safe</div>
    <div class="legend-item" title="Unsafe"><span class="legend-icon unsafe"></span> Unsafe</div>
    <div class="legend-item" title="Idempotent"><span class="legend-icon idempotent"></span> Idempotent</div>
</div>
<div class="selector-container">
    <div class="selector-row">
        <span class="selector-label">Label:</span>
        <span class="selector-option"><input type="radio" name="labelMode" value="id" checked><label> ID</label></span>
        <span class="selector-option"><input type="radio" name="labelMode" value="title"><label> Title</label></span>
    </div>
    <div class="selector-row">
        <span class="selector-label">Size:</span>
        <span class="selector-option"><input type="radio" name="sizeMode" value="original" checked><label> Original</label></span>
        <span class="selector-option"><input type="radio" name="sizeMode" value="half"><label> Compact</label></span>
        <span class="selector-option"><input type="radio" name="sizeMode" value="fit"><label> Fit to width</label></span>
    </div>
    <div class="selector-row">
        <span class="selector-label">View:</span>
        <span class="selector-option"><button type="button" id="asd3d-open" class="asd3d-open-btn" title="Browse the state diagram in 3D space">3D View</button></span>
    </div>
${tagSelectorHtml ? `    <div class="selector-row">${tagSelectorHtml}
        <span class="selector-option tag-only-option"><input type="checkbox" id="tag-only-mode" class="tag-only-checkbox" disabled><label for="tag-only-mode"> Show selected tags only</label></span>
    </div>` : ''}
</div>
${tableHtml}
${linksHtml}
<div style="display:none"><code id="alps-profile">${escapedContent}</code></div>
</div>
<div id="asd3d-overlay" role="dialog" aria-modal="true" aria-label="3D state diagram browser">
    <div id="asd3d-canvas"></div>
    <div class="asd3d-vignette"></div>
    <div class="asd3d-topbar">
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
</div>
<script>
// Tag filtering
const tagDescriptorMap = ${escapeJsonForScript(tagDescriptorMap)};
let isApplyingUrlState = false;
let hasExplicitSizeMode = false;
let currentDescriptorHash = '';

const normalizeSizeMode = (size) => {
    if (size === 'compact') return 'half';
    return ['original', 'fit', 'half'].includes(size) ? size : '';
};

const getTagsFromValues = (values) => {
    return values
        .flatMap(value => String(value).split(','))
        .map(tag => tag.trim())
        .filter(tag => tag && Object.prototype.hasOwnProperty.call(tagDescriptorMap, tag));
};

const getCurrentHash = () => {
    return window.location.hash ? decodeURIComponent(window.location.hash.substring(1)) : '';
};

const getCurrentLabelMode = () => {
    return document.querySelector('input[name="labelMode"]:checked')?.value || 'id';
};

const getCurrentSizeMode = () => {
    return document.querySelector('input[name="sizeMode"]:checked')?.value || 'original';
};

const getSelectedTags = () => {
    return Array.from(document.querySelectorAll('.tag-trigger-checkbox'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.getAttribute('data-tag'))
        .filter(Boolean);
};

const readUrlState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        tag: getTagsFromValues(params.getAll('tag')),
        tagOnly: params.get('tagOnly') === '1',
        label: params.get('label') === 'title' ? 'title' : 'id',
        size: normalizeSizeMode(params.get('size')),
        mode: params.get('mode') === '3d' ? '3d' : '',
        hash: getCurrentHash()
    };
};

const collectUrlState = () => {
    return {
        tag: getSelectedTags(),
        tagOnly: isTagOnlyMode(),
        label: getCurrentLabelMode(),
        size: getCurrentSizeMode(),
        mode: (typeof window.asd3dIsActive === 'function' && window.asd3dIsActive()) ? '3d' : '',
        hash: currentDescriptorHash || getCurrentHash()
    };
};

const replaceUrlState = (state) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    if (state.tag.length > 0) {
        url.searchParams.set('tag', state.tag.join(','));
    }
    if (state.tagOnly) {
        url.searchParams.set('tagOnly', '1');
    } else {
        url.searchParams.delete('tagOnly');
    }
    if (state.label === 'title') {
        url.searchParams.set('label', 'title');
    } else {
        url.searchParams.delete('label');
    }
    const size = normalizeSizeMode(state.size);
    if (size) {
        url.searchParams.set('size', size);
    } else {
        url.searchParams.delete('size');
    }
    if (state.mode === '3d') {
        url.searchParams.set('mode', '3d');
    } else {
        url.searchParams.delete('mode');
    }
    url.hash = state.hash ? '#' + encodeURIComponent(state.hash) : '';
    window.history.replaceState(null, '', url.toString());
};

const publishUrlState = () => {
    if (isApplyingUrlState) return;
    const state = collectUrlState();
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'diagramStateChanged', state }, '*');
    } else {
        replaceUrlState(state);
    }
};

window.updateDiagramHash = (id) => {
    currentDescriptorHash = id || '';
    publishUrlState();
};

const changeColorByTitle = (titleOrClass, newNodeColor, newEdgeColor, highlight = false) => {
    const elements = Array.from(document.getElementsByTagName('g'));
    elements.forEach(element => {
        const titleElement = element.getElementsByTagName('title')[0];
        const title = titleElement ? titleElement.textContent : '';
        if (title === titleOrClass || element.classList.contains(titleOrClass)) {
            const polygons = Array.from(element.getElementsByTagName('polygon'));
            const paths = Array.from(element.getElementsByTagName('path'));
            polygons.forEach(polygon => polygon.setAttribute('fill', newNodeColor));
            paths.forEach(path => {
                path.setAttribute('stroke', newEdgeColor);
                if (highlight) {
                    path.setAttribute('stroke-width', '3');
                    path.style.filter = 'drop-shadow(0 0 4px ' + newEdgeColor + ')';
                } else {
                    path.setAttribute('stroke-width', '1');
                    path.style.filter = '';
                }
            });
        }
    });
};

const setupTagEventListener = (eventName, ids, color, defaultColor = 'lightgrey', defaultEdgeColor = 'black') => {
    const changeColor = (useDefault) => {
        ids.forEach(id => {
            changeColorByTitle(id, useDefault ? defaultColor : color, useDefault ? defaultEdgeColor : color, !useDefault);
            const row = document.querySelector('tr:has(a[href="#' + id + '"])');
            if (row) row.style.backgroundColor = useDefault ? '' : '#fffde7';
        });
    };
    document.addEventListener('tagon-' + eventName, () => changeColor(false));
    document.addEventListener('tagoff-' + eventName, () => changeColor(true));
};

const isTagOnlyMode = () => {
    const tagOnlyCheckbox = document.getElementById('tag-only-mode');
    return Boolean(tagOnlyCheckbox && tagOnlyCheckbox.checked && getSelectedTags().length > 0);
};

const updateTagOnlyControl = () => {
    const tagOnlyCheckbox = document.getElementById('tag-only-mode');
    if (!tagOnlyCheckbox) return;
    const hasSelectedTags = getSelectedTags().length > 0;
    tagOnlyCheckbox.disabled = !hasSelectedTags;
    if (!hasSelectedTags) {
        tagOnlyCheckbox.checked = false;
    }
};

const setupTagTrigger = () => {
    const checkboxes = document.querySelectorAll('.tag-trigger-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const wasTagOnlyMode = isTagOnlyMode();
            updateTagOnlyControl();
            if (wasTagOnlyMode || isTagOnlyMode()) {
                await regenerateSvg(getCurrentLabelMode());
            } else {
                applySelectedTagsToDiagram();
            }
            publishUrlState();
        });
    });
};

function applySelectedTagsToDiagram() {
    const selectedTags = new Set(getSelectedTags());
    Object.keys(tagDescriptorMap).forEach(tag => {
        document.dispatchEvent(new CustomEvent('tagoff-' + tag));
    });
    selectedTags.forEach(tag => {
        document.dispatchEvent(new CustomEvent('tagon-' + tag));
    });
}

const tagColors = ['LightGreen', 'SkyBlue', 'LightCoral', 'LightSalmon', 'Khaki', 'Plum', 'Wheat'];
let colorIndex = 0;
Object.keys(tagDescriptorMap).forEach(tag => {
    const ids = tagDescriptorMap[tag];
    const color = tagColors[colorIndex % tagColors.length];
    colorIndex++;
    setupTagEventListener(tag, ids, color);
});

setupTagTrigger();
updateTagOnlyControl();

// Label mode switching
window.alpsData = ${escapeJsonForScript(alpsData)};

function getSelectedDescriptorIds() {
    const ids = new Set();
    getSelectedTags().forEach(tag => {
        (tagDescriptorMap[tag] || []).forEach(id => {
            if (id) ids.add(id);
        });
    });
    return ids;
}

function escapeDotId(id) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) {
        return id;
    }
    return '"' + id.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"') + '"';
}

function escapeDotLabel(label) {
    return label
        .replace(/\\\\/g, '\\\\\\\\')
        .replace(/"/g, '\\\\"');
}

function generateDotFromAlps(data, labelMode, filterIds = null) {
    const descriptors = data.alps?.descriptor || [];
    const transitions = descriptors.filter(d => d.type && d.rt);
    const rtTargets = new Set(transitions.map(t => t.rt.replace('#', '')));
    const states = descriptors.filter(d => d.id && rtTargets.has(d.id));
    const transitionEntries = transitions
        .filter(trans => trans.id && trans.rt)
        .map(trans => ({
            trans,
            targetState: trans.rt.replace('#', ''),
            sourceStates: findSourceStatesForTransition(trans.id, descriptors)
        }));
    const diagramNodeIds = new Set(rtTargets);
    transitionEntries.forEach(entry => {
        entry.sourceStates.forEach(sourceState => diagramNodeIds.add(sourceState));
    });
    const diagramNodes = descriptors.filter(d => d.id && diagramNodeIds.has(d.id));

    const getLabel = (descriptor) => {
        if (labelMode === 'title') {
            return descriptor.title || descriptor.id;
        }
        return descriptor.id;
    };

    let visibleStates = states;
    let visibleTransitionEntries = transitionEntries;

    if (filterIds && filterIds.size > 0) {
        const visibleNodeIds = new Set();
        diagramNodes.forEach(node => {
            if (node.id && filterIds.has(node.id)) {
                visibleNodeIds.add(node.id);
            }
        });
        transitionEntries.forEach(entry => {
            if (filterIds.has(entry.trans.id)) {
                visibleNodeIds.add(entry.targetState);
                entry.sourceStates.forEach(sourceState => visibleNodeIds.add(sourceState));
            }
        });

        visibleStates = diagramNodes.filter(node => node.id && visibleNodeIds.has(node.id));
        visibleTransitionEntries = transitionEntries
            .map(entry => ({
                ...entry,
                sourceStates: entry.sourceStates.filter(sourceState =>
                    visibleNodeIds.has(sourceState) && visibleNodeIds.has(entry.targetState)
                )
            }))
            .filter(entry => entry.sourceStates.length > 0);

        if (visibleStates.length === 0 && visibleTransitionEntries.length === 0) {
            return '';
        }
    }

    let dot = 'digraph application_state_diagram {\\n' +
        '    graph [labelloc="t"; fontname="Helvetica"];\\n' +
        '    node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];\\n\\n';

    visibleStates.forEach(state => {
        if (state.id) {
            const nodeId = escapeDotId(state.id);
            const nodeLabel = escapeDotLabel(getLabel(state));
            dot += '    ' + nodeId + ' [margin=0.1, label="' + nodeLabel + '", shape=box, URL="#' + escapeDotLabel(state.id) + '"]\\n';
        }
    });

    dot += '\\n';

    // Group transitions by (source, target) pair
    const edgeGroups = {};
    visibleTransitionEntries.forEach(entry => {
        const trans = entry.trans;
        const color = getTransitionColor(trans.type);
        const transLabel = getLabel(trans);
        entry.sourceStates.forEach(sourceState => {
            const key = sourceState + '\\t' + entry.targetState;
            if (!edgeGroups[key]) {
                edgeGroups[key] = { ids: [], labels: [], colors: [], types: [], titles: [] };
            }
            const group = edgeGroups[key];
            group.ids.push(trans.id);
            group.labels.push(transLabel);
            group.colors.push(color);
            group.types.push(trans.type || '');
            group.titles.push(trans.title || trans.id);
        });
    });

    // Render grouped edges with HTML TABLE labels
    Object.keys(edgeGroups).forEach(key => {
        const group = edgeGroups[key];
        const parts = key.split('\\t');
        const sourceState = parts[0];
        const targetState = parts[1];

        const edgeColor = group.ids.length === 1 ? getEdgeColor(group.types[0]) : getGroupEdgeColor(group.types);

        if (group.ids.length === 1) {
            const tableLabel = '<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0"><TR><TD VALIGN="MIDDLE" HREF="#' + escapeHtmlAttr(group.ids[0]) + '" TOOLTIP="' + escapeHtmlAttr(group.titles[0]) + ' (' + group.types[0] + ')"><FONT COLOR="' + group.colors[0] + '">\\u25A0</FONT> ' + escapeHtmlLabel(group.labels[0]) + '</TD></TR></TABLE>';
            dot += '    ' + escapeDotId(sourceState) + ' -> ' + escapeDotId(targetState) + ' [label=<' + tableLabel + '> URL="#' + escapeHtmlAttr(group.ids[0]) + '" fontsize=13 class="' + escapeHtmlAttr(group.ids[0]) + '" penwidth=1.3 color="' + edgeColor + '"];\\n';
        } else {
            let rows = '';
            for (let i = 0; i < group.ids.length; i++) {
                rows += '<TR><TD VALIGN="MIDDLE" ALIGN="LEFT" HREF="#' + escapeHtmlAttr(group.ids[i]) + '" TOOLTIP="' + escapeHtmlAttr(group.titles[i]) + ' (' + group.types[i] + ')"><FONT COLOR="' + group.colors[i] + '">\\u25A0</FONT> ' + escapeHtmlLabel(group.labels[i]) + '</TD></TR>';
            }
            const tableLabel = '<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">' + rows + '</TABLE>';
            dot += '    ' + escapeDotId(sourceState) + ' -> ' + escapeDotId(targetState) + ' [label=<' + tableLabel + '> URL="#' + escapeHtmlAttr(group.ids[0]) + '" fontsize=13 class="' + escapeHtmlAttr(group.ids[0]) + '" penwidth=1.3 color="' + edgeColor + '"];\\n';
        }
    });

    dot += '\\n';
    visibleStates.forEach(state => {
        if (state.id) {
            const nodeId = escapeDotId(state.id);
            const nodeLabel = escapeDotLabel(getLabel(state));
            dot += '    ' + nodeId + ' [label="' + nodeLabel + '" URL="#' + escapeDotLabel(state.id) + '"]\\n';
        }
    });
    dot += '\\n}';
    return dot;
}

function findSourceStatesForTransition(transitionId, descriptors) {
    const sources = [];
    descriptors.forEach(d => {
        if (d.descriptor && Array.isArray(d.descriptor)) {
            const hasTransition = d.descriptor.some(child => {
                const childId = child.href ? child.href.replace('#', '') : child.id;
                return childId === transitionId;
            });
            if (hasTransition && d.id) {
                sources.push(d.id);
            }
        }
    });
    return sources;
}

function getTransitionColor(type) {
    switch (type) {
        case 'safe': return '#00A86B';
        case 'unsafe': return '#FF4136';
        case 'idempotent': return '#D4A000';
        default: return '#000000';
    }
}

function getEdgeColor(type) {
    return (type === 'unsafe' || type === 'idempotent') ? '#000000' : '#99999977';
}

function getGroupEdgeColor(types) {
    return (types.includes('unsafe') || types.includes('idempotent')) ? '#000000' : '#99999977';
}

function escapeHtmlLabel(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtmlAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function regenerateSvg(labelMode) {
    const svgGraph = document.getElementById('svg-graph');
    svgGraph.innerHTML = '<p>Regenerating diagram...</p>';

    try {
        const dotContent = generateDotFromAlps(window.alpsData, labelMode, isTagOnlyMode() ? getSelectedDescriptorIds() : null);
        if (!dotContent) {
            svgGraph.innerHTML = '<p class="empty-diagram-message">No diagram nodes match the selected tags.</p>';
            return;
        }
        const vizInstance = await Viz.instance();
        const svgString = vizInstance.renderString(dotContent, { format: 'svg' });
        svgGraph.innerHTML = svgString;
        setupSvgEventHandlers();
        applySelectedTagsToDiagram();
        if (hasExplicitSizeMode) {
            applySizeMode(getCurrentSizeMode());
        } else {
            autoSelectSizeMode();
        }
        if (currentDescriptorHash) {
            setTimeout(() => scrollToDescriptor(currentDescriptorHash), 0);
        }
    } catch (error) {
        console.error('Error regenerating SVG:', error);
        svgGraph.innerHTML = '<p style="color:red;">Error regenerating diagram: ' + error.message + '</p>';
    }
}

document.querySelectorAll('input[name="labelMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        regenerateSvg(this.value).then(() => publishUrlState());
    });
});

const tagOnlyCheckbox = document.getElementById('tag-only-mode');
if (tagOnlyCheckbox) {
    tagOnlyCheckbox.addEventListener('change', function() {
        regenerateSvg(getCurrentLabelMode()).then(() => publishUrlState());
    });
}

// Size mode toggle - keep selector position stable
document.querySelectorAll('input[name="sizeMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        applySizeMode(this.value, true);
        publishUrlState();
    });
});

function applySizeMode(sizeMode, explicit = false) {
    const normalizedSize = normalizeSizeMode(sizeMode);
    const svgContainer = document.getElementById('svg-container');
    if (!svgContainer || !normalizedSize) return;
    hasExplicitSizeMode = hasExplicitSizeMode || explicit;

    const radio = document.querySelector('input[name="sizeMode"][value="' + normalizedSize + '"]');
    if (radio) radio.checked = true;

    const selector = document.querySelector('.selector-container');
    const selectorTopBefore = selector ? selector.getBoundingClientRect().top : 0;

    svgContainer.classList.remove('fit-width', 'half-size');
    if (normalizedSize === 'fit') {
        svgContainer.classList.add('fit-width');
    } else if (normalizedSize === 'half') {
        svgContainer.classList.add('half-size');
    }

    requestAnimationFrame(() => {
        if (selector) {
            const selectorTopAfter = selector.getBoundingClientRect().top;
            const scrollDiff = selectorTopAfter - selectorTopBefore;
            window.scrollTo({ top: window.scrollY + scrollDiff, behavior: 'instant' });
        }
        if (normalizedSize === 'original' || normalizedSize === 'half') {
            centerSvgScroll();
        }
    });
}

function autoSelectSizeMode() {
    if (hasExplicitSizeMode) return;
    const svgContainer = document.getElementById('svg-container');
    const svgElement = document.querySelector('#svg-graph svg');
    const fitRadio = document.querySelector('input[name="sizeMode"][value="fit"]');
    const originalRadio = document.querySelector('input[name="sizeMode"][value="original"]');
    const compactOption = document.querySelector('input[name="sizeMode"][value="half"]')?.closest('.selector-option');

    if (!svgContainer || !svgElement) return;

    svgContainer.classList.remove('fit-width', 'half-size');

    setTimeout(() => {
        if (hasExplicitSizeMode) return;
        const svgWidth = svgElement.getBoundingClientRect().width;
        const containerWidth = svgContainer.clientWidth;

        // Show Compact option only when SVG is wider than container
        if (compactOption) {
            compactOption.style.display = svgWidth > containerWidth ? 'inline-block' : 'none';
        }

        if (svgWidth > containerWidth) {
            svgContainer.classList.add('fit-width');
            if (fitRadio) fitRadio.checked = true;
        } else {
            svgContainer.classList.remove('fit-width');
            if (originalRadio) originalRadio.checked = true;
        }
    }, 0);
}

async function applyUrlState(state) {
    isApplyingUrlState = true;
    try {
        const nextState = state || readUrlState();
        const selectedTags = Array.isArray(nextState.tag) ? nextState.tag : [];
        currentDescriptorHash = nextState.hash || '';
        const wasTagOnlyMode = isTagOnlyMode();

        document.querySelectorAll('.tag-trigger-checkbox').forEach(checkbox => {
            const tag = checkbox.getAttribute('data-tag');
            checkbox.checked = Boolean(tag && selectedTags.includes(tag));
        });
        updateTagOnlyControl();
        const tagOnlyCheckbox = document.getElementById('tag-only-mode');
        if (tagOnlyCheckbox) {
            tagOnlyCheckbox.checked = Boolean(nextState.tagOnly && selectedTags.length > 0);
        }

        if (nextState.size) {
            applySizeMode(nextState.size, true);
        }

        const currentLabelMode = getCurrentLabelMode();
        const labelRadio = document.querySelector('input[name="labelMode"][value="' + nextState.label + '"]');
        if (labelRadio) labelRadio.checked = true;
        if (currentLabelMode !== nextState.label || wasTagOnlyMode || isTagOnlyMode()) {
            await regenerateSvg(nextState.label);
        }

        if (nextState.size) {
            applySizeMode(nextState.size, true);
        } else {
            autoSelectSizeMode();
        }
        applySelectedTagsToDiagram();
        if (currentDescriptorHash) {
            setTimeout(() => scrollToDescriptor(currentDescriptorHash), 0);
        }
        if (typeof window.asd3dApplyMode === 'function' && typeof nextState.mode !== 'undefined') {
            window.asd3dApplyMode(nextState.mode === '3d');
        }
    } finally {
        isApplyingUrlState = false;
    }
}

window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'applyUrlState') {
        applyUrlState(event.data.state);
    }
});

function centerSvgScroll() {
    const svgContainer = document.getElementById('svg-container');
    if (svgContainer && !svgContainer.classList.contains('fit-width')) {
        const scrollMax = svgContainer.scrollWidth - svgContainer.clientWidth;
        if (scrollMax > 0) {
            svgContainer.scrollLeft = scrollMax / 2;
        }
    }
}

applyUrlState();
document.addEventListener('DOMContentLoaded', autoSelectSizeMode);
window.addEventListener('resize', autoSelectSizeMode);

// loadText: Update from raw ALPS text (for CDP/watch mode)
// Editor parses and renders - CLI just sends text
window.loadText = async function(text) {
    try {
        // Auto-detect and parse (JSON or XML)
        let newAlpsData;
        const trimmed = text.trim();
        if (trimmed.startsWith('{')) {
            newAlpsData = JSON.parse(text);
        } else if (trimmed.startsWith('<')) {
            // Simple XML to JSON (basic support)
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/xml');
            // For now, just update the source display
            console.log('XML parsing in browser - limited support');
            return;
        } else {
            throw new Error('Unknown format');
        }

        window.alpsData = newAlpsData;

        // Update title
        const title = newAlpsData?.alps?.title || 'ALPS Profile';
        document.querySelector('h1').textContent = title;
        document.title = title;

        // Update description
        const doc = newAlpsData?.alps?.doc;
        const docText = typeof doc === 'object' ? doc?.value || '' : doc || '';
        document.querySelector('.markdown-body > p').textContent = docText;

        // Regenerate diagram
        const labelMode = document.querySelector('input[name="labelMode"]:checked')?.value || 'id';
        await regenerateSvg(labelMode);

        if (hasExplicitSizeMode) {
            applySizeMode(getCurrentSizeMode());
        } else {
            const svgContainer = document.getElementById('svg-container');
            const fitRadio = document.querySelector('input[name="sizeMode"][value="fit"]');
            if (svgContainer && fitRadio) {
                svgContainer.classList.add('fit-width');
                fitRadio.checked = true;
            }
        }

        console.log('ALPS reloaded via loadText');
    } catch (e) {
        console.error('loadText error:', e);
    }
};
</script>
<script>
// ===== 3D Browse Mode =====
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
    var BG_COLOR = '#0a120d'; // forest-black: near-black with a drop of green, not pure #000

    // Garden palette for 3D (the 2D SVG keeps its own colours via getTransitionColor).
    // Each transition reads as a stem: a dark root colour and a brighter shoot tip,
    // semantics preserved (safe=green, idempotent=vine ochre, unsafe=garden red).
    var GARDEN_TIP = { safe: '#74e29c', idempotent: '#b8923a', unsafe: '#9a3340' };
    var GARDEN_ROOT = { safe: '#173f2e', idempotent: '#5c4a22', unsafe: '#4a1f25' };
    function gardenTip(type) { return GARDEN_TIP[type] || '#8fae9d'; }
    function gardenRoot(type) { return GARDEN_ROOT[type] || '#2a3d33'; }
    var SPRITE_SCALE = 16;  // canvas px per world unit
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

    hudEl.innerHTML = 'Drag: rotate \\u00b7 Right-drag: pan \\u00b7 Scroll: zoom<br>' +
        'Click node: focus \\u00b7 Right-click node: show in table \\u00b7 Esc: back to 2D';

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
                return a.transId.localeCompare(b.transId); // alphabetical, consistent everywhere
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
        nodes.forEach(function (n) { n.bloom = n.degree / maxDeg; }); // 0..1 prominence
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
        ctx.fillStyle = 'rgba(244,248,255,0.94)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(122,162,255,0.55)';
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

        var pg = gridCells(props, 8, 3);
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

        var bg = gridCells(actions, 6, 2);
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

        var w = Math.ceil(Math.min(Math.max(Math.max(headerW, propsGridW, btnsGridW) + MARGIN * 2, 240), 760));
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
        ctx.fillText(head, MARGIN, 32, w - MARGIN * 2);
        if (sub) {
            ctx.fillStyle = '#5d6f94';
            ctx.font = subFont;
            ctx.fillText(sub, MARGIN, 60, w - MARGIN * 2);
        }

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
        return { canvas: c, buttons: buttons, props: propRects };
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
        var bloom = null;
        var bt = node.bloom || 0;
        if (bt > 0.04) {
            var bmat = new THREE.SpriteMaterial({
                map: getHaloTexture(), transparent: true, depthWrite: false,
                depthTest: false, blending: THREE.AdditiveBlending
            });
            bmat.color.set('#3fa66a');
            bmat.opacity = 0.1 + bt * 0.38;
            bloom = new THREE.Sprite(bmat);
            var bs = 7 + bt * 28;
            bloom.scale.set(bs, bs, 1);
            bloom.renderOrder = 7; // behind chip(10) and card(11)
            group.add(bloom);
        }
        var chip = canvasSprite(drawChipCanvas(getNodeLabel(node)), true);
        chip.renderOrder = 10;
        group.add(chip);
        node.__asd3d = { group: group, chip: chip, card: null, bloom: bloom };
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
        s.cardSize = { w: drawn.canvas.width, h: drawn.canvas.height };
        s.cardBaseScale = { x: card.scale.x, y: card.scale.y };
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
        if (camTween) {
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
                    var ang = dt * 0.08;
                    var csA = Math.cos(ang), snA = Math.sin(ang);
                    cp.x = ctr.target.x + ox * csA - oz * snA;
                    cp.z = ctr.target.z + ox * snA + oz * csA;
                    ctr.update();
                }
            }
        }
        try { checkParticleArrivals(); } catch (e) {}
        var cam = graph.camera().position;
        var p11 = projectionTerm();
        var vh = window.innerHeight || 900;
        var fog = graph.scene().fog;
        var aerialNear = fog ? fog.near * 0.6 : 300;
        var aerialFar = fog ? fog.far * 0.9 : 1500;
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
            // aerial perspective: labels fade toward the background with distance
            var aerial = 1 - (dist - aerialNear) / Math.max(1, aerialFar - aerialNear);
            node.__asd3dDim = Math.max(0.22, Math.min(1, aerial * 1.15));
        });
        // cards open ONLY on an explicit click (cardOpenId), so focusing a node
        // shows its botanical form rather than instantly hiding it behind a card
        currentNodes.forEach(function (node) {
            var s = node.__asd3d;
            if (!s) return;
            var open = (node.id === cardOpenId);
            if (open) ensureCard(node);
            if (s.card) {
                if (open && !s.cardVisPrev) s.cardShownAt = now; // just unfurled
                s.cardVisPrev = open;
                s.card.material.opacity = open ? 1 : 0;
                s.card.visible = open;
                if (open && s.cardBaseScale) {
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
                    s.card.scale.set(s.cardBaseScale.x * k, s.cardBaseScale.y * k, 1);
                }
                // evict a closed card's texture after a grace period
                if (!open) {
                    s.cardIdle = (s.cardIdle || 0) + 1;
                    if (s.cardIdle > 90) dropCard(s);
                } else {
                    s.cardIdle = 0;
                }
            }
            s.chip.material.opacity = open ? 0 : (node.__asd3dDim || 1);
            s.chip.visible = !open;
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
            btn.addEventListener('click', function () { triggerTransition(a); });
            infoActions.appendChild(btn);
        });
    }

    // ---- crafted camera flight ----
    // A transition click should feel like travelling along the edge, not a flat
    // dolly: the camera swings along a gentle arc and lands at an angle that
    // shows the edge it just traversed. Driven frame-by-frame from updateLod.
    var FLY_DUR = 1150;
    var FLY_DIST = 72;
    var camTween = null;

    function easeInOut(u) {
        return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    function flyToNode(node, fromNode) {
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

        var P1 = T1.clone().add(approach.multiplyScalar(FLY_DIST));

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
            if (s && s.card && s.card.visible && s.card.material.opacity > 0.1 && s.cardSize) {
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
        selectNode(target, from);       // selectNode resets cardOpenId to ''
        // continuity: if we moved from an open card, land with the card open too
        if (wasCardMode) cardOpenId = target.id;
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
                canvasEl.style.cursor = (hit && hit.type === 'button') ? 'pointer' : '';
                if (hit && (hit.type === 'button' || hit.type === 'prop')) showCardTip(cx, cy, hit);
                else hideCardTip();
            });
        }, true);
        canvasEl.addEventListener('pointerleave', hideCardTip, true);
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
        graph.graphData(model);
        statsEl.textContent = model.nodes.length + ' states \\u00b7 ' + model.links.length + ' transitions';
        particlesEnabled = !reducedMotion && model.links.length > 0 && model.links.length <= 400;
        graph.linkDirectionalParticles(particlesEnabled ? 2 : 0);
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
    function applySceneExtents() {
        try {
            if (!currentNodes.length) return;
            var bbox = graph.getGraphBbox();
            if (bbox) {
                var span = Math.max(bbox.x[1] - bbox.x[0], bbox.y[1] - bbox.y[0], bbox.z[1] - bbox.z[0], 120);
                var fog = graph.scene().fog;
                if (fog) {
                    fog.near = span * 1.1;
                    fog.far = span * 3.2;
                }
            }
            graph.zoomToFit(reducedMotion ? 0 : 700, 60);
            noteInteract(); // let the fit settle before the idle orbit drifts in
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
            .linkOpacity(0.45)
            .linkWidth(0.5)
            .linkCurvature(function (l) { return l.curvature; }) // keep the vine curls / self-loops
            .linkCurveRotation(function (l) { return l.rotation; })
            // shoot tip: a long pointed cone in the bright tip colour replaces the
            // old stubby arrowhead, so the stem ends in a new-shoot point
            .linkDirectionalArrowLength(7)
            .linkDirectionalArrowRelPos(1)
            .linkDirectionalArrowColor(function (l) { return l.color; })
            .linkDirectionalParticleColor(function (l) { return l.color; })
            .linkDirectionalParticleWidth(0.7)
            .linkDirectionalParticleSpeed(0.005)
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
                else if (cardOpenId !== n.id) { cardOpenId = n.id; noteInteract(); }
            })
            .onNodeRightClick(function (node) { exitToTable(node.id); })
            .onBackgroundClick(function (ev) {
                if (Date.now() - cardClickAt < 350) return; // trailing click of a card-button gesture
                if (ev && pickCardButton(ev.clientX, ev.clientY)) return; // a card button got it
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
                ctrls.maxDistance = 3000;
                ctrls.zoomSpeed = 0.7;
                ctrls.staticMoving = true; // no inertia drift; predictable with the idle orbit
            }
        } catch (e) {}
        try {
            graph.d3Force('link').distance(90);
            graph.d3Force('charge').strength(-300);
        } catch (e) {}
        try {
            graph.scene().fog = new THREE.Fog(new THREE.Color(BG_COLOR), 400, 1600);
        } catch (e) {}
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
        publishUrlState();
        openBtn.focus();
    }

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
        if (!active) return;
        if (e.key === 'Escape') {
            if (document.fullscreenElement) return; // browser exits fullscreen first
            e.preventDefault();
            close3D();
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
})();
</script>
</body>
</html>`;
}
