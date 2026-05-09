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

    async function createProduct(input) {
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

       const { data, error } =
    await window.supabaseClient
        .from('products')
       .insert([
    {
        name: prod.name,
        price: prod.price,
        stock: prod.stock,
        category: prod.category,
        image: prod.image,

        store_id: input.store_id
    }
])
        .select()
        .single();

if (error) {
    console.error(error);
    return { ok: false, error: error.message };
}
        /* 🔥 Sync UI State */
AdminApp.State.products.unshift(data);

return {
    ok: true,
    product: data
};
    
    }

   async function deleteSelectedProducts(selectedIds) {
        var ids = Object.keys(selectedIds);
        if (!ids.length) return { ok: false, error: 'none_selected' };

       const { error } =
    await window.supabaseClient
        .from('products')
        .delete()
        .in('id', ids);

if (error) {
    console.error(error);

    return {
        ok: false,
        error: error.message
    };
}

/* 🔥 Sync ulang dari database */
await MM.syncProductsFromSupabase();

return {
    ok: true,
    count: ids.length
};
    }

   async function editProductData(id, newName, newPrice, newStock) {
        var editProducts = AdminApp.State.products.slice();
        var p = null;

        for (var i = 0; i < editProducts.length; i++) {
            if (editProducts[i].id === id) {
                p = editProducts[i];
                break;
            }
        }

        if (!p) return { ok: false, error: 'not_found' };

       
       const { error } =
    await window.supabaseClient
        .from('products')
        .update({
            name: newName,
            price: newPrice,
            stock: newStock
        })
        .eq('id', id);

if (error) {
    console.error(error);

    return {
        ok: false,
        error: error.message
    };
}

/* 🔥 Sync ulang dari database */
await MM.syncProductsFromSupabase();

return {
    ok: true
};
    }

    window.AdminApp.productService = {
        createProduct: createProduct,
        deleteSelectedProducts: deleteSelectedProducts,
        editProductData: editProductData
    };

}());
