/**
 * ============================================
 * LUMORA — STATE MANAGEMENT
 * ============================================
 * 
 * Single source of truth untuk seluruh aplikasi.
 * Semua module membaca & menulis state melalui sini.
 * 
 * KONTRAK:
 * - State.read(key)        → ambil nilai tanpa clone
 * - State.get(key)         → ambil nilai dengan clone (aman)
 * - State.set(key, value)  → tulis nilai + emit event
 * - State.setMany(obj)     → tulis banyak sekaligus
 * - State.reset()          → reset ke initial state
 * 
 * Events yang di-emit otomatis:
 * - "state:{key}"  → saat set(key) dipanggil
 * - "state:batch"  → saat setMany() dipanggil
 */

const State = (() => {

  // ------------------------------------------
  // INITIAL STATE
  // ------------------------------------------
  const INITIAL = {
    // Auth
    user: null,
    isAuthReady: false,

    // Products
    products: [],
    filteredProducts: [],
    searchQuery: '',

    // Categories
    categories: [],
    activeCategory: '',

    // Store (multi-tenant)
    stores: [],
    activeStore: '',

    // Cart
    cart: [],

    // Checkout
    checkout: {
      name: '',
      phone: '',
      address: '',
      shipping: null,
      payment: null,
      voucher: null,
      note: '',
    },

    // Orders
    orders: [],

    // UI flags
    loading: false,
  };


  // ------------------------------------------
  // INTERNAL
  // ------------------------------------------
  let _state = JSON.parse(JSON.stringify(INITIAL));


  // ------------------------------------------
  // PUBLIC API
  // ------------------------------------------

  /**
   * Baca state tanpa deep clone (performa tinggi,
   * jangan mutate hasilnya)
   */
  function read(key) {
    return key ? _state[key] : _state;
  }

  /**
   * Baca state dengan deep clone (aman untuk dipakai)
   */
  function get(key) {
    return key ? JSON.parse(JSON.stringify(_state[key])) : JSON.parse(JSON.stringify(_state));
  }

  /**
   * Tulis satu key + emit event "state:{key}"
   */
  function set(key, value) {
    _state[key] = value;
    if (window.EventBus) {
      EventBus.emit('state:' + key, value);
    }
  }

  /**
   * Tulis banyak key sekaligus + emit "state:batch"
   */
  function setMany(partial) {
    Object.assign(_state, partial);
    if (window.EventBus) {
      EventBus.emit('state:batch', partial);
    }
  }

  /**
   * Reset ke initial state
   */
  function reset() {
    _state = JSON.parse(JSON.stringify(INITIAL));
    if (window.EventBus) {
      EventBus.emit('state:batch', _state);
    }
  }

  /**
   * Export initial state (untuk referensi)
   */
  function getInitial() {
    return JSON.parse(JSON.stringify(INITIAL));
  }

  return { read, get, set, setMany, reset, getInitial };

})();

window.State = State;

export default State;