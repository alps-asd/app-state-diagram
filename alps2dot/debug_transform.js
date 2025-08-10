const { readFileSync } = require('fs');
const { Alps2Dot } = require('./dist/index.js');

const alps2dot = new Alps2Dot();
const input = readFileSync('./tests/fixtures/fake.json', 'utf-8');

const document = alps2dot.parseOnly(input);
console.log('Parsed document:');
console.log(JSON.stringify(document, null, 2));

const result = alps2dot.convert(input);
console.log('\nGenerated DOT:');
console.log(result);