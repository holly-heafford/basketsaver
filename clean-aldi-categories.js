require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanAldiCategories() {
  console.log('=== Cleaning up Aldi category pages from database ===\n');

  // Get Aldi supermarket ID
  const { data: supermarket } = await supabase
    .from('supermarkets')
    .select('id')
    .eq('slug', 'aldi')
    .single();

  if (!supermarket) {
    console.error('Aldi supermarket not found in database');
    return;
  }

  // Get all Aldi products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, product_code, product_url')
    .eq('supermarket_id', supermarket.id);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Total Aldi products in database: ${products.length}\n`);

  // Identify category pages (they have /k/ in the product_code and URL)
  const categoryPages = products.filter(p =>
    p.product_code.includes('/k/') ||
    p.product_url.includes('/products/') && p.product_url.includes('/k/')
  );

  console.log(`Found ${categoryPages.length} category pages to remove:\n`);

  categoryPages.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.product_code})`);
  });

  if (categoryPages.length === 0) {
    console.log('\nNo category pages found! Database is clean.');
    return;
  }

  console.log('\n\nDeleting category pages...');

  // Delete category pages
  const categoryIds = categoryPages.map(p => p.id);

  // First delete price history for these products
  const { error: priceError } = await supabase
    .from('price_history')
    .delete()
    .in('product_id', categoryIds);

  if (priceError) {
    console.error('Error deleting price history:', priceError);
    return;
  }

  // Then delete the products
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .in('id', categoryIds);

  if (deleteError) {
    console.error('Error deleting products:', deleteError);
    return;
  }

  console.log(`\n✓ Successfully deleted ${categoryPages.length} category pages`);

  // Show remaining count
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('supermarket_id', supermarket.id);

  console.log(`\nRemaining Aldi products: ${count}`);
}

cleanAldiCategories().catch(console.error);
