const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Search Google Images for a product and return the first result
 * @param {string} productName - The name of the product
 * @param {string} supermarketName - The supermarket name (optional, for better results)
 * @returns {Promise<string|null>} - The image URL or null
 */
async function getImageFromGoogle(productName, supermarketName = '') {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Build search query
    const searchQuery = supermarketName
      ? `${productName} ${supermarketName} product`
      : `${productName} supermarket product`;

    const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`;

    console.log(`  Searching Google Images: "${searchQuery}"`);
    await page.goto(googleImagesUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Handle cookie consent if present
    try {
      const cookieButton = await page.$('button[aria-label*="Accept"], button:has-text("Accept all")');
      if (cookieButton) {
        await cookieButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {}

    // Extract the first image result
    const imageUrl = await page.evaluate(() => {
      // Try multiple selectors for Google Images
      const img = document.querySelector('img[src*="gstatic.com"]:not([src*="logo"])');
      if (img && img.src) {
        return img.src;
      }

      // Fallback: try to find any product-looking image
      const images = Array.from(document.querySelectorAll('img'));
      for (const image of images) {
        if (image.src && image.src.startsWith('http') &&
            !image.src.includes('logo') &&
            !image.src.includes('icon') &&
            image.width > 100 && image.height > 100) {
          return image.src;
        }
      }

      return null;
    });

    await browser.close();
    return imageUrl;

  } catch (error) {
    console.error(`  Error searching Google Images: ${error.message}`);
    await browser.close();
    return null;
  }
}

module.exports = { getImageFromGoogle };
