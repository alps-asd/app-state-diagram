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

const dotString = fs.readFileSync(filePath, 'utf8');

const viz = new Viz({ Module, render });

// Generate the output file name in the same directory (change extension to .svg)
const outputFileName = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.svg');

viz.renderString(dotString, { engine: 'dot', format: 'svg' })
    .then(svg => {
        fs.writeFileSync(outputFileName, svg);
        console.log(`Output SVG file: ${outputFileName}`);
    })
    .catch(error => {
        console.error(error);
    });
