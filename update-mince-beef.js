require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateMinceBeef() {
  console.log('🔄 Updating "Minced Beef" to "Mince Beef"...\n');

  try {
    // Step 1: Update the popular_items table
    const { data: popularItem, error: updateError } = await supabase
      .from('popular_items')
      .update({
        name: 'mince_beef',
        display_name: 'Mince Beef'
      })
      .eq('name', 'minced_beef')
      .select();

    if (updateError) {
      console.error('❌ Error updating popular_items:', updateError.message);
      return;
    }

    if (!popularItem || popularItem.length === 0) {
      console.log('⚠️  No item found with name "minced beef". Checking for variations...');

      // Try to find it with different casing
      const { data: items, error: searchError } = await supabase
        .from('popular_items')
        .select('*')
        .ilike('name', '%beef%');

      if (searchError) {
        console.error('❌ Error searching:', searchError.message);
        return;
      }

      console.log('\nFound these beef items:');
      items.forEach(item => {
        console.log(`  - ID: ${item.id}, Name: "${item.name}", Display: "${item.display_name}"`);
      });

      return;
    }

    console.log('✅ Updated popular_items table');
    console.log(`   ID: ${popularItem[0].id}`);
    console.log(`   New name: ${popularItem[0].name}`);
    console.log(`   New display_name: ${popularItem[0].display_name}`);

    // Step 2: Delete old associations from popular_item_products
    const { error: deleteError } = await supabase
      .from('popular_item_products')
      .delete()
      .eq('popular_item_id', popularItem[0].id);

    if (deleteError) {
      console.error('❌ Error deleting old associations:', deleteError.message);
      return;
    }

    console.log('✅ Cleared old product associations');

    // Step 3: Find products matching "mince beef" (not "minced beef")
    console.log('\n🔍 Searching for products matching "mince beef"...');

    const { data: products, error: searchError } = await supabase
      .from('products')
      .select('id, name, normalized_name, supermarket_id, current_price')
      .or('normalized_name.ilike.%mince beef%,normalized_name.ilike.%beef mince%')
      .not('normalized_name', 'ilike', '%minced%')
      .is('is_available', true)
      .order('current_price');

    if (searchError) {
      console.error('❌ Error searching products:', searchError.message);
      return;
    }

    console.log(`Found ${products.length} products`);

    // Step 4: Group by supermarket and pick cheapest for each
    const productsBySupermarket = {};
    products.forEach(product => {
      if (!productsBySupermarket[product.supermarket_id]) {
        productsBySupermarket[product.supermarket_id] = [];
      }
      productsBySupermarket[product.supermarket_id].push(product);
    });

    // Step 5: Insert new associations
    let insertCount = 0;
    for (const [supermarketId, smProducts] of Object.entries(productsBySupermarket)) {
      // Pick the cheapest product for this supermarket
      const cheapest = smProducts.sort((a, b) => a.current_price - b.current_price)[0];

      const { error: insertError } = await supabase
        .from('popular_item_products')
        .insert({
          popular_item_id: popularItem[0].id,
          product_id: cheapest.id,
          is_featured: false
        });

      if (insertError) {
        console.error(`❌ Error inserting for supermarket ${supermarketId}:`, insertError.message);
      } else {
        console.log(`   ✓ Added: ${cheapest.name} (£${cheapest.current_price})`);
        insertCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✨ Update complete!');
    console.log(`   Updated popular item: "Mince Beef"`);
    console.log(`   Added ${insertCount} product associations`);
    console.log('═══════════════════════════════════════════════\n');

    // Step 6: Run sync to populate denormalized fields
    console.log('🔄 Running sync to populate denormalized fields...\n');
    const syncScript = require('./sync-popular-item-products.js');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateMinceBeef()
  .then(() => {
    console.log('Done! Now running sync...');
    // Give a moment for the inserts to complete
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
