/**
 * Watch mode - live reload via Chrome DevTools Protocol
 *
 * Opens the online editor and sends content updates via CDP.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import CDP from 'chrome-remote-interface';
import { watch } from 'chokidar';

const EDITOR_URL = 'https://www.app-state-diagram.com/app-state-diagram/';
const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function launchChrome(port: number, url: string): Promise<void> {
  const chromePath = process.env.CHROME_PATH || DEFAULT_CHROME_PATH;
  const userDataDir = path.join(os.tmpdir(), 'asd-chrome-debug');

  if (!fs.existsSync(chromePath)) {
    console.error(`Chrome not found at: ${chromePath}`);
    console.error('Set CHROME_PATH environment variable to your Chrome executable.');
    process.exit(1);
  }

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    url
  ];

  spawn(chromePath, args, { detached: true, stdio: 'ignore' });

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
  throw new Error('Failed to launch Chrome. Make sure Chrome is installed.');
}

async function waitForEditor(port: number): Promise<void> {
  // Wait for Ace editor and viewMode selector to be ready
  for (let i = 0; i < 30; i++) {
    try {
      const client = await CDP({ port });
      const { Runtime } = client;
      const result = await Runtime.evaluate({
        expression: 'typeof ace !== "undefined" && ace.edit("editor") !== null && document.getElementById("viewMode") !== null',
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
  throw new Error('Editor failed to load. Check your network connection.');
}

export async function startWatch(
  inputFile: string,
  options: { port: number; output?: string }
): Promise<void> {
  const absolutePath = path.resolve(inputFile);
  const port = options.port;

  // Check if Chrome is already running with CDP, if not launch it
  try {
    const client = await CDP({ port });
    console.log(`Chrome already running on port ${port}`);
    // Open new tab via CDP
    try {
      const { Target } = client;
      await Target.createTarget({ url: EDITOR_URL });
    } finally {
      await client.close();
    }
  } catch {
    console.log('Launching Chrome with remote debugging...');
    await launchChrome(port, EDITOR_URL);
  }

  // Wait for editor to be ready
  console.log('Waiting for editor to load...');
  await waitForEditor(port);

  // Send initial content
  let isFirstSend = true;
  const sendToBrowser = async () => {
    try {
      const fileContent = fs.readFileSync(absolutePath, 'utf-8');

      const client = await CDP({ port });
      const { Runtime } = client;
      // Update Ace editor content directly - editor will auto-refresh preview
      await Runtime.evaluate({
        expression: `ace.edit("editor").setValue(${JSON.stringify(fileContent)}, -1)`,
      });

      // Set preview mode on first send
      if (isFirstSend) {
        await Runtime.evaluate({
          expression: `document.getElementById("viewMode").value = "preview"; document.getElementById("viewMode").dispatchEvent(new Event("change"))`,
        });
        isFirstSend = false;
      }

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
