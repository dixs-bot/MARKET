import {

    state,
    findCart,
    findProd,
    SHIPS,
    PAYS,
    VOUS,
    FREE_SHIP_MIN,
    MAX_CART

} from './utils.js';

import {

    notify,
    patchQty,
    patchBadge,
    renderCart,
    renderShips,
    renderPays,
    renderSummary,
    renderInv,
    renderProds,
    closeCart,
    closeVou,
    animateIn

} from './ui.js';

const MM =
    window.MiniMarket;


/* ============================================================
   STORAGE HELPERS
============================================================ */

function getCurrentStoreId() {

    return (
        localStorage.getItem(
            'lumora_selected_store'
        ) || null
    );
}

function getCartKey() {

    return MM.getCartStorageKey(
        getCurrentStoreId()
    );
}

function getOrderKey() {

    return MM.getOrderStorageKey(
        getCurrentStoreId()
    );
}


/* ============================================================
   STORAGE
============================================================ */

export function load() {

    try {

        const cartRaw =
            localStorage.getItem(
                getCartKey()
            );

        const orderRaw =
            localStorage.getItem(
                getOrderKey()
            );

        state.cart =
            cartRaw
                ? JSON.parse(cartRaw)
                : [];

        state.orders =
            orderRaw
                ? JSON.parse(orderRaw)
                : [];

        if (
            !Array.isArray(state.cart)
        ) {

            state.cart = [];
        }

        if (
            !Array.isArray(state.orders)
        ) {

            state.orders = [];
        }

        reconcileCart({
            silent: true
        });

    } catch (err) {

        console.error(
            'Storage load error:',
            err
        );

        state.cart = [];

        state.orders = [];
    }
}

export function save() {

    try {

        localStorage.setItem(
            getCartKey(),
            JSON.stringify(state.cart)
        );

        localStorage.setItem(
            getOrderKey(),
            JSON.stringify(state.orders)
        );

    } catch (err) {

        console.error(
            'Storage save error:',
            err
        );
    }
}


/* ============================================================
   SUBTOTAL
============================================================ */

export function subTotal() {

    const products =
        MM.getProducts();

    const map = {};

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        map[
            products[i].id
        ] = products[i];
    }

    let total = 0;

    for (
        let j = 0;
        j < state.cart.length;
        j++
    ) {

        const item =
            state.cart[j];

        const live =
            map[item.id];

        const price =
            live
                ? live.price
                : item.price;

        item.price =
            price;

        total +=
            price * item.qty;
    }

    return total;
}


/* ============================================================
   CART CLEANUP
============================================================ */

export function cleanupInvalidCartItems() {

    const products =
        MM.getProducts();

    const map = {};

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        map[
            products[i].id
        ] = products[i];
    }

    let changed =
        false;

    state.cart =
        state.cart.filter(item => {

            const live =
                map[item.id];

            if (!live) {

                changed = true;

                return false;
            }

            if (
                live.stock <= 0
            ) {

                changed = true;

                return false;
            }

            if (
                live.store_id !==
                item.store_id
            ) {

                changed = true;

                return false;
            }

            if (
                item.qty >
                live.stock
            ) {

                item.qty =
                    live.stock;

                changed = true;
            }

            item.price =
                live.price;

            item.image =
                live.image;

            return true;
        });

    if (changed) {

        save();
    }

    return changed;
}


/* ============================================================
   CART RECONCILIATION
============================================================ */

export function cleanupDeletedProducts() {

    const products =
        MM.getProducts();

    const validIds =
        new Set();

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        validIds.add(
            products[i].id
        );
    }

    const before =
        state.cart.length;

    state.cart =
        state.cart.filter(item =>

            validIds.has(item.id)
        );

    const changed =
        before !==
        state.cart.length;

    if (changed) {

        save();
    }

    return changed;
}

export function normalizeCartQty() {

    const products =
        MM.getProducts();

    const map = {};

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

        map[
            products[i].id
        ] = products[i];
    }

    let changed =
        false;

    for (
        let j = 0;
        j < state.cart.length;
        j++
    ) {

        const item =
            state.cart[j];

        const live =
            map[item.id];

        if (!live)
            continue;

        const stock =
            Number(
                live.stock || 0
            );

        if (stock <= 0) {

            item.qty = 0;

            changed = true;

            continue;
        }

        if (
            item.qty > stock
        ) {

            item.qty = stock;

            changed = true;
        }

        item.price =
            live.price;

        item.image =
            live.image;
    }

    state.cart =
        state.cart.filter(item =>

            item.qty > 0
        );

    if (changed) {

        save();
    }

    return changed;
}

export function syncCartWithProducts() {

    const removed =
        cleanupDeletedProducts();

    const normalized =
        normalizeCartQty();

    const cleaned =
        cleanupInvalidCartItems();

    return (

        removed ||

        normalized ||

        cleaned
    );
}

