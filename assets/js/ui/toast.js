/**
 * ============================================
   LUMORA — TOAST UI
 * ============================================
 * 
 * Notifikasi toast:
 * - notify(message) → tampilkan toast 2.2 detik
 */

import { state } from '../utils.js';


/* =========================================================
   NOTIFY
======================================================== */

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