// Supabase Configuration
const SUPABASE_URL = 'https://xdibglwgxmgmhbnrzjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaWJnbHdneG1nbWhibnJ6anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzM3MTEsImV4cCI6MjA3NjUwOTcxMX0.0guVFVDuqvNquS2WyNtITYIs3RXAhddPeIwVGfRujPY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Shopping list array
let shoppingList = [];

// LocalStorage key
const STORAGE_KEY = 'basketsaver_shopping_list';

// Cache for products and supermarkets
let productsCache = [];
let supermarketsCache = {};

// Save shopping list to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shoppingList));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Load shopping list from localStorage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            shoppingList = JSON.parse(saved);
            renderShoppingList();
            console.log(`Loaded ${shoppingList.length} items from localStorage`);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        shoppingList = [];
    }
}

// Clear shopping list
function clearShoppingList() {
    if (shoppingList.length === 0) {
        alert('Your shopping list is already empty.');
        return;
    }

    const confirmed = confirm(`Are you sure you want to clear all ${shoppingList.length} items from your shopping list?`);
    if (confirmed) {
        shoppingList = [];
        saveToLocalStorage();
        renderShoppingList();
    }
}

// Load initial data from Supabase
async function loadInitialData() {
    try {
        // Load supermarkets
        const { data: supermarkets, error: supermarketsError } = await supabase
            .from('supermarkets')
            .select('*')
            .order('name');

        if (supermarketsError) throw supermarketsError;

        // Create supermarkets lookup object
        supermarkets.forEach(sm => {
            supermarketsCache[sm.id] = sm;
        });

        console.log(`Loaded ${supermarkets.length} supermarkets`);

        // Load ALL products with their current prices (no limit)
        // Fetch in batches to handle large datasets
        let allProducts = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('name')
                .range(from, from + batchSize - 1);

            if (productsError) throw productsError;

            if (products && products.length > 0) {
                allProducts = allProducts.concat(products);
                from += batchSize;
                hasMore = products.length === batchSize;
            } else {
                hasMore = false;
            }
        }

        productsCache = allProducts;
        console.log(`Loaded ${allProducts.length} products from all supermarkets`);

    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('Failed to load product data. Please refresh the page.');
    }
}

// Get all unique product names for autocomplete
function getAvailableItems() {
    const uniqueNames = new Set();
    productsCache.forEach(product => {
        // Normalize product names for search
        const name = product.name.toLowerCase();
        uniqueNames.add(name);
    });
    return Array.from(uniqueNames).sort();
}

