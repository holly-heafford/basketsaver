require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSupermarketCategories() {
  console.log('\n=== Checking Supermarket-Specific Categories ===\n');

  // Get all categories with their supermarket
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      supermarket_id,
      supermarkets (
        id,
        name,
        slug
      )
    `)
    .order('supermarkets(name), name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Group by supermarket
  const bySupermarket = {};
  categories.forEach(cat => {
    const smName = cat.supermarkets?.name || 'Unknown';
    if (!bySupermarket[smName]) bySupermarket[smName] = [];
    bySupermarket[smName].push(cat.name);
  });

  console.log('Categories by Supermarket:\n');
  Object.entries(bySupermarket).forEach(([supermarket, cats]) => {
    console.log(`\n${supermarket} (${cats.length} categories):`);
    const uniqueCats = [...new Set(cats)].sort();
    uniqueCats.forEach(cat => console.log(`  - ${cat}`));
  });

  // Show which categories appear across multiple supermarkets
  console.log('\n\n=== Category Name Analysis ===\n');
  const allCategoryNames = categories.map(c => c.name);
  const uniqueNames = [...new Set(allCategoryNames)].sort();

  console.log(`Total unique category names: ${uniqueNames.length}\n`);

  // Count occurrences
  const nameCounts = {};
  allCategoryNames.forEach(name => {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  });

  console.log('Categories used by multiple supermarkets:');
  Object.entries(nameCounts)
    .filter(([name, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const supermarkets = categories
        .filter(c => c.name === name)
        .map(c => c.supermarkets?.name)
        .filter((v, i, a) => a.indexOf(v) === i);
      console.log(`  - "${name}" (${count} times): ${supermarkets.join(', ')}`);
    });

  console.log('\n\nSupermarket-specific categories (only appear once):');
  Object.entries(nameCounts)
    .filter(([name, count]) => count === 1)
    .forEach(([name]) => {
      const cat = categories.find(c => c.name === name);
      console.log(`  - "${name}" (${cat.supermarkets?.name})`);
    });
}

checkSupermarketCategories().catch(console.error);
