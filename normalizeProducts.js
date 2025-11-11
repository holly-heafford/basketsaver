const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service key for updates
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Supermarket brand names to remove (but keep other brands like Heinz, Kellogg's, etc.)
const SUPERMARKET_BRANDS = [
    // Supermarket brands (including sub-brands)
    'asda', 'tesco', 'sainsbury\'s', 'sainsburys', 'morrisons', 'aldi', 'lidl', 'waitrose', 'ocado',
    'coop', 'co-op', 'marks & spencer', 'm&s', 'iceland',

    // ASDA sub-brands
    'just essentials by asda', 'just essentials', 'bake by asda', 'cook by asda', 'chosen by you by asda',
    'extra special by asda', 'good & counted by asda', 'free from by asda', 'exceptional by asda', 'exceptional',
    'grower\'s selection', 'growers selection',

    // Tesco sub-brands
    'tesco finest', 'tesco everyday value', 'tesco free from', 'tesco organic',

    // Sainsbury's sub-brands
    'taste the difference', 'sainsbury\'s basics', 'by sainsbury\'s',

    // Morrisons sub-brands
    'morrisons the best', 'morrisons savers', 'morrisons free from'
];

// Well-known food brands to keep (don't remove these)
const KNOWN_BRANDS = [
    'actimel', 'activia', 'arla', 'cadbury', 'coca cola', 'coke', 'pepsi',
    'heinz', 'kellogg\'s', 'nestle', 'mars', 'kit kat', 'dairy milk',
    'tropicana', 'innocent', 'müller', 'muller', 'danone', 'yeo valley',
    'warburtons', 'hovis', 'kingsmill', 'allinson\'s', 'cathedral city',
    'lurpak', 'anchor', 'utterly butterly', 'flora', 'stork',
    'nescafe', 'tetley', 'pg tips', 'twinings', 'yorkshire tea',
    'walkers', 'pringles', 'doritos', 'kettle', 'tyrells',
    'mcvitie\'s', 'mcvities', 'jammie dodgers', 'digestive', 'hobnobs',
    'brioche pasquier', 'st pierre', 'dash', 'perrier', 'evian', 'volvic'
];

// Unit conversions - convert to standardized units
const UNIT_CONVERSIONS = {
    // Liquid volumes
    '2.272l': '4 pints',
    '2.272 litres': '4 pints',
    '1.136l': '2 pints',
    '1.136 litres': '2 pints',
    '568ml': '1 pint',
    '2l': '2 litres',
    '1l': '1 litre',
    '750ml': '750ml',
    '500ml': '500ml',
    '330ml': '330ml',

    // Weights
    '1kg': '1kg',
    '500g': '500g',
    '400g': '400g',
    '200g': '200g',
    '100g': '100g',
};

// Common descriptive words to remove (marketing fluff only)
const FILLER_WORDS = [
    // Multi-word fillers first
    'extra special', 'taste the difference',
    // Single word fillers
    'delicious', 'premium', 'finest', 'selected', 'choice', 'quality',
    'tasty', 'classic', 'traditional', 'authentic', 'original',
    'new', 'improved', 'great', 'value', 'everyday', 'essential',
    'basics', 'standard', 'regular', 'succulent', 'tender', 'flavourful', 'flavoursome',
    'fragrant', 'juicy', 'sweet', 'tangy', 'smooth', 'refreshing', 'plump',
    'crisp', 'crunchy', 'creamy', 'firm', 'mild', 'nutty', 'savoury',
    'fluffy', 'golden', 'ripe', 'brilliant', 'bursting', 'delicate', 'aromatic',
    'zesty', 'ultra'
];

/**
 * Normalize a product name by removing supermarket brands and standardizing format
 */
function normalizeProductName(productName) {
    let normalized = productName.toLowerCase().trim();

    // Step 1: Remove supermarket brands (sort by length descending)
    const sortedBrands = [...SUPERMARKET_BRANDS].sort((a, b) => b.length - a.length);
    for (const brand of sortedBrands) {
        const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        normalized = normalized.replace(regex, '');
    }

    // Step 1.5: Protect important geographic/brand terms before removing filler words
    // Replace them with placeholders to prevent removal
    const protectedTerms = {
        'new zealand': '___NEW_ZEALAND___',
        'new york': '___NEW_YORK___'
    };

    for (const [term, placeholder] of Object.entries(protectedTerms)) {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        normalized = normalized.replace(regex, placeholder);
    }

    // Step 2: Remove marketing filler words (sort by length descending)
    const sortedFillers = [...FILLER_WORDS].sort((a, b) => b.length - a.length);
    for (const filler of sortedFillers) {
        const regex = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        normalized = normalized.replace(regex, '');
    }

    // Step 2.1: Restore protected terms
    for (const [term, placeholder] of Object.entries(protectedTerms)) {
        normalized = normalized.replace(new RegExp(placeholder, 'gi'), term);
    }

    // Step 2.5: Clean up orphaned conjunctions and prepositions left behind after removing brand names
    // This handles cases like "5 & Sweet" → "5 &" or "Juicy & 4" → "& 4" or "Exceptional British" → "by British"
    // Remove &, "and", or "by" when they appear:
    // - at the start/end: "& 4 peaches" → "4 peaches", "5 peaches &" → "5 peaches", "by beef" → "beef"
    // - between number and word: "5 & peaches" → "5 peaches", "5 and peaches" → "5 peaches"
    // - between word and number: "peaches & 4" → "peaches 4", "peaches and 4" → "peaches 4"
    normalized = normalized
        .replace(/\s*&\s+(\d)/g, ' $1')           // "5 & peaches" → "5 peaches"
        .replace(/(\d)\s+&\s*/g, '$1 ')           // "peaches & 4" → "peaches 4"
        .replace(/\s+and\s+(\d)/g, ' $1')         // "5 and peaches" → "5 peaches"
        .replace(/(\d)\s+and\s+/g, '$1 ')         // "peaches and 4" → "peaches 4"
        .replace(/^\s*&\s+/g, '')                 // "& peaches" → "peaches"
        .replace(/\s+&\s*$/g, '')                 // "peaches &" → "peaches"
        .replace(/^\s*and\s+/g, '')               // "and peaches" → "peaches"
        .replace(/\s+and\s*$/g, '')               // "peaches and" → "peaches"
        .replace(/^\s*by\s+/g, '')                // "by beef" → "beef"
        .replace(/\s+by\s*$/g, '');               // "beef by" → "beef"

    // Step 3: Standardize spelling variations
    normalized = normalized
        .replace(/\byoghurt\b/gi, 'yogurt')
        .replace(/\byoghourt\b/gi, 'yogurt');

    // Step 4: Standardize plurals to singular (except eggs which should stay plural)
    normalized = normalized
        .replace(/\begg\b/gi, 'eggs')  // Standardize singular egg to plural eggs
        .replace(/\bcroissants\b/gi, 'croissant')
        .replace(/\bbiscuits\b/gi, 'biscuit')
        .replace(/\bgrapes\b/gi, 'grape')
        .replace(/\bpotatoes\b/gi, 'potato')
        .replace(/\btomatoes\b/gi, 'tomato')
        .replace(/\bfillets\b/gi, 'fillet')
        .replace(/\bsteaks\b/gi, 'steak')
        .replace(/\bbuns\b/gi, 'bun')
        .replace(/\bchicken\s+wings\b/gi, 'chicken wing')
        .replace(/\bchicken\s+breasts\b/gi, 'chicken breast')
        .replace(/\bchicken\s+thighs\b/gi, 'chicken thigh');

    // Step 5: Standardize units
    // Convert commas to dots in numbers
    normalized = normalized.replace(/(\d+),(\d+)/g, '$1.$2');

    // Standardize pack sizes
    normalized = normalized
        .replace(/\b(\d+)\s*x\s*(\d+)\s*(g|ml|l|kg)\b/gi, ' $1x$2$3 ')
        .replace(/\b(\d+)\s+pack\b/gi, ' $1pk ')
        .replace(/\bmultipack\b/gi, ' mpk ');

    // Standardize liquid measures
    normalized = normalized
        .replace(/\b2\.272\s*l(itres?)?\b/gi, ' 4pint ')
        .replace(/\b1\.136\s*l(itres?)?\b/gi, ' 2pint ')
        .replace(/\b568\s*ml\b/gi, ' 1pint ')
        .replace(/\b(\d+\.?\d*)\s*litres?\b/gi, ' $1l ')
        .replace(/\b(\d+\.?\d*)\s*ml\b/gi, ' $1ml ')
        .replace(/\b(\d+)\s*pints?\b/gi, ' $1pint ');

    // Standardize weights
    normalized = normalized
        .replace(/\b(\d+\.?\d*)\s*kg\b/gi, ' $1kg ')
        .replace(/\b(\d+\.?\d*)\s*g\b/gi, ' $1g ');

    // Step 6: Clean up punctuation
    normalized = normalized
        .replace(/[,\-\/]/g, ' ')
        .replace(/&/g, ' and ')
        .replace(/\s+/g, ' ')
        .trim();

    // Step 7: Remove duplicate words
    normalized = normalized.replace(/\b(\w+)\s+\1\b/g, '$1');

    // Step 8: Remove leading/trailing articles
    normalized = normalized.replace(/^(a|an|the)\s+/i, '');
    normalized = normalized.replace(/\s+(a|an|the)$/i, '');

    return {
        normalizedName: normalized,
        tags: []
    };
}

/**
 * Process all products in the database and add normalized names and tags
 */
async function normalizeAllProducts() {
    try {
        console.log('Fetching products from database...');

        // Fetch ALL products (Supabase has a default limit of 1000, so we need to paginate)
        let allProducts = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: products, error: fetchError } = await supabase
                .from('products')
                .select('id, name, normalized_name, tags')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (fetchError) throw fetchError;

            allProducts = allProducts.concat(products);
            hasMore = products.length === pageSize;
            page++;
        }

        const products = allProducts;

        console.log(`Found ${products.length} products to normalize`);

        let updated = 0;
        let skipped = 0;

        for (const product of products) {
            const { normalizedName, tags } = normalizeProductName(product.name);

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    normalized_name: normalizedName,
                    tags: tags.length > 0 ? tags : null
                })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Error updating product ${product.id}:`, updateError);
            } else {
                updated++;
                if (updated % 100 === 0) {
                    console.log(`Processed ${updated} products...`);
                }
            }
        }

        console.log(`\n✓ Normalization complete!`);
        console.log(`  Updated: ${updated} products`);
        console.log(`  Skipped: ${skipped} products (already normalized)`);

        // Show some examples
        console.log('\nExample normalized products:');
        const { data: examples } = await supabase
            .from('products')
            .select('name, normalized_name, tags')
            .not('normalized_name', 'is', null)
            .limit(10);

        examples.forEach(p => {
            console.log(`\nOriginal: ${p.name}`);
            console.log(`Normalized: ${p.normalized_name}`);
            if (p.tags && p.tags.length > 0) {
                console.log(`Tags: ${p.tags.join(', ')}`);
            }
        });

    } catch (error) {
        console.error('Error normalizing products:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    normalizeAllProducts();
}

// Export for use in other scripts
module.exports = { normalizeProductName };
