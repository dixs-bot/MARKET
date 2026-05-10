/* ============================================================
   LUMORA — ORDERS CONTROLLER
   Production-ready multistore order management
============================================================ */

(function () {

'use strict';

if (!window.AdminApp) {
    window.AdminApp = {};
}


/* ============================================================
   SERVICES
============================================================ */

const Svc =
    window.OrdersService;


/* ============================================================
   DOM CACHE
============================================================ */

const DOM = {

    table:
        document.getElementById(
            'orders-table'
        ),

    empty:
        document.getElementById(
            'orders-empty'
        ),

    loading:
        document.getElementById(
            'orders-loading'
        ),

    badge:
        document.getElementById(
            'pending-orders-badge'
        ),

    search:
        document.getElementById(
            'orders-search'
        ),

    filters:
        document.querySelectorAll(
            '[data-order-filter]'
        ),

    detailModal:
        document.getElementById(
            'order-detail-modal'
        ),

    detailContent:
        document.getElementById(
            'order-detail-content'
        ),

    statusModal:
        document.getElementById(
            'status-modal'
        ),

    statusContent:
        document.getElementById(
            'status-options'
        ),

    deleteModal:
        document.getElementById(
            'delete-modal'
        )
};


/* ============================================================
   STATE
============================================================ */

let isRendering =
    false;

let isInitialized =
    false;


/* ============================================================
   HELPERS
============================================================ */

function notify(message) {

    if (
        window.AdminApp?.notify
    ) {

        window.AdminApp.notify(
            message
        );

        return;
    }

    alert(message);
}

function escapeHtml(text) {

    return String(text || '')

        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');
}

function getStatusBadge(status) {

    const cls = {

        pending:
            'bg-yellow-100 text-yellow-700',

        processing:
            'bg-blue-100 text-blue-700',

        shipped:
            'bg-indigo-100 text-indigo-700',

        completed:
            'bg-green-100 text-green-700',

        cancelled:
            'bg-red-100 text-red-700'
    };

    const label =

        Svc.ORDER_STATUS_LABELS[
            status
        ] || status;

    return `

        <span class="
            px-2
            py-1
            rounded-full
            text-xs
            font-semibold
            ${cls[status] || ''}
        ">
            ${label}
        </span>
    `;
}


/* ============================================================
   BADGE
============================================================ */

async function renderBadge() {

    try {

        const count =

            await Svc
                .getPendingOrdersCount();

        if (!DOM.badge)
            return;

        if (count <= 0) {

            DOM.badge.classList.add(
                'hidden'
            );

            return;
        }

        DOM.badge.classList.remove(
            'hidden'
        );

        DOM.badge.textContent =
            count;

    } catch (err) {

        console.error(
            'Render badge error:',
            err
        );
    }
}


/* ============================================================
   TABLE
============================================================ */

function renderOrdersTable() {

    if (
        isRendering
    ) return;

    isRendering = true;

    try {

        const orders =
            Svc.getFilteredOrders();

        if (!orders.length) {

            DOM.table.innerHTML =
                '';

            DOM.empty.classList.remove(
                'hidden'
            );

            return;
        }

        DOM.empty.classList.add(
            'hidden'
        );

        DOM.table.innerHTML =

            orders.map(order => {

                return `

                    <tr class="
                        border-b
                        hover:bg-slate-50
                    ">

                        <td class="
                            px-4
                            py-3
                            font-medium
                        ">
                            #${escapeHtml(order.id)}
                        </td>

                        <td class="
                            px-4
                            py-3
                        ">
                            ${escapeHtml(order.customer)}
                        </td>

                        <td class="
                            px-4
                            py-3
                        ">
                            ${escapeHtml(order.phone)}
                        </td>

                        <td class="
                            px-4
                            py-3
                            font-semibold
                        ">
                            ${Svc.formatRupiah(order.total)}
                        </td>

                        <td class="
                            px-4
                            py-3
                        ">
                            ${getStatusBadge(order.status)}
                        </td>

                        <td class="
                            px-4
                            py-3
                            text-xs
                            text-slate-500
                        ">
                            ${escapeHtml(order.date)}
                        </td>

                        <td class="
                            px-4
                            py-3
                        ">

                            <div class="
                                flex
                                items-center
                                gap-2
                            ">

                                <button
                                    data-view="${order.id}"
                                    class="
                                        px-3
                                        py-1
                                        rounded-lg
                                        bg-slate-100
                                        hover:bg-slate-200
                                        text-xs
                                    "
                                >
                                    Detail
                                </button>

                                <button
                                    data-status="${order.id}"
                                    class="
                                        px-3
                                        py-1
                                        rounded-lg
                                        bg-blue-100
                                        hover:bg-blue-200
                                        text-blue-700
                                        text-xs
                                    "
                                >
                                    Status
                                </button>

                                <button
                                    data-delete="${order.id}"
                                    class="
                                        px-3
                                        py-1
                                        rounded-lg
                                        bg-red-100
                                        hover:bg-red-200
                                        text-red-700
                                        text-xs
                                    "
                                >
                                    Hapus
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            }).join('');

    } finally {

        isRendering = false;
    }
}


/* ============================================================
   FETCH + RENDER
============================================================ */

async function reloadOrders() {

    try {

        DOM.loading?.classList.remove(
            'hidden'
        );

        await Svc.fetchOrders();

        renderOrdersTable();

        await renderBadge();

    } catch (err) {

        console.error(
            'Reload orders error:',
            err
        );

    } finally {

        DOM.loading?.classList.add(
            'hidden'
        );
    }
}


/* ============================================================
   DETAIL MODAL
============================================================ */

function openDetailModal(orderId) {

    const order =
        Svc.getOrder(orderId);

    if (!order)
        return;

    DOM.detailContent.innerHTML = `

        <div class="space-y-4">

            <div>

                <h3 class="
                    text-lg
                    font-bold
                ">
                    Order #${escapeHtml(order.id)}
                </h3>

                <p class="
                    text-sm
                    text-slate-500
                ">
                    ${escapeHtml(order.date)}
                </p>

            </div>

            <div class="
                grid
                grid-cols-2
                gap-3
                text-sm
            ">

                <div>
                    <span class="font-semibold">
                        Customer:
                    </span>

                    ${escapeHtml(order.customer)}
                </div>

                <div>
                    <span class="font-semibold">
                        Phone:
                    </span>

                    ${escapeHtml(order.phone)}
                </div>

                <div class="col-span-2">
                    <span class="font-semibold">
                        Address:
                    </span>

                    ${escapeHtml(order.address)}
                </div>

                <div>
                    <span class="font-semibold">
                        Payment:
                    </span>

                    ${escapeHtml(order.payment_method)}
                </div>

                <div>
                    <span class="font-semibold">
                        Shipping:
                    </span>

                    ${escapeHtml(order.shipping_method)}
                </div>

            </div>

            <div>

                <h4 class="
                    font-semibold
                    mb-2
                ">
                    Produk
                </h4>

                <div class="
                    space-y-2
                ">

                    ${order.products.map(product => `

                        <div class="
                            flex
                            justify-between
                            items-center
                            border
                            rounded-lg
                            p-2
                        ">

                            <div>

                                <div class="
                                    font-medium
                                ">
                                    ${escapeHtml(product.name)}
                                </div>

                                <div class="
                                    text-xs
                                    text-slate-500
                                ">
                                    Qty:
                                    ${product.qty}
                                </div>

                            </div>

                            <div class="
                                font-semibold
                            ">
                                ${Svc.formatRupiah(
                                    product.price
                                )}
                            </div>

                        </div>

                    `).join('')}

                </div>

            </div>

            <div class="
                border-t
                pt-3
                flex
                justify-between
                font-bold
            ">

                <span>Total</span>

                <span>
                    ${Svc.formatRupiah(order.total)}
                </span>

            </div>

        </div>
    `;

    DOM.detailModal?.classList.remove(
        'hidden'
    );
}

function closeDetailModal() {

    DOM.detailModal?.classList.add(
        'hidden'
    );
}


/* ============================================================
   STATUS MODAL
============================================================ */

function openStatusModal(orderId) {

    const order =
        Svc.getOrder(orderId);

    if (!order)
        return;

    Svc.setStatusTarget(orderId);

    const available =
        Svc.getAvailableStatuses(
            order
        );

    if (!available.length) {

        notify(
            'Status sudah final'
        );

        return;
    }

    DOM.statusContent.innerHTML =

        available.map(status => `

            <button
                data-status-option="${status}"
                class="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    border
                    hover:bg-slate-50
                "
            >

                ${
                    Svc.ORDER_STATUS_LABELS[
                        status
                    ]
                }

            </button>

        `).join('');

    DOM.statusModal?.classList.remove(
        'hidden'
    );
}

function closeStatusModal() {

    DOM.statusModal?.classList.add(
        'hidden'
    );

    Svc.clearStatusTarget();
}


/* ============================================================
   DELETE MODAL
============================================================ */

function openDeleteModal(orderId) {

    Svc.setDeleteTarget(
        orderId
    );

    DOM.deleteModal?.classList.remove(
        'hidden'
    );
}

function closeDeleteModal() {

    DOM.deleteModal?.classList.add(
        'hidden'
    );

    Svc.clearDeleteTarget();
}


/* ============================================================
   ACTIONS
============================================================ */

async function handleDeleteConfirm() {

    const orderId =
        Svc.getDeleteTarget();

    if (!orderId)
        return;

    const success =
        await Svc.deleteOrder(
            orderId
        );

    if (!success) {

        notify(
            'Gagal menghapus order'
        );

        return;
    }

    closeDeleteModal();

    renderOrdersTable();

    await renderBadge();

    notify(
        'Order berhasil dihapus'
    );
}

async function handleStatusUpdate(
    newStatus
) {

    const orderId =
        Svc.getStatusTarget();

    if (!orderId)
        return;

    const result =

        await Svc.updateStatus(

            orderId,

            newStatus
        );

    if (!result.success) {

        notify(
            'Gagal update status'
        );

        return;
    }

    closeStatusModal();

    renderOrdersTable();

    await renderBadge();

    notify(

        `Status diubah ke ${result.newLabel}`
    );
}


/* ============================================================
   FILTERS
============================================================ */

function initFilters() {

    DOM.filters.forEach(button => {

        button.addEventListener(

            'click',

            function () {

                DOM.filters.forEach(btn => {

                    btn.classList.remove(
                        'bg-blue-600',
                        'text-white'
                    );
                });

                this.classList.add(
                    'bg-blue-600',
                    'text-white'
                );

                Svc.setFilter(
                    this.dataset.orderFilter
                );

                renderOrdersTable();
            }
        );
    });

    DOM.search?.addEventListener(

        'input',

        function () {

            Svc.setSearch(
                this.value
            );

            renderOrdersTable();
        }
    );
}


/* ============================================================
   EVENTS
============================================================ */

function initEvents() {

    document.addEventListener(

        'click',

        async function (e) {

            const viewBtn =
                e.target.closest(
                    '[data-view]'
                );

            if (viewBtn) {

                openDetailModal(
                    viewBtn.dataset.view
                );

                return;
            }

            const statusBtn =
                e.target.closest(
                    '[data-status]'
                );

            if (statusBtn) {

                openStatusModal(
                    statusBtn.dataset.status
                );

                return;
            }

            const deleteBtn =
                e.target.closest(
                    '[data-delete]'
                );

            if (deleteBtn) {

                openDeleteModal(
                    deleteBtn.dataset.delete
                );

                return;
            }

            const statusOption =
                e.target.closest(
                    '[data-status-option]'
                );

            if (statusOption) {

                await handleStatusUpdate(

                    statusOption.dataset
                        .statusOption
                );

                return;
            }

            if (
                e.target.closest(
                    '[data-close-detail]'
                )
            ) {

                closeDetailModal();

                return;
            }

            if (
                e.target.closest(
                    '[data-close-status]'
                )
            ) {

                closeStatusModal();

                return;
            }

            if (
                e.target.closest(
                    '[data-close-delete]'
                )
            ) {

                closeDeleteModal();

                return;
            }

            if (
                e.target.closest(
                    '[data-confirm-delete]'
                )
            ) {

                await handleDeleteConfirm();

                return;
            }
        }
    );
}


/* ============================================================
   REALTIME
============================================================ */

async function initRealtime() {

    await Svc.subscribeRealtime(

        async payload => {

            renderOrdersTable();

            await renderBadge();

            if (
                payload.type ===
                'INSERT'
            ) {

                notify(
                    'Pesanan baru masuk'
                );
            }
        }
    );
}


/* ============================================================
   INIT
============================================================ */

async function init() {

    if (isInitialized)
        return;

    isInitialized = true;

    initFilters();

    initEvents();

    await reloadOrders();

    await initRealtime();
}


/* ============================================================
   AUTO INIT
============================================================ */

document.addEventListener(

    'DOMContentLoaded',

    init
);

})();
