/* ============================================================
   MINIMARKET ADMIN PANEL — admin.js
   ============================================================ */
(function(){
'use strict';

/* ========== KONFIGURASI ========== */
var LS_PRODUCTS = 'products';
var LS_ORDERS = 'mo3';
var FALLBACK_IMG = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image';
var CAT_MAP = {
    snacks: { name: 'Snack', cls: 'badge-snacks' },
    drinks: { name: 'Minuman', cls: 'badge-drinks' },
    dairy:  { name: 'Susu', cls: 'badge-dairy' },
    frozen: { name: 'Frozen', cls: 'badge-frozen' },
    instant:{ name: 'Mie Instan', cls: 'badge-instant' }
};

/* ========== STATE ========== */
var products = [];
var selectedIds = {};
var pendingImage = null;
var toastTimer = null;

/* ========== DOM CACHE ========== */
var d = {};
function cacheDom(){
    var g = function(id){ return document.getElementById(id); };
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

/* ========== UTILITAS ========== */
function fmt(p){
    return 'Rp ' + ((p||0)).toLocaleString('id-ID');
}

function notify(msg, type){
    if(toastTimer) clearTimeout(toastTimer);
    d.toast.textContent = msg;
    d.toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#059669' : '#1e293b';
    d.toast.classList.add('show');
    toastTimer = setTimeout(function(){ d.toast.classList.remove('show'); }, 2500);
}

function genId(){
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/* ========== STORAGE ========== */
function loadProducts(){
    try {
        var raw = localStorage.getItem(LS_PRODUCTS);
        products = raw ? JSON.parse(raw) : [];
    } catch(e) {
        console.error('Products corrupt:', e);
        products = [];
        try{ localStorage.removeItem(LS_PRODUCTS); }catch(x){}
    }
}

function saveProducts(){
    try { localStorage.setItem(LS_PRODUCTS, JSON.stringify(products)); } catch(e) {
        notify('Gagal menyimpan, storage penuh', 'error');
    }
}

function loadOrders(){
    try {
        var raw = localStorage.getItem(LS_ORDERS);
        return raw ? JSON.parse(raw) : [];
    } catch(e) {
        console.error('Orders corrupt:', e);
        return [];
    }
}

/* ========== STATISTIK ========== */
function renderStats(){
    var orders = loadOrders();
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    var daily = 0, weekly = 0, monthly = 0;
    var dailyCount = 0, weeklyCount = 0, monthlyCount = 0;

    for(var i = 0; i < orders.length; i++){
        var o = orders[i];
        var ct = o.createdAt || 0;
        var total = o.total || 0;

        if(ct >= todayStart){ daily += total; dailyCount++; }
        if(ct >= weekStart){ weekly += total; weeklyCount++; }
        if(ct >= monthStart){ monthly += total; monthlyCount++; }
    }

    d.statDaily.textContent   = fmt(daily)   + ' (' + dailyCount + ')';
    d.statWeekly.textContent  = fmt(weekly)  + ' (' + weeklyCount + ')';
    d.statMonthly.textContent = fmt(monthly) + ' (' + monthlyCount + ')';
}

/* ========== GAMBAR ========== */
function handleFileSelect(file){
    if(!file) return;
    if(file.size > 2 * 1024 * 1024){
        notify('Ukuran gambar maks 2MB', 'error');
        return;
    }
    if(!file.type.match(/^image\/(png|jpeg|webp)$/)){
        notify('Format harus PNG, JPG, atau WebP', 'error');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e){
        pendingImage = e.target.result;
        d.imgPreview.src = pendingImage;
        d.imgName.textContent = file.name;
        d.imgSize.textContent = formatBytes(file.size);
        d.imgWrap.classList.remove('hidden');
        d.imgDrop.classList.add('has-img');
    };
    reader.readAsDataURL(file);
}

function formatBytes(b){
    if(b < 1024) return b + ' B';
    if(b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
    return (b/(1024*1024)).toFixed(1) + ' MB';
}

function clearImage(){
    pendingImage = null;
    d.fImg.value = '';
    d.imgWrap.classList.add('hidden');
    d.imgDrop.classList.remove('has-img');
}

/* ========== VALIDASI ========== */
function validateForm(){
    var ok = true;

    var name = d.fName.value.trim();
    if(name.length < 3){
        d.errName.classList.remove('hidden');
        d.fName.classList.add('err-field');
        ok = false;
    } else {
        d.errName.classList.add('hidden');
        d.fName.classList.remove('err-field');
    }

    var price = parseInt(d.fPrice.value, 10);
    if(!price || price <= 0){
        d.errPrice.classList.remove('hidden');
        d.fPrice.classList.add('err-field');
        ok = false;
    } else {
        d.errPrice.classList.add('hidden');
        d.fPrice.classList.remove('err-field');
    }

    var stock = parseInt(d.fStock.value, 10);
    if(isNaN(stock) || stock < 0){
        d.errStock.classList.remove('hidden');
        d.fStock.classList.add('err-field');
        ok = false;
    } else {
        d.errStock.classList.add('hidden');
        d.fStock.classList.remove('err-field');
    }

    if(!d.fCat.value){
        d.errCat.classList.remove('hidden');
        d.fCat.classList.add('err-field');
        ok = false;
    } else {
        d.errCat.classList.add('hidden');
        d.fCat.classList.remove('err-field');
    }

    return ok;
}

/* ========== CRUD ========== */
function addProduct(){
    if(!validateForm()){
        notify('Lengkapi semua field yang wajib', 'error');
        return;
    }

    var prod = {
        id: genId(),
        name: d.fName.value.trim(),
        price: parseInt(d.fPrice.value, 10),
        category: d.fCat.value,
        stock: parseInt(d.fStock.value, 10),
        image: pendingImage || FALLBACK_IMG
    };

    products.push(prod);
    saveProducts();
    renderProducts();
    resetForm();
    notify('Produk berhasil ditambahkan', 'success');
}

function deleteSelected(){
    var ids = Object.keys(selectedIds);
    if(!ids.length) return;

    var newProducts = [];
    for(var i = 0; i < products.length; i++){
        if(!selectedIds[products[i].id]){
            newProducts.push(products[i]);
        }
    }
    products = newProducts;
    selectedIds = {};
    saveProducts();
    renderProducts();
    updateDelButton();
    notify(ids.length + ' produk berhasil dihapus', 'success');
}

function resetForm(){
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

/* ========== SELECT ========== */
function toggleSelect(id){
    if(selectedIds[id]) delete selectedIds[id];
    else selectedIds[id] = true;
    updateDelButton();
    updateChkAll();
    updateCardStyles();
}

function toggleSelectAll(){
    var allChecked = isAllSelected();
    if(allChecked || isSomeSelected()){
        selectedIds = {};
    } else {
        for(var i = 0; i < products.length; i++){
            selectedIds[products[i].id] = true;
        }
    }
    updateDelButton();
    updateChkAll();
    updateCardStyles();
}

function isAllSelected(){
    if(!products.length) return false;
    for(var i = 0; i < products.length; i++){
        if(!selectedIds[products[i].id]) return false;
    }
    return true;
}

function isSomeSelected(){
    return Object.keys(selectedIds).length > 0;
}

function selectedCount(){
    return Object.keys(selectedIds).length;
}

function updateDelButton(){
    var c = selectedCount();
    d.delCount.textContent = c;
    if(c > 0){
        d.btnDel.classList.remove('hidden');
        d.btnDel.classList.add('flex');
    } else {
        d.btnDel.classList.add('hidden');
        d.btnDel.classList.remove('flex');
    }
}

function updateChkAll(){
    if(!products.length){
        d.chkAll.checked = false;
        d.chkAll.indeterminate = false;
        return;
    }
    d.chkAll.checked = isAllSelected();
    d.chkAll.indeterminate = isSomeSelected() && !isAllSelected();
}

function updateCardStyles(){
    var cards = d.prodGrid.querySelectorAll('.prod-card');
    for(var i = 0; i < cards.length; i++){
        var id = cards[i].getAttribute('data-id');
        if(selectedIds[id]) cards[i].classList.add('selected');
        else cards[i].classList.remove('selected');
    }
}

/* ========== RENDER ========== */
function renderProducts(){
    d.prodCount.textContent = products.length + ' produk';

    if(!products.length){
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
    for(var i = 0; i < products.length; i++){
        var p = products[i];
        var cat = CAT_MAP[p.category] || { name: p.category, cls: '' };
        var checked = selectedIds[p.id] ? 'checked' : '';
        var selCls = selectedIds[p.id] ? ' selected' : '';

        h += '<div class="prod-card card overflow-hidden' + selCls + '" data-id="' + p.id + '">';
        h += '<div class="relative">';
        h += '<input type="checkbox" class="chk absolute top-2.5 left-2.5 z-10" data-chk="' + p.id + '" ' + checked + '>';
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

function showConfirm(){
    var c = selectedCount();
    d.confirmMsg.textContent = c + ' produk akan dihapus permanen';
    d.mConfirm.classList.remove('hidden');
}

function hideConfirm(){
    d.mConfirm.classList.add('hidden');
}

/* ========== EVENT LISTENERS ========== */
function initEvents(){

    /* Form submit */
    d.form.addEventListener('submit', function(e){
        e.preventDefault();
        addProduct();
    });

    /* Clear error on input */
    d.fName.addEventListener('input', function(){ d.errName.classList.add('hidden'); d.fName.classList.remove('err-field'); });
    d.fPrice.addEventListener('input', function(){ d.errPrice.classList.add('hidden'); d.fPrice.classList.remove('err-field'); });
    d.fStock.addEventListener('input', function(){ d.errStock.classList.add('hidden'); d.fStock.classList.remove('err-field'); });
    d.fCat.addEventListener('change', function(){ d.errCat.classList.add('hidden'); d.fCat.classList.remove('err-field'); });

    /* Image upload — click */
    d.imgDrop.addEventListener('click', function(){
        d.fImg.click();
    });

    /* Image upload — change */
    d.fImg.addEventListener('change', function(){
        if(this.files && this.files[0]) handleFileSelect(this.files[0]);
    });

    /* Image upload — drag & drop */
    d.imgDrop.addEventListener('dragover', function(e){
        e.preventDefault();
        e.stopPropagation();
        d.imgDrop.classList.add('dragover');
    });

    d.imgDrop.addEventListener('dragleave', function(e){
        e.preventDefault();
        e.stopPropagation();
        d.imgDrop.classList.remove('dragover');
    });

    d.imgDrop.addEventListener('drop', function(e){
        e.preventDefault();
        e.stopPropagation();
        d.imgDrop.classList.remove('dragover');
        if(e.dataTransfer.files && e.dataTransfer.files[0]){
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    /* Remove image preview */
    d.imgRemove.addEventListener('click', function(){
        clearImage();
    });

    /* Select all */
    d.chkAll.addEventListener('change', function(){
        toggleSelectAll();
    });

    /* Delete button */
    d.btnDel.addEventListener('click', function(){
        showConfirm();
    });

    /* Confirm modal */
    d.btnCancel.addEventListener('click', hideConfirm);
    d.btnDoDel.addEventListener('click', function(){
        hideConfirm();
        deleteSelected();
    });

    /* Close modal on backdrop click */
    d.mConfirm.addEventListener('click', function(e){
        if(e.target === d.mConfirm) hideConfirm();
    });

    /* Product grid delegation — checkbox & card click */
    d.prodGrid.addEventListener('change', function(e){
        var el = e.target.closest('[data-chk]');
        if(el){
            toggleSelect(el.getAttribute('data-chk'));
        }
    });

    d.prodGrid.addEventListener('click', function(e){
        /* Prevent toggle when clicking checkbox (handled by change event) */
        if(e.target.closest('[data-chk]')) return;

        var card = e.target.closest('.prod-card');
        if(card){
            var id = card.getAttribute('data-id');
            toggleSelect(id);
            /* Update checkbox visual */
            var chk = card.querySelector('[data-chk]');
            if(chk) chk.checked = !!selectedIds[id];
        }
    });

    /* Clear errors on focus */
    var fields = [d.fName, d.fPrice, d.fStock, d.fCat];
    for(var i = 0; i < fields.length; i++){
        fields[i].addEventListener('focus', function(){
            this.classList.remove('err-field');
            var errId = 'err-' + this.id.replace('f-','');
            var errEl = document.getElementById(errId);
            if(errEl) errEl.classList.add('hidden');
        });
    }
}

/* ========== INIT ========== */
function init(){
    cacheDom();
    loadProducts();
    renderStats();
    renderProducts();
    updateDelButton();
    updateChkAll();
    initEvents();
}

if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();