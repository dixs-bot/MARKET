```js
/**
 * ============================================
 * LUMORA — MARKET CORE
 * ============================================
 *
 * Objek MiniMarket global:
 * - Cache produk & kategori
 * - Getter & sync dari Supabase
 * - Storage key generators
 * - Atomic stock deduction
 * - Order validation
 * - Format currency (wrapper)
 * - Realtime subscription
 */

import { safeParse } from './storage.js';

import { fmt } from './formatter.js';

import {
    FALLBACK_IMG,
    FALLBACK_CAT_IMG,
    getCurrentStoreId,
    isAdminCabang
} from './helpers.js';


/* ============================================================
   STORAGE KEYS
============================================================ */

const LS_PRODUCTS =
    'mm_products_customer';

const LS_CATEGORIES =
    'mm_categories_customer';


/* ============================================================
   MULTISTORE STORAGE HELPERS
============================================================ */

function getCartStorageKey(storeId) {

    return (
        'lumora_cart_' +
        String(storeId || 'global')
    );
}

function getOrderStorageKey(storeId) {

    return (
        'lumora_orders_' +
        String(storeId || 'global')
    );
}

function getSelectedCustomerStoreId() {

    try {

        return (
            localStorage.getItem(
                'lumora_selected_store'
            ) || null
        );

    } catch {

        return null;
    }
}
```

/* ============================================================
   PRODUCTS — NORMALIZE
============================================================ */

function normalizeProduct(p) {

    if (
        !p ||
        typeof p !== 'object'
    ) return null;

    if (!p.id)
        return null;

    return {

        id:
            String(p.id),

        name:
            String(
                p.name || ''
            ).trim(),

        price:
            Math.max(
                0,
                Number(p.price) || 0
            ),

        category:
            String(
                p.category ||
                p.cat ||
                ''
            ),

        stock:
            Math.max(
                0,
                Number(p.stock) || 0
            ),

        image:
            String(
                p.image ||
                p.img ||
                FALLBACK_IMG
            ),

        store_id:
            p.store_id || null
    };
}


/* ============================================================
   PRODUCTS — GET
============================================================ */

function getProducts() {

    const raw =
        localStorage.getItem(
            LS_PRODUCTS
        );

    const data =
        safeParse(raw, []);

    return data
        .map(normalizeProduct)
        .filter(p => p);
}


/* ============================================================
   PRODUCTS — SAVE
============================================================ */

function saveProducts(products) {

    if (!Array.isArray(products))
        return false;

    const map = {};

    const clean = [];

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        const p =
            normalizeProduct(
                products[i]
            );

        if (!p)
            continue;

        if (map[p.id])
            continue;

        map[p.id] = true;

        clean.push(p);
    }

    try {

        localStorage.setItem(
            LS_PRODUCTS,
            JSON.stringify(clean)
        );

        window.dispatchEvent(
            new Event(
                'productsUpdated'
            )
        );

        return true;

    } catch {

        return false;
    }
}


/* ============================================================
   PRODUCTS — SYNC FROM SUPABASE
============================================================ */

async function syncProductsFromSupabase() {

    try {

        let query =
            window.supabaseClient
                .from('products')
                .select('*');

        const storeId =
            getCurrentStoreId();

        if (
            isAdminCabang() &&
            storeId
        ) {

            query = query.eq(
                'store_id',
                storeId
            );
        }

        const {
            data,
            error
        } = await query;

        if (error) {

            console.error(error);

            return [];
        }

        localStorage.setItem(
            LS_PRODUCTS,
            JSON.stringify(data || [])
        );

        window.dispatchEvent(
            new Event(
                'productsUpdated'
            )
        );

        return data || [];

    } catch (err) {

        console.error(
            'Sync products error:',
            err
        );

        return [];
    }
}


/* ============================================================
   CATEGORIES — NORMALIZE
============================================================ */

function normalizeCategory(c) {

    if (
        !c ||
        typeof c !== 'object'
    ) return null;

    if (!c.id)
        return null;

    const name =
        String(
            c.name || ''
        ).trim();

    if (!name)
        return null;

    return {

        id:
            String(c.id),

        name:
            name,

        image:
            String(
                c.image ||
                FALLBACK_CAT_IMG
            ),

        store_id:
            c.store_id || null
    };
}


/* ============================================================
   CATEGORIES — GET
============================================================ */

