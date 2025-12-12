/**
 * Watch mode - live reload via Chrome DevTools Protocol
 *
 * CLI just sends text to browser, Editor handles parsing and rendering.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import CDP from 'chrome-remote-interface';
import { watch } from 'chokidar';
import { parseAlpsAuto } from './parser/alps-parser';
import { generateEditorHtml } from './generator/editor-html-generator';

async function launchChrome(port: number, url: string): Promise<void> {
  const args = [
    '-a', 'Google Chrome',
    '--args',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-debug',
    url
  ];

  spawn('open', args, { detached: true, stdio: 'ignore' });

  // Wait for Chrome to start
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await CDP({ port });
      return;
    } catch {
      // Chrome not ready yet
    }
  }
}

export async function startWatch(
  inputFile: string,
  options: { port: number; output?: string }
): Promise<void> {
  const absolutePath = path.resolve(inputFile);
  const port = options.port;

  // Generate initial HTML (editor with pre-loaded content)
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const document = parseAlpsAuto(content);
  const title = document?.alps?.title || 'ALPS Editor';
  const htmlOutput = generateEditorHtml(content, title);
  const outputFile = options.output || inputFile.replace(/\.[^.]+$/, '.html');
  fs.writeFileSync(outputFile, htmlOutput, 'utf-8');

  const fileUrl = `file://${path.resolve(outputFile)}`;

  // Check if Chrome is already running with CDP, if not launch it
  try {
    await CDP({ port });
    console.log(`Chrome already running on port ${port}`);
    spawn('open', ['-a', 'Google Chrome', fileUrl], { detached: true, stdio: 'ignore' });
  } catch {
    console.log('Launching Chrome with remote debugging...');
    await launchChrome(port, fileUrl);
  }

  console.log(`Watching ${inputFile} for changes...`);
  console.log('Press Ctrl+C to stop.\n');

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
      console.error('Error:', error instanceof Error ? error.message : error);
    }
  };

  // Watch for changes
  watch(absolutePath).on('change', sendToBrowser);
}
