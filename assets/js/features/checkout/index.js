/**
 * ============================================
 * LUMORA — CHECKOUT FEATURE
 * ============================================
 */

import { state } from '../../utils.js';

import { reconcileCart } from '../../services/cart.service.js';

import { validate } from '../../services/validation.service.js';

import { goToInvoice } from '../../services/checkout.service.js';

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
============================================================ */

function goToHome() {

    if (state.d.pginv) {

        state.d.pginv.classList.add(
            'hidden'
        );
    }

    if (state.d.pgco) {

        state.d.pgco.classList.add(
            'hidden'
        );

        state.d.pgco.classList.remove(
            'flex'
        );
    }

    if (state.d.dim) {

        state.d.dim.classList.add(
            'hidden'
        );
    }

    if (state.d.csheet) {

        state.d.csheet.classList.add(
            'translate-y-full'
        );
    }

    unlock();

    localStorage.setItem(
        'lumora_page',
        'home'
    );

    state.currentPage = 'home';
    state.curOrder = null;

    navTo('home');
}


/* ============================================================
   GO TO CHECKOUT
============================================================ */

function goToCheckout() {

    reconcileCart();

    if (!state.cart.length) {

        notify('Keranjang kosong');
        return;
    }

    localStorage.setItem(
        'lumora_page',
        'checkout'
    );

    if (state.d.csheet) {

        state.d.csheet.classList.remove('open');
        state.d.csheet.classList.add('translate-y-full');
    }

    if (state.d.dim) {

        state.d.dim.classList.remove('on');
        state.d.dim.classList.add('hidden');
    }

    if (state.lockCnt === 0) {

        lock();
    }

    renderShips();
    renderPays();
    renderSummary();
    validate(false);

    if (state.d.pgco) {

        state.d.pgco.classList.remove('hidden');
        state.d.pgco.classList.add('flex');
        animateIn(state.d.pgco);
    }

    state.currentPage = 'checkout';
}


/* ============================================================
   GO TO CONFIRM
============================================================ */

function goToConfirm() {

    if (state.d.mconf) {

        state.d.mconf.classList.remove('hidden');
    }
}


/* ============================================================
   CLICK HANDLER
============================================================ */

function handleClick(e) {

    if (
        e.target.closest(
            "[data-act='open-checkout']"
        )
    ) {

        goToCheckout();
        return true;
    }

    if (
        e.target.closest(
            "[data-act='close-checkout']"
        )
    ) {

        goToHome();
        return true;
    }

    if (
        e.target.closest('#btn-order')
    ) {

        goToConfirm();
        return true;
    }

    if (
        e.target.closest(
            "[data-act='do-co']"
        )
    ) {

        goToInvoice();
        return true;
    }

    if (
        e.target.closest(
            "[data-act='edit-order']"
        )
    ) {

        if (state.d?.mconf) {

            state.d.mconf.classList.add('hidden');
        }

        return true;
    }

    return false;
}


export {
    handleClick,
    goToCheckout,
    goToHome,
    goToConfirm
};
