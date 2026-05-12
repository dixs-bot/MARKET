/**
 * ============================================
   LUMORA — HELPERS CORE
 * ============================================
 * 
 * Fungsi utilitas umum, fallback images,
 * admin session helpers, dan placeholder
 * untuk fungsi yang belum diterima dari
 * file utils.js asli (state, findCart, dll).
 */

/* ============================================================
   FALLBACK IMAGES
============================================================ */

export const FALLBACK_IMG =
    '/assets/img/kategori.jpeg';

export const FALLBACK_CAT_IMG =
    '/assets/img/kategori.jpeg';


/* ============================================================
   ADMIN SESSION HELPERS
   Membaca window.AdminSession yang di-set oleh
   halaman admin sebelumnya
============================================================ */

export function getCurrentStoreId() {

    return (
        window.AdminSession?.store_id ||
        null
    );
}

export function isAdminCabang() {

    return (
        window.AdminSession?.role ===
        'admin'
    );
}

export function isSuperAdmin() {

    return (
        window.AdminSession?.role ===
        'super_admin'
    );
}


/* ============================================================
   PLACEHOLDERS
   Fungsi dan konstanta ini awalnya dari file
   utils.js yang terpisah. Tempatkan kode asli
   kamu di sini untuk mengganti placeholder.
============================================================ */

/* ---- state object ---- */

export const state = {

    // TODO: Pindahkan dari file utils.js asli
    // Seluruh objek state (cart, orders, co, d, dll)
};

/* ---- cart finder ---- */

export function findCart(productId) {

    // TODO: Pindahkan dari file utils.js asli
    const cart = state.cart;

    for (
        let i = 0;
        i < cart.length;
        i++
    ) {

        if (
            cart[i].id === productId
        ) {

            return {
                i: i,
                it: cart[i]
            };
        }
    }

    return null;
}

/* ---- product finder ---- */

export function findProd(productId) {

    // TODO: Pindahkan dari file utils.js asli
    const MM =
        window.MiniMarket;

    const products =
        MM.getProducts();

    if (!products) return null;

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        if (
            products[i].id === productId
        ) {

            return products[i];
        }
    }

    return null;
}

/* ---- shipping options ---- */

export const SHIPS = [

    // TODO: Pindahkan dari file utils.js asli
    // { id: 'regular', name: 'Regular', price: 10000, est: '2-3 hari' },
    // { id: 'express', name: 'Express', price: 20000, est: '1-2 hari' },
];

/* ---- payment options ---- */

export const PAYS = [

    // TODO: Pindahkan dari file utils.js asli
    // { id: 'cod', name: 'COD' },
    // { id: 'transfer', name: 'Transfer Bank' },
];

/* ---- voucher list ---- */

export const VOUS = [

    // TODO: Pindahkan dari file utils.js asli
    // { id: 'v1', code: 'HEMAT10', disc: 10000 },
];

/* ---- free shipping minimum ---- */

export const FREE_SHIP_MIN =

    // TODO: Pindahkan dari file utils.js asli
    50000;

/* ---- max cart items ---- */

export const MAX_CART =

    // TODO: Pindahkan dari file utils.js asli
    20;
