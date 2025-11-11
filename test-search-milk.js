require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testSearchMilk() {
  console.log('=== Testing search for "milk" ===\n');

  // Get all products
  const { data: products } = await supabase
    .from('products')
    .select('*, supermarkets(name, slug)');

  // Search for milk
  const searchTerm = 'milk';
  const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 0);

  const matchingProducts = products.filter(p => {
    if (!p.normalized_name) return false;
    const normalizedLower = p.normalized_name.toLowerCase();

    // Method 1: Exact substring match
    if (normalizedLower.includes(searchTerm) || searchTerm.includes(normalizedLower)) {
      return true;
    }

    // Method 2: Token-based matching
    const allTokensPresent = searchTokens.every(token =>
      normalizedLower.includes(token)
    );

    return allTokensPresent;
  });

  console.log(`Total products in database: ${products.length}`);
  console.log(`Products matching "milk": ${matchingProducts.length}\n`);

  // Group by supermarket
  const bySupermarket = {};
  matchingProducts.forEach(p => {
    const sm = p.supermarkets.name;
    if (!bySupermarket[sm]) bySupermarket[sm] = [];
    bySupermarket[sm].push(p);
  });

  Object.keys(bySupermarket).sort().forEach(sm => {
    console.log(`${sm}: ${bySupermarket[sm].length} milk products`);
    bySupermarket[sm].slice(0, 3).forEach(p => {
      console.log(`  - ${p.name} (£${p.current_price})`);
    });
  });
}

testSearchMilk().catch(console.error);
