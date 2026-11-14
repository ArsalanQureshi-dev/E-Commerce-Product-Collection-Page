// DOM Elements
const categoryFilterEl = document.getElementById('categoryFilter');
const priceFilterEl = document.getElementById('priceFilter');
const ratingFilterEl = document.getElementById('ratingFilter');
const appliedFiltersEl = document.getElementById('appliedFilters');
const productsGridEl = document.getElementById('productsGrid');
const sortSelectEl = document.getElementById('sortSelect');
const itemsPerPageSelectEl = document.getElementById('itemsPerPageSelect');
const paginationEl = document.getElementById('pagination');
const resultsCountEl = document.getElementById('resultsCount');
const themeToggleEl = document.getElementById('themeToggle');
const themeIconEl = document.getElementById('themeIcon')

let allProducts = [];

const getRatingRange = (stars) => {
    const minimum = stars === 1 ? 0.3 : stars - 0.4;
    const maximum = Math.min(5, stars + 0.5);

    return [minimum, maximum];
};

const getProduct = async () => {
    try {
        const response = await fetch('https://dummyjson.com/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allProducts = data.products;
        renderCategoryFilter(allProducts);
        renderRatingFilter();
        renderPriceFilter(allProducts);
        showProducts(allProducts);

    } catch (error) {
        console.error('Error fetching product:', error);
    }
};

const renderCategoryFilter = (products) => {
    const categories = [...new Set(products.map((product) => product.category))];

    categoryFilterEl.innerHTML = `
        <h2 class="heading text-sm font-semibold">Categories</h2>
        ${categories.map((category, index) => {
            const label = category
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            return `
                <label class="category-filter-option" for="category-${index}">
                    <input id="category-${index}" type="checkbox" value="${category}">
                    <span>${label}</span>
                </label>
            `;
        }).join('')}
    `;
};

const renderRatingFilter = () => {
    ratingFilterEl.innerHTML = `
        <h2 class="heading text-sm font-semibold">Rating</h2>
        ${Array.from({ length: 5 }, (_, index) => 5 - index).map((rating) => {
            const [minimum, maximum] = getRatingRange(rating);

            return `
                <label class="rating-filter-option">
                    <input type="radio" name="ratingFilter" value="${rating}" aria-label="${rating} stars, ${minimum} to ${maximum}">
                    <span class="rating-filter-stars" aria-hidden="true">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                    <span class="muted">${rating}+</span>
                </label>
            `;
        }).join('')}
    `;
};

const renderPriceFilter = (products) => {
    const prices = products.map((product) => product.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    priceFilterEl.innerHTML = `
        <h2 class="heading text-sm font-semibold">Price range</h2>
        <div class="price-range-slider">
            <div class="price-range-track"></div>
            <div class="price-range-selected" id="priceRangeSelected"></div>

            <input id="minPriceFilter" type="range" min="${minPrice}" max="${maxPrice}" step="0.01" value="${minPrice}" aria-label="Minimum price">
            <input id="maxPriceFilter" type="range" min="${minPrice}" max="${maxPrice}" step="0.01" value="${maxPrice}" aria-label="Maximum price">
        </div>
        <div class="price-range-values">
            <div>
                <span id="minPriceValue">$${minPrice.toFixed(2)}</span>
            </div>
            <div>
                <span id="maxPriceValue">$${maxPrice.toFixed(2)}</span>
            </div>
        </div>
    `;
};

const updatePriceRange = (changedInput) => {
    const minInput = priceFilterEl.querySelector('#minPriceFilter');
    const maxInput = priceFilterEl.querySelector('#maxPriceFilter');
    let minPrice = Number(minInput.value);
    let maxPrice = Number(maxInput.value);

    if (minPrice > maxPrice) {
        if (changedInput === minInput) {
            minPrice = maxPrice;
            minInput.value = String(minPrice);
        } else {
            maxPrice = minPrice;
            maxInput.value = String(maxPrice);
        }
    }

    priceFilterEl.querySelector('#minPriceValue').textContent = `$${minPrice.toFixed(2)}`;
    priceFilterEl.querySelector('#maxPriceValue').textContent = `$${maxPrice.toFixed(2)}`;

    const rangeStart = Number(minInput.min);
    const rangeSize = Number(minInput.max) - rangeStart;
    const left = rangeSize === 0 ? 0 : ((minPrice - rangeStart) / rangeSize) * 100;
    const right = rangeSize === 0 ? 100 : ((maxPrice - rangeStart) / rangeSize) * 100;
    const selectedRange = priceFilterEl.querySelector('#priceRangeSelected');
    selectedRange.style.left = `${left}%`;
    selectedRange.style.width = `${right - left}%`;

    applyFilters();
};

const applyFilters = () => {
    const selectedCategories = [...categoryFilterEl.querySelectorAll('input[type="checkbox"]:checked')]
        .map((checkbox) => checkbox.value);
    const minValue = priceFilterEl.querySelector('#minPriceFilter').value;
    const maxValue = priceFilterEl.querySelector('#maxPriceFilter').value;
    const minPrice = minValue === '' ? -Infinity : Number(minValue);
    const maxPrice = maxValue === '' ? Infinity : Number(maxValue);
    const selectedRating = ratingFilterEl.querySelector('input[name="ratingFilter"]:checked');
    const ratingRange = selectedRating ? getRatingRange(Number(selectedRating.value)) : null;

    const filteredProducts = allProducts.filter((product) => {
        const matchesCategory = selectedCategories.length === 0
            || selectedCategories.includes(product.category);
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        const displayedRating = Math.round(product.rating * 10) / 10;
        const matchesRating = !ratingRange
            || (displayedRating >= ratingRange[0] && displayedRating <= ratingRange[1]);

        return matchesCategory && matchesPrice && matchesRating;
    });

    showProducts(filteredProducts);
};

categoryFilterEl.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="checkbox"]')) {
        return;
    }

    applyFilters();
});

