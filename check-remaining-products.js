require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkRemaining() {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('category_id', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total products without category_id: ${count}`);
}

checkRemaining();
