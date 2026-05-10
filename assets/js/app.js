import { state, WA, fmt } from './utils.js';

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
    load,
    save

} from './services.js';

import {

    cache,
    notify,
    patchBadge,
    renderCats,
    renderCard,
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
    openSearch,
    closeSearch,
    lock,
    unlock,
    animateIn

} from './ui.js';

const MM = window.MiniMarket;


/* ============================================================
   NAVIGATION
============================================================ */

function navTo(pageName) {

    const pages =
        document.querySelectorAll('.page');

    pages.forEach(page => {

        page.classList.remove('on');
    });

    const page =
        document.getElementById(
            'pg-' + pageName
        );

    if (page) {

        page.classList.add('on');
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

    if (pageName === 'history') {

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

    state.d.pgco.classList.add(
        'hidden'
    );

    state.d.mconf.classList.add(
        'hidden'
    );

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

    if (state.lockCnt === 0) {

        lock();
    }

    if (
        state.currentPage !==
        'confirm'
    ) {

        resetCO();

        state.d.inaddr.value = '';

        state.d.innote.value = '';

        state.d.vlbl.textContent =
            'Opsional';

        state.d.eaddr.classList.add(
            'hidden'
        );

        state.d.eship.classList.add(
            'hidden'
        );

        state.d.epay.classList.add(
            'hidden'
        );

        state.d.inaddr.classList.remove(
            'err-input'
        );
    }

    renderShips();

    renderPays();

    renderSummary();

    validate(false);

    state.d.pgco.classList.remove(
        'hidden'
    );

    if (state.d.coscroll) {

        state.d.coscroll.scrollTop = 0;

        animateIn(
            state.d.coscroll
        );
    }

    state.currentPage =
        'checkout';
}

function goToConfirm() {

    if (!validate(true)) {

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

function backToCheckout() {

    state.d.mconf.classList.add(
        'hidden'
    );

    state.currentPage =
        'checkout';
}


/* ============================================================
   STORE HELPERS
============================================================ */

function getSelectedStoreId() {

    return (
        document.getElementById(
            'store-filter'
        )?.value || null
    );
}

function loadStoreCart(storeId) {

    try {

        const cartKey =
            MM.getCartStorageKey(
                storeId
            );

        const savedCart =
            localStorage.getItem(
                cartKey
            );

        state.cart =
            savedCart
                ? JSON.parse(savedCart)
                : [];

    } catch {

        state.cart = [];
    }

    renderCart();

    patchBadge();
}


/* ============================================================
   SEARCH
============================================================ */

function doSearch(query) {

    const selectedStoreId =
        getSelectedStoreId();

    if (!selectedStoreId) {

        state.d.sres.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <p class="text-xs text-slate-400">
                    Pilih cabang dulu
                </p>
            </div>
        `;

        return;
    }

    query =
        query
            .toLowerCase()
            .trim();

    if (!query) {

        state.d.sres.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <p class="text-xs text-slate-400">
                    Ketik untuk cari
                </p>
            </div>
        `;

        return;
    }

    const products =
        MM.getProducts();

    const results =
        products.filter(product => {

            if (
                product.store_id !==
                selectedStoreId
            ) {

                return false;
            }

            if (
                state.selCat &&
                product.category !==
                state.selCat
            ) {

                return false;
            }

            return (
                product.name
                    .toLowerCase()
                    .includes(query)
            );
        });

    if (!results.length) {

        state.d.sres.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <p class="text-xs text-slate-400">
                    Tidak ditemukan
                </p>
            </div>
        `;

        return;
    }

    state.d.sres.innerHTML =
        results
            .map(product =>
                renderCard(
                    product,
                    true
                )
            )
            .join('');
}


/* ============================================================
   FILTERED PRODUCTS
============================================================ */

function renderFilteredProducts() {

    const selectedStoreId =
        getSelectedStoreId();

    if (!selectedStoreId) {

        state.d.pgrid.innerHTML = `
            <div class="col-span-2 text-center py-16">
                <p class="text-sm text-slate-400 font-medium">
                    Pilih cabang terlebih dahulu
                </p>
            </div>
        `;

        state.d.pcnt.textContent =
            '0 item';

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

    renderProds(products);
}


/* ============================================================
   FILTERED CATEGORIES
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
    } = await window.supabaseClient

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

    if (!select) return;

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

                state.d.eaddr
                    .classList.add(
                        'hidden'
                    );

                state.d.inaddr
                    .classList.remove(
                        'err-input'
                    );

                validate(false);
            }
        );

    let searchTimer =
        null;

    state.d.insearch
        .addEventListener(

            'input',

            function () {

                clearTimeout(
                    searchTimer
                );

                const value =
                    this.value;

                searchTimer =
                    setTimeout(

                        function () {

                            doSearch(
                                value
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

    if (!storeSelect) {

        return;
    }

    storeSelect.addEventListener(

        'change',

        function () {

            const selectedStoreId =
                this.value;

            localStorage.setItem(

                'lumora_selected_store',

                selectedStoreId
            );

            state.selCat = '';

            state.d.insearch.value = '';

            state.d.sres.innerHTML =
                '';

            loadStoreCart(
                selectedStoreId
            );

            renderFilteredCategories();

            renderFilteredProducts();
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

            let el;

            /* cancel order */

            const cancelBtn =
                e.target.closest(
                    '[data-cancel]'
                );

            if (cancelBtn) {

                const id =
                    cancelBtn.dataset.cancel;

                const ok =
                    confirm(
                        'Batalkan pesanan ini?'
                    );

                if (!ok) return;

                const success =
                    await cancelOrder(id);

                if (!success) {

                    notify(
                        'Gagal membatalkan pesanan'
                    );

                    return;
                }

                state.orders.forEach(order => {

                    if (
                        String(order.id) ===
                        String(id)
                    ) {

                        order.status =
                            'cancelled';
                    }
                });

                notify(
                    'Pesanan dibatalkan'
                );

                renderOrders();

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

            el = e.target.closest('[data-a]');
            if (el) {
                addCart(el.dataset.a, 1);
                return;
            }

            el = e.target.closest('[data-m]');
            if (el) {
                addCart(el.dataset.m, -1);
                return;
            }

            el = e.target.closest('[data-cr]');
            if (el) {
                delCart(el.dataset.cr);
                return;
            }

            el = e.target.closest('[data-cat]');

            if (el) {

                state.selCat =
                    el.dataset.cat;

                renderFilteredCategories();

                renderFilteredProducts();

                return;
            }

            el = e.target.closest('[data-nav]');

            if (el) {

                navTo(el.dataset.nav);

                return;
            }

            if (
                e.target.closest('#fab-cart')
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
                    "[data-act='back-to-cart']"
                )
            ) {

                goToCart();

                return;
            }

            el = e.target.closest('[data-ship]');

            if (el) {

                selShip(
                    el.dataset.ship
                );

                return;
            }

            el = e.target.closest('[data-pay]');

            if (el) {

                selPay(
                    el.dataset.pay
                );

                return;
            }

            if (
                e.target.closest(
                    "[data-act='open-vou']"
                )
            ) {

                openVou();

                return;
            }

            if (
                e.target.closest(
                    "[data-act='close-vou']"
                )
            ) {

                closeVou();

                return;
            }

            el = e.target.closest('[data-vou]');

            if (el) {

                selVou(
                    parseInt(
                        el.dataset.vou,
                        10
                    )
                );

                return;
            }

            if (
                e.target.closest('#btn-order')
            ) {

                goToConfirm();

                return;
            }

            if (
                e.target.closest(
                    "[data-act='edit-order']"
                )
            ) {

                backToCheckout();

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

            if (
                e.target.closest('#btn-wa')
            ) {

                sendWA();

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

    state.d.inname =
        document.getElementById(
            'inname'
        );

    state.d.inphone =
        document.getElementById(
            'inphone'
        );

    await MM.syncProductsFromSupabase();

    await MM.syncCategoriesFromSupabase();

    await loadStoreFilter();

    initInputListeners();

    initStoreSwitch();

    initGlobalClicks();

    const selectedStoreId =
        getSelectedStoreId();

    if (selectedStoreId) {

        loadStoreCart(
            selectedStoreId
        );
    }

    renderFilteredCategories();

    renderFilteredProducts();

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
