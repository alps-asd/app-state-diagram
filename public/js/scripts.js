import { SEMANTIC_TERMS } from './semanticTerms.js';
import { DiagramAdapterManager } from './diagramAdapters.js';

class AlpsEditor {
    constructor() {
        this.editor = null;
        this.debounceTimer = null;
        this.alpsSchema = null;
        this.ajv = new Ajv({ allErrors: true, verbose: true });
        this.customAnnotations = [];
        this.isDebugMode = false;
        this.adapterManager = new DiagramAdapterManager();
        this.isLocalMode = window.location.protocol === 'file:'; // ローカルファイルで開いているかチェック
        // Portable static detection: prefer explicit flag; default to static when flag is absent
        const hasApi = (typeof window.ALPSEDITOR_HAS_API === 'boolean') ? window.ALPSEDITOR_HAS_API : false;
        this.isStaticMode = !hasApi || this.isLocalMode;
        // Ensure static/local environments use client-side diagramming before first preview
        if (this.isLocalMode || this.isStaticMode) {
            this.adapterManager.setAdapter('alps2dot');
        }
        this.SKELETON_SNIPPETS = [
            {
                caption: 'ALPS XML Skeleton',
                snippet: `<?xml version="1.0" encoding="UTF-8"?>
<alps version="1.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="https://alps-io.github.io/schemas/alps.xsd">
    <title>\${1:Profile Title}</title>
    <doc>\${2:}</doc>
    \${3}
</alps>`,
                meta: 'XML',
                type: 'snippet',
                score: 1000
            },
            {
                caption: 'ALPS JSON Skeleton',
                snippet: `{
    "$schema": "https://alps-io.github.io/schemas/alps.json",
    "alps": {
        "version": "1.0",
        "title": "\${1:Profile Title}",
        "doc": {
            "value": "\${2:}"
        },
        "descriptor": [
            \${3}
        ]
    }
}`,
                meta: 'JSON',
                type: 'snippet',
                score: 999
            }
        ];
        this.init();
    }

    async init() {
        document.addEventListener('DOMContentLoaded', async () => {
            this.editor = ace.edit("editor");
            this.editor.setTheme("ace/theme/github");
            this.configureAceEditor();
            await this.loadDefaultXml();
            await this.setupCompletion();
            this.setupSaveShortcut();
            this.setupDragAndDrop();
            this.setupCompleteHref();
            this.setupDownloadButton();
            this.setupAdapterSelector();
            this.setupViewModeSelector();
            this.setupDiagramClickHandler();
            this.setupEditorSelectionHandler();
        });
    }