export function reconcileCart(
    options = {}
) {

    try {

        const {

            silent = false

        } = options;

        const changed =
            syncCartWithProducts();

        if (!changed)
            return false;

        if (!silent) {

            renderCart();

            patchBadge();
        }

        return true;

    } catch (err) {

        console.error(
            'Cart reconciliation error:',
            err
        );

        return false;
    }
}


/* ============================================================
   CART
============================================================ */

export function addCart(
    pid,
    delta
) {

    reconcileCart({
        silent: true
    });

    const product =
        findProd(pid);

    if (!product)
        return;

    if (
        product.stock <= 0
    ) {

        notify(
            'Stok habis'
        );

        return;
    }

    if (
        state.cart.length >=
        MAX_CART
    ) {

        notify(
            'Keranjang penuh'
        );

        return;
    }

    if (
        state.cart.length
    ) {

        const cartStoreId =
            state.cart[0]
                .store_id;

        if (
            cartStoreId !==
            product.store_id
        ) {

            notify(
                'Keranjang hanya bisa berisi produk dari cabang yang sama'
            );

            return;
        }
    }

    const found =
        findCart(pid);

    const currentQty =
        found
            ? found.it.qty
            : 0;

    if (
        delta > 0 &&
        currentQty >=
        product.stock
    ) {

        notify(
            'Stok tidak cukup'
        );

        return;
    }

    if (found) {

        found.it.qty += delta;

        found.it.price =
            product.price;

        found.it.image =
            product.image;

        if (
            found.it.qty <= 0
        ) {

            state.cart.splice(
                found.i,
                1
            );
        }

    } else if (delta > 0) {

        state.cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                product.price,

            image:
                product.image,

            qty:
                1,

            stock:
                product.stock,

            store_id:
                product.store_id
        });
    }

    save();

    patchQty(pid, false);

    patchQty(pid, true);

    patchBadge();

    renderCart();
}

export function delCart(pid) {

    const found =
        findCart(pid);

    if (!found)
        return;

    state.cart.splice(
        found.i,
        1
    );

    save();

    renderCart();

    patchQty(pid, false);

    patchBadge();

    if (
        !state.cart.length
    ) {

        closeCart();
    }
}


/* ============================================================
   CHECKOUT STATE
============================================================ */

export function selShip(id) {

    state.co.ship = id;

    renderShips();

    renderSummary();

    validate(false);
}

export function selPay(id) {

    state.co.pay = id;

    renderPays();

    validate(false);
}

export function selVou(vid) {

    let voucher = null;

    for (
        let i = 0;
        i < VOUS.length;
        i++
    ) {

        if (
            VOUS[i].id === vid
        ) {

            voucher =
                VOUS[i];

            break;
        }
    }

    if (

        state.co.vou &&

        state.co.vou.id === vid

    ) {

        state.co.vou = null;

        state.d.vlbl.textContent =
            'Opsional';

    } else {

        state.co.vou =
            voucher;

        if (voucher) {

            state.d.vlbl.textContent =

                voucher.code +

                ' (-' +

                MM.fmt(
                    voucher.disc
                ) +

                ')';
        }
    }

    closeVou();

    renderSummary();
}


/* ============================================================
   VALIDATION
============================================================ */

export function validate(showErr) {

    const nameValid =
        state.d.inname.value
            .trim()
            .length >= 3;

    const phoneValid =

        state.d.inphone.value

            .replace(/\D/g, '')

            .length >= 10;

    const addressValid =
        state.d.inaddr.value
            .trim()
            .length >= 10;

    const shipValid =
        state.co.ship !== '';

    const payValid =
        state.co.pay !== '';

    const cartValid =
        state.cart.length > 0;

    const ok =

        nameValid &&
        phoneValid &&
        addressValid &&
        shipValid &&
        payValid &&
        cartValid;

    state.d.border.disabled =
        !ok;

    state.d.border.classList.toggle(
        'btn-off',
        !ok
    );

    state.d.border.classList.toggle(
        'btn-on',
        ok
    );

    state.d.hint.textContent =
        ok
            ? 'Siap pesan'
            : 'Lengkapi semua data';

    return ok;
}

export function resetCO() {

    state.co.ship = '';

    state.co.pay = '';

    state.co.vou = null;
}


/* ============================================================
   CANCEL ORDER
============================================================ */

export async function cancelOrder(orderId) {

    try {

        const { error } =

            await window.supabaseClient

                .from('orders')

                .update({
                    status:
                        'cancelled'
                })

                .eq(
                    'id',
                    orderId
                );

        if (error) {

            console.error(error);

            return false;
        }

        return true;

    } catch (err) {

        console.error(
            'Cancel order error:',
            err
        );

        return false;
    }
}


/* ============================================================
   PLACE ORDER
============================================================ */

