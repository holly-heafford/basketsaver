const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testSainsburys() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const searchUrl = 'https://www.sainsburys.co.uk/shop/gb/groceries/search?entry=milk';

  console.log('Navigating to:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Handle cookies
  try {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Accept') || text.includes('accept'))) {
        await button.click();
        console.log('Clicked cookie button');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
  } catch (e) {}

  // Take a screenshot
  await page.screenshot({ path: 'sainsburys-debug.png', fullPage: true });
  console.log('Screenshot saved: sainsburys-debug.png');

  // Try different selectors
  const tests = [
    'a[href*="/product/"]',
    'a[href*="sainsburys.co.uk"]',
    'a[href*="/groceries/"]',
    'a.pt__link',
    'a[data-test*="product"]',
    '.pt__info a',
    '.pt a'
  ];

  for (const selector of tests) {
    const count = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return elements.length;
    }, selector);
    console.log(`Selector "${selector}": found ${count} elements`);
  }

  // Get all links and their href attributes
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    return [...allLinks]
      .filter(a => a.href.includes('product') || a.href.includes('groceries'))
      .slice(0, 10)
      .map(a => a.href);
  });

  console.log('\nSample product links:');
  links.forEach(link => console.log(link));

  await new Promise(resolve => setTimeout(resolve, 60000)); // Keep browser open for manual inspection
  await browser.close();
}

testSainsburys().catch(console.error);
