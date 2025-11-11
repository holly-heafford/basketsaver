// Supabase configuration
const SUPABASE_URL = 'https://eefxhegdidltfpmirwbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnhoZWdkaWRsdGZwbWlyd2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MjU5NjgsImV4cCI6MjA1MjIwMTk2OH0.YMbwMCt2T91FrWmpEsU0MYwVdoZm8E_Lm4C08PV9yJY';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// List of popular items to compare with size specifications for fair comparison
const POPULAR_ITEMS = [
    {
        name: '4 Pints Semi Skimmed Milk',
        searchTerms: ['4pint', 'semi skimmed', 'milk', '2.272l'],
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
        name: 'Pasta',
        searchTerms: ['pasta', 'spaghetti', 'penne'],
        sizeFilter: {
            type: 'exact',
            size: 500,
            unit: 'g',
            description: '500g'
        }
    },
    {
        name: 'Minced Beef',
        searchTerms: ['mince', 'beef', 'minced beef'],
        sizeFilter: {
            type: 'exact',
            size: 500,
            unit: 'g',
            description: '500g'
        }
    },
    { name: 'Bananas', searchTerms: ['banana'] },
    { name: 'Apples', searchTerms: ['apple'] },
    {
        name: 'Chicken Pieces',
        searchTerms: ['chicken', 'breast', 'fillet'],
        sizeFilter: {
            type: 'complex',
            criteria: [
                { type: 'range', min: 200, max: 350, unit: 'g' },
                { type: 'exact', size: 2, unit: 'pack' }
            ],
            description: '200g-350g or 2 pack'
        }
    }
];

const SUPERMARKETS = ['ASDA', 'Tesco', 'Sainsbury\'s', 'Morrisons', 'Aldi'];

// Store all products and supermarket data
let allProducts = [];
let supermarketMap = {};

/**
 * Initialize the page
 */
async function init() {
    try {
        await loadData();
        await displayComparison();
    } catch (error) {
        showError('Failed to load price comparison: ' + error.message);
    }
}

/**
 * Load all required data from Supabase
 */
async function loadData() {
    console.log('Loading data from Supabase...');

    // Load supermarkets
    const { data: supermarkets, error: supermarketsError } = await supabaseClient
        .from('supermarkets')
        .select('*');

    if (supermarketsError) throw supermarketsError;

    // Create supermarket name -> id mapping
    supermarkets.forEach(s => {
        supermarketMap[s.name] = s.id;
    });

    console.log('Loaded supermarkets:', supermarketMap);

    // Load popular item products instead of all products
    const { data: popularProducts, error: popularError } = await supabaseClient
        .from('popular_item_products')
        .select(`
            id,
            name,
            normalized_name,
            current_price,
            product_url,
            supermarket_id,
            image_url,
            popular_items!inner(name)
        `);

    if (popularError) throw popularError;

    allProducts = popularProducts;
    console.log(`Loaded ${allProducts.length} popular products`);
    console.log('Sample product data:', allProducts[0]);
}

/**
 * Extract size information from product name
 */
function extractSizeFromName(productName) {
    const name = productName.toLowerCase();

    // Common size patterns to match
    const patterns = [
        // Weight patterns (g, kg)
        /(\d+(?:\.\d+)?)\s*kg/g,
        /(\d+(?:\.\d+)?)\s*g(?!\s*[a-z])/g,

        // Volume patterns (ml, l)
        /(\d+(?:\.\d+)?)\s*l(?!\s*[a-z])/g,
        /(\d+(?:\.\d+)?)\s*ml/g,

        // Count patterns
        /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*g/g,
        /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*ml/g,
        /(\d+)\s*pack/g,
        /(\d+)\s*pint/g,

        // Egg-specific patterns
        /(\d+)\s*egg/g,
        /half\s*dozen/g,
        /dozen/g
    ];

    const sizes = [];

    // Extract all size matches
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(name)) !== null) {
            if (pattern.source.includes('x')) {
                // Handle pack sizes like "4 x 410g"
                const count = parseInt(match[1]);
                const unitSize = parseFloat(match[2]);
                sizes.push({
                    value: unitSize,
                    unit: pattern.source.includes('ml') ? 'ml' : 'g',
                    isMultipack: true,
                    packCount: count,
                    totalValue: count * unitSize
                });
            } else if (pattern.source.includes('kg')) {
                // Convert kg to g
                sizes.push({
                    value: parseFloat(match[1]) * 1000,
                    unit: 'g',
                    isMultipack: false
                });
            } else if (pattern.source.includes('l(?!')) {
                // Convert l to ml
                sizes.push({
                    value: parseFloat(match[1]) * 1000,
                    unit: 'ml',
                    isMultipack: false
                });
            } else if (pattern.source.includes('half\\s*dozen')) {
                // Half dozen = 6
                sizes.push({
                    value: 6,
                    unit: 'pack',
                    isMultipack: false
                });
            } else if (pattern.source === 'dozen') {
                // Dozen = 12
                sizes.push({
                    value: 12,
                    unit: 'pack',
                    isMultipack: false
                });
            } else {
                sizes.push({
                    value: parseFloat(match[1]),
                    unit: pattern.source.includes('ml') ? 'ml' :
                          pattern.source.includes('pack') ? 'pack' :
                          pattern.source.includes('pint') ? 'pint' :
                          pattern.source.includes('egg') ? 'pack' : 'g',
                    isMultipack: false
                });
            }
        }
    }

    return sizes;
}

