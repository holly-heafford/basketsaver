require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function investigateAldiStructure() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('\n=== Testing Aldi Search Results Structure ===\n');

  // First, let's look at a search page
  const searchUrl = 'https://www.aldi.co.uk/search?text=milk';
  console.log(`Navigating to search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

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

  // Get all links on the page
  const allLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.map(a => ({
      href: a.href,
      text: a.textContent.trim().substring(0, 100),
      hasProductInUrl: a.href.includes('/product')
    }));
  });

  console.log('\nAll links found on search page:');
  console.log('Total links:', allLinks.length);

  // Filter for product-like links
  const productLinks = allLinks.filter(l => l.href.includes('/products/'));
  console.log('\nLinks with /products/ in URL:', productLinks.length);
  console.log('\nFirst 10 product-like links:');
  productLinks.slice(0, 10).forEach((link, i) => {
    console.log(`${i + 1}. ${link.text}`);
    console.log(`   URL: ${link.href}\n`);
  });

  // Now let's try to navigate to what looks like a category page
  const categoryUrl = 'https://www.aldi.co.uk/products/chilled-food/milk/k/1588161416978051001';
  console.log(`\n=== Navigating to Category Page ===`);
  console.log(`URL: ${categoryUrl}\n`);

  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Look for actual product items on this category page
  const categoryProducts = await page.evaluate(() => {
    // Try various selectors that might indicate product cards
    const selectors = [
      '.product-tile',
      '.product-card',
      '[data-product-id]',
      'article',
      '.grid-item',
      'a[href*="/p/"]'
    ];

    const results = [];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.push({
          selector: selector,
          count: elements.length,
          samples: Array.from(elements).slice(0, 3).map(el => ({
            html: el.outerHTML.substring(0, 200),
            text: el.textContent.trim().substring(0, 100)
          }))
        });
      }
    }

    // Also look for all links on this category page
    const links = Array.from(document.querySelectorAll('a'));
    const productPageLinks = links.filter(a =>
      a.href.includes('/p/') && !a.href.includes('/products/')
    );

    return {
      possibleSelectors: results,
      productPageLinks: productPageLinks.slice(0, 10).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 50)
      }))
    };
  });

  console.log('\nCategory page analysis:');
  console.log('Possible product selectors found:');
  categoryProducts.possibleSelectors.forEach(s => {
    console.log(`  ${s.selector}: ${s.count} elements`);
  });

  console.log('\nProduct page links (with /p/ in URL):');
  categoryProducts.productPageLinks.forEach((link, i) => {
    console.log(`${i + 1}. ${link.text}`);
    console.log(`   ${link.href}\n`);
  });

  // If we found any actual product links, let's visit one
  if (categoryProducts.productPageLinks.length > 0) {
    const testProductUrl = categoryProducts.productPageLinks[0].href;
    console.log(`\n=== Testing Actual Product Page ===`);
    console.log(`URL: ${testProductUrl}\n`);

    await page.goto(testProductUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const productData = await page.evaluate(() => {
      // Try to find product details
      return {
        title: document.querySelector('h1')?.textContent.trim(),
        price: document.querySelector('[class*="price"]')?.textContent.trim(),
        description: document.querySelector('[class*="description"]')?.textContent.trim().substring(0, 200),
        images: Array.from(document.querySelectorAll('img')).slice(0, 3).map(img => ({
          src: img.src,
          alt: img.alt
        }))
      };
    });

    console.log('Product data found:');
    console.log(JSON.stringify(productData, null, 2));
  }

  await browser.close();
}

investigateAldiStructure().catch(console.error);
