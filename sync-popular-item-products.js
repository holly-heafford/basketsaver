require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Syncs product data from products table to popular_item_products table
 * This populates the denormalized fields
 */
async function syncPopularItemProducts() {
  console.log('🔄 Syncing product data to popular_item_products...\n');

  // Get all popular_item_products with their linked products
  const { data: mappings, error: fetchError } = await supabase
    .from('popular_item_products')
    .select(`
      id,
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
        last_scraped_at
      )
    `);

  if (fetchError) {
    console.error('❌ Error fetching mappings:', fetchError.message);
    return;
  }

  if (!mappings || mappings.length === 0) {
    console.log('No popular item products found to sync.');
    return;
  }

  console.log(`Found ${mappings.length} popular item products to sync...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const mapping of mappings) {
    const product = mapping.products;

    // Update the popular_item_products record with denormalized data
    const { error: updateError } = await supabase
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
        updated_at: new Date().toISOString()
      })
      .eq('id', mapping.id);

    if (updateError) {
      console.log(`❌ Error updating mapping ${mapping.id}: ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`✅ Synced: ${product.name.substring(0, 60)}...`);
      successCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✨ Sync complete!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('═══════════════════════════════════════════════\n');
}

// Run the script
syncPopularItemProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
