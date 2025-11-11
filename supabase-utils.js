require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { normalizeProductName } = require('./normalizeProducts.js');
const { mapToMainCategory } = require('./categoryMapping.js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for write access
);

/**
 * Get or create a category by name
 * Returns the category_id
 * Note: Categories are shared across all supermarkets
 */
async function getOrCreateCategory(categoryName) {
  try {
    // First try to find existing category
    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existing) {
      return existing.id;
    }

    // Category doesn't exist, create it
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({ name: categoryName })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    console.log(`  📁 Created new category: ${categoryName}`);
    return newCategory.id;

  } catch (error) {
    console.error(`Error managing category "${categoryName}":`, error.message);
    return null;
  }
}

/**
 * Get or create a supermarket by slug
 * Returns the supermarket object with id
 */
async function getOrCreateSupermarket(supermarketSlug) {
  const { data, error } = await supabase
    .from('supermarkets')
    .select('*')
    .eq('slug', supermarketSlug)
    .single();

  if (error) {
    console.error(`Supermarket not found: ${supermarketSlug}`);
    throw error;
  }

  return data;
}

/**
 * Extract product code from URL
 */
function extractProductCode(url) {
  if (!url) return null;

  // ASDA: Extract product ID from URL
  if (url.includes('asda.com')) {
    const match = url.match(/\/product\/[^\/]+\/(\d+)/);
    return match ? `asda_${match[1]}` : null;
  }

  // Tesco: Extract product ID from URL
  if (url.includes('tesco.com')) {
    const match = url.match(/\/products\/(\d+)/);
    return match ? `tesco_${match[1]}` : null;
  }

  // Sainsburys: Extract product ID from URL
  if (url.includes('sainsburys.co.uk')) {
    const match = url.match(/\/product\/([^\/]+)$/);
    return match ? `sainsburys_${match[1]}` : null;
  }

  return null;
}

/**
 * Parse price string to decimal number
 */
function parsePrice(priceString) {
  if (!priceString) return null;

  // Remove currency symbols and spaces, keep numbers and decimal points
  const cleaned = priceString.replace(/[£$€\s]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Upsert a product to the database
 * This will either insert a new product or update an existing one
 */
async function upsertProduct(supermarketName, productData, categoryName = null) {
  try {
    console.log(`  💾 Saving: ${productData.name}`);

    // Get supermarket data
    const supermarket = await getOrCreateSupermarket(supermarketName);

    // Extract product code from URL
    const productCode = extractProductCode(productData.url);

    // Normalize product name and extract tags
    const normalized = normalizeProductName(productData.name);
    const normalizedName = normalized.normalizedName;
    const tags = normalized.tags || [];

    // Parse price
    const price = parsePrice(productData.price);

    // Get category ID if category name was provided
    let categoryId = null;
    if (categoryName) {
      // Map the supermarket's subcategory to our standard main category
      const mainCategory = mapToMainCategory(categoryName, supermarketName);

      if (mainCategory) {
        categoryId = await getOrCreateCategory(mainCategory);
      } else {
        // If no mapping found, log a warning and skip category assignment
        console.warn(`  ⚠️  No category mapping for "${categoryName}" at ${supermarketName}`);
      }
    }

    const productRecord = {
      supermarket_id: supermarket.id,
      name: productData.name,
      normalized_name: normalizedName,
      tags: tags.length > 0 ? tags : null,
      product_url: productData.url,
      product_code: productCode,
      current_price: price,
      image_url: productData.imageUrl || null,
      category_id: categoryId,
      is_available: true,
      last_scraped_at: new Date().toISOString()
    };

    // Check if product already exists (by product_code or URL)
    let existing = null;
    if (productCode) {
      const { data: existingByCode } = await supabase
        .from('products')
        .select('*')
        .eq('product_code', productCode)
        .single();
      existing = existingByCode;
    }

    if (!existing) {
      // Also check by URL as fallback
      const { data: existingByUrl } = await supabase
        .from('products')
        .select('*')
        .eq('product_url', productData.url)
        .single();
      existing = existingByUrl;
    }

    if (existing) {
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update(productRecord)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error updating product: ${error.message}`);
        return null;
      }

      // Check if price changed
      if (existing.current_price !== price) {
        console.log(`  Price changed: £${existing.current_price} → £${price}`);
      }

      return data;
    } else {
      // Insert new product
      const { data, error } = await supabase
        .from('products')
        .insert(productRecord)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error inserting product: ${error.message}`);
        return null;
      }

      return data;
    }

  } catch (error) {
    console.error(`Error upserting product: ${error.message}`);
    return null;
  }
}

/**
 * Log scraping activity
 */
async function logScrape(supermarketName, searchTerm, productsFound, success = true) {
  try {
    const { error } = await supabase
      .from('scrape_logs')
      .insert({
        supermarket: supermarketName,
        search_term: searchTerm,
        products_found: productsFound,
        scraped_at: new Date().toISOString(),
        success: success
      });

    if (error) {
      console.error('Error logging scrape:', error.message);
    }
  } catch (error) {
    console.error('Error logging scrape:', error.message);
  }
}

module.exports = {
  supabase,
  upsertProduct,
  getOrCreateCategory,
  getOrCreateSupermarket,
  logScrape,
  parsePrice,
  extractProductCode
};