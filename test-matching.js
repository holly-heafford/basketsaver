// Test the new matching logic

function testMatching() {
    const products = [
        { name: 'Asda', normalized_name: 'coca cola taste 24x330ml' },
        { name: 'Tesco', normalized_name: 'coca cola 24x330ml pack' },
        { name: 'Zero', normalized_name: 'coca cola zero sugar 24x330ml' }
    ];

    const searchTerm = 'coca cola 24x330ml';
    const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 0);

    console.log(`Search term: "${searchTerm}"`);
    console.log(`Tokens: [${searchTokens.join(', ')}]\n`);

    const matchingProducts = products.filter(p => {
        if (!p.normalized_name) return false;

        const normalizedLower = p.normalized_name.toLowerCase();

        // Method 1: Exact substring match
        if (normalizedLower.includes(searchTerm) || searchTerm.includes(normalizedLower)) {
            console.log(`✅ ${p.name}: MATCHED via substring`);
            return true;
        }

        // Method 2: Token-based matching
        const allTokensPresent = searchTokens.every(token =>
            normalizedLower.includes(token)
        );

        if (allTokensPresent) {
            console.log(`✅ ${p.name}: MATCHED via tokens (all present)`);
            return true;
        }

        console.log(`❌ ${p.name}: NO MATCH`);
        return false;
    });

    console.log(`\nTotal matches: ${matchingProducts.length}`);
}

testMatching();
