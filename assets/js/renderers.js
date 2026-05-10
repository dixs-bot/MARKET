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
    cartQty,
    FREE_SHIP_MIN

} from './utils.js';

import {

    subTotal,
    cleanupInvalidCartItems

} from './services.js';


/* ============================================================
   INTERNAL
============================================================ */

let renderLock =
    false;

const rapidMap =
    new Map();


/* ============================================================
   HELPERS
============================================================ */

function isRapidClick(id) {

    const now =
        Date.now();

    const last =
        rapidMap.get(id) || 0;

    if (
        now - last < 180
    ) {

        return true;
    }

    rapidMap.set(id, now);

    return false;
}

function getLiveProductMap() {

    const products =
        window.MiniMarket
            .getProducts();

    const map = {};

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        map[
            products[i].id
        ] = products[i];
    }

    return map;
}

function getLiveCart() {

    cleanupInvalidCartItems();

    return state.cart;
}

function qtyHTML(
    pid,
    qty,
    isSearch,
    stock
) {

    const disabled =
        stock <= 0;

    const addAttr =
        isSearch
            ? 'data-sa'
            : 'data-a';

    const minusAttr =
        isSearch
            ? 'data-sm'
            : 'data-m';

    const plusAttr =
        isSearch
            ? 'data-sp'
            : 'data-p';

    if (qty > 0) {

        return `

            <div class="
                flex
                items-center
                justify-between
                bg-blue-50
                rounded-xl
                p-0.5
            ">

                <button
                    ${minusAttr}="${pid}"

                    class="
                        w-8
                        h-8
                        rounded-lg
                        bg-white
                        border
                        border-slate-100
                        flex
                        items-center
                        justify-center
                        tap
                    "
                >
                    ${SVG_MI}
                </button>

                <span class="
                    font-bold
                    text-blue-600
                    text-base
                ">
                    ${qty}
                </span>

                <button
                    ${plusAttr}="${pid}"

                    ${
                        disabled
                            ? 'disabled'
                            : ''
                    }

                    class="
                        w-8
                        h-8
                        rounded-lg
                        bg-blue-600
                        text-white
                        flex
                        items-center
                        justify-center
                        tap
                        disabled:opacity-50
                    "
                >
                    ${SVG_PL}
                </button>

            </div>
        `;
    }

    return `

        <button
            ${addAttr}="${pid}"

            ${
                disabled
                    ? 'disabled'
                    : ''
            }

            class="
                w-full
                py-2
                ${
                    disabled

                        ?

                    'bg-slate-200 text-slate-400 cursor-not-allowed'

                        :

                    'bg-blue-600 text-white'
                }
                rounded-xl
                text-xs
                font-semibold
                tap
            "
        >
            ${
                disabled
                    ? 'Stok Habis'
                    : '+ Tambah'
            }
        </button>
    `;
}


/* ============================================================
   CATEGORIES
============================================================ */

export function renderCats(categories) {

    const bar =
        state.d.catbar;

    if (!bar)
        return;

    const cats =
        categories || [];

    if (!cats.length) {

        bar.innerHTML = '';

        return;
    }

    let html = '';

    for (
        let i = 0;
        i < cats.length;
        i++
    ) {

        const category =
            cats[i];

        const active =

            state.selCat ===
            category.id;

        html += `

            <div
                data-cat="${category.id}"

                class="
                    flex
                    flex-col
                    items-center
                    gap-1
                    flex-shrink-0
                    cursor-pointer
                "

                style="min-width:56px"
            >

                <div class="
                    rounded-full
                    overflow-hidden
                    border-2
                    ${
                        active
                            ? 'border-blue-500'
                            : 'border-slate-100'
                    }
                "

                style="
                    width:52px;
                    height:52px;
                ">

                    <img
                        src="${
                            category.image ||

                            window.MiniMarket
                                .FALLBACK_CAT_IMG
                        }"

                        class="
                            w-full
                            h-full
                            object-cover
                        "
                    >

                </div>

                <span class="
                    text-[10px]
                    font-semibold
                    ${
                        active
                            ? 'text-blue-600'
                            : 'text-slate-400'
                    }
                ">

                    ${category.name}

                </span>

            </div>
        `;
    }

    bar.innerHTML = html;
}


/* ============================================================
   PRODUCT CARD
============================================================ */

