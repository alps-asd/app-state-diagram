#!/usr/bin/env node
/**
 * asd - ALPS State Diagram CLI tool
 *
 * Generates HTML documentation and state diagrams from ALPS profiles.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parseAlpsAuto } from './parser/alps-parser';
import { generateDot } from './generator/dot-generator';
import { dotToSvg, dotToSvgHighQuality } from './generator/svg-generator';
import { generateEditorHtml } from './generator/editor-html-generator';
import { FileResolver } from './resolver/file-resolver';
import { startWatch } from './watch';
import { AlpsValidator } from './validator';

const program = new Command();

program
  .name('asd')
  .configureHelp({
    helpWidth: 80,
    sortOptions: false,
    showGlobalOptions: false,
  })
  .configureOutput({
    outputError: (str, write) => write(str.replace('error: ', '')),
  })
  .usage('[options] alps_file')
  .version('0.20.0', '-v, --version', 'Show version information')
  .helpOption('-h, --help', 'Show this help message')
  .addHelpText('after', '\n@see https://github.com/alps-asd/app-state-diagram#usage')
  .addHelpText('beforeAll', 'usage: asd [options] alps_file\n\nOptions:');

program
  .argument('[input]')
  .option('-e, --echo', 'Output to stdout instead of file')
  .option('-m, --mode <mode>', 'Output mode (html|svg|dot)')
  .option('-o, --output <file>', 'Output file (default: <input>.html)')
  .option('--label <mode>', 'Label mode: id or title')
  .option('--validate', 'Validate ALPS profile')
  .option('-w, --watch', 'Watch mode with live reload (requires Chrome with --remote-debugging-port=9222)')
  .option('--port <port>', 'CDP port for watch mode (default: 9222)', '9222')
  .action(async (inputFile: string | undefined, options) => {
    // Show help if no input file
    if (!inputFile) {
      console.log(`usage: asd [options] alps_file

Options:
  -e, --echo              Output to stdout instead of file
  -w, --watch             Watch mode with live reload
  -m, --mode <mode>       Output mode (html|svg|dot)
  -o, --output <file>     Output file (default: <input>.html)
  --port <port>           CDP port for watch mode (default: 9222)
  --label <mode>          Label mode: id or title
  --validate              Validate ALPS profile
  -v, --version           Show version information
  -h, --help              Show this help message

@see https://github.com/alps-asd/app-state-diagram#usage`);
      return;
    }

    try {
      // Read input file
      const absolutePath = path.resolve(inputFile);
      if (!fs.existsSync(absolutePath)) {
        console.error(`Profile file not found: ${inputFile}`);
        process.exit(1);
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');
      const basePath = path.dirname(absolutePath);

      // Parse ALPS document
      let document = parseAlpsAuto(content);

      // Validate only mode
      if (options.validate) {
        const validator = new AlpsValidator();
        const result = validator.validate(document);

        // Show errors
        for (const error of result.errors) {
          console.error(`[${error.code}] ${error.message}${error.path ? ` at ${error.path}` : ''}`);
        }

        // Show warnings
        for (const warning of result.warnings) {
          console.warn(`[${warning.code}] ${warning.message}${warning.path ? ` at ${warning.path}` : ''}`);
        }

        // Show suggestions
        for (const suggestion of result.suggestions) {
          console.log(`[${suggestion.code}] ${suggestion.message}${suggestion.path ? ` at ${suggestion.path}` : ''}`);
        }

        if (result.isValid) {
          console.log(`\n✓ ALPS document is valid (${result.warnings.length} warnings, ${result.suggestions.length} suggestions)`);
        } else {
          console.error(`\n✗ ALPS document has ${result.errors.length} errors`);
          process.exit(1);
        }
        return;
      }

      // Watch mode
      if (options.watch) {
        await startWatch(inputFile, {
          port: parseInt(options.port, 10),
          output: options.output,
        });
        return;
      }

      // Resolve external references
      const resolver = new FileResolver(basePath);
      document = await resolver.resolve(document);

      // Generate DOT
      const labelMode = options.label === 'title' ? 'title' : 'id';
      const dotContent = generateDot(document, labelMode);

      let output: string;
      let outputExt: string;

      const mode = options.mode || 'html';
      if (mode === 'dot') {
        output = dotContent;
        outputExt = '.dot';
      } else if (mode === 'svg') {
        // Use high quality (local dot) for standalone SVG output
        output = await dotToSvgHighQuality(dotContent);
        outputExt = '.svg';
      } else {
        // HTML: output editor with pre-loaded content
        const title = document?.alps?.title || 'ALPS Editor';
        output = generateEditorHtml(content, title);
        outputExt = '.html';
      }

      // Output
      if (options.echo) {
        console.log(output);
      } else {
        const outputFile = options.output || inputFile.replace(/\.[^.]+$/, outputExt);
        fs.writeFileSync(outputFile, output, 'utf-8');
        console.log(`ASD generated. ${path.resolve(outputFile)}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
