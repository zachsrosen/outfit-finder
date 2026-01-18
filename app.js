// Outfit Finder App - Deployed Version
class OutfitFinder {
    constructor() {
        this.init();
    }

    init() {
        // DOM Elements
        this.descriptionInput = document.getElementById('outfit-description');
        this.findButton = document.getElementById('find-outfits');
        this.btnText = this.findButton.querySelector('.btn-text');
        this.btnLoader = this.findButton.querySelector('.btn-loader');
        this.resultsSection = document.getElementById('results-section');
        this.loadingSection = document.getElementById('loading-section');
        this.errorSection = document.getElementById('error-section');
        this.errorMessage = document.getElementById('error-message');
        this.outfitCategories = document.getElementById('outfit-categories');
        this.searchSummary = document.getElementById('search-summary');
        this.retryBtn = document.getElementById('retry-btn');
        this.styleChips = document.querySelectorAll('.style-chip');

        // Event Listeners
        this.findButton.addEventListener('click', () => this.findOutfits());
        this.descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.findOutfits();
            }
        });

        this.retryBtn.addEventListener('click', () => this.findOutfits());

        this.styleChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.descriptionInput.value = chip.dataset.style;
                this.descriptionInput.focus();
            });
        });
    }

    showLoading() {
        this.resultsSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
        this.loadingSection.classList.remove('hidden');
        this.findButton.disabled = true;
        this.btnText.classList.add('hidden');
        this.btnLoader.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSection.classList.add('hidden');
        this.findButton.disabled = false;
        this.btnText.classList.remove('hidden');
        this.btnLoader.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
    }

    showResults() {
        this.hideLoading();
        this.resultsSection.classList.remove('hidden');
    }

    async findOutfits() {
        const description = this.descriptionInput.value.trim();

        if (!description) {
            this.showError('Please describe the outfit you\'re looking for!');
            return;
        }

        this.showLoading();

        try {
            // Step 1: Use backend API to analyze outfit with Claude
            const analyzeResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            if (!analyzeResponse.ok) {
                const error = await analyzeResponse.json();
                throw new Error(error.error || 'Failed to analyze outfit');
            }

            const outfitPlan = await analyzeResponse.json();

            // Step 2: Search for products using backend API
            const searchResponse = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: outfitPlan.categories })
            });

            if (!searchResponse.ok) {
                const error = await searchResponse.json();
                throw new Error(error.error || 'Failed to search products');
            }

            const products = await searchResponse.json();

            // Step 3: Display results
            this.displayResults(outfitPlan, products);
            this.showResults();

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Something went wrong. Please try again.');
        }
    }

    displayResults(outfitPlan, products) {
        this.searchSummary.textContent = outfitPlan.summary;
        this.outfitCategories.innerHTML = '';

        for (const categoryName in products) {
            const category = products[categoryName];
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category';

            categoryEl.innerHTML = `
                <div class="category-header">
                    <span class="category-icon">${category.icon}</span>
                    <h3 class="category-title">${category.name}</h3>
                </div>
                <div class="products-grid">
                    ${category.products.map(product => this.createProductCard(product)).join('')}
                </div>
            `;

            this.outfitCategories.appendChild(categoryEl);
        }

        // Add event listeners for copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.target.closest('.coupon-code').querySelector('.coupon-value').textContent;
                navigator.clipboard.writeText(code);
                e.target.textContent = 'Copied!';
                setTimeout(() => e.target.textContent = 'Copy', 1500);
            });
        });
    }

    createProductCard(product) {
        const priceDisplay = typeof product.price === 'number'
            ? `$${product.price.toFixed(2)}`
            : product.price || 'See price';

        const originalPriceDisplay = product.originalPrice
            ? `<span class="original-price">$${product.originalPrice.toFixed ? product.originalPrice.toFixed(2) : product.originalPrice}</span>`
            : '';

        const discountBadge = product.originalPrice && product.price
            ? `<span class="discount-badge">${Math.round((1 - product.price / product.originalPrice) * 100)}% OFF</span>`
            : '';

        const couponDisplay = product.coupon
            ? `<div class="coupon-code">
                <div>
                    <span class="coupon-label">${product.coupon.discount}</span>
                </div>
                <span class="coupon-value">${product.coupon.code}</span>
                <button class="copy-btn" title="Copy code">Copy</button>
               </div>`
            : '';

        return `
            <div class="product-card">
                <img class="product-image" src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <div class="product-info">
                    <div class="product-brand">${product.source || 'Shop'}</div>
                    <div class="product-title">${product.title}</div>
                    <div class="product-price">
                        <span class="current-price">${priceDisplay}</span>
                        ${originalPriceDisplay}
                        ${discountBadge}
                    </div>
                    ${couponDisplay}
                    <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="product-link">View Product</a>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OutfitFinder();
});
