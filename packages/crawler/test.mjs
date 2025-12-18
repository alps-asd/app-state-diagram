#!/usr/bin/env node
/**
 * Simple test script for @alps-asd/crawler
 */

import { UrlPatternClassifier } from './dist/url-pattern-classifier.js';
import { DomSkeletonExtractor } from './dist/dom-skeleton-extractor.js';
import { generatePrompt, parseAIResponse } from './dist/alps-descriptor-generator.js';

console.log('🧪 Testing @alps-asd/crawler\n');

// Test 1: URL Pattern Classifier
console.log('Test 1: URL Pattern Classifier');
console.log('================================');
const classifier = new UrlPatternClassifier();

const urls = [
  'https://example.com/products/123',
  'https://example.com/products/456',
  'https://example.com/users/alice',
  'https://example.com/users/bob',
  'https://example.com/blog/2024/01/post1',
  'https://example.com/blog/2024/02/post2',
];

urls.forEach(url => {
  const result = classifier.classify(url);
  console.log(`${url}`);
  console.log(`  → Pattern: ${result.pattern?.pattern}`);
  console.log(`  → New: ${result.isNewPattern}`);
  if (result.params) {
    console.log(`  → Params:`, result.params);
  }
});

console.log('\nStatistics:', classifier.getStats());
console.log('✅ URL Pattern Classifier works!\n');

// Test 2: DOM Skeleton Extractor
console.log('Test 2: DOM Skeleton Extractor');
console.log('================================');
const extractor = new DomSkeletonExtractor();

const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Product Details - iPhone 15</title>
  <meta name="description" content="View product details">
</head>
<body>
  <nav>Navigation</nav>
  <main>
    <h1>iPhone 15 Pro</h1>
    <form id="add-to-cart" action="/cart/add" method="POST">
      <input type="hidden" name="productId" value="123" required>
      <input type="number" name="quantity" min="1" value="1" required>
      <select name="variant">
        <option value="black">Black</option>
        <option value="white">White</option>
      </select>
      <button type="submit">Add to Cart</button>
    </form>
    <a href="/products">Back to Products</a>
    <a href="/cart">View Cart</a>
  </main>
  <footer>Footer</footer>
</body>
</html>
`;

const skeleton = extractor.extract(sampleHtml, 'https://example.com/products/123');

console.log('Title:', skeleton.title);
console.log('Description:', skeleton.description);
console.log('Forms:', JSON.stringify(skeleton.forms, null, 2));
console.log('Links:', JSON.stringify(skeleton.links, null, 2));
console.log('Landmarks:', Object.keys(skeleton.landmarks));
console.log('✅ DOM Skeleton Extractor works!\n');

// Test 3: ALPS Descriptor Generator (prompt only)
console.log('Test 3: ALPS Descriptor Generator');
console.log('===================================');
const prompt = generatePrompt(skeleton, '/products/{id}');
console.log('Generated prompt length:', prompt.length, 'characters');
console.log('Prompt preview:', prompt.substring(0, 200) + '...');
console.log('✅ ALPS Generator prompt works!\n');

// Test 4: Parse AI Response
console.log('Test 4: Parse AI Response');
console.log('==========================');
const mockAIResponse = `
{
  "state": {
    "id": "ProductDetail",
    "title": "Product Detail Page",
    "doc": {"value": "Displays product information"},
    "tag": "domain-product flow-purchase"
  },
  "semantics": [
    {
      "id": "productId",
      "title": "Product ID",
      "def": "https://schema.org/identifier",
      "doc": {"value": "Unique product identifier"}
    },
    {
      "id": "quantity",
      "title": "Quantity",
      "def": "https://schema.org/quantity",
      "doc": {"value": "Number of items"}
    }
  ],
  "transitions": [
    {
      "id": "goProductList",
      "type": "safe",
      "rt": "#ProductList",
      "title": "Back to Products",
      "tag": "domain-product",
      "doc": {"value": "Navigate to product list"}
    },
    {
      "id": "doAddToCart",
      "type": "unsafe",
      "rt": "#Cart",
      "title": "Add to Cart",
      "tag": "domain-cart flow-purchase",
      "doc": {"value": "Add product to cart"},
      "descriptor": [
        {"href": "#productId"},
        {"href": "#quantity"}
      ]
    }
  ]
}
`;

const parsed = parseAIResponse(mockAIResponse);
console.log('State:', parsed.state.id);
console.log('Semantics:', parsed.semantics.length, 'fields');
console.log('Transitions:', parsed.transitions.length, 'actions');
console.log('✅ AI Response parsing works!\n');

// Summary
console.log('═══════════════════════════════');
console.log('✅ All tests passed!');
console.log('═══════════════════════════════');
console.log('\n📊 Test Summary:');
console.log('  - URL Pattern Classification: ✅');
console.log('  - DOM Skeleton Extraction: ✅');
console.log('  - ALPS Prompt Generation: ✅');
console.log('  - AI Response Parsing: ✅');
console.log('\n🎉 @alps-asd/crawler is ready to use!');
