const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testSainsburysProduct() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Test direct product page
  const productUrl = 'https://www.sainsburys.co.uk/gol-ui/product/coca-cola-original-taste-24x330ml';

  console.log('Testing product page:', productUrl);
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

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

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Take screenshot
  await page.screenshot({ path: 'sainsburys-product.png', fullPage: true });
  console.log('Screenshot saved: sainsburys-product.png');

  // Try to extract product data
  const productData = await page.evaluate(() => {
    // Try different selectors for name
    const nameSelectors = ['h1', '[data-test="product-name"]', '.productNameHeader', '.pd__header h1'];
    let name = null;
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        name = el.textContent.trim();
        break;
      }
    }

    // Try different selectors for price
    const priceSelectors = [
      '[data-testid="pd-retail-price"]',
      '.pricing__now-price',
      '.pd__cost',
      '[class*="price"]'
    ];
    let price = null;
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        price = el.textContent.trim();
        break;
      }
    }

    return { name, price };
  });

  console.log('\nExtracted product data:');
  console.log('Name:', productData.name);
  console.log('Price:', productData.price);

  // Now test search results page
  console.log('\n\nTesting search results page...');
  const searchUrl = 'https://www.sainsburys.co.uk/gol-ui/SearchResults/cola';

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 8000)); // Wait longer for JS to load

  await page.screenshot({ path: 'sainsburys-search.png', fullPage: true });
  console.log('Screenshot saved: sainsburys-search.png');

  // Try to find product links
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const productLinks = [...allLinks]
      .filter(a => a.href.includes('/gol-ui/product/'))
      .map(a => a.href);
    return [...new Set(productLinks)];
  });

  console.log(`\nFound ${links.length} product links on search page:`);
  links.slice(0, 5).forEach(link => console.log(link));

  await new Promise(resolve => setTimeout(resolve, 30000)); // Keep open for inspection
  await browser.close();
}

testSainsburysProduct().catch(console.error);
