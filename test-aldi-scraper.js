require('dotenv').config();
const { scrapeSearchTermToSupabase } = require('./scrapeToSupabase.js');

async function testAldiScraper() {
  console.log('Testing fixed Aldi scraper...\n');

  try {
    await scrapeSearchTermToSupabase('aldi', 'milk', 10);
    console.log('\n✓ Test completed successfully!');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
  }
}

testAldiScraper();
