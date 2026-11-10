/**
 * =========================================================================
 * DEMO GUARD & SISTEM AKTIVASI PROYEK - OMEGA PLUS 2026
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: demo-guard.js
 * 
 * Fungsi:
 * 1. Menjaga landing page tetap dapat diakses & dinikmati secara visual.
 * 2. Mengintersepsi menu/tombol fungsional (Pendaftaran, Cek Status, Portal Admin).
 * 3. Menampilkan dialog notifikasi eksklusif dengan redaksi profesional dan tombol
 *    langsung menghubungi developer ke WhatsApp 088228511309.
 * 4. Mendukung Instant Unlock (1-Switch) via CONFIG.DEMO_MODE.LOCKED di config.js.
 * =========================================================================
 */

(function () {
  'use strict';

  // Proteksi Demo dinonaktifkan: aplikasi sudah aktif penuh dan bebas dibuka
  window.DEMO_GUARD = {
    show: function () {},
    hide: function () {}
  };
  return;

  // Tentukan apakah halaman saat ini adalah landing page atau halaman fungsional
  const currentPath = window.location.pathname.toLowerCase();
  const currentHref = window.location.href.toLowerCase();
  const isFunctionalPage = currentPath.includes('pendaftaran') ||
                           currentPath.includes('admin') ||
                           currentPath.includes('login') ||
                           currentHref.includes('pendaftaran.html') ||
                           currentHref.includes('formpendaftaran.html') ||
                           currentHref.includes('admin.html') ||
                           currentHref.includes('login.html');

  // Injeksi CSS Khusus Modal Aktivasi
  function injectStyles() {
    if (document.getElementById('demo-guard-styles')) return;

    const style = document.createElement('style');
    style.id = 'demo-guard-styles';
    style.textContent = `
      .demo-guard-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(10, 25, 47, 0.78);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.28s ease, visibility 0.28s ease;
      }
      .demo-guard-backdrop.active {
        opacity: 1;
        visibility: visible;
      }
      .demo-guard-modal {
        background: #ffffff;
        width: 100%;
        max-width: 500px;
        border-radius: 20px;
        border: 1px solid rgba(25, 54, 95, 0.12);
        box-shadow: 0 25px 60px -10px rgba(10, 25, 47, 0.4), 0 0 0 1px rgba(231, 181, 94, 0.3);
        overflow: hidden;
        position: relative;
        transform: scale(0.92) translateY(12px);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #193047;
      }
      .demo-guard-backdrop.active .demo-guard-modal {
        transform: scale(1) translateY(0);
      }
      .demo-guard-top-accent {
        height: 6px;
        background: linear-gradient(90deg, #19365f 0%, #285891 35%, #e7b55e 100%);
      }
      .demo-guard-body {
        padding: 1.75rem 1.65rem 1.6rem;
        text-align: center;
      }
      .demo-guard-icon-wrap {
        width: 64px;
        height: 64px;
        margin: 0 auto 1.1rem;
        background: linear-gradient(135deg, #e7f0fb 0%, #fef8ee 100%);
        border: 2px solid rgba(231, 181, 94, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #b88628;
        box-shadow: 0 8px 20px rgba(231, 181, 94, 0.2);
        position: relative;
      }
      .demo-guard-icon-pulse {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid rgba(231, 181, 94, 0.4);
        animation: demoPulse 2s infinite ease-out;
      }
      @keyframes demoPulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.3); opacity: 0; }
      }
      .demo-guard-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(231, 181, 94, 0.15);
        border: 1px solid rgba(184, 134, 40, 0.38);
        color: #946914;
        font-size: 0.725rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        padding: 4px 12px;
        border-radius: 9999px;
        margin-bottom: 0.85rem;
      }
      .demo-guard-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.28rem;
        font-weight: 800;
        color: #19365f;
        line-height: 1.3;
        margin-bottom: 0.65rem;
      }
      .demo-guard-desc {
        font-size: 0.885rem;
        color: #4b637d;
        line-height: 1.58;
        margin-bottom: 1.25rem;
      }
      .demo-guard-status-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        margin-bottom: 1.35rem;
        text-align: left;
        font-size: 0.8rem;
      }
      .demo-guard-status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
      }
      .demo-guard-status-row:not(:last-child) {
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 5px;
        margin-bottom: 5px;
      }
      .demo-guard-status-label {
        color: #64748b;
        font-weight: 500;
      }
      .demo-guard-status-val {
        font-weight: 700;
        color: #19365f;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .demo-guard-status-val.dot-gold::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #e7b55e;
        box-shadow: 0 0 6px rgba(231, 181, 94, 0.8);
      }
      .demo-guard-actions {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .btn-guard-wa {
        background: #25D366;
        color: #ffffff !important;
        font-size: 0.92rem;
        font-weight: 700;
        padding: 12px 18px;
        border-radius: 12px;
        text-decoration: none !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 6px 18px rgba(37, 211, 102, 0.35);
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
      }
      .btn-guard-wa:hover {
        background: #20ba5a;
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
      }
      .btn-guard-close {
        background: transparent;
        color: #64748b;
        font-size: 0.825rem;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 10px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-guard-close:hover {
        background: #f1f5f9;
        color: #19365f;
      }
      .demo-guard-btn-x {
        position: absolute;
        top: 14px;
        right: 14px;
        background: rgba(25, 54, 95, 0.06);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .demo-guard-btn-x:hover {
        background: rgba(25, 54, 95, 0.12);
        color: #19365f;
      }
    `;
    document.head.appendChild(style);
  }

  // Bangun elemen modal di DOM
  function createModalElement() {
    let backdrop = document.getElementById('demoGuardBackdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'demoGuardBackdrop';
    backdrop.className = 'demo-guard-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    backdrop.innerHTML = `
      <div class="demo-guard-modal" id="demoGuardModal">
        <div class="demo-guard-top-accent"></div>
        <button type="button" class="demo-guard-btn-x" id="demoGuardCloseXBtn" aria-label="Tutup notifikasi">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="demo-guard-body">
          <div class="demo-guard-icon-wrap">
            <div class="demo-guard-icon-pulse"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <div class="demo-guard-badge">
            <span>${demoConfig.BADGE}</span>
          </div>

          <h3 class="demo-guard-title">${demoConfig.TITLE}</h3>
          
          <div class="demo-guard-desc">
            ${demoConfig.DESCRIPTION}
          </div>

          <div class="demo-guard-status-card">
            <div class="demo-guard-status-row">
              <span class="demo-guard-status-label">Status Pengembangan:</span>
              <span class="demo-guard-status-val" style="color: #059669;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Siap Tayang (100% Selesai)
              </span>
            </div>
            <div class="demo-guard-status-row">
              <span class="demo-guard-status-label">Aktivasi Modul:</span>
              <span class="demo-guard-status-val dot-gold" style="color: #b88628;">Menunggu Konfirmasi Deal</span>
            </div>
            <div class="demo-guard-status-row">
              <span class="demo-guard-status-label">Narahubung Developer:</span>
              <span class="demo-guard-status-val" style="font-family: monospace;">${demoConfig.DEVELOPER_WA}</span>
            </div>
          </div>

          <div class="demo-guard-actions">
            <a href="${demoConfig.DEVELOPER_WA_LINK}" target="_blank" rel="noopener noreferrer" class="btn-guard-wa">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.059-1.146-.082-.277-.087-.63-.223-1.077-.417-1.905-.824-3.14-2.766-3.235-2.893-.095-.127-.775-1.03-.775-1.964 0-.934.49-1.393.664-1.583.174-.19.38-.238.507-.238.127 0 .253.002.364.007.119.005.277-.045.433.329.162.388.554 1.349.602 1.446.048.097.08.21.016.337-.063.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.194.198-.083.388.111.19.493.813 1.057 1.316.726.647 1.338.847 1.528.942.19.095.301.079.412-.048.111-.127.475-.555.602-.745.127-.19.254-.159.428-.095.174.063 1.109.523 1.3.618.19.095.317.143.364.222.048.079.048.459-.096.864z"/>
              </svg>
              <span>Hubungi Developer via WhatsApp</span>
            </a>
            
            <button type="button" class="btn-guard-close" id="demoGuardSecondaryBtn">
              ${isFunctionalPage ? '← Kembali ke Halaman Utama' : 'Tutup Notifikasi & Lanjut Lihat Beranda'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Event listener tombol tutup
    const closeBtn = backdrop.querySelector('#demoGuardCloseXBtn');
    const secondaryBtn = backdrop.querySelector('#demoGuardSecondaryBtn');

    function handleDismiss() {
      if (isFunctionalPage) {
        window.location.href = 'index.html';
      } else {
        hideModal();
      }
    }

    closeBtn.addEventListener('click', handleDismiss);
    secondaryBtn.addEventListener('click', handleDismiss);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        handleDismiss();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        handleDismiss();
      }
    });

    return backdrop;
  }

  // Tampilkan Modal
  function showModal() {
    injectStyles();
    const backdrop = createModalElement();
    
    // Pastikan mobile drawer di index.html tertutup jika sedang terbuka
    if (typeof window.toggleMobileNav === 'function') {
      try { window.toggleMobileNav(false); } catch (e) {}
    }

    setTimeout(() => {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
  }

  // Sembunyikan Modal
  function hideModal() {
    const backdrop = document.getElementById('demoGuardBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Inisialisasi saat DOM siap
  function init() {
    injectStyles();

    // 1. Jika di halaman fungsional (pendaftaran/admin), langsung kunci saat load
    if (isFunctionalPage) {
      showModal();
      return;
    }

    // 2. Jika di landing page, pasang delegasi klik pada semua link & tombol pendaftaran / admin
    document.addEventListener('click', function (e) {
      const targetAnchor = e.target.closest('a');
      const targetBtn = e.target.closest('button');

      // Periksa tautan anchor
      if (targetAnchor) {
        const rawHref = targetAnchor.getAttribute('href') || '';
        const href = rawHref.trim().toLowerCase();

        // Abaikan link eksternal (misalnya WhatsApp panitia, telpon, email, media sosial)
        if (href.startsWith('https://wa.me') || 
            href.startsWith('https://api.whatsapp.com') || 
            href.startsWith('http://wa.me') || 
            href.startsWith('tel:') || 
            href.startsWith('mailto:')) {
          return;
        }

        // Cek apakah mengarah ke fitur fungsional
        const isTargetFunctional = href.includes('pendaftaran.html') ||
                                   href.includes('formpendaftaran.html') ||
                                   href.includes('admin.html') ||
                                   href.includes('login.html') ||
                                   href.startsWith('pendaftaran') ||
                                   href.startsWith('/pendaftaran') ||
                                   href.startsWith('admin') ||
                                   href.startsWith('/admin') ||
                                   href === '#status' ||
                                   href.endsWith('#status');

        if (isTargetFunctional) {
          e.preventDefault();
          e.stopPropagation();
          showModal();
          return false;
        }
      }

      // Periksa button yang memiliki atribut atau ID pendaftaran/status
      if (targetBtn && !targetBtn.closest('#demoGuardModal')) {
        const btnId = (targetBtn.id || '').toLowerCase();
        const btnClass = (targetBtn.className || '').toLowerCase();
        if (btnId.includes('pendaftaran') || btnClass.includes('btn-pendaftaran')) {
          e.preventDefault();
          e.stopPropagation();
          showModal();
          return false;
        }
      }
    }, true); // Use capture phase to intercept reliably
  }

  // Jalankan inisialisasi
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Ekspor API ke window jika sewaktu-waktu dipanggil manual
  window.DEMO_GUARD = {
    show: showModal,
    hide: hideModal
  };

})();
