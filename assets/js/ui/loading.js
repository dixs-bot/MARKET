/**
 * ============================================
   LUMORA — LOADING UI
 * ============================================
 * 
 * Body scroll lock untuk overlay:
 * - lock() → tambah counter, kunci scroll
 * - unlock() → kurangi counter, buka scroll jika 0
 */

import { state } from '../utils.js';


/* =========================================================
   LOCK
======================================================== */

export function lock() {

    if (!state.lockCnt) {

        document.body.style.overflow =
            'hidden';
    }

    state.lockCnt++;
}


/* =========================================================
   UNLOCK
======================================================== */

export function unlock() {

    state.lockCnt =
        Math.max(
            0,
            state.lockCnt - 1
        );

    if (!state.lockCnt) {

        document.body.style.overflow =
            '';
    }
}