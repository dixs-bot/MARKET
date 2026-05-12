/**
 * ============================================
 * LUMORA — PAGE ROUTER
 * ============================================
 * 
 * Menangani navigasi antar halaman (home, history)
 * dengan show/hide page div + update nav active state.
 * 
 * KONTRAK:
 * - Router.go(page)            → navigasi ke halaman
 * - Router.getCurrent()        → halaman aktif sekarang
 * 
 * Pages yang dikenali: 'home' | 'history'
 * 
 * NOTE: Tidak auto-bind [data-nav] di sini.
 * Bootstrap yang menangani delegated click lalu
 * memanggil Router.go() langsung.
 */

import { renderOrders } from '../ui.js';

const Router = (() => {

  let _current = 'home';


  /**
   * Navigasi ke halaman tertentu
   * @param {string} page - 'home' | 'history'
   */
  function go(page) {
    if (page === _current) return;

    const from = _current;
    _current = page;

    /* =========================
       HIDE ALL PAGES
    ========================= */

    const pages =
        document.querySelectorAll(
            '.page'
        );

    pages.forEach(page => {

        page.classList.remove(
            'on'
        );
    });

    /* =========================
       SHOW TARGET PAGE
    ========================= */

    const target =
        document.getElementById(
            'pg-' + page
        );

    if (target) {

        target.classList.add(
            'on'
        );
    }

    /* =========================
       UPDATE NAV BUTTONS
    ========================= */

    const navButtons =
        document.querySelectorAll(
            '[data-nav]'
        );

    navButtons.forEach(button => {

        const active =

            button.getAttribute(
                'data-nav'
            ) === page;

        button.classList.toggle(
            'text-blue-600',
            active
        );

        button.classList.toggle(
            'text-slate-400',
            !active
        );
    });

    /* =========================
       RENDER HISTORY IF NEEDED
    ========================= */

    if (
        page ===
        'history'
    ) {

        renderOrders();
    }

    /* =========================
       SCROLL TO TOP
    ========================= */

    window.scrollTo(0, 0);

    /* =========================
       EMIT EVENT
    ========================= */

    if (window.EventBus) {

        EventBus.emit(
            'router:change',
            { from, to: page }
        );
    }
  }


  /**
   * Get halaman aktif
   * @returns {string}
   */
  function getCurrent() {
    return _current;
  }


  return { go, getCurrent };

})();

window.Router = Router;

export default Router;