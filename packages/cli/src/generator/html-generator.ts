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
#svg-container.fit-width #svg-graph svg{max-width:100% !important;width:100% !important;height:auto !important;}
#svg-container.fit-width #svg-graph{flex-shrink:1;width:100%;}
h1,h2{margin-top:0;}
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

document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all SVG elements with href="#something"
    const svgLinks = document.querySelectorAll('svg a[href^="#"], svg a[*|href^="#"]');

    svgLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const href = this.getAttribute('href') || this.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (href && href.startsWith('#')) {
                const id = href.substring(1);
                scrollToDescriptor(id);
            }
        });
    });

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
<script src="https://unpkg.com/viz.js@2.1.2/viz.js"></script>
<script src="https://unpkg.com/viz.js@2.1.2/lite.render.js"></script>
</head>
<body>
<div class="markdown-body">
<h1>${safeAlpsTitle}</h1>
<p>${safeAlpsDoc}</p>
<div id="svg-container"><div id="svg-graph">${svgContent}</div></div>
<div class="selector-container">
    <div class="selector-row">
        <span class="selector-label">Label:</span>
        <span class="selector-option"><input type="radio" name="labelMode" value="id" checked><label> ID</label></span>
        <span class="selector-option"><input type="radio" name="labelMode" value="title"><label> Title</label></span>
    </div>
    <div class="selector-row">
        <span class="selector-label">Size:</span>
        <span class="selector-option"><input type="radio" name="sizeMode" value="original" checked><label> Original</label></span>
        <span class="selector-option"><input type="radio" name="sizeMode" value="fit"><label> Fit to width</label></span>
    </div>
${tagSelectorHtml ? `    <div class="selector-row">${tagSelectorHtml}</div>` : ''}
</div>
${tableHtml}
<div class="legend">
    <div class="legend-item" title="Semantic"><span class="legend-icon semantic"></span> Semantic</div>
    <div class="legend-item" title="Safe"><span class="legend-icon safe"></span> Safe</div>
    <div class="legend-item" title="Unsafe"><span class="legend-icon unsafe"></span> Unsafe</div>
    <div class="legend-item" title="Idempotent"><span class="legend-icon idempotent"></span> Idempotent</div>
</div>
${linksHtml}
<div style="display:none"><code id="alps-profile">${escapedContent}</code></div>
</div>
<script>
// Tag filtering
const tagDescriptorMap = ${escapeJsonForScript(tagDescriptorMap)};

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

const setupTagTrigger = () => {
    const checkboxes = document.querySelectorAll('.tag-trigger-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const tag = this.getAttribute('data-tag');
            this.checked ?
                document.dispatchEvent(new CustomEvent('tagon-' + tag)) :
                document.dispatchEvent(new CustomEvent('tagoff-' + tag));
        });
    });
};

const tagColors = ['LightGreen', 'SkyBlue', 'LightCoral', 'LightSalmon', 'Khaki', 'Plum', 'Wheat'];
let colorIndex = 0;
Object.keys(tagDescriptorMap).forEach(tag => {
    const ids = tagDescriptorMap[tag];
    const color = tagColors[colorIndex % tagColors.length];
    colorIndex++;
    setupTagEventListener(tag, ids, color);
});

setupTagTrigger();

// Label mode switching
window.alpsData = ${escapeJsonForScript(alpsData)};

