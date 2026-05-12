/**
 * ============================================
   LUMORA — CART UI
 * ============================================
 * 
 * Keranjang belanja UI:
 * - qtyHTML() → generate tombol +/- atau "Tambah"
 * - patchQty() → update qty di product card
 * - patchBadge() → update angka badge FAB
 * - renderCart() → render daftar item di cart sheet
 * - openCart() → buka cart bottom sheet
 * - closeCart() → tutup cart bottom sheet
 * 
 * Product rendering:
 * - renderCats() → render bar kategori horizontal
 * - renderCard() → generate HTML satu product card
 * - renderProds() → render grid produk
 */

import {

    state,
    FALLBACK_IMG,
    SVG_MI,
    SVG_PL,
    fmt,
    findCart,
    cartQty

} from '../utils.js';

import { subTotal } from '../services/cart.service.js';

import { lock, unlock } from './loading.js';


/* =========================================================
   QTY HTML
======================================================== */

export function qtyHTML(
    pid,
    qty
) {

    if (qty > 0) {

        return `
            <div class="flex items-center justify-between bg-blue-50 rounded-xl p-0.5">

                <button
                    data-cm="${pid}"
                    class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center"
                >
                    ${SVG_MI}
                </button>

                <span class="font-bold text-blue-600 text-base">
                    ${qty}
                </span>

                <button
                    data-cp="${pid}"
                    class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
                >
                    ${SVG_PL}
                </button>

            </div>
        `;
    }

    return `
        <button
            data-cp="${pid}"
            class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
            + Tambah
        </button>
    `;
}


/* =========================================================
   PATCH QTY
======================================================== */

export function patchQty(pid) {

    const el =
        document.getElementById(
            'pq-' + pid
        );

    if (!el) return;

    const f =
        findCart(pid);

    el.innerHTML =
        qtyHTML(
            pid,
            f ? f.it.qty : 0
        );
}


/* =========================================================
   PATCH BADGE
======================================================== */

export function patchBadge() {

    const badge =
        document.getElementById(
            'cbadge'
        );

    const fab =
        document.getElementById(
            'fab-cart'
        );

    if (!badge || !fab)
        return;

    const total =
        state.cart.reduce(

            (sum, item) =>
                sum + item.qty,

            0
        );

    badge.textContent =
        total;

    if (total > 0) {

        fab.classList.remove(
            'hidden'
        );

    } else {

        fab.classList.add(
            'hidden'
        );
    }
}


/* =========================================================
   RENDER CATEGORIES
======================================================== */

export function renderCats(categories) {

    if (!state.d.catbar)
        return;

    const cats =
        categories || [];

    let h = '';

    for (let i = 0; i < cats.length; i++) {

        const c =
            cats[i];

        const on =
            state.selCat === c.id;

        h += `
            <div
                data-cat="${c.id}"
                class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                style="min-width:56px"
            >

                <div class="
                    rounded-full
                    overflow-hidden
                    border-2
                    ${on ? 'border-blue-500' : 'border-slate-100'}
                "
                style="width:52px;height:52px">

                    <img
                        src="${c.image}"
                        class="w-full h-full object-cover"
                    >

                </div>

                <span class="
                    text-[10px]
                    font-semibold
                    ${on ? 'text-blue-600' : 'text-slate-400'}
                ">
                    ${c.name}
                </span>

            </div>
        `;
    }

    state.d.catbar.innerHTML = h;
}


/* =========================================================
   RENDER PRODUCT CARD
======================================================== */

