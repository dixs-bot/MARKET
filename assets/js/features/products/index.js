/**
 * ============================================
 * LUMORA — PRODUCTS BARREL
 * ============================================
 * 
 * File ini TIDAK mengandung logic.
 * Hanya re-export dari sub-modules agar
 * import dari luar tidak perlu berubah.
 * 
 * bootstrap.js dan categories/index.js
 * tetap import dari sini.
 */

export {
    handleClick
} from './events.js';

export {
    renderFilteredProducts
} from './render.js';

export {
    loadMoreProducts,
    initInfiniteScroll
} from './pagination.js';

export {
    initSearchListener
} from './search.js';

export {
    buildFilteredProducts,
    getFilteredProducts,
    getSelectedStoreId,
    getTotalFiltered
} from './filter.js';
