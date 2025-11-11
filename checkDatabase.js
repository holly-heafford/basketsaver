require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function checkDatabase() {
    try {
        // Get all supermarkets
        const { data: supermarkets, error: smError } = await supabase
            .from('supermarkets')
            .select('*')
            .order('name');

        if (smError) throw smError;

        console.log('\n=== SUPERMARKETS IN DATABASE ===\n');

        for (const sm of supermarkets) {
            // Count products for this supermarket
            const { count, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('supermarket_id', sm.id);

            if (countError) {
                console.error(`Error counting products for ${sm.name}:`, countError);
            } else {
                console.log(`${sm.name} (ID: ${sm.id}): ${count} products`);
            }
        }

        // Get total product count
        const { count: totalCount, error: totalError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        console.log(`\nTOTAL PRODUCTS: ${totalCount}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkDatabase();
