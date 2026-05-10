import { state, WA, fmt } from './utils.js';
import { addCart, delCart, selShip, selPay, selVou, validate, resetCO, goToInvoice, cancelOrder, load } from './services.js';
import {
    cache,
    notify,
    patchQty,
    patchBadge,
    renderCats,
    renderCard,
    renderProds,
    renderCart,
    renderShips,
    renderPays,
    renderSummary,
    renderInv,
    renderOrders,
    openCart,
    closeCart,
    openVou,
    closeVou,
    openSearch,
    closeSearch,
    lock,
    unlock,
    animateIn
} from './ui.js';
const MM = window.MiniMarket;

/* ── navigation & flow ── */
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

function goToHome() {
    state.d.pginv.classList.add('hidden'); unlock();
    state.currentPage = 'home'; state.curOrder = null; navTo('home');
}

function goToCart() {
    state.d.pgco.classList.add('hidden'); state.d.mconf.classList.add('hidden');
    renderCart(); state.d.csheet.classList.add('open'); state.d.dim.classList.add('on');
    state.currentPage = 'cart';
}

function goToCheckout() {
    if (!state.cart.length) { notify('Keranjang kosong'); return; }
    state.d.csheet.classList.remove('open'); state.d.dim.classList.remove('on');
    if (state.lockCnt === 0) lock();
    if (state.currentPage !== 'confirm') {
        resetCO(); state.d.inaddr.value = ''; state.d.innote.value = ''; state.d.vlbl.textContent = 'Opsional';
        state.d.eaddr.classList.add('hidden'); state.d.eship.classList.add('hidden'); state.d.epay.classList.add('hidden');
        state.d.inaddr.classList.remove('err-input');
    }
    renderShips(); renderPays(); renderSummary(); validate(false);
    state.d.pgco.classList.remove('hidden');
    if (state.d.coscroll) { state.d.coscroll.scrollTop = 0; animateIn(state.d.coscroll); }
    state.currentPage = 'checkout';
}

function goToConfirm() {
    if (!validate(true)) { notify('Lengkapi data!'); return; }
    state.d.mconf.classList.remove('hidden'); state.currentPage = 'confirm';
}

function backToCheckout() { state.d.mconf.classList.add('hidden'); state.currentPage = 'checkout'; }

function sendWA() {
    if (!state.curOrder) { notify('Pesanan tidak ditemukan'); return; }

    var o = state.curOrder;
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
    var PRODS = window.MiniMarket.getProducts();
    q = q.toLowerCase().trim();
    if (!q) {
        state.d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Ketik untuk cari</p></div>';
        return;
    }
    var res = [];
    for (var i = 0; i < PRODS.length; i++)
        if (PRODS[i].name.toLowerCase().indexOf(q) !== -1) res.push(PRODS[i]);
    if (!res.length) {
        state.d.sres.innerHTML = '<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Tidak ditemukan</p></div>';
        return;
    }
    var h = '';
    for (var j = 0; j < res.length; j++) h += renderCard(res[j], true);
    state.d.sres.innerHTML = h;
}

function viewDetail(oid) {
    var o = null;
    for (var i = 0; i < state.orders.length; i++)
        if (String(state.orders[i].id) === String(oid)) { o = state.orders[i]; break; }
    if (!o) { notify('Tidak ditemukan'); return; }
    state.curOrder = o; renderInv();
    state.d.pginv.classList.remove('hidden'); state.d.pginv.scrollTop = 0;
    lock(); animateIn(state.d.pginv); state.currentPage = 'invoice';
}

/* ── input listeners ── */
function initInputListeners() {
state.d.inphone.addEventListener(
    'input',
    function () {

        this.value =
            this.value.replace(
                /[^0-9]/g,
                ''
            );

        validate(false);
    }
);

state.d.inname.addEventListener(
    'input',
    function () {

        validate(false);
    }
);

    state.d.inaddr.addEventListener('input', function () {
        state.d.eaddr.classList.add('hidden'); state.d.inaddr.classList.remove('err-input'); validate(false);
    });

    var searchTimer = null;
    state.d.insearch.addEventListener('input', function () {
        clearTimeout(searchTimer);
        var val = this.value;
        searchTimer = setTimeout(function () { doSearch(val); }, 250);
    });
}

/* ── respond to product changes ── */
function onProductsUpdated() {
    renderFilteredProducts();
    if (state.d.csheet.classList.contains('open')) renderCart();
    patchBadge();
}
function renderFilteredProducts(){

    const selectedStoreId =
        document.getElementById(
            'store-filter'
        )?.value;

    /* WAJIB PILIH CABANG */
    if(!selectedStoreId){

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

        state.d.pcnt.textContent =
            '0 item';

        return;
    }

    let products =
        MM.getProducts();

    /* FILTER STORE */
    products =
        products.filter(product =>

            product.store_id ===
            selectedStoreId
        );

    /* FILTER CATEGORY */
    if(
        state.selCat &&
        state.selCat !== 'all'
    ){

        products =
            products.filter(product =>

                product.category ===
                state.selCat
            );
    }

    renderProds(products);
}

