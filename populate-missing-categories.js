/**
 * Populate category_id for products that don't have one assigned
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Category mapping based on product names
const CATEGORY_PATTERNS = {
  'Fruit & Vegetables': [
    'fruit', 'apple', 'banana', 'orange', 'grape', 'berry', 'berries',
    'strawberry', 'raspberry', 'blueberry', 'melon', 'peach', 'pear',
    'plum', 'cherry', 'kiwi', 'mango', 'pineapple', 'avocado', 'lemon',
    'lime', 'grapefruit', 'apricot', 'nectarine', 'pomegranate',
    'vegetable', 'potato', 'tomato', 'carrot', 'onion', 'pepper',
    'cucumber', 'lettuce', 'broccoli', 'cauliflower', 'cabbage',
    'spinach', 'courgette', 'aubergine', 'mushroom', 'peas', 'beans',
    'sweetcorn', 'salad', 'herbs', 'coriander', 'parsley', 'basil'
  ],
  'Meat & Fish': [
    'meat', 'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck',
    'bacon', 'sausage', 'ham', 'gammon', 'steak', 'mince', 'fillet',
    'fish', 'salmon', 'cod', 'haddock', 'tuna', 'prawns', 'seafood'
  ],
  'Dairy & Eggs': [
    'milk', 'cheese', 'butter', 'eggs', 'yogurt', 'cream', 'dairy'
  ],
  'Bakery': [
    'bread', 'roll', 'baguette', 'bagel', 'croissant', 'pastry',
    'cake', 'muffin', 'bun', 'pitta', 'naan', 'wrap', 'tortilla'
  ],
  'Frozen': [
    'frozen', 'ice cream', 'pizza'
  ],
  'Food Cupboard': [
    'pasta', 'rice', 'noodles', 'cereal', 'oats', 'flour', 'sugar',
    'salt', 'pepper', 'oil', 'vinegar', 'sauce', 'ketchup', 'mayo',
    'jam', 'honey', 'peanut butter', 'beans', 'soup', 'stock', 'gravy'
  ],
  'Drinks': [
    'water', 'juice', 'cola', 'coke', 'pepsi', 'lemonade', 'drink',
    'tea', 'coffee', 'squash', 'cordial'
  ],
  'Snacks & Treats': [
    'chocolate', 'sweets', 'candy', 'crisps', 'chips', 'biscuit',
    'cookie', 'snack'
  ]
};

async function populateMissingCategories() {
  console.log('\n' + '='.repeat(60));
  console.log('POPULATING MISSING CATEGORY IDs');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) throw catError;

    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (id: ${cat.id})`);
    });

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Get products without category_id
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, normalized_name')
      .is('category_id', null);

    if (prodError) throw prodError;

    console.log(`\nFound ${products.length} products without category_id\n`);

    let updated = 0;
    let unmatched = 0;

    // Process each product
    for (const product of products) {
      const nameToMatch = (product.normalized_name || product.name).toLowerCase();
      let matchedCategory = null;

      // Special case: prioritize Drinks if "juice" is in the name
      // This prevents "orange juice" from being categorized as Fruit & Vegetables
      if (nameToMatch.includes('juice') || nameToMatch.includes('drink')) {
        matchedCategory = categoryMap['Drinks'];
      }

      // Try to match against category patterns if not already matched
      if (!matchedCategory) {
        for (const [categoryName, patterns] of Object.entries(CATEGORY_PATTERNS)) {
          if (patterns.some(pattern => nameToMatch.includes(pattern))) {
            matchedCategory = categoryMap[categoryName];
            break;
          }
        }
      }

      if (matchedCategory) {
        // Update product with category
        const { error: updateError } = await supabase
          .from('products')
          .update({ category_id: matchedCategory })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.id}: ${updateError.message}`);
        } else {
          updated++;
          if (updated % 100 === 0) {
            console.log(`Updated ${updated} products...`);
          }
        }
      } else {
        unmatched++;
        if (unmatched <= 10) {
          console.log(`Could not categorize: ${product.name}`);
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('COMPLETE');
    console.log('='.repeat(60));
    console.log(`Updated: ${updated} products`);
    console.log(`Unmatched: ${unmatched} products`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

populateMissingCategories();
