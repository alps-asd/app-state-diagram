/**
 * SVG Generator for Node.js
 *
 * Converts DOT to SVG.
 * Prefers local Graphviz `dot` command for better quality (especially with multibyte characters).
 * Falls back to @viz-js/viz (WASM) if `dot` is not available.
 */

import { execSync } from 'child_process';
import { instance } from '@viz-js/viz';

let vizInstance: Awaited<ReturnType<typeof instance>> | null = null;
let dotCommandAvailable: boolean | null = null;

/**
 * Check if local `dot` command is available
 */
function isDotCommandAvailable(): boolean {
  if (dotCommandAvailable !== null) {
    return dotCommandAvailable;
  }

  try {
    execSync('dot -V', { stdio: 'ignore' });
    dotCommandAvailable = true;
  } catch {
    dotCommandAvailable = false;
  }

  return dotCommandAvailable;
}

/**
 * Convert DOT string to SVG using local `dot` command
 */
function dotToSvgLocal(dot: string): string {
  const result = execSync('dot -Tsvg', {
    input: dot,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024, // 10MB
  });
  return result;
}

/**
 * Convert DOT string to SVG using WASM (fallback)
 */
async function dotToSvgWasm(dot: string): Promise<string> {
  if (!vizInstance) {
    vizInstance = await instance();
  }
  return vizInstance.renderString(dot, { format: 'svg' });
}

/**
 * Convert DOT string to SVG string (WASM version)
 * Used for HTML output where browser will regenerate anyway
 */
export async function dotToSvg(dot: string): Promise<string> {
  return dotToSvgWasm(dot);
}

/**
 * Convert DOT string to SVG string (high quality)
 * Uses local `dot` command if available for better multibyte character support
 * Falls back to WASM if `dot` is not available
 */
export async function dotToSvgHighQuality(dot: string): Promise<string> {
  if (isDotCommandAvailable()) {
    return dotToSvgLocal(dot);
  }
  return dotToSvgWasm(dot);
}
