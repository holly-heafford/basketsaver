require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const { getImageFromGoogle } = require('./google-image-search.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Fetch missing images for popular_item_products
 * Uses Google Images as automatic fallback
 */
async function fetchMissingImages() {
  console.log('🖼️  Fetching missing images for popular item products...\n');

  const { data: missingImages, error: missingImagesError } = await supabase
    .from('popular_item_products')
    .select(`
      id,
      name,
      product_id,
      product_url,
      image_url,
      products!inner(
        supermarket_id,
        supermarkets!inner(slug)
      )
    `)
    .is('image_url', null);

  if (missingImagesError) {
    console.error('❌ Error checking for missing images:', missingImagesError.message);
    return;
  }

  if (!missingImages || missingImages.length === 0) {
    console.log('✅ All products have images!\n');
    return;
  }

  console.log(`Found ${missingImages.length} products without images\n`);

  let imagesFetched = 0;
  let imagesFailed = 0;

  for (const item of missingImages) {
    const supermarketSlug = item.products.supermarkets.slug;

    console.log(`[${imagesFetched + imagesFailed + 1}/${missingImages.length}] ${item.name.substring(0, 60)}...`);
    console.log(`   Supermarket: ${supermarketSlug}`);

    if (!SUPERMARKET_SELECTORS[supermarketSlug]) {
      console.log(`   ⚠️  No selectors, trying Google Images...`);

      try {
        const imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
        if (imageUrl) {
          await supabase.from('products').update({ image_url: imageUrl }).eq('id', item.product_id);
          await supabase.from('popular_item_products').update({ image_url: imageUrl }).eq('id', item.id);
          console.log(`   ✅ Fetched from Google\n`);
          imagesFetched++;
        } else {
          console.log(`   ❌ No image found\n`);
          imagesFailed++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        imagesFailed++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    try {
      // Try supermarket first
      console.log(`   Trying ${supermarketSlug}...`);
      const productData = await scrapeSupermarket(item.product_url, SUPERMARKET_SELECTORS[supermarketSlug]);
      let imageUrl = productData && productData.imageUrl ? productData.imageUrl : null;

      // If no image from supermarket, try Google Images
      if (!imageUrl) {
        console.log(`   ⚠️  No image from ${supermarketSlug}, trying Google...`);
        try {
          imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
        } catch (googleError) {
          console.log(`   ⚠️  Google also failed: ${googleError.message}`);
        }
      }

      if (imageUrl) {
        await supabase.from('products').update({ image_url: imageUrl }).eq('id', item.product_id);
        await supabase.from('popular_item_products').update({ image_url: imageUrl }).eq('id', item.id);
        console.log(`   ✅ Fetched successfully\n`);
        imagesFetched++;
      } else {
        console.log(`   ❌ No image found from any source\n`);
        imagesFailed++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Scraping error: ${error.message}`);

      // Try Google Images as last resort
      try {
        console.log(`   ⚠️  Trying Google as fallback...`);
        const imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
        if (imageUrl) {
          await supabase.from('products').update({ image_url: imageUrl }).eq('id', item.product_id);
          await supabase.from('popular_item_products').update({ image_url: imageUrl }).eq('id', item.id);
          console.log(`   ✅ Recovered with Google\n`);
          imagesFetched++;
        } else {
          console.log(`   ❌ Google also failed\n`);
          imagesFailed++;
        }
      } catch (googleError) {
        console.log(`   ❌ Total failure\n`);
        imagesFailed++;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✨ Image fetch complete!');
  console.log(`   ✅ Success: ${imagesFetched}`);
  console.log(`   ❌ Failed: ${imagesFailed}`);
  console.log('═══════════════════════════════════════════════\n');
}

fetchMissingImages().catch(console.error);
