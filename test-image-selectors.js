const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testImageSelectors(url, supermarket) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log(`\n=== Testing ${supermarket} ===`);
  console.log(`URL: ${url}\n`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Try to find and click cookie button
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

  // Extract all image elements and their attributes
  const images = await page.evaluate(() => {
    const allImages = document.querySelectorAll('img');
    return Array.from(allImages).map(img => ({
      src: img.src,
      dataSrc: img.getAttribute('data-src'),
      dataLazySrc: img.getAttribute('data-lazy-src'),
      alt: img.alt,
      className: img.className,
      id: img.id,
      width: img.width,
      height: img.height
    })).filter(img =>
      // Filter to likely product images (reasonable size)
      img.width > 100 && img.height > 100
    );
  });

  console.log(`Found ${images.length} potential product images:\n`);
  images.forEach((img, i) => {
    console.log(`Image ${i + 1}:`);
    console.log(`  src: ${img.src ? img.src.substring(0, 100) : 'null'}`);
    console.log(`  data-src: ${img.dataSrc ? img.dataSrc.substring(0, 100) : 'null'}`);
    console.log(`  alt: ${img.alt}`);
    console.log(`  class: ${img.className}`);
    console.log(`  id: ${img.id}`);
    console.log(`  size: ${img.width}x${img.height}\n`);
  });

  await browser.close();
}

async function runTests() {
  // Test Tesco
  await testImageSelectors(
    'https://www.tesco.com/groceries/en-GB/products/299389116',
    'Tesco'
  );

  // Test Asda
  await testImageSelectors(
    'https://www.asda.com/groceries/product/spaghetti-tagliatelle/asda-wholewheat-spaghetti-500g/6173267',
    'Asda'
  );

  // Test Morrisons
  await testImageSelectors(
    'https://groceries.morrisons.com/products/morrisons-snack-size-bananas/111388415',
    'Morrisons'
  );
}

runTests().catch(console.error);
