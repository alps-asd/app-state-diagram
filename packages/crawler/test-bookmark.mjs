#!/usr/bin/env node
/**
 * Test crawler with bengo4.com bookmark page
 */

import { DomSkeletonExtractor } from './dist/dom-skeleton-extractor.js';
import { generatePrompt } from './dist/alps-descriptor-generator.js';

// Simulated HTML for bookmark page (based on common patterns)
const bookmarkHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>お気に入りの弁護士 - 弁護士ドットコム</title>
  <meta name="description" content="お気に入りに登録した弁護士の一覧">
</head>
<body>
  <nav>
    <a href="/">ホーム</a>
    <a href="/private/bookmark/lawyer/">お気に入り弁護士</a>
    <a href="/private/bookmark/question/">お気に入り質問</a>
  </nav>

  <main>
    <h1>お気に入りの弁護士</h1>

    <!-- Bookmark list -->
    <div class="bookmark-list">
      <div class="bookmark-item" data-bookmark-id="1">
        <a href="/lawyers/12345">山田太郎 弁護士</a>
        <p>専門: 離婚・男女問題</p>
        <p>登録日: 2024-01-15</p>
        <form action="/private/bookmark/lawyer/remove" method="POST">
          <input type="hidden" name="lawyerId" value="12345">
          <input type="hidden" name="bookmarkId" value="1">
          <button type="submit">お気に入り解除</button>
        </form>
        <textarea name="bookmarkNote" placeholder="メモを追加"></textarea>
        <button class="save-note">メモを保存</button>
      </div>
    </div>

    <!-- Add bookmark form (from lawyer profile) -->
    <div style="display:none" id="add-bookmark-template">
      <form action="/private/bookmark/lawyer/add" method="POST">
        <input type="hidden" name="lawyerId" required>
        <textarea name="bookmarkNote" placeholder="メモ（任意）"></textarea>
        <button type="submit">お気に入りに追加</button>
      </form>
    </div>
  </main>

  <footer>フッター</footer>
</body>
</html>
`;

console.log('🧪 Testing crawler with bengo4.com bookmark page\n');

// Extract DOM skeleton
const extractor = new DomSkeletonExtractor();
const skeleton = extractor.extract(bookmarkHtml, 'https://www.bengo4.com/private/bookmark/lawyer/');

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
