// Shopping list array
let shoppingList = [];

// Get all available items from price database
function getAvailableItems() {
    const items = new Set();
    for (const supermarket of Object.values(priceDatabase)) {
        Object.keys(supermarket).forEach(item => items.add(item));
    }
    return Array.from(items).sort();
}

// Price database for different supermarkets
// Note: These are example prices. You should update with actual current prices.
const priceDatabase = {
    'Tesco': {
        // Dairy & Eggs
        'milk': 1.55,
        'semi-skimmed milk': 1.55,
        'whole milk': 1.58,
        'skimmed milk': 1.52,
        'eggs': 2.50,
        'free range eggs': 3.20,
        'butter': 2.00,
        'lurpak butter': 2.80,
        'spreadable butter': 2.20,
        'cheese': 3.00,
        'cheddar cheese': 3.20,
        'cathedral city cheese': 3.80,
        'cream cheese': 1.80,
        'philadelphia cream cheese': 2.40,
        'yogurt': 3.00,
        'greek yogurt': 3.50,
        'activia yogurt': 3.20,
        'milk chocolate': 1.20,
        'cadbury dairy milk': 1.50,
        'galaxy chocolate': 1.50,
        'lindt chocolate': 2.50,

        // Bakery
        'bread': 1.20,
        'warburtons bread': 1.40,
        'hovis bread': 1.35,
        'white bread': 1.15,
        'wholemeal bread': 1.25,
        'seeded bread': 1.50,
        'bagels': 1.60,
        'crumpets': 1.20,

        // Meat & Fish
        'chicken': 3.50,
        'chicken breast': 4.20,
        'chicken thighs': 3.00,
        'bacon': 2.80,
        'sausages': 2.50,
        'richmond sausages': 2.80,
        'mince beef': 3.80,
        'steak': 6.50,
        'pork chops': 3.20,
        'salmon': 5.50,
        'cod': 4.80,
        'tuna': 4.20,

        // Pasta, Rice & Grains
        'pasta': 0.90,
        'spaghetti': 0.95,
        'penne': 0.95,
        'fusilli': 0.95,
        'rice': 1.50,
        'basmati rice': 2.20,
        'long grain rice': 1.80,
        'couscous': 1.40,

        // Vegetables
        'tomatoes': 0.80,
        'cherry tomatoes': 1.20,
        'potatoes': 1.20,
        'sweet potatoes': 1.60,
        'carrots': 0.70,
        'onions': 0.90,
        'red onions': 1.10,
        'broccoli': 1.50,
        'cucumber': 0.80,
        'peppers': 1.80,
        'mushrooms': 1.50,
        'lettuce': 0.90,
        'spinach': 1.40,
        'courgette': 1.20,
        'aubergine': 1.50,
        'garlic': 0.60,

        // Fruit
        'apples': 2.00,
        'bananas': 1.10,
        'oranges': 1.80,
        'grapes': 2.50,
        'strawberries': 2.80,
        'blueberries': 2.50,
        'raspberries': 2.80,
        'pears': 1.90,
        'lemons': 1.20,
        'limes': 1.20,
        'mango': 1.50,
        'pineapple': 1.80,

        // Canned & Jarred
        'beans': 0.60,
        'heinz beans': 0.90,
        'baked beans': 0.60,
        'chickpeas': 0.70,
        'chopped tomatoes': 0.55,
        'tomato puree': 0.80,
        'pasta sauce': 1.20,
        'dolmio pasta sauce': 1.80,
        'pesto': 1.60,
        'mayonnaise': 1.80,
        'hellmans mayo': 2.50,
        'ketchup': 1.50,
        'heinz ketchup': 2.20,

        // Breakfast
        'cereal': 2.50,
        'cornflakes': 2.20,
        'weetabix': 2.80,
        'cheerios': 2.90,
        'porridge oats': 1.80,
        'muesli': 2.40,
        'jam': 1.40,
        'peanut butter': 2.20,
        'nutella': 3.50,
        'honey': 2.80,

        // Drinks
        'orange juice': 2.00,
        'tropicana orange juice': 3.20,
        'apple juice': 1.80,
        'cola': 1.80,
        'coca cola': 2.50,
        'pepsi': 2.40,
        'sparkling water': 1.20,
        'coffee': 4.50,
        'nescafe coffee': 5.50,
        'tea': 2.50,
        'pg tips tea': 3.20,
        'yorkshire tea': 3.40,

        // Snacks
        'crisps': 1.50,
        'walkers crisps': 1.80,
        'pringles': 2.50,
        'biscuits': 1.40,
        'mcvities digestives': 1.80,
        'hobnobs': 1.90,
        'chocolate bar': 0.80,
        'mars bar': 0.85,
        'snickers': 0.85,
        'twix': 0.85,
        'kit kat': 0.85,
        'nuts': 2.50,
        'popcorn': 1.20,

        // Frozen
        'frozen peas': 1.20,
        'frozen pizza': 2.50,
        'ice cream': 3.00,
        'ben and jerrys': 5.00,
        'fish fingers': 2.80,
        'birds eye fish fingers': 3.50,
        'chips': 1.50,
        'frozen chips': 1.50,

        // Household & Cleaning
        'toilet paper': 4.50,
        'kitchen roll': 3.50,
        'washing up liquid': 1.50,
        'fairy liquid': 2.20,
        'washing powder': 5.50,
        'persil washing powder': 7.50,
        'fabric softener': 2.80,
        'comfort fabric softener': 3.50,
        'bin bags': 2.50,
        'kitchen cleaner': 1.80,
        'bleach': 1.20,
        'toilet cleaner': 1.80,

        // Bakery & Cooking
        'sugar': 1.20,
        'brown sugar': 1.40,
        'flour': 1.00,
        'self raising flour': 1.10,
        'plain flour': 1.00,
        'oil': 3.00,
        'olive oil': 4.50,
        'vegetable oil': 2.80,
        'salt': 0.60,
        'pepper': 1.50,
        'herbs': 1.20,
        'stock cubes': 1.40,
        'gravy granules': 1.80,

        // Personal Care
        'toothpaste': 2.50,
        'colgate toothpaste': 3.20,
        'shampoo': 2.80,
        'head and shoulders': 4.50,
        'conditioner': 2.80,
        'shower gel': 2.50,
        'soap': 1.20,
        'deodorant': 2.50,
        'tissues': 1.50,
        'kleenex tissues': 2.20
    },
    'Sainsburys': {
        'milk': 1.50, 'semi-skimmed milk': 1.50, 'whole milk': 1.53, 'skimmed milk': 1.47,
        'eggs': 2.60, 'free range eggs': 3.30, 'butter': 2.10, 'lurpak butter': 2.90,
        'spreadable butter': 2.30, 'cheese': 3.20, 'cheddar cheese': 3.30, 'cathedral city cheese': 3.90,
        'cream cheese': 1.85, 'philadelphia cream cheese': 2.50, 'yogurt': 3.20, 'greek yogurt': 3.60,
        'activia yogurt': 3.30, 'milk chocolate': 1.25, 'cadbury dairy milk': 1.55, 'galaxy chocolate': 1.55,
        'lindt chocolate': 2.60, 'bread': 1.25, 'warburtons bread': 1.45, 'hovis bread': 1.40,
        'white bread': 1.20, 'wholemeal bread': 1.30, 'seeded bread': 1.55, 'bagels': 1.65,
        'crumpets': 1.25, 'chicken': 3.75, 'chicken breast': 4.35, 'chicken thighs': 3.15,
        'bacon': 2.90, 'sausages': 2.60, 'richmond sausages': 2.90, 'mince beef': 3.95,
        'steak': 6.75, 'pork chops': 3.30, 'salmon': 5.65, 'cod': 4.95, 'tuna': 4.35,
        'pasta': 0.95, 'spaghetti': 1.00, 'penne': 1.00, 'fusilli': 1.00, 'rice': 1.60,
        'basmati rice': 2.30, 'long grain rice': 1.90, 'couscous': 1.45, 'tomatoes': 0.85,
        'cherry tomatoes': 1.25, 'potatoes': 1.15, 'sweet potatoes': 1.65, 'carrots': 0.75,
        'onions': 0.85, 'red onions': 1.15, 'broccoli': 1.40, 'cucumber': 0.75, 'peppers': 1.85,
        'mushrooms': 1.55, 'lettuce': 0.95, 'spinach': 1.45, 'courgette': 1.25, 'aubergine': 1.55,
        'garlic': 0.65, 'apples': 2.10, 'bananas': 1.00, 'oranges': 1.85, 'grapes': 2.60,
        'strawberries': 2.90, 'blueberries': 2.60, 'raspberries': 2.90, 'pears': 1.95, 'lemons': 1.25,
        'limes': 1.25, 'mango': 1.55, 'pineapple': 1.85, 'beans': 0.65, 'heinz beans': 0.95,
        'baked beans': 0.65, 'chickpeas': 0.75, 'chopped tomatoes': 0.60, 'tomato puree': 0.85,
        'pasta sauce': 1.25, 'dolmio pasta sauce': 1.85, 'pesto': 1.65, 'mayonnaise': 1.85,
        'hellmans mayo': 2.60, 'ketchup': 1.55, 'heinz ketchup': 2.25, 'cereal': 2.60,
        'cornflakes': 2.30, 'weetabix': 2.90, 'cheerios': 3.00, 'porridge oats': 1.85, 'muesli': 2.50,
        'jam': 1.45, 'peanut butter': 2.30, 'nutella': 3.60, 'honey': 2.90, 'orange juice': 2.10,
        'tropicana orange juice': 3.30, 'apple juice': 1.85, 'cola': 1.85, 'coca cola': 2.60,
        'pepsi': 2.50, 'sparkling water': 1.25, 'coffee': 4.75, 'nescafe coffee': 5.65, 'tea': 2.60,
        'pg tips tea': 3.30, 'yorkshire tea': 3.50, 'crisps': 1.55, 'walkers crisps': 1.85,
        'pringles': 2.60, 'biscuits': 1.45, 'mcvities digestives': 1.85, 'hobnobs': 1.95,
        'chocolate bar': 0.85, 'mars bar': 0.90, 'snickers': 0.90, 'twix': 0.90, 'kit kat': 0.90,
        'nuts': 2.60, 'popcorn': 1.25, 'frozen peas': 1.25, 'frozen pizza': 2.60, 'ice cream': 3.10,
        'ben and jerrys': 5.20, 'fish fingers': 2.90, 'birds eye fish fingers': 3.60, 'chips': 1.55,
        'frozen chips': 1.55, 'toilet paper': 4.65, 'kitchen roll': 3.60, 'washing up liquid': 1.55,
        'fairy liquid': 2.30, 'washing powder': 5.75, 'persil washing powder': 7.75, 'fabric softener': 2.90,
        'comfort fabric softener': 3.60, 'bin bags': 2.60, 'kitchen cleaner': 1.85, 'bleach': 1.25,
        'toilet cleaner': 1.85, 'sugar': 1.25, 'brown sugar': 1.45, 'flour': 1.10, 'self raising flour': 1.15,
        'plain flour': 1.10, 'oil': 3.20, 'olive oil': 4.65, 'vegetable oil': 2.90, 'salt': 0.65,
        'pepper': 1.55, 'herbs': 1.25, 'stock cubes': 1.45, 'gravy granules': 1.85, 'toothpaste': 2.60,
        'colgate toothpaste': 3.30, 'shampoo': 2.90, 'head and shoulders': 4.65, 'conditioner': 2.90,
        'shower gel': 2.60, 'soap': 1.25, 'deodorant': 2.60, 'tissues': 1.55, 'kleenex tissues': 2.30
    },
    'Asda': {
        'milk': 1.45, 'semi-skimmed milk': 1.45, 'whole milk': 1.48, 'skimmed milk': 1.42,
        'eggs': 2.40, 'free range eggs': 3.10, 'butter': 1.90, 'lurpak butter': 2.70,
        'spreadable butter': 2.10, 'cheese': 2.90, 'cheddar cheese': 3.10, 'cathedral city cheese': 3.70,
        'cream cheese': 1.70, 'philadelphia cream cheese': 2.30, 'yogurt': 2.80, 'greek yogurt': 3.30,
        'activia yogurt': 3.00, 'milk chocolate': 1.10, 'cadbury dairy milk': 1.40, 'galaxy chocolate': 1.40,
        'lindt chocolate': 2.40, 'bread': 1.10, 'warburtons bread': 1.30, 'hovis bread': 1.25,
        'white bread': 1.05, 'wholemeal bread': 1.15, 'seeded bread': 1.40, 'bagels': 1.50,
        'crumpets': 1.10, 'chicken': 3.40, 'chicken breast': 4.00, 'chicken thighs': 2.90,
        'bacon': 2.70, 'sausages': 2.40, 'richmond sausages': 2.70, 'mince beef': 3.70,
        'steak': 6.30, 'pork chops': 3.10, 'salmon': 5.40, 'cod': 4.70, 'tuna': 4.10,
        'pasta': 0.85, 'spaghetti': 0.90, 'penne': 0.90, 'fusilli': 0.90, 'rice': 1.40,
        'basmati rice': 2.10, 'long grain rice': 1.70, 'couscous': 1.30, 'tomatoes': 0.75,
        'cherry tomatoes': 1.10, 'potatoes': 1.10, 'sweet potatoes': 1.50, 'carrots': 0.65,
        'onions': 0.80, 'red onions': 1.00, 'broccoli': 1.35, 'cucumber': 0.70, 'peppers': 1.70,
        'mushrooms': 1.40, 'lettuce': 0.85, 'spinach': 1.30, 'courgette': 1.10, 'aubergine': 1.40,
        'garlic': 0.55, 'apples': 1.90, 'bananas': 0.95, 'oranges': 1.70, 'grapes': 2.40,
        'strawberries': 2.70, 'blueberries': 2.40, 'raspberries': 2.70, 'pears': 1.80, 'lemons': 1.10,
        'limes': 1.10, 'mango': 1.40, 'pineapple': 1.70, 'beans': 0.55, 'heinz beans': 0.85,
        'baked beans': 0.55, 'chickpeas': 0.65, 'chopped tomatoes': 0.50, 'tomato puree': 0.75,
        'pasta sauce': 1.10, 'dolmio pasta sauce': 1.70, 'pesto': 1.50, 'mayonnaise': 1.70,
        'hellmans mayo': 2.40, 'ketchup': 1.40, 'heinz ketchup': 2.10, 'cereal': 2.40,
        'cornflakes': 2.10, 'weetabix': 2.70, 'cheerios': 2.80, 'porridge oats': 1.70, 'muesli': 2.30,
        'jam': 1.30, 'peanut butter': 2.10, 'nutella': 3.40, 'honey': 2.70, 'orange juice': 1.90,
        'tropicana orange juice': 3.10, 'apple juice': 1.70, 'cola': 1.70, 'coca cola': 2.40,
        'pepsi': 2.30, 'sparkling water': 1.10, 'coffee': 4.40, 'nescafe coffee': 5.40, 'tea': 2.40,
        'pg tips tea': 3.10, 'yorkshire tea': 3.30, 'crisps': 1.40, 'walkers crisps': 1.70,
        'pringles': 2.40, 'biscuits': 1.30, 'mcvities digestives': 1.70, 'hobnobs': 1.80,
        'chocolate bar': 0.75, 'mars bar': 0.80, 'snickers': 0.80, 'twix': 0.80, 'kit kat': 0.80,
        'nuts': 2.40, 'popcorn': 1.10, 'frozen peas': 1.10, 'frozen pizza': 2.40, 'ice cream': 2.90,
        'ben and jerrys': 4.80, 'fish fingers': 2.70, 'birds eye fish fingers': 3.40, 'chips': 1.40,
        'frozen chips': 1.40, 'toilet paper': 4.40, 'kitchen roll': 3.40, 'washing up liquid': 1.40,
        'fairy liquid': 2.10, 'washing powder': 5.40, 'persil washing powder': 7.40, 'fabric softener': 2.70,
        'comfort fabric softener': 3.40, 'bin bags': 2.40, 'kitchen cleaner': 1.70, 'bleach': 1.10,
        'toilet cleaner': 1.70, 'sugar': 1.15, 'brown sugar': 1.35, 'flour': 0.95, 'self raising flour': 1.00,
        'plain flour': 0.95, 'oil': 2.90, 'olive oil': 4.40, 'vegetable oil': 2.70, 'salt': 0.55,
        'pepper': 1.40, 'herbs': 1.10, 'stock cubes': 1.30, 'gravy granules': 1.70, 'toothpaste': 2.40,
        'colgate toothpaste': 3.10, 'shampoo': 2.70, 'head and shoulders': 4.40, 'conditioner': 2.70,
        'shower gel': 2.40, 'soap': 1.10, 'deodorant': 2.40, 'tissues': 1.40, 'kleenex tissues': 2.10
    },
    'Morrisons': {
        'milk': 1.52, 'semi-skimmed milk': 1.52, 'whole milk': 1.55, 'skimmed milk': 1.49,
        'eggs': 2.55, 'free range eggs': 3.25, 'butter': 1.95, 'lurpak butter': 2.75,
        'spreadable butter': 2.15, 'cheese': 2.95, 'cheddar cheese': 3.15, 'cathedral city cheese': 3.75,
        'cream cheese': 1.75, 'philadelphia cream cheese': 2.35, 'yogurt': 2.90, 'greek yogurt': 3.40,
        'activia yogurt': 3.10, 'milk chocolate': 1.15, 'cadbury dairy milk': 1.45, 'galaxy chocolate': 1.45,
        'lindt chocolate': 2.45, 'bread': 1.15, 'warburtons bread': 1.35, 'hovis bread': 1.30,
        'white bread': 1.10, 'wholemeal bread': 1.20, 'seeded bread': 1.45, 'bagels': 1.55,
        'crumpets': 1.15, 'chicken': 3.60, 'chicken breast': 4.20, 'chicken thighs': 3.05,
        'bacon': 2.75, 'sausages': 2.50, 'richmond sausages': 2.75, 'mince beef': 3.85,
        'steak': 6.60, 'pork chops': 3.20, 'salmon': 5.55, 'cod': 4.85, 'tuna': 4.25,
        'pasta': 0.88, 'spaghetti': 0.93, 'penne': 0.93, 'fusilli': 0.93, 'rice': 1.45,
        'basmati rice': 2.15, 'long grain rice': 1.75, 'couscous': 1.35, 'tomatoes': 0.78,
        'cherry tomatoes': 1.18, 'potatoes': 1.18, 'sweet potatoes': 1.58, 'carrots': 0.68,
        'onions': 0.88, 'red onions': 1.08, 'broccoli': 1.38, 'cucumber': 0.72, 'peppers': 1.78,
        'mushrooms': 1.48, 'lettuce': 0.88, 'spinach': 1.38, 'courgette': 1.18, 'aubergine': 1.48,
        'garlic': 0.58, 'apples': 1.95, 'bananas': 1.05, 'oranges': 1.78, 'grapes': 2.50,
        'strawberries': 2.80, 'blueberries': 2.50, 'raspberries': 2.80, 'pears': 1.88, 'lemons': 1.18,
        'limes': 1.18, 'mango': 1.48, 'pineapple': 1.78, 'beans': 0.58, 'heinz beans': 0.88,
        'baked beans': 0.58, 'chickpeas': 0.68, 'chopped tomatoes': 0.53, 'tomato puree': 0.78,
        'pasta sauce': 1.18, 'dolmio pasta sauce': 1.78, 'pesto': 1.58, 'mayonnaise': 1.78,
        'hellmans mayo': 2.50, 'ketchup': 1.48, 'heinz ketchup': 2.18, 'cereal': 2.45,
        'cornflakes': 2.18, 'weetabix': 2.75, 'cheerios': 2.85, 'porridge oats': 1.75, 'muesli': 2.38,
        'jam': 1.38, 'peanut butter': 2.18, 'nutella': 3.50, 'honey': 2.80, 'orange juice': 1.95,
        'tropicana orange juice': 3.18, 'apple juice': 1.78, 'cola': 1.78, 'coca cola': 2.50,
        'pepsi': 2.38, 'sparkling water': 1.18, 'coffee': 4.60, 'nescafe coffee': 5.55, 'tea': 2.45,
        'pg tips tea': 3.18, 'yorkshire tea': 3.38, 'crisps': 1.48, 'walkers crisps': 1.78,
        'pringles': 2.50, 'biscuits': 1.38, 'mcvities digestives': 1.78, 'hobnobs': 1.88,
        'chocolate bar': 0.78, 'mars bar': 0.83, 'snickers': 0.83, 'twix': 0.83, 'kit kat': 0.83,
        'nuts': 2.50, 'popcorn': 1.18, 'frozen peas': 1.18, 'frozen pizza': 2.50, 'ice cream': 2.95,
        'ben and jerrys': 5.00, 'fish fingers': 2.80, 'birds eye fish fingers': 3.50, 'chips': 1.48,
        'frozen chips': 1.48, 'toilet paper': 4.50, 'kitchen roll': 3.50, 'washing up liquid': 1.48,
        'fairy liquid': 2.18, 'washing powder': 5.60, 'persil washing powder': 7.60, 'fabric softener': 2.80,
        'comfort fabric softener': 3.50, 'bin bags': 2.50, 'kitchen cleaner': 1.78, 'bleach': 1.18,
        'toilet cleaner': 1.78, 'sugar': 1.18, 'brown sugar': 1.38, 'flour': 0.98, 'self raising flour': 1.03,
        'plain flour': 0.98, 'oil': 2.95, 'olive oil': 4.50, 'vegetable oil': 2.75, 'salt': 0.58,
        'pepper': 1.48, 'herbs': 1.18, 'stock cubes': 1.38, 'gravy granules': 1.78, 'toothpaste': 2.50,
        'colgate toothpaste': 3.20, 'shampoo': 2.80, 'head and shoulders': 4.55, 'conditioner': 2.80,
        'shower gel': 2.50, 'soap': 1.18, 'deodorant': 2.50, 'tissues': 1.48, 'kleenex tissues': 2.18
    },
    'Aldi': {
        'milk': 1.35, 'semi-skimmed milk': 1.35, 'whole milk': 1.38, 'skimmed milk': 1.32,
        'eggs': 2.20, 'free range eggs': 2.90, 'butter': 1.75, 'lurpak butter': 2.50,
        'spreadable butter': 1.90, 'cheese': 2.60, 'cheddar cheese': 2.80, 'cathedral city cheese': 3.40,
        'cream cheese': 1.50, 'philadelphia cream cheese': 2.10, 'yogurt': 2.50, 'greek yogurt': 3.00,
        'activia yogurt': 2.80, 'milk chocolate': 0.99, 'cadbury dairy milk': 1.30, 'galaxy chocolate': 1.30,
        'lindt chocolate': 2.20, 'bread': 0.95, 'warburtons bread': 1.20, 'hovis bread': 1.15,
        'white bread': 0.89, 'wholemeal bread': 0.99, 'seeded bread': 1.20, 'bagels': 1.30,
        'crumpets': 0.95, 'chicken': 3.20, 'chicken breast': 3.80, 'chicken thighs': 2.70,
        'bacon': 2.40, 'sausages': 2.10, 'richmond sausages': 2.50, 'mince beef': 3.40,
        'steak': 5.90, 'pork chops': 2.80, 'salmon': 5.00, 'cod': 4.30, 'tuna': 3.80,
        'pasta': 0.75, 'spaghetti': 0.79, 'penne': 0.79, 'fusilli': 0.79, 'rice': 1.25,
        'basmati rice': 1.85, 'long grain rice': 1.50, 'couscous': 1.15, 'tomatoes': 0.65,
        'cherry tomatoes': 0.95, 'potatoes': 0.95, 'sweet potatoes': 1.35, 'carrots': 0.55,
        'onions': 0.70, 'red onions': 0.85, 'broccoli': 1.20, 'cucumber': 0.60, 'peppers': 1.50,
        'mushrooms': 1.20, 'lettuce': 0.75, 'spinach': 1.15, 'courgette': 0.95, 'aubergine': 1.25,
        'garlic': 0.49, 'apples': 1.75, 'bananas': 0.85, 'oranges': 1.50, 'grapes': 2.10,
        'strawberries': 2.40, 'blueberries': 2.10, 'raspberries': 2.40, 'pears': 1.65, 'lemons': 0.95,
        'limes': 0.95, 'mango': 1.25, 'pineapple': 1.50, 'beans': 0.49, 'heinz beans': 0.75,
        'baked beans': 0.49, 'chickpeas': 0.55, 'chopped tomatoes': 0.45, 'tomato puree': 0.65,
        'pasta sauce': 0.95, 'dolmio pasta sauce': 1.50, 'pesto': 1.30, 'mayonnaise': 1.50,
        'hellmans mayo': 2.10, 'ketchup': 1.20, 'heinz ketchup': 1.90, 'cereal': 2.10,
        'cornflakes': 1.85, 'weetabix': 2.40, 'cheerios': 2.50, 'porridge oats': 1.50, 'muesli': 2.00,
        'jam': 1.15, 'peanut butter': 1.85, 'nutella': 3.10, 'honey': 2.40, 'orange juice': 1.75,
        'tropicana orange juice': 2.80, 'apple juice': 1.50, 'cola': 1.50, 'coca cola': 2.10,
        'pepsi': 2.00, 'sparkling water': 0.95, 'coffee': 3.99, 'nescafe coffee': 4.99, 'tea': 2.20,
        'pg tips tea': 2.80, 'yorkshire tea': 3.00, 'crisps': 1.20, 'walkers crisps': 1.50,
        'pringles': 2.10, 'biscuits': 1.10, 'mcvities digestives': 1.50, 'hobnobs': 1.60,
        'chocolate bar': 0.65, 'mars bar': 0.70, 'snickers': 0.70, 'twix': 0.70, 'kit kat': 0.70,
        'nuts': 2.10, 'popcorn': 0.95, 'frozen peas': 0.95, 'frozen pizza': 2.10, 'ice cream': 2.50,
        'ben and jerrys': 4.20, 'fish fingers': 2.40, 'birds eye fish fingers': 3.10, 'chips': 1.20,
        'frozen chips': 1.20, 'toilet paper': 3.99, 'kitchen roll': 3.10, 'washing up liquid': 1.20,
        'fairy liquid': 1.85, 'washing powder': 4.99, 'persil washing powder': 6.99, 'fabric softener': 2.40,
        'comfort fabric softener': 3.10, 'bin bags': 2.10, 'kitchen cleaner': 1.50, 'bleach': 0.95,
        'toilet cleaner': 1.50, 'sugar': 0.99, 'brown sugar': 1.20, 'flour': 0.85, 'self raising flour': 0.89,
        'plain flour': 0.85, 'oil': 2.65, 'olive oil': 3.99, 'vegetable oil': 2.40, 'salt': 0.49,
        'pepper': 1.20, 'herbs': 0.95, 'stock cubes': 1.10, 'gravy granules': 1.50, 'toothpaste': 2.10,
        'colgate toothpaste': 2.80, 'shampoo': 2.40, 'head and shoulders': 3.99, 'conditioner': 2.40,
        'shower gel': 2.10, 'soap': 0.95, 'deodorant': 2.10, 'tissues': 1.20, 'kleenex tissues': 1.85
    },
    'Lidl': {
        'milk': 1.38, 'semi-skimmed milk': 1.38, 'whole milk': 1.41, 'skimmed milk': 1.35,
        'eggs': 2.25, 'free range eggs': 2.95, 'butter': 1.78, 'lurpak butter': 2.55,
        'spreadable butter': 1.95, 'cheese': 2.65, 'cheddar cheese': 2.85, 'cathedral city cheese': 3.45,
        'cream cheese': 1.55, 'philadelphia cream cheese': 2.15, 'yogurt': 2.55, 'greek yogurt': 3.05,
        'activia yogurt': 2.85, 'milk chocolate': 1.02, 'cadbury dairy milk': 1.35, 'galaxy chocolate': 1.35,
        'lindt chocolate': 2.25, 'bread': 0.98, 'warburtons bread': 1.25, 'hovis bread': 1.18,
        'white bread': 0.92, 'wholemeal bread': 1.02, 'seeded bread': 1.25, 'bagels': 1.35,
        'crumpets': 0.98, 'chicken': 3.25, 'chicken breast': 3.85, 'chicken thighs': 2.75,
        'bacon': 2.45, 'sausages': 2.15, 'richmond sausages': 2.55, 'mince beef': 3.50,
        'steak': 6.00, 'pork chops': 2.90, 'salmon': 5.10, 'cod': 4.40, 'tuna': 3.90,
        'pasta': 0.78, 'spaghetti': 0.82, 'penne': 0.82, 'fusilli': 0.82, 'rice': 1.28,
        'basmati rice': 1.90, 'long grain rice': 1.55, 'couscous': 1.18, 'tomatoes': 0.68,
        'cherry tomatoes': 0.98, 'potatoes': 0.98, 'sweet potatoes': 1.38, 'carrots': 0.58,
        'onions': 0.72, 'red onions': 0.88, 'broccoli': 1.22, 'cucumber': 0.62, 'peppers': 1.55,
        'mushrooms': 1.25, 'lettuce': 0.78, 'spinach': 1.18, 'courgette': 0.98, 'aubergine': 1.28,
        'garlic': 0.52, 'apples': 1.78, 'bananas': 0.88, 'oranges': 1.55, 'grapes': 2.15,
        'strawberries': 2.45, 'blueberries': 2.15, 'raspberries': 2.45, 'pears': 1.68, 'lemons': 0.98,
        'limes': 0.98, 'mango': 1.28, 'pineapple': 1.55, 'beans': 0.52, 'heinz beans': 0.78,
        'baked beans': 0.52, 'chickpeas': 0.58, 'chopped tomatoes': 0.48, 'tomato puree': 0.68,
        'pasta sauce': 0.98, 'dolmio pasta sauce': 1.55, 'pesto': 1.35, 'mayonnaise': 1.55,
        'hellmans mayo': 2.15, 'ketchup': 1.25, 'heinz ketchup': 1.95, 'cereal': 2.15,
        'cornflakes': 1.90, 'weetabix': 2.45, 'cheerios': 2.55, 'porridge oats': 1.55, 'muesli': 2.05,
        'jam': 1.18, 'peanut butter': 1.90, 'nutella': 3.15, 'honey': 2.45, 'orange juice': 1.78,
        'tropicana orange juice': 2.85, 'apple juice': 1.55, 'cola': 1.55, 'coca cola': 2.15,
        'pepsi': 2.05, 'sparkling water': 0.98, 'coffee': 4.10, 'nescafe coffee': 5.10, 'tea': 2.25,
        'pg tips tea': 2.85, 'yorkshire tea': 3.05, 'crisps': 1.25, 'walkers crisps': 1.55,
        'pringles': 2.15, 'biscuits': 1.15, 'mcvities digestives': 1.55, 'hobnobs': 1.65,
        'chocolate bar': 0.68, 'mars bar': 0.73, 'snickers': 0.73, 'twix': 0.73, 'kit kat': 0.73,
        'nuts': 2.15, 'popcorn': 0.98, 'frozen peas': 0.98, 'frozen pizza': 2.15, 'ice cream': 2.55,
        'ben and jerrys': 4.30, 'fish fingers': 2.45, 'birds eye fish fingers': 3.15, 'chips': 1.25,
        'frozen chips': 1.25, 'toilet paper': 4.10, 'kitchen roll': 3.15, 'washing up liquid': 1.25,
        'fairy liquid': 1.90, 'washing powder': 5.10, 'persil washing powder': 7.10, 'fabric softener': 2.45,
        'comfort fabric softener': 3.15, 'bin bags': 2.15, 'kitchen cleaner': 1.55, 'bleach': 0.98,
        'toilet cleaner': 1.55, 'sugar': 1.02, 'brown sugar': 1.22, 'flour': 0.88, 'self raising flour': 0.92,
        'plain flour': 0.88, 'oil': 2.70, 'olive oil': 4.10, 'vegetable oil': 2.45, 'salt': 0.52,
        'pepper': 1.25, 'herbs': 0.98, 'stock cubes': 1.15, 'gravy granules': 1.55, 'toothpaste': 2.15,
        'colgate toothpaste': 2.85, 'shampoo': 2.45, 'head and shoulders': 4.10, 'conditioner': 2.45,
        'shower gel': 2.15, 'soap': 0.98, 'deodorant': 2.15, 'tissues': 1.25, 'kleenex tissues': 1.90
    }
};

