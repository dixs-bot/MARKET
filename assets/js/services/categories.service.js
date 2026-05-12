/**
 * ============================================
 * LUMORA — CATEGORIES SERVICE
 * ============================================
 * 
 * Menangani data kategori:
 * - Fetch kategori dari Supabase
 * - Get kategori by ID
 * - Get all categories dari cache
 * - Get categories by store
 * 
 * NOTE: Sync kategori ke MiniMarket cache saat ini
 * dihandle oleh MM.syncCategoriesFromSupabase() di
 * shared.js. Module ini disediakan untuk
 * ekspansi ke depan.
 */


/* ============================================================
   FETCH CATEGORIES FROM SUPABASE
============================================================ */

export async function fetchCategories() {

    try {

        const { data, error } =

            await window.supabaseClient

                .from('categories')

                .select('*')

                .order('name');

        if (error) {

            console.error(error);

            return [];
        }

        return data || [];

    } catch (err) {

        console.error(
            'Fetch categories error:',
            err
        );

        return [];
    }
}


/* ============================================================
   GET CATEGORY BY ID (from cache)
============================================================ */

export function getCategoryById(categoryId) {

    const MM =
        window.MiniMarket;

    const categories =
        MM.getCategories();

    if (!categories) return null;

    for (
        let i = 0;
        i < categories.length;
        i++
    ) {

        if (
            categories[i].id === categoryId
        ) {

            return categories[i];
        }
    }

    return null;
}


/* ============================================================
   GET ALL CATEGORIES (from cache)
============================================================ */

export function getAllCategories() {

    const MM =
        window.MiniMarket;

    return MM.getCategories() || [];
}


/* ============================================================
   GET CATEGORIES BY STORE (from cache)
============================================================ */

export function getCategoriesByStore(storeId) {

    const all =
        getAllCategories();

    if (!storeId) return all;

    return all.filter(cat =>

        cat.store_id === storeId
    );
}