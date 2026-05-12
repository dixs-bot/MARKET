/**
 * ============================================
 * LUMORA — VALIDATION SERVICE
 * ============================================
 * 
 * Menangani validasi form checkout:
 * - Validasi nama
 * - Validasi nomor HP
 * - Validasi alamat
 * - Validasi shipping selected
 * - Validasi payment selected
 * - Validasi cart tidak kosong
 * - Toggle error class pada input
 * - Enable/disable button pesan
 */

import { state } from '../utils.js';


/* ============================================================
   EMAIL VALIDATION
============================================================ */

export function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ============================================================
   PHONE VALIDATION
============================================================ */

export function isValidPhone(phone) {

    const cleaned =
        phone.replace(/[\s\-+()]/g, '');

    return /^(08|62)\d{8,13}$/.test(cleaned);
}


/* ============================================================
   SET FIELD ERROR
============================================================ */

export function setFieldError(inputEl, hasError) {

    if (!inputEl) return;

    if (hasError) {

        inputEl.classList.add('err-input');

    } else {

        inputEl.classList.remove('err-input');
    }
}


/* ============================================================
   VALIDATE CHECKOUT FORM
============================================================ */

export function validate(showErr) {

    const nameValid =
        state.d.inname.value
            .trim()
            .length >= 3;

    const phoneValid =

        state.d.inphone.value

            .replace(/\D/g, '')

            .length >= 10;

    const addressValid =
        state.d.inaddr.value
            .trim()
            .length >= 10;

    const shipValid =
        state.co.ship !== '';

    const payValid =
        state.co.pay !== '';

    const cartValid =
        state.cart.length > 0;

    const ok =

        nameValid &&
        phoneValid &&
        addressValid &&
        shipValid &&
        payValid &&
        cartValid;

    state.d.btnOrder.disabled = !ok;

    state.d.btnOrder.classList.toggle(
        'btn-off',
        !ok
    );

    state.d.btnOrder.classList.toggle(
        'btn-on',
        ok
    );

    state.d.hint.textContent =
        ok
            ? 'Siap pesan'
            : 'Lengkapi semua data';

    return ok;
}