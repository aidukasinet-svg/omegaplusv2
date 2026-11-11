/**
 * Modul Logika Bisnis Murni untuk Demo Guard & Sistem Aktivasi Proyek
 * Diekstrak dari demo-guard.js untuk isolasi pengujian unit (Unit Testing)
 */

export const DEFAULT_DEMO_CONFIG = {
  LOCKED: true,
  DEVELOPER_WA: "088228511309",
  DEVELOPER_WA_LINK: "https://wa.me/6288228511309?text=" + encodeURIComponent("Halo Developer OMEGA PLUS 2026, kami dari pihak panitia/sekolah ingin konfirmasi mengenai kelanjutan proyek dan aktivasi penuh sistem pendaftaran website."),
  BADGE: "PREVIEW EKSKLUSIF SISTEM",
  TITLE: "Sistem Pendaftaran Siap Diaktifkan",
  DESCRIPTION: "Portal Pendaftaran Online, Cek Status Real-time, dan Dashboard Verifikasi Peserta OMEGA PLUS 2026 telah selesai dikembangkan dan saat ini dalam status <strong>Preview Terbatas</strong>.<br><br>Akses penuh ke formulir dan database akan langsung diaktifkan segera setelah konfirmasi kesepakatan kerjasama (deal) dengan pihak sekolah/panitia difinalisasi."
};

/**
 * Mengecek apakah mode demo aktif (terkunci)
 * @param {object} [appConfig] Objek konfigurasi global (misal: window.APP_CONFIG)
 * @returns {boolean}
 */
export function isDemoLocked(appConfig = (typeof window !== 'undefined' ? window.APP_CONFIG : undefined)) {
  if (!appConfig || typeof appConfig !== 'object') {
    return true; // Default aman: terkunci jika konfigurasi tidak ada
  }
  if (!appConfig.DEMO_MODE || typeof appConfig.DEMO_MODE !== 'object') {
    return true;
  }
  return Boolean(appConfig.DEMO_MODE.LOCKED);
}

/**
 * Memeriksa apakah suatu string URL / pathname merupakan halaman fungsional
 * @param {string} pathOrHref
 * @returns {boolean}
 */
export function isFunctionalPageUrl(pathOrHref) {
  if (typeof pathOrHref !== 'string') return false;
  const target = pathOrHref.toLowerCase().trim();
  if (!target) return false;

  const functionalKeywords = [
    'pendaftaran.html',
    'formpendaftaran.html',
    'admin.html',
    'login.html',
    'pendaftaran',
    'admin',
    'login'
  ];

  return functionalKeywords.some(keyword => target.includes(keyword));
}

/**
 * Memeriksa apakah halaman browser saat ini adalah halaman fungsional
 * @param {object} [locationObj] Objek window.location (dapat di-mock)
 * @returns {boolean}
 */
export function checkCurrentPageIsFunctional(locationObj = (typeof window !== 'undefined' ? window.location : undefined)) {
  if (!locationObj) return false;
  const path = String(locationObj.pathname || '');
  const href = String(locationObj.href || '');
  return isFunctionalPageUrl(path) || isFunctionalPageUrl(href);
}

/**
 * Memeriksa apakah sebuah link anchor (href) mengarah ke fitur fungsional yang harus diintersepsi
 * @param {string} rawHref
 * @returns {boolean}
 */
export function isRestrictedActionLink(rawHref) {
  if (typeof rawHref !== 'string') return false;
  const href = rawHref.trim().toLowerCase();
  if (!href) return false;

  // Abaikan link eksternal (WhatsApp panitia, telpon, email)
  const isExternal = [
    'https://wa.me',
    'https://api.whatsapp.com',
    'http://wa.me',
    'tel:',
    'mailto:'
  ].some(proto => href.startsWith(proto));

  if (isExternal) return false;

  // Cek apakah mengarah ke halaman atau anchor fitur fungsional
  return (
    href.includes('pendaftaran.html') ||
    href.includes('formpendaftaran.html') ||
    href.includes('admin.html') ||
    href.includes('login.html') ||
    href.startsWith('pendaftaran') ||
    href.startsWith('/pendaftaran') ||
    href.startsWith('admin') ||
    href.startsWith('/admin') ||
    href === '#status' ||
    href.endsWith('#status')
  );
}

/**
 * Membuat tautan WhatsApp developer dengan nomor dan pesan kustom
 * @param {string} phone
 * @param {string} customText
 * @returns {string}
 */
export function generateDeveloperWaLink(phone, customText) {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const textParam = encodeURIComponent(customText || '');
  return `https://wa.me/${waNumber}?text=${textParam}`;
}

/**
 * Menentukan perilaku saat modal demo guard ditutup
 * @param {boolean} isFunctional Apakah sedang berada di halaman fungsional
 * @returns {{ action: 'redirect' | 'hide', target: string | null }}
 */
export function getDismissBehavior(isFunctional) {
  if (isFunctional) {
    return {
      action: 'redirect',
      target: 'index.html'
    };
  }
  return {
    action: 'hide',
    target: null
  };
}

/**
 * Membaca status dismiss dari localStorage (jika fitur remember dismiss diaktifkan)
 * @param {Storage} [storage] Objek localStorage (dapat di-mock)
 * @returns {boolean}
 */
export function getDemoDismissedStatus(storage = (typeof window !== 'undefined' ? window.localStorage : undefined)) {
  if (!storage || typeof storage.getItem !== 'function') return false;
  return storage.getItem('omega_demo_dismissed') === 'true';
}

/**
 * Menyimpan status dismiss ke localStorage
 * @param {boolean} dismissed
 * @param {Storage} [storage] Objek localStorage (dapat di-mock)
 * @returns {boolean}
 */
export function setDemoDismissedStatus(dismissed, storage = (typeof window !== 'undefined' ? window.localStorage : undefined)) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  if (dismissed) {
    storage.setItem('omega_demo_dismissed', 'true');
  } else if (typeof storage.removeItem === 'function') {
    storage.removeItem('omega_demo_dismissed');
  }
  return true;
}

/**
 * Mendapatkan konfigurasi demo guard lengkap dengan fallback aman
 * @param {object} [appConfig] Objek APP_CONFIG
 * @returns {typeof DEFAULT_DEMO_CONFIG}
 */
export function resolveDemoConfig(appConfig = (typeof window !== 'undefined' ? window.APP_CONFIG : undefined)) {
  const merged = { ...DEFAULT_DEMO_CONFIG };
  if (appConfig?.DEMO_MODE && typeof appConfig.DEMO_MODE === 'object') {
    Object.assign(merged, appConfig.DEMO_MODE);
  }
  return merged;
}

export default {
  DEFAULT_DEMO_CONFIG,
  isDemoLocked,
  isFunctionalPageUrl,
  checkCurrentPageIsFunctional,
  isRestrictedActionLink,
  generateDeveloperWaLink,
  getDismissBehavior,
  getDemoDismissedStatus,
  setDemoDismissedStatus,
  resolveDemoConfig
};