/**
 * Check if a product matches the size filter criteria
 */
function matchesSizeFilter(productName, sizeFilter) {
    if (!sizeFilter) return true; // No filter means all products match

    const sizes = extractSizeFromName(productName);
    if (sizes.length === 0) return false; // No size info found

    // Handle complex filter (multiple criteria, any can match)
    if (sizeFilter.type === 'complex') {
        for (const criteria of sizeFilter.criteria) {
            if (matchesSingleCriteria(sizes, criteria)) {
                return true;
            }
        }
        return false;
    }

    // Handle simple filters
    return matchesSingleCriteria(sizes, sizeFilter);
}

/**
 * Check if sizes match a single criteria
 */
function matchesSingleCriteria(sizes, criteria) {
    for (const size of sizes) {
        // Skip if units don't match
        if (size.unit !== criteria.unit) continue;

        if (criteria.type === 'exact') {
            // For single items, check the value directly
            // For multipacks, check the individual unit size
            const valueToCheck = size.isMultipack ? size.value : size.value;
            const tolerance = criteria.unit === 'g' ? 5 : 0; // Allow 5g tolerance for weight
            if (Math.abs(valueToCheck - criteria.size) <= tolerance) {
                return true;
            }
        } else if (criteria.type === 'range') {
            const valueToCheck = size.isMultipack ? size.value : size.value;
            if (valueToCheck >= criteria.min && valueToCheck <= criteria.max) {
                return true;
            }
        }
    }

    return false;
}

// Note: findBestMatch function removed - now using direct category matching in displayComparison()

/**
 * Extract image URL from product URL
 */
function getProductImageUrl(productUrl, supermarketName) {
    // For now, we'll use a placeholder icon based on supermarket
    // In the future, we could scrape actual product images
    const supermarketIcons = {
        'ASDA': '🛒',
        'Tesco': '🛍️',
        'Sainsbury\'s': '🏪',
        'Morrisons': '🏬',
        'Aldi': '🛒'
    };

    return supermarketIcons[supermarketName] || '📦';
}

/**
 * Display the comparison carousel
 */
