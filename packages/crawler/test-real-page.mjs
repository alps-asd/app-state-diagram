#!/usr/bin/env node
/**
 * Test crawler with realistic example.com lawyer profile page
 * Based on actual page structure from https://www.example.com/tokyo/a_13116/l_1467010/
 */

import { DomSkeletonExtractor } from './dist/dom-skeleton-extractor.js';
import { generatePrompt } from './dist/alps-descriptor-generator.js';
import fs from 'fs';

// Realistic HTML based on actual lawyer profile
const lawyerProfileHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>John Doe Lawyer - Tokyo, Toshima Ward | Example Lawyer Search</title>
  <meta name="description" content="Profile of Lawyer John Doe. Handles international/foreign issues, criminal cases, internet issues, etc. Supports Chinese.">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/tokyo/">Tokyo</a>
    <a href="/area/13/13116/">Toshima Ward</a>
    <a href="/specialty/international/">International/Foreign Issues</a>
    <a href="/private/bookmark/lawyer/">Favorite Lawyers</a>
  </nav>

  <main>
    <h1>Lawyer John Doe</h1>

    <!-- Lawyer Info -->
    <section class="lawyer-info">
      <p>Tokyo Bar Association / Registered 2019</p>
      <p>Example Law School / Graduated 2017</p>
      <p>Chinese language support available</p>
    </section>

    <!-- Practice Areas -->
    <section class="practice-areas">
      <h2>Practice Areas</h2>
      <ul>
        <li><a href="/specialty/international/">International/Foreign Issues</a></li>
        <li><a href="/specialty/criminal/">Criminal Cases</a></li>
        <li><a href="/specialty/internet/">Internet Issues</a></li>
        <li><a href="/specialty/divorce/">Divorce/Gender Issues</a></li>
        <li><a href="/specialty/labor/">Labor Issues</a></li>
      </ul>
    </section>

    <!-- Add to Bookmark Form -->
    <form id="add-bookmark" action="/private/bookmark/lawyer/add" method="POST">
      <input type="hidden" name="lawyerId" value="1467010">
      <textarea name="bookmarkNote" placeholder="Note (Optional)"></textarea>
      <button type="submit">Add to Favorites</button>
    </form>

    <!-- Contact/Quote Request Form -->
    <form id="quote-request" action="/quote/submit" method="POST">
      <h3>Request Quote</h3>
      <input type="hidden" name="lawyerId" value="1467010" required>
      <input type="text" name="userName" placeholder="Name" required>
      <input type="email" name="email" placeholder="Email" required>
      <input type="tel" name="phone" placeholder="Phone Number">
      <select name="consultationType" required>
        <option value="">Select Consultation Content</option>
        <option value="international">International/Foreign Issues</option>
        <option value="criminal">Criminal Cases</option>
        <option value="internet">Internet Issues</option>
      </select>
      <textarea name="inquiryContent" placeholder="Details of Consultation" required></textarea>
      <button type="submit">Request Quote</button>
    </form>

    <!-- Free Consultation Form -->
    <form id="free-consultation" action="/consultation/request" method="POST">
      <h3>Free Consultation (First 15 mins)</h3>
      <input type="hidden" name="lawyerId" value="1467010" required>
      <input type="text" name="userName" placeholder="Name" required>
      <input type="tel" name="phone" placeholder="Phone Number" required>
      <select name="preferredTime" required>
        <option value="">Preferred Time</option>
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening/Night</option>
      </select>
      <textarea name="briefDescription" placeholder="Consultation Content (Briefly)"></textarea>
      <button type="submit">Request Free Consultation</button>
    </form>

    <!-- Navigation Links -->
    <div class="navigation">
      <a href="/tokyo/a_13116/">Lawyers in Toshima Ward</a>
      <a href="/specialty/international/">Lawyers for International Issues</a>
      <a href="/lawyers/">Lawyer Search Top</a>
    </div>
  </main>

  <footer>
    <a href="/about/">Operating Company</a>
    <a href="/privacy/">Privacy Policy</a>
    <a href="/support/">Contact Us</a>
  </footer>
</body>
</html>
`;

console.log('🧪 Testing Crawler with Realistic Lawyer Profile Page\n');
console.log('='.repeat(70));

// 1. Extract DOM Skeleton
console.log('\n📝 Step 1: Extract DOM Skeleton');
console.log('-'.repeat(70));

const extractor = new DomSkeletonExtractor();
const skeleton = extractor.extract(lawyerProfileHtml, 'https://www.example.com/tokyo/a_13116/l_1467010/');

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
