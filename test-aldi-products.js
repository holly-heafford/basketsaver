require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testAldiProducts() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Navigate to a category page (Milk category)
  const categoryUrl = 'https://www.aldi.co.uk/products/chilled-food/milk/k/1588161416978051001';
  console.log(`Navigating to category: ${categoryUrl}\n`);

  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
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

  // Extract product data from .product-tile elements
  const products = await page.evaluate(() => {
    const tiles = document.querySelectorAll('.product-tile');
    return Array.from(tiles).map(tile => {
      // Try to find product name
      const nameEl = tile.querySelector('h3, h4, .product-title, [class*="title"]');

      // Try to find price
      const priceEl = tile.querySelector('[class*="price"]');

      // Try to find image
      const imgEl = tile.querySelector('img');

      // Try to find link
      const linkEl = tile.querySelector('a');

      return {
        name: nameEl?.textContent.trim(),
        price: priceEl?.textContent.trim(),
        imageAlt: imgEl?.alt,
        imageSrc: imgEl?.src,
        productUrl: linkEl?.href,
        outerHTML: tile.outerHTML.substring(0, 500)
      };
    });
  });

  console.log(`Found ${products.length} products on category page\n`);
  console.log('First 5 products:');
  products.slice(0, 5).forEach((product, i) => {
    console.log(`\n${i + 1}. ${product.name || 'NO NAME'}`);
    console.log(`   Price: ${product.price || 'NO PRICE'}`);
    console.log(`   URL: ${product.productUrl || 'NO URL'}`);
    console.log(`   Image: ${product.imageSrc ? product.imageSrc.substring(0, 80) : 'NO IMAGE'}`);
  });

  console.log('\n\n=== HTML Sample from first product ===');
  console.log(products[0]?.outerHTML);

  await browser.close();
}

testAldiProducts().catch(console.error);
