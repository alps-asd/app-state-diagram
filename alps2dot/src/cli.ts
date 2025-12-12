#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { basename, extname } from 'path';
import { Alps2Dot } from './index';
import { LabelStrategyType } from './generator';

const program = new Command();

program
  .name('alps2dot')
  .description('Convert ALPS (Application-Level Profile Semantics) documents to DOT format for Graphviz visualization')
  .version('1.0.0');

program
  .argument('<input>', 'input ALPS file (JSON or XML)')
  .option('-o, --output <file>', 'output file (default: stdout)')
  .option('-f, --format <format>', 'input format (json|xml, auto-detect if not specified)')
  .option('-l, --label <strategy>', 'label strategy: id (default), title, both', 'id')
  .option('--validate-only', 'validate input without generating output')
  .option('--verbose', 'verbose error messages')
  .action(async (inputFile: string, options) => {
    try {
      const alps2dot = new Alps2Dot();
      
      // Read input file
      const input = readFileSync(inputFile, 'utf-8');
      
      if (options.validateOnly) {
        // Validate only
        const document = alps2dot.parseOnly(input, options.format);
        const validation = alps2dot.validateOnly(document);
        
        if (validation.isValid) {
          console.log('✓ ALPS document is valid');
          process.exit(0);
        } else {
          console.error('✗ ALPS document is invalid:');
          validation.errors.forEach(error => console.error(`  ${error.message}`));
          process.exit(1);
        }
      }

      // Validate label strategy
      const labelStrategy = options.label as LabelStrategyType;
      if (!['id', 'title', 'both'].includes(labelStrategy)) {
        console.error('Error: --label must be one of: id, title, both');
        process.exit(1);
      }

      // Handle 'both' strategy
      if (labelStrategy === 'both') {
        if (!options.output) {
          console.error('Error: --label=both requires --output option (cannot output both to stdout)');
          process.exit(1);
        }

        const outputs = alps2dot.convertBoth(input, options.format);
        const baseName = options.output.replace(/\.dot$/, '');
        
        const idFile = `${baseName}.dot`;
        const titleFile = `${baseName}.title.dot`;
        
        writeFileSync(idFile, outputs.id, 'utf-8');
        writeFileSync(titleFile, outputs.title, 'utf-8');
        
        console.error(`ID labels written to ${idFile}`);
        console.error(`Title labels written to ${titleFile}`);
        return;
      }
      
      // Convert to DOT with specified label strategy
      const dotOutput = alps2dot.convertWithLabel(input, labelStrategy as 'id' | 'title', options.format);
      
      // Output result
      if (options.output) {
        writeFileSync(options.output, dotOutput, 'utf-8');
        console.error(`DOT output written to ${options.output}`);
      } else {
        console.log(dotOutput);
      }
      
    } catch (error) {
      if (options.verbose) {
        console.error('Error:', error);
      } else {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('validate ALPS document without generating output')
  .argument('<input>', 'input ALPS file (JSON or XML)')
  .option('-f, --format <format>', 'input format (json|xml, auto-detect if not specified)')
  .action(async (inputFile: string, options) => {
    try {
      const alps2dot = new Alps2Dot();
      const input = readFileSync(inputFile, 'utf-8');
      
      const document = alps2dot.parseOnly(input, options.format);
      const validation = alps2dot.validateOnly(document);
      
      if (validation.isValid) {
        console.log('✓ ALPS document is valid');
      } else {
        console.error('✗ ALPS document is invalid:');
        validation.errors.forEach(error => console.error(`  ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();