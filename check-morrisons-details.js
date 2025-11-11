require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkMorrisonsDetails() {
  // Get Morrisons products with details
  const { data: supermarket } = await supabase
    .from('supermarkets')
    .select('id')
    .eq('slug', 'morrisons')
    .single();

  const { data: products, count } = await supabase
    .from('products')
    .select('name, product_code, last_scraped_at', { count: 'exact' })
    .eq('supermarket_id', supermarket.id)
    .order('last_scraped_at', { ascending: false })
    .limit(30);

  console.log(`Total Morrisons products: ${count}\n`);
  console.log('Recently scraped products:');
  products.forEach((p, i) => {
    const scrapedAt = new Date(p.last_scraped_at).toLocaleString();
    console.log(`${i + 1}. ${p.name} (${p.product_code}) - Last scraped: ${scrapedAt}`);
  });
}

checkMorrisonsDetails().catch(console.error);
