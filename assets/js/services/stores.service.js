/**
 * ============================================
 * LUMORA — STORES SERVICE
 * ============================================
 * 
 * Menangani data cabang/toko (multi-tenant):
 * - Get current selected store ID
 * - Generate cart storage key per store
 * - Generate order storage key per store
 * - Fetch stores dari Supabase
 * - Save/load selected store
 */

/* ============================================================
   GLOBAL MINI MARKET
============================================================ */

const MM =
    window.MiniMarket;


/* ============================================================
   GET CURRENT STORE ID
============================================================ */

export function getCurrentStoreId() {

    return (
        localStorage.getItem(
            'lumora_selected_store'
        ) || null
    );
}


/* ============================================================
   STORAGE KEY GENERATORS
============================================================ */

export function getCartKey() {

    return MM.getCartStorageKey(
        getCurrentStoreId()
    );
}

export function getOrderKey() {

    return MM.getOrderStorageKey(
        getCurrentStoreId()
    );
}


/* ============================================================
   SAVE SELECTED STORE
============================================================ */

export function saveSelectedStore(storeId) {

    localStorage.setItem(
        'lumora_selected_store',
        storeId
    );
}


/* ============================================================
   LOAD SELECTED STORE
============================================================ */

export function loadSelectedStore() {

    return localStorage.getItem(
        'lumora_selected_store'
    );
}


/* ============================================================
   FETCH STORES FROM SUPABASE
============================================================ */

export async function fetchStores() {

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

        return [];
    }

    return data || [];
}


/* ============================================================
   GET STORE BY ID
============================================================ */

export function getStoreById(storeId) {

    const stores =
        MM.getStores();

    if (!stores) return null;

    for (
        let i = 0;
        i < stores.length;
        i++
    ) {

        if (
            stores[i].id === storeId
        ) {

            return stores[i];
        }
    }

    return null;
}


/* ============================================================
   GET ALL STORES (from cache)
============================================================ */

export function getAllStores() {

    return MM.getStores() || [];
}