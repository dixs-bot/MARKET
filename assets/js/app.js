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

    cache,
    notify,
    patchBadge,
    renderCats,
    renderProds,
    renderCart,
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

    state.d.pginv.classList.add(
        'hidden'
    );

    unlock();

    state.currentPage =
        'home';

    state.curOrder =
        null;

    navTo('home');
}

function goToCart() {

    renderCart();

    state.d.csheet.classList.add(
        'open'
    );

    state.d.dim.classList.add(
        'on'
    );

    state.currentPage =
        'cart';
}

function goToCheckout() {

    reconcileCart();

    if (!state.cart.length) {

        notify(
            'Keranjang kosong'
        );

        return;
    }

    state.d.csheet.classList.remove(
        'open'
    );

    state.d.dim.classList.remove(
        'on'
    );

    if (
        state.lockCnt === 0
    ) {

        lock();
    }

    renderShips();

    renderPays();

    renderSummary();

    validate(false);

    state.d.pgco.classList.remove(
        'hidden'
    );

    animateIn(
        state.d.pgco
    );

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

    state.d.mconf.classList.remove(
        'hidden'
    );

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
        state.d.insearch.value
            .trim()
            .toLowerCase();

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

            state.d.pcnt.textContent =
                '0 item';

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

        state.d.catbar.innerHTML =
            '';

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

    state.d.inname
        .addEventListener(

            'input',

            function () {

                validate(false);
            }
        );

    state.d.inaddr
        .addEventListener(

            'input',

            function () {

                validate(false);
            }
        );

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
