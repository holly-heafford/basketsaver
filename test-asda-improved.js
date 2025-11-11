/**
 * Test script for improved Asda scraper
 * Tests subcategory discovery on Fruit & Veg category only
 * No product scraping - just verifies subcategory detection works
 */

require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = require('./stealth.js');

puppeteer.use(StealthPlugin());

async function testAsdaSubcategoryDiscovery() {
  console.log('\n' + '='.repeat(60));
  console.log('ASDA SUBCATEGORY DISCOVERY TEST');
  console.log('='.repeat(60) + '\n');

  const testUrl = 'https://www.asda.com/groceries/fruit-veg-flowers';

  // Launch browser with stealth
  const stealthArgs = stealth.getStealthLaunchArgs();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: stealthArgs
  });

  const page = await browser.newPage();

  // Setup stealth (don't enable simulateHuman yet to avoid conflicts)
  await stealth.setupPageStealth(page, {
    searchReferer: true,
    searchQuery: 'asda groceries online shopping',
    simulateHuman: false,
    blockResources: false
  });

  await page.setViewport({ width: 1920, height: 1080 });

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
  console.log('Waiting for dynamic content to load (5-7 seconds)...\n');
  await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 2000));

  // Simulate human behavior
  console.log('Simulating human behavior (scroll, mouse movement)...\n');
  await stealth.simulateHumanBehavior(page);

  // Extract ALL grocery links for debugging
  const allGroceryLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/groceries/"]');
    return [...links].map(a => ({
      url: a.href,
      text: a.textContent?.trim() || '',
      classes: a.className
    }));
  });

  console.log(`Found ${allGroceryLinks.length} total grocery links on page\n`);

  // Show first 20 as examples
  console.log('First 20 grocery links:');
  console.log('='.repeat(60));
  allGroceryLinks.slice(0, 20).forEach((link, index) => {
    console.log(`${index + 1}. ${link.url}`);
    console.log(`   Text: "${link.text.substring(0, 50)}${link.text.length > 50 ? '...' : ''}"`);
    console.log(`   Classes: ${link.classes}`);
    console.log('');
  });

  // Extract subcategories using improved logic
  const subcategories = await page.evaluate((catUrl) => {
    const links = document.querySelectorAll('a[href*="/groceries/"]');
    const categorySlug = catUrl.split('/groceries/')[1];

    const filtered = [...links].filter(a => {
      const url = a.href.toLowerCase();
      const text = a.textContent?.trim().toLowerCase() || '';

      const isSubcategory = (
        url.includes(`/groceries/${categorySlug}/`) ||
        (url.startsWith(`https://www.asda.com/groceries/${categorySlug}`) &&
         url.split('/').length > 5)
      );

      const isNotExcluded = (
        !url.includes('onetrust.com') &&
        !url.includes('cookie') &&
        !url.includes('privacy') &&
        !url.includes('/search') &&
        !url.includes('/product/') &&
        !url.includes('/event/') &&
        !url.includes('/special-offers/') &&
        !url.includes('/rollback') &&
        !url.includes('delivery-pass')
      );

      const hasText = text.length > 0 && text.length < 100;

      return isSubcategory && isNotExcluded && hasText;
    });

    return [...new Set(filtered.map(a => ({
      url: a.href,
      text: a.textContent?.trim() || ''
    })))];
  }, testUrl);

  console.log('\n' + '='.repeat(60));
  console.log(`FOUND ${subcategories.length} SUBCATEGORIES`);
  console.log('='.repeat(60));

  if (subcategories.length > 0) {
    subcategories.forEach((subcat, index) => {
      console.log(`${index + 1}. ${subcat.url}`);
      console.log(`   Text: "${subcat.text}"`);
      console.log('');
    });
  } else {
    console.log('\n⚠️  No subcategories found! Trying broader search...\n');

    const broaderSearch = await page.evaluate((catUrl) => {
      const links = document.querySelectorAll('a');

      const filtered = [...links].filter(a => {
        const url = a.href;
        const text = a.textContent?.trim() || '';

        return (
          url.includes('/groceries/') &&
          !url.includes('/product/') &&
          url !== catUrl &&
          text.length > 2 &&
          text.length < 50
        );
      });

      return [...new Set(filtered.map(a => ({
        url: a.href,
        text: a.textContent?.trim() || ''
      })))];
    }, testUrl);

    console.log(`Broader search found ${broaderSearch.length} potential subcategories:\n`);
    broaderSearch.slice(0, 30).forEach((link, index) => {
      console.log(`${index + 1}. ${link.url}`);
      console.log(`   Text: "${link.text}"`);
      console.log('');
    });
  }

  // Now test product extraction from the main category page
  console.log('\n' + '='.repeat(60));
  console.log('TESTING PRODUCT EXTRACTION FROM MAIN PAGE');
  console.log('='.repeat(60) + '\n');

  const products = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/groceries/product/"]');
    return [...new Set([...links].map(a => a.href))];
  });

  console.log(`Found ${products.length} products on main category page\n`);

  if (products.length > 0) {
    console.log('First 10 products:');
    products.slice(0, 10).forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

testAsdaSubcategoryDiscovery().catch(console.error);
