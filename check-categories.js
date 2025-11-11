require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkCategories() {
  console.log('\n=== Checking Category Assignment ===\n');

  // Check recently scraped ASDA products
  const { data: recentProducts, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      current_price,
      last_scraped_at,
      category_id,
      categories (
        id,
        name
      ),
      supermarkets (
        name
      )
    `)
    .eq('supermarkets.slug', 'asda')
    .order('last_scraped_at', { ascending: false })
    .limit(20);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log(`Found ${recentProducts.length} recent ASDA products:\n`);

  let withCategory = 0;
  let withoutCategory = 0;

  recentProducts.forEach((product, index) => {
    const categoryName = product.categories?.name || 'NO CATEGORY';
    const hasCategory = product.category_id !== null;

    if (hasCategory) withCategory++;
    else withoutCategory++;

    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Price: £${product.current_price}`);
    console.log(`   Category: ${categoryName}`);
    console.log(`   Last Scraped: ${new Date(product.last_scraped_at).toLocaleString()}`);
    console.log();
  });

  console.log('='.repeat(60));
  console.log(`Products with category: ${withCategory}`);
  console.log(`Products without category: ${withoutCategory}`);
  console.log('='.repeat(60));

  // Check all ASDA categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      supermarkets (
        name,
        slug
      )
    `)
    .eq('supermarkets.slug', 'asda');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return;
  }

  console.log(`\n=== ASDA Categories (${categories.length} total) ===\n`);
  categories.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name}`);
  });
}

checkCategories().catch(console.error);
