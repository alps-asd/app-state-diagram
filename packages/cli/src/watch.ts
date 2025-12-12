/**
 * Watch mode - live reload via Chrome DevTools Protocol
 *
 * CLI just sends text to browser, Editor handles parsing and rendering.
 */

import * as fs from 'fs';
import * as path from 'path';
import CDP from 'chrome-remote-interface';
import { watch } from 'chokidar';
import { parseAlpsAuto } from './parser/alps-parser';
import { generateEditorHtml } from './generator/editor-html-generator';

export async function startWatch(
  inputFile: string,
  options: { port: number; output?: string }
): Promise<void> {
  const absolutePath = path.resolve(inputFile);
  const basePath = path.dirname(absolutePath);
  const port = options.port;

  console.log(`Watching ${inputFile} for changes...`);
  console.log(`CDP port: ${port}`);
  console.log('Press Ctrl+C to stop.\n');

  // Generate initial HTML (editor with pre-loaded content)
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const document = parseAlpsAuto(content);
  const title = document?.alps?.title || 'ALPS Editor';
  const htmlOutput = generateEditorHtml(content, title);
  const outputFile = options.output || inputFile.replace(/\.[^.]+$/, '.html');
  fs.writeFileSync(outputFile, htmlOutput, 'utf-8');
  console.log(`Generated: ${path.resolve(outputFile)}`);

  // Send update to browser via CDP
  const sendToBrowser = async () => {
    try {
      const fileContent = fs.readFileSync(absolutePath, 'utf-8');

      const client = await CDP({ port });
      const { Runtime } = client;
      // Update Ace editor content directly - editor will auto-refresh preview
      await Runtime.evaluate({
        expression: `ace.edit("editor").setValue(${JSON.stringify(fileContent)}, -1)`,
      });
      await client.close();
      console.log(`[${new Date().toLocaleTimeString()}] Updated`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        console.error('Cannot connect to Chrome. Start Chrome with:');
        console.error(
          `  open -a "Google Chrome" --args --remote-debugging-port=${port} --user-data-dir=/tmp/chrome-debug file://${path.resolve(outputFile)}`
        );
      } else {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    }
  };

  // Watch for changes
  watch(absolutePath).on('change', sendToBrowser);
}
