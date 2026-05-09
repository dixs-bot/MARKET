import { state, findCart, findProd, SHIPS, PAYS, VOUS, FREE_SHIP_MIN, MAX_CART } from './utils.js';
import { notify, patchQty, patchBadge, renderCart, renderShips, renderPays, renderSummary, renderInv, renderProds, closeCart, closeVou, animateIn, lock } from './ui.js';

/* ── storage ── */
export function load() {
    try {
        var c = localStorage.getItem(window.MiniMarket.LS_CART);
        var o = localStorage.getItem(window.MiniMarket.LS_ORDERS);
        state.cart   = c ? JSON.parse(c) : [];
        state.orders = o ? JSON.parse(o) : [];
    } catch (e) {
        console.error('Storage corrupt, reset:', e);
        state.cart = []; state.orders = [];
        try { localStorage.removeItem(window.MiniMarket.LS_CART); localStorage.removeItem(window.MiniMarket.LS_ORDERS); } catch (x) {}
    }
}

export function save() {
    try {
        localStorage.setItem(window.MiniMarket.LS_CART,   JSON.stringify(state.cart));
        localStorage.setItem(window.MiniMarket.LS_ORDERS, JSON.stringify(state.orders));
    } catch (e) { console.error('save() failed:', e); }
}

/* ── subTotal ── */
export function subTotal() {
    var prods   = window.MiniMarket.getProducts();
    var prodMap = {};
    for (var i = 0; i < prods.length; i++) prodMap[prods[i].id] = prods[i];

    var t = 0;
    for (var j = 0; j < state.cart.length; j++) {
        var it   = state.cart[j];
        var live = prodMap[it.id];
        var price = live ? live.price : it.price;
        it.price = price;
        t += price * it.qty;
    }
    return t;
}

/* ── cart mutation ── */
export function addCart(pid, delta) {
    if (state.cart.length >= MAX_CART) { notify('Keranjang penuh (maks ' + MAX_CART + ' item)'); return; }

    var prod = findProd(pid);
    if (!prod) return;

    var f   = findCart(pid);
    var cur = f ? f.it.qty : 0;

    if (delta > 0) {
        if (cur >= prod.stock) { notify('Stok habis'); return; }
    }

    if (f) {
        f.it.qty  += delta;
        f.it.price = prod.price;
        f.it.image = prod.image;
        if (f.it.qty <= 0) state.cart.splice(f.i, 1);
    } else if (delta > 0) {
        state.cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, qty: 1 });
    }

    save();
    patchQty(pid, false);
    patchQty(pid, true);
    if (state.d.csheet.classList.contains('open')) renderCart();
    patchBadge();
}

export function delCart(pid) {
    var f = findCart(pid);
    if (f) state.cart.splice(f.i, 1);
    save(); renderCart(); patchQty(pid, false); patchBadge();
    if (!state.cart.length) closeCart();
}

/* ── checkout state helpers ── */
export function selShip(id) { state.co.ship = id; renderShips(); validate(false); renderSummary(); }
export function selPay(id)  { state.co.pay  = id; renderPays();  validate(false); }

export function selVou(vid) {
    var v = null;
    for (var i = 0; i < VOUS.length; i++) if (VOUS[i].id === vid) { v = VOUS[i]; break; }
    if (state.co.vou && state.co.vou.id === vid) { state.co.vou = null; state.d.vlbl.textContent = 'Opsional'; }
    else { state.co.vou = v; if (v) state.d.vlbl.textContent = v.code + ' (-' + window.MiniMarket.fmt(v.disc) + ')'; }
    closeVou(); renderSummary();
}

