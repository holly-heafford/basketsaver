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
 * Tesco category mappings (subcategory level)
 */
const TESCO_CATEGORY_MAP = {
  'Fresh Fruit': 'Fruit & Vegetables',
  'Fresh Vegetables & Fresh Flowers': 'Fruit & Vegetables',
  'Fresh Salad, Coleslaw & Sandwich Fillers': 'Fruit & Vegetables',
  'Fresh Meat & Poultry': 'Meat & Fish',
  'Fresh Fish & Seafood': 'Meat & Fish',
  'Chilled Vegetarian & Vegan': 'Fruit & Vegetables',
  'Cooked Meat, Antipasti & Deli': 'Meat & Fish',
  'Ready Meals': 'Fruit & Vegetables',
  'Pizza & Garlic Bread': 'Fruit & Vegetables',
  'Chilled Soup, Sandwiches & Salad Pots': 'Fruit & Vegetables',
  'Milk, Butter & Eggs': 'Dairy & Eggs',
  'Cheese': 'Dairy & Eggs',
  'Yogurts': 'Dairy & Eggs',
  'Chilled Desserts': 'Dairy & Eggs',
  'Juice & Smoothies': 'Fruit & Vegetables',
  'Pasta, Noodles & Rice': 'Fruit & Vegetables',
  'Cooking Sauces, Pestos & Passatas': 'Fruit & Vegetables',
  'Olives, Pickles & Chutneys': 'Fruit & Vegetables',
  'Finest Fresh Food': 'Fruit & Vegetables',
  'Christmas Fresh Food': 'Fruit & Vegetables',
  'Christmas Meat, Poultry & Fish': 'Meat & Fish',
  'Bread': 'Bakery',
  'Bread Rolls & Thins': 'Bakery',
  'Wraps, Bagels & Pittas': 'Bakery',
  'Crumpets & Pancakes': 'Bakery',
  'Teacakes & Fruit Loaf': 'Bakery',
  'Cakes': 'Bakery',
  'Cake Bars & Slices': 'Bakery',
  'Muffins, Flapjacks & Brownies': 'Bakery',
  'Pastries & Croissants': 'Bakery',
  'Biscuits For Cheese': 'Dairy & Eggs',
  'Finest Bakery': 'Bakery',
  'In-Store Bakery': 'Bakery',
  'Free From Bakery': 'Bakery',
  'Christmas Bakery': 'Bakery',
  'Ice Cream': 'Frozen',
  'Ice Lollies': 'Frozen',
  'Frozen Desserts': 'Frozen',
  'Frozen Pizza': 'Frozen',
  'Frozen Ready Meals': 'Frozen',
  'Frozen Vegetarian & Vegan': 'Frozen',
  'Frozen Chips, Onion Rings & Potato Products': 'Frozen',
  'Frozen Vegetables': 'Frozen',
  'Frozen Fish': 'Meat & Fish',
  'Frozen Chicken': 'Frozen',
  'Frozen Meat': 'Meat & Fish',
  'Frozen Sausages, Burgers & Grills': 'Frozen',
  'Frozen Yorkshire Pudding & Stuffing': 'Frozen',
  'Frozen Pastry & Desserts': 'Frozen',
  'Frozen Fruit': 'Frozen',
  'Frozen Bread, Bake At Home': 'Frozen',
  'Frozen Party Food': 'Frozen',
  'Frozen Breakfast Products': 'Frozen',
  'Finest Frozen': 'Frozen',
  'Christmas Frozen': 'Frozen',
  'Chocolate': 'Snacks & Treats',
  'Sharing Chocolate': 'Snacks & Treats',
  'Sweets': 'Snacks & Treats',
  'Mints & Chewing Gum': 'Snacks & Treats',
  'Crisps': 'Snacks & Treats',
  'Sharing Crisps': 'Snacks & Treats',
  'Snacks': 'Snacks & Treats',
  'Popcorn': 'Snacks & Treats',
  'Nuts, Seeds & Dried Fruit': 'Snacks & Treats',
  'Biscuits': 'Snacks & Treats',
  'Sharing Biscuits': 'Snacks & Treats',
  'Finest Treats & Snacks': 'Snacks & Treats',
  'Christmas Treats': 'Snacks & Treats',
  'Cereals': 'Cupboard',
  'Porridge & Overnight Oats': 'Cupboard',
  'Breakfast Drinks & Muesli': 'Cupboard',
  'Jams, Spreads, Honey & Syrups': 'Cupboard',
  'Biscuits & Cereal Bars': 'Cupboard',
  'Crackers & Crispbreads': 'Cupboard',
  'Rice': 'Cupboard',
  'Pasta': 'Cupboard',
  'Noodles': 'Cupboard',
  'Pasta & Stir Fry Sauces': 'Cupboard',
  'Indian & World Food Sauces': 'Cupboard',
  'Cooking Sauces & Meal Kits': 'Cupboard',
  'Stock Cubes, Gravy & Stuffing': 'Cupboard',
  'Tins, Cans & Packets': 'Cupboard',
  'Baked Beans': 'Cupboard',
  'Spaghetti & Pasta': 'Cupboard',
  'Tomatoes, Passata & Puree': 'Cupboard',
  'Tinned & Packet Soup': 'Cupboard',
  'Tinned Vegetables': 'Cupboard',
  'Tinned & Pot Fruit': 'Cupboard',
  'Tinned Meat, Pies & Spreads': 'Meat & Fish',
  'Tinned Fish & Seafood': 'Meat & Fish',
  'Pulses, Lentils & Beans': 'Cupboard',
  'Cooking Oil': 'Cupboard',
  'Vinegar': 'Cupboard',
  'Dressings, Marinades & Condiments': 'Cupboard',
  'Herbs, Spices & Seasonings': 'Cupboard',
  'Home Baking & Sugar': 'Cupboard',
  'Dried Fruit, Nuts, Nutrient Powders & Seeds': 'Cupboard',
  'Desserts & Jelly': 'Cupboard',
  'World Foods': 'Cupboard',
  'Free From': 'Cupboard',
  'Chocolate, Sweets, Mints & Chewing Gum': 'Cupboard',
  'Crisps, Snacks, Nuts & Popcorn': 'Cupboard',
  'Finest Food Cupboard': 'Cupboard',
  'Christmas Food Cupboard': 'Cupboard',
  'Fizzy Drinks': 'Drinks',
  'Coca-Cola': 'Drinks',
  'Pepsi': 'Drinks',
  'Water': 'Drinks',
  'Flavoured Water': 'Drinks',
  'Sports, Energy & Kids Drinks': 'Drinks',
  'Squash & Cordials': 'Drinks',
  'Tea': 'Drinks',
  'Coffee': 'Drinks',
  'Hot Chocolate & Malt Drinks': 'Drinks',
  'Beer & Cider': 'Drinks',
  'Wine': 'Drinks',
  'Spirits': 'Drinks',
  'Liqueurs & Aperitifs': 'Drinks',
  'Mixers': 'Drinks',
  'Finest Drinks': 'Drinks',
  'Christmas Drinks': 'Drinks',
  'Nappies': 'Baby & Toddler',
  'Baby Wipes': 'Baby & Toddler',
  'Baby Skincare': 'Baby & Toddler',
  'Baby Toiletries': 'Baby & Toddler',
  'Baby & Toddler Food': 'Baby & Toddler',
  'Baby Milk': 'Dairy & Eggs',
  'Baby Accessories': 'Baby & Toddler',
  'Medicines & Treatments': 'Health & Beauty',
  'Vitamins & Supplements': 'Health & Beauty',
  'Pain Relief': 'Health & Beauty',
  'First Aid': 'Health & Beauty',
  'Health Foods & Supplements': 'Health & Beauty',
  'Toiletries': 'Health & Beauty',
  'Hair Care': 'Health & Beauty',
  'Skincare': 'Health & Beauty',
  'Make Up': 'Health & Beauty',
  'Fragrances': 'Health & Beauty',
  'Dental': 'Health & Beauty',
  'Mens Grooming': 'Health & Beauty',
  'Feminine Hygiene': 'Health & Beauty',
  'Foot Care': 'Health & Beauty',
  'Sun Care': 'Health & Beauty',
  'Sexual Health': 'Health & Beauty',
  'Dog Food': 'Pet Food',
  'Cat Food': 'Pet Food',
  'Dog Treats': 'Pet Food',
  'Cat Treats': 'Pet Food',
  'Dog Accessories': 'Pet Food',
  'Cat Accessories': 'Pet Food',
  'Pet Care': 'Pet Food',
  'Laundry': 'Household',
  'Washing Powder & Liquid': 'Household',
  'Fabric Conditioner': 'Household',
  'Kitchen Roll': 'Household',
  'Toilet Roll': 'Household',
  'Facial Tissue & Hand Wipes': 'Household',
  'Cleaning': 'Household',
  'Kitchen Cleaners': 'Household',
  'Bathroom Cleaners & Toilet Care': 'Household',
  'Dishwashing': 'Household',
  'Dishwasher Tablets & Rinse Aid': 'Household',
  'Washing Up Liquid': 'Household',
  'Air Fresheners & Home Fragrance': 'Household',
  'Household Essentials': 'Household',
  'Bin Bags & Liners': 'Household',
  'Food & Freezer Bags': 'Household',
  'Foil, Baking & Cling Film': 'Household',
  'Food Storage': 'Household',
  'Lightbulbs': 'Household',
  'Batteries': 'Household',
  'Brushes, Mops & Buckets': 'Household',
  'Household Gloves': 'Household'
};

