/* ============================================================
   ADMIN UI — DOM MANIPULATION ONLY (Reads from State)
   ============================================================ */
(function () {
    'use strict';

    if (!window.MiniMarket) throw new Error("MiniMarket core not loaded");
    if (!window.AdminApp) window.AdminApp = {};

    var MM           = window.MiniMarket;
    var FALLBACK_IMG = MM.FALLBACK_IMG;
    var fmt          = MM.fmt;
    var MAX_IMG_SIZE = 2 * 1024 * 1024; // 2MB

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

        d.catName        = g('cat-name');
        d.catImg         = g('cat-img');
        d.btnAddCat      = g('btn-add-cat');
        d.btnUploadCatImg = g('btn-upload-cat-img');
        d.catImgPreviewWrap = g('cat-img-preview-wrap');
        d.catImgPreview  = g('cat-img-preview');
        d.catImgName     = g('cat-img-name');
        d.catImgSize     = g('cat-img-size');
        d.catImgRemove   = g('cat-img-remove');
        d.errCatName     = g('err-cat-name');
        d.catList        = g('cat-list');

        /* Edit Modal Elements */
        d.mEditProd    = g('m-edit-prod');
        d.editName     = g('edit-name');
        d.editPrice    = g('edit-price');
        d.editStock    = g('edit-stock');
        d.btnSaveEdit  = g('btn-save-edit');
        d.btnCancelEdit = g('btn-cancel-edit');
    }

    function notify(msg, type) {
        var S = AdminApp.State;
        if (S.toastTimer) clearTimeout(S.toastTimer);
        d.toast.textContent = msg;
        d.toast.style.background =
            type === 'error'   ? '#ef4444' :
            type === 'success' ? '#059669' : '#1e293b';
        d.toast.classList.add('show');
        S.toastTimer = setTimeout(function () { d.toast.classList.remove('show'); }, 2500);
    }

    function formatBytes(b) {
        if (b < 1024)      return b + ' B';
        if (b < 1048576)   return (b / 1024).toFixed(1)    + ' KB';
        return                    (b / 1048576).toFixed(1) + ' MB';
    }

    function handleFileSelect(file) {
        if (!file) return;
        if (file.size > MAX_IMG_SIZE) { notify('Ukuran gambar maks 2MB', 'error'); return; }
        if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
            notify('Format harus PNG, JPG, atau WebP', 'error'); return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            AdminApp.State.pendingImage = e.target.result;
            d.imgPreview.src = AdminApp.State.pendingImage;
            d.imgName.textContent = file.name;
            d.imgSize.textContent = formatBytes(file.size);
            d.imgWrap.classList.remove('hidden');
            d.imgDrop.classList.add('has-img');
        };
        reader.readAsDataURL(file);
    }

    function handleCatFileSelect(file) {
        if (!file) return;

        AdminApp.State.pendingCatImage = null;

        if (file.size > MAX_IMG_SIZE) {
            notify('Ukuran gambar maks 2MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            notify('File harus gambar', 'error');
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            AdminApp.State.pendingCatImage = e.target.result;

            d.catImgPreview.src = AdminApp.State.pendingCatImage;
            d.catImgName.textContent = file.name;
            d.catImgSize.textContent = formatBytes(file.size);

            d.catImgPreviewWrap.classList.remove('hidden');
        };

        reader.onerror = function () {
            notify('Gagal membaca gambar', 'error');
        };

        reader.readAsDataURL(file);
    }

    function clearImage() {
        AdminApp.State.pendingImage = null;
        d.fImg.value = '';
        d.imgWrap.classList.add('hidden');
        d.imgDrop.classList.remove('has-img');
    }

    function clearCatImage() {
        AdminApp.State.pendingCatImage = null;
        if (d.catImg) d.catImg.value = '';
        if (d.catImgPreviewWrap) d.catImgPreviewWrap.classList.add('hidden');
    }

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

    function updateProductCategoryDropdown() {
        if (!d.fCat) return;
        var currentVal = d.fCat.value;
        d.fCat.innerHTML = '<option value="">Pilih Kategori</option>';

        var cats = AdminApp.State.categories;
        for (var i = 0; i < cats.length; i++) {
            var opt = document.createElement('option');
            opt.value = cats[i].id;
            opt.textContent = cats[i].name;
            if (cats[i].id === currentVal) opt.selected = true;
            d.fCat.appendChild(opt);
        }
    }

    function renderCategories() {
        if (!d.catList) return;
        var cats = AdminApp.State.categories;
        var h = '';

        for (var i = 0; i < cats.length; i++) {
            var c = cats[i];
            var isAll = c.id === 'all';

            h += '<div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cat-item" data-id="' + c.id + '" draggable="' + (isAll ? 'false' : 'true') + '">';

            if (!isAll) {
                h += '<svg class="w-4 h-4 text-slate-300 cursor-grab shrink-0 drag-handle" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>';
            } else {
                h += '<div class="w-4 h-4 shrink-0"></div>';
            }

            h += '<div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">';
h += '<img src="' + (c.image || "/assets/img/kategori.jpeg") + '" alt="' + c.name + '" class="w-full h-full object-cover" onerror="this.onerror=null;this.src=\'/assets/img/kategori.jpeg\'">';
            h += '</div>';

            h += '<div class="flex-1 min-w-0">';
            h += '<p class="text-sm font-semibold text-slate-800 truncate">' + c.name + '</p>';
            h += '<p class="text-[10px] text-slate-400">ID: ' + c.id + '</p>';
            h += '</div>';

            if (!isAll) {
                h += '<button class="edit-cat w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 tap hover:bg-blue-50 hover:text-blue-600 transition" data-id="' + c.id + '" title="Edit">';
                h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>';
                h += '</button>';

                h += '<button class="del-cat w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 tap hover:bg-red-50 hover:text-red-500 transition" data-id="' + c.id + '" title="Hapus">';
                h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
                h += '</button>';
            } else {
                h += '<span class="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md font-medium">Default</span>';
            }

            h += '</div>';
        }

        d.catList.innerHTML = h;
    }

    function updateDelButton(count) {
        d.delCount.textContent = count;
        if (count > 0) {
            d.btnDel.classList.remove('hidden'); d.btnDel.classList.add('flex');
        } else {
            d.btnDel.classList.add('hidden');    d.btnDel.classList.remove('flex');
        }
    }

    function updateChkAll(allSelected, someSelected, totalCount) {
        if (!totalCount) {
            d.chkAll.checked = false; d.chkAll.indeterminate = false; return;
        }
        d.chkAll.checked = allSelected;
        d.chkAll.indeterminate = someSelected && !allSelected;
    }

    function updateCardStyles() {
        var S = AdminApp.State;
        var cards = d.prodGrid.querySelectorAll('.prod-card');
        for (var i = 0; i < cards.length; i++) {
            var id = cards[i].getAttribute('data-id');
            if (S.selectedIds[id]) cards[i].classList.add('selected');
            else                 cards[i].classList.remove('selected');
        }
    }

    function renderProductCard(p, catName, isSelected) {
        var selCls = isSelected ? ' selected' : '';
        var h = '';
        h += '<div class="prod-card card overflow-hidden' + selCls + '" data-id="' + p.id + '">';
        h += '<div class="relative">';
        h += '<input type="checkbox" class="chk absolute top-2.5 left-2.5 z-10" data-chk="' + p.id + '"' + (isSelected ? ' checked' : '') + '>';
      h += '<img src="' +
(
    p.image || FALLBACK_IMG
) +
'" alt="' +
p.name +
'" class="w-full aspect-square object-cover bg-slate-100" loading="lazy" onerror="this.onerror=null;this.src=\'' +
FALLBACK_IMG +
'\'">';
        h += '</div>';
        h += '<div class="p-3">';
        h += '<span class="badge mb-1.5">' + catName + '</span>';
        h += '<h3 class="text-xs font-semibold text-slate-800 leading-snug mb-1 line-clamp-2 min-h-[32px]">' + p.name + '</h3>';
        h += '<div class="flex items-center justify-between">';
        h += '<span class="text-sm font-bold text-blue-600">' + fmt(p.price) + '</span>';
        h += '<div class="flex items-center gap-2">';
        h += '<span class="text-[10px] font-medium text-slate-400">Stok: ' + p.stock + '</span>';
        h += '<button class="edit-prod text-[10px] font-semibold text-blue-500 hover:text-blue-700 tap" data-id="' + p.id + '">Edit</button>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
        return h;
    }

    function renderProducts() {
        var S = AdminApp.State;
        d.prodCount.textContent = S.products.length + ' produk';

        if (!S.products.length) {
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

        var cats = S.categories;
        var catMap = {};
        for (var j = 0; j < cats.length; j++) {
            catMap[cats[j].id] = cats[j].name;
        }

        var h = '';
        for (var i = 0; i < S.products.length; i++) {
            var p = S.products[i];
            var catName = catMap[p.category] || p.category;
            var isSelected = !!S.selectedIds[p.id];
            h += renderProductCard(p, catName, isSelected);
        }

        d.prodGrid.innerHTML = h;
        d.prodGrid.classList.add('stagger');
    }

    function showConfirm(message) {
        d.confirmMsg.textContent = message;
        d.mConfirm.classList.remove('hidden');
    }

    function hideConfirm() { 
        d.mConfirm.classList.add('hidden'); 
    }

    /* ── Edit Modal DOM Manipulation ── */
    function showEditModal(name, price, stock, type) {
        if (!d.mEditProd) return;
        if (d.editName) d.editName.value = name || '';
        if (d.editPrice) d.editPrice.value = price || '';
        if (d.editStock) d.editStock.value = stock || '';
        
        var isCategory = (type === 'category');
        var priceParent = d.editPrice ? d.editPrice.parentElement : null;
        var stockParent = d.editStock ? d.editStock.parentElement : null;
        
        if (priceParent) priceParent.style.display = isCategory ? 'none' : '';
        if (stockParent) stockParent.style.display = isCategory ? 'none' : '';
        if (d.editPrice) d.editPrice.style.display = isCategory ? 'none' : '';
        if (d.editStock) d.editStock.style.display = isCategory ? 'none' : '';

        d.mEditProd.classList.remove('hidden');
    }

    function hideEditModal() {
        if (!d.mEditProd) return;
        d.mEditProd.classList.add('hidden');
        
        /* Restore displays */
        var priceParent = d.editPrice ? d.editPrice.parentElement : null;
        var stockParent = d.editStock ? d.editStock.parentElement : null;
        if (priceParent) priceParent.style.display = '';
        if (stockParent) stockParent.style.display = '';
        if (d.editPrice) d.editPrice.style.display = '';
        if (d.editStock) d.editStock.style.display = '';
    }

    function getEditFormData() {
        return {
            name: d.editName ? d.editName.value : '',
            price: d.editPrice ? d.editPrice.value : '',
            stock: d.editStock ? d.editStock.value : ''
        };
    }

    window.AdminApp.adminUI = {
        cacheDom: cacheDom,
        notify: notify,
        handleFileSelect: handleFileSelect,
        handleCatFileSelect: handleCatFileSelect,
        clearImage: clearImage,
        clearCatImage: clearCatImage,
        validateForm: validateForm,
        resetForm: resetForm,
        renderStats: renderStats,
        updateProductCategoryDropdown: updateProductCategoryDropdown,
        renderCategories: renderCategories,
        updateDelButton: updateDelButton,
        updateChkAll: updateChkAll,
        updateCardStyles: updateCardStyles,
        renderProducts: renderProducts,
        showConfirm: showConfirm,
        hideConfirm: hideConfirm,
        showEditModal: showEditModal,
        hideEditModal: hideEditModal,
        getEditFormData: getEditFormData,
        getDom: function () { return d; }
    };

}());
