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
import { generateHtml } from './generator/html-generator';
import { FileResolver } from './resolver/file-resolver';
import { startWatch } from './watch';
import { AlpsValidator } from './validator';
import { AlpsMerger } from './merger';

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

        // Helper to generate documentation URL for issue codes
        const getIssueUrl = (code: string): string => {
          const anchor = code.toLowerCase();
          return `https://app-state-diagram.com/docs/issues#${anchor}`;
        };

        // Show errors
        for (const error of result.errors) {
          console.error(`[${error.code}] ${error.message}${error.path ? ` at ${error.path}` : ''}`);
          console.error(`    ${getIssueUrl(error.code)}`);
        }

        // Show warnings
        for (const warning of result.warnings) {
          console.warn(`[${warning.code}] ${warning.message}${warning.path ? ` at ${warning.path}` : ''}`);
          console.warn(`    ${getIssueUrl(warning.code)}`);
        }

        // Show suggestions
        for (const suggestion of result.suggestions) {
          console.log(`[${suggestion.code}] ${suggestion.message}${suggestion.path ? ` at ${suggestion.path}` : ''}`);
          console.log(`    ${getIssueUrl(suggestion.code)}`);
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
        // HTML: output standalone documentation
        const svgContent = await dotToSvg(dotContent);
        output = generateHtml(document, svgContent, content);
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

// Merge command
program
  .command('merge <base> <source>')
  .description('Merge ALPS profiles (modifies source file)')
  .action(async (baseFile: string, sourceFile: string) => {
    try {
      // Read files
      const basePath = path.resolve(baseFile);
      const sourcePath = path.resolve(sourceFile);

      if (!fs.existsSync(basePath)) {
        console.error(`Base file not found: ${baseFile}`);
        process.exit(1);
      }

      if (!fs.existsSync(sourcePath)) {
        console.error(`Source file not found: ${sourceFile}`);
        process.exit(1);
      }

      const baseContent = fs.readFileSync(basePath, 'utf-8');
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');

      // Parse documents
      const baseDoc = parseAlpsAuto(baseContent);
      const sourceDoc = parseAlpsAuto(sourceContent);

      // Merge
      const merger = new AlpsMerger();
      const result = merger.merge(baseDoc, sourceDoc);

      // Write merged base
      fs.writeFileSync(basePath, JSON.stringify(result.merged, null, 2), 'utf-8');

      // Write conflicts to source file (or empty if no conflicts)
      const conflictsDoc = {
        ...sourceDoc,
        alps: {
          ...sourceDoc.alps,
          descriptor: result.conflicts,
        },
      };
      fs.writeFileSync(sourcePath, JSON.stringify(conflictsDoc, null, 2), 'utf-8');

      // Report
      console.log(`Merge complete:`);
      console.log(`  Added: ${result.stats.added} descriptors`);
      console.log(`  Skipped: ${result.stats.skipped} duplicates`);
      console.log(`  Conflicts: ${result.stats.conflicts}`);

      if (result.stats.conflicts > 0) {
        console.log(`\nConflicts written to ${sourceFile}`);
        console.log('Resolve conflicts and run merge again');
        process.exit(1);
      } else {
        console.log(`\n${sourceFile} is now empty (merge successful)`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
