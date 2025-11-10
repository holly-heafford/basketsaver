/**
 * Category Mapping Module
 *
 * Maps supermarket-specific category names to standardized main categories
 * This ensures consistent categorization across all supermarkets
 */

// Standard main categories (your 12 categories)
const MAIN_CATEGORIES = [
  'Fruit & Vegetables',
  'Meat & Fish',
  'Bakery',
  'Dairy & Eggs',
  'Frozen',
  'Cupboard',
  'Drinks',
  'Snacks & Treats',
  'Health & Beauty',
  'Household',
  'Baby & Toddler',
  'Pet Food'
];

/**
 * ASDA category mappings
 * Maps ASDA's MAIN category names (from Excel file) to our standard 12 categories
 * This is much simpler than mapping 267 subcategories!
 */
const ASDA_CATEGORY_MAP = {
  'Baby': 'Baby & Toddler',
  'Bakery': 'Bakery',
  'Beer, Wine & Spirits': 'Drinks',
  'Chilled Food': 'Dairy & Eggs',
  'Dietary & Lifestyle': 'Cupboard',
  'Drinks': 'Drinks',
  'Food Cupboard': 'Cupboard',
  'Frozen Food': 'Frozen',
  'Fruit, Veg & Flowers': 'Fruit & Vegetables',
  'Health & Beauty': 'Health & Beauty',
  'Household': 'Household',
  'Meat, Poultry & Fish': 'Meat & Fish',
  'Pet': 'Pet Food',
  'Sweets, Treats & Snacks': 'Snacks & Treats'
};

/**
 * Tesco category mappings (add as needed when scraping Tesco)
 */
const TESCO_CATEGORY_MAP = {
  // Add Tesco mappings here as you discover them
  'Fresh Food': 'Fruit & Vegetables',
  'Bakery': 'Bakery',
  'Meat & Fish': 'Meat & Fish'
  // ... more to be added
};

/**
 * Sainsbury's category mappings (add as needed)
 */
const SAINSBURYS_CATEGORY_MAP = {
  // Add Sainsbury's mappings here
};

/**
 * Morrisons category mappings (add as needed)
 */
const MORRISONS_CATEGORY_MAP = {
  // Add Morrisons mappings here
};

/**
 * Aldi category mappings (add as needed)
 */
const ALDI_CATEGORY_MAP = {
  // Add Aldi mappings here
};

/**
 * Maps a supermarket-specific category name to a standard main category
 *
 * @param {string} subcategoryName - The category name from the supermarket
 * @param {string} supermarketSlug - The supermarket identifier (e.g., 'asda', 'tesco')
 * @returns {string|null} - The mapped main category name, or null if no mapping found
 */
function mapToMainCategory(subcategoryName, supermarketSlug) {
  if (!subcategoryName) return null;

  let categoryMap;

  switch (supermarketSlug.toLowerCase()) {
    case 'asda':
      categoryMap = ASDA_CATEGORY_MAP;
      break;
    case 'tesco':
      categoryMap = TESCO_CATEGORY_MAP;
      break;
    case 'sainsburys':
    case 'sainsbury\'s':
      categoryMap = SAINSBURYS_CATEGORY_MAP;
      break;
    case 'morrisons':
      categoryMap = MORRISONS_CATEGORY_MAP;
      break;
    case 'aldi':
      categoryMap = ALDI_CATEGORY_MAP;
      break;
    default:
      console.warn(`Unknown supermarket: ${supermarketSlug}`);
      return null;
  }

  // Direct mapping
  if (categoryMap[subcategoryName]) {
    return categoryMap[subcategoryName];
  }

  // If already a main category, return as-is
  if (MAIN_CATEGORIES.includes(subcategoryName)) {
    return subcategoryName;
  }

  // No mapping found
  console.warn(`No category mapping found for "${subcategoryName}" at ${supermarketSlug}`);
  return null;
}

module.exports = {
  MAIN_CATEGORIES,
  mapToMainCategory,
  ASDA_CATEGORY_MAP,
  TESCO_CATEGORY_MAP,
  SAINSBURYS_CATEGORY_MAP,
  MORRISONS_CATEGORY_MAP,
  ALDI_CATEGORY_MAP
};
