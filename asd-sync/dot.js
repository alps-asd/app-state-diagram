const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');
const fs = require('fs');
const path = require('path');

// Get the file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please specify a file path.');
    process.exit(1);
}

// Basic path validation to prevent directory traversal
if (filePath.includes('..') || !path.isAbsolute(filePath)) {
    console.error('Invalid file path. Only absolute paths without ".." are allowed.');
    process.exit(1);
}

let dotString;
try {
    dotString = fs.readFileSync(filePath, 'utf8');
} catch (error) {
    console.error(`Error reading file "${filePath}":`, error.message);
    process.exit(1);
}

const viz = new Viz({ Module, render });

// Generate the output file name in the same directory (change extension to .svg)
const outputFileName = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.svg');

viz.renderString(dotString, { engine: 'dot', format: 'svg' })
    .then(svg => {
        try {
            fs.writeFileSync(outputFileName, svg);
            // SVG file written successfully (message handled by parent process)
        } catch (error) {
            console.error(`Error writing file "${outputFileName}":`, error.message);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Error rendering DOT string:', error.message || error);
        process.exit(1);
    });
