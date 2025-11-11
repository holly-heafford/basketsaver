require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testBillingtonsPagination() {
  console.log('=== Testing Pagination and Billington\'s Product ===\n');

  // Replicate the exact pagination logic from app-supabase.js
  let allProducts = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;
  let batchNumber = 1;

  while (hasMore) {
    console.log(`Fetching batch ${batchNumber} (rows ${from} to ${from + batchSize - 1})...`);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('name')
      .range(from, from + batchSize - 1);

    if (productsError) {
      console.error('Error:', productsError);
      break;
    }

    if (products && products.length > 0) {
      console.log(`  Loaded ${products.length} products`);
      allProducts = allProducts.concat(products);
      from += batchSize;
      hasMore = products.length === batchSize;
      batchNumber++;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nTotal products loaded: ${allProducts.length}\n`);

  // Now search for Billington's
  console.log('=== Searching for Billington\'s product ===');

  const billingtonsProducts = allProducts.filter(p =>
    p.name && p.name.toLowerCase().includes('billington')
  );

  console.log(`Found ${billingtonsProducts.length} Billington's products:\n`);

  billingtonsProducts.forEach(p => {
    console.log(`  - ${p.name} (£${p.current_price})`);
    console.log(`    Normalized: ${p.normalized_name}`);
    console.log(`    Product Code: ${p.product_code}`);
    console.log(`    Supermarket ID: ${p.supermarket_id}`);
    console.log('');
  });

  // Test the matching logic with various search terms
  const searchTerms = [
    'billingtons demerara',
    'billington demerara',
    'demerara sugar'
  ];

  console.log('\n=== Testing Matching Logic ===\n');

  searchTerms.forEach(searchTerm => {
    console.log(`Search term: "${searchTerm}"`);
    const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    const matches = allProducts.filter(p => {
      if (!p.normalized_name) return false;
      const normalizedLower = p.normalized_name.toLowerCase();

      // Method 1: Exact substring match
      if (normalizedLower.includes(searchTerm.toLowerCase()) || searchTerm.toLowerCase().includes(normalizedLower)) {
        return true;
      }

      // Method 2: Token-based matching
      return searchTokens.every(token => normalizedLower.includes(token));
    });

    console.log(`  Matches: ${matches.length}`);
    matches.slice(0, 3).forEach(m => {
      console.log(`    - ${m.name}`);
    });
    console.log('');
  });
}

testBillingtonsPagination().catch(console.error);
