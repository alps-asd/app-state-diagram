/**
 * descriptor2table.js
 *
 * Converts ALPS descriptor array to HTML table.
 * Port of PHP DumpDocs::getSemanticDescriptorMarkDown()
 */

/**
 * @typedef {Object} Descriptor
 * @property {string} id
 * @property {string} type - "semantic" | "safe" | "unsafe" | "idempotent"
 * @property {string} [title]
 * @property {string} [def]
 * @property {string} [doc]
 * @property {string} [rel]
 * @property {string} [rt]
 * @property {string} [tag] - space-separated tags
 * @property {Array<{id?: string, href?: string, type?: string}>} [descriptor] - contained descriptors
 * @property {Object} [link] - link relations
 */

/**
 * Check if string is a valid URL
 * @param {string} text
 * @returns {boolean}
 */
function isUrl(text) {
    try {
        new URL(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Create meta item HTML
 * @param {string} label
 * @param {string} value
 * @param {string} [cssClass='']
 * @param {string} [url='']
 * @param {string} [title='']
 * @returns {string}
 */
function createMetaItem(label, value, cssClass = '', url = '', title = '') {
    let valueHtml = escapeHtml(value);
    const attrs = [];

    if (url) {
        let displayValue = value;
        let targetBlank = '';

        if (isUrl(url)) {
            displayValue = displayValue.replace(/^https?:\/\//, '');
            targetBlank = ' target="_blank"';
        }

        if (displayValue.length > 30) {
            displayValue = displayValue.substring(0, 27) + '...';
        }

        valueHtml = `<a href="${url}"${targetBlank}>${escapeHtml(displayValue)}</a>`;
    }

    if (value && value.length > 140) {
        attrs.push(`data-full="${escapeHtml(value)}"`);
    }

    if (title) {
        attrs.push(`title="${escapeHtml(title)}"`);
    }

    const attrString = attrs.length ? ' ' + attrs.join(' ') : '';

    return `<span class="meta-item"><span class="meta-label">${label}:</span><span class="meta-tag ${cssClass}"${attrString}>${valueHtml}</span></span>`;
}

/**
 * Get descriptor property value as HTML
 * @param {string} key
 * @param {Descriptor} descriptor
 * @returns {string}
 */
function getDescriptorPropValue(key, descriptor) {
    const value = descriptor[key];
    if (!value) return '';

    switch (key) {
        case 'def':
            if (isUrl(value)) {
                return createMetaItem('def', value, 'def-tag', value);
            }
            return createMetaItem('def', value, 'def-tag');

        case 'rel':
            return createMetaItem('rel', value, 'rel-tag');

        case 'rt':
            return createMetaItem('rt', value, 'rt-tag', `#${value}`);

        case 'doc': {
            // doc can be string or object {value: "..."}
            const docText = typeof value === 'object' ? (value.value || '') : value;
            if (!docText) return '';
            if (docText.length > 140) {
                return createMetaItem('doc', docText, 'doc-tag clickable', '', docText);
            }
            return createMetaItem('doc', docText, 'doc-tag');
        }

        default:
            return createMetaItem(key, value);
    }
}

/**
 * Get tag string as HTML
 * @param {string[]} tags
 * @returns {string}
 */
function getTagString(tags) {
    if (!tags || tags.length === 0) return '';

    const tagLinks = tags.map(tag => {
        const safeTag = escapeHtml(tag);
        return `<span class="meta-tag tag-tag"><a href="#tag-${safeTag}">${safeTag}</a></span>`;
    });

    return `<span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values">${tagLinks.join(' ')}</span></span>`;
}

/**
 * Get contained descriptors as HTML
 * @param {Descriptor} descriptor
 * @param {Object<string, Descriptor>} allDescriptors - lookup map
 * @returns {string}
 */
function getContainedDescriptors(descriptor, allDescriptors) {
    if (!descriptor.descriptor || descriptor.descriptor.length === 0) {
        return '';
    }

    const contained = [];
    for (const item of descriptor.descriptor) {
        let id = item.id;
        if (!id && item.href) {
            // Extract id from href like "#goBlog"
            const match = item.href.match(/#(.+)/);
            if (match) id = match[1];
        }

        if (id && allDescriptors[id]) {
            contained.push(allDescriptors[id]);
        }
    }

    if (contained.length === 0) return '';

    // Sort by type order
    const typeOrder = { semantic: 0, safe: 1, unsafe: 2, idempotent: 3 };
    contained.sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));

    const links = contained.map(desc => {
        const typeClass = desc.type;
        const typeTitle = typeClass.charAt(0).toUpperCase() + typeClass.slice(1);
        const safeId = escapeHtml(desc.id);
        return `<span class="type-indicator-small ${typeClass}" title="${typeTitle}"></span><a href="#${safeId}">${safeId}</a>`;
    });

    return links.join('<br>');
}

/**
 * Get extras (def, tags, rel, rt, doc, link) as HTML
 * @param {Descriptor} descriptor
 * @returns {string}
 */
function getExtras(descriptor) {
    const extras = [];

    extras.push(getDescriptorPropValue('def', descriptor));
    extras.push(getTagString(descriptor.tag ? descriptor.tag.split(/\s+/) : []));
    extras.push(getDescriptorPropValue('rel', descriptor));
    extras.push(getDescriptorPropValue('rt', descriptor));
    extras.push(getDescriptorPropValue('doc', descriptor));

    // Link relations (can be single object or array)
    if (descriptor.link) {
        const links = Array.isArray(descriptor.link) ? descriptor.link : [descriptor.link];
        for (const link of links) {
            const linkHtml = `<a href="${escapeHtml(link.href)}">${escapeHtml(link.title || link.rel)}</a>`;
            extras.push(createMetaItem('link', linkHtml, 'link-tag'));
        }
    }

    const filtered = extras.filter(e => e);
    if (filtered.length === 0) return '';

    return `<span class="meta-container">${filtered.join('')}</span>`;
}

/**
 * Build table row for a descriptor
 * @param {Descriptor} descriptor
 * @param {Object<string, Descriptor>} allDescriptors
 * @returns {string}
 */
function buildTableRow(descriptor, allDescriptors) {
    const typeIcon = `<span class="legend"><span class="legend-icon ${descriptor.type}"></span></span>`;
    const safeId = escapeHtml(descriptor.id);
    const id = `<a id="${safeId}"></a><a href="#${safeId}" class="descriptor-id-link">${safeId}</a>`;
    const title = `<span style="white-space: normal;">${escapeHtml(descriptor.title || '')}</span>`;
    const contained = getContainedDescriptors(descriptor, allDescriptors);
    const extras = `<span style="white-space: normal;">${getExtras(descriptor)}</span>`;

    return `<tr id="descriptor-${safeId}">
  <td align="center">${typeIcon}</td>
  <td align="left">${id}</td>
  <td align="left">${title}</td>
  <td align="left">${contained}</td>
  <td align="left">${extras}</td>
</tr>`;
}

/**
 * Convert descriptors array to HTML table
 * @param {Descriptor[]} descriptors
 * @returns {string}
 */
function descriptor2table(descriptors) {
    // Create lookup map
    const descriptorMap = {};
    for (const desc of descriptors) {
        descriptorMap[desc.id] = desc;
    }

    // Sort by id (case-insensitive)
    const sorted = [...descriptors].sort((a, b) =>
        a.id.toLowerCase().localeCompare(b.id.toLowerCase())
    );

    const header = `<h2>Semantic Descriptors</h2>

<table>
<thead>
<tr>
  <th align="center">Type</th>
  <th align="left">ID</th>
  <th align="left">Title</th>
  <th align="left">Contained</th>
  <th align="left">Extra Info</th>
</tr>
</thead>
<tbody>`;

    const rows = sorted.map(desc => buildTableRow(desc, descriptorMap));

    const footer = `</tbody>
</table>`;

    return header + '\n' + rows.join('\n') + '\n' + footer;
}

/**
 * Flatten nested descriptors from ALPS data
 * @param {Object} alpsData - ALPS data object
 * @returns {Descriptor[]}
 */
function flattenDescriptors(alpsData) {
    const descriptors = alpsData?.alps?.descriptor || alpsData?.descriptor || [];
    const result = [];
    const map = {};

    // Collect all descriptors by id
    function collect(descs) {
        if (!descs) return;
        for (const d of descs) {
            if (d.id) {
                map[d.id] = { ...d, type: d.type || 'semantic' };
            }
            if (d.descriptor) {
                collect(d.descriptor);
            }
        }
    }
    collect(descriptors);

    // Build flat list with resolved types
    for (const id in map) {
        result.push(map[id]);
    }

    return result;
}

/**
 * Extract unique tags from descriptors
 * @param {Descriptor[]} descriptors
 * @returns {string[]}
 */
function extractTags(descriptors) {
    const tags = new Set();
    for (const desc of descriptors) {
        if (desc.tag) {
            // tag is space-separated
            desc.tag.split(/\s+/).forEach(t => tags.add(t.trim()));
        }
    }
    return [...tags].sort();
}

/**
 * Get descriptor IDs that have a specific tag
 * @param {Descriptor[]} descriptors
 * @param {string} tag
 * @returns {string[]}
 */
function getDescriptorIdsByTag(descriptors, tag) {
    return descriptors
        .filter(desc => desc.tag && desc.tag.split(/\s+/).includes(tag))
        .map(desc => desc.id);
}

/**
 * Generate tag selector HTML
 * @param {string[]} tags
 * @returns {string}
 */
function generateTagSelector(tags) {
    if (tags.length === 0) return '';

    const options = tags.map(tag => {
        const safeTag = escapeHtml(tag);
        return `<span class="selector-option">
            <input type="checkbox" id="tag-${safeTag}" class="tag-trigger-checkbox" data-tag="${safeTag}" name="tag-${safeTag}">
            <label for="tag-${safeTag}"> ${safeTag}</label>
        </span>`;
    }).join('');

    return `<span class="selector-label">Tags:</span>${options}`;
}

/**
 * Extract links from ALPS data
 * @param {Object} alpsData - ALPS data object
 * @returns {Array<{rel: string, href: string, title?: string}>}
 */
function extractLinks(alpsData) {
    const alps = alpsData?.alps || alpsData;
    const link = alps?.link;

    if (!link) return [];

    // Normalize to array
    const links = Array.isArray(link) ? link : [link];

    return links.map(l => ({
        rel: l.rel || '',
        href: l.href || '',
        title: l.title || ''
    })).sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * Generate Links section HTML
 * @param {Array<{rel: string, href: string, title?: string}>} links
 * @returns {string}
 */
function generateLinksHtml(links) {
    if (links.length === 0) return '';

    const items = links.map(link => {
        const label = link.title || link.rel;
        return `<li><a rel="${escapeHtml(link.rel)}" href="${escapeHtml(link.href)}">${escapeHtml(label)}</a></li>`;
    }).join('\n');

    return `<h2>Links</h2>
<ul>
${items}
</ul>`;
}

// Export for ES modules (browser)
export { descriptor2table, flattenDescriptors, extractTags, generateTagSelector, getDescriptorIdsByTag, extractLinks, generateLinksHtml, escapeHtml, isUrl };

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { descriptor2table, flattenDescriptors, extractTags, generateTagSelector, getDescriptorIdsByTag, extractLinks, generateLinksHtml, escapeHtml, isUrl };
}