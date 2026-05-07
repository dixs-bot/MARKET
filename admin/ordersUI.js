/* ==============================================
   MINIMARKET ADMIN — ORDERS UI MODULE
   All DOM rendering and visual updates
   ============================================== */

const OrdersUI = (() => {

  /* ------------------------------------------
     DOM REFERENCES
     ------------------------------------------ */
  const DOM = {
    get container()       { return document.getElementById('orders-container'); },
    get emptyState()      { return document.getElementById('empty-state'); },
    get emptyTitle()      { return document.getElementById('empty-title'); },
    get emptyDesc()       { return document.getElementById('empty-desc'); },
    get counter()         { return document.getElementById('order-counter'); },
    get toastContainer()  { return document.getElementById('toast-container'); },
    get deleteModal()     { return document.getElementById('delete-modal'); },
    get deleteModalCard() { return document.getElementById('delete-modal-card'); },
    get deleteOrderId()   { return document.getElementById('delete-order-id'); },
    get statusModal()     { return document.getElementById('status-modal'); },
    get statusModalCard() { return document.getElementById('status-modal-card'); },
    get statusOrderId()   { return document.getElementById('status-order-id'); },
    get statusOptions()   { return document.getElementById('status-options'); },
    get filterTabs()      { return document.getElementById('filter-tabs'); },
    get searchInput()     { return document.getElementById('search-input'); },
  };

  /* ------------------------------------------
     SVG ICON TEMPLATES
     ------------------------------------------ */
  const ICONS = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  };

  /* ------------------------------------------
     TOAST NOTIFICATION SYSTEM
     ------------------------------------------ */

  /**
   * Show a toast notification that auto-dismisses
   * @param {string} message - Text to display
   * @param {'success'|'error'|'info'} type - Visual variant
   */
  function showToast(message, type = 'success') {
    const container = DOM.toastContainer;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-toast-in`;
    toast.innerHTML = `${ICONS[type] || ICONS.info}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('animate-toast-in');
      toast.classList.add('animate-toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  /* ------------------------------------------
     COUNTER BADGE
     ------------------------------------------ */

  /**
   * Update the order counter badge with pop animation
   * @param {number} count
   */
  function updateCounter(count) {
    const el = DOM.counter;
    el.textContent = count;
    el.classList.remove('animate-counter-pop');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('animate-counter-pop');
  }

  /* ------------------------------------------
     SKELETON LOADING
     ------------------------------------------ */

  /**
   * Render skeleton placeholder cards while loading
   * @param {number} count - Number of skeleton cards
   */
  function renderSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="order-card p-5 sm:p-6" style="animation-delay:${i * 0.08}s">
          <div class="flex items-center justify-between mb-4">
            <div class="skeleton w-40 h-4 animate-shimmer"></div>
            <div class="skeleton w-20 h-6 rounded-lg animate-shimmer"></div>
          </div>
          <div class="skeleton w-28 h-3.5 mb-1 animate-shimmer"></div>
          <div class="skeleton w-full max-w-xs h-3 mb-5 animate-shimmer"></div>
          <div class="space-y-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="skeleton w-11 h-11 rounded-[10px] shrink-0 animate-shimmer"></div>
              <div class="flex-1">
                <div class="skeleton w-3/4 h-3.5 mb-1.5 animate-shimmer"></div>
                <div class="skeleton w-1/3 h-3 animate-shimmer"></div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="skeleton w-11 h-11 rounded-[10px] shrink-0 animate-shimmer"></div>
              <div class="flex-1">
                <div class="skeleton w-2/3 h-3.5 mb-1.5 animate-shimmer"></div>
                <div class="skeleton w-1/4 h-3 animate-shimmer"></div>
              </div>
            </div>
          </div>
          <div class="divider mb-4"></div>
          <div class="flex items-center justify-end">
            <div class="skeleton w-32 h-4 animate-shimmer"></div>
          </div>
        </div>`;
    }
    DOM.container.innerHTML = html;
    DOM.emptyState.classList.add('hidden');
  }

  /* ------------------------------------------
     EMPTY STATE
     ------------------------------------------ */

  /**
   * Show or hide the empty state with contextual messaging
   * @param {boolean} show
   * @param {boolean} isSearching - True if empty due to search/filter
   */
  function renderEmptyState(show, isSearching = false) {
    if (show) {
      DOM.container.innerHTML = '';
      DOM.emptyState.classList.remove('hidden');
      if (isSearching) {
        DOM.emptyTitle.textContent = 'Tidak ada hasil';
        DOM.emptyDesc.textContent = 'Coba ubah filter atau kata kunci pencarian Anda.';
      } else {
        DOM.emptyTitle.textContent = 'Belum ada pesanan';
        DOM.emptyDesc.textContent = 'Pesanan baru akan muncul di sini secara otomatis.';
      }
    } else {
      DOM.emptyState.classList.add('hidden');
    }
  }

  /* ------------------------------------------
     ORDER CARD RENDERING
     ------------------------------------------ */

  /**
   * Build the HTML for a single product row inside an order card
   * @param {Object} product
   * @returns {string}
   */
  function buildProductRow(product) {
    return `
      <div class="flex items-center gap-3">
        <img
          src="${product.img}"
          alt="${product.name}"
          class="product-img w-11 h-11 shrink-0"
          loading="lazy"
          onerror="this.style.background='#e2e8f0'"
        >
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium text-slate-700 truncate">${product.name}</p>
          <p class="text-[12px] text-slate-400 mt-0.5">${product.qty}x ${OrdersService.formatRupiah(product.price)}</p>
        </div>
        <p class="text-[13px] font-medium text-slate-600 shrink-0">
          ${OrdersService.formatRupiah(product.qty * product.price)}
        </p>
      </div>`;
  }

  /**
   * Build the action buttons HTML for an order card
   * @param {Object} order
   * @returns {string}
   */
  function buildActionButtons(order) {
    const Svc = OrdersService;
    let html = '';

    // Show "next step" button only if order has a valid next status
    if (Svc.STATUS_NEXT[order.status] !== undefined) {
      html += `
        <button
          class="btn-action btn-update"
          data-action="open-status"
          data-order-id="${order.id}"
        >
          ${ICONS.check}
          ${Svc.NEXT_LABELS[order.status]}
        </button>`;
    }

    html += `
      <button
        class="btn-action btn-delete"
        data-action="open-delete"
        data-order-id="${order.id}"
      >
        ${ICONS.trash}
        Hapus
      </button>`;

    return html;
  }

  /**
   * Build the complete HTML for a single order card
   * @param {Object} order
   * @param {number} index - Position for stagger animation delay
   * @returns {string}
   */
  function renderOrderCard(order, index) {
    const Svc = OrdersService;
    const total = Svc.getOrderTotal(order);
    const totalItems = Svc.getTotalItemCount(order);
    const delay = index * 0.06;

    const productsHtml = order.products.map(buildProductRow).join('');
    const actionsHtml = buildActionButtons(order);

    return `
      <article
        class="order-card p-5 sm:p-6 animate-fade-up"
        style="animation-delay:${delay}s"
        data-order-id="${order.id}"
      >
        <!-- Header: ID + date + status badge -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0">
            <p class="text-[13.5px] font-semibold text-slate-800 tracking-tight">${order.id}</p>
            <p class="text-[12px] text-slate-400 mt-0.5">${order.date}</p>
          </div>
          <span class="status-badge status-${order.status}">${Svc.STATUS_LABELS[order.status]}</span>
        </div>

        <!-- Customer info + address -->
        <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 mb-4">
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-slate-700">${order.customer}</p>
            <p class="text-[12px] text-slate-400 truncate">${order.email} · ${order.phone}</p>
          </div>
          <div class="hidden sm:block w-px h-8 bg-slate-100 shrink-0"></div>
          <p class="text-[12px] text-slate-400 leading-relaxed line-clamp-2 min-w-0">${order.address}</p>
        </div>

        <!-- Product list -->
        <div class="space-y-2.5 mb-4">
          ${productsHtml}
        </div>

        <!-- Divider -->
        <div class="divider mb-4"></div>

        <!-- Footer: item count + total + actions -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <p class="text-[12px] text-slate-400">
            ${totalItems} item${totalItems > 1 ? 's' : ''}
          </p>
          <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <p class="text-[15px] font-semibold text-slate-800">${Svc.formatRupiah(total)}</p>
            <div class="flex items-center gap-1.5">${actionsHtml}</div>
          </div>
        </div>
      </article>`;
  }

  /* ------------------------------------------
     FULL ORDERS LIST RENDERING
     ------------------------------------------ */

  /**
   * Render the full list of filtered orders
   * @param {Object[]} filteredOrders
   * @param {boolean} animated - Use stagger animation delays
   */
  function renderOrders(filteredOrders, animated = true) {
    const isSearching = OrdersService.getSearch() || OrdersService.getFilter() !== 'all';
    updateCounter(filteredOrders.length);

    if (filteredOrders.length === 0) {
      renderEmptyState(true, isSearching);
      return;
    }

    renderEmptyState(false);
    DOM.container.innerHTML = filteredOrders.map((order, i) =>
      renderOrderCard(order, animated ? i : 0)
    ).join('');
  }

  /* ------------------------------------------
     DELETE MODAL
     ------------------------------------------ */

  /**
   * Open the delete confirmation modal
   * @param {string} orderId
   */
  function openDeleteModal(orderId) {
    DOM.deleteOrderId.textContent = orderId;
    DOM.deleteModal.classList.remove('hidden');
    DOM.deleteModalCard.classList.remove('animate-modal-out');
    DOM.deleteModalCard.classList.add('animate-modal-in');
  }

  /**
   * Close the delete modal with exit animation
   * @returns {Promise<void>} Resolves when animation completes
   */
  function closeDeleteModal() {
    return new Promise(resolve => {
      DOM.deleteModalCard.classList.remove('animate-modal-in');
      DOM.deleteModalCard.classList.add('animate-modal-out');
      DOM.deleteModalCard.addEventListener('animationend', function handler() {
        DOM.deleteModal.classList.add('hidden');
        DOM.deleteModalCard.removeEventListener('animationend', handler);
        resolve();
      });
    });
  }

  /* ------------------------------------------
     STATUS UPDATE MODAL
     ------------------------------------------ */

  /**
   * Open the status update modal with available options
   * @param {string} orderId
   * @param {Object} order - Order object from service
   */
  function openStatusModal(orderId, order) {
    const Svc = OrdersService;
    DOM.statusOrderId.textContent = orderId;

    const available = Svc.getAvailableStatuses(order);
    const nextStatus = Svc.STATUS_NEXT[order.status];

    DOM.statusOptions.innerHTML = available.map(status => {
      const isNext = status === nextStatus;
      return `
        <button
          class="status-option-btn"
          data-action="set-status"
          data-order-id="${orderId}"
          data-new-status="${status}"
        >
          <span class="status-badge status-${status}">${Svc.STATUS_LABELS[status]}</span>
          ${isNext ? '<span class="status-option-hint">Langkah berikutnya</span>' : ''}
        </button>`;
    }).join('');

    DOM.statusModal.classList.remove('hidden');
    DOM.statusModalCard.classList.remove('animate-modal-out');
    DOM.statusModalCard.classList.add('animate-modal-in');
  }

  /**
   * Close the status update modal with exit animation
   * @returns {Promise<void>} Resolves when animation completes
   */
  function closeStatusModal() {
    return new Promise(resolve => {
      DOM.statusModalCard.classList.remove('animate-modal-in');
      DOM.statusModalCard.classList.add('animate-modal-out');
      DOM.statusModalCard.addEventListener('animationend', function handler() {
        DOM.statusModal.classList.add('hidden');
        DOM.statusModalCard.removeEventListener('animationend', handler);
        resolve();
      });
    });
  }

  /* ------------------------------------------
     CARD REMOVAL ANIMATION
     ------------------------------------------ */

  /**
   * Animate an order card collapsing out of view
   * @param {string} orderId
   * @returns {Promise<void>} Resolves when animation completes
   */
  function animateCardRemoval(orderId) {
    return new Promise(resolve => {
      const card = document.querySelector(`[data-order-id="${orderId}"]`);
      if (!card) {
        resolve();
        return;
      }

      // Measure current height for smooth collapse
      card.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 1, 1)';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.96) translateY(-8px)';
      card.style.maxHeight = card.scrollHeight + 'px';

      requestAnimationFrame(() => {
        card.style.maxHeight = '0';
        card.style.marginBottom = '0';
        card.style.paddingTop = '0';
        card.style.paddingBottom = '0';
        card.style.overflow = 'hidden';
      });

      setTimeout(resolve, 380);
    });
  }

  /* ------------------------------------------
     FILTER TAB ACTIVE STATE
     ------------------------------------------ */

  /**
   * Update the visual active state on filter tabs
   * @param {string} activeFilter
   */
  function setActiveFilterTab(activeFilter) {
    const tabs = DOM.filterTabs.querySelectorAll('[data-action="filter"]');
    tabs.forEach(tab => {
      const isActive = tab.dataset.filter === activeFilter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
  }

  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */
  return {
    // Rendering
    renderOrders,
    renderSkeleton,
    renderEmptyState,
    updateCounter,
    setActiveFilterTab,

    // Toast
    showToast,

    // Delete modal
    openDeleteModal,
    closeDeleteModal,

    // Status modal
    openStatusModal,
    closeStatusModal,

    // Animations
    animateCardRemoval,

    // DOM access (for controller search binding)
    get searchInput() { return DOM.searchInput; },
  };

})();

window.OrdersUI = OrdersUI;
