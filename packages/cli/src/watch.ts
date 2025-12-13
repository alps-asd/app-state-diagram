/**
 * Watch mode - live reload via Chrome DevTools Protocol
 *
 * Opens the online editor and sends content updates via CDP.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import CDP from 'chrome-remote-interface';
import { watch } from 'chokidar';

const EDITOR_URL = 'https://editor.app-state-diagram.com';

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

async function waitForEditor(port: number): Promise<void> {
  // Wait for Ace editor to be ready
  for (let i = 0; i < 20; i++) {
    try {
      const client = await CDP({ port });
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: 'typeof ace !== "undefined" && ace.edit("editor") !== null',
      });
      await client.close();
      if (result.result.value === true) {
        return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function startWatch(
  inputFile: string,
  options: { port: number; output?: string }
): Promise<void> {
  const absolutePath = path.resolve(inputFile);
  const port = options.port;

  // Check if Chrome is already running with CDP, if not launch it
  try {
    await CDP({ port });
    console.log(`Chrome already running on port ${port}`);
    spawn('open', ['-a', 'Google Chrome', EDITOR_URL], { detached: true, stdio: 'ignore' });
  } catch {
    console.log('Launching Chrome with remote debugging...');
    await launchChrome(port, EDITOR_URL);
  }

  // Wait for editor to be ready
  console.log('Waiting for editor to load...');
  await waitForEditor(port);

  // Send initial content
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

  // Send initial content
  await sendToBrowser();

  console.log(`Watching ${inputFile} for changes...`);
  console.log('Press Ctrl+C to stop.\n');

  // Watch for changes
  watch(absolutePath).on('change', sendToBrowser);
}
