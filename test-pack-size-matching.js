// Test pack size matching logic

function extractPackSize(productName) {
    const name = productName.toLowerCase();

    // Pattern 1: "4x415g", "24x330ml" format
    const multipackPattern = /(\d+)x(\d+)(ml|g|l|kg)/;
    const multipackMatch = name.match(multipackPattern);
    if (multipackMatch) {
        return {
            quantity: parseInt(multipackMatch[1]),
            unit: multipackMatch[2] + multipackMatch[3]
        };
    }

    // Pattern 2: "6 pack", "4 pack" format
    const packPattern = /(\d+)\s*pack/;
    const packMatch = name.match(packPattern);
    if (packMatch) {
        return {
            quantity: parseInt(packMatch[1]),
            unit: 'pack'
        };
    }

    // No pack size found - likely a single item
    return null;
}

function testPackSizeMatching() {
    console.log('=== Testing Pack Size Extraction ===\n');

    const testCases = [
        'heinz baked beans 415g',
        'heinz baked beans in tomato sauce 4x415g',
        'coca cola 24x330ml',
        'coca cola taste 24x330ml',
        'billingtons demerara sugar 1kg',
        'milk 2l',
        '6 pack crisps',
        'beer 4 pack'
    ];

    testCases.forEach(name => {
        const packSize = extractPackSize(name);
        console.log(`"${name}"`);
        if (packSize) {
            console.log(`  Pack: ${packSize.quantity}x${packSize.unit}`);
        } else {
            console.log(`  Pack: Single item (no pack size)`);
        }
        console.log('');
    });

    console.log('\n=== Testing Matching Logic ===\n');

    // Test case 1: Single vs 4-pack should NOT match
    const search1 = 'heinz baked beans 415g';
    const products1 = [
        { name: 'Heinz Baked Beans 415g', normalized: 'heinz baked beans 415g' },
        { name: 'Heinz Baked Beans In Tomato Sauce 4X415g', normalized: 'heinz baked beans in tomato sauce 4x415g' }
    ];

    console.log(`Search: "${search1}"`);
    const searchPackSize1 = extractPackSize(search1);
    const searchTokens1 = search1.split(/\s+/).filter(t => t.length > 0);

    products1.forEach(product => {
        const normalizedLower = product.normalized.toLowerCase();

        // Check if all tokens present
        const allTokensPresent = searchTokens1.every(token =>
            normalizedLower.includes(token)
        );

        if (!allTokensPresent) {
            console.log(`  ❌ ${product.name}: Tokens don't match`);
            return;
        }

        // Check pack size
        const productPackSize = extractPackSize(normalizedLower);

        let shouldMatch = false;
        if (searchPackSize1 && productPackSize) {
            // Both have pack sizes - they must match
            shouldMatch = searchPackSize1.quantity === productPackSize.quantity &&
                         searchPackSize1.unit === productPackSize.unit;
        } else if (!searchPackSize1 && productPackSize) {
            // Search is for single item, product is a multipack - don't match
            shouldMatch = false;
        } else {
            // Either both are singles or search doesn't specify pack - allow match
            shouldMatch = true;
        }

        if (shouldMatch) {
            console.log(`  ✅ ${product.name}: MATCHED`);
        } else {
            console.log(`  ❌ ${product.name}: Pack size mismatch (search: ${searchPackSize1 ? searchPackSize1.quantity + 'x' + searchPackSize1.unit : 'single'}, product: ${productPackSize ? productPackSize.quantity + 'x' + productPackSize.unit : 'single'})`);
        }
    });

    console.log('\n');

    // Test case 2: 24-pack should match 24-pack with extra words
    const search2 = 'coca cola 24x330ml';
    const products2 = [
        { name: 'Coca Cola 24x330ml', normalized: 'coca cola 24x330ml' },
        { name: 'Coca Cola Original Taste 24x330ml', normalized: 'coca cola taste 24x330ml' }
    ];

    console.log(`Search: "${search2}"`);
    const searchPackSize2 = extractPackSize(search2);
    const searchTokens2 = search2.split(/\s+/).filter(t => t.length > 0);

    products2.forEach(product => {
        const normalizedLower = product.normalized.toLowerCase();

        const allTokensPresent = searchTokens2.every(token =>
            normalizedLower.includes(token)
        );

        if (!allTokensPresent) {
            console.log(`  ❌ ${product.name}: Tokens don't match`);
            return;
        }

        const productPackSize = extractPackSize(normalizedLower);

        let shouldMatch = false;
        if (searchPackSize2 && productPackSize) {
            shouldMatch = searchPackSize2.quantity === productPackSize.quantity &&
                         searchPackSize2.unit === productPackSize.unit;
        } else if (!searchPackSize2 && productPackSize) {
            shouldMatch = false;
        } else {
            shouldMatch = true;
        }

        if (shouldMatch) {
            console.log(`  ✅ ${product.name}: MATCHED`);
        } else {
            console.log(`  ❌ ${product.name}: Pack size mismatch`);
        }
    });
}

testPackSizeMatching();
