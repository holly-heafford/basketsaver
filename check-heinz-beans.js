require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkHeinzBeans() {
  console.log('=== Checking Heinz Baked Beans ===\n');

  // Check by product code
  const { data: byCode } = await supabase
    .from('products')
    .select('*, supermarkets(name)')
    .eq('product_code', '252261477');

  console.log(`Products found by product code "252261477": ${byCode ? byCode.length : 0}`);
  if (byCode && byCode.length > 0) {
    byCode.forEach(p => {
      console.log(`\nSupermarket: ${p.supermarkets.name}`);
      console.log(`Name: ${p.name}`);
      console.log(`Normalized: ${p.normalized_name}`);
      console.log(`Price: £${p.current_price}`);
    });
  }

  // Search for all Heinz beans products
  console.log('\n\n=== All Heinz Baked Beans Products ===\n');

  const { data: allHeinz } = await supabase
    .from('products')
    .select('*, supermarkets(name)')
    .ilike('normalized_name', '%heinz%beans%');

  console.log(`Total Heinz beans products: ${allHeinz ? allHeinz.length : 0}\n`);

  // Group by supermarket
  const bySupermarket = {};
  if (allHeinz) {
    allHeinz.forEach(p => {
      const sm = p.supermarkets.name;
      if (!bySupermarket[sm]) bySupermarket[sm] = [];
      bySupermarket[sm].push(p);
    });

    Object.keys(bySupermarket).sort().forEach(sm => {
      console.log(`${sm}:`);
      bySupermarket[sm].forEach(p => {
        console.log(`  - ${p.name} (£${p.current_price})`);
        console.log(`    Normalized: ${p.normalized_name}`);
      });
      console.log('');
    });
  }

  // Test matching logic
  console.log('\n=== Testing Match Logic for "heinz baked beans 415g" ===\n');

  function extractPackSize(productName) {
    const name = productName.toLowerCase();
    const multipackPattern = /(\d+)x(\d+)(ml|g|l|kg)/;
    const multipackMatch = name.match(multipackPattern);
    if (multipackMatch) {
      return {
        quantity: parseInt(multipackMatch[1]),
        unit: multipackMatch[2] + multipackMatch[3]
      };
    }
    const packPattern = /(\d+)\s*pack/;
    const packMatch = name.match(packPattern);
    if (packMatch) {
      return {
        quantity: parseInt(packMatch[1]),
        unit: 'pack'
      };
    }
    return null;
  }

  const searchTerm = 'heinz baked beans 415g';
  const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 0);
  const searchPackSize = extractPackSize(searchTerm);

  console.log(`Search: "${searchTerm}"`);
  console.log(`Tokens: [${searchTokens.join(', ')}]`);
  console.log(`Pack size: ${searchPackSize ? searchPackSize.quantity + 'x' + searchPackSize.unit : 'single'}\n`);

  if (allHeinz) {
    allHeinz.forEach(p => {
      const normalizedLower = p.normalized_name.toLowerCase();

      // Check tokens
      const allTokensPresent = searchTokens.every(token =>
        normalizedLower.includes(token)
      );

      if (!allTokensPresent) {
        console.log(`❌ ${p.name} (${p.supermarkets.name}): Not all tokens present`);
        return;
      }

      // Check pack size
      const productPackSize = extractPackSize(normalizedLower);

      let shouldMatch = false;
      if (searchPackSize && productPackSize) {
        shouldMatch = searchPackSize.quantity === productPackSize.quantity &&
                     searchPackSize.unit === productPackSize.unit;
      } else if (!searchPackSize && productPackSize) {
        shouldMatch = false;
      } else {
        shouldMatch = true;
      }

      if (shouldMatch) {
        console.log(`✅ ${p.name} (${p.supermarkets.name}): MATCHED`);
        console.log(`   Product pack size: ${productPackSize ? productPackSize.quantity + 'x' + productPackSize.unit : 'single'}`);
      } else {
        console.log(`❌ ${p.name} (${p.supermarkets.name}): Pack size mismatch`);
        console.log(`   Product pack size: ${productPackSize ? productPackSize.quantity + 'x' + productPackSize.unit : 'single'}`);
      }
    });
  }
}

checkHeinzBeans().catch(console.error);
