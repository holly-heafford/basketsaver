require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkProducts() {
  // Count total products
  const { count: totalCount, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting products:', countError.message);
    return;
  }

  console.log(`Total products: ${totalCount}`);

  // Sample a few products to see the data structure
  const { data: sampleProducts, error: sampleError } = await supabase
    .from('products')
    .select('id, name, normalized_name, current_price, image_url, is_available, supermarket_id')
    .limit(5);

  if (sampleError) {
    console.error('Error fetching sample:', sampleError.message);
    return;
  }

  console.log('\nSample products:');
  sampleProducts.forEach(p => {
    console.log(`- [${p.supermarket_id}] ${p.name}`);
    console.log(`  normalized_name: ${p.normalized_name}`);
    console.log(`  price: ${p.current_price}, available: ${p.is_available}, image: ${p.image_url ? 'yes' : 'no'}`);
  });

  // Check if products match "milk" broadly
  const { count: milkCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .ilike('name', '%milk%')
    .eq('is_available', true);

  console.log(`\nProducts with "milk" in name: ${milkCount}`);

  //Check if products match "milk" in normalized_name
  const { count: milkNormCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .ilike('normalized_name', '%milk%')
    .eq('is_available', true);

  console.log(`Products with "milk" in normalized_name: ${milkNormCount}`);
}

checkProducts().then(() => process.exit(0));
