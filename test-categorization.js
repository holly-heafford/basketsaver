// Test categorization logic

function categorizeItem(itemName) {
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
    if (nameLower.includes('eggs')) {
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
    const meatIndicators = ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'fish', 'salmon', 'lamb', 'turkey', 'ham', 'meat'];
    if (meatIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Meat & Fish', emoji: '🍗' };
    }

    // Priority 6: Check for frozen
    if (nameLower.includes('frozen') || nameLower.includes('ice cream') || nameLower.includes('pizza')) {
        return { category: 'Frozen', emoji: '🧊' };
    }

    // Priority 7: Check for cupboard items
    const cupboardIndicators = ['pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'sauce', 'beans', 'tin', 'jar', 'cereal', 'oats', 'porridge'];
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
    const petIndicators = ['dog', 'cat', 'pet'];
    if (petIndicators.some(indicator => nameLower.includes(indicator))) {
        return { category: 'Pet Food', emoji: '🐾' };
    }

    return { category: 'Other', emoji: '🛒' };
}

console.log('=== Testing Smart Categorization ===\n');

const testCases = [
    // Should be Snacks & Treats (not Dairy)
    { name: 'cadbury dairy milk buttons chocolate dessert 75g', expected: 'Snacks & Treats' },
    { name: 'starburst fruit chews strawberry sharing bag 138g', expected: 'Snacks & Treats' },
    { name: 'galaxy smooth milk chocolate bar 110g', expected: 'Snacks & Treats' },

    // Should be Dairy & Eggs
    { name: 'semi skimmed milk 2l', expected: 'Dairy & Eggs' },
    { name: 'cheddar cheese 400g', expected: 'Dairy & Eggs' },
    { name: 'double cream 300ml', expected: 'Dairy & Eggs' },
    { name: 'unsalted butter 250g', expected: 'Dairy & Eggs' },

    // Should be Snacks (not Dairy even though "cream" appears)
    { name: 'ice cream tub vanilla 500ml', expected: 'Frozen' },

    // Should be Snacks (peanut butter is not dairy butter)
    { name: 'peanut butter smooth 340g', expected: 'Snacks & Treats' },

    // Should be Fruit & Vegetables
    { name: 'red apples 6 pack', expected: 'Fruit & Vegetables' },
    { name: 'fresh tomatoes 500g', expected: 'Fruit & Vegetables' },

    // Should be Cupboard
    { name: 'heinz baked beans 415g', expected: 'Cupboard' },
    { name: 'pasta penne 500g', expected: 'Cupboard' },
];

testCases.forEach(test => {
    const result = categorizeItem(test.name);
    const passed = result.category === test.expected;
    const symbol = passed ? '✅' : '❌';

    console.log(`${symbol} "${test.name}"`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result.category} ${result.emoji}`);
    if (!passed) {
        console.log(`   ⚠️  MISMATCH!`);
    }
    console.log('');
});
