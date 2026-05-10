/* ==============================================
   MINIMARKET ADMIN — ORDERS SERVICE MODULE
   Data layer: state, CRUD, filtering, Supabase
   ============================================== */

import {
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_FLOW
} from '../constants/orderStatus.js';

const OrdersService = (() => {

  /* ------------------------------------------
     APPLICATION STATE
     ------------------------------------------ */

  let orders = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let deleteTargetId = null;
  let statusTargetId = null;

  /* ------------------------------------------
     UTILITIES
     ------------------------------------------ */

  function formatRupiah(n) {

    return 'Rp ' + Number(n || 0)
      .toLocaleString('id-ID');
  }

  function getOrderTotal(order) {

    if (!order || !Array.isArray(order.products)) {
      return 0;
    }

    return order.products.reduce(

      (sum, product) => {

        return sum +
          (
            Number(product.price || 0) *
            Number(product.qty || 0)
          );
      },

      0
    );
  }

  function getTotalItemCount(order) {

    if (!order || !Array.isArray(order.products)) {
      return 0;
    }

    return order.products.reduce(

      (sum, product) => {

        return sum +
          Number(product.qty || 0);
      },

      0
    );
  }

  function getOrder(id) {

    return orders.find(
      o => o.id === id
    ) || null;
  }

  function getAvailableStatuses(order) {

    if (!order) return [];

    const currentIdx =
      ORDER_STATUS_LIST.indexOf(
        order.status
      );

    return ORDER_STATUS_LIST
      .slice(currentIdx + 1)
      .filter(
        s => s !== ORDER_STATUS.CANCELLED
      );
  }

  /* ------------------------------------------
     FILTERING & SEARCH
     ------------------------------------------ */

  function setFilter(filter) {

    currentFilter = filter;
  }

  function getFilter() {

    return currentFilter;
  }

  function setSearch(query) {

    searchQuery = query;
  }

  function getSearch() {

    return searchQuery;
  }

  function getFilteredOrders() {

    return orders.filter(order => {

      const matchFilter =

        currentFilter === 'all' ||

        order.status === currentFilter;

      const q =
        searchQuery.toLowerCase();

      const matchSearch =

        !q ||

        order.id.toLowerCase()
          .includes(q) ||

        order.customer.toLowerCase()
          .includes(q) ||

        order.email.toLowerCase()
          .includes(q);

      return (
        matchFilter &&
        matchSearch
      );
    });
  }

  /* ------------------------------------------
     CRUD OPERATIONS
     ------------------------------------------ */

  async function deleteOrder(id) {

    try {

      const storeId =
        window.AdminSession?.store_id;

      if (!storeId) {

        console.error(
          'Store ID tidak ditemukan'
        );

        return false;
      }

      const { error } =

        await window.supabaseClient

          .from('orders')

          .delete()

          .eq('id', id)

          .eq('store_id', storeId);

      if (error) {

        console.error(error);

        return false;
      }

      const idx =
        orders.findIndex(
          o => o.id === id
        );

      if (idx !== -1) {

        orders.splice(idx, 1);
      }

      return true;

    } catch (err) {

      console.error(
        'Delete order error:',
        err
      );

      return false;
    }
  }

  function updateStatus(id, newStatus) {

    const order = getOrder(id);

    if (!order) {

      return {
        success: false
      };
    }

    const oldLabel =
      ORDER_STATUS_LABELS[
        order.status
      ];

    order.status = newStatus;

    return {

      success: true,

      oldLabel,

      newLabel:
        ORDER_STATUS_LABELS[
          newStatus
        ]
    };
  }

  /* ------------------------------------------
     DELETE TARGET STATE
     ------------------------------------------ */

  function setDeleteTarget(id) {

    deleteTargetId = id;
  }

  function getDeleteTarget() {

    return deleteTargetId;
  }

  function clearDeleteTarget() {

    deleteTargetId = null;
  }

  /* ------------------------------------------
     STATUS TARGET STATE
     ------------------------------------------ */

  function setStatusTarget(id) {

    statusTargetId = id;
  }

  function getStatusTarget() {

    return statusTargetId;
  }

  function clearStatusTarget() {

    statusTargetId = null;
  }

  /* ------------------------------------------
     SUPABASE OPERATIONS
     ------------------------------------------ */

  async function fetchOrders() {

    try {

      const storeId =
        window.AdminSession?.store_id;

      if (!storeId) {

        console.error(
          'Store ID tidak ditemukan'
        );

        return [];
      }

      const { data, error } =

        await window.supabaseClient

          .from('orders')

          .select('*')

          .eq(
            'store_id',
            storeId
          )

          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {

        console.error(error);

        return [];
      }

      orders = (data || []).map(order => {

        return {

          id: order.id,

          customer:
            order.customer_name || '-',

          email: '-',

          phone:
            order.phone || '-',

          address:
            order.address || '-',

          status:
            order.status ||
            ORDER_STATUS.PENDING,

          date:
            new Date(
              order.created_at
            ).toLocaleString('id-ID'),

          products:
            Array.isArray(order.items)
              ? order.items
              : []
        };
      });

      return orders;

    } catch (err) {

      console.error(
        'Fetch orders error:',
        err
      );

      return [];
    }
  }

  async function deleteOrderFromSupabase(id) {

    return Promise.resolve(
      deleteOrder(id)
    );
  }

  async function updateOrderStatusInSupabase(
    id,
    status
  ) {

    try {

      const storeId =
        window.AdminSession?.store_id;

      if (!storeId) {

        console.error(
          'Store ID tidak ditemukan'
        );

        return false;
      }

      const { error } =

        await window.supabaseClient

          .from('orders')

          .update({
            status
          })

          .eq('id', id)

          .eq(
            'store_id',
            storeId
          );

      if (error) {

        console.error(error);

        return false;
      }

      const result =
        updateStatus(id, status);

      return result.success;

    } catch (err) {

      console.error(
        'Update status error:',
        err
      );

      return false;
    }
  }

  async function subscribeRealtime(callback) {

    try {

      if (!window.supabaseClient) {

        console.error(
          'Supabase client tidak ditemukan'
        );

        return;
      }

      const storeId =
        window.AdminSession?.store_id;

      if (!storeId) {

        console.error(
          'Store ID tidak ditemukan'
        );

        return;
      }

      const channel =

        window.supabaseClient.channel(
          `orders-realtime-${storeId}`
        );

      channel.on(

        'postgres_changes',

        {

          event: '*',

          schema: 'public',

          table: 'orders',

          filter:
            `store_id=eq.${storeId}`
        },

        async () => {

          await fetchOrders();

          if (
            typeof callback ===
            'function'
          ) {

            callback(
              getFilteredOrders()
            );
          }
        }
      );

      channel.subscribe();

    } catch (err) {

      console.error(
        'Realtime subscribe error:',
        err
      );
    }
  }

  async function syncOrders() {

    return Promise.resolve(
      orders
    );
  }

  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */

  return {

    // Constants
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_FLOW,

    // Utilities
    formatRupiah,
    getOrderTotal,
    getTotalItemCount,
    getOrder,
    getAvailableStatuses,

    // Filtering & search
    setFilter,
    getFilter,
    setSearch,
    getSearch,
    getFilteredOrders,

    // CRUD
    deleteOrder,
    updateStatus,

    // Target state
    setDeleteTarget,
    getDeleteTarget,
    clearDeleteTarget,
    setStatusTarget,
    getStatusTarget,
    clearStatusTarget,

    // Supabase operations
    fetchOrders,
    deleteOrderFromSupabase,
    updateOrderStatusInSupabase,
    subscribeRealtime,
    syncOrders,
  };

})();
