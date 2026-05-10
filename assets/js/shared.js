(function () {

'use strict';

/* ============================================================
   STORAGE
============================================================ */

const LS_PRODUCTS =
    'mm_products_customer';

const LS_CART =
    'mc3';

const LS_ORDERS =
    'mo3';

const LS_CATEGORIES =
    'mm_categories_customer';


/* ============================================================
   FALLBACK
============================================================ */

const FALLBACK_IMG =
    '/assets/img/kategori.jpeg';

const FALLBACK_CAT_IMG =
    '/assets/img/kategori.jpeg';


/* ============================================================
   HELPERS
============================================================ */

function fmt(n) {

    return (
        'Rp ' +
        (n || 0).toLocaleString('id-ID')
    );
}

function safeParse(
    str,
    fallback
) {

    try {

        const parsed =
            JSON.parse(str);

        return Array.isArray(parsed)
            ? parsed
            : fallback;

    } catch {

        return fallback;
    }
}

function getCurrentStoreId() {

    return (
        window.AdminSession?.store_id ||
        null
    );
}

function isAdminCabang() {

    return (
        window.AdminSession?.role ===
        'admin'
    );
}

function isSuperAdmin() {

    return (
        window.AdminSession?.role ===
        'super_admin'
    );
}


/* ============================================================
   PRODUCTS
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
   CATEGORIES
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
   ORDERS
============================================================ */

function loadOrders() {

    try {

        const raw =
            localStorage.getItem(
                LS_ORDERS
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
   STOCK
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
   REALTIME
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

    /* PRODUCTS */

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

    /* CATEGORIES */

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
   EXPORT
============================================================ */

window.MiniMarket = {

    /* storage */
    LS_PRODUCTS,
    LS_CART,
    LS_ORDERS,
    LS_CATEGORIES,

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

})();
