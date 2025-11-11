require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function listRawCategories() {
  console.log('\n=== All Raw Category Names in Database ===\n');

  // Get all unique category names
  const { data: categories, error } = await supabase
    .from('categories')
    .select('name')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueNames = [...new Set(categories.map(c => c.name))].sort();

  console.log(`Total unique category names: ${uniqueNames.length}\n`);
  uniqueNames.forEach((name, index) => {
    console.log(`${index + 1}. "${name}"`);
  });

  // Also check some sample products to see what subcategory names they have
  console.log('\n\n=== Sample Products with Their Categories ===\n');

  const { data: products } = await supabase
    .from('products')
    .select(`
      name,
      categories (
        name
      )
    `)
    .not('category_id', 'is', null)
    .limit(20);

  products.forEach(p => {
    console.log(`Product: ${p.name}`);
    console.log(`  Category: ${p.categories?.name || 'NULL'}\n`);
  });
}

listRawCategories().catch(console.error);
