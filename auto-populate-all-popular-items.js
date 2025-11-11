require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Search terms for each popular item
const searchTerms = {
  'milk_4pint_semi_skimmed': '2.272l semi skimmed milk',
  'baked_beans': 'baked beans 400g',
  'white_bread': 'white bread 800g',
  'eggs_6_pack': 'eggs 6 medium',
  'cheddar_cheese': 'cheddar cheese 350g',
  'pasta': 'spaghetti 500g',
  'minced_beef': 'minced beef 500g',
  'bananas': 'banana',
  'apples': 'apple',
  'chicken_breast': 'chicken breast'
};

async function autoPopulateAll() {
  console.log('🔍 Auto-populating all popular items with products...\n');

  // Get all popular items
  const { data: items, error: itemsError } = await supabase
    .from('popular_items')
    .select('id, name, display_name')
    .eq('is_active', true)
    .order('display_order');

  if (itemsError) {
    console.error('❌ Error fetching popular items:', itemsError.message);
    return;
  }

  if (!items || items.length === 0) {
    console.log('No popular items found.');
    return;
  }

  // Get all supermarkets
  const { data: supermarkets, error: supermarketsError } = await supabase
    .from('supermarkets')
    .select('id, name');

  if (supermarketsError) {
    console.error('❌ Error fetching supermarkets:', supermarketsError.message);
    return;
  }

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  // Process each popular item
  for (const item of items) {
    const searchTerm = searchTerms[item.name];

    if (!searchTerm) {
      console.log(`⚠️  [${item.display_name}] No search term defined, skipping...`);
      continue;
    }

    console.log(`\n📦 ${item.display_name}`);
    console.log(`   Search term: "${searchTerm}"`);
    console.log('   ────────────────────────────────────────');

    let itemAdded = 0;

    // Find cheapest product for each supermarket
    for (const supermarket of supermarkets) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('popular_item_products')
        .select('id')
        .eq('popular_item_id', item.id)
        .eq('supermarket_id', supermarket.id)
        .maybeSingle();

      if (existing) {
        console.log(`   ⚠️  [${supermarket.name}] Already linked`);
        totalSkipped++;
        continue;
      }

      // Find cheapest matching product
      const { data: products } = await supabase
        .from('products')
        .select('id, name, current_price')
        .eq('supermarket_id', supermarket.id)
        .ilike('normalized_name', `%${searchTerm}%`)
        .eq('is_available', true)
        .not('current_price', 'is', null)
        .order('current_price')
        .limit(1);

      if (!products || products.length === 0) {
        console.log(`   ❌ [${supermarket.name}] No products found`);
        totalNotFound++;
        continue;
      }

      const product = products[0];

      // Insert the mapping
      const { error: insertError } = await supabase
        .from('popular_item_products')
        .insert({
          popular_item_id: item.id,
          product_id: product.id,
          supermarket_id: supermarket.id,
          is_featured: false
        });

      if (insertError) {
        console.log(`   ❌ [${supermarket.name}] Error: ${insertError.message}`);
      } else {
        const price = parseFloat(product.current_price).toFixed(2);
        console.log(`   ✅ [${supermarket.name}] £${price} - ${product.name.substring(0, 50)}...`);
        itemAdded++;
        totalAdded++;
      }
    }

    if (itemAdded > 0) {
      console.log(`   ✨ Added ${itemAdded} product(s) for ${item.display_name}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✨ Auto-population complete!');
  console.log(`   ✅ Added: ${totalAdded}`);
  console.log(`   ⚠️  Skipped (already exists): ${totalSkipped}`);
  console.log(`   ❌ Not found: ${totalNotFound}`);
  console.log('═══════════════════════════════════════════════\n');
}

// Run the script
autoPopulateAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