export function validate(showErr) {

    var n =
        state.d.inname.value
            .trim()
            .length >= 3;

    var ph =
        state.d.inphone.value
            .replace(/\D/g, '')
            .length >= 10;

    var a =
        state.d.inaddr.value
            .trim()
            .length >= 10;

    var s =
        state.co.ship !== '';

    var p =
        state.co.pay !== '';

    var ok =
        n && ph && a && s && p;

    if (ok) {

        state.d.border.disabled = false;

        state.d.border.classList.remove(
            'btn-off'
        );

        state.d.border.classList.add(
            'btn-on'
        );

        state.d.hint.textContent =
            'Siap pesan';

    } else {

        state.d.border.disabled = true;

        state.d.border.classList.add(
            'btn-off'
        );

        state.d.border.classList.remove(
            'btn-on'
        );

        state.d.hint.textContent =
            'Lengkapi semua data';
    }

    if (showErr === true) {

        state.d.eaddr.classList.toggle(
            'hidden',
            a
        );

        state.d.eship.classList.toggle(
            'hidden',
            s
        );

        state.d.epay.classList.toggle(
            'hidden',
            p
        );

        state.d.inaddr.classList.toggle(
            'err-input',
            !a
        );

        state.d.inname.classList.toggle(
            'err-input',
            !n
        );

        state.d.inphone.classList.toggle(
            'err-input',
            !ph
        );
    }

    return ok;
}
export function resetCO() {
    state.co.ship = '';
    state.co.pay = '';
    state.co.vou = null;
}
export async function cancelOrder(
    orderId
) {

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

/* ── place order ── */
export async function goToInvoice() {
    if (state.isProcessing)      return;
    if (state.d.border.disabled) return;
    state.isProcessing = true;

    state.d.mconf.classList.add('hidden');
    state.d.mload.classList.remove('hidden');
const {

    data: { session }

} = await window.supabaseClient
    .auth
    .getSession();

if (!session) {

    notify(
        'Silakan login terlebih dahulu'
    );

    window.location.href =
        '/auth.html';

    state.isProcessing = false;

    return;
}
  try {

    var sm = null;
    var pm = null;

    for (var i = 0; i < SHIPS.length; i++) {
        if (SHIPS[i].id === state.co.ship) {
            sm = SHIPS[i];
            break;
        }
    }

    for (var j = 0; j < PAYS.length; j++) {
        if (PAYS[j].id === state.co.pay) {
            pm = PAYS[j];
            break;
        }
    }

    if (!sm || !pm) {

        notify('Pilih pengiriman dan pembayaran');

        state.d.mload.classList.add('hidden');

        state.isProcessing = false;

        return;
    }

   var stockResult =
    await window.MiniMarket.atomicDeductStock(
        state.cart
    );

    if (!stockResult.ok) {

        notify(
            'Stok tidak cukup: ' +
            stockResult.errors.join(', ')
        );

        state.d.mload.classList.add('hidden');

        state.d.pgco.classList.remove('hidden');

        renderShips();
        renderPays();
        renderSummary();

        validate(false);

        state.currentPage = 'checkout';

        state.isProcessing = false;

        return;
    }

    var sub = subTotal();

    var autoFree =
        sub >= FREE_SHIP_MIN;

    var baseShip =
        sm.price;

    var finalShip =
        autoFree ? 0 : baseShip;

    var disc = 0;

    if (
        state.co.vou &&
        sub >= state.co.vou.min
    ) {
        disc = state.co.vou.disc;
    }

    var total =
        Math.max(
            0,
            sub + finalShip - disc
        );

    var newOrder = {

        id:
            'ord_' +
            Date.now() +
            '_' +
            Math.random()
                .toString(36)
                .substr(2, 5),

       items:
    state.cart.map(item => ({

        id:
            item.id,

        name:
            item.name,

        qty:
            item.qty,

        price:
            item.price,

        image:
            item.image ||
            '/assets/img/kategori.jpeg'
    })),
        address:
            state.d.inaddr.value.trim(),

        shipping:
            sm,

        payment:
            pm,

        subtotal:
            sub,

        shipPrice:
            finalShip,

        discount:
            disc,

        total:
            total,

        notes:
            state.d.innote.value.trim(),

        status:
            'pending',
      store_id:
    document.getElementById(
        'store-filter'
    )?.value
          
        createdAt:
            Date.now()
    };

    var orderCheck =
        window.MiniMarket.validateOrder(
            newOrder
        );

    if (!orderCheck.ok) {

        console.error(
            '[MiniMarket] order validation failed:',
            orderCheck.reason
        );

        notify(
            'Gagal memproses pesanan (' +
            orderCheck.reason +
            ')'
        );

        state.d.mload.classList.add('hidden');

        state.isProcessing = false;

        return;
    }

    /* 🔥 INSERT ORDER KE SUPABASE */
    const { error } =
        await window.supabaseClient
            .from('orders')
            .insert([
                {
                    id: newOrder.id,
                   
                    user_id:
                      session.user.id,
                     
                    customer_name:
                     state.d.inname.value.trim(),

                     phone:
                       state.d.inphone.value.trim(),
                    address:
                        newOrder.address,

                    items:
                        newOrder.items,

                    subtotal:
                        newOrder.subtotal,

                    shipping_cost:
                        newOrder.shipPrice,

                    discount:
                        newOrder.discount,

                    total:
                        newOrder.total,

                    payment_method:
                        newOrder.payment.name,

                    shipping_method:
                        newOrder.shipping.name,

                    status:
                        'pending'
                }
            ]);

    if (error) {

        console.error(error);

        notify(
            'Gagal menyimpan order'
        );

        state.d.mload.classList.add('hidden');

        state.isProcessing = false;

        return;
    }
    
      state.curOrder = newOrder;
   
      state.orders.push(
        state.curOrder
    );

    state.cart = [];

    resetCO();

    save();

    renderCart();

    renderProds();

    patchBadge();

    state.d.mload.classList.add('hidden');

    state.d.pgco.classList.add('hidden');

    renderInv();

    state.d.pginv.classList.remove('hidden');

    state.d.pginv.scrollTop = 0;

    animateIn(state.d.pginv);

    state.currentPage = 'invoice';

} catch (err) {

    console.error(
        'Order error:',
        err
    );

    state.d.mload.classList.add('hidden');

    notify(
        'Gagal memproses pesanan'
    );

} finally {

    state.isProcessing = false;
}


}