export function renderCard(
    prod,
    isSearch
) {

    const pre =
        isSearch
            ? 'sq'
            : 'pq';

    const f =
        findCart(prod.id);

    const qty =
        f ? f.it.qty : 0;

    return `
        <div class="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">

            <div class="aspect-square bg-slate-100 overflow-hidden">

                <img
                    src="${prod.image}"
                    alt="${prod.name}"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${FALLBACK_IMG}'"
                >

            </div>

            <div class="p-2.5">

                <h3 class="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug">
                    ${prod.name}
                </h3>

                <p class="text-blue-600 font-bold text-xs mt-1">
                    ${fmt(prod.price)}
                </p>

                <div
                    id="${pre}-${prod.id}"
                    class="mt-1.5"
                >
                    ${qtyHTML(prod.id, qty, isSearch)}
                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   RENDER PRODUCTS
======================================================== */

export function renderProds(products) {

    if (
        !state.d.pcnt ||
        !state.d.pgrid
    ) {

        console.warn(
            'product DOM missing'
        );

        return;
    }

    const list =
        products || [];

    state.d.pcnt.textContent =
        list.length + ' item';

    if (!list.length) {

        state.d.pgrid.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <p class="text-xs text-slate-400">
                    Tidak ada produk
                </p>
            </div>
        `;

        return;
    }

    let h = '';

    for (let i = 0; i < list.length; i++) {

        h += renderCard(
            list[i],
            false
        );
    }

    state.d.pgrid.innerHTML = h;
}


/* =========================================================
   RENDER CART
======================================================== */

export function renderCart() {

    if (
        !state.d.ccnt ||
        !state.d.clist ||
        !state.d.cnone ||
        !state.d.cft ||
        !state.d.ctotal
    ) {

        console.warn(
            'renderCart DOM missing'
        );

        return;
    }

    const cnt =
        cartQty();

    state.d.ccnt.textContent =
        cnt + ' item';

    if (!state.cart.length) {

        state.d.clist.classList.add(
            'hidden'
        );

        state.d.cnone.classList.remove(
            'hidden'
        );

        state.d.cft.classList.add(
            'hidden'
        );

        return;
    }

    state.d.clist.classList.remove(
        'hidden'
    );

    state.d.cnone.classList.add(
        'hidden'
    );

    state.d.cft.classList.remove(
        'hidden'
    );

    let h = '';

    for (let i = 0; i < state.cart.length; i++) {

        const it =
            state.cart[i];

        h += `
            <div class="flex gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100">

                <img
                    src="${it.image}"
                    class="w-14 h-14 rounded-lg object-cover bg-white"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${FALLBACK_IMG}'"
                >

                <div class="flex-1 min-w-0">

                    <p class="text-xs font-medium text-slate-800 line-clamp-2">
                        ${it.name}
                    </p>

                    <p class="text-blue-600 font-bold text-xs mt-0.5">
                        ${fmt(it.price)}
                    </p>

                    <div class="flex items-center gap-1.5 mt-1">

                        <button
                            data-cm="${it.id}"
                            class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                        >
                            ${SVG_MI}
                        </button>

                        <span class="text-xs font-semibold w-5 text-center text-slate-800">
                            ${it.qty}
                        </span>

                        <button
                            data-cp="${it.id}"
                            class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center"
                        >
                            ${SVG_PL}
                        </button>

                    </div>

                </div>

                <button
                    data-cr="${it.id}"
                    class="text-red-300 self-start p-0.5"
                >
                    ${SVG_TR}
                </button>

            </div>
        `;
    }

    state.d.clist.innerHTML = h;

    state.d.ctotal.textContent =
        fmt(subTotal());
}


/* =========================================================
   CART OPEN/CLOSE
======================================================== */

export function openCart() {

    if (
        !state.d.csheet ||
        !state.d.dim
    ) {

        console.warn(
            'cart sheet missing'
        );

        return;
    }

    state.d.dim.classList.remove(
        'hidden'
    );

    state.d.csheet.classList.remove(
        'translate-y-full'
    );

    lock();
}

export function closeCart() {

    if (
        !state.d.csheet ||
        !state.d.dim
    ) {

        console.warn(
            'cart sheet missing'
        );

        return;
    }

    state.d.dim.classList.add(
        'hidden'
    );

    state.d.csheet.classList.add(
        'translate-y-full'
    );

    unlock();
}