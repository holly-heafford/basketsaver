require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = require('./stealth.js');

puppeteer.use(StealthPlugin());

async function testCorrectUrls() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING CORRECTED ASDA SUBCATEGORY URLS');
  console.log('='.repeat(60) + '\n');

  const testUrls = [
    'https://www.asda.com/groceries/fruit-veg-flowers/fruit/view-all-fruit',
    'https://www.asda.com/groceries/fruit-veg-flowers/vegetables-potatoes/view-all-vegetables-potatoes',
  ];

  const stealthArgs = stealth.getStealthLaunchArgs();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: stealthArgs
  });

  for (const testUrl of testUrls) {
    console.log(`\nTesting: ${testUrl}`);
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Handle cookie consent
      try {
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && (text.includes('Accept') || text.includes('accept'))) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        }
      } catch (e) {}

      // Wait for content
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for products
      const productCount = await page.evaluate(() => {
        const products = document.querySelectorAll('a[href*="/product/"]');
        return products.length;
      });

      console.log(`  ✓ Found ${productCount} products`);

    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }

    await page.close();
  }

  await browser.close();
}

testCorrectUrls().catch(console.error);
