/**
 * ============================================
   LUMORA — HELPERS CORE
 * ============================================
 * 
 * Konstanta, state, dan fungsi helper.
 * Akses ke MiniMarket bersifat LAZY (di dalam fungsi)
 * untuk menghindari circular dependency dengan market.js.
 * 
 * Load order yang benar:
 * 1. formatter.js  (tanpa dep)
 * 2. storage.js    (tanpa dep)
 * 3. market.js     (butuh formatter + storage)
 * 4. helpers.js    (butuh window.MiniMarket, lazy)
 */

/* ============================================================
   FALLBACK IMAGES
   Didefinisikan langsung di sini (bukan import dari MM)
   untuk hindari circular dependency.
   Nilainya sama dengan yang ada di market.js.
============================================================ */

export var FALLBACK_IMG =
    '/assets/img/kategori.jpeg';

export var FALLBACK_CAT_IMG =
    '/assets/img/kategori.jpeg';


/* ============================================================
   SHIPPING OPTIONS
============================================================ */

export var SHIPS = [
    { id: 'gojek',  name: 'Gojek Instant',  price: 15000, est: '1-2 jam',  emoji: '&#128669;' },
    { id: 'grab',   name: 'Grab Instant',    price: 15000, est: '1-2 jam',  emoji: '&#128872;' },
    { id: 'shopee', name: 'Shopee Express',  price: 9000,  est: '2-3 hari', emoji: '&#128230;' },
    { id: 'pickup', name: 'Ambil di Tempat', price: 0,     est: 'Langsung', emoji: '&#127979;' }
];


/* ============================================================
   PAYMENT OPTIONS
============================================================ */

export var PAYS = [
    { id: 'cod',      name: 'COD (Bayar di Tempat)', desc: 'Bayar saat tiba',   emoji: '&#128181;' },
    { id: 'transfer', name: 'Transfer Bank',          desc: 'BCA, Mandiri, BRI', emoji: '&#127974;' },
    { id: 'qris',     name: 'QRIS',                   desc: 'Scan QR bayar',     emoji: '&#128247;' }
];


/* ============================================================
   VOUCHERS
============================================================ */

export var VOUS = [
    { id: 1, code: 'HEMAT10K',  disc: 10000, type: 'nominal', min: 50000  },
    { id: 2, code: 'HEMAT5K',   disc: 5000,  type: 'nominal', min: 30000  },
    { id: 3, code: 'DISKON20K', disc: 20000, type: 'nominal', min: 100000 }
];


/* ============================================================
   OTHER CONSTANTS
============================================================ */

export var WA =
    '6285189976233';

export var FREE_SHIP_MIN =
    50000;

export var MAX_CART =
    100;


/* ============================================================
   SVG ICON STRINGS
============================================================ */

export var SVG_MI = '<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>';

export var SVG_PL = '<svg class="w-3.5 h-3.5 text-white"     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>';

export var SVG_TR = '<svg class="w-4 h-4"                     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';


/* ============================================================
   ADMIN SESSION HELPERS
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
   SHARED STATE
============================================================ */

export var state = {
    cart: [],
    orders: [],
    selCat: '',
    co: { ship: '', pay: '', vou: null },
    curOrder: null,
    lockCnt: 0,
    tTimer: null,
    currentPage: 'home',
    isProcessing: false,
    d: {}
};


/* ============================================================
   FORMAT RUPIAH (wrapper around MM.fmt)
   LAZY: akses window.MiniMarket di dalam fungsi,
   bukan di top-level, untuk hindari circular dep.
============================================================ */

export function fmt(val) {

    return window.MiniMarket.fmt(val);
}


/* ============================================================
   FIND PRODUCT (lazy MM access)
============================================================ */

export function findProd(id) {

    var prods =
        window.MiniMarket.getProducts();

    for (
        var i = 0;
        i < prods.length;
        i++
    ) {

        if (
            String(prods[i].id) ===
            String(id)
        ) {

            return prods[i];
        }
    }

    return null;
}


/* ============================================================
   FIND CART ITEM
============================================================ */

export function findCart(id) {

    for (
        var i = 0;
        i < state.cart.length;
        i++
    ) {

        if (
            state.cart[i].id === id
        ) {

            return {
                it: state.cart[i],
                i: i
            };
        }
    }

    return null;
}


/* ============================================================
   CART TOTAL QTY
============================================================ */

export function cartQty() {

    var c = 0;

    for (
        var i = 0;
        i < state.cart.length;
        i++
    ) {

        c += state.cart[i].qty;
    }

    return c;
}
