/* ============================================================
   PRODUCT SERVICE — DATA LOGIC ONLY (NO DOM, NO UI CALLS)
   Uses AdminApp.State as Single Source of Truth
   ============================================================ */
(function () {
    'use strict';

    if (!window.MiniMarket) throw new Error("MiniMarket core not loaded");
    if (!window.AdminApp) window.AdminApp = {};

    var MM           = window.MiniMarket;
    var FALLBACK_IMG = MM.FALLBACK_IMG;

    function genId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    function createProduct(input) {
        var stateProducts = AdminApp.State.products;
        var allIds = {};
        
        for (var y = 0; y < stateProducts.length; y++) {
            allIds[stateProducts[y].id] = true;
        }

        var candidate = genId();
        while (allIds[candidate]) {
            candidate = genId();
        }

        var raw = {
            id:       candidate,
            name:     input.name,
            price:    input.price,
            category: input.category,
            stock:    input.stock,
            image:    input.image || FALLBACK_IMG
        };

        var prod = MM.normalizeProduct(raw);
        if (!prod) { 
            return { ok: false, error: 'invalid_data' }; 
        }

        var newProducts = stateProducts.slice();
        newProducts.push(prod);

        if (!MM.saveProducts(newProducts)) {
            return { ok: false, error: 'storage_full' };
        }
        
        /* Update Single Source of Truth */
        AdminApp.State.products = newProducts;
        
        window.dispatchEvent(new Event('productsUpdated'));
        
        return { ok: true, data: prod };
    }

    function deleteSelectedProducts(selectedIds) {
        var ids = Object.keys(selectedIds);
        if (!ids.length) return { ok: false, error: 'none_selected' };

        var newProducts = [];
        var currentProducts = AdminApp.State.products;
        
        for (var i = 0; i < currentProducts.length; i++) {
            if (!selectedIds[currentProducts[i].id]) newProducts.push(currentProducts[i]);
        }
        
        if (!MM.saveProducts(newProducts)) {
            return { ok: false, error: 'storage_full' };
        }

        /* Update Single Source of Truth */
        AdminApp.State.products = newProducts;
        
        window.dispatchEvent(new Event('productsUpdated'));
        
        return { ok: true, count: ids.length };
    }

    function editProductData(id, newName, newPrice, newStock) {
        var editProducts = AdminApp.State.products.slice();
        var p = null;

        for (var i = 0; i < editProducts.length; i++) {
            if (editProducts[i].id === id) {
                p = editProducts[i];
                break;
            }
        }

        if (!p) return { ok: false, error: 'not_found' };

        p.name  = newName;
        p.price = newPrice;
        p.stock = newStock;

        if (!MM.saveProducts(editProducts)) {
            return { ok: false, error: 'storage_full' };
        }
        
        /* Update Single Source of Truth */
        AdminApp.State.products = editProducts;
        
        window.dispatchEvent(new Event('productsUpdated'));

        return { ok: true };
    }

    window.AdminApp.productService = {
        createProduct: createProduct,
        deleteSelectedProducts: deleteSelectedProducts,
        editProductData: editProductData
    };

}());