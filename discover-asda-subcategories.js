require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = require('./stealth.js');

puppeteer.use(StealthPlugin());

async function discoverSubcategories() {
  console.log('\n' + '='.repeat(60));
  console.log('DISCOVERING ASDA SUBCATEGORY LINKS');
  console.log('='.repeat(60) + '\n');

  const mainUrl = 'https://www.asda.com/groceries/fruit-veg-flowers';

  const stealthArgs = stealth.getStealthLaunchArgs();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: stealthArgs
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`Navigating to: ${mainUrl}\n`);
  await page.goto(mainUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

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

  // Wait and scroll
  await new Promise(resolve => setTimeout(resolve, 7000));
  await stealth.simulateHumanBehavior(page);

  // Look for "Explore Department" section
  const subcatLinks = await page.evaluate(() => {
    // Try to find the "Explore Department" section
    const exploreSections = [...document.querySelectorAll('h2, h3, div')]
      .filter(el => el.textContent?.includes('Explore Department') || el.textContent?.includes('Explore'));

    console.log('Found explore sections:', exploreSections.length);

    // Get all links from the page for debugging
    const allLinks = document.querySelectorAll('a[href*="/fruit-veg-flowers/"]');
    return [...allLinks]
      .map(a => ({
        url: a.href,
        text: a.textContent?.trim() || '',
        classes: a.className
      }))
      .filter(link =>
        link.url.includes('/view-all-') &&
        !link.url.includes('/product/')
      );
  });

  console.log(`Found ${subcatLinks.length} potential subcategory links:\n`);

  const uniqueUrls = [...new Set(subcatLinks.map(l => l.url))];
  uniqueUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });

  await browser.close();
}

discoverSubcategories().catch(console.error);
