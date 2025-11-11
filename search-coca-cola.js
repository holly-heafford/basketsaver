require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function searchCocaCola() {
  console.log('Searching for Coca Cola 24x330ml products...\n');

  // Search for products with these keywords
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      normalized_name,
      product_url,
      current_price,
      is_available,
      supermarkets (name, slug)
    `)
    .ilike('name', '%coca%cola%')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${products.length} Coca Cola products:\n`);

  // Filter for 24x330ml
  const multiPacks = products.filter(p =>
    p.name.match(/24\s*x\s*330/i) ||
    p.name.match(/24\s*pack/i) ||
    p.name.match(/330ml.*24/i)
  );

  console.log(`Products matching 24x330ml pattern: ${multiPacks.length}\n`);

  multiPacks.forEach(p => {
    console.log(`${p.supermarkets.name}: ${p.name}`);
    console.log(`  Price: £${p.current_price}`);
    console.log(`  Available: ${p.is_available}`);
    console.log(`  URL: ${p.product_url}`);
    console.log('');
  });

  // Also show all Coca Cola products to see what we have
  console.log('\n=== All Coca Cola products ===\n');
  const bySupermarket = {};
  products.forEach(p => {
    const sm = p.supermarkets.name;
    if (!bySupermarket[sm]) bySupermarket[sm] = [];
    bySupermarket[sm].push(p);
  });

  Object.keys(bySupermarket).sort().forEach(sm => {
    console.log(`\n${sm} (${bySupermarket[sm].length} products):`);
    bySupermarket[sm].forEach(p => {
      console.log(`  - ${p.name} (£${p.current_price})`);
    });
  });
}

searchCocaCola().catch(console.error);
