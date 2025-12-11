// Diagram generator adapters for switching between ASD and alps2dot
import { descriptor2table, flattenDescriptors, extractTags, generateTagSelector, extractLinks, generateLinksHtml } from './descriptor2table.js';

class DiagramAdapter {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    async generate(content, fileType) {
        throw new Error('generate method must be implemented');
    }
}

class AsdAdapter extends DiagramAdapter {
    constructor() {
        super('ASD');
    }

    async generate(content, fileType) {
        try {
            const response = await axios.post('/api/', content, {
                headers: { 'Content-Type': fileType === 'JSON' ? 'application/json' : 'application/xml' },
                responseType: 'arraybuffer',
            });

            if (response.status === 200) {
                // Extract DOT content from ASD response for comparison
                let responseText = new TextDecoder().decode(response.data);
                const dotMatch = responseText.match(/digraph[^}]*}/s);
                if (dotMatch) {
                    console.log('ASD DOT Content:', dotMatch[0]);
                    // Store in hidden field for comparison
                    setTimeout(() => {
                        let debugDiv = document.getElementById('asd-dot-debug');
                        if (!debugDiv) {
                            debugDiv = document.createElement('div');
                            debugDiv.id = 'asd-dot-debug';
                            debugDiv.style.display = 'none';
                            document.body.appendChild(debugDiv);
                        }
                        debugDiv.textContent = dotMatch[0];
                    }, 100);
                }

                // Add CSS and script to ensure proper initial display
                const initializationCode = `
                <style>
                #asd-graph-name { 
                    display: none; 
                }
                .highlighted {
                    filter: drop-shadow(0 0 8px #ff6b35) !important;
                    opacity: 0.8 !important;
                }
                </style>
                <script>
                // Listen for highlight messages from parent window (same as Diagram version)
                window.addEventListener('message', function(event) {
                    if (event.data) {
                        if (event.data.type === 'highlightElement') {
                            highlightElementInASD(event.data.text);
                        } else if (event.data.type === 'clearHighlights') {
                            clearHighlightsInASD();
                        }
                    }
                });
                
                function highlightElementInASD(text) {
                    console.log('ASD: Highlighting element containing:', text);
                    
                    // Clear previous highlights
                    clearHighlightsInASD();
                    
                    // Find elements in ASD document that contain the search text
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach(element => {
                        const textContent = element.textContent || '';
                        const id = element.id || '';
                        const className = element.className || '';
                        
                        // Check if element contains the search text
                        if (textContent.toLowerCase().includes(text.toLowerCase()) ||
                            id.toLowerCase().includes(text.toLowerCase()) ||
                            (typeof className === 'string' && className.toLowerCase().includes(text.toLowerCase()))) {
                            
                            element.classList.add('highlighted');
                            console.log('ASD: Highlighted element:', element);
                        }
                    });
                    
                    // Also check SVG elements within ASD
                    const svgElements = document.querySelectorAll('svg *');
                    svgElements.forEach(element => {
                        const textContent = element.textContent || '';
                        if (textContent.toLowerCase().includes(text.toLowerCase())) {
                            let parentGroup = element.closest('g') || element;
                            parentGroup.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
                            parentGroup.style.opacity = '0.8';
                            parentGroup.classList.add('highlighted');
                        }
                    });
                }
                
                function clearHighlightsInASD() {
                    // Clear CSS class highlights
                    const highlighted = document.querySelectorAll('.highlighted');
                    highlighted.forEach(element => {
                        element.classList.remove('highlighted');
                        element.style.filter = '';
                        element.style.opacity = '';
                    });
                }
                
                // Add Ctrl+Click functionality for documentation links
                document.addEventListener('click', function(e) {
                    if (e.ctrlKey || e.metaKey) { // Ctrl on Windows/Linux, Cmd on Mac
                        const link = e.target.closest('a');
                        if (link && link.href) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Open in new tab/window
                            window.open(link.href, '_blank', 'noopener,noreferrer');
                            console.log('Ctrl+Click: Opened link in new tab:', link.href);
                        }
                    }
                });
                
                // Add click-to-jump functionality for ASD elements (same as Diagram version)
                document.addEventListener('click', function(e) {
                    // Skip if Ctrl+Click (handled above)
                    if (e.ctrlKey || e.metaKey) return;
                    
                    const clickedElement = e.target;
                    let targetId = null;
                    
                    // Try to extract ID from various sources
                    if (clickedElement.id) {
                        targetId = clickedElement.id;
                    } else if (clickedElement.textContent) {
                        // Look for ALPS identifiers in the text content
                        const text = clickedElement.textContent.trim();
                        // Simple heuristic: if it looks like an identifier, use it
                        if (text.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
                            targetId = text;
                        }
                    }
                    
                    if (targetId && window.parent !== window) {
                        // Send message to parent window to search for this ID in the editor
                        window.parent.postMessage({
                            type: 'jumpToId',
                            id: targetId
                        }, '*');
                        console.log('ASD: Click-to-jump message sent for:', targetId);
                    }
                });
                </script>
                <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const showIdRadio = document.getElementById('asd-show-id');
                    const showNameRadio = document.getElementById('asd-show-name');
                    const idGraph = document.getElementById('asd-graph-id');
                    const nameGraph = document.getElementById('asd-graph-name');
                    
                    if (showIdRadio && showNameRadio && idGraph && nameGraph) {
                        showIdRadio.addEventListener('change', function() {
                            if (this.checked) {
                                idGraph.style.display = 'block';
                                nameGraph.style.display = 'none';
                            }
                        });
                        
                        showNameRadio.addEventListener('change', function() {
                            if (this.checked) {
                                nameGraph.style.display = 'block';
                                idGraph.style.display = 'none';
                            }
                        });
                        
                        // 初期化：IDボタンをプログラムでクリック
                        setTimeout(() => {
                            showIdRadio.click();
                        }, 100);
                    }
                });
                </script>`;

                // Fix HTML structure issues before insertion
                responseText = this.fixHtmlStructure(responseText);

                // Insert the code before the closing </head> tag
                if (responseText.includes('</head>')) {
                    responseText = responseText.replace('</head>', initializationCode + '\n</head>');
                } else {
                    // Fallback: insert before </body> or at end
                    if (responseText.includes('</body>')) {
                        responseText = responseText.replace('</body>', initializationCode + '\n</body>');
                    } else {
                        responseText += initializationCode;
                    }
                }

                const blob = new Blob([responseText], { type: 'text/html; charset=utf-8' });
                return URL.createObjectURL(blob);
            } else {
                throw new Error(`ASD generation failed with status: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`ASD generation failed: ${error.message}`);
        }
    }

    fixHtmlStructure(html) {
        // Fix common HTML structure issues that cause XML parsing errors
        return html
            // Fix self-closing tags
            .replace(/<link([^>]*?)(?<!\/)>/g, '<link$1/>')
            .replace(/<meta([^>]*?)(?<!\/)>/g, '<meta$1/>')
            .replace(/<br(?<!\/)>/g, '<br/>')
            .replace(/<hr(?<!\/)>/g, '<hr/>')
            .replace(/<img([^>]*?)(?<!\/)>/g, '<img$1/>')
            // Ensure proper DOCTYPE
            .replace(/^\s*/, '<!DOCTYPE html>\n');
    }
}

class Alps2DotAdapter extends DiagramAdapter {
    constructor() {
        super('alps2dot');
    }

    async generate(content, fileType) {
        try {
            console.log('Alps2DotAdapter.generate called with:', { content: content.substring(0, 200) + '...', fileType });

            // Parse ALPS data first
            const alpsData = this.parseAlpsData(content, fileType);
            
            // Generate DOT content using parsed ALPS data
            const dotContent = this.generateDotFromAlps(alpsData);
            console.log('Generated DOT content:', dotContent.substring(0, 200) + '...');

            // Wait for Viz.js to be available in main page context
            console.log('Checking Viz.js availability...');
            let viz = window.Viz;
            for (let i = 0; i < 50 && (!viz || typeof viz !== 'function'); i++) {
                await new Promise(r => setTimeout(r, 100));
                viz = window.Viz;
                console.log(`Attempt ${i + 1}: Viz available = ${typeof viz}`);
            }

            if (viz && typeof viz === 'function') {
                console.log('Main page: Using pre-loaded Viz.js to generate SVG...');
                try {
                    const vizInstance = new viz();
                    const svgString = await vizInstance.renderString(dotContent, { format: 'svg' });
                    console.log('Main page: SVG generated successfully');
                    
                    // Create relationship data for highlighting
                    const relationships = this.buildRelationshipMap(alpsData);

                    // Generate Semantic Descriptors table
                    const descriptors = flattenDescriptors(alpsData);
                    const tableHtml = descriptor2table(descriptors);

                    // Extract tags and generate selector
                    const tags = extractTags(descriptors);
                    const tagSelectorHtml = generateTagSelector(tags);

                    // Build tag-to-descriptorIds map for event handling
                    const tagDescriptorMap = {};
                    for (const tag of tags) {
                        tagDescriptorMap[tag] = descriptors
                            .filter(d => d.tag && d.tag.split(',').map(t => t.trim()).includes(tag))
                            .map(d => d.id);
                    }

                    // Extract links
                    const links = extractLinks(alpsData);
                    const linksHtml = generateLinksHtml(links);

                    // Escape ALPS source for hidden embedding (used by drag & drop)
                    const escapedContent = content
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;');

                    // Get title and doc from ALPS
                    const alpsTitle = alpsData?.alps?.title || alpsData?.title || 'ALPS Profile';
                    const alpsDoc = alpsData?.alps?.doc?.value || alpsData?.alps?.doc || alpsData?.doc?.value || alpsData?.doc || '';

                    // Return the SVG directly as data URL for iframe-less display
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${alpsTitle}</title>
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
/* Override tag selector styles when inside selector-row */
.selector-row .selector-container{margin:0;padding:0;background:none;border-radius:0;display:inline;}
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
window.alpsRelationships = ${JSON.stringify(relationships).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')};
console.log('Loaded relationships:', window.alpsRelationships);

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

// Listen for messages from parent (for Preview mode scroll)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'scrollToDescriptor') {
        scrollToDescriptor(event.data.id);
    }
});

// Forward F8 key to parent for preview toggle (when iframe has focus)
document.addEventListener('keydown', function(event) {
    if (event.key === 'F8' && window.parent !== window) {
        event.preventDefault();
        window.parent.postMessage({ type: 'togglePreview' }, '*');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all SVG elements with href="#something"
    const svgLinks = document.querySelectorAll('svg a[href^="#"], svg a[*|href^="#"]');
    console.log('Found SVG links:', svgLinks.length);
    
    svgLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('SVG link clicked:', this);
            
            const href = this.getAttribute('href') || this.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (href && href.startsWith('#')) {
                const id = href.substring(1);
                console.log('Extracted ID:', id);

                if (window.parent !== window) {
                    // In iframe (editor mode): Send message to parent window
                    window.parent.postMessage({
                        type: 'jumpToId',
                        id: id
                    }, '*');
                    console.log('Message sent to parent');
                } else {
                    // Standalone (downloaded HTML): Scroll to table row
                    scrollToDescriptor(id);
                }
            }
        });
    });

    // Handle table internal links
    document.querySelectorAll('table a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Handle double hash (##id) by removing extra #
            let href = this.getAttribute('href');
            while (href.startsWith('##')) {
                href = href.substring(1);
            }
            const id = href.substring(1);

            if (window.parent !== window) {
                // In iframe (editor mode): Send message to parent to jump to editor line
                window.parent.postMessage({
                    type: 'jumpToId',
                    id: id
                }, '*');
                console.log('Table link: jumpToId sent for:', id);
            }

            // Highlight SVG element only for ID column links (states like goBlog, doPost, etc.)
            // Use setTimeout to ensure highlight persists after any clearHighlights from parent
            // Then fade out after 2 seconds
            if (this.classList.contains('descriptor-id-link')) {
                setTimeout(() => {
                    highlightElementInSVG(id);
                    setTimeout(() => fadeOutHighlightsInSVG(), 2000);
                }, 100);
            }

            // Check if this is a link to a different row (rt/Contained) or self (ID column)
            const currentRow = this.closest('tr');
            const targetRow = document.getElementById('descriptor-' + id);

            // Only scroll and highlight if linking to a different row
            if (targetRow && targetRow !== currentRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.style.backgroundColor = '#ffffd0';
                setTimeout(() => {
                    targetRow.style.backgroundColor = '';
                }, 2000);
            }
        });
    });

    // Listen for highlight messages from parent window
    window.addEventListener('message', function(event) {
        if (event.data) {
            if (event.data.type === 'highlightElement') {
                highlightElementInSVG(event.data.text);
            } else if (event.data.type === 'clearHighlights') {
                clearHighlightsInSVG();
            }
        }
    });
    
    function highlightElementInSVG(text) {
        console.log('Highlighting in SVG:', text);
        
        // Clear previous highlights
        clearHighlightsInSVG();
        
        // Simple debug
        console.log('Highlighting text:', text);
        
        // Find SVG elements that contain this text (partial matching)
        const svgElements = document.querySelectorAll('svg text, svg title');
        svgElements.forEach(element => {
            if (element.textContent && element.textContent.toLowerCase().includes(text.toLowerCase())) {
                // Find the parent group or shape to highlight
                let parentShape = element.closest('g');
                if (parentShape) {
                    parentShape.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
                    parentShape.style.opacity = '0.8';
                    parentShape.classList.add('highlighted');
                    console.log('Highlighted text element:', parentShape, 'contains:', text);
                }
            }
        });
        
        // Find by partial ID/class match (case-insensitive)
        const allElements = document.querySelectorAll('svg [id], svg [class]');
        allElements.forEach(element => {
            const id = element.getAttribute('id') || '';
            const className = element.getAttribute('class') || '';
            
            if (id.toLowerCase().includes(text.toLowerCase()) || 
                className.toLowerCase().includes(text.toLowerCase())) {
                element.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
                element.style.opacity = '0.8';
                element.classList.add('highlighted');
                console.log('Highlighted partial match:', element, 'matches:', text);
            }
        });
        
        // Also search in href attributes and other text content
        const allTextNodes = document.querySelectorAll('svg *');
        allTextNodes.forEach(element => {
            // Check various attributes for partial matches
            ['href', 'xlink:href', 'data-id'].forEach(attr => {
                const value = element.getAttribute(attr);
                if (value && value.toLowerCase().includes(text.toLowerCase())) {
                    element.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
                    element.style.opacity = '0.8';
                    element.classList.add('highlighted');
                    console.log('Highlighted attribute match:', element, attr, '=', value);
                }
            });
        });
        
        // STRUCTURAL RELATIONSHIP MATCHING using ALPS hierarchy
        console.log('Using ALPS relationships for:', text);
        
        if (window.alpsRelationships) {
            const relationships = window.alpsRelationships;
            
            // If this text is a child element, highlight its parents
            if (relationships.parentOf[text]) {
                relationships.parentOf[text].forEach(parentId => {
                    console.log('Highlighting parent:', parentId, 'contains child:', text);
                    
                    // Find SVG elements with this parent ID
                    document.querySelectorAll('svg text').forEach(textEl => {
                        if (textEl.textContent && textEl.textContent.trim() === parentId) {
                            let parentGroup = textEl.closest('g');
                            if (parentGroup) {
                                parentGroup.style.filter = 'drop-shadow(0 0 6px #35a3ff)'; // Blue for parents
                                parentGroup.style.opacity = '0.9';
                                parentGroup.classList.add('highlighted');
                                console.log('✓ Highlighted parent element:', parentId);
                            }
                        }
                    });
                });
            }
            
            // If this text is a parent element, highlight its children  
            if (relationships.childrenOf[text]) {
                relationships.childrenOf[text].forEach(childId => {
                    console.log('Highlighting child:', childId, 'of parent:', text);
                    
                    // Find SVG elements with this child ID
                    document.querySelectorAll('svg text').forEach(textEl => {
                        if (textEl.textContent && (textEl.textContent.trim() === childId || textEl.textContent.includes(childId))) {
                            let parentGroup = textEl.closest('g');
                            if (parentGroup) {
                                parentGroup.style.filter = 'drop-shadow(0 0 6px #00ff88)'; // Green for children
                                parentGroup.style.opacity = '0.9';
                                parentGroup.classList.add('highlighted');
                                console.log('✓ Highlighted child element:', childId);
                            }
                        }
                    });
                });
            }
        }
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
        // Remove class after transition completes
        setTimeout(() => {
            highlighted.forEach(element => {
                element.style.transition = '';
                element.classList.remove('highlighted');
            });
        }, 500);
    }
    
    // Also try with regular click event on the whole document
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'a' || e.target.closest('a')) {
            const link = e.target.tagName === 'a' ? e.target : e.target.closest('a');
            const href = link.getAttribute('href') || link.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                e.stopPropagation();
                const id = href.substring(1);
                console.log('Document click - extracted ID:', id);
                
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'jumpToId',
                        id: id
                    }, '*');
                }
            }
        }
    });
});
</script>
<script src="https://unpkg.com/viz.js@2.1.2/viz.js"></script>
<script src="https://unpkg.com/viz.js@2.1.2/lite.render.js"></script>
</head><body><div class="markdown-body">
<h1>${alpsTitle}</h1>
<p>${alpsDoc}</p>
<div id="svg-container"><div id="svg-graph">${svgString}</div></div>
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

// Tag filtering - using same logic as production ASD
const tagDescriptorMap = ${JSON.stringify(tagDescriptorMap)};

// Changes color of SVG elements by title (matching production ASD)
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
                // Emphasize edges when highlighted
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

// Sets up event listeners for tags
const setupTagEventListener = (eventName, ids, color, defaultColor = 'lightgrey', defaultEdgeColor = 'black') => {
    const changeColor = (useDefault) => {
        ids.forEach(id => {
            changeColorByTitle(id, useDefault ? defaultColor : color, useDefault ? defaultEdgeColor : color, !useDefault);
            // Also highlight table row
            const row = document.querySelector('tr:has(a[href="#' + id + '"])');
            if (row) row.style.backgroundColor = useDefault ? '' : '#fffde7';
        });
    };
    document.addEventListener('tagon-' + eventName, () => changeColor(false));
    document.addEventListener('tagoff-' + eventName, () => changeColor(true));
};

// Sets up triggers for tag checkboxes
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

// Tag colors (cycle through for multiple tags)
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
const alpsData = ${JSON.stringify(alpsData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')};

function generateDotFromAlps(alpsData, labelMode) {
    const descriptors = alpsData.alps?.descriptor || [];

    // Get all transition targets (rt values) - these are the actual states
    const transitions = descriptors.filter(d => d.type && d.rt);
    const rtTargets = new Set(transitions.map(t => t.rt.replace('#', '')));

    // States are descriptors that are referenced as rt targets
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
        const dotContent = generateDotFromAlps(alpsData, labelMode);
        const vizInstance = new Viz();
        const svgString = await vizInstance.renderString(dotContent, { format: 'svg' });
        svgGraph.innerHTML = svgString;
        console.log('SVG regenerated with labelMode:', labelMode);
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

// Size mode toggle (Original / Fit to width)
document.querySelectorAll('input[name="sizeMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const svgContainer = document.getElementById('svg-container');
        if (this.value === 'fit') {
            svgContainer.classList.add('fit-width');
        } else {
            svgContainer.classList.remove('fit-width');
            // Center scroll position when switching to Original
            setTimeout(centerSvgScroll, 10);
        }
    });
});

// Auto-select size mode based on SVG width vs container width
function autoSelectSizeMode() {
    const svgContainer = document.getElementById('svg-container');
    const svgElement = document.querySelector('#svg-graph svg');
    const fitRadio = document.querySelector('input[name="sizeMode"][value="fit"]');
    const originalRadio = document.querySelector('input[name="sizeMode"][value="original"]');

    if (!svgContainer || !svgElement) return;

    // Temporarily remove fit-width to measure SVG's natural size
    svgContainer.classList.remove('fit-width');

    // Use setTimeout to allow reflow before measuring
    setTimeout(() => {
        const svgWidth = svgElement.getBoundingClientRect().width;
        const containerWidth = svgContainer.clientWidth;

        // If SVG is wider than container, auto-select Fit to width
        if (svgWidth > containerWidth) {
            svgContainer.classList.add('fit-width');
            if (fitRadio) fitRadio.checked = true;
        } else {
            svgContainer.classList.remove('fit-width');
            if (originalRadio) originalRadio.checked = true;
        }
    }, 0);
}

// Center horizontal scroll position (for Original mode)
function centerSvgScroll() {
    const svgContainer = document.getElementById('svg-container');
    if (svgContainer && !svgContainer.classList.contains('fit-width')) {
        const scrollMax = svgContainer.scrollWidth - svgContainer.clientWidth;
        if (scrollMax > 0) {
            svgContainer.scrollLeft = scrollMax / 2;
        }
    }
}

// Run once when DOM is ready and on window resize
document.addEventListener('DOMContentLoaded', autoSelectSizeMode);
window.addEventListener('resize', autoSelectSizeMode);
</script>
</body></html>`;
                    const blob = new Blob([html], { type: 'text/html' });
                    return URL.createObjectURL(blob);
                } catch (vizError) {
                    console.error('Viz.js rendering error:', vizError);
                    throw new Error(`Viz.js rendering failed: ${vizError.message}`);
                }
            }

