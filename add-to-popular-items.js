require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Popular items configuration with size filters
const POPULAR_ITEMS = [
    {
        name: '4 Pints Semi Skimmed Milk',
        searchTerms: ['4pint', 'semi skimmed', 'milk', '2.272l', '4 pint'],
        sizeFilter: {
            type: 'exact',
            size: 4,
            unit: 'pint',
            description: '4 pints'
        }
    },
    {
        name: 'Baked Beans',
        searchTerms: ['baked', 'beans', 'bean'],
        sizeFilter: {
            type: 'range',
            min: 400,
            max: 415,
            unit: 'g',
            description: '400-415g tins'
        }
    },
    {
        name: 'White Bread',
        searchTerms: ['white', 'bread', 'loaf'],
        sizeFilter: {
            type: 'exact',
            size: 800,
            unit: 'g',
            description: '800g'
        }
    },
    {
        name: 'Eggs 6 Pack',
        searchTerms: ['eggs', '6', 'medium'],
        sizeFilter: {
            type: 'exact',
            size: 6,
            unit: 'pack',
            description: '6 pack'
        }
    },
    {
        name: 'Cheddar Cheese',
        searchTerms: ['cheddar', 'cheese'],
        sizeFilter: {
            type: 'exact',
            size: 400,
            unit: 'g',
            description: '400g'
        }
    },
    {
        name: 'Beef Mince',
        searchTerms: ['beef', 'mince', 'minced', 'ground'],
        sizeFilter: {
            type: 'exact',
            size: 500,
            unit: 'g',
            description: '500g'
        }
    },
    {
        name: 'Pasta',
        searchTerms: ['pasta', 'spaghetti', 'penne', 'fusilli'],
        sizeFilter: {
            type: 'exact',
            size: 500,
            unit: 'g',
            description: '500g'
        }
    },
    {
        name: 'Chicken Breast',
        searchTerms: ['chicken', 'breast'],
        sizeFilter: {
            type: 'complex',
            conditions: [
                {
                    type: 'range',
                    min: 200,
                    max: 350,
                    unit: 'g'
                },
                {
                    type: 'exact',
                    size: 2,
                    unit: 'pack'
                }
            ],
            description: '200g-350g or 2 pack'
        }
    }
];

/**
 * Extract size information from product name
 */
function extractSizeFromName(productName) {
    const name = productName.toLowerCase();

    // Common patterns for size extraction
    const patterns = [
        // Weight patterns
        /(\d+(?:\.\d+)?)\s*kg/g,           // 1kg, 1.5kg
        /(\d+(?:\.\d+)?)\s*g\b/g,         // 500g, 12.5g
        /(\d+(?:\.\d+)?)\s*ml/g,          // 250ml, 2.5ml
        /(\d+(?:\.\d+)?)\s*l\b/g,         // 1l, 2.272l

        // Pack patterns
        /(\d+)\s*pack/g,                   // 6 pack, 12 pack
        /(\d+)\s*pk\b/g,                   // 6pk, 12pk

        // Pint patterns
        /(\d+)\s*pint/g,                   // 4 pint, 2 pint
        /(\d+)pint/g,                      // 4pint, 2pint

        // Individual count patterns
        /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|kg|l)/g,  // 6x250ml, 4x500g
    ];

    const sizes = [];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(name)) !== null) {
            const value = parseFloat(match[1]);
            let unit = match[3] || match[0].replace(/\d+(\.\d+)?/, '').trim();

            // Normalize units
            if (unit.includes('pint')) unit = 'pint';
            if (unit.includes('pack') || unit.includes('pk')) unit = 'pack';

            sizes.push({ value, unit, original: match[0] });
        }
    });

    return sizes;
}

/**
 * Check if a product matches the size filter for a popular item
 */
function matchesSizeFilter(productName, sizeFilter) {
    const extractedSizes = extractSizeFromName(productName);

    if (sizeFilter.type === 'exact') {
        return extractedSizes.some(size =>
            size.value === sizeFilter.size &&
            size.unit === sizeFilter.unit
        );
    }

    if (sizeFilter.type === 'range') {
        return extractedSizes.some(size =>
            size.unit === sizeFilter.unit &&
            size.value >= sizeFilter.min &&
            size.value <= sizeFilter.max
        );
    }

    if (sizeFilter.type === 'complex') {
        return sizeFilter.conditions.some(condition => {
            if (condition.type === 'exact') {
                return extractedSizes.some(size =>
                    size.value === condition.size &&
                    size.unit === condition.unit
                );
            }
            if (condition.type === 'range') {
                return extractedSizes.some(size =>
                    size.unit === condition.unit &&
                    size.value >= condition.min &&
                    size.value <= condition.max
                );
            }
            return false;
        });
    }

    return false;
}

/**
 * Check if a product matches a popular item
 */
function matchesPopularItem(productName, popularItem) {
    const name = productName.toLowerCase();

    // Check if product name contains all required search terms
    const matchesTerms = popularItem.searchTerms.every(term =>
        name.includes(term.toLowerCase())
    );

    if (!matchesTerms) return false;

    // Check size filter if specified
    if (popularItem.sizeFilter) {
        return matchesSizeFilter(productName, popularItem.sizeFilter);
    }

    return true;
}

/**
 * Add a product to popular_item_products if it matches any popular item
 */
async function addToPopularItemsIfMatches(productId, productName, productUrl, imageUrl = null) {
    try {
        for (const popularItem of POPULAR_ITEMS) {
            if (matchesPopularItem(productName, popularItem)) {
                console.log(`  🌟 Found popular item match: ${popularItem.name} - ${productName}`);

                // Check if this product is already in popular_item_products
                const { data: existing } = await supabase
                    .from('popular_item_products')
                    .select('id')
                    .eq('product_id', productId)
                    .eq('name', popularItem.name)
                    .single();

                if (!existing) {
                    // Add to popular_item_products
                    const { error } = await supabase
                        .from('popular_item_products')
                        .insert({
                            name: popularItem.name,
                            product_id: productId,
                            product_url: productUrl,
                            image_url: imageUrl
                        });

                    if (error) {
                        console.error(`  ❌ Error adding to popular items: ${error.message}`);
                    } else {
                        console.log(`  ✅ Added to popular_item_products`);
                    }
                } else {
                    console.log(`  ℹ️  Already in popular_item_products`);
                }

                // Only match to one popular item to avoid duplicates
                break;
            }
        }
    } catch (error) {
        console.error(`Error checking popular item match: ${error.message}`);
    }
}

module.exports = { addToPopularItemsIfMatches };