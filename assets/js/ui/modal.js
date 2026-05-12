/**
 * ============================================
   LUMORA — MODAL UI
 * ============================================
 * 
 * Voucher picker sheet:
 * - openVou() → buka voucher picker
 * - closeVou() → tutup voucher picker
 */

import { unlock } from './loading.js';


/* =========================================================
   OPEN VOUCHER
======================================================== */

export function openVou() {

    const pg =
        document.getElementById(
            'pg-vou'
        );

    if (!pg) {

        console.warn(
            'pg-vou missing'
        );

        return;
    }

    pg.classList.remove(
        'hidden'
    );

    /* Lock dihandle oleh pemanggil
       (checkout feature) */
}


/* =========================================================
   CLOSE VOUCHER
======================================================== */

export function closeVou() {

    const pg =
        document.getElementById(
            'pg-vou'
        );

    if (!pg) {

        console.warn(
            'pg-vou missing'
        );

        return;
    }

    pg.classList.add(
        'hidden'
    );

    unlock();
}