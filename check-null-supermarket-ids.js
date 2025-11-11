require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkNullSupermarketIds() {
  console.log('🔍 Checking for NULL supermarket_ids in popular_item_products...\n');

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
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ No NULL supermarket_ids found! All records are properly populated.\n');
    return;
  }

  console.log(`⚠️  Found ${data.length} records with NULL supermarket_id:\n`);

  for (const item of data) {
    console.log(`ID: ${item.id}`);
    console.log(`  Name: ${item.name}`);
    console.log(`  Product ID: ${item.product_id}`);
    console.log(`  Current supermarket_id: ${item.supermarket_id}`);
    console.log(`  Actual supermarket_id from products: ${item.products.supermarket_id}`);
    console.log('');
  }

  console.log(`\nTotal records with NULL supermarket_id: ${data.length}\n`);
}

checkNullSupermarketIds().catch(console.error);
