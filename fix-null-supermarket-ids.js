require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixNullSupermarketIds() {
  console.log('🔧 Fixing NULL supermarket_ids in popular_item_products...\n');

  // Get all records with NULL supermarket_id and their product's supermarket_id
  const { data, error } = await supabase
    .from('popular_item_products')
    .select(`
      id,
      name,
      product_id,
      supermarket_id,
      products!inner(
        supermarket_id
      )
    `)
    .is('supermarket_id', null);

  if (error) {
    console.error('❌ Error fetching records:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ No NULL supermarket_ids found! All records are already fixed.\n');
    return;
  }

  console.log(`Found ${data.length} records to fix\n`);

  let fixed = 0;
  let failed = 0;

  for (const item of data) {
    const correctSupermarketId = item.products.supermarket_id;

    console.log(`Fixing: ${item.name}`);
    console.log(`  Product ID: ${item.product_id}`);
    console.log(`  Setting supermarket_id to: ${correctSupermarketId}`);

    const { error: updateError } = await supabase
      .from('popular_item_products')
      .update({
        supermarket_id: correctSupermarketId,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (updateError) {
      console.log(`  ❌ Error: ${updateError.message}\n`);
      failed++;
    } else {
      console.log(`  ✅ Fixed\n`);
      fixed++;
    }
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✨ Fix complete!');
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════\n');
}

fixNullSupermarketIds().catch(console.error);
