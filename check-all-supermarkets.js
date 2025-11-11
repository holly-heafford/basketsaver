require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAllSupermarkets() {
  console.log('=== Checking all supermarkets in database ===\n');

  // Get all supermarkets
  const { data: supermarkets } = await supabase
    .from('supermarkets')
    .select('*')
    .order('name');

  console.log(`Total supermarkets: ${supermarkets.length}\n`);

  for (const sm of supermarkets) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supermarket_id', sm.id);

    console.log(`${sm.name} (${sm.slug}):`);
    console.log(`  ID: ${sm.id}`);
    console.log(`  Products: ${count}`);
    console.log('');
  }

  // Get sample products from each supermarket
  console.log('\n=== Sample Products by Supermarket ===\n');

  for (const sm of supermarkets) {
    const { data: products } = await supabase
      .from('products')
      .select('name, current_price')
      .eq('supermarket_id', sm.id)
      .limit(3);

    if (products && products.length > 0) {
      console.log(`${sm.name} samples:`);
      products.forEach(p => {
        console.log(`  - ${p.name} (£${p.current_price})`);
      });
      console.log('');
    }
  }
}

checkAllSupermarkets().catch(console.error);
