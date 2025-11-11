require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function categorizeItem(itemName) {
    const nameLower = itemName.toLowerCase();

    // Priority 1: Check for explicit snack/treat indicators first
    const snackIndicators = ['chocolate', 'candy', 'sweet', 'biscuit', 'cookie', 'crisp', 'chip', 'dessert', 'snack', 'treat', 'chew'];
    if (snackIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Snacks & Treats';
    }

    // Priority 2: Check for bakery items
    const bakeryIndicators = ['bread', 'roll', 'bagel', 'croissant', 'cake', 'muffin', 'bun'];
    if (bakeryIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Bakery';
    }

    // Priority 3: Check for dairy (but not if it's part of a brand name like "Dairy Milk")
    if (nameLower.includes('cheese') && !nameLower.includes('chocolate')) {
        return 'Dairy & Eggs';
    }
    if (nameLower.includes('butter') && !nameLower.includes('peanut')) {
        return 'Dairy & Eggs';
    }
    if (nameLower.includes('yogurt') || nameLower.includes('yoghurt')) {
        return 'Dairy & Eggs';
    }
    if (nameLower.includes('cream') && !nameLower.includes('ice cream')) {
        return 'Dairy & Eggs';
    }
    if (nameLower.includes('eggs')) {
        return 'Dairy & Eggs';
    }
    // Only categorize as dairy if "milk" appears but NOT with chocolate/cadbury
    if (nameLower.includes('milk') && !nameLower.includes('chocolate') && !nameLower.includes('cadbury')) {
        return 'Dairy & Eggs';
    }

    // Priority 4: Check for drinks
    const drinkIndicators = ['juice', 'coffee', 'tea', 'water', 'cola', 'coke', 'drink', 'squash', 'lemonade', 'beer', 'wine'];
    if (drinkIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Drinks';
    }

    // Priority 5: Check for meat & fish
    const meatIndicators = ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'fish', 'salmon', 'lamb', 'turkey', 'ham', 'meat'];
    if (meatIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Meat & Fish';
    }

    // Priority 6: Check for frozen
    if (nameLower.includes('frozen') || nameLower.includes('ice cream') || nameLower.includes('pizza')) {
        return 'Frozen';
    }

    // Priority 7: Check for cupboard items
    const cupboardIndicators = ['pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'sauce', 'beans', 'tin', 'jar', 'cereal', 'oats', 'porridge'];
    if (cupboardIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Cupboard';
    }

    // Priority 8: Check for fresh produce (only if not already categorized as snacks)
    const produceIndicators = ['apple', 'banana', 'tomato', 'potato', 'onion', 'carrot', 'lettuce', 'broccoli', 'orange', 'pepper', 'cucumber', 'mushroom', 'salad'];
    if (produceIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Fruit & Vegetables';
    }

    // Priority 9: Check for health & beauty
    const healthBeautyIndicators = ['shampoo', 'soap', 'toothpaste', 'deodorant'];
    if (healthBeautyIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Health & Beauty';
    }

    // Priority 10: Check for household
    const householdIndicators = ['detergent', 'cleaner', 'toilet', 'paper', 'bag'];
    if (householdIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Household';
    }

    // Priority 11: Check for baby & toddler
    const babyIndicators = ['baby', 'nappy', 'diaper', 'wipes'];
    if (babyIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Baby & Toddler';
    }

    // Priority 12: Check for pet food
    const petIndicators = ['dog', 'cat', 'pet'];
    if (petIndicators.some(indicator => nameLower.includes(indicator))) {
        return 'Pet Food';
    }

    return 'Other';
}

async function populateCategories() {
  console.log('\n=== Populating Category IDs for Products ===\n');

  // First, get all categories from the database
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  console.log(`Found ${categories.length} categories:`);
  categories.forEach(cat => {
    console.log(`  - ${cat.name} (ID: ${cat.id})`);
  });

  // Create a map of category name to ID
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Get count of products without category_id
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('category_id', null);

  console.log(`\nTotal products without category_id: ${totalCount}\n`);

  // Get all products without a category_id (fetch all, no limit)
  let allProducts = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id')
      .is('category_id', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (prodError) {
      console.error('Error fetching products:', prodError);
      return;
    }

    if (products.length === 0) break;

    allProducts = allProducts.concat(products);
    console.log(`Fetched ${allProducts.length}/${totalCount} products...`);
    page++;
  }

  const products = allProducts;

  console.log(`\nProcessing ${products.length} products...\n`);

  let updated = 0;
  let failed = 0;
  let notFound = 0;

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);

    for (const product of batch) {
      // Categorize the product
      const categoryName = categorizeItem(product.name);
      const categoryId = categoryMap[categoryName];

      if (!categoryId) {
        console.log(`  ⚠️  Category "${categoryName}" not found for: ${product.name}`);
        notFound++;
        continue;
      }

      // Update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: categoryId })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ✗ Error updating ${product.name}:`, updateError.message);
        failed++;
      } else {
        updated++;
        if (updated % 100 === 0) {
          console.log(`  Progress: ${updated} products updated...`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('CATEGORY POPULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total products processed: ${products.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Categories not found: ${notFound}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));
}

populateCategories().catch(console.error);
