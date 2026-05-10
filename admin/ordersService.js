/* ============================================================
   LUMORA — ORDERS SERVICE
   Production-ready multistore order engine
============================================================ */

(function () {

'use strict';

if (!window.AdminApp) {
    window.AdminApp = {};
}


/* ============================================================
   CONSTANTS
============================================================ */

const ORDER_STATUS =
    window.ORDER_STATUS;

const ORDER_STATUS_LIST =
    window.ORDER_STATUS_LIST;

const ORDER_STATUS_LABELS =
    window.ORDER_STATUS_LABELS;

const ORDER_STATUS_FLOW =
    window.ORDER_STATUS_FLOW;


/* ============================================================
   INTERNAL STATE
============================================================ */

let orders = [];

let currentFilter =
    'all';

let searchQuery =
    '';

let deleteTargetId =
    null;

let statusTargetId =
    null;

let realtimeChannel =
    null;


/* ============================================================
   HELPERS
============================================================ */

function getCurrentStoreId() {

    return (
        window.AdminSession?.store_id ||
        null
    );
}

function isSuperAdmin() {

    return (
        window.AdminSession?.role ===
        'super_admin'
    );
}

function formatRupiah(amount) {

    return (

        'Rp ' +

        Number(amount || 0)
            .toLocaleString('id-ID')
    );
}


/* ============================================================
   ORDER MAPPERS
============================================================ */

function normalizeOrder(order) {

    if (!order)
        return null;

    return {

        id:
            order.id,

        user_id:
            order.user_id || null,

        store_id:
            order.store_id || null,

        customer:
            order.customer_name || '-',

        phone:
            order.phone || '-',

        address:
            order.address || '-',

        status:
            order.status ||
            ORDER_STATUS.PENDING,

        subtotal:
            Number(order.subtotal || 0),

        shipping_cost:
            Number(
                order.shipping_cost || 0
            ),

        discount:
            Number(order.discount || 0),

        total:
            Number(order.total || 0),

        payment_method:
            order.payment_method || '-',

        shipping_method:
            order.shipping_method || '-',

        notes:
            order.notes || '',

        created_at:
            order.created_at,

        date:
            order.created_at
                ? new Date(
                    order.created_at
                  ).toLocaleString(
                    'id-ID'
                  )
                : '-',

        products:
            Array.isArray(order.items)
                ? order.items
                : []
    };
}


/* ============================================================
   FILTERING
============================================================ */

function setFilter(filter) {

    currentFilter =
        filter || 'all';
}

function getFilter() {

    return currentFilter;
}

function setSearch(query) {

    searchQuery =
        String(query || '')
            .trim()
            .toLowerCase();
}

function getSearch() {

    return searchQuery;
}

function getFilteredOrders() {

    return orders.filter(order => {

        const matchFilter =

            currentFilter === 'all' ||

            order.status ===
            currentFilter;

        if (!matchFilter)
            return false;

        if (!searchQuery)
            return true;

        return (

            String(order.id)
                .toLowerCase()
                .includes(searchQuery)

            ||

            String(order.customer)
                .toLowerCase()
                .includes(searchQuery)

            ||

            String(order.phone)
                .toLowerCase()
                .includes(searchQuery)
        );
    });
}


/* ============================================================
   GETTERS
============================================================ */

function getOrders() {

    return orders;
}

function getOrder(id) {

    return (

        orders.find(order =>

            String(order.id) ===
            String(id)

        ) || null
    );
}

function getOrderTotal(order) {

    if (
        !order ||
        !Array.isArray(order.products)
    ) {

        return 0;
    }

    return order.products.reduce(

        (sum, product) => {

            return (

                sum +

                (
                    Number(product.price || 0) *

                    Number(product.qty || 0)
                )
            );

        },

        0
    );
}

function getTotalItemCount(order) {

    if (
        !order ||
        !Array.isArray(order.products)
    ) {

        return 0;
    }

    return order.products.reduce(

        (sum, product) => {

            return (
                sum +
                Number(product.qty || 0)
            );

        },

        0
    );
}

function getAvailableStatuses(order) {

    if (!order)
        return [];

    const currentIndex =

        ORDER_STATUS_LIST.indexOf(
            order.status
        );

    return ORDER_STATUS_LIST

        .slice(currentIndex + 1)

        .filter(status =>

            status !==
            ORDER_STATUS.CANCELLED
        );
}


/* ============================================================
   TARGET STATES
============================================================ */

function setDeleteTarget(id) {

    deleteTargetId =
        id;
}

function getDeleteTarget() {

    return deleteTargetId;
}

function clearDeleteTarget() {

    deleteTargetId =
        null;
}

function setStatusTarget(id) {

    statusTargetId =
        id;
}

function getStatusTarget() {

    return statusTargetId;
}

function clearStatusTarget() {

    statusTargetId =
        null;
}


/* ============================================================
   FETCH ORDERS
============================================================ */

async function fetchOrders() {

    try {

        let query =

            window.supabaseClient

                .from('orders')

                .select('*')

                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );

        const storeId =
            getCurrentStoreId();

        if (
            !isSuperAdmin() &&
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

        orders =

            (data || [])

                .map(normalizeOrder)

                .filter(order => order);

        return orders;

    } catch (err) {

        console.error(
            'Fetch orders error:',
            err
        );

        return [];
    }
}


/* ============================================================
   DELETE ORDER
============================================================ */

async function deleteOrder(orderId) {

    try {

        let query =

            window.supabaseClient

                .from('orders')

                .delete()

                .eq(
                    'id',
                    orderId
                );

        const storeId =
            getCurrentStoreId();

        if (
            !isSuperAdmin() &&
            storeId
        ) {

            query = query.eq(
                'store_id',
                storeId
            );
        }

        const { error } =
            await query;

        if (error) {

            console.error(error);

            return false;
        }

        orders = orders.filter(order =>

            String(order.id) !==
            String(orderId)
        );

        return true;

    } catch (err) {

        console.error(
            'Delete order error:',
            err
        );

        return false;
    }
}


/* ============================================================
   UPDATE STATUS
============================================================ */

async function updateStatus(
    orderId,
    newStatus
) {

    try {

        const order =
            getOrder(orderId);

        if (!order) {

            return {
                success: false
            };
        }

        let query =

            window.supabaseClient

                .from('orders')

                .update({
                    status:
                        newStatus
                })

                .eq(
                    'id',
                    orderId
                );

        const storeId =
            getCurrentStoreId();

        if (
            !isSuperAdmin() &&
            storeId
        ) {

            query = query.eq(
                'store_id',
                storeId
            );
        }

        const { error } =
            await query;

        if (error) {

            console.error(error);

            return {
                success: false
            };
        }

        const oldLabel =

            ORDER_STATUS_LABELS[
                order.status
            ];

        order.status =
            newStatus;

        return {

            success: true,

            oldLabel,

            newLabel:

                ORDER_STATUS_LABELS[
                    newStatus
                ]
        };

    } catch (err) {

        console.error(
            'Update status error:',
            err
        );

        return {
            success: false
        };
    }
}


/* ============================================================
   BADGE
============================================================ */

async function getPendingOrdersCount() {

    try {

        let query =

            window.supabaseClient

                .from('orders')

                .select('*', {

                    count: 'exact',

                    head: true
                })

                .eq(
                    'status',
                    ORDER_STATUS.PENDING
                );

        const storeId =
            getCurrentStoreId();

        if (
            !isSuperAdmin() &&
            storeId
        ) {

            query = query.eq(
                'store_id',
                storeId
            );
        }

        const {
            count,
            error
        } = await query;

        if (error) {

            console.error(error);

            return 0;
        }

        return count || 0;

    } catch (err) {

        console.error(
            'Badge count error:',
            err
        );

        return 0;
    }
}


/* ============================================================
   REALTIME
============================================================ */

async function subscribeRealtime(callback) {

    try {

        if (realtimeChannel) {

            await window.supabaseClient

                .removeChannel(
                    realtimeChannel
                );
        }

        const storeId =
            getCurrentStoreId();

        let filter = '';

        if (
            !isSuperAdmin() &&
            storeId
        ) {

            filter =
                `store_id=eq.${storeId}`;
        }

        realtimeChannel =

            window.supabaseClient

                .channel(

                    `orders-realtime-${
                        storeId || 'global'
                    }`
                );

        realtimeChannel.on(

            'postgres_changes',

            {

                event: '*',

                schema: 'public',

                table: 'orders',

                filter
            },

            async payload => {

                console.log(
                    'Realtime order:',
                    payload.eventType
                );

                await fetchOrders();

                if (
                    typeof callback ===
                    'function'
                ) {

                    callback({

                        type:
                            payload.eventType,

                        orders:
                            getFilteredOrders()
                    });
                }
            }
        );

        realtimeChannel.subscribe();

    } catch (err) {

        console.error(
            'Realtime subscribe error:',
            err
        );
    }
}


/* ============================================================
   CLEANUP
============================================================ */

async function destroyRealtime() {

    try {

        if (!realtimeChannel)
            return;

        await window.supabaseClient

            .removeChannel(
                realtimeChannel
            );

        realtimeChannel =
            null;

    } catch (err) {

        console.error(
            'Destroy realtime error:',
            err
        );
    }
}


/* ============================================================
   PUBLIC API
============================================================ */

window.OrdersService = {

    /* constants */
    ORDER_STATUS,
    ORDER_STATUS_LIST,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_FLOW,

    /* filters */
    setFilter,
    getFilter,
    setSearch,
    getSearch,
    getFilteredOrders,

    /* getters */
    getOrders,
    getOrder,
    getOrderTotal,
    getTotalItemCount,
    getAvailableStatuses,

    /* targets */
    setDeleteTarget,
    getDeleteTarget,
    clearDeleteTarget,
    setStatusTarget,
    getStatusTarget,
    clearStatusTarget,

    /* database */
    fetchOrders,
    deleteOrder,
    updateStatus,
    getPendingOrdersCount,

    /* realtime */
    subscribeRealtime,
    destroyRealtime,

    /* utils */
    formatRupiah
};

})();
