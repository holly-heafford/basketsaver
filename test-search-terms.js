require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testSearchTerms() {
  const searchTerms = [
    { name: 'milk 4pint semi skimmed', alternatives: ['milk', 'semi skimmed', '4 pint'] },
    { name: 'eggs 6 pack', alternatives: ['eggs', '6 pack', 'half dozen'] },
    { name: 'mince beef', alternatives: ['beef mince', 'mince', 'minced beef'] },
    { name: 'baked beans', alternatives: ['beans'] }
  ];

  for (const term of searchTerms) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: "${term.name}"`);
    console.log(`${'='.repeat(60)}`);

    // Test main term
    const { data: mainResults } = await supabase
      .from('products')
      .select('id, name, normalized_name, current_price')
      .ilike('normalized_name', `%${term.name}%`)
      .eq('is_available', true)
      .not('current_price', 'is', null)
      .limit(5);

    console.log(`\nMain term "${term.name}": ${mainResults?.length || 0} results`);
    if (mainResults && mainResults.length > 0) {
      mainResults.forEach(p => console.log(`  - ${p.name.substring(0, 70)}`));
    }

    // Test alternatives
    for (const alt of term.alternatives) {
      const { data: altResults } = await supabase
        .from('products')
        .select('id, name, normalized_name, current_price')
        .ilike('normalized_name', `%${alt}%`)
        .eq('is_available', true)
        .not('current_price', 'is', null)
        .limit(3);

      console.log(`\nAlternative "${alt}": ${altResults?.length || 0} results`);
      if (altResults && altResults.length > 0) {
        altResults.slice(0, 2).forEach(p => console.log(`  - ${p.name.substring(0, 70)}`));
      }
    }
  }
}

testSearchTerms().catch(console.error);
