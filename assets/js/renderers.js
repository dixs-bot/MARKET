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


/* ============================================================
   HELPERS
============================================================ */

function qtyHTML(
    pid,
    qty,
    isSearch
) {

    var addAttr =
        isSearch
            ? 'data-sa'
            : 'data-a';

    var minusAttr =
        isSearch
            ? 'data-sm'
            : 'data-m';

    var plusAttr =
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
            class="
                w-full
                py-2
                bg-blue-600
                text-white
                rounded-xl
                text-xs
                font-semibold
                tap
            "
        >
            + Tambah
        </button>
    `;
}


/* ============================================================
   CATEGORIES
============================================================ */

export function renderCats(categories) {

    var bar =
        state.d.catbar;

    if (!bar)
        return;

    var cats =
        categories || [];

    if (!cats.length) {

        bar.innerHTML = '';

        return;
    }

    var html = '';

    for (
        var i = 0;
        i < cats.length;
        i++
    ) {

        var category =
            cats[i];

        var active =

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

    var prefix =
        isSearch
            ? 'sq'
            : 'pq';

    var found =
        findCart(product.id);

    var qty =
        found
            ? found.it.qty
            : 0;

    var outOfStock =
        Number(product.stock || 0) <= 0;

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
                    src="${product.image}"
                    alt="${product.name}"

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
                        ? `
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
                        : ''
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
                    ${product.name}
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
                        ${fmt(product.price)}
                    </p>

                    <span class="
                        text-[10px]
                        ${
                            outOfStock
                                ? 'text-red-500'
                                : 'text-slate-400'
                        }
                    ">

                        Stock:
                        ${product.stock}

                    </span>

                </div>

                <div
                    id="${prefix}-${product.id}"
                    class="mt-1.5"
                >

                    ${
                        outOfStock

                            ?

                        `
                            <button
                                disabled
                                class="
                                    w-full
                                    py-2
                                    bg-slate-200
                                    text-slate-400
                                    rounded-xl
                                    text-xs
                                    font-semibold
                                    cursor-not-allowed
                                "
                            >
                                Stok Habis
                            </button>
                        `

                            :

                        qtyHTML(
                            product.id,
                            qty,
                            isSearch
                        )
                    }

                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   PRODUCTS
============================================================ */

export function renderProds(products) {

    var list =
        products || [];

    state.d.pcnt.textContent =
        list.length + ' item';

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

    var html = '';

    for (
        var i = 0;
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
}


/* ============================================================
   CART
============================================================ */

export function renderCart() {

    var count =
        cartQty();

    state.d.ccnt.textContent =
        count + ' item';

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

    var liveProducts =
        window.MiniMarket
            .getProducts();

    var liveMap = {};

    for (
        var i = 0;
        i < liveProducts.length;
        i++
    ) {

        liveMap[
            liveProducts[i].id
        ] = liveProducts[i];
    }

    var html = '';

    for (
        var j = 0;
        j < state.cart.length;
        j++
    ) {

        var item =
            state.cart[j];

        var live =
            liveMap[item.id];

        var image =
            live
                ? live.image
                : item.image;

        var price =
            live
                ? live.price
                : item.price;

        var stock =
            live
                ? live.stock
                : 0;

        var disabled =
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
                    src="${image}"

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
                        ${item.name}
                    </p>

                    <p class="
                        text-blue-600
                        font-bold
                        text-xs
                        mt-0.5
                    ">
                        ${fmt(price)}
                    </p>

                    <div class="
                        flex
                        items-center
                        gap-1.5
                        mt-1
                    ">

                        <button
                            data-cm="${item.id}"

                            ${
                                disabled
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
                            ${item.qty}
                        </span>

                        <button
                            data-cp="${item.id}"

                            ${
                                disabled
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
                            "
                        >
                            ${SVG_PL}
                        </button>

                    </div>

                </div>

                <button
                    data-cr="${item.id}"

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
   EXPORT PLACEHOLDER
============================================================ */

/* next:
renderShips
renderPays
renderSummary
renderVou
renderInv
renderOrders
*/