            // Fallback: show error message
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ALPS Diagram - Error</title>
<style>body{margin:0;padding:20px;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif} .container{background:#fff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);padding:20px;} .error{color:#dc3545;}</style>
</head><body><div class="container"><div class="error"><strong>Diagram generation failed:</strong><br>Viz.js library not available after 5 seconds. Check network connection and try refreshing the page.</div></div></body></html>`;
            const blob = new Blob([html], { type: 'text/html' });
            return URL.createObjectURL(blob);
        } catch (error) {
            throw new Error(`Alps2dot generation failed: ${error.message}`);
        }
    }

    parseAlpsData(content, fileType) {
        console.log('parseAlpsData called with fileType:', fileType);
        let alpsData;

        // Parse ALPS content
        if (fileType === 'JSON') {
            try {
                alpsData = JSON.parse(content);
                console.log('Parsed JSON ALPS data:', alpsData);
            } catch (e) {
                console.error('JSON parsing error:', e);
                throw new Error('Invalid JSON format: ' + e.message);
            }
        } else {
            // Parse XML to extract ALPS data
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(content, 'text/xml');
                console.log('Parsed XML document:', xmlDoc);
                alpsData = this.xmlToAlpsObject(xmlDoc);
                console.log('Converted to ALPS data:', alpsData);
            } catch (e) {
                console.error('XML parsing error:', e);
                throw new Error('Invalid XML format: ' + e.message);
            }
        }

        return alpsData;
    }

    convertAlpsToDot(content, fileType) {
        // This method is now deprecated - use parseAlpsData + generateDotFromAlps instead
        const alpsData = this.parseAlpsData(content, fileType);
        return this.generateDotFromAlps(alpsData);
    }

    xmlToAlpsObject(xmlDoc) {
        const alpsElement = xmlDoc.documentElement;
        const descriptors = [];

        // Extract only top-level descriptors from XML
        const descriptorElements = xmlDoc.querySelectorAll('alps > descriptor');
        descriptorElements.forEach(desc => {
            const descriptor = {
                id: desc.getAttribute('id'),
                title: desc.getAttribute('title') || desc.getAttribute('id'),
                type: desc.getAttribute('type'),
                rt: desc.getAttribute('rt'),
                tag: desc.getAttribute('tag'),
                def: desc.getAttribute('def'), // Schema.org definition indicates ontology
                rel: desc.getAttribute('rel')
            };

            // Extract doc element text content
            const docElement = desc.querySelector(':scope > doc');
            if (docElement) {
                descriptor.doc = docElement.textContent.trim();
            }

            // Extract nested descriptors (href references) - only direct children
            const nestedDescs = Array.from(desc.children).filter(child => child.tagName === 'descriptor');
            if (nestedDescs.length > 0) {
                descriptor.descriptor = [];
                nestedDescs.forEach(nested => {
                    descriptor.descriptor.push({
                        href: nested.getAttribute('href'),
                        id: nested.getAttribute('id')
                    });
                });
            }

            descriptors.push(descriptor);
        });

        // Extract link elements
        const linkElements = xmlDoc.querySelectorAll('alps > link');
        const links = [];
        linkElements.forEach(link => {
            links.push({
                rel: link.getAttribute('rel') || '',
                href: link.getAttribute('href') || '',
                title: link.getAttribute('title') || ''
            });
        });

        const result = {
            alps: {
                title: xmlDoc.querySelector('alps > title')?.textContent || 'ALPS Diagram',
                doc: xmlDoc.querySelector('alps > doc')?.textContent || '',
                descriptor: descriptors
            }
        };

        if (links.length > 0) {
            result.alps.link = links;
        }

        return result;
    }

    generateDotFromAlps(alpsData, labelMode = 'id') {
        const descriptors = alpsData.alps?.descriptor || [];

        // Get all transition targets (rt values) - these are the actual states
        const transitions = descriptors.filter(d => d.type && d.rt);
        const rtTargets = new Set(transitions.map(t => t.rt.replace('#', '')));

        // States are descriptors that are referenced as rt targets
        const states = descriptors.filter(d => d.id && rtTargets.has(d.id));

        console.log('States found:', states.map(s => s.id));
        console.log('Transitions found:', transitions.map(t => t.id));

        // Helper function to get label based on mode
        const getLabel = (descriptor) => {
            if (labelMode === 'title') {
                return descriptor.title || descriptor.id;
            }
            return descriptor.id;
        };

        let dot = `digraph application_state_diagram {
    graph [
        labelloc="t";
        fontname="Helvetica"
    ];
    node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];

`;

        // Add state nodes
        states.forEach(state => {
            if (state.id) {
                dot += `    ${state.id} [margin=0.1, label="${getLabel(state)}", shape=box, URL="#${state.id}"]\n`;
            }
        });

        dot += '\n';

        // Add transitions
        transitions.forEach(trans => {
            if (trans.id && trans.rt) {
                const targetState = trans.rt.replace('#', '');
                const sourceStates = this.findSourceStatesForTransition(trans.id, descriptors);

                sourceStates.forEach(sourceState => {
                    const color = this.getTransitionColor(trans.type);
                    const transLabel = getLabel(trans);

                    // Color-coded edges without symbol
                    dot += `    ${sourceState} -> ${targetState} [label="${transLabel}" URL="#${trans.id}" fontsize=13 class="${trans.id}" penwidth=1.5 color="${color}"];\n`;
                });
            }
        });

        dot += '\n';

        // Add basic state nodes again (for compatibility)
        states.forEach(state => {
            if (state.id) {
                dot += `    ${state.id} [label="${getLabel(state)}" URL="#${state.id}"]\n`;
            }
        });

        dot += '\n}';

        return dot;
    }

    buildRelationshipMap(alpsData) {
        const relationships = {
            parentOf: {}, // parentOf['name'] = ['ProductList', 'UserProfile'] (parents that contain 'name')
            childrenOf: {} // childrenOf['ProductList'] = ['name', 'id', 'goCart'] (children of ProductList)
        };
        
        const descriptors = alpsData.alps?.descriptor || [];
        
        descriptors.forEach(parent => {
            if (parent.id && parent.descriptor && Array.isArray(parent.descriptor)) {
                // Initialize children array for this parent
                relationships.childrenOf[parent.id] = [];
                
                parent.descriptor.forEach(child => {
                    let childId = child.href || child.id;
                    if (childId && childId.startsWith('#')) {
                        childId = childId.substring(1); // Remove #
                    }
                    
                    if (childId) {
                        // Record parent-child relationship
                        relationships.childrenOf[parent.id].push(childId);
                        
                        // Record child-parent relationship
                        if (!relationships.parentOf[childId]) {
                            relationships.parentOf[childId] = [];
                        }
                        relationships.parentOf[childId].push(parent.id);
                    }
                });
            }
        });
        
        console.log('Built relationships:', relationships);
        return relationships;
    }

    findSourceStatesForTransition(transitionId, descriptors) {
        const sources = [];
        descriptors.forEach(desc => {
            if (desc.descriptor && Array.isArray(desc.descriptor)) {
                const hasTransition = desc.descriptor.some(nested =>
                    nested.href === `#${transitionId}` || nested.id === transitionId
                );
                if (hasTransition && desc.id) {
                    sources.push(desc.id);
                }
            }
        });
        return sources.length > 0 ? sources : ['UnknownState'];
    }

    getTransitionColor(type) {
        switch (type) {
            case 'safe': return '#00A86B';
            case 'unsafe': return '#FF4136';
            case 'idempotent': return '#D4A000';
            default: return '#000000';
        }
    }

}

// Adapter factory and manager
class DiagramAdapterManager {
    constructor() {
        this.adapters = {
            'asd': new AsdAdapter(),
            'alps2dot': new Alps2DotAdapter()
        };
        this.currentAdapter = 'asd'; // default
        this.loadSetting();
    }

    loadSetting() {
        const saved = localStorage.getItem('diagramAdapter');
        if (saved && this.adapters[saved]) {
            this.currentAdapter = saved;
        }
    }

    saveSetting() {
        localStorage.setItem('diagramAdapter', this.currentAdapter);
    }

    setAdapter(adapterName) {
        if (this.adapters[adapterName]) {
            this.currentAdapter = adapterName;
            this.saveSetting();
            return true;
        }
        return false;
    }

    getCurrentAdapter() {
        return this.adapters[this.currentAdapter];
    }

    getAdapterNames() {
        return Object.keys(this.adapters);
    }

    async generateDiagram(content, fileType) {
        const adapter = this.getCurrentAdapter();
        return await adapter.generate(content, fileType);
    }
}

export { DiagramAdapterManager };