    configureAceEditor() {
        ace.require("ace/ext/language_tools");
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            wrap: true,
        });
    }

    async loadDefaultXml() {
        try {
            // Default ALPS XML embedded directly in JavaScript - no external files needed
            const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
Welcome to Alps Editor! Let's make API design fun and effective.

Keyboard shortcuts:
- F1: Show command palette (lists all shortcuts)
- F8: Toggle Preview mode
- Ctrl + Space: Show auto-completion snippets
- Ctrl + S: Download your work

Quick tips:
- To start from scratch, clear content and press Ctrl + Space, then select "Skeleton"
- Drag and drop an ALPS file (JSON, XML, or HTML) to open it

ALPS bridges vision and implementation, creating APIs that speak business and tech fluently.

Learn more:
- User Guide: https://alps-asd.github.io/alps-editor/user-guide.html
- ALPS Editor: https://github.com/alps-asd/alps-editor
- ALPS Specification: https://alps.io/
- app-state-diagram: https://www.app-state-diagram.com/
- Vocabulary: https://www.app-state-diagram.com/manuals/1.0/en/schema-org.html

Happy modeling! Remember, solid semantics supports the long-term evolution of your APIs. :)
-->
<alps
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="https://alps-io.github.io/schemas/alps.xsd">
    <title>ALPS Online Shopping</title>
    <doc>This is a sample ALPS profile demonstrating the semantic descriptors
        and operations for a basic e-commerce system. It includes product listing,
        shopping cart management, and checkout process, serving as an educational
        example for ALPS implementation in online shopping contexts.</doc>

    <!-- Links -->
    <link rel="help" href="https://editor.app-state-diagram.com/user-guide.html" title="ALPS Editor User Guide"/>
    <link rel="help" href="https://www.app-state-diagram.com/" title="app-state-diagram"/>
    <link rel="help" href="https://datatracker.ietf.org/doc/html/draft-amundsen-richardson-foster-alps-07" title="ALPS Specification"/>
    <link rel="describedby" href="https://www.app-state-diagram.com/manuals/1.0/en/schema-org.html" title="Vocabulary Guide"/>

    <!-- Ontology -->
    <descriptor id="id" def="https://schema.org/identifier" title="identifier"/>
    <descriptor id="name" def="https://schema.org/name" title="name"/>
    <descriptor id="description" def="https://schema.org/description" title="description"/>
    <descriptor id="price" def="https://schema.org/price" title="price"/>
    <descriptor id="quantity" def="https://schema.org/Quantity" title="quantity"/>
    <descriptor id="email" def="https://schema.org/email" title="email"/>
    <descriptor id="address" def="https://schema.org/address" title="address"/>
    <descriptor id="reviewBody" def="https://schema.org/reviewBody" title="review text"/>
    <descriptor id="rating" def="https://schema.org/ratingValue" title="rating"/>

    <!-- Taxonomy -->
    <descriptor id="Home" title="Home Page" tag="flow-browse">
        <descriptor href="#goProductList"/>
    </descriptor>

    <descriptor id="ProductList" def="https://schema.org/ItemList" title="Product List" tag="collection flow-browse">
        <descriptor href="#id"/>
        <descriptor href="#name"/>
        <descriptor href="#description"/>
        <descriptor href="#goProductDetail"/>
        <descriptor href="#goCart"/>
    </descriptor>

    <descriptor id="ProductDetail" def="https://schema.org/Product" title="Product Detail" tag="item flow-browse flow-purchase flow-review">
        <descriptor href="#id"/>
        <descriptor href="#name"/>
        <descriptor href="#description"/>
        <descriptor href="#price"/>
        <descriptor href="#goProductList"/>
        <descriptor href="#doAddToCart"/>
        <descriptor href="#goReviewForm"/>
    </descriptor>

    <descriptor id="ReviewForm" def="https://schema.org/Review" title="Review Form" tag="flow-review">
        <descriptor href="#id"/>
        <descriptor href="#reviewBody"/>
        <descriptor href="#rating"/>
        <descriptor href="#goProductDetail"/>
        <descriptor href="#doSubmitReview"/>
    </descriptor>

    <descriptor id="Cart" def="https://schema.org/Cart" title="Shopping Cart" tag="collection flow-purchase">
        <descriptor href="#id"/>
        <descriptor href="#name"/>
        <descriptor href="#price"/>
        <descriptor href="#quantity"/>
        <descriptor href="#goProductList"/>
        <descriptor href="#goProductDetail"/>
        <descriptor href="#goCheckout"/>
        <descriptor href="#doUpdateQuantity"/>
        <descriptor href="#doRemoveItem"/>
    </descriptor>

    <descriptor id="Checkout" title="Checkout" tag="flow-purchase">
        <doc>Available only when cart has at least one item. Guest users can proceed without account.</doc>
        <descriptor href="#price"/>
        <descriptor href="#email"/>
        <descriptor href="#address"/>
        <descriptor href="#goCart"/>
        <descriptor href="#goPayment"/>
    </descriptor>

    <descriptor id="Payment" def="https://schema.org/PayAction" title="Payment" tag="flow-purchase">
        <descriptor href="#price"/>
        <descriptor href="#goCart"/>
        <descriptor href="#doPayment"/>
    </descriptor>

    <!-- Choreography -->
    <descriptor id="goProductList" type="safe" rt="#ProductList" rel="collection" title="View product list"/>

    <descriptor id="goProductDetail" type="safe" rt="#ProductDetail" rel="item" title="View product details">
        <descriptor href="#id"/>
    </descriptor>

    <descriptor id="goCart" type="safe" rt="#Cart" rel="collection" title="View shopping cart"/>

    <descriptor id="goCheckout" type="safe" rt="#Checkout" title="Proceed to checkout"/>

    <descriptor id="goPayment" type="safe" rt="#Payment" title="Proceed to payment"/>

    <descriptor id="goReviewForm" type="safe" rt="#ReviewForm" title="Write a review">
        <descriptor href="#id"/>
    </descriptor>

    <descriptor id="doAddToCart" type="unsafe" rt="#Cart" title="Add to cart">
        <doc>Adds product to cart. If the same product already exists, increments quantity instead of creating a duplicate entry.</doc>
        <descriptor href="#id"/>
        <descriptor href="#quantity"/>
    </descriptor>

    <descriptor id="doUpdateQuantity" type="idempotent" rt="#Cart" title="Update item quantity">
        <doc>Updates the quantity of an item in the cart. Set to 0 to remove.</doc>
        <descriptor href="#id"/>
        <descriptor href="#quantity"/>
    </descriptor>

    <descriptor id="doRemoveItem" type="idempotent" rt="#Cart" title="Remove item from cart">
        <doc>Removes the specified item from the cart completely.</doc>
        <descriptor href="#id"/>
    </descriptor>

    <descriptor id="doSubmitReview" type="unsafe" rt="#ProductDetail" title="Submit review">
        <doc>Submits a product review with rating and comment.</doc>
        <descriptor href="#id"/>
        <descriptor href="#reviewBody"/>
        <descriptor href="#rating"/>
    </descriptor>

    <descriptor id="doPayment" type="idempotent" rt="#ProductList" title="Complete payment">
        <doc>Processes payment and completes the order. Clears the cart on success.</doc>
    </descriptor>

</alps>`;

            this.editor.setValue(defaultXml);
            this.editor.getSession().setMode("ace/mode/xml");
        } catch (error) {
            this.handleError(error, 'Failed to load default XML');
        }
    }

    async setupCompletion() {
        try {
            if (this.isLocalMode) {
                // ローカルモード用の簡易スキーマ
                this.alpsSchema = {
                    type: "object",
                    properties: {
                        alps: {
                            type: "object",
                            properties: {
                                version: { type: "string" },
                                title: { type: "string" },
                                doc: { type: ["string", "object"] },
                                descriptor: {
                                    type: "array",
                                    items: { type: "object" }
                                }
                            }
                        }
                    }
                };
            } else {
                const schemaResponse = await axios.get('schemas/alps.json');
                this.alpsSchema = schemaResponse.data;
            }
        } catch (error) {
            this.handleError(error, 'Failed to load ALPS schema');
        }

        const originalSetAnnotations = this.editor.getSession().setAnnotations.bind(this.editor.getSession());
        this.editor.getSession().setAnnotations = (annotations) => {
            const combinedAnnotations = (annotations || []).concat(this.customAnnotations);
            originalSetAnnotations(combinedAnnotations);
        };

        this.editor.getSession().on('change', () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.validateAndPreview(), 300);
        });

        this.validateAndPreview();
    }

    setupSaveShortcut() {
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                // Ctrl+S saves Profile (ALPS source)
                document.getElementById('downloadProfile')?.click();
            }
            // F8 toggles Preview mode on/off (returns to previous mode)
            if (event.key === 'F8') {
                event.preventDefault();
                this.togglePreviewMode();
            }
        });
    }

    togglePreviewMode() {
        const selector = document.getElementById('viewMode');
        if (!selector) return;

        if (selector.value === 'preview') {
            // Return to previous mode (stored before entering preview)
            const previousMode = this.previousViewMode || 'document';
            selector.value = previousMode;
            this.applyViewMode(previousMode);
        } else {
            // Save current mode and switch to preview
            this.previousViewMode = selector.value;
            selector.value = 'preview';
            this.applyViewMode('preview');
        }
    }

    setupDragAndDrop() {
        const dropArea = document.getElementById('editor-container');
        dropArea.addEventListener('dragover', (event) => event.preventDefault());

        dropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    let content = e.target.result;
                    const fileExtension = file.name.split('.').pop().toLowerCase();

                    if (fileExtension === 'html') {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(content, 'text/html');
                        const codeElement = doc.querySelector('code');
                        if (codeElement) {
                            content = this.unescapeHtml(codeElement.textContent);
                        } else {
                            console.warn('No <code> element found in HTML file');
                            return;
                        }
                    }

                    this.editor.setValue(content);
                    console.log('Dropped:', file.name);
                    this.validateAndPreview();
                };
                reader.readAsText(file);
            }
        });
    }

    unescapeHtml(html) {
        const txt = document.createElement('textarea');
        txt.textContent = html; // Use textContent instead of innerHTML to prevent XSS
        return txt.value;
    }

    setupCompleteHref() {
        this.editor.commands.on('afterExec', (e) => {
            if (e.command.name === 'insertstring' && e.args === '#') {
                const existingCompleters = this.editor.completers || [];
                this.editor.completers = [this.hrefCompleter()];
                this.editor.execCommand('startAutocomplete');
                this.editor.completers = existingCompleters;
            }
        });
    }

    detectFileType(content) {
        content = content.trim();
        if (content.startsWith('{') || content.startsWith('[')) return 'JSON';
        if (content.startsWith('<')) return 'XML';
        return 'Unknown';
    }

    async validateAndPreview() {
        const content = this.editor.getValue();
        const fileType = this.detectFileType(content);
        document.getElementById('fileTypeDisplay').textContent = fileType;

        let validationResult;
        if (fileType === 'JSON') {
            this.editor.getSession().setMode('ace/mode/json');
            validationResult = this.validateJson(content);
            this.editor.completers = [this.alpsJsonCompleter()];
        } else if (fileType === 'XML') {
            this.editor.getSession().setMode('ace/mode/xml');
            validationResult = this.validateXml(content);
            this.editor.completers = [this.alpsXmlCompleter()];
        } else {
            validationResult = { isValid: false, errors: [{ row: 0, column: 0, text: 'Unknown file type', type: 'error' }] };
        }

        this.debugLog(`File type: ${fileType}, Local Validation: ${validationResult.isValid ? 'Success' : 'Failure'}`);

        if (validationResult.isValid) {
            await this.updatePreview(content, fileType);
        } else {
            this.updateValidationMark(false);
            this.displayErrors(validationResult.errors);
        }

        this.editor.getSession().setAnnotations(validationResult.errors);
    }

    async updatePreview(content, fileType) {
        try {
            this.debugLog(`Using ${this.adapterManager.getCurrentAdapter().getName()} for diagram generation`);

            // Use the adapter manager to generate diagram
            const url = await this.adapterManager.generateDiagram(content, fileType);

            const iframe = document.getElementById('preview-frame');
            iframe.src = url;
            // Apply view mode after iframe loads
            iframe.onload = () => {
                const mode = document.getElementById('viewMode')?.value || 'document';
                this.applyViewMode(mode);
            };
            this.debugLog('Preview updated');
            this.updateValidationMark(true);
            this.displayErrors([]);

        } catch (error) {
            this.handleError(error, 'Diagram generation failed');
            this.updateValidationMark(false);
            const apiErrors = [{
                row: 0,
                column: 0,
                text: 'Diagram generation failed: ' + error.message,
                type: 'error'
            }];
            this.displayErrors(apiErrors);
        }
    }

    setupAdapterSelector() {
        // Always use alps2dot adapter
        this.adapterManager.setAdapter('alps2dot');
    }

    setupViewModeSelector() {
        const selector = document.getElementById('viewMode');
        if (!selector) return;

        // Always start with Document mode (default)
        selector.value = 'document';

        selector.addEventListener('change', (event) => {
            const mode = event.target.value;
            this.applyViewMode(mode);
        });
    }

    applyViewMode(mode) {
        const iframe = document.getElementById('preview-frame');
        const editorContainer = document.getElementById('editor-container');

        // Handle editor visibility for preview mode
        if (editorContainer) {
            editorContainer.style.display = mode === 'preview' ? 'none' : '';
        }

        if (!iframe?.contentDocument) return;

        const doc = iframe.contentDocument;
        const isDiagramOnly = mode === 'diagram';
        const elementsToToggle = doc.querySelectorAll('.legend, table, h2, .selector-container');
        const linksSection = doc.querySelector('h2 + ul'); // Links section

        elementsToToggle.forEach(el => {
            el.style.display = isDiagramOnly ? 'none' : '';
        });
        if (linksSection) {
            linksSection.style.display = isDiagramOnly ? 'none' : '';
        }

        // Hide h1 title and doc paragraph in diagram mode
        const title = doc.querySelector('h1');
        const docPara = doc.querySelector('h1 + p');
        if (title) title.style.display = isDiagramOnly ? 'none' : '';
        if (docPara) docPara.style.display = isDiagramOnly ? 'none' : '';

        // Hide diagram controls in diagram mode (Label/Size selectors)
        const controls = doc.querySelector('.diagram-controls');
        if (controls) controls.style.display = isDiagramOnly ? 'none' : '';
    }

    displayErrors(errors) {
        const errorContainer = document.getElementById('error-container');
        if (!errors.length) {
            errorContainer.style.display = 'none';
            return;
        }

        // Clear container and create elements safely to prevent XSS
        errorContainer.innerHTML = '';

        const errorTitle = document.createElement('div');
        errorTitle.className = 'error-title';
        errorTitle.textContent = 'Errors';
        errorContainer.appendChild(errorTitle);

        errors.forEach(error => {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.text;

            const errorLocation = document.createElement('div');
            errorLocation.className = 'error-location';
            errorLocation.textContent = `Line: ${error.row + 1}, Column: ${error.column + 1}`;

            errorContainer.appendChild(errorMessage);
            errorContainer.appendChild(errorLocation);
        });
        errorContainer.style.display = 'block';
    }

    validateJson(content) {
        try {
            const data = JSON.parse(content);
            const validate = this.ajv.compile(this.alpsSchema);
            if (!validate(data)) {
                this.debugLog('JSON schema validation failed');
                const errors = this.processAjvErrors(validate.errors, content);
                return { isValid: false, errors };
            }
            return { isValid: true, errors: [] };
        } catch (error) {
            const position = this.getPositionFromJsonParseError(error, content);
            return {
                isValid: false,
                errors: [{ row: position.line, column: position.column, text: `JSON Parse Error: ${error.message}`, type: 'error' }]
            };
        }
    }

    getPositionFromJsonParseError(error, content) {
        const match = error.message.match(/at position (\d+)/);
        if (match) {
            const position = parseInt(match[1], 10);
            const lines = content.slice(0, position).split('\n');
            return { line: lines.length - 1, column: lines[lines.length - 1].length };
        }
        return { line: 0, column: 0 };
    }

    processAjvErrors(ajvErrors, content) {
        return ajvErrors.map(error => {
            const location = this.getLocationFromJsonPointer(error.dataPath, content);
            return {
                row: location.line,
                column: location.column,
                text: `Schema Error: ${error.message} at ${error.dataPath}`,
                type: 'error'
            };
        });
    }

    getLocationFromJsonPointer(jsonPointer, content) {
        try {
            const path = jsonPointer.split('/').slice(1);
            let currentObj = JSON.parse(content);
            let line = 0;
            let column = 0;

            for (const key of path) {
                if (currentObj.hasOwnProperty(key)) {
                    const index = content.indexOf(`"${key}"`);
                    if (index !== -1) {
                        const beforeKey = content.slice(0, index);
                        const lines = beforeKey.split('\n');
                        line = lines.length - 1;
                        column = lines[lines.length - 1].length;
                        currentObj = currentObj[key];
                    } else {
                        return { line: 0, column: 0 };
                    }
                } else {
                    return { line: 0, column: 0 };
                }
            }

            return { line, column };
        } catch (e) {
            return { line: 0, column: 0 };
        }
    }

    validateXml(content) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const parseError = xmlDoc.getElementsByTagName('parsererror')[0];

        if (parseError) {
            const errorMessage = parseError.textContent || "Unknown XML parse error";
            this.debugLog('Invalid XML form');
            const lineMatch = errorMessage.match(/line (\d+)/);
            const columnMatch = errorMessage.match(/column (\d+)/);
            const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;
            const column = columnMatch ? parseInt(columnMatch[1], 10) - 1 : 0;

            return {
                isValid: false,
                errors: [{ row: line, column: column, text: `XML Parse Error: ${errorMessage}`, type: 'error' }]
            };
        }
        return { isValid: true, errors: [] };
    }

    updateValidationMark(isValid) {
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            if (isValid) {
                downloadBtn.classList.remove('disabled');
            } else {
                downloadBtn.classList.add('disabled');
            }
        }
    }

    setupDownloadButton() {
        // HTML download - get from iframe (Profile already embedded as hidden)
        document.getElementById('downloadHtml')?.addEventListener('click', () => {
            const iframe = document.getElementById('preview-frame');
            if (!iframe?.contentDocument) {
                alert('No preview available');
                return;
            }
            const html = '<!DOCTYPE html>' + iframe.contentDocument.documentElement.outerHTML;
            this.downloadFile(html, 'alps.html', 'text/html');
            this.closeDownloadMenu();
        });

        // SVG download - extract from iframe
        document.getElementById('downloadSvg')?.addEventListener('click', () => {
            const iframe = document.getElementById('preview-frame');
            const svg = iframe?.contentDocument?.querySelector('#svg-graph svg');
            if (!svg) {
                alert('No SVG available');
                return;
            }
            const svgData = new XMLSerializer().serializeToString(svg);
            this.downloadFile(svgData, 'alps-diagram.svg', 'image/svg+xml');
            this.closeDownloadMenu();
        });

        // Profile download - ALPS source from editor
        document.getElementById('downloadProfile')?.addEventListener('click', () => {
            const content = this.editor.getValue();
            const fileType = this.detectFileType(content);
            const filename = fileType === 'JSON' ? 'alps-profile.json' : 'alps-profile.xml';
            const mimeType = fileType === 'JSON' ? 'application/json' : 'application/xml';
            this.downloadFile(content, filename, mimeType);
            this.closeDownloadMenu();
        });
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.debugLog(`Downloaded: ${filename}`);
    }

    closeDownloadMenu() {
        const menu = document.querySelector('.download-menu');
        if (menu) menu.removeAttribute('open');
    }

    debugLog(message) {
        if (this.isDebugMode) {
            const debugElement = document.getElementById('debug');
            debugElement.textContent += `${new Date().toISOString()}: ${message}\n`;
            debugElement.scrollTop = debugElement.scrollHeight;
        }
    }

    handleError(error, message) {
        console.error(message, error);
        this.debugLog(`${message}: ${error.message}`);
    }

    extractIdsFromContent(content) {
        const ids = [];
        const regex = this.detectFileType(content) === 'JSON' ? /"id"\s*:\s*"([^"]+)"/g : /id=["']([^"']+)["']/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) ids.push(match[1]);
        }
        return ids;
    }

    hrefCompleter() {
        return {
            getCompletions: (editor, session, pos, prefix, callback) => {
                const cursorPosition = editor.getCursorPosition();
                const line = editor.session.getLine(cursorPosition.row);

                if (line[cursorPosition.column - 1] === '#' && line[cursorPosition.column - 2] === '"') {
                    const content = editor.getValue();
                    const suggestions = this.extractIdsFromContent(content);

                    callback(null, suggestions.map(word => ({ caption: word, value: word, meta: 'id' })));
                } else {
                    callback(null, []);
                }
            },
        };
    }

    alpsJsonCompleter() {
        const DESCRIPTOR_TYPES = ['safe', 'unsafe', 'idempotent'];
        return {
            getCompletions: (editor, session, pos, prefix, callback) => {
                const content = editor.getValue();
                if (!content) {
                    callback(null, [...this.SKELETON_SNIPPETS].sort((a, b) => {
                        return a.meta === 'JSON Skeleton' ? -1 : 1;
                    }));
                    return;
                }
                const ids = this.extractIdsFromContent(content);
                const dynamicHrefOptions = ids.join(',');

                const snippets = [
                    {
                        caption: 'Ontology',
                        snippet: `{"id":"\${1|${SEMANTIC_TERMS.join(',')}|}", "title": "\${2}"}`,
                        meta: 'id',
                    },
                    {
                        caption: 'Ontology',
                        snippet: `{"href": "#\${1|${dynamicHrefOptions}|}"}`,
                        meta: 'href',
                    },
                    {
                        caption: 'Taxonomy',
                        snippet: `{"id":"\${1|${SEMANTIC_TERMS.join(',')}|}", "title": "\${2}", "descriptor": [
    {"href": "#\${3|${dynamicHrefOptions}|}"}
]}`,
                    },
                    {
                        caption: 'Choreography',
                        snippet: `{"id":"\${1}", "title": "\${2}", "type": "\${3|${DESCRIPTOR_TYPES.join(
                            ','
                        )}|}", "rt": "#\${4|${dynamicHrefOptions}|}"}`,
                        meta: 'no-parameter',
                    },
                    {
                        caption: 'Choreography',
                        snippet: `{"id":"\${1}", "title": "\${2}", "type": "\${3|${DESCRIPTOR_TYPES.join(
                            ','
                        )}|}", "rt": "#\${4|${dynamicHrefOptions}|}", "descriptor": [
    {"href": "#\${5|${dynamicHrefOptions}|}"}
]}`,
                        meta: 'with-parameter',
                    },
                ];

                const completions = snippets.map((snippet, index) => ({
                    caption: snippet.caption,
                    snippet: snippet.snippet,
                    meta: snippet.meta,
                    type: 'snippet',
                    score: 1000 - index,
                }));
                callback(null, completions);
            },
        };
    }

    alpsXmlCompleter() {
        const DESCRIPTOR_TYPES = ['safe', 'unsafe', 'idempotent'];
        return {
            getCompletions: (editor, session, pos, prefix, callback) => {
                const content = editor.getValue();
                if (!content) {
                    callback(null, [...this.SKELETON_SNIPPETS].sort((a, b) => {
                        return a.meta === 'XML Skeleton' ? -1 : 1;
                    }));
                    return;
                }
                const ids = this.extractIdsFromContent(content);
                const dynamicHrefOptions = ids.join(',');


                const snippets = [
                    {
                        caption: 'Ontology',
                        snippet: `<descriptor id="\${1|${SEMANTIC_TERMS.join(',')}|}" title="\${2}"/>`,
                        meta: 'id',
                    },
                    {
                        caption: 'Ontology',
                        snippet: `<descriptor href="#\${1|${dynamicHrefOptions}|}"/>`,
                        meta: 'href',
                    },
                    {
                        caption: 'Taxonomy',
                        snippet: `<descriptor id="\${1|${SEMANTIC_TERMS.join(
                            ','
                        )}|}" title="\${2}">
    <descriptor href="#\${3|${dynamicHrefOptions}|}"/>
</descriptor>`,
                    },
                    {
                        caption: 'Choreography',
                        snippet: `<descriptor id="\${1|${SEMANTIC_TERMS.join(',')}|}" title="\${2}" type="\${3|${DESCRIPTOR_TYPES.join(
                            ','
                        )}|}" rt="#\${4|${dynamicHrefOptions}|}"/>`,
                        meta: 'no-parameter',
                    },
                    {
                        caption: 'Choreography',
                        snippet: `<descriptor id="\${1|${SEMANTIC_TERMS.join(',')}|}" title="\${2}" type="\${3|${DESCRIPTOR_TYPES.join(
                            ','
                        )}|}" rt="#\${4|${dynamicHrefOptions}|}">
    <descriptor href="#\${5|${dynamicHrefOptions}|}"/>
</descriptor>`,
                        meta: 'with-parameter',
                    },
                ];

                const completions = snippets.map((snippet, index) => ({
                    caption: snippet.caption,
                    snippet: snippet.snippet,
                    meta: snippet.meta,
                    type: 'snippet',
                    score: 1000 - index,
                }));
                callback(null, completions);
            },
        };
    }

    setupDiagramClickHandler() {
        // Listen for messages from iframe diagram
        window.addEventListener('message', (event) => {
            // Validate origin for defense-in-depth security
            if (event.origin !== window.location.origin) return;

            if (event.data && event.data.type === 'jumpToId') {
                const id = event.data.id;
                console.log('Jumping to ID:', id);

                // In Preview mode, scroll to table row instead of editor
                const viewMode = document.getElementById('viewMode')?.value;
                if (viewMode === 'preview') {
                    const iframe = document.getElementById('preview-frame');
                    if (iframe?.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'scrollToDescriptor',
                            id: id
                        }, '*');
                    }
                } else {
                    this.jumpToId(id);
                }
            }
            // Handle F8 from iframe
            if (event.data && event.data.type === 'togglePreview') {
                this.togglePreviewMode();
            }
        });
    }

    jumpToId(id) {
        if (!this.editor || !id) return;

        // Search for id="searchId" in the editor content
        const searchTerm = `id="${id}"`;
        console.log('Searching for:', searchTerm);

        // Find the text first
        const range = this.editor.find(searchTerm, {
            backwards: false,
            wrap: true,
            caseSensitive: true,
            wholeWord: false,
            regExp: false
        });

        if (range) {
            // Get the line number where the match was found
            const lineNumber = range.start.row;

            // Select the entire line
            this.editor.selection.selectLine();

            console.log('Selected entire line:', lineNumber);
        }

        // Focus the editor after search
        this.editor.focus();
    }

    setupEditorSelectionHandler() {
        if (!this.editor) return;

        // Listen for selection changes in the editor
        this.editor.on('changeSelection', () => {
            const selectedText = this.editor.getSelectedText();
            if (selectedText) {
                console.log('Selected text:', selectedText);
                this.highlightInDiagram(selectedText);
            } else {
                // Clear highlights when no selection
                this.clearDiagramHighlights();
            }
        });
    }

    highlightInDiagram(selectedText) {
        // Send message to diagram iframe to highlight elements
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'highlightElement',
                text: selectedText
            }, '*');
            console.log('Sent highlight message to diagram:', selectedText);
        }
    }

    clearDiagramHighlights() {
        // Send message to diagram iframe to clear highlights
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'clearHighlights'
            }, '*');
        }
    }
}

new AlpsEditor();
