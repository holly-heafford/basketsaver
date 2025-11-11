require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const { getImageFromGoogle } = require('./google-image-search.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Refresh popular items with the cheapest available products
 * This should be run after scraping to ensure popular items show the best prices
 */
async function refreshPopularItems() {
  console.log('🔄 Refreshing popular items with latest products...\n');

  try {
    // Step 1: Get all active popular items
    const { data: popularItems, error: itemsError } = await supabase
      .from('popular_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (itemsError) {
      console.error('❌ Error fetching popular items:', itemsError.message);
      return false;
    }

    if (!popularItems || popularItems.length === 0) {
      console.log('⚠️  No active popular items found');
      return false;
    }

    console.log(`Found ${popularItems.length} active popular items\n`);

    let totalUpdated = 0;
    let totalAdded = 0;

    // Step 2: Process each popular item
    for (const item of popularItems) {
      console.log(`\n📦 Processing: ${item.display_name || item.name}`);

      // Step 3: Find matching products
      const searchTerm = item.name.replace(/_/g, ' ');

      const { data: allProducts, error: searchError } = await supabase
        .from('products')
        .select('id, name, normalized_name, supermarket_id, current_price, image_url')
        .or(`normalized_name.ilike.%${searchTerm}%`)
        .eq('is_available', true)
        .not('current_price', 'is', null)
        .order('current_price');

      if (searchError) {
        console.error(`   ❌ Error searching products: ${searchError.message}`);
        continue;
      }

      if (!allProducts || allProducts.length === 0) {
        console.log(`   ⚠️  No products found for "${searchTerm}"`);
        continue;
      }

      // Filter out products that contain the search term but aren't actually that product
      const excludePatterns = [
        /baby food/i,
        /baby meal/i,
        /pudding/i,
        /yogurt/i,
        /yoghurt/i,
        /smoothie/i,
        /juice/i,
        /porridge/i,
        /cereal/i,
        /muffin/i,
        /cake/i,
        /biscuit/i,
        /cookie/i,
        /ice cream/i,
        /flavour/i,
        /flavor/i,
        /sauce/i,
        /jam/i,
        /preserve/i,
        /chutney/i,
        /puree/i,
        /baby/i,
        /toddler/i,
        /infant/i,
        /snack bar/i,
        /energy bar/i,
        /protein bar/i,
        /egg rice/i,
        /egg fried rice/i,
        /egg noodle/i,
        /custard/i,
        /tart/i,
        /egg mayo/i,
        /scotch egg/i
      ];

      const products = allProducts.filter(product => {
        const normalizedName = product.normalized_name.toLowerCase();

        // Exclude if it matches any of the exclusion patterns
        if (excludePatterns.some(pattern => pattern.test(normalizedName))) {
          return false;
        }

        return true;
      });

      if (products.length === 0) {
        console.log(`   ⚠️  No suitable products found after filtering (found ${allProducts.length} but all were compound products)`);
        continue;
      }

      console.log(`   Found ${products.length} matching products (filtered from ${allProducts.length})`);

      // Step 4: Group by supermarket and get cheapest for each
      const productsBySupermarket = {};
      products.forEach(product => {
        if (!productsBySupermarket[product.supermarket_id]) {
          productsBySupermarket[product.supermarket_id] = [];
        }
        productsBySupermarket[product.supermarket_id].push(product);
      });

      // Step 5: Get current associations
      const { data: currentAssociations, error: currentError } = await supabase
        .from('popular_item_products')
        .select('id, product_id, supermarket_id:products!inner(supermarket_id)')
        .eq('popular_item_id', item.id);

      if (currentError) {
        console.error(`   ❌ Error fetching current associations: ${currentError.message}`);
        continue;
      }

      const currentBySupermarket = {};
      if (currentAssociations) {
        currentAssociations.forEach(assoc => {
          const smId = assoc.supermarket_id.supermarket_id;
          currentBySupermarket[smId] = {
            id: assoc.id,
            product_id: assoc.product_id
          };
        });
      }

      // Step 6: Update or insert for each supermarket
      for (const [supermarketId, smProducts] of Object.entries(productsBySupermarket)) {
        const smIdNum = parseInt(supermarketId);
        const cheapest = smProducts.sort((a, b) => a.current_price - b.current_price)[0];

        if (currentBySupermarket[smIdNum]) {
          // Update if product changed
          if (currentBySupermarket[smIdNum].product_id !== cheapest.id) {
            const { error: updateError } = await supabase
              .from('popular_item_products')
              .update({
                product_id: cheapest.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentBySupermarket[smIdNum].id);

            if (updateError) {
              console.error(`   ❌ Error updating: ${updateError.message}`);
            } else {
              console.log(`   ✓ Updated: ${cheapest.name.substring(0, 50)}... (£${cheapest.current_price})`);
              totalUpdated++;
            }
          }
        } else {
          // Insert new association
          const { error: insertError } = await supabase
            .from('popular_item_products')
            .insert({
              popular_item_id: item.id,
              product_id: cheapest.id,
              is_featured: false
            });

          if (insertError) {
            console.error(`   ❌ Error inserting: ${insertError.message}`);
          } else {
            console.log(`   ✓ Added: ${cheapest.name.substring(0, 50)}... (£${cheapest.current_price})`);
            totalAdded++;
          }
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✨ Refresh complete!');
    console.log(`   Updated: ${totalUpdated} associations`);
    console.log(`   Added: ${totalAdded} new associations`);
    console.log('═══════════════════════════════════════════════\n');

    // Step 7: Sync denormalized data
    console.log('🔄 Syncing denormalized data...\n');

    const { data: allAssociations, error: syncFetchError } = await supabase
      .from('popular_item_products')
      .select(`
        id,
        popular_item_id,
        product_id,
        products!inner(
          name,
          product_url,
          product_code,
          current_price,
          price_per_unit,
          image_url,
          normalized_name,
          tags,
          last_scraped_at,
          supermarket_id
        )
      `);

    if (syncFetchError) {
      console.error('❌ Error fetching for sync:', syncFetchError.message);
      return false;
    }

    let syncCount = 0;
    for (const assoc of allAssociations) {
      const product = assoc.products;

      const { error: syncError } = await supabase
        .from('popular_item_products')
        .update({
          name: product.name,
          product_url: product.product_url,
          product_code: product.product_code,
          current_price: product.current_price,
          price_per_unit: product.price_per_unit,
          image_url: product.image_url,
          normalized_name: product.normalized_name,
          tags: product.tags,
          last_scraped_at: product.last_scraped_at,
          supermarket_id: product.supermarket_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', assoc.id);

      if (!syncError) {
        syncCount++;
      }
    }

    console.log(`✅ Synced ${syncCount} products\n`);

    // Step 8: Populate missing images
    console.log('🖼️  Checking for missing images...\n');

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
    } else if (missingImages && missingImages.length > 0) {
      console.log(`⚠️  Found ${missingImages.length} products without images. Fetching...\n`);

      let imagesFetched = 0;
      let imagesFailed = 0;

      for (const item of missingImages) {
        const supermarketSlug = item.products.supermarkets.slug;

        console.log(`   Fetching: ${item.name.substring(0, 50)}...`);

        if (!SUPERMARKET_SELECTORS[supermarketSlug]) {
          console.log(`      ⚠️  No selectors for ${supermarketSlug}, skipping`);
          imagesFailed++;
          continue;
        }

        try {
          // Try to get image from supermarket first
          const productData = await scrapeSupermarket(item.product_url, SUPERMARKET_SELECTORS[supermarketSlug]);
          let imageUrl = productData && productData.imageUrl ? productData.imageUrl : null;

          // If no image from supermarket, try Google Images as fallback
          if (!imageUrl) {
            console.log(`      ⚠️  No image from supermarket, trying Google Images...`);
            try {
              imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
              if (imageUrl) {
                console.log(`      ✓ Found image from Google`);
              }
            } catch (googleError) {
              console.log(`      ⚠️  Google Images also failed: ${googleError.message}`);
            }
          }

          if (imageUrl) {
            // Update both products and popular_item_products tables
            await supabase
              .from('products')
              .update({ image_url: imageUrl })
              .eq('id', item.product_id);

            await supabase
              .from('popular_item_products')
              .update({ image_url: imageUrl })
              .eq('id', item.id);

            console.log(`      ✅ Fetched image successfully`);
            imagesFetched++;
          } else {
            console.log(`      ❌ No image found from any source`);
            imagesFailed++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);

          // Try Google Images as last resort even if scraping failed
          try {
            console.log(`      ⚠️  Trying Google Images as fallback...`);
            const imageUrl = await getImageFromGoogle(item.name, supermarketSlug);
            if (imageUrl) {
              await supabase
                .from('products')
                .update({ image_url: imageUrl })
                .eq('id', item.product_id);

              await supabase
                .from('popular_item_products')
                .update({ image_url: imageUrl })
                .eq('id', item.id);

              console.log(`      ✅ Recovered with Google Images`);
              imagesFetched++;
            } else {
              imagesFailed++;
            }
          } catch (googleError) {
            imagesFailed++;
          }
        }
      }

      console.log(`\n✅ Image fetch complete: ${imagesFetched} fetched, ${imagesFailed} failed\n`);
    } else {
      console.log('✅ All products have images\n');
    }

    return true;

  } catch (error) {
    console.error('Fatal error:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  refreshPopularItems()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

// Export for use in other scripts
module.exports = { refreshPopularItems };
