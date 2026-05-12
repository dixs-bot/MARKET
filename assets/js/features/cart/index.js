/**
 * ============================================
 * LUMORA — CART FEATURE
 * ============================================
 * 
 * Menangani keranjang belanja click events:
 * - Tambah item (+)
 * - Kurangi item (-)
 * - Hapus item
 * - Buka cart sheet (FAB)
 * - Tutup cart sheet
 * 
 * Business logic ada di services.js (addCart, delCart).
 * UI logic ada di ui.js (openCart, closeCart).
 * Module ini hanya routing click → fungsi yang benar.
 */

import { state } from '../../utils.js';

import {

    addCart,
    delCart

} from '../../services.js';

import { openCart, closeCart } from '../../ui/index.js';


/* ============================================================
   CLICK HANDLER
   Menangani click events terkait cart.
   Return true jika click ditangani di sini.
============================================================ */

function handleClick(e) {

    let el;

    /* =========================
       CART PLUS
    ========================= */

    el = e.target.closest(
        '[data-cp]'
    );

    if (el) {

        addCart(
            el.dataset.cp,
            1
        );

        return true;
    }

    /* =========================
       CART MINUS
    ========================= */

    el = e.target.closest(
        '[data-cm]'
    );

    if (el) {

        addCart(
            el.dataset.cm,
            -1
        );

        return true;
    }

    /* =========================
       REMOVE CART ITEM
    ========================= */

    el = e.target.closest(
        '[data-cr]'
    );

    if (el) {

        delCart(
            el.dataset.cr
        );

        return true;
    }

    /* =========================
       OPEN CART (FAB)
    ========================= */

    if (
        e.target.closest(
            '#fab-cart'
        )
    ) {

        openCart();

        return true;
    }

    /* =========================
       CLOSE CART
    ========================= */

    if (
        e.target.closest(
            "[data-act='close-cart']"
        )
    ) {

        closeCart();

        return true;
    }

    /* =========================
       TIDAK DITANGANI DI SINI
    ========================= */

    return false;
}


export {
    handleClick
};
