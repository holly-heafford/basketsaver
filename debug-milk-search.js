require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugMilkSearch() {
  console.log('🔍 Debugging milk search...\n');

  // Step 1: Check what's in popular_items for milk
  console.log('Step 1: Checking popular_items for milk...');
  const { data: popularItem } = await supabase
    .from('popular_items')
    .select('*')
    .ilike('display_name', '%milk%');

  console.log('Popular items with "milk":', JSON.stringify(popularItem, null, 2));
  console.log('');

  if (popularItem && popularItem.length > 0) {
    const milkItem = popularItem[0];
    const searchTerm = milkItem.name.replace(/_/g, ' ');
    console.log(`Step 2: Testing search term: "${searchTerm}"`);
    console.log(`  (from name: "${milkItem.name}")\n`);

    // Test the exact search used by refresh script
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, normalized_name, supermarket_id, current_price')
      .or(`normalized_name.ilike.%${searchTerm}%`)
      .eq('is_available', true)
      .not('current_price', 'is', null)
      .order('current_price')
      .limit(10);

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`  Found ${products?.length || 0} products\n`);
      if (products && products.length > 0) {
        products.forEach(p => {
          console.log(`  - ${p.name}`);
          console.log(`    normalized: ${p.normalized_name}`);
          console.log(`    price: £${p.current_price}`);
          console.log('');
        });
      }
    }
  }

  // Step 3: Try alternative searches
  console.log('Step 3: Testing alternative search terms...\n');

  const alternatives = [
    'semi skimmed milk',
    'semi-skimmed milk',
    'milk semi skimmed',
    '4 pint',
    'milk 4 pint'
  ];

  for (const term of alternatives) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, normalized_name, current_price')
      .ilike('normalized_name', `%${term}%`)
      .eq('is_available', true)
      .not('current_price', 'is', null)
      .limit(3);

    console.log(`"${term}": ${products?.length || 0} results`);
    if (products && products.length > 0) {
      console.log(`  Example: ${products[0].name.substring(0, 80)}`);
    }
    console.log('');
  }
}

debugMilkSearch().catch(console.error);