function generateDotFromAlps(data, labelMode) {
    const descriptors = data.alps?.descriptor || [];
    const transitions = descriptors.filter(d => d.type && d.rt);
    const rtTargets = new Set(transitions.map(t => t.rt.replace('#', '')));
    const states = descriptors.filter(d => d.id && rtTargets.has(d.id));

    const getLabel = (descriptor) => {
        if (labelMode === 'title') {
            return descriptor.title || descriptor.id;
        }
        return descriptor.id;
    };

    let dot = 'digraph application_state_diagram {\\n' +
        '    graph [labelloc="t"; fontname="Helvetica"];\\n' +
        '    node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];\\n\\n';

    states.forEach(state => {
        if (state.id) {
            dot += '    ' + state.id + ' [margin=0.1, label="' + getLabel(state) + '", shape=box, URL="#' + state.id + '"]\\n';
        }
    });

    dot += '\\n';

    transitions.forEach(trans => {
        if (trans.id && trans.rt) {
            const targetState = trans.rt.replace('#', '');
            const sourceStates = findSourceStatesForTransition(trans.id, descriptors);
            const color = getTransitionColor(trans.type);
            const transLabel = getLabel(trans);
            sourceStates.forEach(sourceState => {
                dot += '    ' + sourceState + ' -> ' + targetState + ' [label="' + transLabel + '" URL="#' + trans.id + '" fontsize=13 class="' + trans.id + '" penwidth=1.5 color="' + color + '"];\\n';
            });
        }
    });

    dot += '\\n';
    states.forEach(state => {
        if (state.id) {
            dot += '    ' + state.id + ' [label="' + getLabel(state) + '" URL="#' + state.id + '"]\\n';
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

async function regenerateSvg(labelMode) {
    const svgGraph = document.getElementById('svg-graph');
    svgGraph.innerHTML = '<p>Regenerating diagram...</p>';

    try {
        const dotContent = generateDotFromAlps(window.alpsData, labelMode);
        const vizInstance = new Viz();
        const svgString = await vizInstance.renderString(dotContent, { format: 'svg' });
        svgGraph.innerHTML = svgString;
    } catch (error) {
        console.error('Error regenerating SVG:', error);
        svgGraph.innerHTML = '<p style="color:red;">Error regenerating diagram: ' + error.message + '</p>';
    }
}

document.querySelectorAll('input[name="labelMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        regenerateSvg(this.value);
    });
});

// Size mode toggle - keep selector position stable
document.querySelectorAll('input[name="sizeMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const selector = this.closest('.selector-container');
        const selectorRect = selector.getBoundingClientRect();
        const selectorTopBefore = selectorRect.top;

        const svgContainer = document.getElementById('svg-container');
        if (this.value === 'fit') {
            svgContainer.classList.add('fit-width');
        } else {
            svgContainer.classList.remove('fit-width');
        }

        // Adjust scroll to keep selector at same screen position (instant, no animation)
        requestAnimationFrame(() => {
            const selectorTopAfter = selector.getBoundingClientRect().top;
            const scrollDiff = selectorTopAfter - selectorTopBefore;
            window.scrollTo({ top: window.scrollY + scrollDiff, behavior: 'instant' });
            if (this.value === 'original') {
                centerSvgScroll();
            }
        });
    });
});

function autoSelectSizeMode() {
    const svgContainer = document.getElementById('svg-container');
    const svgElement = document.querySelector('#svg-graph svg');
    const fitRadio = document.querySelector('input[name="sizeMode"][value="fit"]');
    const originalRadio = document.querySelector('input[name="sizeMode"][value="original"]');

    if (!svgContainer || !svgElement) return;

    svgContainer.classList.remove('fit-width');

    setTimeout(() => {
        const svgWidth = svgElement.getBoundingClientRect().width;
        const containerWidth = svgContainer.clientWidth;

        if (svgWidth > containerWidth) {
            svgContainer.classList.add('fit-width');
            if (fitRadio) fitRadio.checked = true;
        } else {
            svgContainer.classList.remove('fit-width');
            if (originalRadio) originalRadio.checked = true;
        }
    }, 0);
}

function centerSvgScroll() {
    const svgContainer = document.getElementById('svg-container');
    if (svgContainer && !svgContainer.classList.contains('fit-width')) {
        const scrollMax = svgContainer.scrollWidth - svgContainer.clientWidth;
        if (scrollMax > 0) {
            svgContainer.scrollLeft = scrollMax / 2;
        }
    }
}

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

        // Set Fit to Width
        const svgContainer = document.getElementById('svg-container');
        const fitRadio = document.querySelector('input[name="sizeMode"][value="fit"]');
        if (svgContainer && fitRadio) {
            svgContainer.classList.add('fit-width');
            fitRadio.checked = true;
        }

        console.log('ALPS reloaded via loadText');
    } catch (e) {
        console.error('loadText error:', e);
    }
};
</script>
</body>
</html>`;
}
