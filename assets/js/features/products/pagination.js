/**
 * ============================================
 * LUMORA — PRODUCTS PAGINATION
 * ============================================
 * 
 * Menangani pagination:
 * - loadMoreProducts()
 * - initInfiniteScroll()
 * 
 * Membaca state dari filter.js,
 * memanggil render dari render.js.
 */

import {

    getFilteredProducts,
    incrementPage,
    getCurrentPage,
    getPage

} from './filter.js';

import {
    renderFilteredProducts
} from './render.js';


/* ============================================================
   LOAD MORE PRODUCTS
   Tambah currentPage lalu re-render
============================================================ */

function loadMoreProducts() {

    const total =
        getFilteredProducts().length;

    const visible =
        getCurrentPage() *
        getPage();

    if (
        visible >= total
    ) {

        return;
    }

    incrementPage();

    renderFilteredProducts();
}


/* ============================================================
   INFINITE SCROLL
   Auto-load more saat scroll mendekati bawah
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


export {
    loadMoreProducts,
    initInfiniteScroll
};
