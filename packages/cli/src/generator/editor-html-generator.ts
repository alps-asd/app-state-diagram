/**
 * Editor HTML Generator
 *
 * Generates HTML that loads alps-editor with pre-loaded content.
 * The editor is hosted at https://editor.app-state-diagram.com/
 */

const EDITOR_BASE_URL = 'https://editor.app-state-diagram.com';

/**
 * Escape content for embedding in JavaScript string
 */
function escapeForJs(content: string): string {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

/**
 * Generate HTML that loads alps-editor with pre-loaded ALPS content
 */
export function generateEditorHtml(alpsContent: string, title?: string): string {
  const pageTitle = title || 'ALPS Editor';
  const escapedContent = escapeForJs(alpsContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="${EDITOR_BASE_URL}/js/styles.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.3.4/axios.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.9.6/ace.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.9.6/ext-language_tools.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ajv/6.12.6/ajv.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/json-to-ast@2.1.0/build.min.js"></script>
    <script src="https://unpkg.com/viz.js@2.1.2/viz.js"></script>
    <script src="https://unpkg.com/viz.js@2.1.2/lite.render.js"></script>
    <script>
        window.ALPSEDITOR_HAS_API = false;
        window.ALPS_INITIAL_CONTENT = \`${escapedContent}\`;
    </script>
</head>
<body>

<div id="top-bar">
    <div id="title">${pageTitle}</div>
    <div id="controls">
        <span id="fileTypeDisplay"></span>
        <select id="viewMode">
            <option value="document">Document</option>
            <option value="diagram">Diagram</option>
            <option value="preview">Preview</option>
        </select>
        <details class="download-menu">
            <summary id="downloadBtn">Download</summary>
            <div class="download-options">
                <button id="downloadHtml">HTML</button>
                <button id="downloadSvg">SVG</button>
                <button id="downloadProfile">Profile</button>
            </div>
        </details>
    </div>
</div>
<div id="main-container">
    <div id="editor-container">
        <div id="editor"></div>
    </div>
    <div id="preview-container">
        <div id="error-container"></div>
        <iframe id="preview-frame" src="about:blank"></iframe>
    </div>
</div>
<div id="debug"></div>
<script type="module" src="${EDITOR_BASE_URL}/js/scripts.js"></script>
</body>
</html>`;
}
