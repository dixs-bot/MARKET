/**
 * ============================================
   LUMORA — ANIMATION UI
 * ============================================
 * 
 * DOM cache dan animasi halaman:
 * - cache() → simpan semua referensi DOM ke state.d
 * - animateIn(el) → trigger animasi masuk pada element
 */

import { state } from '../utils.js';


/* =========================================================
   DOM CACHE
======================================================== */

export function cache() {

    const g = (id) =>
        document.getElementById(id);

    state.d.dim = g('dim');

    state.d.csheet = g('csheet');
    state.d.clist = g('clist');
    state.d.cnone = g('cnone');
    state.d.cft = g('cft');
    state.d.ccnt = g('ccnt');
    state.d.ctotal = g('ctotal');

    state.d.fab = g('fab-cart');
    state.d.badge = g('cbadge');

    state.d.catbar = g('catbar');
    state.d.pgrid = g('pgrid');
    state.d.pcnt = g('pcnt');

    state.d.pgco = g('pgco');
    state.d.coscroll = g('coscroll');

    state.d.inaddr = g('inaddr');
    state.d.innote = g('innote');

    state.d.ships = g('shiplist');
    state.d.pays = g('paylist');

    state.d.coitems = g('co-items');

    state.d.ssub = g('s-sub');
    state.d.sship = g('s-ship');

    state.d.discr = g('s-disc-row');
    state.d.sdisc = g('s-disc');

    state.d.stotal = g('s-total');

    state.d.vlbl = g('vlbl');

    state.d.border = g('btn-order');
    state.d.hint = g('hint');

    state.d.mconf = g('mconf');
    state.d.mload = g('mload');

    state.d.pginv = g('pginv');
    state.d.invbody = g('inv-body');

    state.d.pgsearch = g('pg-search');
    state.d.insearch = g('insearch');
    state.d.sres = g('sres');

    state.d.olist = g('ord-list');
    state.d.oempty = g('ord-empty');

    state.d.toast = g('toast');
}


/* =========================================================
   PAGE ANIMATION
======================================================== */

export function animateIn(el) {

    if (!el) return;

    el.classList.remove('page-in');

    void el.offsetWidth;

    el.classList.add('page-in');
}