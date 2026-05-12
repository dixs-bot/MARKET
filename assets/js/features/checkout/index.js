/**
 * ============================================
 * LUMORA — CHECKOUT FEATURE
 * ============================================
 * 
 * Menangani alur checkout:
 * - Buka halaman checkout
 * - Tutup / kembali ke home
 * - Tampilkan modal konfirmasi
 * - Render shipping, payment, summary
 * - Validasi form
 * 
 * Submit order ada di services.js (goToInvoice).
 * Render UI ada di ui.js (renderShips, renderPays, dll).
 * Module ini mengatur alur/page transitions.
 */

import { state } from '../../utils.js';

import {

    reconcileCart,
    validate,
    goToInvoice

} from '../../services.js';

import {

    notify,
    renderShips,
    renderPays,
    renderSummary,
    lock,
    unlock,
    animateIn

} from '../../ui.js';

import { go as navTo } from '../../core/router.js';


/* ============================================================
   GO TO HOME
   Menutup semua overlay, reset state, navigasi ke home.
============================================================ */

function goToHome() {

    /* =========================
       HIDE INVOICE
    ========================= */

    if (state.d.pginv) {

        state.d.pginv.classList.add(
            'hidden'
        );
    }

    /* =========================
       HIDE CHECKOUT
    ========================= */

    if (state.d.pgco) {

        state.d.pgco.classList.add(
            'hidden'
        );

        state.d.pgco.classList.remove(
            'flex'
        );
    }

    /* =========================
       HIDE DIM
    ========================= */

    if (state.d.dim) {

        state.d.dim.classList.add(
            'hidden'
        );
    }

    /* =========================
       CLOSE CART SHEET
    ========================= */

    if (state.d.csheet) {

        state.d.csheet.classList.add(
            'translate-y-full'
        );
    }

    /* =========================
       UNLOCK BODY
    ========================= */

    unlock();

    /* =========================
       SAVE PAGE
    ========================= */

    localStorage.setItem(
        'lumora_page',
        'home'
    );

    /* =========================
       RESET STATE
    ========================= */

    state.currentPage =
        'home';

    state.curOrder =
        null;

    /* =========================
       NAVIGATE
    ========================= */

    navTo('home');
}


/* ============================================================
   GO TO CHECKOUT
   Membuka halaman checkout dari cart sheet.
============================================================ */

function goToCheckout() {

    /* =========================
       RECONCILE CART
    ========================= */

    reconcileCart();

    /* =========================
       VALIDATE CART
    ========================= */

    if (!state.cart.length) {

        notify(
            'Keranjang kosong'
        );

        return;
    }

    /* =========================
       SAVE CURRENT PAGE
    ========================= */

    localStorage.setItem(
        'lumora_page',
        'checkout'
    );

    /* =========================
       CLOSE CART SHEET
    ========================= */

    if (state.d.csheet) {

        state.d.csheet.classList.remove(
            'open'
        );

        state.d.csheet.classList.add(
            'translate-y-full'
        );
    }

    /* =========================
       HIDE DIM BACKDROP
    ========================= */

    if (state.d.dim) {

        state.d.dim.classList.remove(
            'on'
        );

        state.d.dim.classList.add(
            'hidden'
        );
    }

    /* =========================
       LOCK BODY SCROLL
    ========================= */

    if (
        state.lockCnt === 0
    ) {

        lock();
    }

    /* =========================
       RENDER CHECKOUT UI
    ========================= */

    renderShips();

    renderPays();

    renderSummary();

    validate(false);

    /* =========================
       OPEN CHECKOUT PAGE
    ========================= */

    if (state.d.pgco) {

        state.d.pgco.classList.remove(
            'hidden'
        );

        state.d.pgco.classList.add(
            'flex'
        );

        animateIn(
            state.d.pgco
        );
    }

    /* =========================
       SAVE STATE
    ========================= */

    state.currentPage =
        'checkout';
}


/* ============================================================
   GO TO CONFIRM
   Menampilkan modal konfirmasi pesanan.
============================================================ */

function goToConfirm() {

    if (state.d.mconf) {

        state.d.mconf.classList.remove(
            'hidden'
        );
    }
}


/* ============================================================
   CLICK HANDLER
   Menangani click events terkait checkout.
   Return true jika click ditangani di sini.
============================================================ */

function handleClick(e) {

    /* =========================
       OPEN CHECKOUT
    ========================= */

    if (
        e.target.closest(
            "[data-act='open-checkout']"
        )
    ) {

        goToCheckout();

        return true;
    }

    /* =========================
       CLOSE CHECKOUT
    ========================= */

    if (
        e.target.closest(
            "[data-act='close-checkout']"
        )
    ) {

        goToHome();

        return true;
    }

    /* =========================
       BTN ORDER → CONFIRM MODAL
    ========================= */

    if (
        e.target.closest(
            '#btn-order'
        )
    ) {

        goToConfirm();

        return true;
    }

    /* =========================
       FINAL CHECKOUT (PESAN)
    ========================= */

    if (
        e.target.closest(
            "[data-act='do-co']"
        )
    ) {

        goToInvoice();

        return true;
    }

    /* =========================
       EDIT ORDER (tutup modal)
    ========================= */

    if (
        e.target.closest(
            "[data-act='edit-order']"
        )
    ) {

        if (state.d?.mconf) {

            state.d.mconf.classList.add(
                'hidden'
            );
        }

        return true;
    }

    /* =========================
       TIDAK DITANGANI DI SINI
    ========================= */

    return false;
}


export {
    handleClick,
    goToCheckout,
    goToHome,
    goToConfirm
};