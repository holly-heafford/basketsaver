require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAsdaProduct() {
  console.log('=== Checking Asda Product 11529 ===\n');

  // Check if product exists in database by product_code
  const { data: byCode, error: codeError } = await supabase
    .from('products')
    .select('*, supermarkets(name, slug)')
    .eq('product_code', '11529');

  if (codeError) {
    console.error('Error searching by product_code:', codeError);
  }

  console.log(`Products found by product_code "11529": ${byCode ? byCode.length : 0}`);
  if (byCode && byCode.length > 0) {
    byCode.forEach(p => {
      console.log(`\nSupermarket: ${p.supermarkets.name}`);
      console.log(`Name: ${p.name}`);
      console.log(`Normalized: ${p.normalized_name}`);
      console.log(`Price: £${p.current_price}`);
      console.log(`Product Code: ${p.product_code}`);
      console.log(`URL: ${p.url}`);
    });
  }

  // Check if product exists in database by URL
  const { data: byUrl, error: urlError } = await supabase
    .from('products')
    .select('*, supermarkets(name, slug)')
    .ilike('url', '%11529%');

  if (urlError) {
    console.error('Error searching by URL:', urlError);
  }

  console.log(`\n\nProducts found by URL containing "11529": ${byUrl ? byUrl.length : 0}`);
  if (byUrl && byUrl.length > 0) {
    byUrl.forEach(p => {
      console.log(`\nSupermarket: ${p.supermarkets.name}`);
      console.log(`Name: ${p.name}`);
      console.log(`Normalized: ${p.normalized_name}`);
      console.log(`Price: £${p.current_price}`);
      console.log(`Product Code: ${p.product_code}`);
      console.log(`URL: ${p.url}`);
    });
  }

  // Check all Asda products to see if this might be there under different identifier
  const { data: allAsda, error: asdaError } = await supabase
    .from('products')
    .select('product_code, name, url')
    .eq('supermarket_id', (await supabase.from('supermarkets').select('id').eq('slug', 'asda').single()).data.id)
    .order('name');

  console.log(`\n\nTotal Asda products in database: ${allAsda ? allAsda.length : 0}`);

  if (!byCode || byCode.length === 0) {
    console.log('\n❌ CONCLUSION: Product 11529 is NOT in the database');
    console.log('This product needs to be scraped from Asda.');
  }
}

checkAsdaProduct().catch(console.error);