function getCategories() {

    const raw =
        localStorage.getItem(
            LS_CATEGORIES
        );

    const data =
        safeParse(raw, []);

    return data
        .map(normalizeCategory)
        .filter(c => c);
}


/* ============================================================
   CATEGORIES — SAVE
============================================================ */

function saveCategories(categories) {

    if (!Array.isArray(categories))
        return false;

    const map = {};

    const clean = [];

    for (
        let i = 0;
        i < categories.length;
        i++
    ) {

        const c =
            normalizeCategory(
                categories[i]
            );

        if (!c)
            continue;

        if (map[c.id])
            continue;

        map[c.id] = true;

        clean.push(c);
    }

    try {

        localStorage.setItem(
            LS_CATEGORIES,
            JSON.stringify(clean)
        );

        window.dispatchEvent(
            new Event(
                'categoriesUpdated'
            )
        );

        return true;

    } catch {

        return false;
    }
}


/* ============================================================
   CATEGORIES — SYNC FROM SUPABASE
============================================================ */

async function syncCategoriesFromSupabase() {

    try {

        let query =
            window.supabaseClient
                .from('categories')
                .select('*');

        const storeId =
            getCurrentStoreId();

        if (
            isAdminCabang() &&
            storeId
        ) {

            query = query.eq(
                'store_id',
                storeId
            );
        }

        const {
            data,
            error
        } = await query;

        if (error) {

            console.error(error);

            return [];
        }

        localStorage.setItem(
            LS_CATEGORIES,
            JSON.stringify(data || [])
        );

        window.dispatchEvent(
            new Event(
                'categoriesUpdated'
            )
        );

        return data || [];

    } catch (err) {

        console.error(
            'Sync categories error:',
            err
        );

        return [];
    }
}


/* ============================================================
   CATEGORIES — EDIT
============================================================ */

function editCategory(
    id,
    newName,
    newImage
) {

    if (!id)
        return false;

    const cats =
        getCategories();

    let target =
        null;

    for (
        let i = 0;
        i < cats.length;
        i++
    ) {

        if (
            cats[i].id === id
        ) {

            target =
                cats[i];

            break;
        }
    }

    if (!target)
        return false;

    if (
        typeof newName ===
        'string'
    ) {

        const trimmed =
            newName.trim();

        if (!trimmed)
            return false;

        target.name =
            trimmed;
    }

    if (
        typeof newImage ===
        'string'
    ) {

        const trimmed =
            newImage.trim();

        if (trimmed)
            target.image =
                trimmed;
    }

    return saveCategories(cats);
}


/* ============================================================
   CATEGORIES — DELETE
============================================================ */

function deleteCategory(id) {

    if (!id)
        return false;

    const cats =
        getCategories();

    const exists =
        cats.some(
            c => c.id === id
        );

    if (!exists)
        return false;

    const prods =
        getProducts();

    let changed =
        false;

    for (
        let i = 0;
        i < prods.length;
        i++
    ) {

        if (
            prods[i].category ===
            id
        ) {

            prods[i].category =
                '';

            changed = true;
        }
    }

    if (changed)
        saveProducts(prods);

    const updated =
        cats.filter(
            c => c.id !== id
        );

    return saveCategories(updated);
}


/* ============================================================
   CATEGORIES — REORDER
============================================================ */

function reorderCategories(newOrder) {

    if (
        !Array.isArray(
            newOrder
        )
    ) return false;

    const cats =
        getCategories();

    const map = {};

    for (
        let i = 0;
        i < cats.length;
        i++
    ) {

        map[
            cats[i].id
        ] = cats[i];
    }

    const ordered = [];

    for (
        let i = 0;
        i < newOrder.length;
        i++
    ) {

        const id =
            newOrder[i];

        if (map[id]) {

            ordered.push(
                map[id]
            );

            delete map[id];
        }
    }

    for (let key in map) {

        if (
            map.hasOwnProperty(
                key
            )
        ) {

            ordered.push(
                map[key]
            );
        }
    }

    return saveCategories(
        ordered
    );
}


/* ============================================================
   ORDERS — LOAD
============================================================ */

function loadOrders() {

    try {

        const storeId =

            getSelectedCustomerStoreId() ||

            getCurrentStoreId() ||

            'global';

        const raw =
            localStorage.getItem(
                getOrderStorageKey(
                    storeId
                )
            );

        const data =
            raw
                ? JSON.parse(raw)
                : [];

        return Array.isArray(data)
            ? data
            : [];

    } catch {

        return [];
    }
}


