require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkNormalizedNames() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, normalized_name, supermarkets(name)')
    .ilike('name', '%coca%cola%24%330%');

  console.log('Coca Cola 24x330ml products:\n');
  products.forEach(p => {
    console.log(`${p.supermarkets.name}:`);
    console.log(`  name: "${p.name}"`);
    console.log(`  normalized_name: "${p.normalized_name}"`);
    console.log('');
  });
}

checkNormalizedNames();
