import { state, FALLBACK_IMG, SHIPS, PAYS, VOUS, SVG_MI, SVG_PL, SVG_TR, fmt, findCart, cartQty } from './utils.js';
import { subTotal } from './services.js';

/* ── DOM cache ── */
export function cache() {
    var g = function (id) { return document.getElementById(id); };
    state.d.dim        = g('dim');              state.d.csheet     = g('cart-sheet');
    state.d.clist      = g('cart-list');        state.d.cnone      = g('cart-none');
    state.d.cft        = g('cart-ft');          state.d.ccnt       = g('cart-cnt');
    state.d.ctotal     = g('cart-total');       state.d.fab        = g('fab-cart');
    state.d.badge      = g('cart-badge');       state.d.catbar     = g('cat-bar');
    state.d.pgrid      = g('prod-grid');        state.d.pcnt       = g('prod-cnt');
    state.d.pgco       = g('pg-checkout');      state.d.coscroll   = g('checkout-scroll');
    state.d.inaddr     = g('in-addr');          state.d.innote     = g('in-note');
    state.d.eaddr      = g('err-addr');         state.d.eship      = g('err-ship');
    state.d.epay       = g('err-pay');          state.d.ships      = g('ship-opts');
    state.d.pays       = g('pay-opts');         state.d.freebanner = g('free-ship-banner');
    state.d.coitems    = g('co-items');         state.d.ssub       = g('s-sub');
    state.d.sship      = g('s-ship');           state.d.discr      = g('s-disc-row');
    state.d.sdisc      = g('s-disc');           state.d.stotal     = g('s-total');
    state.d.vlbl       = g('v-label');          state.d.border     = g('btn-order');
    state.d.hint       = g('co-hint');          state.d.mconf      = g('m-confirm');
    state.d.mload      = g('m-loading');        state.d.pginv      = g('pg-invoice');
    state.d.invbody    = g('inv-body');         state.d.bwa        = g('btn-wa');
    state.d.pgsearch   = g('pg-search');        state.d.insearch   = g('in-search');
    state.d.sres       = g('search-res');       state.d.pgvou      = g('pg-vou');
    state.d.vlist      = g('vou-list');         state.d.olist      = g('ord-list');
    state.d.oempty     = g('ord-empty');        state.d.toast      = g('toast');
}

/* ── lock & animation ── */
export function lock()   { if (!state.lockCnt) document.body.style.overflow = 'hidden'; state.lockCnt++; }
export function unlock() { state.lockCnt = Math.max(0, state.lockCnt - 1); if (!state.lockCnt) document.body.style.overflow = ''; }
export function animateIn(el) { el.classList.remove('page-in'); void el.offsetWidth; el.classList.add('page-in'); }

/* ── toast ── */
export function notify(m) {
    if (state.tTimer) clearTimeout(state.tTimer);
    state.d.toast.textContent = m;
    state.d.toast.classList.add('show');
    state.tTimer = setTimeout(function () { state.d.toast.classList.remove('show'); }, 2200);
}

