/**
 * ============================================
 * LUMORA — CATEGORIES FEATURE
 * ============================================
 * 
 * Menangani kategori produk:
 * - Fetch kategori dari Supabase (via MiniMarket)
 * - Render category bar (horizontal scroll)
 * - Handle category selection
 * - Populate store dropdown (multi-tenant)
 * - Update active category di State
 */

import { state } from '../../utils.js';

import {
    renderCats
} from '../../renderers.js';


/* ============================================================
   CATEGORY RENDER
============================================================ */

function renderFilteredCategories() {

    const selectedStoreId =
        document.getElementById(
            'store-filter'
        )?.value;

    if (!selectedStoreId) {

        if (state.d.catbar) {

            state.d.catbar.innerHTML =
                '';
        }

        return;
    }

    const categories =
        MM.getCategories();

    const filtered =
        categories.filter(category =>

            category.store_id ===
            selectedStoreId
        );

    renderCats(filtered);
}


/* ============================================================
   STORE FILTER
============================================================ */

async function loadStoreFilter() {

    const {

        data,
        error

    } =

    await window.supabaseClient

        .from('stores')

        .select('*')

        .order('name');

    if (error) {

        console.error(error);

        return;
    }

    const select =
        document.getElementById(
            'store-filter'
        );

    if (!select)
        return;

    select.innerHTML = `

        <option value="">
            Pilih Cabang
        </option>
    `;

    data.forEach(store => {

        select.innerHTML += `

            <option value="${store.id}">
                ${store.name}
            </option>
        `;
    });

    const savedStoreId =
        localStorage.getItem(
            'lumora_selected_store'
        );

    if (savedStoreId) {

        select.value =
            savedStoreId;
    }
}


/* ============================================================
   CLICK HANDLER
   Menangani click events terkait kategori.
   Return true jika click ditangani di sini.
============================================================ */

function handleClick(e) {

    const el =
        e.target.closest(
            '[data-cat]'
        );

    if (el) {

        state.selCat =
            el.dataset.cat;

        /* Import dinamis untuk hindari circular */
        import('../products/index.js').then(
            mod => {

                mod.renderFilteredProducts(
                    true
                );
            }
        );

        renderFilteredCategories();

        return true;
    }

    return false;
}


export {
    handleClick,
    renderFilteredCategories,
    loadStoreFilter
};