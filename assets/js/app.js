/**
 * ============================================
 * LUMORA — APP ENTRY POINT
 * ============================================
 * 
 * File ini HANYA bertugas memuat core dan
 * menjalankan bootstrap. Semua logic ada
 * di module masing-masing.
 * 
 * URUTAN PENTING:
 * 1. events.js   → EventBus harus ada duluan
 * 2. state.js    → State pakai EventBus
 * 3. router.js   → Router pakai EventBus + ui.js
 * 4. bootstrap.js→ muat semua features, lalu start
 */

// Core (urutan penting)
import './core/events.js';
import './core/state.js';
import './core/router.js';

// Bootstrap (muat features lalu start)
import './core/bootstrap.js';
