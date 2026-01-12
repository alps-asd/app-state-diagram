#!/usr/bin/env node
/**
 * Test crawler with example.com bookmark page
 */

import { DomSkeletonExtractor } from './dist/dom-skeleton-extractor.js';
import { generatePrompt } from './dist/alps-descriptor-generator.js';

// Simulated HTML for bookmark page (based on common patterns)
const bookmarkHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Favorite Lawyers - Example Corp</title>
  <meta name="description" content="List of favorite lawyers">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/private/bookmark/lawyer/">Favorite Lawyers</a>
    <a href="/private/bookmark/question/">Favorite Questions</a>
  </nav>

  <main>
    <h1>Favorite Lawyers</h1>

    <!-- Bookmark list -->
    <div class="bookmark-list">
      <div class="bookmark-item" data-bookmark-id="1">
        <a href="/lawyers/12345">John Doe</a>
        <p>Specialty: Divorce</p>
        <p>Registered: 2024-01-15</p>
        <form action="/private/bookmark/lawyer/remove" method="POST">
          <input type="hidden" name="lawyerId" value="12345">
          <input type="hidden" name="bookmarkId" value="1">
          <button type="submit">Remove Bookmark</button>
        </form>
        <textarea name="bookmarkNote" placeholder="Add note"></textarea>
        <button class="save-note">Save Note</button>
      </div>
    </div>

    <!-- Add bookmark form (from lawyer profile) -->
    <div style="display:none" id="add-bookmark-template">
      <form action="/private/bookmark/lawyer/add" method="POST">
        <input type="hidden" name="lawyerId" required>
        <textarea name="bookmarkNote" placeholder="Note (Optional)"></textarea>
        <button type="submit">Add to Favorites</button>
      </form>
    </div>
  </main>

  <footer>Footer</footer>
</body>
</html>
`;

console.log('🧪 Testing crawler with example.com bookmark page\n');

// Extract DOM skeleton
const extractor = new DomSkeletonExtractor();
const skeleton = extractor.extract(bookmarkHtml, 'https://www.example.com/private/bookmark/lawyer/');

console.log('📋 DOM Skeleton Extracted:');
console.log('==========================');
console.log('Title:', skeleton.title);
console.log('Description:', skeleton.description);
console.log('\nForms found:', skeleton.forms.length);
skeleton.forms.forEach((form, i) => {
  console.log(`\nForm ${i + 1}:`, {
    action: form.action,
    method: form.method,
    inputs: form.inputs
  });
});

console.log('\nLinks found:', skeleton.links.length);
skeleton.links.slice(0, 5).forEach(link => {
  console.log('  -', link.href);
});

// Generate AI prompt
console.log('\n📝 Generating ALPS extraction prompt...');
const prompt = generatePrompt(skeleton, '/private/bookmark/lawyer/');

console.log('✅ Prompt generated:', prompt.length, 'characters');
console.log('\n' + '='.repeat(60));
console.log('PROMPT FOR AI:');
console.log('='.repeat(60));
console.log(prompt);
console.log('='.repeat(60));
