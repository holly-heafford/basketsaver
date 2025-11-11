require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testSpecificProduct() {
  console.log('=== Testing Specific Product Matching ===\n');

  // Get all products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*, supermarkets(name)');

  // Test search for "coca cola 24x330ml" (a specific product)
  const searchTerm = 'coca cola 24x330ml';
  const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 0);

  console.log(`Search term: "${searchTerm}"`);
  console.log(`Tokens: [${searchTokens.join(', ')}]\n`);

  // Apply the same matching logic as the app
  const matchingProducts = allProducts.filter(p => {
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

  console.log(`Total matches found: ${matchingProducts.length}\n`);

  // Group by supermarket
  const bySupermarket = {};
  matchingProducts.forEach(p => {
    const sm = p.supermarkets.name;
    if (!bySupermarket[sm]) bySupermarket[sm] = [];
    bySupermarket[sm].push(p);
  });

  // Show results
  console.log('Products found across supermarkets:\n');
  Object.keys(bySupermarket).sort().forEach(sm => {
    console.log(`${sm} (${bySupermarket[sm].length} products):`);
    bySupermarket[sm].forEach(p => {
      console.log(`  - ${p.name} (£${p.current_price})`);
    });
    console.log('');
  });

  // Show cheapest at each supermarket
  console.log('\n=== Cheapest at each supermarket ===\n');
  Object.keys(bySupermarket).sort().forEach(sm => {
    const cheapest = bySupermarket[sm].reduce((min, p) =>
      (p.current_price < min.current_price) ? p : min
    );
    console.log(`${sm}: ${cheapest.name} - £${cheapest.current_price}`);
  });
}

testSpecificProduct().catch(console.error);
