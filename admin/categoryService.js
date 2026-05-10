/* ============================================================
   CATEGORY SERVICE — DATA LOGIC ONLY (NO DOM, NO UI CALLS)
   Uses AdminApp.State as Single Source of Truth
   MULTISTORE HARDENED VERSION
   ============================================================ */

(function () {

    'use strict';

    if (!window.MiniMarket) {
        throw new Error(
            "MiniMarket core not loaded"
        );
    }

    if (!window.AdminApp) {
        window.AdminApp = {};
    }

    var MM = window.MiniMarket;

    /* ============================================================
       HELPERS
       ============================================================ */

    function slugify(text) {

        return text
            .toString()
            .toLowerCase()

            .replace(
                /[^a-z0-9\s-]/g,
                ''
            )

            .replace(
                /[\s-]+/g,
                '-'
            )

            .replace(
                /(^-|-$)/g,
                ''
            );
    }

    function getCurrentStoreId() {

        if (
            window.AdminSession?.role ===
            'admin'
        ) {

            return (
                window.AdminSession
                    .store_id || null
            );
        }

        return (
            document.getElementById(
                'product-store'
            )?.value || null
        );
    }

    function isSuperAdmin() {

        return (
            window.AdminSession?.role ===
            'super_admin'
        );
    }

    /* ============================================================
       CREATE CATEGORY
       ============================================================ */

    async function createCategory(
        name,
        image
    ) {

        try {

            if (
                !name ||
                name.trim().length === 0
            ) {

                return {

                    ok: false,

                    error: 'empty_name',

                    message:
                        'Nama kategori tidak boleh kosong'
                };
            }

            if (
                name.trim().length < 2
            ) {

                return {

                    ok: false,

                    error: 'too_short',

                    message:
                        'Nama kategori minimal 2 karakter'
                };
            }

            var storeId =
                getCurrentStoreId();

            if (!storeId) {

                return {

                    ok: false,

                    error: 'missing_store',

                    message:
                        'Cabang belum dipilih'
                };
            }

            var id =
                slugify(name.trim());

            var stateCats =
                AdminApp.State.categories || [];

            var seen = {};

            for (
                var i = 0;
                i < stateCats.length;
                i++
            ) {

                var cat =
                    stateCats[i];

                seen[cat.id] = true;

                var sameStore =

                    isSuperAdmin() ||

                    cat.store_id ===
                    storeId;

                if (

                    sameStore &&

                    cat.name
                        .toLowerCase() ===

                    name.trim()
                        .toLowerCase()

                ) {

                    return {

                        ok: false,

                        error:
                            'duplicate_name',

                        message:
                            'Nama kategori sudah digunakan'
                    };
                }
            }

            if (seen[id]) {

                id =
                    id +
                    '_' +
                    Date.now()
                        .toString(36);
            }

            var catData =
                MM.normalizeCategory({

                    id: id,

                    name:
                        name.trim(),

                    image:
                        image ||
                        MM.FALLBACK_CAT_IMG
                });

            if (!catData) {

                return {

                    ok: false,

                    error:
                        'invalid_data',

                    message:
                        'Data kategori tidak valid'
                };
            }

            const {
                data,
                error
            } =

                await window.supabaseClient

                    .from('categories')

                    .insert([{

                        id: catData.id,

                        name: catData.name,

                        image: catData.image,

                        store_id: storeId
                    }])

                    .select()

                    .single();

            if (error) {

                console.error(error);

                return {

                    ok: false,

                    error:
                        error.message,

                    message:
                        'Gagal menyimpan kategori'
                };
            }

            await MM.syncCategoriesFromSupabase();

            return {

                ok: true,

                data: data
            };

        } catch (err) {

            console.error(
                'Create category error:',
                err
            );

            return {

                ok: false,

                error: 'unknown',

                message:
                    'Terjadi kesalahan'
            };
        }
    }

    /* ============================================================
       UPDATE CATEGORY
       ============================================================ */

    async function updateCategory(
        id,
        newName
    ) {

        try {

            if (
                !newName ||
                newName.trim().length === 0
            ) {

                return {

                    ok: false,

                    error: 'empty_name',

                    message:
                        'Nama kategori tidak boleh kosong'
                };
            }

            if (
                newName.trim().length < 2
            ) {

                return {

                    ok: false,

                    error: 'too_short',

                    message:
                        'Nama kategori minimal 2 karakter'
                };
            }

            var storeId =
                getCurrentStoreId();

            var stateCats =
                AdminApp.State.categories || [];

            for (
                var j = 0;
                j < stateCats.length;
                j++
            ) {

                var current =
                    stateCats[j];

                var sameStore =

                    isSuperAdmin() ||

                    current.store_id ===
                    storeId;

                if (

                    current.id !== id &&

                    sameStore &&

                    current.name
                        .toLowerCase() ===

                    newName.trim()
                        .toLowerCase()

                ) {

                    return {

                        ok: false,

                        error:
                            'duplicate_name',

                        message:
                            'Nama kategori sudah digunakan'
                    };
                }
            }

            var query =

                window.supabaseClient

                    .from('categories')

                    .update({

                        name:
                            newName.trim()
                    })

                    .eq('id', id);

            if (!isSuperAdmin()) {

                query.eq(
                    'store_id',
                    storeId
                );
            }

            const { error } =
                await query;

            if (error) {

                console.error(error);

                return {

                    ok: false,

                    error:
                        error.message,

                    message:
                        'Gagal mengubah kategori'
                };
            }

            await MM.syncCategoriesFromSupabase();

            return {
                ok: true
            };

        } catch (err) {

            console.error(
                'Update category error:',
                err
            );

            return {

                ok: false,

                error: 'unknown',

                message:
                    'Terjadi kesalahan'
            };
        }
    }

    /* ============================================================
       DELETE CATEGORY
       ============================================================ */

    async function deleteCategory(id) {

        try {

            if (id === 'all') {

                return {

                    ok: false,

                    error:
                        'default_protected',

                    message:
                        'Kategori default tidak bisa dihapus'
                };
            }

            var storeId =
                getCurrentStoreId();

            var query =

                window.supabaseClient

                    .from('categories')

                    .delete()

                    .eq('id', id);

            if (!isSuperAdmin()) {

                query.eq(
                    'store_id',
                    storeId
                );
            }

            const { error } =
                await query;

            if (error) {

                console.error(error);

                return {

                    ok: false,

                    error:
                        error.message,

                    message:
                        'Gagal menghapus kategori'
                };
            }

            await MM.syncCategoriesFromSupabase();

            return {
                ok: true
            };

        } catch (err) {

            console.error(
                'Delete category error:',
                err
            );

            return {

                ok: false,

                error: 'unknown',

                message:
                    'Terjadi kesalahan'
            };
        }
    }

    /* ============================================================
       REORDER CATEGORY
       ============================================================ */

    function reorderCategories(ids) {

        var stateCats =
            AdminApp.State.categories || [];

        var map = {};

        for (
            var i = 0;
            i < stateCats.length;
            i++
        ) {

            map[
                stateCats[i].id
            ] = stateCats[i];
        }

        var reordered = [];

        for (
            var j = 0;
            j < ids.length;
            j++
        ) {

            if (map[ids[j]]) {

                reordered.push(
                    map[ids[j]]
                );
            }
        }

        if (
            reordered.length !==
            stateCats.length
        ) {

            return {

                ok: false,

                error:
                    'invalid_ids',

                message:
                    'ID kategori tidak valid'
            };
        }

        if (
            !MM.saveCategories(
                reordered
            )
        ) {

            return {

                ok: false,

                error:
                    'storage_full',

                message:
                    'Gagal mengubah urutan kategori'
            };
        }

        AdminApp.State.categories =
            reordered;

        return {
            ok: true
        };
    }

    /* ============================================================
       EXPORT
       ============================================================ */

    window.AdminApp.categoryService = {

        createCategory:
            createCategory,

        updateCategory:
            updateCategory,

        deleteCategory:
            deleteCategory,

        reorderCategories:
            reorderCategories
    };

}());