async function displayComparison() {
    console.log('=== DISPLAYING CAROUSEL VERSION ===');
    const itemsGrid = document.getElementById('items-grid');
    const summaryDiv = document.getElementById('summary');
    const loadingDiv = document.getElementById('loading');
    const comparisonContainer = document.getElementById('comparison-container');

    itemsGrid.innerHTML = '';

    const supermarketTotals = {};
    const supermarketWins = {};

    SUPERMARKETS.forEach(supermarket => {
        supermarketTotals[supermarket] = 0;
        supermarketWins[supermarket] = 0;
    });

    // Group products by popular item category
    const productsByCategory = {};
    allProducts.forEach(product => {
        const categoryName = product.popular_items.name;
        if (!productsByCategory[categoryName]) {
            productsByCategory[categoryName] = [];
        }
        productsByCategory[categoryName].push(product);
    });

    console.log('Products grouped by category:', productsByCategory);

    // Process each popular item
    for (const item of POPULAR_ITEMS) {
        // Create item card
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';

        // Item header
        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';

        const itemName = document.createElement('div');
        itemName.className = 'item-name';
        itemName.textContent = item.name;

        const itemSubtitle = document.createElement('div');
        itemSubtitle.className = 'item-subtitle';
        itemSubtitle.textContent = item.sizeFilter ?
            `Compare prices (${item.sizeFilter.description})` :
            'Compare prices';

        itemHeader.appendChild(itemName);
        itemHeader.appendChild(itemSubtitle);
        itemCard.appendChild(itemHeader);

        // Products carousel container
        const carousel = document.createElement('div');
        carousel.className = 'products-carousel';

        // Map item name to category name
        const categoryMapping = {
            '4 Pints Semi Skimmed Milk': 'semi_skimmed_milk',
            'Baked Beans': 'baked_beans',
            'White Bread': 'white_bread',
            'Eggs 6 Pack': 'eggs',
            'Cheddar Cheese': 'cheddar_cheese',
            'Pasta': 'pasta',
            'Minced Beef': 'beef_mince',
            'Bananas': 'bananas',
            'Apples': 'apples',
            'Chicken Pieces': 'chicken_breast'
        };

        const categoryName = categoryMapping[item.name];
        const categoryProducts = productsByCategory[categoryName] || [];

        console.log(`${item.name} -> ${categoryName}: ${categoryProducts.length} products`);

        // Find products for each supermarket
        const productsForItem = [];

        for (const supermarket of SUPERMARKETS) {
            const supermarketId = supermarketMap[supermarket];
            if (!supermarketId) continue;

            const product = categoryProducts.find(p => p.supermarket_id === supermarketId);

            if (product && product.current_price) {
                const price = parseFloat(product.current_price);
                productsForItem.push({
                    supermarket,
                    product,
                    price
                });
                supermarketTotals[supermarket] += price;
            }
        }

        // Sort by price (cheapest first)
        productsForItem.sort((a, b) => a.price - b.price);

        // Find cheapest price for highlighting
        const cheapestPrice = productsForItem.length > 0 ? productsForItem[0].price : null;

        // Create product items
        if (productsForItem.length > 0) {
            productsForItem.forEach((item, index) => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';

                const isCheapest = item.price === cheapestPrice;
                if (isCheapest) {
                    productItem.classList.add('cheapest');
                    supermarketWins[item.supermarket]++;
                }

                // Product image
                const imageDiv = document.createElement('div');
                imageDiv.className = 'product-image';

                if (item.product.image_url) {
                    // Use actual product image
                    console.log(`Loading image for ${item.product.name}: ${item.product.image_url}`);
                    const img = document.createElement('img');
                    img.src = item.product.image_url;
                    img.alt = item.product.name;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';

                    // Add error handling for broken images
                    img.onerror = function() {
                        console.error(`Failed to load image for ${item.product.name}: ${item.product.image_url}`);
                        // Replace with placeholder if image fails to load
                        imageDiv.innerHTML = '';
                        imageDiv.className = 'product-image placeholder';
                        imageDiv.textContent = getProductImageUrl(item.product.product_url, item.supermarket);
                    };

                    img.onload = function() {
                        console.log(`✅ Successfully loaded image for ${item.product.name}`);
                    };

                    imageDiv.appendChild(img);
                } else {
                    // Fallback to placeholder icon
                    console.log(`No image URL for ${item.product.name}, using placeholder`);
                    imageDiv.className = 'product-image placeholder';
                    imageDiv.textContent = getProductImageUrl(item.product.product_url, item.supermarket);
                }

                productItem.appendChild(imageDiv);

                // Product details
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'product-details';

                const supermarketName = document.createElement('div');
                supermarketName.className = 'supermarket-name';
                supermarketName.textContent = item.supermarket;

                const productName = document.createElement('div');
                productName.className = 'product-name-small';
                productName.textContent = item.product.name;
                productName.title = item.product.name; // Show full name on hover

                const priceDiv = document.createElement('div');
                priceDiv.className = 'product-price';
                priceDiv.textContent = `£${item.price.toFixed(2)}`;

                detailsDiv.appendChild(supermarketName);
                detailsDiv.appendChild(productName);
                detailsDiv.appendChild(priceDiv);

                // Product link
                if (item.product.product_url) {
                    const link = document.createElement('a');
                    link.href = item.product.product_url;
                    link.target = '_blank';
                    link.className = 'product-link';
                    link.textContent = 'View Product →';
                    detailsDiv.appendChild(link);
                }

                productItem.appendChild(detailsDiv);
                carousel.appendChild(productItem);
            });
        } else {
            const noProducts = document.createElement('div');
            noProducts.className = 'not-available-msg';
            noProducts.textContent = 'No products available';
            carousel.appendChild(noProducts);
        }

        itemCard.appendChild(carousel);
        itemsGrid.appendChild(itemCard);
    }

    // Create summary
    summaryDiv.innerHTML = '';

    // Total basket cost for each supermarket
    for (const supermarket of SUPERMARKETS) {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = `${supermarket} Total`;

        const value = document.createElement('div');
        value.className = 'value';

        if (supermarketTotals[supermarket] > 0) {
            value.textContent = `£${supermarketTotals[supermarket].toFixed(2)}`;

            // Find overall cheapest basket
            const allTotals = Object.values(supermarketTotals).filter(t => t > 0);
            const cheapestTotal = allTotals.length > 0 ? Math.min(...allTotals) : null;

            if (supermarketTotals[supermarket] === cheapestTotal) {
                value.style.color = '#38a169';
                value.innerHTML += ' ⭐';
            }
        } else {
            value.textContent = 'N/A';
            value.style.color = '#a0aec0';
        }

        summaryItem.appendChild(label);
        summaryItem.appendChild(value);
        summaryDiv.appendChild(summaryItem);
    }

    // Show the comparison and hide loading
    loadingDiv.style.display = 'none';
    comparisonContainer.style.display = 'block';
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    loadingDiv.style.display = 'none';

    console.error(message);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
