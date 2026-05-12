/**
 * ============================================
 * LUMORA — PRODUCTS FEATURE
 * ============================================
 * 
 * Menangani produk:
 * - Fetch produk dari Supabase (via MiniMarket)
 * - Filter berdasarkan kategori
 * - Filter berdasarkan cabang (store)
 * - Search produk
 * - Render product grid
 * - Pagination (load more on scroll)
 * - Search overlay open/close
 */

import { state } from '../../utils.js';

import {
    renderProds
} from '../../renderers.js';


/* ============================================================
   PERFORMANCE STATE
============================================================ */

const PAGE_SIZE =
    20;

let renderQueue =
    false;

let currentPage =
    1;

let filteredProducts =
    [];

let searchTimer =
    null;


/* ============================================================
   HELPERS
============================================================ */

function getSelectedStoreId() {

    return (
        document.getElementById(
            'store-filter'
        )?.value || null
    );
}

function getPaginatedProducts() {

    const end =
        currentPage *
        PAGE_SIZE;

    return filteredProducts.slice(
        0,
        end
    );
}

function queueRender(callback) {

    if (renderQueue)
        return;

    renderQueue = true;

    requestAnimationFrame(() => {

        try {

            callback();

        } finally {

            renderQueue = false;
        }
    });
}


/* ============================================================
   PRODUCT FILTERING
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

    products =
        products.filter(product =>

            product.store_id ===
            selectedStoreId
        );

    if (state.selCat) {

        products =
            products.filter(product =>

                product.category ===
                state.selCat
            );
    }

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
   PRODUCT RENDER
============================================================ */

function renderFilteredProducts(
    resetPage = false
) {

    if (resetPage) {

        currentPage = 1;
    }

    buildFilteredProducts();

    queueRender(() => {

        const selectedStoreId =
            getSelectedStoreId();

        if (!selectedStoreId) {

            if (state.d.pgrid) {

                state.d.pgrid.innerHTML = `

                    <div class="
                        col-span-2
                        text-center
                        py-16
                    ">

                        <p class="
                            text-sm
                            text-slate-400
                            font-medium
                        ">
                            Pilih cabang terlebih dahulu
                        </p>

                    </div>
                `;
            }

            if (state.d.pcnt) {

                state.d.pcnt.textContent =
                    '0 item';
            }

            return;
        }

        const visible =
            getPaginatedProducts();

        renderProds(visible);
    });
}


/* ============================================================
   LOAD MORE
============================================================ */

function loadMoreProducts() {

    const total =
        filteredProducts.length;

    const visible =
        currentPage *
        PAGE_SIZE;

    if (
        visible >= total
    ) {

        return;
    }

    currentPage++;

    renderFilteredProducts();
}


/* ============================================================
   SCROLL PAGINATION
============================================================ */

function initInfiniteScroll() {

    window.addEventListener(

        'scroll',

        function () {

            const nearBottom =

                window.innerHeight +

                window.scrollY >=

                document.body.offsetHeight - 600;

            if (nearBottom) {

                loadMoreProducts();
            }
        }
    );
}


/* ============================================================
   CLICK HANDLER
   Menangani click events terkait produk & search.
   Return true jika click ditangani di sini.
============================================================ */

function handleClick(e) {

    let el;

    /* =========================
       OPEN SEARCH
    ========================= */

    el = e.target.closest(
        "[data-act='open-search']"
    );

    if (el) {

        const pgSearch =
            document.getElementById(
                'pg-search'
            );

        if (!pgSearch)
            return true;

        pgSearch.classList.remove(
            'hidden'
        );

        const inputSearch =
            document.getElementById(
                'insearch'
            );

        if (inputSearch) {

            setTimeout(() => {

                inputSearch.focus();

            }, 100);
        }

        return true;
    }

    /* =========================
       CLOSE SEARCH
    ========================= */

    el = e.target.closest(
        "[data-act='close-search']"
    );

    if (el) {

        const pgSearch =
            document.getElementById(
                'pg-search'
            );

        if (pgSearch) {

            pgSearch.classList.add(
                'hidden'
            );
        }

        return true;
    }

    /* =========================
       TIDAK DITANGANI DI SINI
    ========================= */

    return false;
}


export {
    handleClick,
    renderFilteredProducts,
    buildFilteredProducts,
    loadMoreProducts,
    initInfiniteScroll
};