export async function goToInvoice() {

    if (state.isProcessing)
        return;

    if (
        !validate(true)
    )
        return;

    reconcileCart();

    if (!state.cart.length) {

        notify(
            'Keranjang tidak valid'
        );

        return;
    }

    state.isProcessing = true;

    state.d.mconf.classList.add(
        'hidden'
    );

    state.d.mload.classList.remove(
        'hidden'
    );

    try {

        const {

            data: { session }

        } =

        await window.supabaseClient
            .auth
            .getSession();

        if (!session) {

            notify(
                'Silakan login terlebih dahulu'
            );

            window.location.href =
                '/auth.html';

            return;
        }

        const selectedStoreId =
            getCurrentStoreId();

        if (!selectedStoreId) {

            notify(
                'Pilih cabang terlebih dahulu'
            );

            return;
        }

        const storeMap = {};

        for (
            let i = 0;
            i < state.cart.length;
            i++
        ) {

            storeMap[
                state.cart[i]
                    .store_id
            ] = true;
        }

        if (
            Object.keys(storeMap)
                .length > 1
        ) {

            notify(
                'Checkout lintas cabang tidak diperbolehkan'
            );

            return;
        }

        const stockResult =

            await MM.atomicDeductStock(
                state.cart
            );

        if (!stockResult.ok) {

            notify(
                'Stock berubah, silakan cek kembali'
            );

            reconcileCart();

            return;
        }

        let shippingMethod =
            null;

        let paymentMethod =
            null;

        for (
            let i = 0;
            i < SHIPS.length;
            i++
        ) {

            if (
                SHIPS[i].id ===
                state.co.ship
            ) {

                shippingMethod =
                    SHIPS[i];

                break;
            }
        }

        for (
            let j = 0;
            j < PAYS.length;
            j++
        ) {

            if (
                PAYS[j].id ===
                state.co.pay
            ) {

                paymentMethod =
                    PAYS[j];

                break;
            }
        }

        if (
            !shippingMethod ||
            !paymentMethod
        ) {

            notify(
                'Pilih pengiriman & pembayaran'
            );

            return;
        }

        const subtotal =
            subTotal();

        const shippingCost =

            subtotal >=
            FREE_SHIP_MIN

                ? 0
                : shippingMethod.price;

        const discount =

            state.co.vou

                ? state.co.vou.disc
                : 0;

        const total =
            Math.max(
                0,
                subtotal +
                shippingCost -
                discount
            );

        const orderId =

            'ord_' +

            Date.now() +

            '_' +

            Math.random()
                .toString(36)
                .slice(2, 8);

        const order = {

            id:
                orderId,

            store_id:
                selectedStoreId,

            user_id:
                session.user.id,

            customer_name:
                state.d.inname.value
                    .trim(),

            phone:
                state.d.inphone.value
                    .trim(),

            address:
                state.d.inaddr.value
                    .trim(),

            notes:
                state.d.innote.value
                    .trim(),

            items:
                [...state.cart],

            subtotal,

            shipping_cost:
                shippingCost,

            discount,

            total,

            shipping_method:
                shippingMethod.name,

            payment_method:
                paymentMethod.name,

            status:
                'pending',

            created_at:
                new Date().toISOString()
        };

        const validation =
            MM.validateOrder(
                order
            );

        if (!validation.ok) {

            notify(
                'Order tidak valid'
            );

            return;
        }

        const { error } =

            await window.supabaseClient

                .from('orders')

                .insert([order]);

        if (error) {

            console.error(error);

            notify(
                'Gagal menyimpan order'
            );

            return;
        }

        state.curOrder =
            order;

        state.orders.push(order);

        state.cart = [];

        resetCO();

        save();

        renderCart();

        renderProds();

        patchBadge();

        state.d.mload.classList.add(
            'hidden'
        );

        state.d.pgco.classList.add(
            'hidden'
        );

        renderInv();

        state.d.pginv.classList.remove(
            'hidden'
        );

        animateIn(
            state.d.pginv
        );

        state.currentPage =
            'invoice';

    } catch (err) {

        console.error(
            'Checkout error:',
            err
        );

        notify(
            'Terjadi kesalahan checkout'
        );

    } finally {

        state.d.mload.classList.add(
            'hidden'
        );

        state.isProcessing =
            false;
    }
}


/* ============================================================
   CROSS TAB STORAGE SYNC
============================================================ */

window.addEventListener(

    'storage',

    function (event) {

        if (!event.key)
            return;

        const cartKey =
            getCartKey();

        if (
            event.key !==
            cartKey
        ) {

            return;
        }

        try {

            const latest =
                event.newValue
                    ? JSON.parse(
                        event.newValue
                    )
                    : [];

            state.cart =
                Array.isArray(latest)
                    ? latest
                    : [];

            reconcileCart({
                silent: true
            });

            renderCart();

            patchBadge();

        } catch (err) {

            console.error(
                'Cross-tab sync error:',
                err
            );
        }
    }
);
