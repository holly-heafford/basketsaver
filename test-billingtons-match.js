require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testBillingtonsMatch() {
  console.log('=== Testing Billington\'s Demerara Sugar Matching ===\n');

  // Get all products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*, supermarkets(name)');

  console.log(`Total products loaded: ${allProducts.length}\n`);

  // Test various search terms
  const searchTerms = [
    'billingtons demerara sugar 1kg',
    'billingtons demerara',
    'billington demerara',
    'demerara sugar',
    "billington's demerara natural unrefined cane sugar"
  ];

  searchTerms.forEach(searchTerm => {
    console.log(`\n--- Testing search: "${searchTerm}" ---`);
    const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    console.log(`Tokens: [${searchTokens.join(', ')}]`);

    const matchingProducts = allProducts.filter(p => {
      if (!p.normalized_name) return false;

      const normalizedLower = p.normalized_name.toLowerCase();

      // Method 1: Exact substring match
      if (normalizedLower.includes(searchTerm.toLowerCase()) || searchTerm.toLowerCase().includes(normalizedLower)) {
        return true;
      }

      // Method 2: Token-based matching
      const allTokensPresent = searchTokens.every(token =>
        normalizedLower.includes(token)
      );

      return allTokensPresent;
    });

    console.log(`Matches found: ${matchingProducts.length}`);

    // Show matches
    matchingProducts.forEach(p => {
      console.log(`  ✅ ${p.supermarkets.name}: ${p.name} (£${p.current_price})`);
      console.log(`     Normalized: ${p.normalized_name}`);
    });

    if (matchingProducts.length === 0) {
      console.log('  ❌ No matches found');
    }
  });

  // Check specifically for the Asda product
  console.log('\n\n=== Checking Asda Product Specifically ===');
  const asdaProduct = allProducts.find(p =>
    p.product_code === '11529' && p.supermarkets.name === 'Asda'
  );

  if (asdaProduct) {
    console.log('✅ Product EXISTS in database:');
    console.log(`   Name: ${asdaProduct.name}`);
    console.log(`   Normalized: ${asdaProduct.normalized_name}`);
    console.log(`   Price: £${asdaProduct.current_price}`);
  } else {
    console.log('❌ Product NOT FOUND in database');
  }
}

testBillingtonsMatch().catch(console.error);
