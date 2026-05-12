/**
 * ============================================
   LUMORA — CHECKOUT UI
 * ============================================
 * 
 * Rendering UI halaman checkout:
 * - renderShips() → opsi pengiriman
 * - renderPays() → opsi pembayaran
 * - renderSummary() → ringkasan belanja
 */

import {

    state,
    SHIPS,
    PAYS,
    fmt

} from '../utils.js';

import { subTotal } from '../services/cart.service.js';


/* =========================================================
   RENDER SHIPPING METHODS
======================================================== */

export function renderShips() {

    const wrap =
        state.d.ships;

    if (!wrap) {

        console.warn(
            'shiplist not found'
        );

        return;
    }

    const ships =
        state.shippings ||
        SHIPS ||
        [];

    if (!ships.length) {

        wrap.innerHTML = `
            <div class="
                text-xs
                text-slate-400
                text-center
                py-4
            ">
                Metode pengiriman kosong
            </div>
        `;

        return;
    }

    wrap.innerHTML =
        ships.map(ship => {

            const active =
                state.selectedShip === ship.id;

            return `

                <button
                    class="
                        w-full
                        flex
                        items-center
                        justify-between
                        p-3
                        rounded-xl
                        border
                        transition-all
                        ${
                            active
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 bg-white'
                        }
                    "

                    data-ship="${ship.id}"
                >

                    <div class="
                        flex
                        flex-col
                        items-start
                    ">

                        <span class="
                            text-sm
                            font-semibold
                            text-slate-800
                        ">
                            ${ship.name}
                        </span>

                        <span class="
                            text-xs
                            text-slate-400
                        ">
                            ${fmt(ship.price || 0)}
                        </span>

                    </div>

                    <div class="
                        w-4
                        h-4
                        rounded-full
                        border-2
                        flex
                        items-center
                        justify-center
                        ${
                            active
                                ? 'border-blue-600'
                                : 'border-slate-300'
                        }
                    ">

                        ${
                            active
                                ? `
                                    <div class="
                                        w-2
                                        h-2
                                        rounded-full
                                        bg-blue-600
                                    "></div>
                                `
                                : ''
                        }

                    </div>

                </button>
            `;

        }).join('');
}


/* =========================================================
   RENDER PAYMENT METHODS
======================================================== */

export function renderPays() {

    const wrap = state.d.pays;

    if (!wrap) {

        console.warn('paylist not found');

        return;
    }

    const pays =
        state.payments ||
        PAYS ||
        [];

    if (!pays.length) {

        wrap.innerHTML = `
            <div class="
                text-xs
                text-slate-400
                text-center
                py-4
            ">
                Metode pembayaran kosong
            </div>
        `;

        return;
    }

    let html = '';

    for (let i = 0; i < pays.length; i++) {

        const pay = pays[i];

        const active =
            state.selectedPayment === pay.id;

        html += `

            <button
                data-pay="${pay.id}"

                class="
                    w-full
                    flex
                    items-center
                    justify-between
                    p-3
                    rounded-xl
                    border
                    transition-all

                    ${
                        active
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }
                "
            >

                <div class="
                    flex
                    flex-col
                    items-start
                ">

                    <span class="
                        text-sm
                        font-semibold
                        text-slate-800
                    ">
                        ${pay.name}
                    </span>

                    <span class="
                        text-xs
                        text-slate-400
                    ">
                        ${pay.desc || ''}
                    </span>

                </div>

                <div class="
                    w-4
                    h-4
                    rounded-full
                    border-2
                    flex
                    items-center
                    justify-center

                    ${
                        active
                        ? 'border-blue-600'
                        : 'border-slate-300'
                    }
                ">

                    ${
                        active
                        ? `
                            <div class="
                                w-2
                                h-2
                                rounded-full
                                bg-blue-600
                            "></div>
                        `
                        : ''
                    }

                </div>

            </button>
        `;
    }

    wrap.innerHTML = html;
}


/* =========================================================
   RENDER CHECKOUT SUMMARY
======================================================== */

export function renderSummary() {

    if (
        !state.d.coitems ||
        !state.d.ssub ||
        !state.d.sship ||
        !state.d.stotal
    ) {

        console.warn(
            'summary DOM missing'
        );

        return;
    }

    let itemsHTML = '';

    for (
        let i = 0;
        i < state.cart.length;
        i++
    ) {

        const item =
            state.cart[i];

        itemsHTML += `

            <div class="
                flex
                items-center
                justify-between
                text-sm
            ">

                <div>

                    <p class="
                        text-slate-800
                        font-medium
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

                <span class="
                    font-semibold
                    text-slate-700
                ">
                    ${fmt(
                        item.qty * item.price
                    )}
                </span>

            </div>
        `;
    }

    state.d.coitems.innerHTML =
        itemsHTML;

    const sub =
        subTotal();

    const ship =
        state.selectedShipPrice || 0;

    const disc =
        state.discount || 0;

    const total =
        sub + ship - disc;

    state.d.ssub.textContent =
        fmt(sub);

    state.d.sship.textContent =
        fmt(ship);

    state.d.stotal.textContent =
        fmt(total);

    if (
        state.d.discr &&
        state.d.sdisc
    ) {

        if (disc > 0) {

            state.d.discr.classList.remove(
                'hidden'
            );

            state.d.sdisc.textContent =
                '- ' + fmt(disc);

        } else {

            state.d.discr.classList.add(
                'hidden'
            );
        }
    }
}