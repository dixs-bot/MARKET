import { state } from './utils.js';

import {

    addCart,
    delCart,
    selShip,
    selPay,
    selVou,
    validate,
    resetCO,
    goToInvoice,
    cancelOrder,
    reconcileCart

} from './services.js';

import {

    renderCats,
    renderProds,
    renderCart

} from './renderers.js';

import {

    cache,
    notify,
    patchBadge,
    renderShips,
    renderPays,
    renderSummary,
    renderInv,
    renderOrders,
    openCart,
    closeCart,
    openVou,
    closeVou,
    lock,
    unlock,
    animateIn

} from './ui.js';

const MM =
    window.MiniMarket;


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
   NAVIGATION
============================================================ */

function navTo(pageName) {

    const pages =
        document.querySelectorAll(
            '.page'
        );

    pages.forEach(page => {

        page.classList.remove(
            'on'
        );
    });

    const page =
        document.getElementById(
            'pg-' + pageName
        );

    if (page) {

        page.classList.add(
            'on'
        );
    }

    const navButtons =
        document.querySelectorAll(
            '[data-nav]'
        );

    navButtons.forEach(button => {

        const active =

            button.getAttribute(
                'data-nav'
            ) === pageName;

        button.classList.toggle(
            'text-blue-600',
            active
        );

        button.classList.toggle(
            'text-slate-400',
            !active
        );
    });

    if (
        pageName ===
        'history'
    ) {

        renderOrders();
    }

    window.scrollTo(0, 0);
}


/* ============================================================
   PAGE FLOW
============================================================ */

function goToHome() {

    if (state.d.pginv) {

        state.d.pginv.classList.add(
            'hidden'
        );
    }

    unlock();

    state.currentPage =
        'home';

    state.curOrder =
        null;

    navTo('home');
}

function goToCheckout() {

    reconcileCart();

    if (!state.cart.length) {

        notify(
            'Keranjang kosong'
        );

        return;
    }

    if (state.d.csheet) {

        state.d.csheet.classList.remove(
            'open'
        );
    }

    if (state.d.dim) {

        state.d.dim.classList.remove(
            'on'
        );
    }

    if (
        state.lockCnt === 0
    ) {

        lock();
    }

    renderShips();

    renderPays();

    renderSummary();

    validate(false);

    if (state.d.pgco) {

        state.d.pgco.classList.remove(
            'hidden'
        );

        animateIn(
            state.d.pgco
        );
    }

    state.currentPage =
        'checkout';
}

function goToConfirm() {

    if (
        !validate(true)
    ) {

        notify(
            'Lengkapi data!'
        );

        return;
    }

    if (state.d.mconf) {

        state.d.mconf.classList.remove(
            'hidden'
        );
    }

    state.currentPage =
        'confirm';
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
   CATEGORY RENDER
============================================================ */

function renderFilteredCategories() {

    const selectedStoreId =
        getSelectedStoreId();

    if (!selectedStoreId) {

        if (state.d.catbar) {

            state.d.catbar.innerHTML =
                '';
        }

        return;
    }

    const categories =
        MM.getCategories();

    const filtered =
        categories.filter(category =>

            category.store_id ===
            selectedStoreId
        );

    renderCats(filtered);
}


/* ============================================================
   STORE FILTER
============================================================ */

async function loadStoreFilter() {

    const {

        data,
        error

    } =

    await window.supabaseClient

        .from('stores')

        .select('*')

        .order('name');

    if (error) {

        console.error(error);

        return;
    }

    const select =
        document.getElementById(
            'store-filter'
        );

    if (!select)
        return;

    select.innerHTML = `

        <option value="">
            Pilih Cabang
        </option>
    `;

    data.forEach(store => {

        select.innerHTML += `

            <option value="${store.id}">
                ${store.name}
            </option>
        `;
    });

    const savedStoreId =
        localStorage.getItem(
            'lumora_selected_store'
        );

    if (savedStoreId) {

        select.value =
            savedStoreId;
    }
}


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
   GLOBAL CLICK
============================================================ */

function initGlobalClicks() {

    document.addEventListener(

        'click',

        async function (e) {

            let el;

            el = e.target.closest(
                '[data-a]'
            );

            if (el) {

                addCart(
                    el.dataset.a,
                    1
                );

                return;
            }

            el = e.target.closest(
                '[data-m]'
            );

            if (el) {

                addCart(
                    el.dataset.m,
                    -1
                );

                return;
            }

            el = e.target.closest(
                '[data-cr]'
            );

            if (el) {

                delCart(
                    el.dataset.cr
                );

                return;
            }

            el = e.target.closest(
                '[data-cat]'
            );

            if (el) {

                state.selCat =
                    el.dataset.cat;

                renderFilteredProducts(
                    true
                );

                renderFilteredCategories();

                return;
            }

            el = e.target.closest(
                '[data-nav]'
            );

            if (el) {

                navTo(
                    el.dataset.nav
                );

                return;
            }

            if (
                e.target.closest(
                    '#fab-cart'
                )
            ) {

                openCart();

                return;
            }

            if (
                e.target.closest(
                    "[data-act='close-cart']"
                )
            ) {

                closeCart();

                return;
            }

            if (
                e.target.closest(
                    "[data-act='checkout']"
                )
            ) {

                goToCheckout();

                return;
            }

            if (
                e.target.closest(
                    '#btn-order'
                )
            ) {

                goToConfirm();

                return;
            }

            if (
                e.target.closest(
                    "[data-act='do-co']"
                )
            ) {

                goToInvoice();

                return;
            }
        }
    );
}


/* ============================================================
   INIT
============================================================ */

async function init() {

    cache();

    /* ========================================================
       DOM CACHE
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
       INITIAL LOAD
    ======================================================== */

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

    navTo('home');

    state.currentPage =
        'home';
}


/* ============================================================
   AUTO INIT
============================================================ */

document.addEventListener(

    'DOMContentLoaded',

    init
);
