var MM = window.MiniMarket;

export var FALLBACK_IMG = MM.FALLBACK_IMG;

/* ── constants ── */
export var SHIPS = [
    { id: 'gojek',  name: 'Gojek Instant',  price: 15000, est: '1-2 jam',  emoji: '&#128669;' },
    { id: 'grab',   name: 'Grab Instant',    price: 15000, est: '1-2 jam',  emoji: '&#128872;' },
    { id: 'shopee', name: 'Shopee Express',  price: 9000,  est: '2-3 hari', emoji: '&#128230;' },
    { id: 'pickup', name: 'Ambil di Tempat', price: 0,     est: 'Langsung', emoji: '&#127979;' }
];

export var PAYS = [
    { id: 'cod',      name: 'COD (Bayar di Tempat)', desc: 'Bayar saat tiba',   emoji: '&#128181;' },
    { id: 'transfer', name: 'Transfer Bank',          desc: 'BCA, Mandiri, BRI', emoji: '&#127974;' },
    { id: 'qris',     name: 'QRIS',                   desc: 'Scan QR bayar',     emoji: '&#128247;' }
];

export var VOUS = [
    { id: 1, code: 'HEMAT10K',  disc: 10000, type: 'nominal', min: 50000  },
    { id: 2, code: 'HEMAT5K',   disc: 5000,  type: 'nominal', min: 30000  },
    { id: 3, code: 'DISKON20K', disc: 20000, type: 'nominal', min: 100000 }
];

export var WA            = '6285189976233';
export var FREE_SHIP_MIN = 50000;
export var MAX_CART      = 100;

export var SVG_MI = '<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>';
export var SVG_PL = '<svg class="w-3.5 h-3.5 text-white"     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>';
export var SVG_TR = '<svg class="w-4 h-4"                     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

/* ── shared state ── */
export var state = {
    cart: [],
    orders: [],
    selCat: 'all',
    co: { ship: '', pay: '', vou: null },
    curOrder: null,
    lockCnt: 0,
    tTimer: null,
    currentPage: 'home',
    isProcessing: false,
    d: {} // DOM cache
};

/* ── helpers ── */
export function fmt(val) {
    return MM.fmt(val);
}

export function findProd(id) {
    var prods = MM.getProducts();
    for (var i = 0; i < prods.length; i++) if (prods[i].id === id) return prods[i];
    return null;
}

export function findCart(id) {
    for (var i = 0; i < state.cart.length; i++) if (state.cart[i].id === id) return { it: state.cart[i], i: i };
    return null;
}

export function cartQty() {
    var c = 0;
    for (var i = 0; i < state.cart.length; i++) c += state.cart[i].qty;
    return c;
}