/**
 * Test the improved normalization logic
 */

const { normalizeProductName } = require('./normalizeProducts.js');

console.log('\n' + '='.repeat(60));
console.log('TESTING IMPROVED NORMALIZATION');
console.log('='.repeat(60) + '\n');

// Test cases from the user's examples
const testCases = [
  'ASDA 5 Smooth & Sweet Peaches',
  'ASDA 4 Juicy & Sweet Nectarines',
  'ASDA Sweet & Plump Raspberries 150g',
  'ASDA Sweet & Refreshing Honeydew Melon',
  'ASDA Tangy & Juicy Sweetclems 600g',
  'ASDA Ripe & Sweet Strawberries',
  'ASDA Sweet & Bursting Blueberries 300g',
  'ASDA Juicy & Sweet Mango Fingers 140g',
  'ASDA Crunchy & Sweet Carrots 500g',
  'ASDA 3 Crunchy & Fragrant Brown Onions',
  'ASDA Fluffy & Golden Large Baking Potatoes 4 Pack',
  'ASDA Creamy & Flavoursome Sweet Potatoes 1kg',
  'ASDA Crisp & Nutty Sugarsnap Peas 160g',
  'ASDA 4 Sweet & Juicy Sweetcorn Cobettes',
  'ASDA Mild & Delicate Courgettes 330g',
  'ASDA Savoury & Mild Vegetable Soup Mix 500g',
  'ASDA 6 Sweet & Creamy Bananas',
  'ASDA 7 Brilliant Bananas'
];

testCases.forEach(test => {
  const { normalizedName } = normalizeProductName(test);
  console.log(`Original:    ${test}`);
  console.log(`Normalized:  ${normalizedName}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('VALIDATION CHECKS');
console.log('='.repeat(60) + '\n');

// Check that none contain orphaned "and"
const hasOrphanedAnd = testCases.some(test => {
  const { normalizedName } = normalizeProductName(test);
  // Check for patterns like "5 and peaches" or "peaches and"
  return /\d\s+and\s+\w/.test(normalizedName) ||
         /\s+and\s*$/.test(normalizedName) ||
         /^\s*and\s+/.test(normalizedName);
});

if (hasOrphanedAnd) {
  console.log('❌ FAIL: Found products with orphaned "and"');
} else {
  console.log('✓ PASS: No orphaned "and" found');
}

// Check that descriptive words are removed
const descriptiveWords = ['juicy', 'sweet', 'smooth', 'refreshing', 'plump',
                          'crunchy', 'tangy', 'ripe', 'bursting', 'crisp',
                          'nutty', 'fluffy', 'golden', 'creamy', 'mild',
                          'delicate', 'savoury', 'fragrant', 'brilliant'];

const hasDescriptiveWords = testCases.some(test => {
  const { normalizedName } = normalizeProductName(test);
  return descriptiveWords.some(word => normalizedName.includes(word));
});

if (hasDescriptiveWords) {
  console.log('❌ FAIL: Found descriptive words in normalized names');
} else {
  console.log('✓ PASS: All descriptive words removed');
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));
