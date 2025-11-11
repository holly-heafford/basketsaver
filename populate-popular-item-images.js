require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const { getImageFromGoogle } = require('./google-image-search.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Scrape and populate image URLs for popular item products
 * This will visit each product URL and extract the image URL
 */
async function populateImageUrls() {
  console.log('🖼️  Populating image URLs for popular item products...\n');

  // Get all popular_item_products with their product URLs and supermarket info
  const { data: products, error: fetchError } = await supabase
    .from('popular_item_products')
    .select(`
      id,
      product_url,
      name,
      product_id,
      products!inner(
        supermarket_id,
        supermarkets!inner(
          slug
        )
      )
    `);

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No popular item products found.');
    return;
  }

  console.log(`Found ${products.length} products to process...\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const item of products) {
    const supermarketSlug = item.products.supermarkets.slug;
    const productUrl = item.product_url;

    console.log(`\n[${successCount + errorCount + skippedCount + 1}/${products.length}] ${item.name.substring(0, 60)}...`);
    console.log(`  Supermarket: ${supermarketSlug}`);
    console.log(`  URL: ${productUrl}`);

    if (!SUPERMARKET_SELECTORS[supermarketSlug]) {
      console.log(`  ⚠️  No selectors found for ${supermarketSlug}, skipping`);
      skippedCount++;
      continue;
    }

    try {
      // Scrape the product page to get image URL
      const productData = await scrapeSupermarket(productUrl, SUPERMARKET_SELECTORS[supermarketSlug]);

      let imageUrl = productData && productData.imageUrl ? productData.imageUrl : null;

      // If no image found from supermarket, try Google Images as fallback
      if (!imageUrl) {
        console.log(`  ⚠️  No image from supermarket, trying Google Images...`);
        try {
          imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
          if (imageUrl) {
            console.log(`  ✓ Found image from Google: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.log(`  ⚠️  No image found from Google either`);
          }
        } catch (err) {
          console.log(`  ⚠️  Google Images search failed: ${err.message}`);
        }
      } else {
        console.log(`  ✓ Found image from supermarket: ${imageUrl.substring(0, 80)}...`);
      }

      if (imageUrl) {
        // Update both products and popular_item_products tables
        // First update the products table
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', item.product_id);

        if (productUpdateError) {
          console.log(`  ❌ Error updating products table: ${productUpdateError.message}`);
          errorCount++;
          continue;
        }

        // Then update popular_item_products table
        const { error: popularUpdateError } = await supabase
          .from('popular_item_products')
          .update({ image_url: imageUrl })
          .eq('id', item.id);

        if (popularUpdateError) {
          console.log(`  ❌ Error updating popular_item_products: ${popularUpdateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Updated both tables`);
          successCount++;
        }
      } else {
        console.log(`  ⚠️  No image URL found from any source`);
        skippedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`  ❌ Error scraping: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✨ Image population complete!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('═══════════════════════════════════════════════\n');
}

// Run the script
populateImageUrls()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
