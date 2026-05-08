/* ==============================================
   MINIMARKET CUSTOMER AUTH — CONTROLLER
   Modular auth logic: tabs, validation, Supabase
   ============================================== */

const AuthController = (() => {

  /* ------------------------------------------
     DOM REFERENCES
     ------------------------------------------ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    tabBtns:       () => $$('[data-tab]'),
    tabIndicator:  () => $('#tab-indicator'),
    panels:        () => $$('.auth-panel'),
    formLogin:     () => $('#form-login'),
    formRegister:  () => $('#form-register'),
    btnLogin:      () => $('#btn-login'),
    btnRegister:   () => $('#btn-register'),
    btnForgot:     () => $('#btn-forgot'),
    toastWrap:     () => $('#toast-wrap'),
  };


  /* ------------------------------------------
     STATE
     ------------------------------------------ */
  let activeTab = 'login';


  /* ------------------------------------------
     INITIALIZATION
     ------------------------------------------ */
  function init() {
    bindEvents();
    positionIndicator(false);
    checkExistingSession();
  }


  /* ------------------------------------------
     EXISTING SESSION CHECK
     Auto-redirect if user is already logged in
     ------------------------------------------ */
  async function checkExistingSession() {
    try {
      if (!window.supabaseClient) return;

      const { data: { session } } = await window.supabaseClient.auth.getSession();

      if (session && session.user) {
        window.location.href = '/index.html';
      }
    } catch (err) {
      // Silently fail — user stays on auth page
      console.warn('Session check failed:', err.message);
    }
  }


  /* ------------------------------------------
     EVENT BINDING
     ------------------------------------------ */
  function bindEvents() {
    // Tab switching
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) switchTab(tabBtn.dataset.tab);

      const gotoBtn = e.target.closest('[data-goto]');
      if (gotoBtn) switchTab(gotoBtn.dataset.goto);

      const toggleBtn = e.target.closest('.toggle-pw');
      if (toggleBtn) togglePassword(toggleBtn);
    });

    // Form submissions
    DOM.formLogin().addEventListener('submit', handleLogin);
    DOM.formRegister().addEventListener('submit', handleRegister);

    // Forgot password
    DOM.btnForgot().addEventListener('click', handleForgotPassword);
  }


  /* ------------------------------------------
     TAB SWITCHING
     ------------------------------------------ */
  function switchTab(tab) {
    if (tab === activeTab) return;
    activeTab = tab;

    // Update tab button states
    DOM.tabBtns().forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    // Slide indicator
    positionIndicator(true);

    // Swap panels
    DOM.panels().forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = $(`#panel-${tab}`);
    // Small delay so the CSS animation replays
    requestAnimationFrame(() => {
      targetPanel.classList.add('active');
    });

    // Clear all errors
    clearAllErrors();
  }

  /**
   * Position the sliding tab indicator
   * @param {boolean} animate - Whether to use CSS transition
   */
  function positionIndicator(animate) {
    const indicator = DOM.tabIndicator();
    if (!animate) {
      indicator.style.transition = 'none';
    } else {
      indicator.style.transition = '';
    }

    if (activeTab === 'register') {
      indicator.classList.add('right');
    } else {
      indicator.classList.remove('right');
    }

    // Force reflow if not animating, then restore transition
    if (!animate) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }


  /* ------------------------------------------
     PASSWORD TOGGLE
     ------------------------------------------ */
  function togglePassword(btn) {
    const targetId = btn.dataset.target;
    const input = $(`#${targetId}`);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const eyeOpen = btn.querySelector('.eye-open');
    const eyeClosed = btn.querySelector('.eye-closed');

    eyeOpen.classList.toggle('hidden', isPassword);
    eyeClosed.classList.toggle('hidden', !isPassword);
  }


  /* ------------------------------------------
     ERROR DISPLAY
     ------------------------------------------ */

  /**
   * Show error on a specific field
   * @param {string} inputId - Input element ID
   * @param {string} message - Error text
   */
  function showFieldError(inputId, message) {
    const wrap = $(`#${inputId}`).closest('.field-input-wrap');
    const errorEl = $(`#${inputId}-error`);

    if (wrap) {
      wrap.classList.add('error');
      // Trigger shake animation
      wrap.classList.remove('shake');
      void wrap.offsetWidth;
      wrap.classList.add('shake');
    }

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  /**
   * Clear error from a specific field
   * @param {string} inputId
   */
  function clearFieldError(inputId) {
    const wrap = $(`#${inputId}`).closest('.field-input-wrap');
    const errorEl = $(`#${inputId}-error`);

    if (wrap) wrap.classList.remove('error', 'shake');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  /**
   * Clear all field errors on the page
   */
  function clearAllErrors() {
    $$('.field-input-wrap').forEach(wrap => wrap.classList.remove('error', 'shake'));
    $$('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }

  /**
   * Clear errors on a specific field when user starts typing
   */
  function bindLiveClear() {
    ['login-email', 'login-password', 'reg-name', 'reg-phone', 'reg-email', 'reg-password', 'reg-confirm'].forEach(id => {
      const input = $(`#${id}`);
      if (!input) return;
      input.addEventListener('input', () => clearFieldError(id));
    });
  }

  // Initialize live clear on DOM ready
  document.addEventListener('DOMContentLoaded', bindLiveClear);


  /* ------------------------------------------
     VALIDATION HELPERS
     ------------------------------------------ */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    // Indonesian phone: 08xx or +62xx, 10-15 digits
    const cleaned = phone.replace(/[\s\-+()]/g, '');
    return /^(08|62)\d{8,13}$/.test(cleaned);
  }


  /* ------------------------------------------
     LOADING STATE
     ------------------------------------------ */

  /**
   * Set a submit button to loading or idle state
   * @param {HTMLElement} btn
   * @param {boolean} loading
   * @param {string} idleText - Label text when idle
   */
  function setButtonLoading(btn, loading, idleText) {
    const label = btn.querySelector('.btn-label');
    const spinner = btn.querySelector('.btn-spinner');

    btn.disabled = loading;

    if (label) label.textContent = loading ? 'Memproses...' : idleText;
    if (spinner) spinner.classList.toggle('hidden', !loading);
  }


  /* ------------------------------------------
     TOAST SYSTEM
     ------------------------------------------ */

  /**
   * Show a toast notification
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   * @param {number} duration - Auto-dismiss in ms
   */
  function showToast(message, type = 'success', duration = 3500) {
    const wrap = DOM.toastWrap();

    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    wrap.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }


  /* ------------------------------------------
     LOGIN HANDLER
     ------------------------------------------ */
  async function handleLogin(e) {
    e.preventDefault();
    clearAllErrors();

    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const btn = DOM.btnLogin();

    // Validate
    let hasError = false;

    if (!email) {
      showFieldError('login-email', 'Email wajib diisi');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('login-email', 'Format email tidak valid');
      hasError = true;
    }

    if (!password) {
      showFieldError('login-password', 'Password wajib diisi');
      hasError = true;
    }

    if (hasError) return;

    // Submit
    setButtonLoading(btn, true, 'Masuk');

    try {
      if (!window.supabaseClient) {
        throw new Error('Koneksi belum tersedia. Coba lagi nanti.');
      }

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Map common Supabase errors to friendly messages
        let msg = error.message;
        if (error.message.includes('Invalid login')) {
          msg = 'Email atau password salah';
        } else if (error.message.includes('Email not confirmed')) {
          msg = 'Email belum dikonfirmasi. Cek inbox Anda.';
        } else if (error.message.includes('Too many requests')) {
          msg = 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
        }
        showFieldError('login-password', msg);
        return;
      }

      // Success — redirect
      showToast('Login berhasil! Mengalihkan...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 800);

    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setButtonLoading(btn, false, 'Masuk');
    }
  }


  /* ------------------------------------------
     REGISTER HANDLER
     ------------------------------------------ */
  async function handleRegister(e) {
    e.preventDefault();
    clearAllErrors();

    const name     = $('#reg-name').value.trim();
    const phone    = $('#reg-phone').value.trim();
    const email    = $('#reg-email').value.trim();
    const password = $('#reg-password').value;
    const confirm  = $('#reg-confirm').value;
    const btn      = DOM.btnRegister();

    // Validate all fields
    let hasError = false;

    if (!name) {
      showFieldError('reg-name', 'Nama lengkap wajib diisi');
      hasError = true;
    } else if (name.length < 3) {
      showFieldError('reg-name', 'Nama minimal 3 karakter');
      hasError = true;
    }

    if (!phone) {
      showFieldError('reg-phone', 'Nomor HP wajib diisi');
      hasError = true;
    } else if (!isValidPhone(phone)) {
      showFieldError('reg-phone', 'Format nomor HP tidak valid (contoh: 08xx)');
      hasError = true;
    }

    if (!email) {
      showFieldError('reg-email', 'Email wajib diisi');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('reg-email', 'Format email tidak valid');
      hasError = true;
    }

    if (!password) {
      showFieldError('reg-password', 'Password wajib diisi');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('reg-password', 'Password minimal 6 karakter');
      hasError = true;
    }

    if (!confirm) {
      showFieldError('reg-confirm', 'Konfirmasi password wajib diisi');
      hasError = true;
    } else if (password !== confirm) {
      showFieldError('reg-confirm', 'Password tidak cocok');
      hasError = true;
    }

    if (hasError) return;

    // Submit
    setButtonLoading(btn, true, 'Daftar Sekarang');

    try {
      if (!window.supabaseClient) {
        throw new Error('Koneksi belum tersedia. Coba lagi nanti.');
      }

      // Step 1: Sign up user
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes('already registered')) {
          msg = 'Email sudah terdaftar. Silakan masuk.';
          showFieldError('reg-email', msg);
        } else if (error.message.includes('Password')) {
          msg = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
          showFieldError('reg-password', msg);
        } else {
          showToast(msg, 'error');
        }
        return;
      }

      // Step 2: Create profile in 'profiles' table
      if (data.user) {
        try {
          await window.supabaseClient.from('profiles').upsert({
            id: data.user.id,
            name: name,
            phone: phone,
            address: '',
            created_at: new Date().toISOString(),
          });
        } catch (profileErr) {
          console.warn('Profile creation failed (non-blocking):', profileErr.message);
        }
      }

      // Step 3: Handle email confirmation requirement
      if (data.user && data.session === null) {
        // Email confirmation required
        showToast('Registrasi berhasil! Cek email untuk konfirmasi.', 'success', 5000);
        switchTab('login');
        DOM.formLogin().reset();
      } else if (data.session) {
        // Auto-confirmed (e.g. Supabase email confirmation disabled)
        showToast('Daftar berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 800);
      }

    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setButtonLoading(btn, false, 'Daftar Sekarang');
    }
  }


  /* ------------------------------------------
     FORGOT PASSWORD HANDLER
     ------------------------------------------ */
  async function handleForgotPassword() {
    const email = $('#login-email').value.trim();

    if (!email) {
      showFieldError('login-email', 'Masukkan email untuk reset password');
      $('#login-email').focus();
      return;
    }

    if (!isValidEmail(email)) {
      showFieldError('login-email', 'Format email tidak valid');
      return;
    }

    try {
      if (!window.supabaseClient) {
        throw new Error('Koneksi belum tersedia.');
      }

      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      showToast('Link reset password dikirim ke email Anda', 'info', 5000);

    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    }
  }


  /* ------------------------------------------
     PUBLIC API
     ------------------------------------------ */
  return {
    init,
    switchTab,
    showToast,
  };

})();

/* Auto-init */
document.addEventListener('DOMContentLoaded', () => {
  AuthController.init();
});
