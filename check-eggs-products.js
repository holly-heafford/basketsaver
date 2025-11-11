require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkEggsProducts() {
  console.log('🥚 Checking eggs products in popular_item_products...\n');

  // Get the eggs popular item
  const { data: eggsItem } = await supabase
    .from('popular_items')
    .select('id, name, display_name')
    .eq('name', 'eggs')
    .single();

  if (!eggsItem) {
    console.log('No eggs item found');
    return;
  }

  console.log(`Popular item: ${eggsItem.display_name} (${eggsItem.name})\n`);

  // Get all associated products
  const { data: products } = await supabase
    .from('popular_item_products')
    .select(`
      id,
      name,
      current_price,
      products!inner(
        supermarkets!inner(name)
      )
    `)
    .eq('popular_item_id', eggsItem.id)
    .order('current_price');

  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }

  console.log(`Found ${products.length} products:\n`);

  products.forEach((p, i) => {
    const supermarket = p.products.supermarkets.name;
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   ${supermarket} - £${p.current_price}`);
    console.log('');
  });
}

checkEggsProducts().catch(console.error);
