require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabaseStructure() {
  console.log('\n=== Checking Database Category Structure ===\n');

  // Check products with their categories
  const { data: sampleProducts, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      normalized_name,
      category_id,
      categories (
        id,
        name
      )
    `)
    .not('category_id', 'is', null)
    .limit(10);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log('Sample products with categories:');
  sampleProducts.forEach(p => {
    console.log(`\nProduct: ${p.name}`);
    console.log(`  Category: ${p.categories?.name || 'NO CATEGORY'}`);
  });

  // Get list of unique category names
  const { data: allCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('name')
    .order('name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return;
  }

  console.log(`\n\n=== All Categories in Database (${allCategories.length} total) ===\n`);

  const uniqueCategories = [...new Set(allCategories.map(c => c.name))].sort();
  uniqueCategories.forEach(cat => console.log(`  - ${cat}`));
}

checkDatabaseStructure().catch(console.error);
