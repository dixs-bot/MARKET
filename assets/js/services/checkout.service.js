/**
 * ============================================
 * LUMORA — CHECKOUT SERVICE
 * ============================================
 * 
 * Menangani logika checkout:
 * - Pilih shipping method
 * - Pilih payment method
 * - Pilih voucher
 * - Reset checkout state
 * - Submit pesanan ke Supabase
 * - Tampilkan invoice
 */

import {

    state,
    SHIPS,
    PAYS,
    VOUS,
    FREE_SHIP_MIN

} from '../utils.js';

import {

    notify,
    renderShips,
    renderPays,
    renderSummary,
    renderInv,
    closeVou,
    animateIn

} from '../ui.js';

import {

    reconcileCart,
    subTotal,
    save

} from './cart.service.js';

import {

    getCurrentStoreId

} from './stores.service.js';

import { validate } from './validation.service.js';

/* ============================================================
   RE-EXPORT VALIDATE
   Agar module lain bisa import validate dari sini
   tanpa harus tahu file terpisahnya
============================================================ */

export { validate };


/* ============================================================
   GLOBAL MINI MARKET
============================================================ */

const MM =
    window.MiniMarket;


/* ============================================================
   SELECT SHIPPING
============================================================ */

export function selShip(id) {

    state.co.ship = id;

    renderShips();

    renderSummary();

    validate(false);
}


/* ============================================================
   SELECT PAYMENT
============================================================ */

export function selPay(id) {

    state.co.pay = id;

    renderPays();

    validate(false);
}


/* ============================================================
   SELECT VOUCHER
============================================================ */

export function selVou(vid) {

    let voucher = null;

    for (
        let i = 0;
        i < VOUS.length;
        i++
    ) {

        if (
            VOUS[i].id === vid
        ) {

            voucher =
                VOUS[i];

            break;
        }
    }

    if (

        state.co.vou &&

        state.co.vou.id === vid

    ) {

        state.co.vou = null;

        state.d.vlbl.textContent =
            'Opsional';

    } else {

        state.co.vou =
            voucher;

        if (voucher) {

            state.d.vlbl.textContent =

                voucher.code +

                ' (-' +

                MM.fmt(
                    voucher.disc
                ) +

                ')';
        }
    }

    closeVou();

    renderSummary();
}


/* ============================================================
   RESET CHECKOUT STATE
============================================================ */

export function resetCO() {

    state.co.ship = '';

    state.co.pay = '';

    state.co.vou = null;
}


/* ============================================================
   PLACE ORDER / GO TO INVOICE
============================================================ */

export async function goToInvoice() {

    if (state.isProcessing)
        return;

    if (
        !validate(true)
    )
        return;

    reconcileCart();

    if (!state.cart.length) {

        notify(
            'Keranjang tidak valid'
        );

        return;
    }

    state.isProcessing = true;

    state.d.mconf.classList.add(
        'hidden'
    );

    state.d.mload.classList.remove(
        'hidden'
    );

    try {

        const {

            data: { session }

        } =

        await window.supabaseClient
            .auth
            .getSession();

        if (!session) {

            notify(
                'Silakan login terlebih dahulu'
            );

            window.location.href =
                '/auth.html';

            return;
        }

        const selectedStoreId =
            getCurrentStoreId();

        if (!selectedStoreId) {

            notify(
                'Pilih cabang terlebih dahulu'
            );

            return;
        }

        const storeMap = {};

        for (
            let i = 0;
            i < state.cart.length;
            i++
        ) {

            storeMap[
                state.cart[i]
                    .store_id
            ] = true;
        }

        if (
            Object.keys(storeMap)
                .length > 1
        ) {

            notify(
                'Checkout lintas cabang tidak diperbolehkan'
            );

            return;
        }

        const stockResult =

            await MM.atomicDeductStock(
                state.cart
            );

        if (!stockResult.ok) {

            notify(
                'Stock berubah, silakan cek kembali'
            );

            reconcileCart();

            return;
        }

        let shippingMethod =
            null;

        let paymentMethod =
            null;

        for (
            let i = 0;
            i < SHIPS.length;
            i++
        ) {

            if (
                SHIPS[i].id ===
                state.co.ship
            ) {

                shippingMethod =
                    SHIPS[i];

                break;
            }
        }

        for (
            let j = 0;
            j < PAYS.length;
            j++
        ) {

            if (
                PAYS[j].id ===
                state.co.pay
            ) {

                paymentMethod =
                    PAYS[j];

                break;
            }
        }

        if (
            !shippingMethod ||
            !paymentMethod
        ) {

            notify(
                'Pilih pengiriman & pembayaran'
            );

            return;
        }

        const subtotal =
            subTotal();

        const shippingCost =

            subtotal >=
            FREE_SHIP_MIN

                ? 0
                : shippingMethod.price;

        const discount =

            state.co.vou

                ? state.co.vou.disc
                : 0;

        const total =
            Math.max(
                0,
                subtotal +
                shippingCost -
                discount
            );

        const orderId =

            'ord_' +

            Date.now() +

            '_' +

            Math.random()
                .toString(36)
                .slice(2, 8);

        const order = {

            id:
                orderId,

            store_id:
                selectedStoreId,

            user_id:
                session.user.id,

            customer_name:
                state.d.inname.value
                    .trim(),

            phone:
                state.d.inphone.value
                    .trim(),

            address:
                state.d.inaddr.value
                    .trim(),

            notes:
                state.d.innote.value
                    .trim(),

            items:
                [...state.cart],

            subtotal,

            shipping_cost:
                shippingCost,

            discount,

            total,

            shipping_method:
                shippingMethod.name,

            payment_method:
                paymentMethod.name,

            status:
                'pending',

            created_at:
                new Date().toISOString()
        };

        const validation =
            MM.validateOrder(
                order
            );

        if (!validation.ok) {

            notify(
                'Order tidak valid'
            );

            return;
        }

        const { error } =

            await window.supabaseClient

                .from('orders')

                .insert([order]);

        if (error) {

            console.error(error);

            notify(
                'Gagal menyimpan order'
            );

            return;
        }

        state.curOrder =
            order;

        state.orders.push(order);

        state.cart = [];

        resetCO();

        save();

        renderCart();

        patchBadge();

        state.d.mload.classList.add(
            'hidden'
        );

        state.d.pgco.classList.add(
            'hidden'
        );

        renderInv();

        state.d.pginv.classList.remove(
            'hidden'
        );

        animateIn(
            state.d.pginv
        );

        state.currentPage =
            'invoice';

    } catch (err) {

        console.error(
            'Checkout error:',
            err
        );

        notify(
            'Terjadi kesalahan checkout'
        );

    } finally {

        state.d.mload.classList.add(
            'hidden'
        );

        state.isProcessing =
            false;
    }
}