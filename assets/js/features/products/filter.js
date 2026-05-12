/**
 * ============================================
 * LUMORA — PRODUCTS FILTER
 * ============================================
 * 
 * Base layer untuk produk:
 * - Menyimpan filteredProducts array
 * - Menyimpan currentPage & PAGE_SIZE
 * - getSelectedStoreId()
 * - buildFilteredProducts()
 * - getPaginatedProducts()
 * - Helper getter/setter
 */

import { state } from '../../utils.js';


/* ============================================================
   GLOBAL MINI MARKET
============================================================ */

const MM =
    window.MiniMarket;


/* ============================================================
   PERFORMANCE STATE
============================================================ */

let filteredProducts =
    [];

const PAGE_SIZE =
    20;

let currentPage =
    1;


/* ============================================================
   GET SELECTED STORE ID
============================================================ */

function getSelectedStoreId() {

    return (
        document.getElementById(
            'store-filter'
        )?.value || null
    );
}


/* ============================================================
   BUILD FILTERED PRODUCTS
   Filter berdasarkan:
   1. Store ID (cabang yang dipilih)
   2. Category (jika ada yang dipilih)
   3. Search keyword (jika ada di input)
============================================================ */

function buildFilteredProducts() {

    const selectedStoreId =
        getSelectedStoreId();

    if (!selectedStoreId) {

        filteredProducts = [];

        return;
    }

    let products =
        MM.getProducts();

    /* =========================
       FILTER BY STORE
    ========================= */

    products =
        products.filter(product =>

            product.store_id ===
            selectedStoreId
        );

    /* =========================
       FILTER BY CATEGORY
    ========================= */

    if (state.selCat) {

        products =
            products.filter(product =>

                product.category ===
                state.selCat
            );
    }

    /* =========================
       FILTER BY SEARCH KEYWORD
    ========================= */

    const keyword =

        state.d.insearch

            ? state.d.insearch.value
                .trim()
                .toLowerCase()

            : '';

    if (keyword) {

        products =
            products.filter(product =>

                product.name
                    .toLowerCase()
                    .includes(keyword)
            );
    }

    filteredProducts =
        products;
}


/* ============================================================
   GETTERS / SETTERS
============================================================ */

function getFilteredProducts() {

    return filteredProducts;
}

function setFilteredProducts(arr) {

    filteredProducts = arr;
}

function getTotalFiltered() {

    return filteredProducts.length;
}

function resetPage() {

    currentPage = 1;
}

function incrementPage() {

    currentPage++;
}

function getCurrentPage() {

    return currentPage;
}

function getPage() {

    return PAGE_SIZE;
}


/* ============================================================
   GET PAGINATED PRODUCTS
   Slice filteredProducts berdasarkan currentPage
============================================================ */

function getPaginatedProducts() {

    const end =
        currentPage *
        PAGE_SIZE;

    return filteredProducts.slice(
        0,
        end
    );
}


export {
    getSelectedStoreId,
    buildFilteredProducts,
    getFilteredProducts,
    setFilteredProducts,
    getTotalFiltered,
    resetPage,
    incrementPage,
    getCurrentPage,
    getPage,
    getPaginatedProducts
};
