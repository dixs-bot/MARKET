/**
 * ============================================
 * LUMORA — BOOTSTRAP
 * ============================================
 * 
 * Entry point utama aplikasi.
 * Menjalankan semua init dalam urutan yang benar.
 * 
 * URUTAN EKSEKUSI:
 * 1. cache()             → DOM cache dasar dari ui.js
 * 2. DOM cache manual    → Cache elemen ke state.d
 * 3. Supabase sync       → Products & categories
 * 4. loadStoreFilter     → Populate dropdown cabang
 * 5. initInputListeners  → Form input events
 * 6. initStoreSwitch     → Cabang change handler
 * 7. initInfiniteScroll  → Scroll pagination
 * 8. initGlobalClicks    → Delegated click handler
 * 9. Initial renders     → Categories, products, cart
 * 10. Saved page restore → Checkout atau home
 */

import { state } from '../utils.js';

import {
    reconcileCart
} from '../services.js';

import {
    renderCart
} from '../renderers.js';

import {
    cache,
    patchBadge
} from '../ui.js';

import { go as navTo } from './router.js';

import {
    handleClick as productsClick,
    renderFilteredProducts,
    initInfiniteScroll
} from '../features/products/index.js';

import {
    handleClick as categoriesClick,
    renderFilteredCategories,
    loadStoreFilter
} from '../features/categories/index.js';

import {
    handleClick as cartClick
} from '../features/cart/index.js';

import {
    handleClick as checkoutClick,
    goToCheckout,
    goToHome
} from '../features/checkout/index.js';


/* ============================================================
   INPUT LISTENERS
============================================================ */

function initInputListeners() {

    if (state.d.inphone) {

        state.d.inphone
            .addEventListener(

                'input',

                function () {

                    this.value =
                        this.value.replace(
                            /[^0-9]/g,
                            ''
                        );

                    validate(false);
                }
            );
    }

    if (state.d.inname) {

        state.d.inname
            .addEventListener(

                'input',

                function () {

                    validate(false);
                }
            );
    }

    if (state.d.inaddr) {

        state.d.inaddr
            .addEventListener(

                'input',

                function () {

                    validate(false);
                }
            );
    }

    if (state.d.insearch) {

        state.d.insearch
            .addEventListener(

                'input',

                function () {

                    clearTimeout(
                        searchTimer
                    );

                    searchTimer =
                        setTimeout(

                            function () {

                                renderFilteredProducts(
                                    true
                                );

                            },

                            250
                        );
                }
            );
    }
}

/* ============================================================
   VALIDATE IMPORT (dari services.js)
============================================================ */

let validate;

async function importValidate() {

    const mod =
        await import('../services.js');

    validate = mod.validate;
}

/* ============================================================
   STORE SWITCH
============================================================ */

function initStoreSwitch() {

    const storeSelect =
        document.getElementById(
            'store-filter'
        );

    if (!storeSelect)
        return;

    storeSelect.addEventListener(

        'change',

        function () {

            localStorage.setItem(

                'lumora_selected_store',

                this.value
            );

            state.selCat = '';

            reconcileCart();

            renderFilteredCategories();

            renderFilteredProducts(
                true
            );

            renderCart();

            patchBadge();
        }
    );
}


/* ============================================================
   GLOBAL CLICK HANDLER
   Delegasi ke feature modules secara berurutan.
   Return true = sudah ditangani, stop propagasi.
============================================================ */

function initGlobalClicks() {

    document.addEventListener(
        'click',

        async function (e) {

            /* =========================
               PRODUCTS
            ========================= */

            if (productsClick(e)) {

                return;
            }

            /* =========================
               CATEGORIES
            ========================= */

            if (categoriesClick(e)) {

                return;
            }

            /* =========================
               CART
            ========================= */

            if (cartClick(e)) {

                return;
            }

            /* =========================
               CHECKOUT
            ========================= */

            if (checkoutClick(e)) {

                return;
            }

            /* =========================
               NAVIGATION
               (handled here di router)
            ========================= */

            const navEl =
                e.target.closest(
                    '[data-nav]'
                );

            if (navEl) {

                navTo(
                    navEl.dataset.nav
                );

                return;
            }
        }
    );
}


/* ============================================================
   MAIN INIT
============================================================ */

async function init() {

    /* ========================================================
       DOM CACHE DASAR (dari ui.js)
    ======================================================== */

    cache();

    /* ========================================================
       DOM CACHE MANUAL ke state.d
    ======================================================== */

    state.d.inname =
        document.getElementById(
            'inname'
        );

    state.d.inphone =
        document.getElementById(
            'inphone'
        );

    state.d.inaddr =
        document.getElementById(
            'inaddr'
        );

    state.d.innote =
        document.getElementById(
            'innote'
        );

    state.d.insearch =
        document.getElementById(
            'insearch'
        );

    state.d.pgrid =
        document.getElementById(
            'pgrid'
        );

    state.d.pcnt =
        document.getElementById(
            'pcnt'
        );

    state.d.catbar =
        document.getElementById(
            'catbar'
        );

    state.d.sres =
        document.getElementById(
            'sres'
        );

    state.d.csheet =
        document.getElementById(
            'csheet'
        );

    state.d.dim =
        document.getElementById(
            'dim'
        );

    state.d.pgco =
        document.getElementById(
            'pgco'
        );

    state.d.pginv =
        document.getElementById(
            'pginv'
        );

    state.d.mconf =
        document.getElementById(
            'mconf'
        );

    state.d.mload =
        document.getElementById(
            'mload'
        );

    state.d.coscroll =
        document.getElementById(
            'coscroll'
        );

    state.d.btnOrder =
        document.getElementById(
            'btn-order'
        );

    state.d.hint =
        document.getElementById(
            'hint'
        );

    state.d.vlbl =
        document.getElementById(
            'vlbl'
        );

    state.d.shiplist =
        document.getElementById(
            'shiplist'
        );

    state.d.paylist =
        document.getElementById(
            'paylist'
        );

    state.d.coitems =
        document.getElementById(
            'co-items'
        );

    state.d.ctotal =
        document.getElementById(
            'ctotal'
        );

    state.d.ccnt =
        document.getElementById(
            'ccnt'
        );

    state.d.clist =
        document.getElementById(
            'clist'
        );

    state.d.cbadge =
        document.getElementById(
            'cbadge'
        );

    state.d.cnone =
        document.getElementById(
            'cnone'
        );

    state.d.cft =
        document.getElementById(
            'cft'
        );

    /* ========================================================
       IMPORT VALIDATE (diperlukan oleh initInputListeners)
    ======================================================== */

    await importValidate();

    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    const MM =
        window.MiniMarket;

    await MM.syncProductsFromSupabase();

    await MM.syncCategoriesFromSupabase();

    await loadStoreFilter();

    initInputListeners();

    initStoreSwitch();

    initInfiniteScroll();

    initGlobalClicks();

    reconcileCart();

    renderFilteredCategories();

    renderFilteredProducts(
        true
    );

    renderCart();

    patchBadge();

    /* ========================================================
       RESTORE SAVED PAGE
    ======================================================== */

    const savedPage =
        localStorage.getItem(
            'lumora_page'
        );

    if (
        savedPage === 'checkout' &&
        state.cart.length
    ) {

        goToCheckout();

    } else {

        goToHome();
    }
}


/* ============================================================
   AUTO INIT
============================================================ */

function start() {

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();
    }
}

export default { start };