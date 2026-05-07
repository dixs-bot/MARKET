/* ============================================================
   CATEGORY SERVICE — DATA LOGIC ONLY (NO DOM, NO UI CALLS)
   Uses AdminApp.State as Single Source of Truth
   ============================================================ */
(function () {
    'use strict';

    if (!window.MiniMarket) throw new Error("MiniMarket core not loaded");
    if (!window.AdminApp) window.AdminApp = {};

    var MM = window.MiniMarket;

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    async function createCategory(name, image) {
        if (!name || name.trim().length === 0) {
            return { ok: false, error: 'empty_name', message: 'Nama kategori tidak boleh kosong' };
        }

        if (name.trim().length < 2) {
            return { ok: false, error: 'too_short', message: 'Nama kategori minimal 2 karakter' };
        }

        var id = slugify(name.trim());
        var stateCats = AdminApp.State.categories;
        var seen = {};
        
        for (var i = 0; i < stateCats.length; i++) {
            seen[stateCats[i].id] = true;
            if (stateCats[i].name.toLowerCase() === name.trim().toLowerCase()) {
                return { ok: false, error: 'duplicate_name', message: 'Nama kategori sudah digunakan' };
            }
        }

        if (seen[id]) {
            id = id + '_' + Date.now().toString(36);
        }

        var cat = MM.normalizeCategory({
            id: id,
            name: name.trim(),
            image: image || MM.FALLBACK_CAT_IMG
        });

        if (!cat) { 
            return { ok: false, error: 'invalid_data', message: 'Data kategori tidak valid' }; 
        }

       const { data, error } =
    await window.supabaseClient
        .from('categories')
        .insert([
            {
                id: cat.id,
                name: cat.name,
                image: cat.image
            }
        ])
        .select()
        .single();

if (error) {
    console.error(error);

    return {
        ok: false,
        error: error.message,
        message: 'Gagal menyimpan kategori'
    };
}

/* 🔥 Sync ulang database */
await MM.syncCategoriesFromSupabase();

return {
    ok: true,
    data: data
};
    }

    function updateCategory(id, newName) {
        if (!newName || newName.trim().length === 0) {
            return { ok: false, error: 'empty_name', message: 'Nama kategori tidak boleh kosong' };
        }

        if (newName.trim().length < 2) {
            return { ok: false, error: 'too_short', message: 'Nama kategori minimal 2 karakter' };
        }

        var stateCats = AdminApp.State.categories;
        for (var j = 0; j < stateCats.length; j++) {
            if (stateCats[j].id !== id && stateCats[j].name.toLowerCase() === newName.trim().toLowerCase()) {
                return { ok: false, error: 'duplicate_name', message: 'Nama kategori sudah digunakan' };
            }
        }

        var updatedCats = stateCats.slice();
        var found = false;
        for (var k = 0; k < updatedCats.length; k++) {
            if (updatedCats[k].id === id) {
                updatedCats[k].name = newName.trim();
                found = true;
                break;
            }
        }

        if (!found) return { ok: false, error: 'not_found', message: 'Kategori tidak ditemukan' };

        if (!MM.saveCategories(updatedCats)) {
            return { ok: false, error: 'storage_full', message: 'Gagal mengubah kategori' };
        }

        /* Update Single Source of Truth */
        AdminApp.State.categories = updatedCats;

        return { ok: true };
    }

    function deleteCategory(id) {
        if (id === 'all') {
            return { ok: false, error: 'default_protected', message: 'Kategori default tidak bisa dihapus' };
        }

        var stateCats = AdminApp.State.categories;
        var newCats = [];
        var found = false;
        
        for (var i = 0; i < stateCats.length; i++) {
            if (stateCats[i].id === id) {
                found = true;
                continue; 
            }
            newCats.push(stateCats[i]);
        }

        if (!found) return { ok: false, error: 'not_found', message: 'Kategori tidak ditemukan' };

        if (!MM.saveCategories(newCats)) {
            return { ok: false, error: 'storage_full', message: 'Gagal menghapus kategori' };
        }

        /* Update Single Source of Truth */
        AdminApp.State.categories = newCats;

        return { ok: true };
    }

    function reorderCategories(ids) {
        var stateCats = AdminApp.State.categories;
        var map = {};
        for (var i = 0; i < stateCats.length; i++) {
            map[stateCats[i].id] = stateCats[i];
        }

        var reordered = [];
        for (var j = 0; j < ids.length; j++) {
            if (map[ids[j]]) {
                reordered.push(map[ids[j]]);
            }
        }

        if (reordered.length !== stateCats.length) {
            return { ok: false, error: 'invalid_ids', message: 'ID kategori tidak valid' };
        }

        if (!MM.saveCategories(reordered)) {
            return { ok: false, error: 'storage_full', message: 'Gagal mengubah urutan kategori' };
        }

        /* Update Single Source of Truth */
        AdminApp.State.categories = reordered;

        return { ok: true };
    }

    window.AdminApp.categoryService = {
        createCategory: createCategory,
        updateCategory: updateCategory,
        deleteCategory: deleteCategory,
        reorderCategories: reorderCategories
    };

}());
