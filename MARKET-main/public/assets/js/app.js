/* ============================================================
   CONSUMER (STOREFRONT) IIFE
   ============================================================ */
(function () {
    'use strict';

    var MM           = window.MiniMarket;
    var FALLBACK_IMG = MM.FALLBACK_IMG;
    var fmt          = MM.fmt;

    /* ── constants ── */
    var SHIPS = [
        { id: 'gojek',  name: 'Gojek Instant',  price: 15000, est: '1-2 jam',  emoji: '&#128669;' },
        { id: 'grab',   name: 'Grab Instant',    price: 15000, est: '1-2 jam',  emoji: '&#128872;' },
        { id: 'shopee', name: 'Shopee Express',  price: 9000,  est: '2-3 hari', emoji: '&#128230;' },
        { id: 'pickup', name: 'Ambil di Tempat', price: 0,     est: 'Langsung', emoji: '&#127979;' }
    ];

    var PAYS = [
        { id: 'cod',      name: 'COD (Bayar di Tempat)', desc: 'Bayar saat tiba',   emoji: '&#128181;' },
        { id: 'transfer', name: 'Transfer Bank',          desc: 'BCA, Mandiri, BRI', emoji: '&#127974;' },
        { id: 'qris',     name: 'QRIS',                   desc: 'Scan QR bayar',     emoji: '&#128247;' }
    ];

    var VOUS = [
        { id: 1, code: 'HEMAT10K',  disc: 10000, type: 'nominal', min: 50000  },
        { id: 2, code: 'HEMAT5K',   disc: 5000,  type: 'nominal', min: 30000  },
        { id: 3, code: 'DISKON20K', disc: 20000, type: 'nominal', min: 100000 }
    ];

    var WA            = '6285189976233';
    var FREE_SHIP_MIN = 50000;
    var MAX_CART      = 100;

    var SVG_MI = '<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>';
    var SVG_PL = '<svg class="w-3.5 h-3.5 text-white"     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>';
    var SVG_TR = '<svg class="w-4 h-4"                     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

    /* ── state ── */
    var cart         = [];
    var orders       = [];
    var selCat       = 'all';
    var co           = { ship: '', pay: '', vou: null };
    var curOrder     = null;
    var lockCnt      = 0;
    var tTimer       = null;
    var currentPage  = 'home';
    var isProcessing = false;

    /* ── DOM cache ── */
    var d = {};
    function cache() {
        var g = function (id) { return document.getElementById(id); };
        d.dim        = g('dim');              d.csheet     = g('cart-sheet');
        d.clist      = g('cart-list');        d.cnone      = g('cart-none');
        d.cft        = g('cart-ft');          d.ccnt       = g('cart-cnt');
        d.ctotal     = g('cart-total');       d.fab        = g('fab-cart');
        d.badge      = g('cart-badge');       d.catbar     = g('cat-bar');
        d.pgrid      = g('prod-grid');        d.pcnt       = g('prod-cnt');
        d.pgco       = g('pg-checkout');      d.coscroll   = g('checkout-scroll');
        d.inaddr     = g('in-addr');          d.innote     = g('in-note');
        d.eaddr      = g('err-addr');         d.eship      = g('err-ship');
        d.epay       = g('err-pay');          d.ships      = g('ship-opts');
        d.pays       = g('pay-opts');         d.freebanner = g('free-ship-banner');
        d.coitems    = g('co-items');         d.ssub       = g('s-sub');
        d.sship      = g('s-ship');           d.discr      = g('s-disc-row');
        d.sdisc      = g('s-disc');           d.stotal     = g('s-total');
        d.vlbl       = g('v-label');          d.border     = g('btn-order');
        d.hint       = g('co-hint');          d.mconf      = g('m-confirm');
        d.mload      = g('m-loading');        d.pginv      = g('pg-invoice');
        d.invbody    = g('inv-body');         d.bwa        = g('btn-wa');
        d.pgsearch   = g('pg-search');        d.insearch   = g('in-search');
        d.sres       = g('search-res');       d.pgvou      = g('pg-vou');
        d.vlist      = g('vou-list');         d.olist      = g('ord-list');
        d.oempty     = g('ord-empty');        d.toast      = g('toast');
    }

    /* ── utils ── */
    function notify(m) {
        if (tTimer) clearTimeout(tTimer);
        d.toast.textContent = m;
        d.toast.classList.add('show');
        tTimer = setTimeout(function () { d.toast.classList.remove('show'); }, 2200);
    }

    /* Unified image helper */
    function getImg(src) {
        return src || FALLBACK_IMG;
    }

    /* ── product lookup — always live ── */
    function findProd(id) {
        var prods = MM.getProducts();
        for (var i = 0; i < prods.length; i++) if (prods[i].id === id) return prods[i];
        return null;
    }

    function findCart(id) {
        for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return { it: cart[i], i: i };
        return null;
    }

    /* ── FIX: subTotal uses LIVE prices ─────────────────────────
       Build a product map from localStorage once per call so we
       never multiply with a stale cached price.
    ─────────────────────────────────────────────────────────── */
    function subTotal() {
        var prods   = MM.getProducts();
        var prodMap = {};
        for (var i = 0; i < prods.length; i++) prodMap[prods[i].id] = prods[i];

        var t = 0;
        for (var j = 0; j < cart.length; j++) {
            var it   = cart[j];
            var live = prodMap[it.id];
            /* Use live price when available; fall back to snapshot price
               (e.g. product was deleted between add and checkout) */
            var price = live ? live.price : it.price;
            /* Keep the cart snapshot in sync for invoice rendering */
            it.price = price;
            t += price * it.qty;
        }
        return t;
    }

    function cartQty() {
        var c = 0;
        for (var i = 0; i < cart.length; i++) c += cart[i].qty;
        return c;
    }

    function lock()   { if (!lockCnt) document.body.style.overflow = 'hidden'; lockCnt++; }
    function unlock() { lockCnt = Math.max(0, lockCnt - 1); if (!lockCnt) document.body.style.overflow = ''; }

    /* ── storage ── */
    function load() {
        try {
            var c = localStorage.getItem(MM.LS_CART);
            var o = localStorage.getItem(MM.LS_ORDERS);
            cart   = c ? JSON.parse(c) : [];
            orders = o ? JSON.parse(o) : [];
        } catch (e) {
            console.error('Storage corrupt, reset:', e);
            cart = []; orders = [];
            try { localStorage.removeItem(MM.LS_CART); localStorage.removeItem(MM.LS_ORDERS); } catch (x) {}
        }
    }

    function save() {
        try {
            localStorage.setItem(MM.LS_CART,   JSON.stringify(cart));
            localStorage.setItem(MM.LS_ORDERS, JSON.stringify(orders));
        } catch (e) { console.error('save() failed:', e); }
    }

    /* ── qty patch — surgical update, no full re-render ── */
    function patchQty(pid, isSearch) {
        var pre = isSearch ? 'sq' : 'pq';
        var el  = document.getElementById(pre + '-' + pid);
        if (!el) return;
        var f = findCart(pid);
        el.innerHTML = qtyHTML(pid, f ? f.it.qty : 0, isSearch);
    }

    function patchBadge() {
        var c = cartQty();
        d.badge.textContent = c;
        if (c > 0) {
            d.fab.classList.remove('hidden');
            d.badge.classList.remove('pop');
            void d.badge.offsetWidth;
            d.badge.classList.add('pop');
        } else {
            d.fab.classList.add('hidden');
        }
    }

    function qtyHTML(pid, qty, isSearch) {
        var a = isSearch ? 'data-sa' : 'data-a';
        var m = isSearch ? 'data-sm' : 'data-m';
        var p = isSearch ? 'data-sp' : 'data-p';
        if (qty > 0)
            return '<div class="flex items-center justify-between bg-blue-50 rounded-xl p-0.5">' +
                   '<button ' + m + '="' + pid + '" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center tap">' + SVG_MI + '</button>' +
                   '<span class="font-bold text-blue-600 text-base">' + qty + '</span>' +
                   '<button ' + p + '="' + pid + '" class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center tap">' + SVG_PL + '</button></div>';
        return '<button ' + a + '="' + pid + '" class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold tap">+ Tambah</button>';
    }

    /* ── cart mutation ── */
    function addCart(pid, delta) {
        if (cart.length >= MAX_CART) { notify('Keranjang penuh (maks ' + MAX_CART + ' item)'); return; }

        var prod = findProd(pid);   // always fresh from localStorage
        if (!prod) return;

        var f   = findCart(pid);
        var cur = f ? f.it.qty : 0;

        if (delta > 0) {
            if (cur >= prod.stock) { notify('Stok habis'); return; }
        }

        if (f) {
            f.it.qty  += delta;
            f.it.price = prod.price;    // keep snapshot current
            f.it.image = prod.image;
            if (f.it.qty <= 0) cart.splice(f.i, 1);
        } else if (delta > 0) {
            cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, qty: 1 });
        }

        save();
        patchQty(pid, false);
        patchQty(pid, true);
        if (d.csheet.classList.contains('open')) renderCart();
        patchBadge();
    }

    function delCart(pid) {
        var f = findCart(pid);
        if (f) cart.splice(f.i, 1);
        save(); renderCart(); patchQty(pid, false); patchBadge();
        if (!cart.length) closeCart();
    }

    /* ── renderers ── */
    function renderCats() {
        var bar = d.catbar;
        if (!bar) return;

        var cats = MM.getCategories();
        var h = '';

        for (var i = 0; i < cats.length; i++) {
            var c  = cats[i];
            var on = selCat === c.id;

            h += '<div data-cat="' + c.id + '" class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" style="min-width:56px">' +
                 '<div class="rounded-full overflow-hidden border-2 ' + (on ? 'border-blue-500' : 'border-slate-100') + '" style="width:52px;height:52px">' +
                 '<img src="' + getImg(c.image) + '" class="w-full h-full object-cover" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
                 '</div>' +
                 '<span class="text-[10px] font-semibold ' + (on ? 'text-blue-600' : 'text-slate-400') + '">' + c.name + '</span>' +
                 '</div>';
        }

        bar.innerHTML = h;
    }

    function renderCard(prod, isSearch) {
        var pre = isSearch ? 'sq' : 'pq';
        var f   = findCart(prod.id);
        var qty = f ? f.it.qty : 0;

        return '<div class="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">' +
               '<div class="aspect-square bg-slate-100 overflow-hidden">' +
               '<img src="' + getImg(prod.image) + '" ' +
               'alt="' + prod.name + '" ' +
               'class="w-full h-full object-cover" ' +
               'loading="lazy" ' +
               'onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
               '</div>' +
               '<div class="p-2.5"><h3 class="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug">' + prod.name + '</h3>' +
               '<p class="text-blue-600 font-bold text-xs mt-1">' + fmt(prod.price) + '</p>' +
               '<div id="' + pre + '-' + prod.id + '" class="mt-1.5">' + qtyHTML(prod.id, qty, isSearch) + '</div>' +
               '</div></div>';
    }

    function renderProds() {
        var PRODS = MM.getProducts();
        var list  = PRODS;
        if (selCat !== 'all') {
            list = [];
            for (var i = 0; i < PRODS.length; i++)
                if (PRODS[i].category === selCat) list.push(PRODS[i]);
        }
        d.pcnt.textContent = list.length + ' item';
        if (!list.length) {
            d.pgrid.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Tidak ada produk</p></div>';
            return;
        }
        var h = '';
        for (var j = 0; j < list.length; j++) h += renderCard(list[j], false);
        d.pgrid.innerHTML = h;
    }

    /* renderCart — live prices & images via one shared product map */
    function renderCart() {
        var cnt = cartQty();
        d.ccnt.textContent = cnt + ' item';

        if (!cart.length) {
            d.clist.classList.add('hidden');
            d.cnone.classList.remove('hidden');
            d.cft.classList.add('hidden');
            return;
        }
        d.clist.classList.remove('hidden');
        d.cnone.classList.add('hidden');
        d.cft.classList.remove('hidden');

        var liveProds = MM.getProducts();
        var liveMap   = {};
        for (var k = 0; k < liveProds.length; k++) liveMap[liveProds[k].id] = liveProds[k];

        var h = '';
        for (var i = 0; i < cart.length; i++) {
            var it        = cart[i];
            var live      = liveMap[it.id];
            var liveImg   = live ? live.image : it.image;
            var livePrice = live ? live.price : it.price;

            h += '<div class="flex gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100">' +
            '<img src="' + getImg(liveImg) + '" class="w-14 h-14 rounded-lg object-cover bg-white" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
            '<div class="flex-1 min-w-0">' +
            '<p class="text-xs font-medium text-slate-800 line-clamp-2">' + it.name + '</p>' +
            '<p class="text-blue-600 font-bold text-xs mt-0.5">' + fmt(livePrice) + '</p>' +
            '<div class="flex items-center gap-1.5 mt-1">' +
            '<button data-cm="' + it.id + '" class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center tap">' + SVG_MI + '</button>' +
            '<span class="text-xs font-semibold w-5 text-center text-slate-800">' + it.qty + '</span>' +
            '<button data-cp="' + it.id + '" class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center tap">' + SVG_PL + '</button>' +
            '</div></div>' +
            '<button data-cr="' + it.id + '" class="text-red-300 self-start tap p-0.5">' + SVG_TR + '</button></div>';
        }
        d.clist.innerHTML = h;
    }

    function renderShips() {
        var sub      = subTotal();
        var autoFree = sub >= FREE_SHIP_MIN;
        if (autoFree) d.freebanner.classList.remove('hidden');
        else          d.freebanner.classList.add('hidden');

        var h = '';
        for (var i = 0; i < SHIPS.length; i++) {
            var m   = SHIPS[i], sel = co.ship === m.id;
            var dp  = autoFree ? 0 : m.price;
            var pt  = dp === 0 ? 'Gratis' : fmt(dp);
            var pc  = dp === 0 ? 'text-green-600' : 'text-slate-700';
            h += '<div data-ship="' + m.id + '" class="sel flex items-center gap-2.5 p-3 rounded-xl border-2 ' +
                 (sel ? 'on border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white') + '">' +
                 '<span class="text-lg">' + m.emoji + '</span>' +
                 '<div class="flex-1"><p class="text-xs font-semibold text-slate-800">' + m.name + '</p>' +
                 '<p class="text-[10px] text-slate-400">' + m.est + '</p></div>' +
                 '<span class="text-xs font-semibold ' + pc + '">' + pt + '</span></div>';
        }
        d.ships.innerHTML = h;
    }

    function renderPays() {
        var h = '';
        for (var i = 0; i < PAYS.length; i++) {
            var m = PAYS[i], sel = co.pay === m.id;
            h += '<div data-pay="' + m.id + '" class="sel flex items-center gap-2.5 p-3 rounded-xl border-2 ' +
                 (sel ? 'on border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white') + '">' +
                 '<span class="text-lg">' + m.emoji + '</span>' +
                 '<div class="flex-1"><p class="text-xs font-semibold text-slate-800">' + m.name + '</p>' +
                 '<p class="text-[10px] text-slate-400">' + m.desc + '</p></div></div>';
        }
        d.pays.innerHTML = h;
    }

    /* renderSummary — uses live subTotal so figures always match */
    function renderSummary() {
        var sub      = subTotal();    // live prices
        var autoFree = sub >= FREE_SHIP_MIN;
        var shipM    = null;
        for (var i = 0; i < SHIPS.length; i++) if (SHIPS[i].id === co.ship) { shipM = SHIPS[i]; break; }
        var baseShip  = shipM ? shipM.price : 0;
        var finalShip = autoFree ? 0 : baseShip;
        var disc      = 0;
        if (co.vou) {
            if (sub >= co.vou.min) disc = co.vou.disc;
            else { co.vou = null; d.vlbl.textContent = 'Opsional'; }
        }
        var total = Math.max(0, sub + finalShip - disc);

        var ih = '';
        for (var j = 0; j < cart.length; j++) {
            var it = cart[j];
            ih += '<div class="flex justify-between text-[11px]">' +
                  '<span class="text-slate-600 truncate flex-1">' + it.name + '</span>' +
                  '<span class="text-slate-400 ml-1">x' + it.qty + '</span>' +
                  '<span class="text-slate-700 font-medium ml-2">' + fmt(it.price * it.qty) + '</span></div>';
        }

        d.coitems.innerHTML  = ih;
        d.ssub.textContent   = fmt(sub);
        d.sship.textContent  = (finalShip === 0 && shipM) ? 'Gratis' : fmt(finalShip);
        if (disc > 0) { d.discr.classList.remove('hidden'); d.sdisc.textContent = '-' + fmt(disc); }
        else            d.discr.classList.add('hidden');
        d.stotal.textContent = fmt(total);
    }

    function renderVou() {
        var sub = subTotal();
        var h   = '';
        for (var i = 0; i < VOUS.length; i++) {
            var v   = VOUS[i];
            var ok  = sub >= v.min;
            var sel = co.vou && co.vou.id === v.id;
            h += '<div data-vou="' + v.id + '" class="border-2 rounded-xl p-3.5 transition-all ' +
                 (sel ? 'border-blue-500 bg-blue-50/50' : ok ? 'border-slate-200 bg-white cursor-pointer' : 'border-slate-100 bg-slate-50 opacity-50') + '">' +
                 '<div class="flex items-center justify-between mb-1">' +
                 '<span class="text-xs font-bold text-blue-600">' + v.code + '</span>' +
                 (sel ? '<span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Dipilih</span>' : '') + '</div>' +
                 '<p class="text-xs font-semibold text-slate-800">Diskon ' + fmt(v.disc) + '</p>' +
                 '<p class="text-[10px] text-slate-400 mt-0.5">Min. belanja ' + fmt(v.min) + '</p>' +
                 (!ok ? '<p class="text-[10px] text-red-500 mt-1 font-medium">Belum memenuhi minimum</p>' : '') + '</div>';
        }
        d.vlist.innerHTML = h;
    }

    function renderInv() {
        var o = curOrder; if (!o) return;

        var ih = '';
        for (var i = 0; i < o.items.length; i++) {
            var it = o.items[i];
            ih += '<div class="flex items-center gap-2.5">' +
                  '<img src="' + getImg(it.image) + '" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
                  '<div class="flex-1 min-w-0"><p class="text-xs font-medium text-slate-800 truncate">' + it.name + '</p>' +
                  '<p class="text-[10px] text-slate-400">' + it.qty + 'x ' + fmt(it.price) + '</p></div>' +
                  '<span class="text-xs font-semibold text-slate-800">' + fmt(it.price * it.qty) + '</span></div>';
        }

        var sl      = o.status.charAt(0).toUpperCase() + o.status.slice(1);
        var payName = o.payment ? o.payment.name : '-';

        d.invbody.innerHTML =
            '<div class="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white text-center">' +
            '<div class="text-3xl mb-1">&#10003;</div><h2 class="text-base font-bold">Pesanan Berhasil</h2>' +
            '<p class="text-xs opacity-80 mt-0.5">#' + o.id + '</p></div>' +
            '<div class="p-4 border-b border-slate-100"><div class="flex justify-between items-center">' +
            '<span class="text-[10px] text-slate-400">Status</span>' +
            '<span class="st-' + o.status + ' text-[10px] font-semibold px-2.5 py-0.5 rounded-full">' + sl + '</span></div></div>' +
            '<div class="p-4 border-b border-slate-100"><p class="text-xs font-semibold text-slate-800 mb-2">Detail Pesanan</p>' +
            '<div class="space-y-2">' + ih + '</div></div>' +
            '<div class="p-4 border-b border-slate-100 space-y-1.5 text-[11px]">' +
            '<div class="flex justify-between"><span class="text-slate-400">Subtotal</span><span class="text-slate-700">' + fmt(o.subtotal) + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-400">Ongkir</span>' +
            '<span class="' + (o.shipPrice === 0 ? 'text-green-600 font-medium' : 'text-slate-700') + '">' + (o.shipPrice === 0 ? 'Gratis' : fmt(o.shipPrice)) + '</span></div>' +
            (o.discount > 0 ? '<div class="flex justify-between"><span class="text-slate-400">Diskon</span><span class="text-green-600 font-medium">-' + fmt(o.discount) + '</span></div>' : '') +
            '<div class="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold"><span>Total</span><span class="text-blue-600">' + fmt(o.total) + '</span></div></div>' +
            '<div class="p-4 border-b border-slate-100"><p class="text-xs font-semibold text-slate-800 mb-1">Alamat</p>' +
            '<p class="text-[11px] text-slate-500">' + o.address + '</p></div>' +
            '<div class="p-4"><p class="text-xs font-semibold text-slate-800 mb-1">Pembayaran</p>' +
            '<p class="text-[11px] text-slate-500">' + payName + '</p></div>';
    }

    function renderOrders() {
        if (!orders.length) {
            d.olist.classList.add('hidden'); d.oempty.classList.remove('hidden'); return;
        }
        d.olist.classList.remove('hidden'); d.oempty.classList.add('hidden');

        var h = '';
        for (var i = orders.length - 1; i >= 0; i--) {
            var o    = orders[i];
            var sl   = o.status.charAt(0).toUpperCase() + o.status.slice(1);
            var prev = '';
            var mx   = Math.min(o.items.length, 2);
            for (var j = 0; j < mx; j++) {
                var it = o.items[j];
                prev += '<div class="flex items-center gap-2">' +
                        '<img src="' + getImg(it.image) + '" class="w-8 h-8 rounded-lg object-cover bg-slate-100" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
                        '<div class="flex-1 min-w-0"><p class="text-[11px] font-medium text-slate-800 truncate">' + it.name + '</p>' +
                        '<p class="text-[10px] text-slate-400">' + it.qty + 'x ' + fmt(it.price) + '</p></div></div>';
            }
            if (o.items.length > 2) prev += '<p class="text-[10px] text-slate-400">+' + (o.items.length - 2) + ' lainnya</p>';
            h += '<div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">' +
                 '<div class="flex justify-between mb-2"><span class="text-[10px] text-slate-400">#' + o.id + '</span>' +
                 '<span class="st-' + o.status + ' text-[10px] font-semibold px-2.5 py-0.5 rounded-full">' + sl + '</span></div>' +
                 '<div class="space-y-1.5 mb-2">' + prev + '</div>' +
                 '<div class="flex justify-between pt-2 border-t border-slate-200">' +
                 '<span class="text-sm font-bold text-blue-600">' + fmt(o.total) + '</span>' +
                 '<button data-odet="' + o.id + '" class="text-blue-600 text-[11px] font-semibold tap">Detail</button></div></div>';
        }
        d.olist.innerHTML = h;
    }

    /* ── checkout state helpers ── */
    function selShip(id) { co.ship = id; renderShips(); validate(false); renderSummary(); }
    function selPay(id)  { co.pay  = id; renderPays();  validate(false); }

    function selVou(vid) {
        var v = null;
        for (var i = 0; i < VOUS.length; i++) if (VOUS[i].id === vid) { v = VOUS[i]; break; }
        if (co.vou && co.vou.id === vid) { co.vou = null; d.vlbl.textContent = 'Opsional'; }
        else { co.vou = v; if (v) d.vlbl.textContent = v.code + ' (-' + fmt(v.disc) + ')'; }
        closeVou(); renderSummary();
    }

    function validate(showErr) {
        var a  = d.inaddr.value.trim().length >= 10;
        var s  = co.ship !== '';
        var p  = co.pay  !== '';
        var ok = a && s && p;
        if (ok) {
            d.border.disabled = false;
            d.border.classList.remove('btn-off'); d.border.classList.add('btn-on');
            d.hint.textContent = 'Siap pesan';
        } else {
            d.border.disabled = true;
            d.border.classList.add('btn-off'); d.border.classList.remove('btn-on');
            d.hint.textContent = 'Lengkapi semua data';
        }
        if (showErr !== true) return ok;
        d.eaddr.classList.toggle('hidden', a);
        d.eship.classList.toggle('hidden', s);
        d.epay.classList.toggle('hidden',  p);
        d.inaddr.classList.toggle('err-input', !a);
        return ok;
    }

    function resetCO() { co.ship = ''; co.pay = ''; co.vou = null; }
    function animateIn(el) { el.classList.remove('page-in'); void el.offsetWidth; el.classList.add('page-in'); }

    function goToHome() {
        d.pginv.classList.add('hidden'); unlock();
        currentPage = 'home'; curOrder = null; navTo('home');
    }

    function goToCart() {
        d.pgco.classList.add('hidden'); d.mconf.classList.add('hidden');
        renderCart(); d.csheet.classList.add('open'); d.dim.classList.add('on');
        currentPage = 'cart';
    }

    function goToCheckout() {
        if (!cart.length) { notify('Keranjang kosong'); return; }
        d.csheet.classList.remove('open'); d.dim.classList.remove('on');
        if (lockCnt === 0) lock();
        if (currentPage !== 'confirm') {
            resetCO(); d.inaddr.value = ''; d.innote.value = ''; d.vlbl.textContent = 'Opsional';
            d.eaddr.classList.add('hidden'); d.eship.classList.add('hidden'); d.epay.classList.add('hidden');
            d.inaddr.classList.remove('err-input');
        }
        renderShips(); renderPays(); renderSummary(); validate(false);
        d.pgco.classList.remove('hidden');
        if (d.coscroll) { d.coscroll.scrollTop = 0; animateIn(d.coscroll); }
        currentPage = 'checkout';
    }

    function goToConfirm() {
        if (!validate(true)) { notify('Lengkapi data!'); return; }
        d.mconf.classList.remove('hidden'); currentPage = 'confirm';
    }

    function backToCheckout() { d.mconf.classList.add('hidden'); currentPage = 'checkout'; }

    /* ── place order ─────────────────────────────────────────────
       CRITICAL FIX: atomicDeductStock merges validation + deduction
       into one localStorage read-modify-write.  The result drives
       both the stock-error path and the successful commit path, so
       there is zero window between "checked" and "deducted".
       validateOrder then confirms the built order object is fully
       consistent before it is pushed to history.
    ─────────────────────────────────────────────────────────── */
    function goToInvoice() {
        if (isProcessing)      return;
        if (d.border.disabled) return;
        isProcessing = true;

        d.mconf.classList.add('hidden');
        d.mload.classList.remove('hidden');

        setTimeout(function () {
            try {
                /* ── Step 1: resolve shipping & payment objects ── */
                var sm = null, pm = null;
                for (var i = 0; i < SHIPS.length; i++) if (SHIPS[i].id === co.ship) { sm = SHIPS[i]; break; }
                for (var j = 0; j < PAYS.length;  j++) if (PAYS[j].id  === co.pay)  { pm = PAYS[j];  break; }

                if (!sm || !pm) {
                    notify('Pilih pengiriman dan pembayaran');
                    d.mload.classList.add('hidden');
                    isProcessing = false;
                    return;
                }

                /* ── Step 2: ATOMIC stock validation + deduction ──
                   atomicDeductStock also syncs cart item prices/images
                   to live values, so subTotal() after this call is
                   always computed from current prices.
                ─────────────────────────────────────────────────── */
                var stockResult = MM.atomicDeductStock(cart);

                if (!stockResult.ok) {
                    notify('Stok tidak cukup: ' + stockResult.errors.join(', '));
                    d.mload.classList.add('hidden');
                    /* Return user to checkout page so they can adjust */
                    d.pgco.classList.remove('hidden');
                    renderShips(); renderPays(); renderSummary(); validate(false);
                    currentPage  = 'checkout';
                    isProcessing = false;
                    return;
                }

                /* ── Step 3: compute financials from live (now synced) prices ── */
                var sub       = subTotal();   // prices already updated by atomicDeductStock
                var autoFree  = sub >= FREE_SHIP_MIN;
                var baseShip  = sm.price;
                var finalShip = autoFree ? 0 : baseShip;
                var disc      = 0;
                if (co.vou && sub >= co.vou.min) disc = co.vou.disc;
                var total     = Math.max(0, sub + finalShip - disc);

                /* ── Step 4: build order object ── */
                var newOrder = {
                    id:        'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    items:     cart.slice(),        // snapshot with prices already synced
                    address:   d.inaddr.value.trim(),
                    shipping:  sm,
                    payment:   pm,
                    subtotal:  sub,
                    shipPrice: finalShip,
                    discount:  disc,
                    total:     total,
                    notes:     d.innote.value.trim(),
                    status:    'diproses',
                    createdAt: Date.now()
                };

                /* ── Step 5: validate order structure before persisting ── */
                var orderCheck = MM.validateOrder(newOrder);
                if (!orderCheck.ok) {
                    console.error('[MiniMarket] order validation failed:', orderCheck.reason);
                    notify('Gagal memproses pesanan (' + orderCheck.reason + ')');
                    d.mload.classList.add('hidden');
                    isProcessing = false;
                    return;
                }

                /* ── Step 6: commit ── */
                curOrder = newOrder;
                orders.push(curOrder);

                cart = [];
                resetCO();
                save();

                /* Single coordinated UI refresh */
                renderCart();
                renderProds();
                patchBadge();

                d.mload.classList.add('hidden');
                d.pgco.classList.add('hidden');
                renderInv();
                d.pginv.classList.remove('hidden');
                d.pginv.scrollTop = 0;
                animateIn(d.pginv);
                currentPage = 'invoice';

            } catch (err) {
                console.error('Order error:', err);
                d.mload.classList.add('hidden');
                notify('Gagal memproses pesanan');
            } finally {
                isProcessing = false;
            }
        }, 600);
    }

    function openCart() {
        if (!cart.length) { notify('Keranjang kosong'); return; }
        renderCart(); d.csheet.classList.add('open'); d.dim.classList.add('on');
        lock(); currentPage = 'cart';
    }
    function closeCart()   { d.csheet.classList.remove('open'); d.dim.classList.remove('on'); unlock(); currentPage = 'home'; }
    function openVou()     { renderVou(); d.pgvou.classList.remove('hidden'); lock(); }
    function closeVou()    { d.pgvou.classList.add('hidden'); unlock(); }
    function openSearch()  {
        d.pgsearch.classList.remove('hidden'); d.insearch.value = '';
        d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Mencari...</p></div>';
        lock(); setTimeout(function () { d.insearch.focus(); }, 80);
    }
    function closeSearch() { d.pgsearch.classList.add('hidden'); unlock(); }

    function sendWA() {
        if (!curOrder) { notify('Pesanan tidak ditemukan'); return; }

        var o = curOrder;
        var t = 'Halo, saya ingin pesan:\n\n';

        for (var i = 0; i < o.items.length; i++) {
            var it = o.items[i];
            t += '- ' + it.name + ' x' + it.qty + ' - ' + fmt(it.price) + '\n';
        }

        t += '\nAlamat:\n' + o.address + '\n\nPengiriman:\n' + o.shipping.name + '\n';

        if (o.discount > 0) t += 'Diskon: ' + fmt(o.discount) + '\n';

        t += '\nTotal:\n' + fmt(o.total);

        var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);

        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
    }

    function doSearch(q) {
        var PRODS = MM.getProducts();
        q = q.toLowerCase().trim();
        if (!q) {
            d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Ketik untuk cari</p></div>';
            return;
        }
        var res = [];
        for (var i = 0; i < PRODS.length; i++)
            if (PRODS[i].name.toLowerCase().indexOf(q) !== -1) res.push(PRODS[i]);
        if (!res.length) {
            d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Tidak ditemukan</p></div>';
            return;
        }
        var h = '';
        for (var j = 0; j < res.length; j++) h += renderCard(res[j], true);
        d.sres.innerHTML = h;
    }

    function navTo(name) {
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) pages[i].classList.remove('on');
        var el = document.getElementById('pg-' + name);
        if (el) el.classList.add('on');
        var btns = document.querySelectorAll('[data-nav]');
        for (var j = 0; j < btns.length; j++) {
            var on = btns[j].getAttribute('data-nav') === name;
            btns[j].classList.toggle('text-blue-600', on);
            btns[j].classList.toggle('text-slate-400', !on);
        }
        if (name === 'history') renderOrders();
        window.scrollTo(0, 0);
    }

    function viewDetail(oid) {
        var o = null;
        for (var i = 0; i < orders.length; i++)
            if (String(orders[i].id) === String(oid)) { o = orders[i]; break; }
        if (!o) { notify('Tidak ditemukan'); return; }
        curOrder = o; renderInv();
        d.pginv.classList.remove('hidden'); d.pginv.scrollTop = 0;
        lock(); animateIn(d.pginv); currentPage = 'invoice';
    }

    /* ── input listeners ── */
    function initInputListeners() {
        d.inaddr.addEventListener('input', function () {
            d.eaddr.classList.add('hidden'); d.inaddr.classList.remove('err-input'); validate(false);
        });

        var searchTimer = null;
        d.insearch.addEventListener('input', function () {
            clearTimeout(searchTimer);
            var val = this.value;
            searchTimer = setTimeout(function () { doSearch(val); }, 250);
        });
    }

    /* ── respond to product changes (same-tab or cross-tab) ── */
    function onProductsUpdated() {
        renderProds();
        /* Only refresh cart sheet if it is visibly open */
        if (d.csheet.classList.contains('open')) renderCart();
        patchBadge();
    }

    /* ── init ── */
    function init() {
        cache(); load(); initInputListeners();
        renderCats(); renderProds(); patchBadge();
        navTo('home'); currentPage = 'home';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    /* Scroll-lock failsafe every 3 s */
    setInterval(function () {
        if (lockCnt > 3) {
            console.warn('Scroll lock stuck at', lockCnt, ', force unlock');
            lockCnt = 0; document.body.style.overflow = '';
        }
    }, 3000);

    /* Cross-tab sync: storage event fires in all tabs EXCEPT the one that wrote */
    window.addEventListener('storage', function (e) {
        if (e.key === MM.LS_PRODUCTS) onProductsUpdated();
        if (e.key === MM.LS_CATEGORIES) renderCats();
    });
    /* Same-tab sync: dispatched by saveProducts / atomicDeductStock */
    window.addEventListener('productsUpdated', onProductsUpdated);
    /* Same-tab sync: dispatched by saveCategories */
    window.addEventListener('categoriesUpdated', function () {
        renderCats();
    });

    /* ── global click handler ── */
    document.addEventListener('click', function (e) {
        var el;

        el = e.target.closest('[data-a]');   if (el) { addCart(el.dataset.a,   1);  return; }
        el = e.target.closest('[data-sa]');  if (el) { addCart(el.dataset.sa,  1);  return; }
        el = e.target.closest('[data-p]');   if (el) { addCart(el.dataset.p,   1);  return; }
        el = e.target.closest('[data-sp]');  if (el) { addCart(el.dataset.sp,  1);  return; }
        el = e.target.closest('[data-cp]');  if (el) { addCart(el.dataset.cp,  1);  return; }
        el = e.target.closest('[data-m]');   if (el) { addCart(el.dataset.m,  -1);  return; }
        el = e.target.closest('[data-sm]');  if (el) { addCart(el.dataset.sm, -1);  return; }
        el = e.target.closest('[data-cm]');  if (el) { addCart(el.dataset.cm, -1);  return; }
        el = e.target.closest('[data-cr]');  if (el) { delCart(el.dataset.cr);       return; }

        el = e.target.closest('[data-cat]');
        if (el) { selCat = el.dataset.cat; renderCats(); renderProds(); return; }

        el = e.target.closest('[data-nav]');
        if (el) { navTo(el.dataset.nav); return; }

        if (e.target.closest('#fab-cart'))                     { openCart();       return; }
        if (e.target.closest("[data-act='close-cart']"))       { closeCart();      return; }
        if (e.target.closest("[data-act='checkout']"))         { goToCheckout();   return; }
        if (e.target.closest("[data-act='back-to-cart']"))     { goToCart();       return; }

        el = e.target.closest('[data-ship]');
        if (el) { selShip(el.dataset.ship); return; }

        el = e.target.closest('[data-pay]');
        if (el) { selPay(el.dataset.pay); return; }

        if (e.target.closest("[data-act='open-vou']"))         { openVou();        return; }
        if (e.target.closest("[data-act='close-vou']"))        { closeVou();       return; }

        el = e.target.closest('[data-vou]');
        if (el) { selVou(parseInt(el.dataset.vou, 10)); return; }

        if (e.target.closest('#btn-order'))                    { goToConfirm();    return; }
        if (e.target.closest("[data-act='edit-order']"))       { backToCheckout(); return; }
        if (e.target.closest("[data-act='do-co']"))            { goToInvoice();    return; }
        if (e.target.closest('#btn-wa'))                       { sendWA();         return; }

        if (e.target.closest("[data-act='close-inv']")) {
            d.pginv.classList.add('hidden'); unlock();
            currentPage = 'home'; navTo('history'); return;
        }

        if (e.target.closest("[data-act='inv-home']"))         { goToHome();       return; }
        if (e.target.closest("[data-act='search']"))           { openSearch();     return; }
        if (e.target.closest("[data-act='close-search']"))     { closeSearch();    return; }
        if (e.target.closest("[data-act='go-shop']"))          { navTo('home');    return; }

        el = e.target.closest('[data-odet]');
        if (el) { viewDetail(el.dataset.odet); return; }

        if (e.target.closest('#dim')) { if (currentPage === 'cart') closeCart(); return; }
    });

}());