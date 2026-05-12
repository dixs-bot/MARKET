/**
 * ============================================
 * LUMORA — EVENT BUS
 * ============================================
 * 
 * Sistem pub/sub sederhana untuk komunikasi antar module
 * tanpa coupling langsung.
 * 
 * KONTRAK:
 * - EventBus.on(event, callback)        → subscribe
 * - EventBus.off(event, callback)       → unsubscribe
 * - EventBus.emit(event, data)          → publish
 * - EventBus.once(event, callback)      → subscribe sekali pakai
 */

const EventBus = (() => {

  const _listeners = new Map();


  /**
   * Subscribe ke event
   * @param {string} event
   * @param {Function} fn
   * @returns {Function} unsubscribe function
   */
  function on(event, fn) {
    if (!_listeners.has(event)) {
      _listeners.set(event, new Set());
    }
    _listeners.get(event).add(fn);

    return () => off(event, fn);
  }


  /**
   * Unsubscribe dari event
   */
  function off(event, fn) {
    if (!_listeners.has(event)) return;
    _listeners.get(event).delete(fn);
  }


  /**
   * Emit event ke semua subscriber
   * @param {string} event
   * @param {*} data
   */
  function emit(event, data) {
    if (!_listeners.has(event)) return;
    _listeners.get(event).forEach(fn => {
      try {
        fn(data);
      } catch (err) {
        console.error(`[EventBus] Error in "${event}":`, err);
      }
    });
  }


  /**
   * Subscribe sekali pakai, auto-unsubscribe setelah pertama kali dipanggil
   */
  function once(event, fn) {
    const wrapper = (data) => {
      off(event, wrapper);
      fn(data);
    };
    on(event, wrapper);
  }


  /**
   * Debug: lihat semua event yang terdaftar
   */
  function debug() {
    console.table(
      Array.from(_listeners.entries()).map(([event, fns]) => ({
        event,
        listeners: fns.size,
      }))
    );
  }


  return { on, off, emit, once, debug };

})();

window.EventBus = EventBus;

export default EventBus;