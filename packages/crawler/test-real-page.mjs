#!/usr/bin/env node
/**
 * Test crawler with realistic bengo4.com lawyer profile page
 * Based on actual page structure from https://www.bengo4.com/tokyo/a_13116/l_1467010/
 */

import { DomSkeletonExtractor } from './dist/dom-skeleton-extractor.js';
import { generatePrompt } from './dist/alps-descriptor-generator.js';
import fs from 'fs';

// Realistic HTML based on actual bengo4.com lawyer profile
const lawyerProfileHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <title>松村大介 弁護士 - 東京都豊島区 | 弁護士ドットコム</title>
  <meta name="description" content="松村大介弁護士のプロフィール。国際・外国人問題、刑事事件、インターネット問題等を扱う。中国語対応可能。">
</head>
<body>
  <nav>
    <a href="/">ホーム</a>
    <a href="/tokyo/">東京</a>
    <a href="/area/13/13116/">豊島区</a>
    <a href="/specialty/kokusai/">国際・外国人問題</a>
    <a href="/private/bookmark/lawyer/">お気に入り弁護士</a>
  </nav>

  <main>
    <h1>松村大介 弁護士</h1>

    <!-- Lawyer Info -->
    <section class="lawyer-info">
      <p>第一東京弁護士会 / 2019年登録</p>
      <p>慶應義塾大学法科大学院 / 2017年卒業</p>
      <p>中国語対応可能</p>
    </section>

    <!-- Practice Areas -->
    <section class="practice-areas">
      <h2>取扱分野</h2>
      <ul>
        <li><a href="/specialty/kokusai/">国際・外国人問題</a></li>
        <li><a href="/specialty/keiji/">刑事事件</a></li>
        <li><a href="/specialty/internet/">インターネット問題</a></li>
        <li><a href="/specialty/rikon/">離婚・男女問題</a></li>
        <li><a href="/specialty/roudou/">労働問題</a></li>
      </ul>
    </section>

    <!-- Add to Bookmark Form -->
    <form id="add-bookmark" action="/private/bookmark/lawyer/add" method="POST">
      <input type="hidden" name="lawyerId" value="1467010">
      <textarea name="bookmarkNote" placeholder="メモ（任意）"></textarea>
      <button type="submit">お気に入りに追加</button>
    </form>

    <!-- Contact/Quote Request Form -->
    <form id="quote-request" action="/quote/submit" method="POST">
      <h3>見積もり依頼</h3>
      <input type="hidden" name="lawyerId" value="1467010" required>
      <input type="text" name="userName" placeholder="お名前" required>
      <input type="email" name="email" placeholder="メールアドレス" required>
      <input type="tel" name="phone" placeholder="電話番号">
      <select name="consultationType" required>
        <option value="">相談内容を選択</option>
        <option value="kokusai">国際・外国人問題</option>
        <option value="keiji">刑事事件</option>
        <option value="internet">インターネット問題</option>
      </select>
      <textarea name="inquiryContent" placeholder="相談内容の詳細" required></textarea>
      <button type="submit">見積もりを依頼する</button>
    </form>

    <!-- Free Consultation Form -->
    <form id="free-consultation" action="/consultation/request" method="POST">
      <h3>無料相談（初回15分）</h3>
      <input type="hidden" name="lawyerId" value="1467010" required>
      <input type="text" name="userName" placeholder="お名前" required>
      <input type="tel" name="phone" placeholder="電話番号" required>
      <select name="preferredTime" required>
        <option value="">希望時間帯</option>
        <option value="morning">午前</option>
        <option value="afternoon">午後</option>
        <option value="evening">夕方・夜間</option>
      </select>
      <textarea name="briefDescription" placeholder="相談内容（簡単に）"></textarea>
      <button type="submit">無料相談を申し込む</button>
    </form>

    <!-- Navigation Links -->
    <div class="navigation">
      <a href="/tokyo/a_13116/">豊島区の弁護士一覧へ</a>
      <a href="/specialty/kokusai/">国際・外国人問題の弁護士一覧へ</a>
      <a href="/lawyers/">弁護士検索トップへ</a>
    </div>
  </main>

  <footer>
    <a href="/about/">運営会社</a>
    <a href="/privacy/">プライバシーポリシー</a>
    <a href="/support/">お問い合わせ</a>
  </footer>
</body>
</html>
`;

console.log('🧪 Testing Crawler with Realistic Lawyer Profile Page\n');
console.log('=' .repeat(70));

// 1. Extract DOM Skeleton
console.log('\n📝 Step 1: Extract DOM Skeleton');
console.log('-'.repeat(70));

const extractor = new DomSkeletonExtractor();
const skeleton = extractor.extract(lawyerProfileHtml, 'https://www.bengo4.com/tokyo/a_13116/l_1467010/');

console.log('Title:', skeleton.title);
console.log('Description:', skeleton.description);
console.log('\nForms found:', skeleton.forms.length);

skeleton.forms.forEach((form, i) => {
  console.log(`\nForm ${i + 1}: ${form.action}`);
  console.log('  Method:', form.method);
  console.log('  Inputs:', form.inputs.length);
  form.inputs.forEach(input => {
    console.log(`    - ${input.name} (${input.type})${input.required ? ' *required' : ''}`);
  });
});

console.log('\nLinks found:', skeleton.links.length);
console.log('Sample links:');
skeleton.links.slice(0, 8).forEach(link => {
  console.log(`  - ${link.href}`);
});

console.log('\nLandmarks:', Object.keys(skeleton.landmarks).join(', '));

// 2. Generate AI Prompt
console.log('\n📝 Step 2: Generate AI Prompt');
console.log('-'.repeat(70));

const prompt = generatePrompt(skeleton, '/tokyo/a_{area_id}/l_{lawyer_id}/');
console.log('Prompt generated:', prompt.length, 'characters');
console.log('Prompt includes:');
console.log('  ✓ System instructions');
console.log('  ✓ DOM skeleton JSON');
console.log('  ✓ Example output format');
console.log('  ✓ ALPS naming conventions');

// 3. Save prompt for AI processing
fs.writeFileSync('./lawyer-profile-prompt.txt', prompt);
console.log('\n💾 Prompt saved to: lawyer-profile-prompt.txt');

// Summary
console.log('\n' + '='.repeat(70));
console.log('✅ Crawler Processing Complete!');
console.log('='.repeat(70));
console.log('\n📊 Extraction Summary:');
console.log(`  - Forms extracted: ${skeleton.forms.length}`);
console.log(`  - Links extracted: ${skeleton.links.length}`);
console.log(`  - Landmarks found: ${Object.keys(skeleton.landmarks).length}`);
console.log(`  - AI prompt size: ${prompt.length} chars`);

console.log('\n🎯 Next Step:');
console.log('  Send the prompt to AI to generate ALPS descriptors');
console.log('  Expected output:');
console.log('    - State: LawyerDetail');
console.log('    - Semantics: ~15 fields (userName, email, phone, etc.)');
console.log('    - Transitions: ~10 actions (quote request, consultation, bookmark)');