ratingFilterEl.addEventListener('change', (event) => {
    if (!event.target.matches('input[name="ratingFilter"]')) {
        return;
    }

    applyFilters();
});

priceFilterEl.addEventListener('input', (event) => {
    if (event.target.matches('input[type="range"]')) {
        updatePriceRange(event.target);
    }
});

const renderRating = (rating) => {
    const value = Math.round(Math.min(5, Math.max(0, Number(rating) || 0)) * 10) / 10;
    const percentage = (value / 5) * 100;

    return `
        <div class="product-rating">
            <span class="rating-stars" role="img" aria-label="Rating: ${value} out of 5" style="--rating: ${percentage}%">★★★★★</span>
            <span>( ${value} )</span>
        </div>
    `;
};

const showProducts = (products) => {
    if (resultsCountEl) {
        resultsCountEl.textContent = `${products.length} products`;
    }

    if (products.length === 0) {
        productsGridEl.innerHTML = '<p class="muted">No products match these filters.</p>';
        return;
    }

    productsGridEl.innerHTML = products.map((product) => {

        return `
            <div class="product-card">
                <img src="${product.thumbnail}" width="150">

                <h3>${product.title}</h3>
                
                <p>${renderRating(product.rating)}</p>

                <p class="product-Description">${product.description}</p>
                <br>
                <p>Category: ${product.category}</p>
                <br>
                <div class="product-title-row">
                    <h3>Price: $${product.price}</h3>
                    <button class="icon-button add-to-cart-btn" type="button" aria-label="Add ${product.title} to cart" title="Add to cart">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </button>
                </div>

            </div>
        `;

    }).join('');

};

getProduct();







// // Pagination navigation API (used by inline onclicks)
// window.goToPage = (page) => {
//     currentPage = page;
//     renderAll();
// };

// const renderAll = () => {
//     renderCategoryFilter();
//     renderPriceFilter();
//     renderRatingFilter();
//     renderAppliedFilters();
//     renderProducts();
// };

// // Event Listeners
// sortSelectEl.addEventListener('change', (e) => {
//     sortBy = e.target.value;
//     currentPage = 1;
//     renderAll();
// });

// if (itemsPerPageSelectEl) {
//     itemsPerPageSelectEl.addEventListener('change', (e) => {
//         const value = parseInt(e.target.value, 10);
//         itemsPerPage = isNaN(value) ? 8 : value;
//         currentPage = 1;
//         renderAll();
//     });
// }

// // Initialize
// document.addEventListener('DOMContentLoaded', () => {
//     // initialize controls
//     if (itemsPerPageSelectEl) {
//         itemsPerPageSelectEl.value = String(itemsPerPage);
//     }
//     // init theme from localStorage or prefers-color-scheme
//     const savedTheme = localStorage.getItem('theme');
//     const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
//     if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
//         document.body.classList.add('theme-light');
//         if (themeIconEl) themeIconEl.textContent = '🌚';
//     } else {
//         document.body.classList.remove('theme-light');
//         if (themeIconEl) themeIconEl.textContent = '🌙';
//     }
//     renderAll();
// });

// Theme toggle
if (themeToggleEl) {
    themeToggleEl.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('theme-light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        if (themeIconEl) themeIconEl.textContent = isLight ? '🌚' : '🌙';
    });
}