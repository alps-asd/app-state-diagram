/**
 * Table generation functions for Node.js
 *
 * Ported from public/js/descriptor2table.js
 * These functions generate HTML tables from ALPS descriptors.
 */

import type { AlpsDocument, AlpsDescriptor, AlpsLink } from '../parser/alps-parser';

/**
 * Check if string is a valid URL
 */
export function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string | undefined | null): string {
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
 */
function createMetaItem(
  label: string,
  value: string,
  cssClass = '',
  url = '',
  title = ''
): string {
  let valueHtml = escapeHtml(value);
  const attrs: string[] = [];

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
 */
function getDescriptorPropValue(key: string, descriptor: AlpsDescriptor): string {
  const value = (descriptor as any)[key];
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
      const docText = typeof value === 'object' ? value.value || '' : value;
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
 */
function getTagString(tags: string[]): string {
  if (!tags || tags.length === 0) return '';

  const tagLinks = tags.map(tag => {
    const safeTag = escapeHtml(tag);
    return `<span class="meta-tag tag-tag"><a href="#tag-${safeTag}">${safeTag}</a></span>`;
  });

  return `<span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values">${tagLinks.join(' ')}</span></span>`;
}

/**
 * Get contained descriptors as HTML
 */
function getContainedDescriptors(
  descriptor: AlpsDescriptor,
  allDescriptors: Record<string, AlpsDescriptor>
): string {
  if (!descriptor.descriptor || descriptor.descriptor.length === 0) {
    return '';
  }

  const contained: AlpsDescriptor[] = [];
  for (const item of descriptor.descriptor) {
    let id = item.id;
    if (!id && item.href) {
      const match = item.href.match(/#(.+)/);
      if (match) id = match[1];
    }

    if (id && allDescriptors[id]) {
      contained.push(allDescriptors[id]);
    }
  }

  if (contained.length === 0) return '';

  const typeOrder: Record<string, number> = { semantic: 0, safe: 1, unsafe: 2, idempotent: 3 };
  contained.sort((a, b) => (typeOrder[a.type || 'semantic'] ?? 99) - (typeOrder[b.type || 'semantic'] ?? 99));

  const links = contained.map(desc => {
    const typeClass = desc.type || 'semantic';
    const typeTitle = typeClass.charAt(0).toUpperCase() + typeClass.slice(1);
    const safeId = escapeHtml(desc.id);
    return `<span class="type-indicator-small ${typeClass}" title="${typeTitle}"></span><a href="#${safeId}">${safeId}</a>`;
  });

  return links.join('<br>');
}

/**
 * Get extras (def, tags, rel, rt, doc, link) as HTML
 */
function getExtras(descriptor: AlpsDescriptor): string {
  const extras: string[] = [];

  extras.push(getDescriptorPropValue('def', descriptor));
  extras.push(getTagString(descriptor.tag ? descriptor.tag.split(/\s+/) : []));
  extras.push(getDescriptorPropValue('rel', descriptor));
  extras.push(getDescriptorPropValue('rt', descriptor));
  extras.push(getDescriptorPropValue('doc', descriptor));

  const filtered = extras.filter(e => e);
  if (filtered.length === 0) return '';

  return `<span class="meta-container">${filtered.join('')}</span>`;
}

/**
 * Build table row for a descriptor
 */
function buildTableRow(
  descriptor: AlpsDescriptor,
  allDescriptors: Record<string, AlpsDescriptor>
): string {
  const type = descriptor.type || 'semantic';
  const typeIcon = `<span class="legend"><span class="legend-icon ${type}"></span></span>`;
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
 */
export function descriptor2table(descriptors: AlpsDescriptor[]): string {
  const descriptorMap: Record<string, AlpsDescriptor> = {};
  for (const desc of descriptors) {
    if (desc.id) {
      descriptorMap[desc.id] = desc;
    }
  }

  const sorted = [...descriptors].sort((a, b) =>
    (a.id || '').toLowerCase().localeCompare((b.id || '').toLowerCase())
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
 */
export function flattenDescriptors(alpsData: AlpsDocument): AlpsDescriptor[] {
  const descriptors = alpsData?.alps?.descriptor || [];
  const map: Record<string, AlpsDescriptor> = {};

  function collect(descs: AlpsDescriptor[]) {
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

  return Object.values(map);
}

/**
 * Extract unique tags from descriptors
 */
export function extractTags(descriptors: AlpsDescriptor[]): string[] {
  const tags = new Set<string>();
  for (const desc of descriptors) {
    if (desc.tag) {
      desc.tag.split(/\s+/).forEach(t => tags.add(t.trim()));
    }
  }
  return [...tags].sort();
}

/**
 * Get descriptor IDs that have a specific tag
 */
export function getDescriptorIdsByTag(descriptors: AlpsDescriptor[], tag: string): string[] {
  return descriptors
    .filter(desc => desc.tag && desc.tag.split(/\s+/).includes(tag))
    .map(desc => desc.id || '');
}

/**
 * Generate tag selector HTML
 */
export function generateTagSelector(tags: string[]): string {
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
 */
export function extractLinks(alpsData: AlpsDocument): AlpsLink[] {
  const link = alpsData?.alps?.link;
  if (!link) return [];

  const links = Array.isArray(link) ? link : [link];
  return links
    .map(l => ({
      rel: l.rel || '',
      href: l.href || '',
      title: l.title || '',
    }))
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * Generate Links section HTML
 */
export function generateLinksHtml(links: AlpsLink[]): string {
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