// Search products by normalized name with smart token-based matching
async function searchProducts(searchTerm) {
    try {
        // First try exact substring match from database (fast)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('normalized_name', `%${searchTerm}%`)
            .order('normalized_name')
            .limit(50); // Fetch more to allow for token filtering

        if (error) throw error;

        // If we got results from exact match, use them
        if (data && data.length > 0) {
            return data.slice(0, 20);
        }

        // If no exact matches, try token-based matching from cache
        // This helps find "coca cola 24x330ml" even if database has "coca cola taste 24x330ml"
        const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        const tokenMatches = productsCache.filter(p => {
            if (!p.normalized_name) return false;
            const normalizedLower = p.normalized_name.toLowerCase();

            // All search tokens must be present
            return searchTokens.every(token => normalizedLower.includes(token));
        });

        return tokenMatches.slice(0, 20);
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

// Add item to shopping list
function addItem() {
    const nameInput = document.getElementById('itemName');
    const quantityInput = document.getElementById('itemQuantity');

    const name = nameInput.value.trim().toLowerCase();
    const quantity = parseInt(quantityInput.value) || 1;

    if (!name) {
        alert('Please enter an item name');
        return;
    }

    // Check if item already exists in the list
    const existingItemIndex = shoppingList.findIndex(item => item.name === name);

    if (existingItemIndex !== -1) {
        // Item exists - increment quantity
        shoppingList[existingItemIndex].quantity += quantity;
    } else {
        // New item - add to list
        shoppingList.push({ name, quantity });
    }

    nameInput.value = '';
    quantityInput.value = '1';
    nameInput.focus();

    saveToLocalStorage();
    renderShoppingList();
}

// Remove item from shopping list
function removeItem(index) {
    shoppingList.splice(index, 1);
    saveToLocalStorage();
    renderShoppingList();
}

// Category mapping for products (matches Supabase categories)
const CATEGORY_MAP = {
    // Fruit & Vegetables
    'apple': { category: 'Fruit & Vegetables', emoji: '🍎' },
    'banana': { category: 'Fruit & Vegetables', emoji: '🍌' },
    'tomato': { category: 'Fruit & Vegetables', emoji: '🍅' },
    'potato': { category: 'Fruit & Vegetables', emoji: '🥔' },
    'onion': { category: 'Fruit & Vegetables', emoji: '🧅' },
    'carrot': { category: 'Fruit & Vegetables', emoji: '🥕' },
    'lettuce': { category: 'Fruit & Vegetables', emoji: '🥬' },
    'broccoli': { category: 'Fruit & Vegetables', emoji: '🥦' },
    'orange': { category: 'Fruit & Vegetables', emoji: '🍊' },
    'pepper': { category: 'Fruit & Vegetables', emoji: '🫑' },
    'cucumber': { category: 'Fruit & Vegetables', emoji: '🥒' },
    'mushroom': { category: 'Fruit & Vegetables', emoji: '🍄' },
    'fruit': { category: 'Fruit & Vegetables', emoji: '🍇' },
    'veg': { category: 'Fruit & Vegetables', emoji: '🥗' },
    'salad': { category: 'Fruit & Vegetables', emoji: '🥗' },

    // Meat & Fish
    'chicken': { category: 'Meat & Fish', emoji: '🍗' },
    'beef': { category: 'Meat & Fish', emoji: '🥩' },
    'pork': { category: 'Meat & Fish', emoji: '🥓' },
    'bacon': { category: 'Meat & Fish', emoji: '🥓' },
    'sausage': { category: 'Meat & Fish', emoji: '🌭' },
    'fish': { category: 'Meat & Fish', emoji: '🐟' },
    'salmon': { category: 'Meat & Fish', emoji: '🐟' },
    'lamb': { category: 'Meat & Fish', emoji: '🍖' },
    'turkey': { category: 'Meat & Fish', emoji: '🦃' },
    'ham': { category: 'Meat & Fish', emoji: '🥓' },
    'meat': { category: 'Meat & Fish', emoji: '🥩' },

    // Bakery
    'bread': { category: 'Bakery', emoji: '🍞' },
    'roll': { category: 'Bakery', emoji: '🥖' },
    'bagel': { category: 'Bakery', emoji: '🥯' },
    'croissant': { category: 'Bakery', emoji: '🥐' },
    'cake': { category: 'Bakery', emoji: '🎂' },
    'muffin': { category: 'Bakery', emoji: '🧁' },
    'bun': { category: 'Bakery', emoji: '🥖' },

    // Dairy & Eggs
    'milk': { category: 'Dairy & Eggs', emoji: '🥛' },
    'cheese': { category: 'Dairy & Eggs', emoji: '🧀' },
    'butter': { category: 'Dairy & Eggs', emoji: '🧈' },
    'eggs': { category: 'Dairy & Eggs', emoji: '🥚' },
    'yogurt': { category: 'Dairy & Eggs', emoji: '🥛' },
    'yoghurt': { category: 'Dairy & Eggs', emoji: '🥛' },
    'cream': { category: 'Dairy & Eggs', emoji: '🥛' },
    'dairy': { category: 'Dairy & Eggs', emoji: '🥛' },

    // Frozen
    'frozen': { category: 'Frozen', emoji: '🧊' },
    'ice cream': { category: 'Frozen', emoji: '🍦' },
    'pizza': { category: 'Frozen', emoji: '🍕' },

    // Cupboard
    'pasta': { category: 'Cupboard', emoji: '🍝' },
    'rice': { category: 'Cupboard', emoji: '🍚' },
    'flour': { category: 'Cupboard', emoji: '🌾' },
    'sugar': { category: 'Cupboard', emoji: '🍬' },
    'salt': { category: 'Cupboard', emoji: '🧂' },
    'oil': { category: 'Cupboard', emoji: '🫒' },
    'sauce': { category: 'Cupboard', emoji: '🥫' },
    'beans': { category: 'Cupboard', emoji: '🫘' },
    'tin': { category: 'Cupboard', emoji: '🥫' },
    'jar': { category: 'Cupboard', emoji: '🫙' },
    'cereal': { category: 'Cupboard', emoji: '🥣' },
    'oats': { category: 'Cupboard', emoji: '🥣' },
    'porridge': { category: 'Cupboard', emoji: '🥣' },

    // Drinks
    'juice': { category: 'Drinks', emoji: '🧃' },
    'coffee': { category: 'Drinks', emoji: '☕' },
    'tea': { category: 'Drinks', emoji: '🍵' },
    'water': { category: 'Drinks', emoji: '💧' },
    'cola': { category: 'Drinks', emoji: '🥤' },
    'coke': { category: 'Drinks', emoji: '🥤' },
    'drink': { category: 'Drinks', emoji: '🥤' },
    'squash': { category: 'Drinks', emoji: '🧃' },

    // Snacks & Treats
    'chocolate': { category: 'Snacks & Treats', emoji: '🍫' },
    'biscuit': { category: 'Snacks & Treats', emoji: '🍪' },
    'cookie': { category: 'Snacks & Treats', emoji: '🍪' },
    'crisp': { category: 'Snacks & Treats', emoji: '🥔' },
    'chip': { category: 'Snacks & Treats', emoji: '🥔' },
    'sweet': { category: 'Snacks & Treats', emoji: '🍬' },
    'candy': { category: 'Snacks & Treats', emoji: '🍭' },

    // Health & Beauty
    'shampoo': { category: 'Health & Beauty', emoji: '🧴' },
    'soap': { category: 'Health & Beauty', emoji: '🧼' },
    'toothpaste': { category: 'Health & Beauty', emoji: '🦷' },
    'deodorant': { category: 'Health & Beauty', emoji: '💨' },

    // Household
    'detergent': { category: 'Household', emoji: '🧽' },
    'cleaner': { category: 'Household', emoji: '🧹' },
    'toilet': { category: 'Household', emoji: '🚽' },
    'paper': { category: 'Household', emoji: '🧻' },
    'bag': { category: 'Household', emoji: '🛍️' },

    // Baby & Toddler
    'baby': { category: 'Baby & Toddler', emoji: '👶' },
    'nappy': { category: 'Baby & Toddler', emoji: '👶' },
    'diaper': { category: 'Baby & Toddler', emoji: '👶' },
    'wipes': { category: 'Baby & Toddler', emoji: '🧻' },

    // Pet Food
    'dog': { category: 'Pet Food', emoji: '🐕' },
    'cat': { category: 'Pet Food', emoji: '🐈' },
    'pet': { category: 'Pet Food', emoji: '🐾' },
};

// Get category from database by matching products in cache
function getCategoryFromDatabase(itemName) {
    const nameLower = itemName.toLowerCase();

    // Find matching products from the cache
    const matchingProducts = productsCache.filter(p => {
        if (!p.normalized_name) return false;
        const normalizedLower = p.normalized_name.toLowerCase();
        return normalizedLower === nameLower || normalizedLower.includes(nameLower) || nameLower.includes(normalizedLower);
    });

    // Get all categories from matching products
    const categories = matchingProducts
        .map(p => p.categories?.name)
        .filter(cat => cat != null);

    if (categories.length === 0) return null;

    // Return the most common category
    const categoryCounts = {};
    categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const mostCommonCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0][0];

    return mostCommonCategory;
}

// Categorize an item based on its name
function categorizeItem(itemName) {
    // First, try to get category from database
    const dbCategory = getCategoryFromDatabase(itemName);
    if (dbCategory) {
        // Map database category to emoji
        const categoryEmojiMap = {
            'Fruit & Vegetables': '🥗',
            'Meat & Fish': '🍗',
            'Bakery': '🍞',
            'Dairy & Eggs': '🥛',
            'Frozen': '🧊',
            'Cupboard': '🥫',
            'Drinks': '🥤',
            'Snacks & Treats': '🍫',
            'Health & Beauty': '🧴',
            'Household': '🧹',
            'Baby & Toddler': '👶',
            'Pet Food': '🐾'
        };

        return {
            category: dbCategory,
            emoji: categoryEmojiMap[dbCategory] || '🛒'
        };
    }

    // Fallback to keyword-based categorization
    const nameLower = itemName.toLowerCase();

    // Priority 1: Check for explicit snack/treat indicators first
    const snackIndicators = ['chocolate', 'candy', 'sweet', 'biscuit', 'cookie', 'crisp', 'chip', 'dessert', 'snack', 'treat', 'chew'];
    if (snackIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Snacks & Treats', emoji: '🍫' };
    }

    // Priority 2: Check for bakery items
    const bakeryIndicators = ['bread', 'roll', 'bagel', 'croissant', 'cake', 'muffin', 'bun'];
    if (bakeryIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Bakery', emoji: '🍞' };
    }

    // Priority 3: Check for dairy (but not if it's part of a brand name like "Dairy Milk")
    // Only match if "milk", "cheese", "butter", "yogurt", "cream", "dairy" appear as standalone products
    if (nameLower.includes('cheese') && !nameLower.includes('chocolate')) {
        return { category: 'Dairy & Eggs', emoji: '🧀' };
    }
    if (nameLower.includes('butter') && !nameLower.includes('peanut')) {
        return { category: 'Dairy & Eggs', emoji: '🧈' };
    }
    if (nameLower.includes('yogurt') || nameLower.includes('yoghurt')) {
        return { category: 'Dairy & Eggs', emoji: '🥛' };
    }
    if (nameLower.includes('cream') && !nameLower.includes('ice cream')) {
        return { category: 'Dairy & Eggs', emoji: '🥛' };
    }
    if (nameLower.includes('egg')) {
        return { category: 'Dairy & Eggs', emoji: '🥚' };
    }
    // Only categorize as dairy if "milk" appears but NOT with chocolate/cadbury
    if (nameLower.includes('milk') && !nameLower.includes('chocolate') && !nameLower.includes('cadbury')) {
        return { category: 'Dairy & Eggs', emoji: '🥛' };
    }

    // Priority 4: Check for drinks
    const drinkIndicators = ['juice', 'coffee', 'tea', 'water', 'cola', 'coke', 'drink', 'squash', 'lemonade', 'beer', 'wine'];
    if (drinkIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Drinks', emoji: '🥤' };
    }

    // Priority 5: Check for meat & fish
    const meatIndicators = ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'fish', 'salmon', 'lamb', 'turkey', 'ham', 'meat', 'hot dog'];
    if (meatIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Meat & Fish', emoji: '🍗' };
    }

    // Priority 6: Check for frozen
    if (nameLower.includes('frozen') || nameLower.includes('ice cream') || nameLower.includes('pizza')) {
        return { category: 'Frozen', emoji: '🧊' };
    }

    // Priority 7: Check for cupboard items
    const cupboardIndicators = ['pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'sauce', 'beans', 'tin', 'jar', 'cereal', 'oats', 'porridge', 'peanut butter', 'jam', 'honey', 'spread'];
    if (cupboardIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Cupboard', emoji: '🥫' };
    }

    // Priority 8: Check for fresh produce (only if not already categorized as snacks)
    const produceIndicators = ['apple', 'banana', 'tomato', 'potato', 'onion', 'carrot', 'lettuce', 'broccoli', 'orange', 'pepper', 'cucumber', 'mushroom', 'salad'];
    if (produceIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Fruit & Vegetables', emoji: '🥗' };
    }

    // Priority 9: Check for health & beauty
    const healthBeautyIndicators = ['shampoo', 'soap', 'toothpaste', 'deodorant'];
    if (healthBeautyIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Health & Beauty', emoji: '🧴' };
    }

    // Priority 10: Check for household
    const householdIndicators = ['detergent', 'cleaner', 'toilet', 'paper', 'bag'];
    if (householdIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Household', emoji: '🧹' };
    }

    // Priority 11: Check for baby & toddler
    const babyIndicators = ['baby', 'nappy', 'diaper', 'wipes'];
    if (babyIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Baby & Toddler', emoji: '👶' };
    }

    // Priority 12: Check for pet food
    // Be specific to avoid false matches like "hot dog"
    if (nameLower.includes('dog food') ||
        nameLower.includes('cat food') ||
        nameLower.includes('pet food') ||
        nameLower.includes('dog treat') ||
        nameLower.includes('cat treat') ||
        (nameLower.includes('pet') && !nameLower.includes('carpet'))) {
        return { category: 'Pet Food', emoji: '🐾' };
    }

    return { category: 'Other', emoji: '🛒' };
}

// Render shopping list with categories
function renderShoppingList() {
    const listContainer = document.getElementById('shoppingListContainer');
    const compareBtn = document.getElementById('compareBtn');
    const headerCompareBtn = document.getElementById('headerCompareBtn');
    const itemCountBadge = document.getElementById('itemCountBadge');
    const compareCTA = document.getElementById('compareCTA');

    // Update counts
    const countText = `${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`;
    if (itemCountBadge) itemCountBadge.textContent = countText;

    if (shoppingList.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛍️</div>
                <div class="empty-text">Your shopping list is empty<br>Start by searching for items above</div>
            </div>
        `;
        compareBtn.disabled = true;
        if (headerCompareBtn) headerCompareBtn.disabled = true;
        if (compareCTA) compareCTA.style.display = 'none';
        return;
    }

    // Group items by category
    const categories = {};
    shoppingList.forEach((item, index) => {
        const { category, emoji } = categorizeItem(item.name);
        if (!categories[category]) {
            categories[category] = { emoji, items: [] };
        }
        categories[category].items.push({ ...item, index });
    });

    // Render categories
    let html = '<div class="categories-grid">';
    Object.entries(categories).forEach(([categoryName, { emoji, items }]) => {
        html += `
            <div class="category-group">
                <div class="category-header">
                    <div class="category-name">
                        <span class="category-emoji">${emoji}</span>
                        ${categoryName}
                    </div>
                    <div class="category-count">${items.length} item${items.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="category-items">
                    ${items.map(item => `
                        <div class="list-item">
                            <span class="item-name">${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                            <div class="item-controls">
                                <input type="number"
                                       class="quantity-input"
                                       value="${item.quantity}"
                                       min="1"
                                       onchange="updateQuantity(${item.index}, this.value)"
                                       onclick="this.select()">
                                <button class="remove-btn" onclick="removeItem(${item.index})" title="Remove item">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += '</div>';

    listContainer.innerHTML = html;
    compareBtn.disabled = false;
    if (headerCompareBtn) headerCompareBtn.disabled = false;
    if (compareCTA) compareCTA.style.display = 'block';
}

// Update quantity for an item
function updateQuantity(index, newQuantity) {
    const qty = parseInt(newQuantity) || 1;
    shoppingList[index].quantity = qty;
    saveToLocalStorage();
    renderShoppingList();
}

// Extract pack size from product name (e.g., "4x415g", "24x330ml", "6 pack")
function extractPackSize(productName) {
    const name = productName.toLowerCase();

    // Pattern 1: "4x415g", "24x330ml" format
    const multipackPattern = /(\d+)x(\d+)(ml|g|l|kg)/;
    const multipackMatch = name.match(multipackPattern);
    if (multipackMatch) {
        return {
            quantity: parseInt(multipackMatch[1]),
            unit: multipackMatch[2] + multipackMatch[3]
        };
    }

    // Pattern 2: "6 pack", "4 pack" format
    const packPattern = /(\d+)\s*pack/;
    const packMatch = name.match(packPattern);
    if (packMatch) {
        return {
            quantity: parseInt(packMatch[1]),
            unit: 'pack'
        };
    }

    // No pack size found - likely a single item
    return null;
}

// Normalize product name for fuzzy matching (handle spelling variations)
function normalizeForMatching(text) {
    return text.toLowerCase()
        .replace(/beanz/g, 'beans')  // Heinz uses "beanz" instead of "beans"
        .replace(/lite/g, 'light')   // UK/US spelling variations
        .replace(/flavour/g, 'flavor');
}

// Compare prices across supermarkets using Supabase data
async function compareBaskets() {
    if (shoppingList.length === 0) {
        alert('Please add items to your shopping list first');
        return;
    }

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="results-placeholder"><div class="results-placeholder-icon">⏳</div><div>Loading prices...</div></div>';

    try {
        // Use cached products instead of fetching again (faster and includes all products)
        const products = productsCache;

        // Group products by supermarket
        const supermarketData = {};
        const unavailableItems = [];
        const foundItems = new Set();

        // Initialize supermarket data structure
        Object.values(supermarketsCache).forEach(sm => {
            supermarketData[sm.id] = {
                supermarket: sm.name,
                total: 0,
                itemBreakdown: [],
                missing: []
            };
        });

        // Process each item in shopping list
        shoppingList.forEach(listItem => {
            const itemName = listItem.name.toLowerCase();

            // Tokenize search term for better matching
            const searchTokens = itemName.split(/\s+/).filter(t => t.length > 0);

            // Extract pack size from search term (e.g., "4x415g", "24x330ml", "6 pack")
            const searchPackSize = extractPackSize(itemName);

            // Find all products matching this item name across all supermarkets using normalized_name
            const matchingProducts = products.filter(p => {
                if (!p.normalized_name) return false;

                const normalizedLower = p.normalized_name.toLowerCase();

                // Apply fuzzy normalization for spelling variations
                const normalizedSearch = normalizeForMatching(itemName);
                const normalizedProduct = normalizeForMatching(normalizedLower);

                // Method 1: Exact substring match (fastest, most precise)
                if (normalizedProduct.includes(normalizedSearch) || normalizedSearch.includes(normalizedProduct)) {
                    return true;
                }

                // Method 2: Token-based matching with fuzzy normalization
                // This allows "coca cola 24x330ml" to match "coca cola taste 24x330ml"
                // and "heinz beans" to match "heinz beanz"
                const normalizedSearchTokens = normalizedSearch.split(/\s+/).filter(t => t.length > 0);

                // Filter out common optional words that don't affect product identity
                const optionalWords = ['baked', 'in', 'with', 'original', 'classic', 'fresh'];
                const requiredSearchTokens = normalizedSearchTokens.filter(token =>
                    !optionalWords.includes(token) && token.length > 2
                );

                // At least the core tokens must be present
                const coreTokensPresent = requiredSearchTokens.every(token =>
                    normalizedProduct.includes(token)
                );

                if (!coreTokensPresent) {
                    return false;
                }

                // Method 3: Pack size validation
                // If search has a pack size, product must have compatible pack size
                const productPackSize = extractPackSize(normalizedLower);

                if (searchPackSize && productPackSize) {
                    // Both have pack sizes - they must match
                    return searchPackSize.quantity === productPackSize.quantity &&
                           searchPackSize.unit === productPackSize.unit;
                } else if (!searchPackSize && productPackSize) {
                    // Search is for single item, product is a multipack - don't match
                    return false;
                } else {
                    // Either both are singles or search doesn't specify pack - allow match
                    return true;
                }
            });

            if (matchingProducts.length === 0) {
                unavailableItems.push(listItem.name);
                // Mark as missing for all supermarkets
                Object.values(supermarketData).forEach(sm => {
                    sm.missing.push(listItem.name);
                });
            } else {
                foundItems.add(listItem.name);

                // Group by supermarket
                const productsBySupermarket = {};
                matchingProducts.forEach(product => {
                    if (!productsBySupermarket[product.supermarket_id]) {
                        productsBySupermarket[product.supermarket_id] = [];
                    }
                    productsBySupermarket[product.supermarket_id].push(product);
                });

                // For each supermarket, use the cheapest matching product
                Object.keys(supermarketData).forEach(supermarketId => {
                    const smId = parseInt(supermarketId);
                    const productsForSupermarket = productsBySupermarket[smId];

                    if (productsForSupermarket && productsForSupermarket.length > 0) {
                        // Find cheapest product
                        const cheapestProduct = productsForSupermarket.reduce((min, p) =>
                            (p.current_price < min.current_price) ? p : min
                        );

                        const itemTotal = cheapestProduct.current_price * listItem.quantity;
                        supermarketData[smId].total += itemTotal;
                        supermarketData[smId].itemBreakdown.push({
                            name: cheapestProduct.name,
                            quantity: listItem.quantity,
                            unitPrice: cheapestProduct.current_price,
                            total: itemTotal
                        });
                    } else {
                        // Product not available at this supermarket
                        supermarketData[smId].missing.push(listItem.name);
                    }
                });
            }
        });

        // Convert to array and sort by total price
        const results = Object.values(supermarketData)
            .filter(sm => sm.itemBreakdown.length > 0) // Only show supermarkets with at least one product
            .sort((a, b) => a.total - b.total);

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="results-placeholder">
                    <div class="results-placeholder-icon">😞</div>
                    <div>No products found in the database. Try different search terms.</div>
                </div>
            `;
            return;
        }

        // Display results
        displayResults(results, unavailableItems);

    } catch (error) {
        console.error('Error comparing baskets:', error);
        resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <div class="results-placeholder-icon">❌</div>
                <div>Error loading prices. Please try again.</div>
            </div>
        `;
    }
}

// Display comparison results
function displayResults(results, unavailableItems) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('results');
    const resultsMeta = document.getElementById('resultsMeta');
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const savings = mostExpensive.total - cheapest.total;

    // Show results section
    resultsSection.style.display = 'block';

    // Update meta information
    resultsMeta.textContent = `Comparing ${results.length} supermarkets`;

    let html = '<div class="results-grid">';

    results.forEach((result, index) => {
        const isCheapest = index === 0;
        const itemsAvailable = result.itemBreakdown.length;
        const totalItems = itemsAvailable + result.missing.length;

        html += `
            <div class="supermarket-card ${isCheapest ? 'cheapest' : ''}">
                ${isCheapest ? '<div class="badge">🏆 Best Value</div>' : ''}
                <div class="supermarket-header">
                    <div class="supermarket-info">
                        <div class="supermarket-name">${result.supermarket}</div>
                        <div class="item-count-sm">${itemsAvailable} of ${totalItems} items available</div>
                    </div>
                    <div class="supermarket-total">
                        <div class="total-label">Total</div>
                        <div class="total-price">£${result.total.toFixed(2)}</div>
                    </div>
                </div>
                ${result.missing.length > 0 ? `
                    <div style="color: var(--text-muted); font-size: 13px; margin-top: 12px; padding: 10px; background: var(--bg-primary); border-radius: var(--radius-sm);">
                        <strong>Not available:</strong> ${result.missing.join(', ')}
                    </div>
                ` : ''}
                <button class="toggle-details" onclick="toggleDetails(${index})">
                    Show Item Breakdown ▼
                </button>
                <div class="item-prices" id="details-${index}">
                    ${result.itemBreakdown.map(item => `
                        <div class="item-price">
                            <span class="item-price-name">${item.name.charAt(0).toUpperCase() + item.name.slice(1)} × ${item.quantity}</span>
                            <span class="item-price-value">£${item.total.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += '</div>'; // Close results-grid

    if (savings > 0.01) {
        html += `
            <div class="savings-card">
                <div class="savings-icon">💰</div>
                <div class="savings-content">
                    <div class="savings-label">Potential Savings</div>
                    <div class="savings-amount">£${savings.toFixed(2)}</div>
                </div>
            </div>
        `;
    }

    resultsContainer.innerHTML = html;

    // Scroll to results section
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle item breakdown details
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const button = event.target;

    if (details.classList.contains('show')) {
        details.classList.remove('show');
        button.textContent = 'Show Item Breakdown ▼';
    } else {
        details.classList.add('show');
        button.textContent = 'Hide Item Breakdown ▲';
    }
}

// Autocomplete functionality
function initAutocomplete() {
    const input = document.getElementById('itemName');
    let currentFocus = -1;

    // Show suggestions on focus (even without typing)
    input.addEventListener('focus', async function() {
        const value = this.value.toLowerCase();

        // If empty, show popular suggestions
        if (!value) {
            await showSuggestions('');
        }
    });

    input.addEventListener('input', async function() {
        const value = this.value.toLowerCase();
        await showSuggestions(value);
    });

    async function showSuggestions(value) {
        closeAllLists();
        currentFocus = -1;

        const autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('id', 'autocomplete-list');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        input.parentNode.appendChild(autocompleteList);

        let matches = [];

        if (!value) {
            // Show first 10 products by normalized name when no search term
            const uniqueNames = new Set();
            productsCache.slice(0, 50).forEach(p => {
                if (p.normalized_name) uniqueNames.add(p.normalized_name.toLowerCase());
            });
            matches = Array.from(uniqueNames).slice(0, 10);
        } else if (value.length >= 2) {
            // Search products from Supabase
            const products = await searchProducts(value);

            // Get unique normalized product names
            const uniqueNames = new Set();
            products.forEach(p => {
                if (p.normalized_name) uniqueNames.add(p.normalized_name.toLowerCase());
            });
            matches = Array.from(uniqueNames).slice(0, 10);
        } else {
            return; // Don't show suggestions for single character
        }

        matches.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'autocomplete-item';

            if (value && value.length >= 2) {
                const matchIndex = item.toLowerCase().indexOf(value);
                if (matchIndex >= 0) {
                    itemDiv.innerHTML = item.substring(0, matchIndex) +
                        '<strong>' + item.substring(matchIndex, matchIndex + value.length) + '</strong>' +
                        item.substring(matchIndex + value.length);
                } else {
                    itemDiv.textContent = item;
                }
            } else {
                itemDiv.textContent = item;
            }

            itemDiv.innerHTML += '<input type="hidden" value="' + item + '">';

            itemDiv.addEventListener('click', function() {
                const itemName = this.getElementsByTagName('input')[0].value;

                // Check if item already exists in the list
                const existingItemIndex = shoppingList.findIndex(item => item.name === itemName);

                if (existingItemIndex !== -1) {
                    // Item exists - increment quantity
                    shoppingList[existingItemIndex].quantity += 1;
                } else {
                    // New item - add to list
                    shoppingList.push({ name: itemName, quantity: 1 });
                }

                saveToLocalStorage();
                renderShoppingList();
                // Clear input and close autocomplete
                input.value = '';
                closeAllLists();
                input.focus();
            });

            autocompleteList.appendChild(itemDiv);
        });
    }

    input.addEventListener('keydown', function(e) {
        let autocompleteList = document.getElementById('autocomplete-list');
        if (autocompleteList) {
            const items = autocompleteList.getElementsByTagName('div');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                addActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                addActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                } else {
                    addItem();
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('autocomplete-active');
        }
    }

    function closeAllLists(except) {
        const items = document.getElementsByClassName('autocomplete-items');
        for (let item of items) {
            if (except !== item && except !== input) {
                item.parentNode.removeChild(item);
            }
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}

// Export shopping list to CSV file
function exportShoppingList() {
    if (shoppingList.length === 0) {
        alert('Your shopping list is empty. Add items before exporting.');
        return;
    }

    // Create CSV content
    let csvContent = 'Item,Quantity\n';
    shoppingList.forEach(item => {
        // Escape commas and quotes in item names
        const escapedName = item.name.includes(',') || item.name.includes('"')
            ? `"${item.name.replace(/"/g, '""')}"`
            : item.name;
        csvContent += `${escapedName},${item.quantity}\n`;
    });

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `basketsaver-list-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Shopping list exported successfully');
}

// Import shopping list from CSV file
function importShoppingList() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const csvContent = event.target.result;
                const lines = csvContent.split('\n').filter(line => line.trim());

                // Skip header row if it exists
                const startIndex = lines[0].toLowerCase().includes('item') ? 1 : 0;
                const importedList = [];

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Parse CSV line (handle quoted values with commas)
                    const match = line.match(/^"([^"]*)"|([^,]+),(.+)$/);
                    let name, quantity;

                    if (match) {
                        if (match[1]) {
                            // Quoted value
                            name = match[1].replace(/""/g, '"');
                            const remaining = line.substring(match[0].length + 1);
                            quantity = parseInt(remaining);
                        } else {
                            // Simple CSV parse
                            const parts = line.split(',');
                            name = parts[0].trim();
                            quantity = parseInt(parts[1]);
                        }

                        if (name && !isNaN(quantity) && quantity > 0) {
                            importedList.push({ name: name.toLowerCase(), quantity });
                        }
                    }
                }

                if (importedList.length === 0) {
                    throw new Error('No valid items found in CSV file');
                }

                // Ask user if they want to replace or append
                const shouldReplace = confirm(
                    `Import ${importedList.length} items?\n\n` +
                    `Click OK to REPLACE your current list\n` +
                    `Click Cancel to ADD to your current list`
                );

                if (shouldReplace) {
                    shoppingList = importedList;
                } else {
                    // Append to existing list
                    shoppingList = [...shoppingList, ...importedList];
                }

                saveToLocalStorage();
                renderShoppingList();
                alert(`Successfully imported ${importedList.length} items!`);

            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to import shopping list. Please make sure the file is a valid CSV with "Item,Quantity" format.');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// Popular Items functionality
const POPULAR_ITEMS = [
    { name: '4 Pints Semi Skimmed Milk', searchTerms: ['4pint', 'semi skimmed', 'milk', '2.272l', '2pint'] },
    { name: 'Baked Beans', searchTerms: ['baked', 'beans', 'bean'] },
    { name: 'White Bread', searchTerms: ['white', 'bread', 'loaf'] },
    { name: 'Eggs 6 Pack', searchTerms: ['eggs', '6', 'medium'] },
    { name: 'Cheddar Cheese', searchTerms: ['cheddar', 'cheese'] },
    { name: 'Pasta', searchTerms: ['pasta', 'spaghetti', 'penne'] },
    { name: 'Minced Beef', searchTerms: ['mince', 'beef', 'minced beef'] },
    { name: 'Bananas', searchTerms: ['banana'] },
    { name: 'Apples', searchTerms: ['apple'] },
    { name: 'Chicken Pieces', searchTerms: ['chicken', 'breast', 'fillet'] }
];

function findBestMatch(itemSearchTerms, supermarketId) {
    const supermarketProducts = productsCache.filter(p => p.supermarket_id === supermarketId && p.is_available && p.current_price);

    // First, score all products
    const scoredProducts = [];

    for (const product of supermarketProducts) {
        const nameToSearch = (product.normalized_name || product.name).toLowerCase();
        let score = 0;

        for (const term of itemSearchTerms) {
            if (nameToSearch.includes(term.toLowerCase())) {
                score++;
            }
        }

        if (score > 0) {
            scoredProducts.push({ product, score });
        }
    }

    if (scoredProducts.length === 0) {
        return null;
    }

    // Find the highest score
    const maxScore = Math.max(...scoredProducts.map(sp => sp.score));

    // Filter to only products with the highest score
    const bestMatches = scoredProducts.filter(sp => sp.score === maxScore);

    // Among the best matches, return the cheapest one
    const cheapestMatch = bestMatches.reduce((min, current) => {
        const minPrice = parseFloat(min.product.current_price);
        const currentPrice = parseFloat(current.product.current_price);
        return currentPrice < minPrice ? current : min;
    });

    return cheapestMatch.product;
}

async function showPopularItems() {
    const popularItemsSection = document.getElementById('popularItemsSection');
    const shoppingListSection = document.querySelector('.shopping-list-section');
    const resultsSection = document.getElementById('resultsSection');
    const searchSection = document.querySelector('.search-section');

    // Hide other sections
    if (shoppingListSection) shoppingListSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';

    // Show popular items section
    popularItemsSection.style.display = 'block';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load and display data
    await loadPopularItemsData();
}

function hidePopularItems() {
    const popularItemsSection = document.getElementById('popularItemsSection');
    const shoppingListSection = document.querySelector('.shopping-list-section');
    const searchSection = document.querySelector('.search-section');

    // Hide popular items
    popularItemsSection.style.display = 'none';

    // Show other sections
    if (shoppingListSection) shoppingListSection.style.display = 'block';
    if (searchSection) searchSection.style.display = 'block';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadPopularItemsData() {
    const grid = document.getElementById('popularItemsGrid');
    const summary = document.getElementById('popularItemsSummary');
    const loading = document.getElementById('popularItemsLoading');
    const content = document.getElementById('popularItemsContent');

    loading.style.display = 'block';
    content.style.display = 'none';

    try {
        // Fetch popular items with denormalized product data (no joins needed!)
        const { data: popularItems, error: itemsError } = await supabase
            .from('popular_items')
            .select(`
                id,
                name,
                display_name,
                description,
                popular_item_products (
                    id,
                    name,
                    current_price,
                    price_per_unit,
                    image_url,
                    product_url,
                    is_featured,
                    supermarkets!inner (
                        id,
                        name
                    )
                )
            `)
            .eq('is_active', true)
            .order('display_order');

        if (itemsError) throw itemsError;

        const supermarketTotals = {};
        let itemsHtml = '';

        // Create a horizontal carousel for each popular item
        for (let itemIndex = 0; itemIndex < popularItems.length; itemIndex++) {
            const item = popularItems[itemIndex];

            // Extract products from denormalized junction table (no products join needed!)
            const productsForItem = item.popular_item_products.map(mapping => ({
                supermarket: mapping.supermarkets.name,
                supermarketId: mapping.supermarkets.id,
                product: {
                    name: mapping.name,
                    current_price: mapping.current_price,
                    image_url: mapping.image_url,
                    product_url: mapping.product_url
                },
                price: parseFloat(mapping.current_price),
                isFeatured: mapping.is_featured
            }));

            // Calculate totals
            productsForItem.forEach(p => {
                if (!supermarketTotals[p.supermarket]) {
                    supermarketTotals[p.supermarket] = 0;
                }
                supermarketTotals[p.supermarket] += p.price;
            });

            // Sort by price (cheapest first)
            productsForItem.sort((a, b) => a.price - b.price);
            const cheapestPrice = productsForItem.length > 0 ? productsForItem[0].price : null;

        // Create item card with horizontal carousel
        let itemHtml = `
            <div style="background: var(--bg-white); border-radius: var(--radius-xl); padding: 24px; box-shadow: var(--shadow-md); border: 2px solid var(--border-light);">
                <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 700; color: var(--text-primary);">${item.display_name || item.name}</h3>
                <div style="position: relative;">
                    <div id="carousel-${itemIndex}" style="overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none;">
                        <div style="display: flex; gap: 16px; padding-bottom: 10px;">
        `;

        if (productsForItem.length > 0) {
            productsForItem.forEach((productItem, idx) => {
                const isCheapest = productItem.price === cheapestPrice;
                const cardStyle = isCheapest
                    ? 'border: 3px solid var(--primary-green); background: linear-gradient(135deg, #c6f6d5 0%, #d9f7e5 100%); box-shadow: 0 6px 20px rgba(56, 161, 105, 0.2);'
                    : 'border: 2px solid var(--border-light); background: var(--bg-light-green);';

                itemHtml += `
                    <div style="flex: 0 0 280px; position: relative; ${cardStyle} border-radius: var(--radius-lg); padding: 20px; transition: all 0.3s ease;">
                        ${isCheapest ? `
                            <div style="position: absolute; top: -10px; right: 10px; background: var(--primary-green); color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; z-index: 10;">BEST PRICE</div>
                            <div style="position: absolute; top: -10px; left: 10px; font-size: 24px; z-index: 10;">⭐</div>
                        ` : ''}

                        <!-- Product Image -->
                        <div style="width: 100%; height: 180px; background: white; border-radius: var(--radius-md); margin-bottom: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${productItem.product.image_url ?
                                `<img src="${productItem.product.image_url}" alt="${productItem.product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div style="display: none; font-size: 48px; color: var(--text-muted);">${getSupermarketEmoji(productItem.supermarket)}</div>` :
                                `<div style="font-size: 48px; color: var(--text-muted);">${getSupermarketEmoji(productItem.supermarket)}</div>`
                            }
                        </div>

                        <!-- Supermarket Name -->
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 16px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">${productItem.supermarket}</div>

                        <!-- Product Name -->
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; text-align: center; min-height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${productItem.product.name}">${productItem.product.name}</div>

                        <!-- Price -->
                        <div style="font-size: 28px; font-weight: 800; color: ${isCheapest ? '#22543d' : 'var(--primary-green)'}; text-align: center; margin-bottom: 12px;">£${productItem.price.toFixed(2)}</div>

                        <!-- View Product Link -->
                        ${productItem.product.product_url ? `
                            <a href="${productItem.product.product_url}" target="_blank" style="display: block; text-align: center; color: var(--primary-green); text-decoration: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px; background: white; border-radius: var(--radius-sm); border: 2px solid var(--primary-green-light); transition: all 0.2s ease;">
                                View Product →
                            </a>
                        ` : ''}
                    </div>
                `;
            });
        } else {
            itemHtml += `
                <div style="flex: 0 0 280px; text-align: center; padding: 40px 20px; color: var(--text-muted); font-style: italic; background: var(--bg-light-green); border-radius: var(--radius-lg); border: 2px solid var(--border-light);">
                    No products available
                </div>
            `;
        }

        itemHtml += `
                        </div>
                    </div>
                    <style>
                        #carousel-${itemIndex}::-webkit-scrollbar {
                            height: 8px;
                        }
                        #carousel-${itemIndex}::-webkit-scrollbar-track {
                            background: var(--bg-light-green);
                            border-radius: 4px;
                        }
                        #carousel-${itemIndex}::-webkit-scrollbar-thumb {
                            background: var(--primary-green-light);
                            border-radius: 4px;
                        }
                        #carousel-${itemIndex}::-webkit-scrollbar-thumb:hover {
                            background: var(--primary-green);
                        }
                    </style>
                </div>
            </div>
        `;

        itemsHtml += itemHtml;
    }

    grid.innerHTML = itemsHtml;

        // Create summary
        const supermarketsList = Object.keys(supermarketTotals);
        let htmlSummary = '';
        let cheapestTotal = Infinity;
        let cheapestSupermarket = '';

        for (const supermarket of supermarketsList) {
            if (supermarketTotals[supermarket] > 0 && supermarketTotals[supermarket] < cheapestTotal) {
                cheapestTotal = supermarketTotals[supermarket];
                cheapestSupermarket = supermarket;
            }
        }

        for (const supermarket of supermarketsList) {
            const isCheapest = supermarket === cheapestSupermarket && supermarketTotals[supermarket] > 0;
            const bgColor = isCheapest ? 'background: var(--primary-green-light); border: 2px solid var(--primary-green);' : 'background: var(--bg-white); border: 2px solid var(--border-light);';
            const star = isCheapest ? ' ⭐' : '';

            htmlSummary += `
                <div style="${bgColor} border-radius: var(--radius-xl); padding: 20px; text-align: center; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">${supermarket} Total${star}</div>
                    <div style="font-size: 28px; font-weight: 800; color: ${isCheapest ? 'var(--primary-green)' : 'var(--text-primary)'};">
                        ${supermarketTotals[supermarket] > 0 ? '£' + supermarketTotals[supermarket].toFixed(2) : 'N/A'}
                    </div>
                </div>
            `;
        }

        summary.innerHTML = htmlSummary;

        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        console.error('Error loading popular items:', error);
        loading.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #DC2626;">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div>Error loading popular items. Please make sure the database tables are set up correctly.</div>
                <div style="font-size: 14px; margin-top: 12px; color: var(--text-muted);">${error.message}</div>
            </div>
        `;
    }
}

// Helper function to get supermarket emojis
function getSupermarketEmoji(supermarketName) {
    const emojis = {
        'ASDA': '🛒',
        'Tesco': '🛍️',
        'Sainsbury\'s': '🏪',
        'Morrisons': '🏬',
        'Aldi': '🛒'
    };
    return emojis[supermarketName] || '📦';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load shopping list from localStorage
    loadFromLocalStorage();

    // Load data from Supabase
    await loadInitialData();

    // Initialize autocomplete
    initAutocomplete();
});
