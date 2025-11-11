require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Add size specifications to popular items for fair price comparisons
 */
async function addSizeSpecifications() {
  console.log('📏 Adding size specifications to popular items...\n');

  const sizeSpecs = [
    {
      name: 'cheddar_cheese',
      size_filter: '400g',
      size_min: 390,
      size_max: 410,
      reason: 'Standard 400g block for fair comparison'
    },
    {
      name: 'beef_mince',
      size_filter: '500g',
      size_min: 490,
      size_max: 510,
      reason: 'Standard 500g pack for fair comparison'
    },
    {
      name: 'baked_beans',
      size_filter: '400g-415g',
      size_min: 400,
      size_max: 415,
      reason: 'Full sized tin (not reduced sugar/snack size)'
    }
  ];

  for (const spec of sizeSpecs) {
    console.log(`Updating: ${spec.name}`);
    console.log(`  Size filter: ${spec.size_filter} (${spec.size_min}g - ${spec.size_max}g)`);
    console.log(`  Reason: ${spec.reason}`);

    const { data, error } = await supabase
      .from('popular_items')
      .update({
        size_filter: spec.size_filter,
        size_min: spec.size_min,
        size_max: spec.size_max
      })
      .eq('name', spec.name)
      .select();

    if (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    } else if (!data || data.length === 0) {
      console.log(`  ⚠️  Item not found\n`);
    } else {
      console.log(`  ✅ Updated successfully\n`);
    }
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✨ Size specifications added!');
  console.log('Run refresh-popular-items.js to apply filters');
  console.log('═══════════════════════════════════════════════\n');
}

addSizeSpecifications().catch(console.error);
