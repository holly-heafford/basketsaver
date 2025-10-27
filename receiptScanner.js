// Receipt Scanner Module using Tesseract.js OCR

class ReceiptScanner {
    constructor() {
        this.isProcessing = false;
    }

    /**
     * Main function to scan receipt from image
     */
    async scanReceipt(imageFile) {
        if (this.isProcessing) {
            alert('Already processing a receipt. Please wait...');
            return null;
        }

        try {
            this.isProcessing = true;

            // Step 1: Extract text using OCR
            const text = await this.extractTextFromImage(imageFile);

            // Step 2: Parse receipt items
            const items = this.parseReceiptText(text);

            // Step 3: Normalize and match items
            const normalizedItems = await this.normalizeItems(items);

            return normalizedItems;

        } catch (error) {
            console.error('Receipt scanning error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Extract text from image using Tesseract OCR
     */
    async extractTextFromImage(imageFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const imageData = e.target.result;

                    // Show progress indicator
                    this.updateProgress('Scanning receipt...', 0);

                    const result = await Tesseract.recognize(
                        imageData,
                        'eng',
                        {
                            logger: (m) => {
                                if (m.status === 'recognizing text') {
                                    this.updateProgress('Reading text...', Math.round(m.progress * 100));
                                }
                            }
                        }
                    );

                    this.updateProgress('Processing items...', 100);
                    resolve(result.data.text);

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(imageFile);
        });
    }

    /**
     * Parse receipt text to extract items
     */
    parseReceiptText(text) {
        const lines = text.split('\n');
        const items = [];

        // Keywords to skip (non-food items, store info, etc.)
        const skipKeywords = [
            'total', 'subtotal', 'vat', 'tax', 'balance', 'change', 'card', 'cash',
            'payment', 'tender', 'clubcard', 'nectar', 'receipt', 'thank you',
            'store', 'tel:', 'www.', 'date', 'time', 'till', 'cashier', 'transaction',
            'savings', 'clubcard price', 'offer', 'customer', 'number', 'ref:',
            '****', '----', '====', 'visa', 'mastercard', 'amex'
        ];

        for (let line of lines) {
            line = line.trim();

            // Skip empty lines
            if (!line || line.length < 3) continue;

            // Skip lines with skip keywords
            const lowerLine = line.toLowerCase();
            if (skipKeywords.some(keyword => lowerLine.includes(keyword))) continue;

            // Try to extract item details
            const item = this.extractItemFromLine(line);
            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    /**
     * Extract item details from a receipt line
     */
    extractItemFromLine(line) {
        // Common patterns:
        // "MILK SEMI SKIMMED 2.27L £1.65"
        // "2 X BREAD SLICED £1.00"
        // "EGGS FREE RANGE X 12 2.80"
        // "BANANAS 1.25KG @ £0.89/KG £1.11"

        // Remove multiple spaces
        line = line.replace(/\s+/g, ' ');

        // Extract price (£X.XX or X.XX at end of line)
        const priceMatch = line.match(/£?(\d+\.\d{2})\s*$/);
        if (!priceMatch) return null;

        const price = parseFloat(priceMatch[1]);

        // Remove price from line to get product name
        let productLine = line.substring(0, line.lastIndexOf(priceMatch[0])).trim();

        // Extract quantity if present
        let quantity = 1;

        // Pattern: "2 X PRODUCT" or "2X PRODUCT"
        const qtyPattern1 = /^(\d+)\s*[xX]\s*/;
        const qtyMatch1 = productLine.match(qtyPattern1);
        if (qtyMatch1) {
            quantity = parseInt(qtyMatch1[1]);
            productLine = productLine.replace(qtyPattern1, '').trim();
        }

        // Pattern: "PRODUCT X 2" or "PRODUCT X2"
        const qtyPattern2 = /\s*[xX]\s*(\d+)$/;
        const qtyMatch2 = productLine.match(qtyPattern2);
        if (qtyMatch2) {
            quantity = parseInt(qtyMatch2[1]);
            productLine = productLine.replace(qtyPattern2, '').trim();
        }

        // Remove weight pricing info (@ £X.XX/KG)
        productLine = productLine.replace(/@\s*£?\d+\.\d{2}\/[A-Z]+/gi, '').trim();

        // Remove common receipt codes/numbers at start
        productLine = productLine.replace(/^\d{4,}\s+/, '');

        if (!productLine || productLine.length < 2) return null;

        return {
            name: productLine.toLowerCase(),
            quantity: quantity,
            price: price,
            originalLine: line
        };
    }

    /**
     * Normalize items using existing product normalization
     */
    async normalizeItems(items) {
        const normalized = [];

        for (const item of items) {
            // Use the global normalizeProductName function if available
            if (typeof normalizeProductName === 'function') {
                const { normalizedName } = normalizeProductName(item.name);
                normalized.push({
                    name: normalizedName || item.name,
                    quantity: item.quantity,
                    price: item.price,
                    originalName: item.name,
                    originalLine: item.originalLine
                });
            } else {
                // Fallback: basic normalization
                normalized.push({
                    name: item.name.toLowerCase().trim(),
                    quantity: item.quantity,
                    price: item.price,
                    originalName: item.name,
                    originalLine: item.originalLine
                });
            }
        }

        return normalized;
    }

    /**
     * Update progress indicator
     */
    updateProgress(message, percent) {
        const modal = document.getElementById('scanProgressModal');
        if (modal && modal.style.display !== 'none') {
            const messageEl = modal.querySelector('.progress-message');
            const barEl = modal.querySelector('.progress-bar-fill');

            if (messageEl) messageEl.textContent = message;
            if (barEl) barEl.style.width = `${percent}%`;
        }
    }
}

// Global instance
const receiptScanner = new ReceiptScanner();

/**
 * Open file picker for receipt image
 */
function scanReceiptImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile

    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Show progress modal
        showScanProgressModal();

        try {
            const items = await receiptScanner.scanReceipt(file);

            // Hide progress modal
            hideScanProgressModal();

            if (items && items.length > 0) {
                // Show review modal
                showReviewModal(items);
            } else {
                alert('No items found on receipt. Please try again with a clearer image.');
            }

        } catch (error) {
            hideScanProgressModal();
            console.error('Scan error:', error);
            alert('Failed to scan receipt. Please try again with a clearer image.');
        }
    };

    input.click();
}

/**
 * Show scanning progress modal
 */
function showScanProgressModal() {
    let modal = document.getElementById('scanProgressModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'scanProgressModal';
        modal.className = 'scan-modal';
        modal.innerHTML = `
            <div class="scan-modal-content">
                <h3>Scanning Receipt</h3>
                <p class="progress-message">Preparing to scan...</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
}

/**
 * Hide scanning progress modal
 */
function hideScanProgressModal() {
    const modal = document.getElementById('scanProgressModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show review modal for extracted items
 */
function showReviewModal(items) {
    let modal = document.getElementById('reviewModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reviewModal';
        modal.className = 'scan-modal';
        document.body.appendChild(modal);
    }

    let html = `
        <div class="scan-modal-content review-modal">
            <h3>Review Scanned Items</h3>
            <p class="review-subtitle">Found ${items.length} items. Review and edit before adding to your list.</p>
            <div class="review-items">
                ${items.map((item, index) => `
                    <div class="review-item" data-index="${index}">
                        <input type="checkbox" id="item-${index}" checked>
                        <div class="review-item-details">
                            <input type="text" class="review-item-name" value="${item.name}"
                                   placeholder="Item name" data-index="${index}">
                            <div class="review-item-meta">
                                <span class="review-price">£${item.price.toFixed(2)}</span>
                                <input type="number" class="review-quantity" value="${item.quantity}"
                                       min="1" data-index="${index}">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="review-actions">
                <button class="review-btn review-btn-cancel" onclick="hideReviewModal()">Cancel</button>
                <button class="review-btn review-btn-add" onclick="addReviewedItems()">Add to List</button>
            </div>
        </div>
    `;

    modal.innerHTML = html;
    modal.style.display = 'flex';

    // Store items data for later use
    modal.dataset.items = JSON.stringify(items);
}

/**
 * Hide review modal
 */
function hideReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Add reviewed items to shopping list
 */
function addReviewedItems() {
    const modal = document.getElementById('reviewModal');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    const nameInputs = modal.querySelectorAll('.review-item-name');
    const quantityInputs = modal.querySelectorAll('.review-quantity');

    let addedCount = 0;

    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            const name = nameInputs[index].value.trim().toLowerCase();
            const quantity = parseInt(quantityInputs[index].value) || 1;

            if (name) {
                shoppingList.push({ name, quantity });
                addedCount++;
            }
        }
    });

    hideReviewModal();

    if (addedCount > 0) {
        saveToLocalStorage();
        renderShoppingList();
        alert(`Added ${addedCount} items to your shopping list!`);
    }
}