// Add item to shopping list
function addItem() {
    const nameInput = document.getElementById('itemName');
    const quantityInput = document.getElementById('itemQuantity');

    const name = nameInput.value.trim().toLowerCase();
    const quantity = parseInt(quantityInput.value) || 1;

    if (!name) {
        alert('Please enter an item name');
        return;
    }

    shoppingList.push({ name, quantity });
    nameInput.value = '';
    quantityInput.value = '1';
    nameInput.focus();

    renderShoppingList();
}

// Add popular item to shopping list
function addPopularItem(itemName) {
    shoppingList.push({ name: itemName, quantity: 1 });
    renderShoppingList();
}

// Remove item from shopping list
function removeItem(index) {
    shoppingList.splice(index, 1);
    renderShoppingList();
}

// Render shopping list
function renderShoppingList() {
    const listContainer = document.getElementById('shoppingList');

    if (shoppingList.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">Add items to your shopping list to get started</div>';
        return;
    }

    listContainer.innerHTML = shoppingList.map((item, index) => `
        <div class="list-item">
            <span>${item.name.charAt(0).toUpperCase() + item.name.slice(1)} <span class="quantity">x${item.quantity}</span></span>
            <button class="remove" onclick="removeItem(${index})">Remove</button>
        </div>
    `).join('');
}

