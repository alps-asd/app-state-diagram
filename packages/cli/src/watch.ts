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
import { generateDot } from './generator/dot-generator';
import { dotToSvg } from './generator/svg-generator';
import { generateHtml } from './generator/html-generator';
import { FileResolver } from './resolver/file-resolver';

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

  // Generate initial HTML
  const content = fs.readFileSync(absolutePath, 'utf-8');
  let document = parseAlpsAuto(content);
  const resolver = new FileResolver(basePath);
  document = await resolver.resolve(document);
  const dotContent = generateDot(document, 'id');
  const svgContent = await dotToSvg(dotContent);
  const htmlOutput = generateHtml(document, svgContent, content);
  const outputFile = options.output || inputFile.replace(/\.[^.]+$/, '.html');
  fs.writeFileSync(outputFile, htmlOutput, 'utf-8');
  console.log(`Generated: ${path.resolve(outputFile)}`);

  // Send update to browser via CDP
  const sendToBrowser = async () => {
    try {
      const fileContent = fs.readFileSync(absolutePath, 'utf-8');

      const client = await CDP({ port });
      const { Runtime } = client;
      await Runtime.evaluate({
        expression: `window.loadText(${JSON.stringify(fileContent)})`,
        awaitPromise: true,
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