export function renderCard(
    product,
    isSearch
) {

    const liveMap =
        getLiveProductMap();

    const live =
        liveMap[product.id] ||
        product;

    const found =
        findCart(product.id);

    let qty =
        found
            ? found.it.qty
            : 0;

    if (
        qty > live.stock
    ) {

        qty = live.stock;
    }

    const outOfStock =
        Number(live.stock || 0) <= 0;

    const lowStock =
        live.stock > 0 &&
        live.stock <= 5;

    return `

        <div class="
            bg-slate-50
            rounded-2xl
            overflow-hidden
            border
            border-slate-100
        ">

            <div class="
                aspect-square
                bg-slate-100
                overflow-hidden
                relative
            ">

                <img
                    src="${live.image}"

                    alt="${live.name}"

                    class="
                        w-full
                        h-full
                        object-cover
                    "

                    loading="lazy"

                    onerror="
                        this.onerror=null;
                        this.src='${FALLBACK_IMG}'
                    "
                >

                ${
                    outOfStock

                        ?

                    `
                        <div class="
                            absolute
                            inset-0
                            bg-black/40
                            flex
                            items-center
                            justify-center
                        ">

                            <span class="
                                bg-red-500
                                text-white
                                text-xs
                                font-bold
                                px-3
                                py-1
                                rounded-full
                            ">
                                Stok Habis
                            </span>

                        </div>
                    `

                        :

                    ''
                }

                ${
                    lowStock

                        ?

                    `
                        <div class="
                            absolute
                            top-2
                            left-2
                        ">

                            <span class="
                                bg-yellow-400
                                text-slate-900
                                text-[10px]
                                font-bold
                                px-2
                                py-1
                                rounded-full
                            ">
                                Sisa ${live.stock}
                            </span>

                        </div>
                    `

                        :

                    ''
                }

            </div>

            <div class="p-2.5">

                <h3 class="
                    text-xs
                    font-medium
                    text-slate-800
                    line-clamp-2
                    min-h-[32px]
                    leading-snug
                ">
                    ${live.name}
                </h3>

                <div class="
                    flex
                    items-center
                    justify-between
                    mt-1
                ">

                    <p class="
                        text-blue-600
                        font-bold
                        text-xs
                    ">
                        ${fmt(live.price)}
                    </p>

                    <span class="
                        text-[10px]
                        ${
                            outOfStock
                                ? 'text-red-500'
                                : lowStock
                                    ? 'text-yellow-600'
                                    : 'text-slate-400'
                        }
                    ">

                        Stock:
                        ${live.stock}

                    </span>

                </div>

                <div
                    id="pq-${live.id}"
                    class="mt-1.5"
                >

                    ${qtyHTML(
                        live.id,
                        qty,
                        isSearch,
                        live.stock
                    )}

                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   PRODUCTS
============================================================ */

export function renderProds(products) {

    if (renderLock)
        return;

    renderLock = true;

    try {

        const list =
            products || [];

        /* ====================================================
           SAFE DOM
        ==================================================== */

        if (state.d.pcnt) {

            state.d.pcnt.textContent =
                list.length + ' item';
        }

        if (!state.d.pgrid) {

            console.warn(
                'pgrid not found'
            );

            return;
        }

        /* ====================================================
           EMPTY
        ==================================================== */

        if (!list.length) {

            state.d.pgrid.innerHTML = `

                <div class="
                    col-span-2
                    text-center
                    py-10
                ">

                    <p class="
                        text-xs
                        text-slate-400
                    ">
                        Tidak ada produk
                    </p>

                </div>
            `;

            return;
        }

        /* ====================================================
           RENDER
        ==================================================== */

        let html = '';

        for (
            let i = 0;
            i < list.length;
            i++
        ) {

            html += renderCard(
                list[i],
                false
            );
        }

        state.d.pgrid.innerHTML =
            html;

    } catch (err) {

        console.error(
            'Render products error:',
            err
        );

    } finally {

        renderLock = false;
    }
}
/* ============================================================
   CART
============================================================ */

export function renderCart() {

    cleanupInvalidCartItems();

    const liveMap =
        getLiveProductMap();

    const cart =
        getLiveCart();

    const count =
        cartQty();

    state.d.ccnt.textContent =
        count + ' item';

    if (!cart.length) {

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

    let html = '';

    for (
        let i = 0;
        i < cart.length;
        i++
    ) {

        const item =
            cart[i];

        const live =
            liveMap[item.id];

        if (!live)
            continue;

        const stock =
            Number(live.stock || 0);

        const qty =
            Math.min(
                item.qty,
                stock
            );

        const outOfStock =
            stock <= 0;

        html += `

            <div class="
                flex
                gap-2.5
                bg-slate-50
                rounded-xl
                p-2.5
                border
                border-slate-100
            ">

                <img
                    src="${live.image}"

                    class="
                        w-14
                        h-14
                        rounded-lg
                        object-cover
                        bg-white
                    "

                    loading="lazy"

                    onerror="
                        this.onerror=null;
                        this.src='${FALLBACK_IMG}'
                    "
                >

                <div class="
                    flex-1
                    min-w-0
                ">

                    <p class="
                        text-xs
                        font-medium
                        text-slate-800
                        line-clamp-2
                    ">
                        ${live.name}
                    </p>

                    <p class="
                        text-blue-600
                        font-bold
                        text-xs
                        mt-0.5
                    ">
                        ${fmt(live.price)}
                    </p>

                    ${
                        outOfStock

                            ?

                        `
                            <p class="
                                text-[10px]
                                text-red-500
                                mt-1
                                font-semibold
                            ">
                                Produk habis
                            </p>
                        `

                            :

                        ''
                    }

                    <div class="
                        flex
                        items-center
                        gap-1.5
                        mt-1
                    ">

                        <button
                            data-cm="${live.id}"

                            ${
                                outOfStock
                                    ? 'disabled'
                                    : ''
                            }

                            class="
                                w-7
                                h-7
                                rounded-lg
                                bg-white
                                border
                                border-slate-200
                                flex
                                items-center
                                justify-center
                                tap
                            "
                        >
                            ${SVG_MI}
                        </button>

                        <span class="
                            text-xs
                            font-semibold
                            w-5
                            text-center
                            text-slate-800
                        ">
                            ${qty}
                        </span>

                        <button
                            data-cp="${live.id}"

                            ${
                                outOfStock ||
                                qty >= stock
                                    ? 'disabled'
                                    : ''
                            }

                            class="
                                w-7
                                h-7
                                rounded-lg
                                bg-blue-600
                                text-white
                                flex
                                items-center
                                justify-center
                                tap
                                disabled:opacity-50
                            "
                        >
                            ${SVG_PL}
                        </button>

                    </div>

                </div>

                <button
                    data-cr="${live.id}"

                    class="
                        text-red-300
                        self-start
                        tap
                        p-0.5
                    "
                >
                    ${SVG_TR}
                </button>

            </div>
        `;
    }

    state.d.clist.innerHTML =
        html;

    state.d.ctotal.textContent =
        fmt(subTotal());
}


/* ============================================================
   SHIPPING
============================================================ */

export function renderShips() {

    let html = '';

    const subtotal =
        subTotal();

    for (
        let i = 0;
        i < SHIPS.length;
        i++
    ) {

        const ship =
            SHIPS[i];

        const active =

            state.co.ship ===
            ship.id;

        const free =

            subtotal >=
            FREE_SHIP_MIN;

        html += `

            <button
                data-ship="${ship.id}"

                class="
                    w-full
                    p-3
                    rounded-2xl
                    border
                    text-left
                    transition
                    ${
                        active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200'
                    }
                "
            >

                <div class="
                    flex
                    items-center
                    justify-between
                ">

                    <div>

                        <p class="
                            font-semibold
                            text-sm
                        ">
                            ${ship.name}
                        </p>

                        <p class="
                            text-xs
                            text-slate-400
                        ">
                            ${ship.est}
                        </p>

                    </div>

                    <div class="
                        text-sm
                        font-bold
                        ${
                            free
                                ? 'text-green-600'
                                : 'text-blue-600'
                        }
                    ">

                        ${
                            free
                                ? 'GRATIS'
                                : fmt(ship.price)
                        }

                    </div>

                </div>

            </button>
        `;
    }

    state.d.shiplist.innerHTML =
        html;
}


/* ============================================================
   NEXT SPLIT
============================================================ */

/*
renderPays
renderSummary
renderVou
renderInv
renderOrders
*/
