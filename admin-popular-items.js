require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Main menu
 */
async function mainMenu() {
  console.clear();
  console.log('\n=== 🛒 BasketSaver - Popular Items Admin ===\n');
  console.log('1. List all popular items');
  console.log('2. Add product to popular item');
  console.log('3. View popular item products');
  console.log('4. Remove product from popular item');
  console.log('5. Search products by name');
  console.log('6. Auto-populate products for popular item');
  console.log('7. Create new popular item');
  console.log('8. Exit');
  console.log();

  const choice = await question('Select option: ');

  switch (choice.trim()) {
    case '1':
      await listPopularItems();
      break;
    case '2':
      await addProductToPopularItem();
      break;
    case '3':
      await viewPopularItemProducts();
      break;
    case '4':
      await removeProductFromPopularItem();
      break;
    case '5':
      await searchProducts();
      break;
    case '6':
      await autoPopulateProducts();
      break;
    case '7':
      await createNewPopularItem();
      break;
    case '8':
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
      return;
    default:
      console.log('Invalid option');
      await question('\nPress Enter to continue...');
      await mainMenu();
  }
}

/**
 * List all popular items
 */
async function listPopularItems() {
  console.clear();
  console.log('\n=== Popular Items ===\n');

  const { data: items, error } = await supabase
    .from('popular_items')
    .select('id, name, display_name, display_order, is_active')
    .order('display_order');

  if (error) {
    console.error('Error:', error.message);
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  if (items.length === 0) {
    console.log('No popular items found.');
  } else {
    items.forEach((item, index) => {
      const status = item.is_active ? '✓' : '✗';
      console.log(`${index + 1}. [${status}] ${item.display_name} (${item.name})`);
    });
  }

  await question('\nPress Enter to continue...');
  await mainMenu();
}

/**
 * Search for products
 */
async function searchProducts() {
  console.clear();
  console.log('\n=== Search Products ===\n');

  const searchTerm = await question('Enter search term: ');

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      current_price,
      product_url,
      image_url,
      supermarkets!inner(id, name)
    `)
    .ilike('normalized_name', `%${searchTerm}%`)
    .eq('is_available', true)
    .not('current_price', 'is', null)
    .order('name')
    .limit(20);

  if (error) {
    console.error('Error:', error.message);
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  if (products.length === 0) {
    console.log('No products found.');
  } else {
    console.log(`\nFound ${products.length} products:\n`);
    products.forEach((product, index) => {
      const hasImage = product.image_url ? '🖼️ ' : '';
      console.log(`${index + 1}. ${hasImage}[${product.supermarkets.name}] ${product.name}`);
      console.log(`   Price: £${parseFloat(product.current_price).toFixed(2)}`);
      console.log(`   ID: ${product.id}`);
      console.log();
    });
  }

  await question('Press Enter to continue...');
  await mainMenu();
}

/**
 * Add product to popular item
 */
async function addProductToPopularItem() {
  console.clear();
  console.log('\n=== Add Product to Popular Item ===\n');

  // Show popular items
  const { data: items } = await supabase
    .from('popular_items')
    .select('id, name, display_name')
    .order('display_order');

  if (!items || items.length === 0) {
    console.log('No popular items found. Create one first.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  console.log('Popular Items:');
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.display_name} (${item.name})`);
  });

  const itemChoice = await question('\nSelect popular item (number): ');
  const selectedItem = items[parseInt(itemChoice) - 1];

  if (!selectedItem) {
    console.log('Invalid selection.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  // Search for product
  const searchTerm = await question('\nEnter product search term: ');

  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      current_price,
      image_url,
      supermarkets!inner(id, name)
    `)
    .ilike('normalized_name', `%${searchTerm}%`)
    .eq('is_available', true)
    .not('current_price', 'is', null)
    .order('current_price')
    .limit(20);

  if (!products || products.length === 0) {
    console.log('No products found.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  console.log(`\nFound ${products.length} products:\n`);
  products.forEach((product, index) => {
    const hasImage = product.image_url ? '🖼️ ' : '';
    console.log(`${index + 1}. ${hasImage}[${product.supermarkets.name}] ${product.name} - £${parseFloat(product.current_price).toFixed(2)}`);
  });

  const productChoice = await question('\nSelect product (number): ');
  const selectedProduct = products[parseInt(productChoice) - 1];

  if (!selectedProduct) {
    console.log('Invalid selection.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  const isFeatured = await question('\nIs this the featured product for this supermarket? (y/n): ');

  // Insert the mapping
  const { error } = await supabase
    .from('popular_item_products')
    .insert({
      popular_item_id: selectedItem.id,
      product_id: selectedProduct.id,
      supermarket_id: selectedProduct.supermarkets.id,
      is_featured: isFeatured.toLowerCase() === 'y'
    });

  if (error) {
    console.error('\n❌ Error:', error.message);
  } else {
    console.log(`\n✅ Successfully added ${selectedProduct.name} to ${selectedItem.display_name}`);
  }

  await question('\nPress Enter to continue...');
  await mainMenu();
}

/**
 * View products for a popular item
 */
async function viewPopularItemProducts() {
  console.clear();
  console.log('\n=== View Popular Item Products ===\n');

  // Show popular items
  const { data: items } = await supabase
    .from('popular_items')
    .select('id, name, display_name')
    .order('display_order');

  if (!items || items.length === 0) {
    console.log('No popular items found.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  console.log('Popular Items:');
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.display_name}`);
  });

  const itemChoice = await question('\nSelect popular item (number): ');
  const selectedItem = items[parseInt(itemChoice) - 1];

  if (!selectedItem) {
    console.log('Invalid selection.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  // Get products for this popular item
  const { data: mappings, error } = await supabase
    .from('popular_item_products')
    .select(`
      id,
      is_featured,
      products!inner(
        id,
        name,
        current_price,
        image_url,
        product_url
      ),
      supermarkets!inner(
        name
      )
    `)
    .eq('popular_item_id', selectedItem.id)
    .order('is_featured', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  console.log(`\n=== Products for "${selectedItem.display_name}" ===\n`);

  if (!mappings || mappings.length === 0) {
    console.log('No products linked yet.');
  } else {
    mappings.forEach((mapping, index) => {
      const featured = mapping.is_featured ? '⭐ FEATURED' : '';
      const hasImage = mapping.products.image_url ? '🖼️ ' : '';
      console.log(`${index + 1}. ${hasImage}[${mapping.supermarkets.name}] ${featured}`);
      console.log(`   ${mapping.products.name}`);
      console.log(`   Price: £${parseFloat(mapping.products.current_price).toFixed(2)}`);
      console.log(`   Mapping ID: ${mapping.id}`);
      console.log();
    });
  }

  await question('Press Enter to continue...');
  await mainMenu();
}

/**
 * Remove product from popular item
 */
async function removeProductFromPopularItem() {
  console.clear();
  console.log('\n=== Remove Product from Popular Item ===\n');

  const mappingId = await question('Enter mapping ID to remove: ');

  const { error } = await supabase
    .from('popular_item_products')
    .delete()
    .eq('id', mappingId);

  if (error) {
    console.error('\n❌ Error:', error.message);
  } else {
    console.log('\n✅ Successfully removed product mapping');
  }

  await question('\nPress Enter to continue...');
  await mainMenu();
}

/**
 * Auto-populate products for popular item using search terms
 */
async function autoPopulateProducts() {
  console.clear();
  console.log('\n=== Auto-Populate Products ===\n');

  // Show popular items
  const { data: items } = await supabase
    .from('popular_items')
    .select('id, name, display_name')
    .order('display_order');

  if (!items || items.length === 0) {
    console.log('No popular items found.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  console.log('Popular Items:');
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.display_name}`);
  });

  const itemChoice = await question('\nSelect popular item (number): ');
  const selectedItem = items[parseInt(itemChoice) - 1];

  if (!selectedItem) {
    console.log('Invalid selection.');
    await question('\nPress Enter to continue...');
    await mainMenu();
    return;
  }

  const searchTerm = await question('\nEnter search term for this item: ');

  // Get all supermarkets
  const { data: supermarkets } = await supabase
    .from('supermarkets')
    .select('id, name');

  console.log('\n🔍 Searching for products...\n');

  let addedCount = 0;

  for (const supermarket of supermarkets) {
    // Find cheapest matching product for this supermarket
    const { data: products } = await supabase
      .from('products')
      .select('id, name, current_price, image_url')
      .eq('supermarket_id', supermarket.id)
      .ilike('normalized_name', `%${searchTerm}%`)
      .eq('is_available', true)
      .not('current_price', 'is', null)
      .order('current_price')
      .limit(1);

    if (products && products.length > 0) {
      const product = products[0];

      // Check if already exists
      const { data: existing } = await supabase
        .from('popular_item_products')
        .select('id')
        .eq('popular_item_id', selectedItem.id)
        .eq('supermarket_id', supermarket.id)
        .single();

      if (existing) {
        console.log(`⚠️  [${supermarket.name}] Already linked`);
      } else {
        // Insert the mapping
        const { error } = await supabase
          .from('popular_item_products')
          .insert({
            popular_item_id: selectedItem.id,
            product_id: product.id,
            supermarket_id: supermarket.id,
            is_featured: false
          });

        if (error) {
          console.log(`❌ [${supermarket.name}] Error: ${error.message}`);
        } else {
          const hasImage = product.image_url ? '🖼️ ' : '';
          console.log(`✅ [${supermarket.name}] ${hasImage}Added: ${product.name} - £${parseFloat(product.current_price).toFixed(2)}`);
          addedCount++;
        }
      }
    } else {
      console.log(`❌ [${supermarket.name}] No products found`);
    }
  }

  console.log(`\n✨ Auto-population complete! Added ${addedCount} products.`);

  await question('\nPress Enter to continue...');
  await mainMenu();
}

/**
 * Create new popular item
 */
async function createNewPopularItem() {
  console.clear();
  console.log('\n=== Create New Popular Item ===\n');

  const name = await question('Enter unique name (e.g., "milk_4pint_semi_skimmed"): ');
  const displayName = await question('Enter display name (e.g., "4 Pints Semi Skimmed Milk"): ');
  const description = await question('Enter description: ');
  const displayOrder = await question('Enter display order (number): ');

  const { error } = await supabase
    .from('popular_items')
    .insert({
      name: name,
      display_name: displayName,
      description: description,
      display_order: parseInt(displayOrder) || 0,
      is_active: true
    });

  if (error) {
    console.error('\n❌ Error:', error.message);
  } else {
    console.log('\n✅ Successfully created popular item');
  }

  await question('\nPress Enter to continue...');
  await mainMenu();
}

// Start the admin interface
mainMenu();
