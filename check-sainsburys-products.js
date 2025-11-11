require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkProducts() {
  // Get Sainsbury's supermarket ID
  const { data: supermarket } = await supabase
    .from('supermarkets')
    .select('id, name')
    .eq('slug', 'sainsburys')
    .single();

  if (!supermarket) {
    console.log('Sainsburys not found in database');
    return;
  }

  console.log(`Sainsburys ID: ${supermarket.id}`);

  // Count Sainsbury's products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('supermarket_id', supermarket.id);

  console.log(`Sainsburys products in database: ${count}`);

  // Get total products across all supermarkets
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`Total products in database: ${totalCount}`);

  // Get count by supermarket
  const { data: supermarkets } = await supabase
    .from('supermarkets')
    .select('id, name, slug');

  console.log('\nProducts by supermarket:');
  for (const sm of supermarkets) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supermarket_id', sm.id);
    console.log(`  ${sm.name} (${sm.slug}): ${count} products`);
  }
}

checkProducts().catch(console.error);