/* ── filtered categories ── */

function renderFilteredCategories(){

    const selectedStoreId =
        document.getElementById(
            'store-filter'
        )?.value;

    /* belum pilih cabang */
    if(!selectedStoreId){

        state.d.catbar.innerHTML = '';

        return;
    }

    const allCategories =
        MM.getCategories();

    const filtered =
        allCategories.filter(cat =>

            cat.id === 'all' ||

            cat.store_id ===
            selectedStoreId
        );
console.log(
    'ALL CATEGORIES:',
    allCategories
);

console.log(
    'SELECTED STORE:',
    selectedStoreId
);

console.log(
    'FILTERED CATEGORIES:',
    filtered
);
    renderCats(filtered);
}
/* ── stores ── */

async function loadStoreFilter(){

    const {
        data,
        error
    } = await window.supabaseClient
        .from('stores')
        .select('*')
        .order('name');

    if(error){

        console.error(error);
        return;
    }

    const select =
        document.getElementById(
            'store-filter'
        );

    if(!select) return;

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
}
/* ── init ── */
async function init() {

    cache();
   state.d.inname =
  document.getElementById(
    'inname'
  );

state.d.inphone =
  document.getElementById(
    'inphone'
  );
    load();

    /* 🔥 sync database setelah DOM siap */
    await MM.syncProductsFromSupabase();
    await MM.syncCategoriesFromSupabase();
    await loadStoreFilter();
    document
    .getElementById(
        'store-filter'
    )
    ?.addEventListener(
        'change',
        renderFilteredProducts
    );
    initInputListeners();

    renderFilteredCategories();
    renderFilteredProducts();
    patchBadge();

    navTo('home');
    state.currentPage = 'home';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/* Scroll-lock failsafe every 3 s */
setInterval(function () {
    if (state.lockCnt > 3) {
        console.warn('Scroll lock stuck at', state.lockCnt, ', force unlock');
        state.lockCnt = 0; document.body.style.overflow = '';
    }
}, 3000);

/* Cross-tab sync */
window.addEventListener('storage', function (e) {
    if (e.key === window.MiniMarket.LS_PRODUCTS) onProductsUpdated();
    if (e.key === window.MiniMarket.LS_CATEGORIES) renderCats();
});
/* Same-tab sync */
window.addEventListener('productsUpdated', onProductsUpdated);
window.addEventListener(
    'categoriesUpdated',

    function () {

        renderFilteredCategories();
    }
);

/* ── global click handler ── */
document.addEventListener(

    'click',

    async function (e) {

        var el;

       /* 🔥 CANCEL ORDER */
const cancelBtn =

    e.target.closest(
        '[data-cancel]'
    );

if (cancelBtn) {

    const id =

        cancelBtn.dataset.cancel;

    const ok =
        confirm(
            'Batalkan pesanan ini?'
        );

    if (!ok) return;

    const success =

        await cancelOrder(id);

    if (!success) {

        notify(
            'Gagal membatalkan pesanan'
        );

        return;
    }

    for (
        var i = 0;
        i < state.orders.length;
        i++
    ) {

        if (
            String(state.orders[i].id) ===
            String(id)
        ) {

            state.orders[i].status =
                'cancelled';

            break;
        }
    }

    notify(
        'Pesanan dibatalkan'
    );

    renderOrders();

    return;
}
        /* handler lain bawah sini */

    if (e.target.closest("[data-act='checkout']")) {
        goToCheckout();
        return;
    }

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

if (el) {

    state.selCat =
        el.dataset.cat;

    renderFilteredCategories();

    renderFilteredProducts();

    return;
}

    el = e.target.closest('[data-nav]');
    if (el) { navTo(el.dataset.nav); return; }

    if (e.target.closest('#fab-cart'))                     { openCart();       return; }
    if (e.target.closest("[data-act='close-cart']"))       { closeCart();      return; }
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
        state.d.pginv.classList.add('hidden'); unlock();
        state.currentPage = 'home'; navTo('history'); return;
    }

    if (e.target.closest("[data-act='inv-home']"))         { goToHome();       return; }
    if (e.target.closest("[data-act='search']"))           { openSearch();     return; }
    if (e.target.closest("[data-act='close-search']"))     { closeSearch();    return; }
    if (e.target.closest("[data-act='go-shop']"))          { navTo('home');    return; }

    el = e.target.closest('[data-odet]');
    if (el) { viewDetail(el.dataset.odet); return; }

    if (e.target.closest('#dim')) { if (state.currentPage === 'cart') closeCart(); return; }
});
