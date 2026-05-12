/**
 * ============================================
 * LUMORA — PRODUCTS SEARCH
 * ============================================
 * 
 * Menangani search input:
 * - initSearchListener() → bind input event
 * - Debounce 250ms
 * - Memanggil renderFilteredProducts(true)
 * 
 * Dipanggil dari bootstrap.js saat init.
 */

import { state } from '../../utils.js';

import {
    renderFilteredProducts
} from './render.js';


/* ============================================================
   SEARCH TIMER
============================================================ */

let searchTimer =
    null;


/* ============================================================
   INIT SEARCH LISTENER
   Bind ke search input, debounce, re-render
============================================================ */

function initSearchListener() {

    if (state.d.insearch) {

        state.d.insearch
            .addEventListener(

                'input',

                function () {

                    clearTimeout(
                        searchTimer
                    );

                    searchTimer =
                        setTimeout(

                            function () {

                                renderFilteredProducts(
                                    true
                                );

                            },

                            250
                        );
                }
            );
    }
}


export {
    initSearchListener
};