/**
 * Sainsbury's category mappings (subcategory level)
 */
const SAINSBURYS_CATEGORY_MAP = {
  'Fresh Fruit': 'Fruit & Vegetables',
  'Fresh Vegetables': 'Fruit & Vegetables',
  'Salad': 'Fruit & Vegetables',
  'Fresh Herbs': 'Fruit & Vegetables',
  'Prepared Fruit & Veg': 'Fruit & Vegetables',
  'Organic': 'Fruit & Vegetables',
  'Fresh Flowers & Plants': 'Fruit & Vegetables',
  'Chicken': 'Meat & Fish',
  'Beef & Lamb': 'Meat & Fish',
  'Pork': 'Meat & Fish',
  'Bacon, Sausages & Cooked Meats': 'Meat & Fish',
  'Turkey & Duck': 'Meat & Fish',
  'Fresh Fish': 'Meat & Fish',
  'Cooked Seafood': 'Meat & Fish',
  'Smoked Fish': 'Meat & Fish',
  'BBQ': 'Meat & Fish',
  'Milk': 'Dairy & Eggs',
  'Cheese': 'Dairy & Eggs',
  'Eggs': 'Dairy & Eggs',
  'Butter & Margarine': 'Dairy & Eggs',
  'Yogurt': 'Dairy & Eggs',
  'Cream': 'Dairy & Eggs',
  'Chilled Desserts': 'Dairy & Eggs',
  'Ready Meals': 'Dairy & Eggs',
  'Pizza': 'Dairy & Eggs',
  'Cooked Meats & Deli': 'Dairy & Eggs',
  'Pies & Quiche': 'Dairy & Eggs',
  'Sandwiches & Wraps': 'Dairy & Eggs',
  'Vegetarian & Vegan': 'Dairy & Eggs',
  'Dips & Pate': 'Dairy & Eggs',
  'Fresh Soup': 'Dairy & Eggs',
  'Fresh Pasta, Sauces & Noodles': 'Dairy & Eggs',
  'Olives, Antipasti & Mezze': 'Dairy & Eggs',
  'Chilled Juice & Smoothies': 'Dairy & Eggs',
  'Bread': 'Bakery',
  'Rolls & Thins': 'Bakery',
  'Bagels, Pittas & Wraps': 'Bakery',
  'Crumpets & Pancakes': 'Bakery',
  'Teacakes & Fruit Loaf': 'Bakery',
  'Pastries & Croissants': 'Bakery',
  'Cakes': 'Bakery',
  'Muffins, Flapjacks & Brownies': 'Bakery',
  'Cake Bars & Slices': 'Bakery',
  'Sweet Biscuits': 'Bakery',
  'Crackers & Savoury Biscuits': 'Bakery',
  'Free From Bakery': 'Bakery',
  'In-store Bakery': 'Bakery',
  'Ice Cream & Ice Lollies': 'Frozen',
  'Frozen Desserts': 'Frozen',
  'Frozen Pizza & Garlic Bread': 'Frozen',
  'Frozen Ready Meals': 'Frozen',
  'Frozen Potato Products': 'Frozen',
  'Frozen Vegetables': 'Frozen',
  'Frozen Fish & Seafood': 'Meat & Fish',
  'Frozen Chicken': 'Frozen',
  'Frozen Meat': 'Meat & Fish',
  'Frozen Sausages & Burgers': 'Frozen',
  'Frozen Vegetarian & Vegan': 'Frozen',
  'Frozen Pastry & Desserts': 'Frozen',
  'Frozen Yorkshire Puddings': 'Frozen',
  'Frozen Fruit': 'Frozen',
  'Frozen Bread & Baked Goods': 'Frozen',
  'Frozen Party Food': 'Frozen',
  'Tins, Cans & Packets': 'Cupboard',
  'Baked Beans & Spaghetti': 'Cupboard',
  'Tinned Tomatoes': 'Cupboard',
  'Tinned Vegetables': 'Cupboard',
  'Tinned Soup': 'Cupboard',
  'Tinned Fish': 'Meat & Fish',
  'Tinned Meat': 'Meat & Fish',
  'Tinned Fruit': 'Cupboard',
  'Pulses & Lentils': 'Cupboard',
  'Rice': 'Cupboard',
  'Pasta': 'Cupboard',
  'Noodles': 'Cupboard',
  'Pasta Sauces': 'Cupboard',
  'Cooking Sauces': 'Cupboard',
  'Curry Pastes & Sauces': 'Cupboard',
  'Stir Fry Sauces': 'Cupboard',
  'Stock Cubes & Gravy': 'Cupboard',
  'Oil & Vinegar': 'Cupboard',
  'Condiments & Dressings': 'Cupboard',
  'Pickles & Chutneys': 'Cupboard',
  'Herbs & Spices': 'Cupboard',
  'Salt & Pepper': 'Cupboard',
  'Breakfast Cereals': 'Cupboard',
  'Porridge & Oats': 'Cupboard',
  'Cereal Bars': 'Cupboard',
  'Jam, Honey & Spreads': 'Cupboard',
  'Home Baking': 'Cupboard',
  'Flour': 'Cupboard',
  'Sugar & Sweeteners': 'Cupboard',
  'Baking Ingredients': 'Cupboard',
  'Cake Decorations': 'Cupboard',
  'Dried Fruit & Nuts': 'Cupboard',
  'Desserts & Jelly': 'Cupboard',
  'Fizzy Drinks': 'Drinks',
  'Cola': 'Drinks',
  'Lemonade & Ginger': 'Drinks',
  'Flavoured Fizzy Drinks': 'Drinks',
  'Water': 'Drinks',
  'Flavoured Water': 'Drinks',
  'Juice': 'Drinks',
  'Squash & Cordials': 'Drinks',
  'Sports & Energy Drinks': 'Drinks',
  'Tea': 'Drinks',
  'Coffee': 'Drinks',
  'Hot Chocolate': 'Drinks',
  'Beer & Cider': 'Drinks',
  'Lager': 'Drinks',
  'Ale & Bitter': 'Drinks',
  'Stout & Craft Beer': 'Drinks',
  'Cider': 'Drinks',
  'Wine': 'Drinks',
  'Red Wine': 'Drinks',
  'White Wine': 'Drinks',
  'Rosé Wine': 'Drinks',
  'Sparkling Wine & Champagne': 'Drinks',
  'Spirits': 'Drinks',
  'Vodka': 'Drinks',
  'Gin': 'Drinks',
  'Whisky': 'Drinks',
  'Rum': 'Drinks',
  'Liqueurs': 'Drinks',
  'Mixers & Soft Drinks': 'Drinks',
  'Chocolate': 'Snacks & Treats',
  'Chocolate Bars': 'Snacks & Treats',
  'Chocolate Boxes & Bags': 'Snacks & Treats',
  'Sweets': 'Snacks & Treats',
  'Mints & Chewing Gum': 'Snacks & Treats',
  'Crisps': 'Snacks & Treats',
  'Sharing Crisps': 'Snacks & Treats',
  'Snacks': 'Snacks & Treats',
  'Popcorn': 'Snacks & Treats',
  'Nuts & Seeds': 'Snacks & Treats',
  'Laundry': 'Household',
  'Washing Powder & Liquid': 'Household',
  'Washing Capsules & Tablets': 'Household',
  'Fabric Conditioner': 'Household',
  'Toilet Roll, Kitchen Roll & Tissues': 'Household',
  'Toilet Roll': 'Household',
  'Kitchen Roll': 'Household',
  'Tissues': 'Household',
  'Cleaning Products': 'Household',
  'Dishwasher & Washing Up': 'Household',
  'Dishwasher Tablets': 'Household',
  'Washing Up Liquid': 'Household',
  'Foil, Food Bags & Storage': 'Household',
  'Bin Bags': 'Household',
  'Food Bags & Cling Film': 'Household',
  'Foil & Baking Paper': 'Household',
  'Air Fresheners': 'Household',
  'Household Essentials': 'Household',
  'Batteries & Lightbulbs': 'Household',
  'Skincare': 'Health & Beauty',
  'Face Care': 'Health & Beauty',
  'Body Care': 'Health & Beauty',
  'Hand Care': 'Health & Beauty',
  'Make-up': 'Health & Beauty',
  'Nails': 'Health & Beauty',
  'Hair Care': 'Health & Beauty',
  'Fragrance': 'Health & Beauty',
  'Sun Care': 'Health & Beauty',
  'Toiletries': 'Health & Beauty',
  'Shower Gel & Bath': 'Health & Beauty',
  'Soap & Hand Wash': 'Health & Beauty',
  'Deodorants': 'Health & Beauty',
  'Dental Care': 'Health & Beauty',
  'Toothpaste': 'Health & Beauty',
  'Toothbrushes': 'Health & Beauty',
  'Shaving': 'Health & Beauty',
  'Feminine Hygiene': 'Health & Beauty',
  'Health & Wellness': 'Health & Beauty',
  'Vitamins & Supplements': 'Health & Beauty',
  'Pain Relief': 'Health & Beauty',
  'First Aid': 'Health & Beauty',
  'Foot Care': 'Health & Beauty',
  'Nappies': 'Baby & Toddler',
  'Baby Wipes': 'Baby & Toddler',
  'Baby Toiletries': 'Baby & Toddler',
  'Baby Food': 'Baby & Toddler',
  'Baby Milk & Drinks': 'Dairy & Eggs',
  'Baby Accessories': 'Baby & Toddler',
  'Dog Food': 'Pet Food',
  'Cat Food': 'Pet Food',
  'Dog Treats': 'Pet Food',
  'Cat Treats': 'Pet Food',
  'Dog Accessories': 'Pet Food',
  'Cat Accessories': 'Pet Food',
  'Pet Health & Hygiene': 'Pet Food',
  'Free From': 'Cupboard',
  'Gluten Free': 'Cupboard',
  'Dairy Free': 'Cupboard',
  'Vegan': 'Cupboard',
  'World Foods': 'Cupboard',
  'Indian': 'Cupboard',
  'Chinese': 'Cupboard',
  'Thai': 'Cupboard',
  'Mexican': 'Cupboard',
  'Italian': 'Cupboard'
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
