require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupEggsProducts() {
  console.log('🧹 Cleaning up incorrect eggs products...\n');

  // Get the eggs popular item
  const { data: eggsItem } = await supabase
    .from('popular_items')
    .select('id')
    .eq('name', 'eggs')
    .single();

  if (!eggsItem) {
    console.log('No eggs item found');
    return;
  }

  // Delete all current associations for eggs
  const { error: deleteError } = await supabase
    .from('popular_item_products')
    .delete()
    .eq('popular_item_id', eggsItem.id);

  if (deleteError) {
    console.error('❌ Error deleting:', deleteError.message);
    return;
  }

  console.log('✅ Cleared all eggs associations');
  console.log('Run refresh-popular-items.js to repopulate with correct products\n');
}

cleanupEggsProducts().catch(console.error);