/* ── qty patch ── */
export function qtyHTML(pid, qty, isSearch) {
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

export function patchQty(pid, isSearch) {
    var pre = isSearch ? 'sq' : 'pq';
    var el  = document.getElementById(pre + '-' + pid);
    if (!el) return;
    var f = findCart(pid);
    el.innerHTML = qtyHTML(pid, f ? f.it.qty : 0, isSearch);
}

export function patchBadge() {
    var c = cartQty();
    state.d.badge.textContent = c;
    if (c > 0) {
        state.d.fab.classList.remove('hidden');
        state.d.badge.classList.remove('pop');
        void state.d.badge.offsetWidth;
        state.d.badge.classList.add('pop');
    } else {
        state.d.fab.classList.add('hidden');
    }
}

/* ── renderers ── */
export function renderCats() {
    var bar = state.d.catbar;
    if (!bar) return;

    var cats = window.MiniMarket.getCategories();
    var h = '';

    for (var i = 0; i < cats.length; i++) {
        var c  = cats[i];
        var on = state.selCat === c.id;

        h += '<div data-cat="' + c.id + '" class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" style="min-width:56px">' +
             '<div class="rounded-full overflow-hidden border-2 ' + (on ? 'border-blue-500' : 'border-slate-100') + '" style="width:52px;height:52px">' +
             '<img src="' + (c.image || window.MiniMarket.FALLBACK_CAT_IMG) + '" class="w-full h-full object-cover">' +
             '</div>' +
             '<span class="text-[10px] font-semibold ' + (on ? 'text-blue-600' : 'text-slate-400') + '">' + c.name + '</span>' +
             '</div>';
    }

    bar.innerHTML = h;
}

export function renderCard(prod, isSearch) {
    var pre = isSearch ? 'sq' : 'pq';
    var f   = findCart(prod.id);
    var qty = f ? f.it.qty : 0;
    return '<div class="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">' +
           '<div class="aspect-square bg-slate-100 overflow-hidden"><img src="' + prod.image + '" alt="' + prod.name + '" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'"></div>' +
           '<div class="p-2.5"><h3 class="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug">' + prod.name + '</h3>' +
           '<p class="text-blue-600 font-bold text-xs mt-1">' + fmt(prod.price) + '</p>' +
           '<div id="' + pre + '-' + prod.id + '" class="mt-1.5">' + qtyHTML(prod.id, qty, isSearch) + '</div>' +
           '</div></div>';
}

export function renderProds() {

    var PRODS =
        window.MiniMarket.getProducts();

    /* ─────────────────────
       FILTER STORE
    ───────────────────── */

    var selectedStoreId =

        document.getElementById(
            'store-filter'
        )?.value;

    if(selectedStoreId){

        PRODS = PRODS.filter(
            product =>

                product.store_id ===
                selectedStoreId
        );
    }

    var list = PRODS;

    /* filter kategori */
    if (state.selCat !== 'all') {

        list = [];

        for (
            var i = 0;
            i < PRODS.length;
            i++
        ){

            if (
                PRODS[i].category ===
                state.selCat
            ){

                list.push(
                    PRODS[i]
                );
            }
        }
    }

    state.d.pcnt.textContent =
        list.length + ' item';

    if (!list.length) {

        state.d.pgrid.innerHTML = `

            <div class="col-span-2 text-center py-10">

                <p class="text-xs text-slate-400">
                    Tidak ada produk
                </p>

            </div>
        `;

        return;
    }

    var h = '';

    for (
        var j = 0;
        j < list.length;
        j++
    ){

        h += renderCard(
            list[j],
            false
        );
    }

    state.d.pgrid.innerHTML = h;
}

export function renderCart() {
    var cnt = cartQty();
    state.d.ccnt.textContent = cnt + ' item';

    if (!state.cart.length) {
        state.d.clist.classList.add('hidden');
        state.d.cnone.classList.remove('hidden');
        state.d.cft.classList.add('hidden');
        return;
    }
    state.d.clist.classList.remove('hidden');
    state.d.cnone.classList.add('hidden');
    state.d.cft.classList.remove('hidden');

    var liveProds = window.MiniMarket.getProducts();
    var liveMap   = {};
    for (var k = 0; k < liveProds.length; k++) liveMap[liveProds[k].id] = liveProds[k];

    var h = '';
    for (var i = 0; i < state.cart.length; i++) {
        var it        = state.cart[i];
        var live      = liveMap[it.id];
        var liveImg   = live ? live.image : it.image;
        var livePrice = live ? live.price : it.price;

        h += '<div class="flex gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100">' +
             '<img src="' + liveImg + '" class="w-14 h-14 rounded-lg object-cover bg-white" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +
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
    state.d.clist.innerHTML = h;
    state.d.ctotal.textContent = fmt(subTotal());
}

export function renderShips() {
    var sub      = subTotal();
    var autoFree = sub >= 50000; // FREE_SHIP_MIN
    if (autoFree) state.d.freebanner.classList.remove('hidden');
    else          state.d.freebanner.classList.add('hidden');

    var h = '';
    for (var i = 0; i < SHIPS.length; i++) {
        var m   = SHIPS[i], sel = state.co.ship === m.id;
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
    state.d.ships.innerHTML = h;
}

export function renderPays() {
    var h = '';
    for (var i = 0; i < PAYS.length; i++) {
        var m = PAYS[i], sel = state.co.pay === m.id;
        h += '<div data-pay="' + m.id + '" class="sel flex items-center gap-2.5 p-3 rounded-xl border-2 ' +
             (sel ? 'on border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white') + '">' +
             '<span class="text-lg">' + m.emoji + '</span>' +
             '<div class="flex-1"><p class="text-xs font-semibold text-slate-800">' + m.name + '</p>' +
             '<p class="text-[10px] text-slate-400">' + m.desc + '</p></div></div>';
    }
    state.d.pays.innerHTML = h;
}

export function renderSummary() {
    var sub      = subTotal();
    var autoFree = sub >= 50000; // FREE_SHIP_MIN
    var shipM    = null;
    for (var i = 0; i < SHIPS.length; i++) if (SHIPS[i].id === state.co.ship) { shipM = SHIPS[i]; break; }
    var baseShip  = shipM ? shipM.price : 0;
    var finalShip = autoFree ? 0 : baseShip;
    var disc      = 0;
    if (state.co.vou) {
        if (sub >= state.co.vou.min) disc = state.co.vou.disc;
        else { state.co.vou = null; state.d.vlbl.textContent = 'Opsional'; }
    }
    var total = Math.max(0, sub + finalShip - disc);

    var ih = '';
    for (var j = 0; j < state.cart.length; j++) {
        var it = state.cart[j];
        ih += '<div class="flex justify-between text-[11px]">' +
              '<span class="text-slate-600 truncate flex-1">' + it.name + '</span>' +
              '<span class="text-slate-400 ml-1">x' + it.qty + '</span>' +
              '<span class="text-slate-700 font-medium ml-2">' + fmt(it.price * it.qty) + '</span></div>';
    }

    state.d.coitems.innerHTML  = ih;
    state.d.ssub.textContent   = fmt(sub);
    state.d.sship.textContent  = (finalShip === 0 && shipM) ? 'Gratis' : fmt(finalShip);
    if (disc > 0) { state.d.discr.classList.remove('hidden'); state.d.sdisc.textContent = '-' + fmt(disc); }
    else            state.d.discr.classList.add('hidden');
    state.d.stotal.textContent = fmt(total);
}

export function renderVou() {
    var sub = subTotal();
    var h   = '';
    for (var i = 0; i < VOUS.length; i++) {
        var v   = VOUS[i];
        var ok  = sub >= v.min;
        var sel = state.co.vou && state.co.vou.id === v.id;
        h += '<div data-vou="' + v.id + '" class="border-2 rounded-xl p-3.5 transition-all ' +
             (sel ? 'border-blue-500 bg-blue-50/50' : ok ? 'border-slate-200 bg-white cursor-pointer' : 'border-slate-100 bg-slate-50 opacity-50') + '">' +
             '<div class="flex items-center justify-between mb-1">' +
             '<span class="text-xs font-bold text-blue-600">' + v.code + '</span>' +
             (sel ? '<span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Dipilih</span>' : '') + '</div>' +
             '<p class="text-xs font-semibold text-slate-800">Diskon ' + fmt(v.disc) + '</p>' +
             '<p class="text-[10px] text-slate-400 mt-0.5">Min. belanja ' + fmt(v.min) + '</p>' +
             (!ok ? '<p class="text-[10px] text-red-500 mt-1 font-medium">Belum memenuhi minimum</p>' : '') + '</div>';
    }
    state.d.vlist.innerHTML = h;
}

export function renderInv() {
    var o = state.curOrder; if (!o) return;

    var ih = '';
    for (var i = 0; i < o.items.length; i++) {
        var it = o.items[i];
     ih +=
    '<div class="flex items-center gap-2.5">' +

    '<img src="' +
    (
        it.image ||
        FALLBACK_IMG
    ) +
    '" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">' +

    '<div class="flex-1 min-w-0">' +

    '<p class="text-xs font-medium text-slate-800 truncate">' +
    it.name +
    '</p>' +

    '<p class="text-[10px] text-slate-400">' +
    it.qty +
    'x ' +
    fmt(it.price) +
    '</p>' +

    '</div>' +

    '<span class="text-xs font-semibold text-slate-800">' +
    fmt(it.price * it.qty) +
    '</span>' +

    '</div>';
    }

    var sl      = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    var payName = o.payment ? o.payment.name : '-';

    state.d.invbody.innerHTML =
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

export function renderOrders() {

    if (!state.orders.length) {

        state.d.olist.classList.add('hidden');

        state.d.oempty.classList.remove('hidden');

        return;
    }

    state.d.olist.classList.remove('hidden');

    state.d.oempty.classList.add('hidden');

    var h = '';

    for (
        var i = state.orders.length - 1;
        i >= 0;
        i--
    ) {

        var o = state.orders[i];

        var sl =
            o.status.charAt(0)
            .toUpperCase() +
            o.status.slice(1);

        var prev = '';

        var mx =
            Math.min(
                o.items.length,
                2
            );

        for (
            var j = 0;
            j < mx;
            j++
        ) {

            var it =
                o.items[j];

            prev +=

                '<div class="flex items-center gap-2">' +

                '<img src="' +

                (
                    it.image ||
                    FALLBACK_IMG
                ) +

                '" class="w-8 h-8 rounded-lg object-cover bg-slate-100" onerror="this.onerror=null;this.src=\'' +

                FALLBACK_IMG +

                '\'">' +

                '<div class="flex-1 min-w-0">' +

                '<p class="text-[11px] font-medium text-slate-800 truncate">' +

                it.name +

                '</p>' +

                '<p class="text-[10px] text-slate-400">' +

                it.qty +

                'x ' +

                fmt(it.price) +

                '</p>' +

                '</div>' +

                '</div>';
        }

        if (o.items.length > 2) {

            prev +=
                '<p class="text-[10px] text-slate-400">+' +

                (
                    o.items.length - 2
                ) +

                ' lainnya</p>';
        }

        h +=

            '<div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">' +

            '<div class="flex justify-between mb-2">' +

            '<span class="text-[10px] text-slate-400">#' +

            o.id +

            '</span>' +

            '<span class="st-' +

            o.status +

            ' text-[10px] font-semibold px-2.5 py-0.5 rounded-full">' +

            sl +

            '</span>' +

            '</div>' +

            '<div class="space-y-1.5 mb-2">' +

            prev +

            '</div>' +

            '<div class="flex justify-between pt-2 border-t border-slate-200">' +

            '<span class="text-sm font-bold text-blue-600">' +

            fmt(o.total) +

            '</span>' +

           '<div class="flex items-center gap-2">' +

'<button data-odet="' +

o.id +

'" class="text-blue-600 text-[11px] font-semibold tap">Detail</button>' +

(

    o.status === 'pending' ||

    o.status === 'processing'

        ?

    '<button data-cancel="' +

    o.id +

    '" class="text-red-500 text-[11px] font-semibold tap">Batalkan</button>'

        :

    ''

) +

'</div>' +

            '</div>' +

            '</div>';
    }

    state.d.olist.innerHTML = h;
}

/* ── modal UI ── */
export function openCart() {
    if (!state.cart.length) { notify('Keranjang kosong'); return; }
    renderCart(); state.d.csheet.classList.add('open'); state.d.dim.classList.add('on');
    lock(); state.currentPage = 'cart';
}
export function closeCart()   { state.d.csheet.classList.remove('open'); state.d.dim.classList.remove('on'); unlock(); state.currentPage = 'home'; }
export function openVou()     { renderVou(); state.d.pgvou.classList.remove('hidden'); lock(); }
export function closeVou()    { state.d.pgvou.classList.add('hidden'); unlock(); }
export function openSearch()  {
    state.d.pgsearch.classList.remove('hidden'); state.d.insearch.value = '';
    state.d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Mencari...</p></div>';
    lock(); setTimeout(function () { state.d.insearch.focus(); }, 80);
}
export function closeSearch() { state.d.pgsearch.classList.add('hidden'); unlock(); }
