/**
 * ============================================
 * LUMORA — BOOTSTRAP
 * ============================================
 */

import { state } from '../utils.js';

import { reconcileCart } from '../services/cart.service.js';

import { validate } from '../services/validation.service.js';

import { renderCart } from '../renderers.js';

import { cache, patchBadge } from '../ui.js';

import { go as navTo } from './router.js';

import {
    handleClick as productsClick,
    renderFilteredProducts,
    initInfiniteScroll,
    initSearchListener
} from '../features/products/index.js';

import {
    handleClick as categoriesClick,
    renderFilteredCategories,
    loadStoreFilter
} from '../features/categories/index.js';

import { handleClick as cartClick } from '../features/cart/index.js';

import {
    handleClick as checkoutClick,
    goToCheckout,
    goToHome
} from '../features/checkout/index.js';


/* ============================================================
   INPUT LISTENERS
   NOTE: Search listener dipindah ke products/search.js
   Dipanggil via initSearchListener() di bawah
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
============================================================ */

function initGlobalClicks() {

    document.addEventListener(
        'click',

        async function (e) {

            if (productsClick(e)) return;
            if (categoriesClick(e)) return;
            if (cartClick(e)) return;
            if (checkoutClick(e)) return;

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

    cache();

    /* ========================================================
       DOM CACHE MANUAL ke state.d
    ======================================================== */

    state.d.inname =
        document.getElementById('inname');

    state.d.inphone =
        document.getElementById('inphone');

    state.d.inaddr =
        document.getElementById('inaddr');

    state.d.innote =
        document.getElementById('innote');

    state.d.insearch =
        document.getElementById('insearch');

    state.d.pgrid =
        document.getElementById('pgrid');

    state.d.pcnt =
        document.getElementById('pcnt');

    state.d.catbar =
        document.getElementById('catbar');

    state.d.sres =
        document.getElementById('sres');

    state.d.csheet =
        document.getElementById('csheet');

    state.d.dim =
        document.getElementById('dim');

    state.d.pgco =
        document.getElementById('pgco');

    state.d.pginv =
        document.getElementById('pginv');

    state.d.mconf =
        document.getElementById('mconf');

    state.d.mload =
        document.getElementById('mload');

    state.d.coscroll =
        document.getElementById('coscroll');

    state.d.btnOrder =
        document.getElementById('btn-order');

    state.d.hint =
        document.getElementById('hint');

    state.d.vlbl =
        document.getElementById('vlbl');

    state.d.shiplist =
        document.getElementById('shiplist');

    state.d.paylist =
        document.getElementById('paylist');

    state.d.coitems =
        document.getElementById('co-items');

    state.d.ctotal =
        document.getElementById('ctotal');

    state.d.ccnt =
        document.getElementById('ccnt');

    state.d.clist =
        document.getElementById('clist');

    state.d.cbadge =
        document.getElementById('cbadge');

    state.d.cnone =
        document.getElementById('cnone');

    state.d.cft =
        document.getElementById('cft');

    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    const MM = window.MiniMarket;

    await MM.syncProductsFromSupabase();

    await MM.syncCategoriesFromSupabase();

    await loadStoreFilter();

    initInputListeners();

    initSearchListener();

    initStoreSwitch();

    initInfiniteScroll();

    initGlobalClicks();

    reconcileCart();

    renderFilteredCategories();

    renderFilteredProducts(true);

    renderCart();

    patchBadge();

    /* ========================================================
       RESTORE SAVED PAGE
    ======================================================== */

    const savedPage =
        localStorage.getItem('lumora_page');

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
