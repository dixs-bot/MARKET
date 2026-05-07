/* ============================================================
   ADMIN CONTROLLER — MAIN ENTRY POINT & FLOW GLUE
   ============================================================ */
(function () {
    'use strict';

    if (!window.MiniMarket) throw new Error("MiniMarket core not loaded");
    if (!window.AdminApp) window.AdminApp = {};

    var MM = window.MiniMarket;

    /* ── Shared State (Single Source of Truth) ── */
    AdminApp.State = {
        products: [],
        categories: [],
        selectedIds: {},
        pendingImage: null,
        pendingCatImage: null,
        toastTimer: null,
        draggedCatId: null,
        editingProductId: null,
        editingCategoryId: null,
        pendingDeleteCategory: null
    };

    /* Safeguard references */
    var UI, ProdService, CatService, d;

    /* ===== FORM HELPERS ===== */

    function getFormData() {
        return {
            name: d.fName.value.trim(),
            price: parseInt(d.fPrice.value, 10),
            stock: parseInt(d.fStock.value, 10),
            category: d.fCat.value
        };
    }

    function buildProductInput(formData) {
        return {
            name: formData.name,
            price: formData.price,
            stock: formData.stock,
            category: formData.category,
            image: AdminApp.State.pendingImage
        };
    }

    function validateEditInput(newName, newPrice, newStock) {
        newName = newName.trim();
        if (!newName) return { ok: false, error: 'Nama tidak boleh kosong' };

        newPrice = Number(newPrice);
        if (isNaN(newPrice) || newPrice < 0) return { ok: false, error: 'Harga tidak valid' };

        newStock = Number(newStock);
        if (isNaN(newStock) || newStock < 0) return { ok: false, error: 'Stok tidak valid' };

        return { ok: true, data: { name: newName, price: newPrice, stock: newStock } };
    }

    /* ===== SELECTION HELPERS ===== */

    function toggleSelect(id) {
        var S = AdminApp.State;
        if (S.selectedIds[id]) delete S.selectedIds[id]; else S.selectedIds[id] = true;
        
        var count = selectedCount();
        UI.updateDelButton(count);
        UI.updateChkAll(isAllSelected(), isSomeSelected(), S.products.length);
        UI.updateCardStyles();
    }

    function toggleSelectAll() {
        var S = AdminApp.State;
        if (isAllSelected() || isSomeSelected()) {
            S.selectedIds = {};
        } else {
            for (var i = 0; i < S.products.length; i++) S.selectedIds[S.products[i].id] = true;
        }
        
        var count = selectedCount();
        UI.updateDelButton(count);
        UI.updateChkAll(isAllSelected(), isSomeSelected(), S.products.length);
        UI.updateCardStyles();
    }

    function isAllSelected() {
        var S = AdminApp.State;
        if (!S.products.length) return false;
        for (var i = 0; i < S.products.length; i++) {
            if (!S.selectedIds[S.products[i].id]) return false;
        }
        return true;
    }

    function isSomeSelected() { 
        return Object.keys(AdminApp.State.selectedIds).length > 0; 
    }

    function selectedCount()  { 
        return Object.keys(AdminApp.State.selectedIds).length; 
    }

    /* ===== PRODUCT HANDLERS ===== */

    async function addProduct() {

    try {

        if (!UI.validateForm()) {
            UI.notify('Lengkapi semua field yang wajib', 'error');
            return;
        }

        var formData = getFormData();
        var input = buildProductInput(formData);

        var result = await ProdService.createProduct(input);

        if (!result.ok) {
            UI.notify(result.error || 'Gagal menyimpan produk', 'error');
            return;
        }

        UI.renderProducts();
        UI.renderStats();
        UI.resetForm();

        UI.notify('Produk berhasil ditambahkan', 'success');

    } catch (err) {

        console.error(err);

        UI.notify('Terjadi kesalahan sistem', 'error');
    }
}

async function deleteSelected() {

    var S = AdminApp.State;

    var result =
        await ProdService.deleteSelectedProducts(
            S.selectedIds
        );

    if (!result.ok) return;

    S.selectedIds = {};

    UI.renderProducts();
    UI.updateDelButton(0);
    UI.updateChkAll(false, false, S.products.length);
    UI.renderStats();

    UI.notify(
        result.count + ' produk berhasil dihapus',
        'success'
    );
}

    function openEditProduct(id) {
        var S = AdminApp.State;
        var p = null;

        for (var i = 0; i < S.products.length; i++) {
            if (S.products[i].id === id) {
                p = S.products[i];
                break;
            }
        }

        if (!p) return;

        S.editingProductId = id;
        S.editingCategoryId = null;
        UI.showEditModal(p.name, p.price, p.stock, 'product');
    }

    async function saveEditProduct() {
        var S = AdminApp.State;
        var editData = UI.getEditFormData();
        
        /* Handle Category Edit via Modal */
        if (S.editingCategoryId) {
            var catName = editData.name ? editData.name.trim() : '';
            if (!catName) {
                UI.notify('Nama tidak boleh kosong', 'error');
                return;
            }

            var updateResult = await CatService.updateCategory(S.editingCategoryId, catName);
            if (updateResult.ok) {
                UI.hideEditModal();
                UI.renderCategories();
                UI.updateProductCategoryDropdown();
                UI.notify('Kategori berhasil diubah', 'success');
            } else {
                UI.notify(updateResult.message, 'error');
            }
            S.editingCategoryId = null;
            return;
        }

        /* Handle Product Edit via Modal */
        var validation = validateEditInput(editData.name, editData.price, editData.stock);
        if (!validation.ok) {
            UI.notify(validation.error, 'error');
            return;
        }

        var result = await ProdService.editProductData(S.editingProductId, validation.data.name, validation.data.price, validation.data.stock);

        if (result.ok) {
            UI.hideEditModal();
            UI.renderProducts();
            UI.notify('Produk berhasil diupdate', 'success');
        } else {
            UI.notify('Gagal mengupdate produk', 'error');
        }
        S.editingProductId = null;
    }

    /* ===== CATEGORY HANDLERS ===== */

    async function addCategory() {
        if (!d.catName) return;

        var S = AdminApp.State;
        var result = await CatService.createCategory(d.catName.value, S.pendingCatImage);
        
        if (!result.ok) {
            if (result.error === 'empty_name' || result.error === 'too_short') {
                if (d.errCatName) {
                    d.errCatName.textContent = result.message;
                    d.errCatName.classList.remove('hidden');
                }
                if (d.catName) d.catName.classList.add('err-field');
            }
            UI.notify(result.message, 'error');
            return;
        }

        if (d.errCatName) d.errCatName.classList.add('hidden');
        if (d.catName) d.catName.classList.remove('err-field');

        d.catName.value = '';
        UI.clearCatImage();
        UI.updateProductCategoryDropdown();
        UI.renderCategories();
        UI.notify('Kategori berhasil ditambahkan', 'success');
    }

    async function handleDeleteAction() {
        var S = AdminApp.State;
        UI.hideConfirm();

        if (S.pendingDeleteCategory) {
            var delResult = await CatService.deleteCategory(S.pendingDeleteCategory);
            S.pendingDeleteCategory = null;
            
            if (delResult.ok) {
                UI.renderCategories();
                UI.updateProductCategoryDropdown();
                UI.renderProducts(); 
                UI.notify('Kategori berhasil dihapus', 'success');
            } else {
                UI.notify(delResult.message, 'error');
            }
        } else {
            deleteSelected();
        }
    }

    /* ===== EVENT BINDING ===== */

    function initEvents() {
        /* Product form */
        d.form.addEventListener('submit', function (e) { e.preventDefault(); addProduct(); });

        d.fName.addEventListener('input',  function () { d.errName.classList.add('hidden');  d.fName.classList.remove('err-field'); });
        d.fPrice.addEventListener('input', function () { d.errPrice.classList.add('hidden'); d.fPrice.classList.remove('err-field'); });
        d.fStock.addEventListener('input', function () { d.errStock.classList.add('hidden'); d.fStock.classList.remove('err-field'); });
        d.fCat.addEventListener('change',  function () { d.errCat.classList.add('hidden');   d.fCat.classList.remove('err-field'); });

        /* Product image */
        d.imgDrop.addEventListener('click', function () { d.fImg.click(); });
        d.fImg.addEventListener('change', function () {
            if (this.files && this.files[0]) UI.handleFileSelect(this.files[0]);
        });
        d.imgDrop.addEventListener('dragover', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.add('dragover');
        });
        d.imgDrop.addEventListener('dragleave', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.remove('dragover');
        });
        d.imgDrop.addEventListener('drop', function (e) {
            e.preventDefault(); e.stopPropagation(); d.imgDrop.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) UI.handleFileSelect(e.dataTransfer.files[0]);
        });
        d.imgRemove.addEventListener('click', UI.clearImage);

        /* Product selection */
        d.chkAll.addEventListener('change', toggleSelectAll);
        d.btnDel.addEventListener('click', function () { 
            AdminApp.State.pendingDeleteCategory = null;
            UI.showConfirm(selectedCount() + ' produk akan dihapus permanen'); 
        });
        d.btnCancel.addEventListener('click', UI.hideConfirm);
        d.btnDoDel.addEventListener('click', handleDeleteAction);
        d.mConfirm.addEventListener('click', function (e) {
            if (e.target === d.mConfirm) UI.hideConfirm();
        });
        d.prodGrid.addEventListener('change', function (e) {
            var el = e.target.closest('[data-chk]');
            if (el) toggleSelect(el.getAttribute('data-chk'));
        });
        d.prodGrid.addEventListener('click', function (e) {
            var editBtn = e.target.closest('.edit-prod');
            if (editBtn) {
                openEditProduct(editBtn.getAttribute('data-id'));
                return;
            }

            if (e.target.closest('[data-chk]')) return;
            var card = e.target.closest('.prod-card');
            if (card) {
                var id  = card.getAttribute('data-id');
                toggleSelect(id);
                var chk = card.querySelector('[data-chk]');
                if (chk) chk.checked = !!AdminApp.State.selectedIds[id];
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

        /* ── Edit Modal Events ── */
        if (d.btnSaveEdit) {
            d.btnSaveEdit.addEventListener('click', function(e) {
                e.preventDefault();
                saveEditProduct();
            });
        }
        if (d.btnCancelEdit) {
            d.btnCancelEdit.addEventListener('click', function() {
                UI.hideEditModal();
            });
        }
        if (d.mEditProd) {
            d.mEditProd.addEventListener('click', function(e) {
                if (e.target === d.mEditProd) UI.hideEditModal();
            });
        }

        /* ── Category Events ── */

        if (d.btnAddCat) {
            d.btnAddCat.addEventListener('click', function () {
                addCategory();
            });
        }

        if (d.catName) {
            d.catName.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory();
                }
            });
            d.catName.addEventListener('input', function () {
                if (d.errCatName) d.errCatName.classList.add('hidden');
                d.catName.classList.remove('err-field');
            });
        }

        if (d.btnUploadCatImg && d.catImg) {
            d.btnUploadCatImg.addEventListener('click', function () {
                d.catImg.click();
            });
            d.catImg.addEventListener('change', function () {
                if (this.files && this.files[0]) UI.handleCatFileSelect(this.files[0]);
            });
        }

        if (d.catImgRemove) {
            d.catImgRemove.addEventListener('click', UI.clearCatImage);
        }

        /* ── Category List Events ── */
        if (d.catList) {
            d.catList.addEventListener('click', function (e) {
                /* Edit Category (Modal) */
                var editBtn = e.target.closest('.edit-cat');
                if (editBtn) {
                    var id = editBtn.getAttribute('data-id');

                    if (id === 'all') {
                        UI.notify('Kategori default tidak bisa diubah', 'error');
                        return;
                    }

                    var cat = null;
                    var cats = AdminApp.State.categories;
                    for (var i = 0; i < cats.length; i++) {
                        if (cats[i].id === id) { cat = cats[i]; break; }
                    }
                    if (!cat) return;

                    AdminApp.State.editingCategoryId = id;
                    AdminApp.State.editingProductId = null;
                    UI.showEditModal(cat.name, null, null, 'category');
                    return;
                }

                /* Delete Category (Confirm Modal) */
                var delBtn = e.target.closest('.del-cat');
                if (delBtn) {
                    var delId = delBtn.getAttribute('data-id');

                    if (delId === 'all') {
                        UI.notify('Kategori default tidak bisa dihapus', 'error');
                        return;
                    }

                    AdminApp.State.pendingDeleteCategory = delId;
                    UI.showConfirm('Hapus kategori ini? Produk yang menggunakan kategori ini akan dialihkan ke "Semua".');
                    return;
                }
            });

            /* ── Drag & Drop Reorder ── */
            d.catList.addEventListener('dragstart', function (e) {
                var item = e.target.closest('.cat-item');
                if (!item) return;

                var catId = item.getAttribute('data-id');

                if (catId === 'all') {
                    e.preventDefault();
                    return;
                }

                AdminApp.State.draggedCatId = catId;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', catId);
            });

            d.catList.addEventListener('dragend', function (e) {
                var item = e.target.closest('.cat-item');
                if (item) item.classList.remove('dragging');
                AdminApp.State.draggedCatId = null;

                var items = d.catList.querySelectorAll('.cat-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.remove('drag-over');
                }
            });

            d.catList.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                var item = e.target.closest('.cat-item');
                if (item && item.getAttribute('data-id') !== 'all') {
                    item.classList.add('drag-over');
                }
            });

            d.catList.addEventListener('dragleave', function (e) {
                var item = e.target.closest('.cat-item');
                if (item) item.classList.remove('drag-over');
            });

            d.catList.addEventListener('drop', function (e) {
                e.preventDefault();

                var allItems = d.catList.querySelectorAll('.cat-item');
                for (var k = 0; k < allItems.length; k++) {
                    allItems[k].classList.remove('drag-over', 'dragging');
                }

                var targetItem = e.target.closest('.cat-item');
                if (!targetItem || !AdminApp.State.draggedCatId) return;

                var targetId = targetItem.getAttribute('data-id');

                if (targetId === 'all') return;
                if (AdminApp.State.draggedCatId === targetId) return;

                var cats = AdminApp.State.categories;
                var ids = [];
                for (var j = 0; j < cats.length; j++) ids.push(cats[j].id);

                var fromIdx = ids.indexOf(AdminApp.State.draggedCatId);
                var toIdx = ids.indexOf(targetId);

                if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

                ids.splice(fromIdx, 1);
                ids.splice(toIdx, 0, AdminApp.State.draggedCatId);

                var reorderResult = CatService.reorderCategories(ids);
                
                if (reorderResult.ok) {
                    UI.renderCategories();
                    UI.updateProductCategoryDropdown();
                    UI.notify('Urutan kategori diperbarui', 'success');
                } else {
                    UI.notify(reorderResult.message, 'error');
                }
            });
        }
    }

    /* ===== GLOBAL SYNC LISTENERS ===== */

    window.addEventListener('productsUpdated', function () {
        AdminApp.State.products = MM.getProducts();
        UI.renderProducts();
        UI.renderStats();
        UI.updateDelButton(selectedCount());
        UI.updateChkAll(isAllSelected(), isSomeSelected(), AdminApp.State.products.length);
    });

    window.addEventListener('categoriesUpdated', function () {
        AdminApp.State.categories = MM.getCategories();
        UI.renderCategories();
        UI.updateProductCategoryDropdown();
    });

    window.addEventListener('storage', function (e) {
        if (e.key === MM.LS_PRODUCTS) {
            AdminApp.State.products = MM.getProducts();
            UI.renderProducts();
            UI.renderStats();
            UI.updateDelButton(selectedCount());
            UI.updateChkAll(isAllSelected(), isSomeSelected(), AdminApp.State.products.length);
        }
        if (e.key === MM.LS_CATEGORIES) {
            AdminApp.State.categories = MM.getCategories();
            UI.renderCategories();
            UI.updateProductCategoryDropdown();
        }
    });

    /* ===== INITIALIZATION ===== */

    async function init() {
        if (!AdminApp.adminUI) throw new Error("adminUI not loaded");
        if (!AdminApp.productService) throw new Error("productService not loaded");
        if (!AdminApp.categoryService) throw new Error("categoryService not loaded");

        UI = AdminApp.adminUI;
        ProdService = AdminApp.productService;
        CatService = AdminApp.categoryService;

        UI.cacheDom();
        d = UI.getDom();

        /* Initialize Single Source of Truth */
        AdminApp.State.products = MM.getProducts();
        AdminApp.State.categories = MM.getCategories();

        await MM.syncProductsFromSupabase(); 
        await MM.syncCategoriesFromSupabase();
       
        UI.renderStats();
        UI.updateProductCategoryDropdown();
        UI.renderCategories();
        UI.renderProducts();
        UI.updateDelButton(0);
        UI.updateChkAll(false, false, AdminApp.State.products.length);
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
