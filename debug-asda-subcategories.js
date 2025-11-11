/**
 * Debug script to see what's actually on Asda category pages
 * This will help us understand why subcategory discovery is failing
 */

require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = require('./stealth.js');

puppeteer.use(StealthPlugin());

async function debugAsdaPage() {
  console.log('\n' + '='.repeat(60));
  console.log('ASDA SUBCATEGORY DEBUGGING');
  console.log('='.repeat(60) + '\n');

  const testUrl = 'https://www.asda.com/groceries/fruit-veg-flowers';

  // Launch browser with stealth
  const stealthArgs = stealth.getStealthLaunchArgs();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: stealthArgs
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`Navigating to: ${testUrl}\n`);
  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Handle cookie consent
  try {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Accept') || text.includes('accept'))) {
        await button.click();
        console.log('✓ Clicked cookie consent button\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
  } catch (e) {}

  // Wait for JavaScript-rendered content
  console.log('Waiting for dynamic content to load (7 seconds)...\n');
  await new Promise(resolve => setTimeout(resolve, 7000));

  // Simulate scrolling
  console.log('Scrolling page...\n');
  await stealth.simulateHumanBehavior(page);

  // Debug 1: Look for category navigation CSS classes
  console.log('='.repeat(60));
  console.log('DEBUG 1: Looking for horizontal category navigation');
  console.log('='.repeat(60) + '\n');

  const categoryNav = await page.evaluate(() => {
    // Look for the scrollable category list
    const scrollContainer = document.querySelector('.css-9w3yau');
    if (!scrollContainer) return { found: false };

    const links = scrollContainer.querySelectorAll('a');
    return {
      found: true,
      count: links.length,
      samples: [...links].slice(0, 10).map(a => ({
        url: a.href,
        text: a.textContent?.trim() || '',
        classes: a.className
      }))
    };
  });

  if (categoryNav.found) {
    console.log(`Found category navigation with ${categoryNav.count} links:\n`);
    categoryNav.samples.forEach((link, i) => {
      console.log(`${i + 1}. ${link.text}`);
      console.log(`   URL: ${link.url}`);
      console.log(`   Classes: ${link.classes}`);
      console.log('');
    });
  } else {
    console.log('❌ Could not find .css-9w3yau container\n');
  }

  // Debug 2: All grocery links
  console.log('='.repeat(60));
  console.log('DEBUG 2: ALL links containing "/groceries/"');
  console.log('='.repeat(60) + '\n');

  const allGroceryLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/groceries/"]');
    return [...links].map(a => ({
      url: a.href,
      text: a.textContent?.trim() || '',
      classes: a.className
    }));
  });

  console.log(`Total grocery links found: ${allGroceryLinks.length}\n`);

  // Group by URL pattern
  const urlPatterns = {};
  allGroceryLinks.forEach(link => {
    const pathParts = link.url.split('/groceries/')[1]?.split('/');
    const pattern = pathParts ? pathParts[0] : 'unknown';
    if (!urlPatterns[pattern]) urlPatterns[pattern] = [];
    urlPatterns[pattern].push(link);
  });

  console.log('Links grouped by first path segment after /groceries/:\n');
  Object.keys(urlPatterns).sort().forEach(pattern => {
    console.log(`  ${pattern}: ${urlPatterns[pattern].length} links`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('DEBUG 3: Sample links for "fruit-veg-flowers" pattern');
  console.log('='.repeat(60) + '\n');

  const fruitVegLinks = urlPatterns['fruit-veg-flowers'] || [];
  fruitVegLinks.slice(0, 20).forEach((link, i) => {
    console.log(`${i + 1}. ${link.url}`);
    console.log(`   Text: "${link.text.substring(0, 60)}${link.text.length > 60 ? '...' : ''}"`);
    console.log('');
  });

  // Debug 4: Try alternative selectors
  console.log('='.repeat(60));
  console.log('DEBUG 4: Alternative selectors for category navigation');
  console.log('='.repeat(60) + '\n');

  const alternativeSelectors = [
    'nav a[href*="/groceries/"]',
    'ul a[href*="/groceries/"]',
    '[class*="category"] a',
    '[class*="nav"] a[href*="/groceries/"]',
    'li a[href*="/groceries/"]'
  ];

  for (const selector of alternativeSelectors) {
    const count = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, selector);
    console.log(`  ${selector}: ${count} matches`);
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(60));
}

debugAsdaPage().catch(console.error);
