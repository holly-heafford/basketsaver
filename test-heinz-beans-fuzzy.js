// Test fuzzy matching for Heinz beans

function extractPackSize(productName) {
    const name = productName.toLowerCase();
    const multipackPattern = /(\d+)x(\d+)(ml|g|l|kg)/;
    const multipackMatch = name.match(multipackPattern);
    if (multipackMatch) {
        return {
            quantity: parseInt(multipackMatch[1]),
            unit: multipackMatch[2] + multipackMatch[3]
        };
    }
    const packPattern = /(\d+)\s*pack/;
    const packMatch = name.match(packPattern);
    if (packMatch) {
        return {
            quantity: parseInt(packMatch[1]),
            unit: 'pack'
        };
    }
    return null;
}

function normalizeForMatching(text) {
    return text.toLowerCase()
        .replace(/beanz/g, 'beans')
        .replace(/lite/g, 'light')
        .replace(/flavour/g, 'flavor');
}

function testHeinzBeansMatching() {
    console.log('=== Testing Fuzzy Matching for Heinz Beans ===\n');

    const searchTerm = 'heinz baked beans 415g';
    const products = [
        { name: 'Heinz Baked Beans 415g', normalized: 'heinz baked beans 415g', supermarket: 'Asda' },
        { name: 'Heinz Beanz In Tomato Sauce 415G', normalized: 'heinz beanz in tomato sauce 415g', supermarket: 'Tesco' },
        { name: 'Heinz Baked Beans 4 x 415g', normalized: 'heinz baked beans 4x415g', supermarket: 'Asda' },
        { name: 'Heinz Baked Beans In Tomato Sauce 4X415g', normalized: 'heinz baked beans in tomato sauce 4x415g', supermarket: 'Tesco' }
    ];

    console.log(`Search term: "${searchTerm}"\n`);

    const searchPackSize = extractPackSize(searchTerm);
    const normalizedSearch = normalizeForMatching(searchTerm);
    const normalizedSearchTokens = normalizedSearch.split(/\s+/).filter(t => t.length > 0);

    console.log(`Normalized search: "${normalizedSearch}"`);
    console.log(`Search tokens: [${normalizedSearchTokens.join(', ')}]`);
    console.log(`Search pack size: ${searchPackSize ? searchPackSize.quantity + 'x' + searchPackSize.unit : 'single'}\n`);

    // Filter out optional words
    const optionalWords = ['baked', 'in', 'with', 'original', 'classic', 'fresh'];
    const requiredSearchTokens = normalizedSearchTokens.filter(token =>
        !optionalWords.includes(token) && token.length > 2
    );

    console.log(`Required tokens (after filtering optional words): [${requiredSearchTokens.join(', ')}]\n`);

    products.forEach(product => {
        console.log(`\n--- ${product.name} (${product.supermarket}) ---`);

        const normalizedLower = product.normalized.toLowerCase();
        const normalizedProduct = normalizeForMatching(normalizedLower);

        console.log(`  Normalized product: "${normalizedProduct}"`);

        // Check core tokens
        const coreTokensPresent = requiredSearchTokens.every(token =>
            normalizedProduct.includes(token)
        );

        if (!coreTokensPresent) {
            console.log(`  ❌ REJECTED: Core tokens not present`);
            return;
        }

        console.log(`  ✓ Core tokens present`);

        // Check pack size
        const productPackSize = extractPackSize(normalizedLower);
        console.log(`  Product pack size: ${productPackSize ? productPackSize.quantity + 'x' + productPackSize.unit : 'single'}`);

        let shouldMatch = false;
        if (searchPackSize && productPackSize) {
            shouldMatch = searchPackSize.quantity === productPackSize.quantity &&
                         searchPackSize.unit === productPackSize.unit;
            if (!shouldMatch) {
                console.log(`  ❌ REJECTED: Pack size mismatch`);
            }
        } else if (!searchPackSize && productPackSize) {
            shouldMatch = false;
            console.log(`  ❌ REJECTED: Search is single, product is multipack`);
        } else {
            shouldMatch = true;
        }

        if (shouldMatch) {
            console.log(`  ✅ MATCHED`);
        }
    });
}

testHeinzBeansMatching();
