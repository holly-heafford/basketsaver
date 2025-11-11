require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixPopularItemNames() {
  console.log('🔧 Fixing popular item search terms...\n');

  const updates = [
    {
      oldName: 'milk_4pint_semi_skimmed',
      newName: 'semi_skimmed_milk',
      displayName: '4 Pints Semi Skimmed Milk',
      reason: 'Products use "semi skimmed milk" format'
    },
    {
      oldName: 'eggs_6_pack',
      newName: 'eggs',
      displayName: 'Eggs 6 Pack',
      reason: 'Products just use "eggs" - size variations exist'
    },
    {
      oldName: 'mince_beef',
      newName: 'beef_mince',
      displayName: 'Mince Beef',
      reason: 'Products use "beef mince" format (not "mince beef")'
    }
  ];

  for (const update of updates) {
    console.log(`Updating: ${update.oldName} → ${update.newName}`);
    console.log(`  Reason: ${update.reason}`);

    const { data, error } = await supabase
      .from('popular_items')
      .update({
        name: update.newName,
        display_name: update.displayName
      })
      .eq('name', update.oldName)
      .select();

    if (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    } else if (!data || data.length === 0) {
      console.log(`  ⚠️  Item not found\n`);
    } else {
      console.log(`  ✅ Updated successfully\n`);
    }
  }

  console.log('✨ Done! Run refresh-popular-items.js to populate products.\n');
}

fixPopularItemNames().catch(console.error);
