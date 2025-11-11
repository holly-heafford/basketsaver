/**
 * Populate price_per_unit for all products
 * Calculates price per unit based on pack quantities in product names
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Extract pack quantity from product name
 * Patterns:
 * - "12x330ml" -> 12
 * - "6 pack" -> 6
 * - "4pk" -> 4
 * - "5 peaches" -> 5
 */
function extractPackQuantity(name) {
  const lowerName = name.toLowerCase();

  // Pattern 1: "12x330ml" format
  const multipackMatch = lowerName.match(/(\d+)\s*x\s*\d+/);
  if (multipackMatch) {
    return parseInt(multipackMatch[1]);
  }

  // Pattern 2: "4 pack" or "6pk" format
  const packMatch = lowerName.match(/(\d+)\s*(pack|pk)\b/);
  if (packMatch) {
    return parseInt(packMatch[1]);
  }

  // Pattern 3: Leading number like "5 peaches", "12 eggs"
  // But exclude if it's followed by measurements (g, kg, ml, l, pint)
  const leadingNumberMatch = lowerName.match(/^\s*(\d+)\s+(?!\d+[gmlk]|pint)/);
  if (leadingNumberMatch) {
    const quantity = parseInt(leadingNumberMatch[1]);
    // Sanity check: pack quantities are usually between 2 and 100
    if (quantity >= 2 && quantity <= 100) {
      return quantity;
    }
  }

  // No pack quantity found - single item
  return 1;
}

/**
 * Calculate price per unit
 */
function calculatePricePerUnit(price, packQuantity) {
  if (!price || packQuantity <= 0) return null;
  const pricePerUnit = price / packQuantity;
  // Round to 2 decimal places
  return pricePerUnit.toFixed(2);
}

async function populatePricePerUnit() {
  console.log('\n' + '='.repeat(60));
  console.log('POPULATING PRICE PER UNIT');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all products with null price_per_unit
    let allProducts = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    console.log('Fetching products from database...\n');

    while (hasMore) {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, normalized_name, current_price, price_per_unit')
        .is('price_per_unit', null)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (fetchError) throw fetchError;

      allProducts = allProducts.concat(products);
      hasMore = products.length === pageSize;
      page++;
    }

    console.log(`Found ${allProducts.length} products without price_per_unit\n`);

    let updated = 0;
    let skipped = 0;
    const examples = [];

    for (const product of allProducts) {
      const nameToCheck = product.normalized_name || product.name;
      const packQuantity = extractPackQuantity(nameToCheck);
      const pricePerUnit = calculatePricePerUnit(product.current_price, packQuantity);

      if (pricePerUnit) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ price_per_unit: pricePerUnit })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.id}: ${updateError.message}`);
          skipped++;
        } else {
          updated++;

          // Store first 10 examples for display
          if (examples.length < 10) {
            examples.push({
              name: product.name,
              price: product.current_price,
              quantity: packQuantity,
              pricePerUnit: pricePerUnit
            });
          }

          if (updated % 500 === 0) {
            console.log(`Processed ${updated} products...`);
          }
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('COMPLETE');
    console.log('='.repeat(60));
    console.log(`Updated: ${updated} products`);
    console.log(`Skipped: ${skipped} products (no valid price)`);
    console.log('='.repeat(60));

    if (examples.length > 0) {
      console.log('\nExample calculations:');
      console.log('='.repeat(60));
      examples.forEach(ex => {
        console.log(`\nProduct: ${ex.name}`);
        console.log(`  Price: £${ex.price}`);
        console.log(`  Pack Quantity: ${ex.quantity}`);
        console.log(`  Price Per Unit: £${ex.pricePerUnit}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

populatePricePerUnit();
