/* ==============================================
   MINIMARKET ADMIN — ORDERS SERVICE MODULE
   Data layer: state, CRUD, filtering, Supabase
   ============================================== */

const OrdersService = (() => {

  /* ------------------------------------------
     CONSTANTS
     ------------------------------------------ */
  const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const STATUS_LABELS = {
    pending: 'Menunggu',
    processing: 'Diproses',
    shipped: 'Dikirim',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  // Maps each status to the next valid status in the flow
  const STATUS_NEXT = {
    pending: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  };

  // Button label for the immediate next step
  const NEXT_LABELS = {
    pending: 'Proses',
    processing: 'Kirim',
    shipped: 'Selesaikan',
  };

  /* ------------------------------------------
     MOCK DATA (local mode / fallback)
     Replace with Supabase fetch in production
     ------------------------------------------ */
  const MOCK_ORDERS = [
    {
      id: 'ORD-20250117-001',
      customer: 'Sari Dewi',
      email: 'sari.dewi@email.com',
      phone: '0812-3456-7890',
      address: 'Jl. Melati No. 14, RT 03/RW 05, Kel. Sukajadi, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40116',
      status: 'processing',
      date: '17 Jan 2025, 14:32',
      products: [
        { name: 'Teh Hijau Premium 100g', qty: 2, price: 45000, img: 'https://picsum.photos/seed/tehijau/80/80.jpg' },
        { name: 'Gula Aren Bubuk 500g', qty: 1, price: 28000, img: 'https://picsum.photos/seed/gularen/80/80.jpg' },
        { name: 'Kerupuk Udang Premium', qty: 3, price: 15000, img: 'https://picsum.photos/seed/kerupuk/80/80.jpg' },
      ],
    },
    {
      id: 'ORD-20250117-002',
      customer: 'Budi Santoso',
      email: 'budi.s@email.com',
      phone: '0856-1234-5678',
      address: 'Jl. Kenanga Raya Blok C2 No. 7, Samarinda Utara, Kota Samarinda, Kalimantan Timur 75124',
      status: 'pending',
      date: '17 Jan 2025, 13:15',
      products: [
        { name: 'Minyak Zaitun Extra Virgin 250ml', qty: 1, price: 89000, img: 'https://picsum.photos/seed/zaitun/80/80.jpg' },
        { name: 'Pasta Spaghetti 500g', qty: 2, price: 22000, img: 'https://picsum.photos/seed/pasta/80/80.jpg' },
      ],
    },
    {
      id: 'ORD-20250117-003',
      customer: 'Anisa Rahma',
      email: 'anisa.r@email.com',
      phone: '0878-9876-5432',
      address: 'Jl. Cempaka Putih No. 21, Menteng, Jakarta Pusat, DKI Jakarta 10310',
      status: 'shipped',
      date: '16 Jan 2025, 19:48',
      products: [
        { name: 'Beras Organik 5kg', qty: 1, price: 125000, img: 'https://picsum.photos/seed/beras5/80/80.jpg' },
        { name: 'Kecap Manis ABC 600ml', qty: 2, price: 18500, img: 'https://picsum.photos/seed/kecap/80/80.jpg' },
        { name: 'Sambal Teri Medan 200g', qty: 1, price: 32000, img: 'https://picsum.photos/seed/sambal/80/80.jpg' },
        { name: 'Tepung Beras Rose Brand 1kg', qty: 1, price: 14000, img: 'https://picsum.photos/seed/tepung/80/80.jpg' },
      ],
    },
    {
      id: 'ORD-20250116-004',
      customer: 'Rizky Pratama',
      email: 'rizky.p@email.com',
      phone: '0813-5555-1234',
      address: 'Jl. Pahlawan No. 8, Lamongan, Kab. Lamongan, Jawa Timur 62211',
      status: 'delivered',
      date: '16 Jan 2025, 10:22',
      products: [
        { name: 'Kopi Arabika Toraja 200g', qty: 1, price: 75000, img: 'https://picsum.photos/seed/kopitor/80/80.jpg' },
      ],
    },
    {
      id: 'ORD-20250116-005',
      customer: 'Maya Putri',
      email: 'maya.putri@email.com',
      phone: '0821-7777-8899',
      address: 'Jl. Diponegoro No. 45, Darmo, Surabaya, Jawa Timur 60241',
      status: 'cancelled',
      date: '15 Jan 2025, 21:05',
      products: [
        { name: 'Susu UHT Full Cream 1L', qty: 3, price: 18000, img: 'https://picsum.photos/seed/susufull/80/80.jpg' },
        { name: 'Roti Tawar Sari Roti', qty: 2, price: 16000, img: 'https://picsum.photos/seed/rotitawar/80/80.jpg' },
      ],
    },
    {
      id: 'ORD-20250115-006',
      customer: 'Ahmad Fadli',
      email: 'ahmad.f@email.com',
      phone: '0857-2222-3333',
      address: 'Jl. Asia Afrika No. 112, Braga, Bandung, Jawa Barat 40111',
      status: 'delivered',
      date: '15 Jan 2025, 08:14',
      products: [
        { name: 'Mie Instan Goreng (48pcs)', qty: 1, price: 96000, img: 'https://picsum.photos/seed/miegoreng/80/80.jpg' },
        { name: 'Telur Ayam 1 Rak (30 butir)', qty: 1, price: 68000, img: 'https://picsum.photos/seed/telur30/80/80.jpg' },
        { name: 'Minyak Goreng Bimoli 2L', qty: 2, price: 36000, img: 'https://picsum.photos/seed/minyak2l/80/80.jpg' },
      ],
    },
  ];

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

  /**
   * Format number to Indonesian Rupiah currency string
   * @param {number} n - Amount in IDR
   * @returns {string} Formatted string e.g. "Rp 45.000"
   */
  function formatRupiah(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  /**
   * Calculate total price for a single order
   * @param {Object} order
   * @returns {number}
   */
  function getOrderTotal(order) {
    return order.products.reduce((sum, product) => sum + product.price * product.qty, 0);
  }

  /**
   * Count total items across all products in an order
   * @param {Object} order
   * @returns {number}
   */
  function getTotalItemCount(order) {
    return order.products.reduce((sum, product) => sum + product.qty, 0);
  }

  /**
   * Find a single order by its ID
   * @param {string} id
   * @returns {Object|null}
   */
  function getOrder(id) {
    return orders.find(o => o.id === id) || null;
  }

  /**
   * Get available next statuses for an order (excludes 'cancelled')
   * @param {Object} order
   * @returns {string[]} Array of status keys
   */
  function getAvailableStatuses(order) {
    const currentIdx = STATUSES.indexOf(order.status);
    return STATUSES.slice(currentIdx + 1).filter(s => s !== 'cancelled');
  }

  /* ------------------------------------------
     FILTERING & SEARCH
     ------------------------------------------ */

  /**
   * Set the active status filter
   * @param {string} filter - Status key or 'all'
   */
  function setFilter(filter) {
    currentFilter = filter;
  }

  /**
   * Get the current active filter
   * @returns {string}
   */
  function getFilter() {
    return currentFilter;
  }

  /**
   * Set the search query string
   * @param {string} query
   */
  function setSearch(query) {
    searchQuery = query;
  }

  /**
   * Get the current search query
   * @returns {string}
   */
  function getSearch() {
    return searchQuery;
  }

  /**
   * Get orders matching current filter and search query
   * Matches against order ID, customer name, and email
   * @returns {Object[]}
   */
  function getFilteredOrders() {
    return orders.filter(order => {
      const matchFilter = currentFilter === 'all' || order.status === currentFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || order.id.toLowerCase().includes(q)
        || order.customer.toLowerCase().includes(q)
        || order.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }

  /* ------------------------------------------
     CRUD OPERATIONS (local state)
     ------------------------------------------ */

  /**
   * Remove an order from state by ID
   * @param {string} id
   * @returns {boolean} True if order was found and removed
   */
async function deleteOrder(id) {

  try {

    const { error } =

      await window.supabaseClient

        .from('orders')

        .delete()

        .eq('id', id);

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
  /**
   * Update an order's status
   * @param {string} id
   * @param {string} newStatus
   * @returns {{ success: boolean, oldLabel?: string, newLabel?: string }}
   */
  function updateStatus(id, newStatus) {
    const order = getOrder(id);
    if (!order) return { success: false };

    const oldLabel = STATUS_LABELS[order.status];
    order.status = newStatus;

    return {
      success: true,
      oldLabel,
      newLabel: STATUS_LABELS[newStatus],
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
     SUPABASE OPERATIONS (ready for integration)
     Replace mock logic with real Supabase calls
     ------------------------------------------ */

  /**
   * Fetch all orders from Supabase
   * TODO: Replace with actual Supabase query
   * @returns {Promise<Object[]>}
   */
async function fetchOrders() {

  try {

    const { data, error } =
      await window.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', {
          ascending: false
        });

    if (error) {

      console.error(error);

      return [];
    }

    orders = (data || []).map(order => {

      return {

        id: order.id,

        customer: order.customer_name,

        email: '-',

        phone: order.phone,

        address: order.address,

        status: order.status,

        date:
          new Date(
            order.created_at
          ).toLocaleString('id-ID'),

        products:
          order.items || []
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

  /**
   * Permanently delete an order from Supabase
   * TODO: Replace with actual Supabase delete
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async function deleteOrderFromSupabase(id) {
    // TODO: Uncomment for Supabase integration
    // const { error } = await window.supabaseClient
    //   .from('orders')
    //   .delete()
    //   .eq('id', id);
    //
    // if (error) throw error;
    // return true;

    // Local fallback
    return Promise.resolve(deleteOrder(id));
  }

  /**
   * Update order status in Supabase
   * TODO: Replace with actual Supabase update
   * @param {string} id
   * @param {string} status
   * @returns {Promise<boolean>}
   */
  async function updateOrderStatusInSupabase(id, status) {
    // TODO: Uncomment for Supabase integration
    // const { error } = await window.supabaseClient
    //   .from('orders')
    //   .update({ status })
    //   .eq('id', id);
    //
    // if (error) throw error;
    // return true;

    // Local fallback
    const result = updateStatus(id, status);
    return Promise.resolve(result.success);
  }

  /**
   * Subscribe to realtime order changes via Supabase
   * TODO: Implement with supabaseClient.channel()
   * @param {Function} onInsert - Callback for new orders
   * @param {Function} onUpdate - Callback for updated orders
   * @param {Function} onDelete - Callback for deleted orders
   * @returns {Promise<void>}
   */
async function subscribeRealtime(callback) {

  try {

    if (!window.supabaseClient) {
      console.error('Supabase client tidak ditemukan');
      return;
    }

    const channel = window.supabaseClient.channel(
      'orders-realtime'
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      },

      async (payload) => {

        console.log(
          '[Realtime order]',
          payload
        );

        await fetchOrders();

        if (
          typeof callback === 'function'
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
    // TODO: Uncomment for Supabase integration
    // const freshData = await fetchOrders();
    // orders = mapSupabaseToInternal(freshData);
    // return orders;

    // Local fallback
    return Promise.resolve(orders);
  }

  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */
  return {
    // Constants
    STATUSES,
    STATUS_LABELS,
    STATUS_NEXT,
    NEXT_LABELS,

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

    // Supabase-ready operations
    fetchOrders,
    deleteOrderFromSupabase,
    updateOrderStatusInSupabase,
    subscribeRealtime,
    syncOrders,
  };

})();
