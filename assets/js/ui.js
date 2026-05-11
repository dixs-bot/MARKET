import {
    state,
    FALLBACK_IMG,
    SHIPS,
    PAYS,
    VOUS,
    SVG_MI,
    SVG_PL,
    SVG_TR,
    fmt,
    findCart,
    cartQty
} from './utils.js';

import {
    subTotal
} from './services.js';


/* =========================================================
   DOM CACHE
========================================================= */

export function cache() {

    const g = (id) =>
        document.getElementById(id);

    state.d.dim = g('dim');

    state.d.csheet = g('csheet');
    state.d.clist = g('clist');
    state.d.cnone = g('cnone');
    state.d.cft = g('cft');
    state.d.ccnt = g('ccnt');
    state.d.ctotal = g('ctotal');

    state.d.fab = g('fab-cart');
    state.d.badge = g('cbadge');

    state.d.catbar = g('catbar');
    state.d.pgrid = g('pgrid');
    state.d.pcnt = g('pcnt');

    state.d.pgco = g('pgco');
    state.d.coscroll = g('coscroll');

    state.d.inaddr = g('inaddr');
    state.d.innote = g('innote');

    state.d.ships = g('shiplist');
    state.d.pays = g('paylist');

    state.d.coitems = g('co-items');

    state.d.ssub = g('s-sub');
    state.d.sship = g('s-ship');

    state.d.discr = g('s-disc-row');
    state.d.sdisc = g('s-disc');

    state.d.stotal = g('s-total');

    state.d.vlbl = g('vlbl');

    state.d.border = g('btn-order');
    state.d.hint = g('hint');

    state.d.mconf = g('mconf');
    state.d.mload = g('mload');

    state.d.pginv = g('pginv');
    state.d.invbody = g('inv-body');

    state.d.pgsearch = g('pg-search');
    state.d.insearch = g('insearch');
    state.d.sres = g('sres');

    state.d.olist = g('ord-list');
    state.d.oempty = g('ord-empty');

    state.d.toast = g('toast');
}


/* =========================================================
   LOCK
========================================================= */

export function lock() {

    if (!state.lockCnt) {

        document.body.style.overflow =
            'hidden';
    }

    state.lockCnt++;
}

export function unlock() {

    state.lockCnt =
        Math.max(
            0,
            state.lockCnt - 1
        );

    if (!state.lockCnt) {

        document.body.style.overflow =
            '';
    }
}


/* =========================================================
   PAGE ANIMATION
========================================================= */

export function animateIn(el) {

    if (!el) return;

    el.classList.remove('page-in');

    void el.offsetWidth;

    el.classList.add('page-in');
}


/* =========================================================
   TOAST
========================================================= */

export function notify(m) {

    if (!state.d.toast) {

        console.warn(
            'toast missing'
        );

        return;
    }

    if (state.tTimer)
        clearTimeout(state.tTimer);

    state.d.toast.textContent = m;

    state.d.toast.classList.add(
        'show'
    );

    state.tTimer = setTimeout(() => {

        state.d.toast.classList.remove(
            'show'
        );

    }, 2200);
}


/* =========================================================
   QTY HTML
========================================================= */

export function qtyHTML(
    pid,
    qty,
    isSearch
) {

    const a =
        isSearch
            ? 'data-sa'
            : 'data-a';

    const m =
        isSearch
            ? 'data-sm'
            : 'data-m';

    const p =
        isSearch
            ? 'data-sp'
            : 'data-p';

    if (qty > 0) {

        return `
            <div class="flex items-center justify-between bg-blue-50 rounded-xl p-0.5">

                <button
                    ${m}="${pid}"
                    class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center"
                >
                    ${SVG_MI}
                </button>

                <span class="font-bold text-blue-600 text-base">
                    ${qty}
                </span>

                <button
                    ${p}="${pid}"
                    class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
                >
                    ${SVG_PL}
                </button>

            </div>
        `;
    }

    return `
        <button
            ${a}="${pid}"
            class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
            + Tambah
        </button>
    `;
}


/* =========================================================
   PATCH QTY
========================================================= */

export function patchQty(
    pid,
    isSearch
) {

    const pre =
        isSearch
            ? 'sq'
            : 'pq';

    const el =
        document.getElementById(
            pre + '-' + pid
        );

    if (!el) return;

    const f =
        findCart(pid);

    el.innerHTML =
        qtyHTML(
            pid,
            f ? f.it.qty : 0,
            isSearch
        );
}


/* =========================================================
   PATCH BADGE
========================================================= */

export function patchBadge() {

    if (
        !state.d.badge ||
        !state.d.fab
    ) {

        console.warn(
            'badge/fab missing'
        );

        return;
    }

    const c =
        cartQty();

    state.d.badge.textContent = c;

    if (c > 0) {

        state.d.fab.classList.remove(
            'hidden'
        );

        state.d.badge.classList.remove(
            'pop'
        );

        void state.d.badge.offsetWidth;

        state.d.badge.classList.add(
            'pop'
        );

    } else {

        state.d.fab.classList.add(
            'hidden'
        );
    }
}


/* =========================================================
   RENDER CATEGORIES
========================================================= */

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
========================================================= */

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
========================================================= */

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
========================================================= */

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
========================================================= */

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

/* =========================================================
   VOUCHER OPEN/CLOSE
========================================================= */

export function openVou() {

    const pg =
        document.getElementById(
            'pg-vou'
        );

    if (!pg) {

        console.warn(
            'pg-vou missing'
        );

        return;
    }

    pg.classList.remove(
        'hidden'
    );

    lock();
}

export function closeVou() {

    const pg =
        document.getElementById(
            'pg-vou'
        );

    if (!pg) {

        console.warn(
            'pg-vou missing'
        );

        return;
    }

    pg.classList.add(
        'hidden'
    );

    unlock();
}
