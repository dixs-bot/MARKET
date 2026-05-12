/**
 * ============================================
   LUMORA — INVOICE UI
 * ============================================
 * 
 * Invoice dan riwayat pesanan:
 * - renderInv() → tampilkan invoice setelah checkout
 * - renderOrders() → daftar riwayat pesanan
 */

import {

    state,
    fmt

} from '../utils.js';


/* =========================================================
   RENDER INVOICE
======================================================== */

export function renderInv(order) {

    if (
        !state.d.invbody ||
        !order
    ) {

        console.warn(
            'invoice DOM missing'
        );

        return;
    }

    let itemsHTML = '';

    const items =
        order.items || [];

    for (
        let i = 0;
        i < items.length;
        i++
    ) {

        const item =
            items[i];

        itemsHTML += `

            <div class="
                flex
                justify-between
                py-2
                border-b
                border-slate-200
            ">

                <div>

                    <p class="
                        text-sm
                        font-medium
                        text-slate-800
                    ">
                        ${item.name}
                    </p>

                    <p class="
                        text-xs
                        text-slate-400
                    ">
                        ${item.qty} x ${fmt(item.price)}
                    </p>

                </div>

                <p class="
                    text-sm
                    font-semibold
                    text-slate-700
                ">
                    ${fmt(
                        item.price * item.qty
                    )}
                </p>

            </div>
        `;
    }

    state.d.invbody.innerHTML = `

        <div class="space-y-4">

            <div class="text-center">

                <h2 class="
                    text-lg
                    font-bold
                    text-slate-800
                ">
                    Invoice
                </h2>

                <p class="
                    text-xs
                    text-slate-400
                ">
                    ${order.id || '-'}
                </p>

            </div>

            <div class="
                bg-white
                rounded-xl
                p-4
                border
                border-slate-200
            ">

                <div class="space-y-1">

                    <div class="
                        flex
                        justify-between
                        text-sm
                    ">
                        <span class="text-slate-500">
                            Nama
                        </span>

                        <span class="font-medium">
                            ${order.name || '-'}
                        </span>
                    </div>

                    <div class="
                        flex
                        justify-between
                        text-sm
                    ">
                        <span class="text-slate-500">
                            Telepon
                        </span>

                        <span class="font-medium">
                            ${order.phone || '-'}
                        </span>
                    </div>

                </div>

            </div>

            <div class="
                bg-white
                rounded-xl
                p-4
                border
                border-slate-200
            ">

                ${itemsHTML}

                <div class="
                    flex
                    justify-between
                    pt-3
                    mt-3
                    border-t
                    border-slate-200
                    font-bold
                ">

                    <span>Total</span>

                    <span class="text-blue-600">
                        ${fmt(order.total || 0)}
                    </span>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   RENDER ORDERS
======================================================== */

export function renderOrders(orders = []) {

    if (
        !state.d.olist ||
        !state.d.oempty
    ) {

        console.warn(
            'orders DOM missing'
        );

        return;
    }

    if (!orders.length) {

        state.d.olist.innerHTML = '';

        state.d.oempty.classList.remove(
            'hidden'
        );

        return;
    }

    state.d.oempty.classList.add(
        'hidden'
    );

    let html = '';

    for (
        let i = 0;
        i < orders.length;
        i++
    ) {

        const ord =
            orders[i];

        const total =
            fmt(ord.total || 0);

        const items =
            ord.items || [];

        let itemCount = 0;

        for (
            let j = 0;
            j < items.length;
            j++
        ) {

            itemCount +=
                items[j].qty || 0;
        }

        html += `

            <div class="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-4
                space-y-2
            ">

                <div class="
                    flex
                    items-center
                    justify-between
                ">

                    <div>

                        <p class="
                            text-sm
                            font-bold
                            text-slate-800
                        ">
                            Order #${ord.id || '-'}
                        </p>

                        <p class="
                            text-xs
                            text-slate-400
                        ">
                            ${itemCount} item
                        </p>

                    </div>

                    <span class="
                        text-xs
                        font-semibold
                        text-blue-600
                    ">
                        ${total}
                    </span>

                </div>

                <button
                    data-open-order="${ord.id}"

                    class="
                        w-full
                        py-2
                        rounded-xl
                        bg-slate-100
                        text-slate-700
                        text-xs
                        font-semibold
                    "
                >
                    Lihat Detail
                </button>

            </div>
        `;
    }

    state.d.olist.innerHTML =
        html;
}