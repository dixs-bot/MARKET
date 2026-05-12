/**
 * ============================================
 * LUMORA — PRODUCTS RENDER
 * ============================================
 * 
 * Menangani rendering produk:
 * - renderFilteredProducts() → entry point
 * - queueRender() → requestAnimationFrame throttle
 * - Empty state rendering
 */

import { state } from '../../utils.js';

import {
    renderProds
} from '../../renderers.js';

import {

    getSelectedStoreId,
    buildFilteredProducts,
    getPaginatedProducts,
    resetPage

} from './filter.js';


/* ============================================================
   RENDER QUEUE
   Mencegah multiple render dalam satu frame
============================================================ */

let renderQueue =
    false;

function queueRender(callback) {

    if (renderQueue)
        return;

    renderQueue = true;

    requestAnimationFrame(() => {

        try {

            callback();

        } finally {

            renderQueue = false;
        }
    });
}


/* ============================================================
   RENDER FILTERED PRODUCTS
   Entry point: dipanggil dari luar saat perlu re-render
   - Dari categories change
   - Dari store change
   - Dari search input
   - Dari pagination (load more)
============================================================ */

function renderFilteredProducts(
    resetPageFlag = false
) {

    if (resetPageFlag) {

        resetPage();
    }

    buildFilteredProducts();

    queueRender(() => {

        const selectedStoreId =
            getSelectedStoreId();

        /* =========================
           EMPTY: belum pilih cabang
        ========================= */

        if (!selectedStoreId) {

            if (state.d.pgrid) {

                state.d.pgrid.innerHTML = `

                    <div class="
                        col-span-2
                        text-center
                        py-16
                    ">

                        <p class="
                            text-sm
                            text-slate-400
                            font-medium
                        ">
                            Pilih cabang terlebih dahulu
                        </p>

                    </div>
                `;
            }

            if (state.d.pcnt) {

                state.d.pcnt.textContent =
                    '0 item';
            }

            return;
        }

        /* =========================
           RENDER PRODUCT GRID
        ========================= */

        const visible =
            getPaginatedProducts();

        renderProds(visible);
    });
}


export {
    renderFilteredProducts
};
