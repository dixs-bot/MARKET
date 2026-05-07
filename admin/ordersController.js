/* ==============================================
   MINIMARKET ADMIN — ORDERS CONTROLLER
   Initialization, events, orchestration, flow
   ============================================== */

const OrdersController = (() => {

  const Svc = OrdersService;
  const UI  = OrdersUI;

  /* ------------------------------------------
     INITIALIZATION
     ------------------------------------------ */

  /**
   * Bootstrap the orders page:
   * 1. Show skeleton
   * 2. Bind all event listeners
   * 3. Load orders with simulated delay
   * 4. Set up realtime (when ready)
   */
  function init() {
    UI.renderSkeleton();
    bindDelegatedEvents();
    bindSearchInput();
    startupLoad();
  }

  /**
   * Simulate initial data loading, then render orders
   */
  function startupLoad() {
    setTimeout(() => {
      const filtered = Svc.getFilteredOrders();
      UI.renderOrders(filtered, true);
    }, 900);
  }

  /* ------------------------------------------
     DELEGATED EVENT HANDLING
     All interactive elements use data-action
     attributes handled through one listener
     ------------------------------------------ */

  function bindDelegatedEvents() {
    document.addEventListener('click', handleDelegatedClick);
    document.addEventListener('keydown', handleKeyboard);
  }

  /**
   * Central click router — reads data-action from
   * the closest matching ancestor of the click target
   * @param {MouseEvent} e
   */
  function handleDelegatedClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    const action = el.dataset.action;

    // Ignore clicks inside modal card content (backdrop-close guard)
    if (action === 'modal-content') return;

    switch (action) {

      /* --- Filter tabs --- */
      case 'filter':
        handleFilterChange(el.dataset.filter);
        break;

      /* --- Open delete modal from order card --- */
      case 'open-delete':
        handleOpenDelete(el.dataset.orderId);
        break;

      /* --- Open status modal from order card --- */
      case 'open-status':
        handleOpenStatus(el.dataset.orderId);
        break;

      /* --- Cancel delete --- */
      case 'cancel-delete':
        handleCloseDelete();
        break;

      /* --- Confirm delete --- */
      case 'confirm-delete':
        handleConfirmDelete();
        break;

      /* --- Cancel status update --- */
      case 'cancel-status':
        handleCloseStatus();
        break;

      /* --- Select a new status from options --- */
      case 'set-status':
        handleSetStatus(el.dataset.orderId, el.dataset.newStatus);
        break;

      /* --- Click on modal backdrop to close --- */
      case 'backdrop-close':
        handleBackdropClose(el.dataset.modal);
        break;
    }
  }

  /* ------------------------------------------
     FILTER HANDLING
     ------------------------------------------ */

  function handleFilterChange(filter) {
    Svc.setFilter(filter);
    UI.setActiveFilterTab(filter);
    const filtered = Svc.getFilteredOrders();
    UI.renderOrders(filtered, true);
  }

  /* ------------------------------------------
     SEARCH HANDLING
     ------------------------------------------ */

  let searchTimer = null;

  function bindSearchInput() {
    UI.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        Svc.setSearch(UI.searchInput.value.trim());
        const filtered = Svc.getFilteredOrders();
        UI.renderOrders(filtered, true);
      }, 200);
    });
  }

  /* ------------------------------------------
     DELETE MODAL FLOW
     ------------------------------------------ */

  function handleOpenDelete(orderId) {
    Svc.setDeleteTarget(orderId);
    UI.openDeleteModal(orderId);
  }

  async function handleCloseDelete() {
    Svc.clearDeleteTarget();
    await UI.closeDeleteModal();
  }

  async function handleConfirmDelete() {
    const orderId = Svc.getDeleteTarget();
    if (!orderId) return;

    // Animate card removal first (visual feedback)
    UI.animateCardRemoval(orderId);

    // Close modal
    await UI.closeDeleteModal();
    Svc.clearDeleteTarget();

    // After animation completes, remove from state and re-render
    setTimeout(() => {
      Svc.deleteOrder(orderId);
      const filtered = Svc.getFilteredOrders();
      UI.renderOrders(filtered, false);
      UI.showToast(`Pesanan ${orderId} berhasil dihapus`, 'error');
    }, 380);
  }

  /* ------------------------------------------
     STATUS UPDATE MODAL FLOW
     ------------------------------------------ */

  function handleOpenStatus(orderId) {
    const order = Svc.getOrder(orderId);
    if (!order) return;

    Svc.setStatusTarget(orderId);
    UI.openStatusModal(orderId, order);
  }

  async function handleCloseStatus() {
    Svc.clearStatusTarget();
    await UI.closeStatusModal();
  }

  async function handleSetStatus(orderId, newStatus) {
    const order = Svc.getOrder(orderId);
    if (!order) return;

    // Perform the status change in service
    const result = Svc.updateStatus(orderId, newStatus);
    if (!result.success) return;

    // Close modal, then re-render with toast
    await UI.closeStatusModal();
    Svc.clearStatusTarget();

    setTimeout(() => {
      const filtered = Svc.getFilteredOrders();
      UI.renderOrders(filtered, false);
      UI.showToast(
        `Status diubah: ${result.oldLabel} → ${result.newLabel}`,
        'success'
      );
    }, 280);
  }

  /* ------------------------------------------
     BACKDROP CLOSE
     ------------------------------------------ */

  async function handleBackdropClose(modalType) {
    if (modalType === 'delete') {
      await handleCloseDelete();
    } else if (modalType === 'status') {
      await handleCloseStatus();
    }
  }

  /* ------------------------------------------
     KEYBOARD SHORTCUTS
     ------------------------------------------ */

  function handleKeyboard(e) {
    if (e.key !== 'Escape') return;

    // Close whichever modal is currently open
    const deleteOpen = !document.getElementById('delete-modal').classList.contains('hidden');
    const statusOpen = !document.getElementById('status-modal').classList.contains('hidden');

    if (deleteOpen) {
      handleCloseDelete();
    } else if (statusOpen) {
      handleCloseStatus();
    }
  }

  /* ------------------------------------------
     PUBLIC API
     Exposed for potential external triggers
     ------------------------------------------ */
  return {
    init,
    // Allow external code to open modals if needed
    openDeleteModal: handleOpenDelete,
    openStatusModal: handleOpenStatus,
  };

})();

window.OrdersController = OrdersController;

/* ------------------------------------------
   AUTO-INIT ON DOM READY
   ------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  OrdersController.init();
});
