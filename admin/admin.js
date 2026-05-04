/* ============================================================
   MINIMARKET — SHARED CORE
   ============================================================
   Single shared namespace (window.MiniMarket) loaded BEFORE
   both the Admin and Consumer IIFEs.  Every piece of logic that
   must be consistent between the two panels lives here.
   ============================================================ */

;(function (global) {
    'use strict';

    /* ── constants ── */
    var LS_PRODUCTS  = 'products';
    var LS_ORDERS    = 'mo3';
    var LS_CART      = 'mc3';
    var FALLBACK_IMG = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image';

    /* ── single canonical normalizeProduct ──────────────────────
       All product objects MUST pass through this before storage
       or use.  Returns null for any object that cannot be made
       safe (missing id, unparseable numbers, etc.).
    ─────────────────────────────────────────────────────────── */
    function normalizeProduct(p) {
        if (!p || typeof p !== 'object') return null;
        var id = String(p.id || '').trim();
        if (!id) return null;
        var price = typeof p.price === 'number' ? p.price
                  : parseInt(p.price, 10) || 0;
        var stock = typeof p.stock === 'number' ? p.stock
                  : parseInt(p.stock, 10);
        if (isNaN(stock) || stock < 0) stock = 0;
        return {
            id:       id,
            name:     String(p.name     || '').trim(),
            price:    price,
            category: String(p.category || p.cat || '').trim(),
            stock:    stock,
            image:    String(p.image    || p.img || FALLBACK_IMG)
        };
    }

    /* ── getProducts ─────────────────────────────────────────────
       Always reads fresh from localStorage and normalizes every
       entry.  Returns an empty array on any error.
    ─────────────────────────────────────────────────────────── */
    function getProducts() {
        try {
            var raw = localStorage.getItem(LS_PRODUCTS);
            var arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return [];
            var result = [];
            for (var i = 0; i < arr.length; i++) {
                var p = normalizeProduct(arr[i]);
                if (p) result.push(p);
            }
            return result;
        } catch (e) {
            console.error('[MiniMarket] getProducts corrupt:', e);
            return [];
        }
    }

    /* ── saveProducts ────────────────────────────────────────────
       Validates every entry through normalizeProduct before write.
       Rejects any entry whose id is falsy or duplicate.
       Dispatches productsUpdated so same-tab listeners are notified
       (cross-tab listeners receive the native storage event).
    ─────────────────────────────────────────────────────────── */
    function saveProducts(products) {
        try {
            var safe   = [];
            var seen   = {};
            for (var i = 0; i < products.length; i++) {
                var p = normalizeProduct(products[i]);
                if (!p)        { console.warn('[MiniMarket] saveProducts: skipping invalid entry', products[i]); continue; }
                if (seen[p.id]){ console.warn('[MiniMarket] saveProducts: duplicate id skipped', p.id); continue; }
                seen[p.id] = true;
                safe.push(p);
            }
            localStorage.setItem(LS_PRODUCTS, JSON.stringify(safe));
            /* Notify same-tab listeners (storage event is NOT fired for the
               originating tab, so we dispatch our own custom event). */
            window.dispatchEvent(new Event('productsUpdated'));
            return true;
        } catch (e) {
            console.error('[MiniMarket] saveProducts failed:', e);
            return false;
        }
    }

    /* ── atomicDeductStock ───────────────────────────────────────
       Combines validation + deduction into ONE read-modify-write
       operation so concurrent tabs can never double-deduct or
       over-sell.

       cartItems  – array of { id, qty, name }
       Returns    – { ok: true }  on success
                    { ok: false, errors: ['name (stok tersisa N)', …] }

       Side-effects on success:
         • writes updated stock to localStorage
         • dispatches productsUpdated
         • mutates each cartItem.price / cartItem.image to match
           the live product (so the caller's subtotal is fresh)
    ─────────────────────────────────────────────────────────── */
    function atomicDeductStock(cartItems) {
        /* Step 1 — read the freshest possible snapshot */
        var prods   = getProducts();
        var prodMap = {};
        for (var i = 0; i < prods.length; i++) prodMap[prods[i].id] = prods[i];

        /* Step 2 — validate every cart item against live stock */
        var errors = [];
        for (var j = 0; j < cartItems.length; j++) {
            var it   = cartItems[j];
            var live = prodMap[it.id];
            if (!live) {
                errors.push(it.name + ' tidak ditemukan');
                continue;
            }
            /* Sync price/image to live values so the caller's subtotal
               is always calculated from current data. */
            it.price = live.price;
            it.image = live.image;
            if (it.qty > live.stock) {
                errors.push(it.name + ' (stok tersisa ' + live.stock + ')');
            }
        }

        /* Step 3 — abort if any item failed validation */
        if (errors.length) return { ok: false, errors: errors };

        /* Step 4 — mutate and write in one shot */
        for (var k = 0; k < cartItems.length; k++) {
            var item = cartItems[k];
            if (prodMap[item.id]) {
                prodMap[item.id].stock = Math.max(0, prodMap[item.id].stock - item.qty);
            }
        }
        saveProducts(prods);   // already dispatches productsUpdated
        return { ok: true };
    }

    /* ── loadOrders ── */
    function loadOrders() {
        try {
            var raw = localStorage.getItem(LS_ORDERS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('[MiniMarket] loadOrders corrupt:', e);
            return [];
        }
    }

    /* ── validateOrder ───────────────────────────────────────────
       Ensures the order object has all required fields and that
       numeric values are consistent before it is persisted.
       Returns { ok: true } or { ok: false, reason: '…' }.
    ─────────────────────────────────────────────────────────── */
    function validateOrder(o) {
        if (!o || typeof o !== 'object')
            return { ok: false, reason: 'order bukan object' };
        if (!o.id || typeof o.id !== 'string')
            return { ok: false, reason: 'order.id tidak valid' };
        if (!Array.isArray(o.items) || !o.items.length)
            return { ok: false, reason: 'order.items kosong' };
        if (typeof o.address !== 'string' || o.address.trim().length < 10)
            return { ok: false, reason: 'order.address terlalu pendek' };
        if (!o.shipping || typeof o.shipping !== 'object' || !o.shipping.id)
            return { ok: false, reason: 'order.shipping tidak valid' };
        if (!o.payment  || typeof o.payment  !== 'object' || !o.payment.id)
            return { ok: false, reason: 'order.payment tidak valid' };

        var numFields = ['subtotal', 'shipPrice', 'discount', 'total', 'createdAt'];
        for (var i = 0; i < numFields.length; i++) {
            if (typeof o[numFields[i]] !== 'number' || isNaN(o[numFields[i]]) || o[numFields[i]] < 0)
                return { ok: false, reason: 'order.' + numFields[i] + ' tidak valid' };
        }

        /* Consistency: total must equal subtotal + shipPrice - discount (±1 rounding) */
        var expected = Math.max(0, o.subtotal + o.shipPrice - o.discount);
        if (Math.abs(o.total - expected) > 1)
            return { ok: false, reason: 'order.total tidak konsisten' };

        /* Each item must have id, name, price, qty */
        for (var j = 0; j < o.items.length; j++) {
            var it = o.items[j];
            if (!it.id || !it.name || typeof it.price !== 'number' || typeof it.qty !== 'number' || it.qty < 1)
                return { ok: false, reason: 'order.items[' + j + '] tidak valid' };
        }

        if (!o.status || typeof o.status !== 'string')
            return { ok: false, reason: 'order.status tidak valid' };

        return { ok: true };
    }

    /* ── fmt currency ── */
    function fmt(p) {
        return 'Rp ' + ((p || 0)).toLocaleString('id-ID');
    }

    /* ── expose ── */
    global.MiniMarket = {
        LS_PRODUCTS:       LS_PRODUCTS,
        LS_ORDERS:         LS_ORDERS,
        LS_CART:           LS_CART,
        FALLBACK_IMG:      FALLBACK_IMG,
        normalizeProduct:  normalizeProduct,
        getProducts:       getProducts,
        saveProducts:      saveProducts,
        atomicDeductStock: atomicDeductStock,
        loadOrders:        loadOrders,
        validateOrder:     validateOrder,
        fmt:               fmt
    };

}(window));


/* ============================================================
   ADMIN PANEL IIFE
   ============================================================ */
(function () {
    'use strict';

    var MM           = window.MiniMarket;
    var FALLBACK_IMG = MM.FALLBACK_IMG;
    var fmt          = MM.fmt;

    var CAT_MAP = {
        snacks:  { name: 'Snack',      cls: 'badge-snacks'  },
        drinks:  { name: 'Minuman',    cls: 'badge-drinks'  },
        dairy:   { name: 'Susu',       cls: 'badge-dairy'   },
        frozen:  { name: 'Frozen',     cls: 'badge-frozen'  },
        instant: { name: 'Mie Instan', cls: 'badge-instant' }
    };

    /* ── state ── */
    var products    = [];
    var selectedIds = {};
    var pendingImage = null;
    var toastTimer  = null;

    /* ── DOM cache ── */
    var d = {};
    function cacheDom() {
        var g = function (id) { return document.getElementById(id); };
        d.statDaily   = g('stat-daily');
        d.statWeekly  = g('stat-weekly');
        d.statMonthly = g('stat-monthly');
        d.form        = g('form-add');
        d.fName       = g('f-name');
        d.fPrice      = g('f-price');
        d.fStock      = g('f-stock');
        d.fCat        = g('f-cat');
        d.fImg        = g('f-img');
        d.imgDrop     = g('img-drop');
        d.imgPreview  = g('img-preview');
        d.imgName     = g('img-name');
        d.imgSize     = g('img-size');
        d.imgWrap     = g('img-preview-wrap');
        d.imgRemove   = g('img-remove');
        d.errName     = g('err-name');
        d.errPrice    = g('err-price');
        d.errStock    = g('err-stock');
        d.errCat      = g('err-cat');
        d.btnDel      = g('btn-del');
        d.delCount    = g('del-count');
        d.listHeader  = g('list-header');
        d.chkAll      = g('chk-all');
        d.prodGrid    = g('prod-grid');
        d.prodEmpty   = g('prod-empty');
        d.prodCount   = g('prod-count');
        d.mConfirm    = g('m-confirm');
        d.confirmMsg  = g('confirm-msg');
        d.btnCancel   = g('btn-cancel-del');
        d.btnDoDel    = g('btn-do-del');
        d.toast       = g('toast');
    }

    /* ── utils ── */
    function notify(msg, type) {
        if (toastTimer) clearTimeout(toastTimer);
        d.toast.textContent = msg;
        d.toast.style.background =
            type === 'error'   ? '#ef4444' :
            type === 'success' ? '#059669' : '#1e293b';
        d.toast.classList.add('show');
        toastTimer = setTimeout(function () { d.toast.classList.remove('show'); }, 2500);
    }

    function genId() {
        return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    /* ── storage (delegate entirely to shared layer) ── */
    function loadProducts() {
        products = MM.getProducts();
    }

    function saveProducts() {
        if (!MM.saveProducts(products)) {
            notify('Gagal menyimpan, storage penuh', 'error');
        }
    }

    /* ── stats ── */
    function renderStats() {
        var orders     = MM.loadOrders();
        var now        = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        var weekStart  = todayStart - (7 * 24 * 60 * 60 * 1000);
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        var daily = 0, weekly = 0, monthly = 0;
        var dc = 0, wc = 0, mc = 0;

        for (var i = 0; i < orders.length; i++) {
            var o = orders[i], ct = o.createdAt || 0, t = o.total || 0;
            if (ct >= todayStart) { daily   += t; dc++; }
            if (ct >= weekStart)  { weekly  += t; wc++; }
            if (ct >= monthStart) { monthly += t; mc++; }
        }

        d.statDaily.textContent   = fmt(daily)   + ' (' + dc + ')';
        d.statWeekly.textContent  = fmt(weekly)  + ' (' + wc + ')';
        d.statMonthly.textContent = fmt(monthly) + ' (' + mc + ')';
    }

    /* ── image handling ── */
    function handleFileSelect(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { notify('Ukuran gambar maks 2MB', 'error'); return; }
        if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
            notify('Format harus PNG, JPG, atau WebP', 'error'); return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            pendingImage = e.target.result;
            d.imgPreview.src = pendingImage;
            d.imgName.textContent = file.name;
            d.imgSize.textContent = formatBytes(file.size);
            d.imgWrap.classList.remove('hidden');
            d.imgDrop.classList.add('has-img');
        };
        reader.readAsDataURL(file);
    }

    function formatBytes(b) {
        if (b < 1024)      return b + ' B';
        if (b < 1048576)   return (b / 1024).toFixed(1)    + ' KB';
        return                    (b / 1048576).toFixed(1) + ' MB';
    }

    function clearImage() {
        pendingImage = null;
        d.fImg.value = '';
        d.imgWrap.classList.add('hidden');
        d.imgDrop.classList.remove('has-img');
    }

    /* ── form validation ── */
    function validateForm() {
        var ok = true;

        var name = d.fName.value.trim();
        if (name.length < 3) {
            d.errName.classList.remove('hidden'); d.fName.classList.add('err-field'); ok = false;
        } else {
            d.errName.classList.add('hidden'); d.fName.classList.remove('err-field');
        }

        var price = parseInt(d.fPrice.value, 10);
        if (!price || price <= 0) {
            d.errPrice.classList.remove('hidden'); d.fPrice.classList.add('err-field'); ok = false;
        } else {
            d.errPrice.classList.add('hidden'); d.fPrice.classList.remove('err-field');
        }

        var stock = parseInt(d.fStock.value, 10);
        if (isNaN(stock) || stock < 0) {
            d.errStock.classList.remove('hidden'); d.fStock.classList.add('err-field'); ok = false;
        } else {
            d.errStock.classList.add('hidden'); d.fStock.classList.remove('err-field');
        }

        if (!d.fCat.value) {
            d.errCat.classList.remove('hidden'); d.fCat.classList.add('err-field'); ok = false;
        } else {
            d.errCat.classList.add('hidden'); d.fCat.classList.remove('err-field');
        }

        return ok;
    }

    /* ── CRUD ── */
    function addProduct() {
        if (!validateForm()) { notify('Lengkapi semua field yang wajib', 'error'); return; }

        var candidate = genId();

        /* ── FIX: prevent duplicate product IDs ─────────────────
           Re-read the live list at the moment of insertion so
           even a concurrent tab adding a product doesn't cause
           an id clash.  Also checks the in-memory list.
        ─────────────────────────────────────────────────────── */
        var liveProducts = MM.getProducts();
        var allIds = {};
        for (var x = 0; x < liveProducts.length; x++) allIds[liveProducts[x].id] = true;
        for (var y = 0; y < products.length;     y++) allIds[products[y].id]      = true;

        /* Regenerate until unique (astronomically unlikely to loop) */
        while (allIds[candidate]) {
            candidate = genId();
        }

        var raw = {
            id:       candidate,
            name:     d.fName.value.trim(),
            price:    parseInt(d.fPrice.value, 10),
            category: d.fCat.value,
            stock:    parseInt(d.fStock.value, 10),
            image:    pendingImage || FALLBACK_IMG
        };

        /* Pass through the shared normalizer as final guard */
        var prod = MM.normalizeProduct(raw);
        if (!prod) { notify('Data produk tidak valid', 'error'); return; }

        /* Re-read live list and append so we never overwrite concurrent additions */
        var freshList = MM.getProducts();
        /* One more duplicate check against the freshest possible snapshot */
        for (var z = 0; z < freshList.length; z++) {
            if (freshList[z].id === prod.id) {
                notify('ID produk duplikat, coba lagi', 'error'); return;
            }
        }
        freshList.push(prod);

        if (!MM.saveProducts(freshList)) {
            notify('Gagal menyimpan, storage penuh', 'error'); return;
        }
        products = MM.getProducts();   // sync in-memory list
        renderProducts();
        renderStats();
        resetForm();
        notify('Produk berhasil ditambahkan', 'success');
    }

    function deleteSelected() {
        var ids = Object.keys(selectedIds);
        if (!ids.length) return;

        var newProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (!selectedIds[products[i].id]) newProducts.push(products[i]);
        }
        products    = newProducts;
        selectedIds = {};
        saveProducts();
        renderProducts();
        updateDelButton();
        renderStats();
        notify(ids.length + ' produk berhasil dihapus', 'success');
    }

    function resetForm() {
        d.form.reset();
        clearImage();
        d.errName.classList.add('hidden');
        d.errPrice.classList.add('hidden');
        d.errStock.classList.add('hidden');
        d.errCat.classList.add('hidden');
        d.fName.classList.remove('err-field');
        d.fPrice.classList.remove('err-field');
        d.fStock.classList.remove('err-field');
        d.fCat.classList.remove('err-field');
    }

    /* ── selection helpers ── */
    function toggleSelect(id) {
        if (selectedIds[id]) delete selectedIds[id]; else selectedIds[id] = true;
        updateDelButton(); updateChkAll(); updateCardStyles();
    }

    function toggleSelectAll() {
        if (isAllSelected() || isSomeSelected()) {
            selectedIds = {};
        } else {
            for (var i = 0; i < products.length; i++) selectedIds[products[i].id] = true;
        }
        updateDelButton(); updateChkAll(); updateCardStyles();
    }

    function isAllSelected() {
        if (!products.length) return false;
        for (var i = 0; i < products.length; i++) {
            if (!selectedIds[products[i].id]) return false;
        }
        return true;
    }

    function isSomeSelected() { return Object.keys(selectedIds).length > 0; }
    function selectedCount()  { return Object.keys(selectedIds).length; }

    function updateDelButton() {
        var c = selectedCount();
        d.delCount.textContent = c;
        if (c > 0) {
            d.btnDel.classList.remove('hidden'); d.btnDel.classList.add('flex');
        } else {
            d.btnDel.classList.add('hidden');    d.btnDel.classList.remove('flex');
        }
    }

    function updateChkAll() {
        if (!products.length) {
            d.chkAll.checked = false; d.chkAll.indeterminate = false; return;
        }
        d.chkAll.checked       = isAllSelected();
        d.chkAll.indeterminate = isSomeSelected() && !isAllSelected();
    }

    function updateCardStyles() {
        var cards = d.prodGrid.querySelectorAll('.prod-card');
        for (var i = 0; i < cards.length; i++) {
            var id = cards[i].getAttribute('data-id');
            if (selectedIds[id]) cards[i].classList.add('selected');
            else                 cards[i].classList.remove('selected');
        }
    }

    /* ── render ── */
    function renderProducts() {
        d.prodCount.textContent = products.length + ' produk';

        if (!products.length) {
            d.prodGrid.classList.add('hidden');
            d.prodEmpty.classList.remove('hidden');
            d.listHeader.classList.add('hidden');
            d.listHeader.classList.remove('flex');
            return;
        }

        d.prodGrid.classList.remove('hidden');
        d.prodEmpty.classList.add('hidden');
        d.listHeader.classList.remove('hidden');
        d.listHeader.classList.add('flex');

        var h = '';
        for (var i = 0; i < products.length; i++) {
            var p      = products[i];
            var cat    = CAT_MAP[p.category] || { name: p.category, cls: '' };
            var selCls = selectedIds[p.id] ? ' selected' : '';

            h += '<div class="prod-card card overflow-hidden' + selCls + '" data-id="' + p.id + '">';
            h += '<div class="relative">';
            h += '<input type="checkbox" class="chk absolute top-2.5 left-2.5 z-10" data-chk="' + p.id + '"' + (selectedIds[p.id] ? ' checked' : '') + '>';
            h += '<img src="' + p.image + '" alt="' + p.name + '" class="w-full aspect-square object-cover bg-slate-100" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">';
            h += '</div>';
            h += '<div class="p-3">';
            h += '<span class="badge ' + cat.cls + ' mb-1.5">' + cat.name + '</span>';
            h += '<h3 class="text-xs font-semibold text-slate-800 leading-snug mb-1 line-clamp-2 min-h-[32px]">' + p.name + '</h3>';
            h += '<div class="flex items-center justify-between">';
            h += '<span class="text-sm font-bold text-blue-600">' + fmt(p.price) + '</span>';
            h += '<span class="text-[10px] font-medium text-slate-400">Stok: ' + p.stock + '</span>';
            h += '</div>';
            h += '</div>';
            h += '</div>';
        }

        d.prodGrid.innerHTML = h;
        d.prodGrid.classList.add('stagger');
    }

    function showConfirm() {
        d.confirmMsg.textContent = selectedCount() + ' produk akan dihapus permanen';
        d.mConfirm.classList.remove('hidden');
    }
    function hideConfirm() { d.mConfirm.classList.add('hidden'); }

    /* ── event listeners ── */
    function initEvents() {
        d.form.addEventListener('submit', function (e) { e.preventDefault(); addProduct(); });

        d.fName.addEventListener('input',  function () { d.errName.classList.add('hidden');  d.fName.classList.remove('err-field'); });
        d.fPrice.addEventListener('input', function () { d.errPrice.classList.add('hidden'); d.fPrice.classList.remove('err-field'); });
        d.fStock.addEventListener('input', function () { d.errStock.classList.add('hidden'); d.fStock.classList.remove('err-field'); });
        d.fCat.addEventListener('change',  function () { d.errCat.classList.add('hidden');   d.fCat.classList.remove('err-field'); });

        d.imgDrop.addEventListener('click', function () { d.fImg.click(); });
        d.fImg.addEventListener('change', function () {
            if (this.files && this.files[0]) handleFileSelect(this.files[0]);
        });

        d.imgDrop.addEventListener('dragover', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.add('dragover');
        });
        d.imgDrop.addEventListener('dragleave', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.remove('dragover');
        });
        d.imgDrop.addEventListener('drop', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        });

        d.imgRemove.addEventListener('click', clearImage);
        d.chkAll.addEventListener('change', toggleSelectAll);

        d.btnDel.addEventListener('click', showConfirm);
        d.btnCancel.addEventListener('click', hideConfirm);
        d.btnDoDel.addEventListener('click', function () { hideConfirm(); deleteSelected(); });

        d.mConfirm.addEventListener('click', function (e) {
            if (e.target === d.mConfirm) hideConfirm();
        });

        d.prodGrid.addEventListener('change', function (e) {
            var el = e.target.closest('[data-chk]');
            if (el) toggleSelect(el.getAttribute('data-chk'));
        });

        d.prodGrid.addEventListener('click', function (e) {
            if (e.target.closest('[data-chk]')) return;
            var card = e.target.closest('.prod-card');
            if (card) {
                var id  = card.getAttribute('data-id');
                toggleSelect(id);
                var chk = card.querySelector('[data-chk]');
                if (chk) chk.checked = !!selectedIds[id];
            }
        });

        var fields = [d.fName, d.fPrice, d.fStock, d.fCat];
        for (var i = 0; i < fields.length; i++) {
            fields[i].addEventListener('focus', function () {
                this.classList.remove('err-field');
                var errEl = document.getElementById('err-' + this.id.replace('f-', ''));
                if (errEl) errEl.classList.add('hidden');
            });
        }

        /* ── FIX: admin listens to productsUpdated (same-tab) ─────
           Without this the admin grid would only refresh on the
           storage event (which is never fired for the originating
           tab).  Now when the consumer panel (same tab) places an
           order and stock is deducted, the admin list refreshes
           immediately.
        ─────────────────────────────────────────────────────────── */
        window.addEventListener('productsUpdated', function () {
            products = MM.getProducts();
            renderProducts();
            renderStats();
        });

        /* Cross-tab: another browser tab saved products */
        window.addEventListener('storage', function (e) {
            if (e.key === MM.LS_PRODUCTS) {
                products = MM.getProducts();
                renderProducts();
                renderStats();
            }
        });
    }

    /* ── init ── */
    function init() {
        cacheDom();
        loadProducts();
        renderStats();
        renderProducts();
        updateDelButton();
        updateChkAll();
        initEvents();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

}());


/* ── global error handler ── */
window.onerror = function (msg, url, line) {
    console.error('APP ERROR:', msg, 'LINE:', line);
    return true;
};
