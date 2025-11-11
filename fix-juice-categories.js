/**
 * Fix juice products that were incorrectly categorized as Fruit & Vegetables
 * Move them to the Drinks category
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixJuiceCategories() {
  console.log('\n' + '='.repeat(60));
  console.log('FIXING JUICE PRODUCT CATEGORIES');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) throw catError;

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    const fruitVegCategoryId = categoryMap['Fruit & Vegetables'];
    const drinksCategoryId = categoryMap['Drinks'];

    console.log(`Fruit & Vegetables category ID: ${fruitVegCategoryId}`);
    console.log(`Drinks category ID: ${drinksCategoryId}\n`);

    // Get all products in Fruit & Vegetables category that contain "juice" or "drink"
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, normalized_name, category_id')
      .eq('category_id', fruitVegCategoryId);

    if (prodError) throw prodError;

    console.log(`Found ${products.length} products in Fruit & Vegetables category\n`);

    // Filter for products that contain "juice" or "drink"
    const juiceProducts = products.filter(p => {
      const nameToCheck = (p.normalized_name || p.name).toLowerCase();
      return nameToCheck.includes('juice') || nameToCheck.includes('drink');
    });

    console.log(`Found ${juiceProducts.length} juice/drink products to recategorize:\n`);

    let updated = 0;

    // Update each juice product to Drinks category
    for (const product of juiceProducts) {
      console.log(`  ${product.name}`);

      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: drinksCategoryId })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ✗ Error updating product ${product.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('COMPLETE');
    console.log('='.repeat(60));
    console.log(`Updated: ${updated} products moved to Drinks category`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixJuiceCategories();