/* ============================================================
   STOCK — ATOMIC DEDUCT
============================================================ */

async function atomicDeductStock(cart) {

    try {

        const prods =
            getProducts();

        const map = {};

        for (
            let i = 0;
            i < prods.length;
            i++
        ) {

            map[
                prods[i].id
            ] = prods[i];
        }

        const errors = [];

        for (
            let i = 0;
            i < cart.length;
            i++
        ) {

            const it =
                cart[i];

            const p =
                map[it.id];

            if (!p) {

                errors.push(
                    it.name
                );

                continue;
            }

            if (
                p.stock < it.qty
            ) {

                errors.push(
                    it.name
                );
            }
        }

        if (errors.length) {

            return {
                ok: false,
                errors
            };
        }

        for (
            let i = 0;
            i < cart.length;
            i++
        ) {

            const it =
                cart[i];

            const p =
                map[it.id];

            const newStock =
                p.stock - it.qty;

            p.stock =
                newStock;

            it.price =
                p.price;

            it.image =
                p.image;

            const { error } =
                await window
                    .supabaseClient
                    .from('products')
                    .update({
                        stock:
                            newStock
                    })
                    .eq(
                        'id',
                        p.id
                    );

            if (error) {

                console.error(
                    error
                );

                return {
                    ok: false,
                    errors: [
                        'Gagal update stock realtime'
                    ]
                };
            }
        }

        saveProducts(prods);

        return {
            ok: true
        };

    } catch (err) {

        console.error(err);

        return {
            ok: false,
            errors: [
                'Terjadi kesalahan stock'
            ]
        };
    }
}


/* ============================================================
   VALIDATE ORDER
============================================================ */

function validateOrder(o) {

    if (!o)
        return {
            ok: false,
            reason: 'empty order'
        };

    if (
        !o.items ||
        !o.items.length
    )
        return {
            ok: false,
            reason: 'no items'
        };

    if (!o.address)
        return {
            ok: false,
            reason: 'no address'
        };

    if (!o.total)
        return {
            ok: false,
            reason: 'invalid total'
        };

    return {
        ok: true
    };
}


/* ============================================================
   REALTIME SYNC
   Otomatis sync produk & kategori saat ada
   perubahan di Supabase
============================================================ */

(function initRealtimeSync() {

    const storeId =
        getCurrentStoreId();

    let productFilter = '';

    let categoryFilter = '';

    if (
        isAdminCabang() &&
        storeId
    ) {

        productFilter =
            `store_id=eq.${storeId}`;

        categoryFilter =
            `store_id=eq.${storeId}`;
    }

    /* =========================
       PRODUCTS CHANNEL
    ========================= */

    window.supabaseClient

        .channel(
            `products-realtime-${storeId || 'global'}`
        )

        .on(

            'postgres_changes',

            {
                event: '*',

                schema: 'public',

                table: 'products',

                filter:
                    productFilter
            },

            async () => {

                console.log(
                    'Realtime products update'
                );

                await syncProductsFromSupabase();
            }
        )

        .subscribe();

    /* =========================
       CATEGORIES CHANNEL
    ========================= */

    window.supabaseClient

        .channel(
            `categories-realtime-${storeId || 'global'}`
        )

        .on(

            'postgres_changes',

            {
                event: '*',

                schema: 'public',

                table: 'categories',

                filter:
                    categoryFilter
            },

            async () => {

                console.log(
                    'Realtime categories update'
                );

                await syncCategoriesFromSupabase();
            }
        )

        .subscribe();

})();


/* ============================================================
   ATTACH TO WINDOW
============================================================ */

window.MiniMarket = {

    /* storage keys */
    LS_PRODUCTS,
    LS_CATEGORIES,

    /* storage helpers */
    getCartStorageKey,
    getOrderStorageKey,
    getSelectedCustomerStoreId,

    /* utils */
    fmt,
    FALLBACK_IMG,
    FALLBACK_CAT_IMG,

    /* products */
    getProducts,
    saveProducts,
    normalizeProduct,
    syncProductsFromSupabase,

    /* categories */
    normalizeCategory,
    getCategories,
    saveCategories,
    editCategory,
    deleteCategory,
    reorderCategories,
    syncCategoriesFromSupabase,

    /* orders */
    loadOrders,

    /* advanced */
    atomicDeductStock,
    validateOrder
};


export default window.MiniMarket;
