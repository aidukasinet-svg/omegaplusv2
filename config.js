/**
 * =========================================================================
 * KONFIGURASI GLOBAL FRONTEND - OMEGA PLUS 2026
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: config.js
 */

const CONFIG = {
  // Bila di-deploy di Cloudflare Pages, gunakan '/api' (diteruskan via _worker.js)
  // Bila dibuka secara lokal (file://), gunakan URL langsung Google Apps Script Web App
  API_URL: window.location.protocol === 'file:' 
    ? 'https://script.google.com/macros/s/AKfycbwsvjH5vK-g5UJF0sI4knpOal8jdGzYC6Z82lP0ecXW2yWGA4wIKmtoa4YRNXgz-g13vg/exec' 
    : '/api',

  // Informasi Event dari Brosur & Keputusan Resmi
  EVENT_NAME: "OMEGA PLUS 2026",
  SUBTITLE: "Olimpiade Matematika, Bahasa Inggris, IPA, dan IPS",
  ORGANIZER: "SMP Negeri 1 Pamekasan",
  TAGLINE: "Semangat berprestasi, raih tiket emas kelas unggulan! ✦",
  TARGET: "Tingkat SD/MI Sederajat Se-Madura",
  BIAYA_DAFTAR: 40000,

  // Rekening Pembayaran Resmi Klien (BCA Norma Dewi)
  BANK_NAME: "Bank BCA",
  NO_REKENING: "1921605205",
  ATAS_NAMA: "Norma Dewi",
  REKENING_PEMBAYARAN: "BCA 1921605205 a.n Norma Dewi",

  // Konfigurasi 30 Ruang Kelas Ujian
  TOTAL_RUANG_KELAS: 30,

  // Narahubung Resmi (Sesuai Brosur)
  CONTACTS: [
    { name: "Bapak Rasyidi", phone: "087781587155", wa: "6287781587155" },
    { name: "Bapak Indra", phone: "085259349169", wa: "6285259349169" },
    { name: "Ibu Dwi Elly", phone: "081235922003", wa: "6281235922003" }
  ],

  // Jadwal Sesi Lomba (Sesuai Brosur)
  SESI: [
    { sesi: "Sesi 1", mapel: "IPA & IPS", waktu: "07.30 - 08.30 WIB" },
    { sesi: "Sesi 2", mapel: "Matematika & Bahasa Inggris", waktu: "09.00 - 10.00 WIB" }
  ],

  // Konfigurasi Status Demo & Proteksi Negosiasi Proyek
  DEMO_MODE: {
    LOCKED: false, // Disetel false agar sistem langsung aktif fungsional
    DEVELOPER_WA: "088228511309",
    DEVELOPER_WA_LINK: "https://wa.me/6288228511309?text=" + encodeURIComponent("Halo Developer OMEGA PLUS 2026, kami dari pihak panitia/sekolah ingin konfirmasi mengenai kelanjutan proyek dan aktivasi penuh sistem pendaftaran website."),
    BADGE: "PREVIEW EKSKLUSIF SISTEM",
    TITLE: "Sistem Pendaftaran Siap Diaktifkan",
    DESCRIPTION: "Portal Pendaftaran Online, Cek Status Real-time, dan Dashboard Verifikasi Peserta OMEGA PLUS 2026 telah selesai dikembangkan dan saat ini dalam status <strong>Preview Terbatas</strong>.<br><br>Akses penuh ke formulir dan database akan langsung diaktifkan segera setelah konfirmasi kesepakatan kerjasama (deal) dengan pihak sekolah/panitia difinalisasi."
  }
};

// Ekspor ke window agar dapat diakses oleh index.html dan admin.html
window.APP_CONFIG = CONFIG;
