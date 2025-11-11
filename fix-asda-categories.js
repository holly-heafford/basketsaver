require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { mapToMainCategory } = require('./categoryMapping.js');
const XLSX = require('xlsx');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Load the Excel file and create a mapping from subcategory URL to main category
 */
function loadCategoryMapping() {
  const excelPath = path.join(__dirname, 'Supermarket Categories', 'ASDA_Complete_Categories.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Create a map from URL pattern to main category
  const urlToMainCategory = {};

  data.forEach(row => {
    const mainCategory = row['Main Category'];
    const url = row['URL'];

    // Extract the category slug from the URL
    // Example: https://www.asda.com/groceries/fruit-veg-flowers/fruit/view-all-fruit
    // We want to match products that contain "/fruit-veg-flowers/" in their URL
    const match = url.match(/groceries\/([^\/]+)\//);
    if (match) {
      const categorySlug = match[1];
      urlToMainCategory[categorySlug] = mainCategory;
    }
  });

  return urlToMainCategory;
}

/**
 * Get or create a category by name
 * Note: Categories are shared across all supermarkets
 */
async function getOrCreateCategory(categoryName) {
  try {
    // First, try to find existing category
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (existing) {
      return existing.id;
    }

    // Category doesn't exist, create it
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: categoryName
      })
      .select('id')
      .single();

    if (error) throw error;
    return newCategory.id;

  } catch (error) {
    console.error(`Error getting/creating category "${categoryName}":`, error.message);
    return null;
  }
}

/**
 * Fix all ASDA product categories
 */
async function fixAsdaCategories() {
  console.log('\n=== Fixing ASDA Product Categories ===\n');

  // Load the URL to main category mapping
  const urlToMainCategory = loadCategoryMapping();
  console.log(`Loaded ${Object.keys(urlToMainCategory).length} category URL patterns\n`);

  // Get ASDA supermarket ID
  const { data: asda } = await supabase
    .from('supermarkets')
    .select('id')
    .eq('slug', 'asda')
    .single();

  if (!asda) {
    console.error('ASDA not found in database');
    return;
  }

  const asdaId = asda.id;
  console.log(`ASDA supermarket_id: ${asdaId}\n`);

  // Get all ASDA products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, product_url, category_id')
    .eq('supermarket_id', asdaId);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} ASDA products to process\n`);

  const stats = {
    total: products.length,
    updated: 0,
    noMatch: 0,
    alreadyCorrect: 0,
    errors: 0
  };

  // Process each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${products.length} products processed...`);
    }

    try {
      // Extract category slug from product URL
      // Example: https://www.asda.com/groceries/product/bananas/asda-6-sweet-creamy-bananas/9084493
      const urlMatch = product.product_url.match(/groceries\/([^\/]+)\//);

      if (!urlMatch) {
        stats.noMatch++;
        continue;
      }

      const categorySlug = urlMatch[1];
      const mainCategoryName = urlToMainCategory[categorySlug];

      if (!mainCategoryName) {
        console.log(`  [${i + 1}] No main category found for slug: ${categorySlug} (${product.name})`);
        stats.noMatch++;
        continue;
      }

      // Map to our standard category
      const standardCategory = mapToMainCategory(mainCategoryName, 'asda');

      if (!standardCategory) {
        console.log(`  [${i + 1}] No mapping found for main category: ${mainCategoryName}`);
        stats.noMatch++;
        continue;
      }

      // Get the category ID
      const categoryId = await getOrCreateCategory(standardCategory);

      if (!categoryId) {
        stats.errors++;
        continue;
      }

      // Check if already correct
      if (product.category_id === categoryId) {
        stats.alreadyCorrect++;
        continue;
      }

      // Update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: categoryId })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  Error updating product ${product.id}:`, updateError.message);
        stats.errors++;
      } else {
        stats.updated++;
      }

    } catch (error) {
      console.error(`  Error processing product ${product.id}:`, error.message);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('CATEGORY FIX COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total products: ${stats.total}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Already correct: ${stats.alreadyCorrect}`);
  console.log(`No category match: ${stats.noMatch}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('='.repeat(60));

  // Show final category distribution
  console.log('\n=== Final Category Distribution ===\n');
  const { data: categoryStats } = await supabase
    .from('products')
    .select('category_id, categories!inner(name)')
    .eq('supermarket_id', asdaId);

  if (categoryStats) {
    const categoryCounts = {};
    categoryStats.forEach(p => {
      const catName = p.categories?.name || 'NULL';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        console.log(`  ${name}: ${count} products`);
      });
  }
}

// Run the fix
if (require.main === module) {
  fixAsdaCategories().catch(console.error);
}

module.exports = { fixAsdaCategories };
