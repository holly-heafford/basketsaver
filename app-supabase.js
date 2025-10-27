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

        // Load products with their current prices
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (productsError) throw productsError;

        productsCache = products;
        console.log(`Loaded ${products.length} products`);

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

// Search products by normalized name
async function searchProducts(searchTerm) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('normalized_name', `%${searchTerm}%`)
            .order('normalized_name')
            .limit(20);

        if (error) throw error;
        return data;
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

    shoppingList.push({ name, quantity });
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

// Categorize an item based on its name
function categorizeItem(itemName) {
    const nameLower = itemName.toLowerCase();

    for (const [keyword, data] of Object.entries(CATEGORY_MAP)) {
        if (nameLower.includes(keyword)) {
            return data;
        }
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

// Compare prices across supermarkets using Supabase data
async function compareBaskets() {
    if (shoppingList.length === 0) {
        alert('Please add items to your shopping list first');
        return;
    }

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="results-placeholder"><div class="results-placeholder-icon">⏳</div><div>Loading prices...</div></div>';

    try {
        // Get all products that match the shopping list items
        const itemNames = shoppingList.map(item => item.name.toLowerCase());

        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

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

            // Find all products matching this item name across all supermarkets using normalized_name
            const matchingProducts = products.filter(p =>
                p.normalized_name && (
                    p.normalized_name.toLowerCase().includes(itemName) ||
                    itemName.includes(p.normalized_name.toLowerCase())
                )
            );

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
                // Add item directly to shopping list
                shoppingList.push({ name: itemName, quantity: 1 });
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load shopping list from localStorage
    loadFromLocalStorage();

    // Load data from Supabase
    await loadInitialData();

    // Initialize autocomplete
    initAutocomplete();
});