// Compare prices across supermarkets
function compareBaskets() {
    if (shoppingList.length === 0) {
        alert('Please add items to your shopping list first');
        return;
    }

    const results = [];
    const unavailableItems = [];

    // Calculate total for each supermarket
    for (const [supermarket, prices] of Object.entries(priceDatabase)) {
        let total = 0;
        const itemBreakdown = [];
        const missing = [];

        for (const item of shoppingList) {
            const price = prices[item.name];
            if (price !== undefined) {
                const itemTotal = price * item.quantity;
                total += itemTotal;
                itemBreakdown.push({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: price,
                    total: itemTotal
                });
            } else {
                missing.push(item.name);
                if (!unavailableItems.includes(item.name)) {
                    unavailableItems.push(item.name);
                }
            }
        }

        results.push({
            supermarket,
            total,
            itemBreakdown,
            missing
        });
    }

    // Sort by total price
    results.sort((a, b) => a.total - b.total);

    // Display results
    displayResults(results, unavailableItems);
}

// Display comparison results
function displayResults(results, unavailableItems) {
    const resultsContainer = document.getElementById('results');
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const savings = mostExpensive.total - cheapest.total;

    let html = '';

    results.forEach((result, index) => {
        const isCheapest = index === 0;
        html += `
            <div class="supermarket-card ${isCheapest ? 'cheapest' : ''}">
                <div class="supermarket-header">
                    <div class="supermarket-name">${result.supermarket}</div>
                    <div class="supermarket-total">£${result.total.toFixed(2)}</div>
                </div>
                ${result.missing.length > 0 ? `
                    <div style="color: #e74c3c; font-size: 14px; margin-bottom: 10px;">
                        Not available: ${result.missing.join(', ')}
                    </div>
                ` : ''}
                <button class="toggle-details" onclick="toggleDetails(${index})">
                    Show Item Breakdown
                </button>
                <div class="item-prices" id="details-${index}">
                    ${result.itemBreakdown.map(item => `
                        <div class="item-price">
                            <span class="item-price-name">${item.name.charAt(0).toUpperCase() + item.name.slice(1)} x${item.quantity}</span>
                            <span class="item-price-value">£${item.unitPrice.toFixed(2)} each = £${item.total.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    if (savings > 0.01) {
        html += `
            <div class="savings">
                <strong>💰 Potential Savings:</strong> You could save £${savings.toFixed(2)} by shopping at ${cheapest.supermarket} instead of ${mostExpensive.supermarket}!
            </div>
        `;
    }

    if (unavailableItems.length > 0) {
        html += `
            <div class="warning-banner">
                <strong>⚠️ Note:</strong> The following items were not found in our price database: ${unavailableItems.join(', ')}.
                You may need to add these manually or check availability.
            </div>
        `;
    }

    resultsContainer.innerHTML = html;

    // Scroll results panel to top for new results
    resultsContainer.scrollTop = 0;
}

// Toggle item breakdown details
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const button = event.target;

    if (details.classList.contains('show')) {
        details.classList.remove('show');
        button.textContent = 'Show Item Breakdown';
    } else {
        details.classList.add('show');
        button.textContent = 'Hide Item Breakdown';
    }
}

// Autocomplete functionality
function initAutocomplete() {
    const input = document.getElementById('itemName');
    const availableItems = getAvailableItems();
    let currentFocus = -1;

    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        closeAllLists();

        if (!value) return;

        currentFocus = -1;

        const autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('id', 'autocomplete-list');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(autocompleteList);

        const matches = availableItems.filter(item =>
            item.toLowerCase().includes(value)
        );

        matches.forEach(item => {
            const itemDiv = document.createElement('div');
            const matchIndex = item.toLowerCase().indexOf(value);

            itemDiv.innerHTML = item.substring(0, matchIndex) +
                '<strong>' + item.substring(matchIndex, matchIndex + value.length) + '</strong>' +
                item.substring(matchIndex + value.length);

            itemDiv.innerHTML += '<input type="hidden" value="' + item + '">';

            itemDiv.addEventListener('click', function() {
                input.value = this.getElementsByTagName('input')[0].value;
                closeAllLists();
                input.focus();
            });

            autocompleteList.appendChild(itemDiv);
        });
    });

    input.addEventListener('keydown', function(e) {
        let autocompleteList = document.getElementById('autocomplete-list');
        if (autocompleteList) {
            const items = autocompleteList.getElementsByTagName('div');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                addActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                addActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                } else {
                    addItem();
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('autocomplete-active');
        }
    }

    function closeAllLists(except) {
        const items = document.getElementsByClassName('autocomplete-items');
        for (let item of items) {
            if (except !== item && except !== input) {
                item.parentNode.removeChild(item);
            }
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}

// Allow Enter key to add items
document.addEventListener('DOMContentLoaded', function() {
    const itemNameInput = document.getElementById('itemName');
    const itemQuantityInput = document.getElementById('itemQuantity');

    // Initialize autocomplete
    initAutocomplete();

    itemQuantityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addItem();
        }
    });
});
