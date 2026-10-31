/**
 * =========================================================================
 * BACKEND SISTEM PENDAFTARAN OLIMPIADE OMEGA PLUS (TURBO HIGH-SCALE EDITION)
 * SMP NEGERI 1 PAMEKASAN - SE-MADURA
 * =========================================================================
 * File: Code.gs (Refactored for Client Specifications: Direct Form, 30 Rooms,
 * Dual Role PIN: Panitia vs Super Admin, BCA Norma Dewi, and Drive Upload)
 * =========================================================================
 */

var SPREADSHEET_ID = "1SPCZkf-gtaBZ2z6fi6XF-CS3a4g_A5cdllwYeZOIFf6G0Xl2fcqDGY8c-"; 

var SHEET_NAMES = {
  PESERTA: "PESERTA",
  PENGATURAN: "PENGATURAN"
};

// --- MENU SETUP UNTUK GOOGLE SHEETS WORKSPACE ---
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("✦ OMEGA PLUS 2026")
    .addItem("Inisialisasi Database Baru", "setupDatabase")
    .addItem("Hitung Ulang Counter & Statistik", "recalculateCountersAndStats")
    .addSeparator()
    .addItem("Buka Portal Web Resmi", "openWebPortalDialog")
    .addToUi();
}

function openWebPortalDialog() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family: Arial, sans-serif; padding: 15px; text-align: center;">' +
    '  <h3 style="color: #19365f; margin-top: 0;">Portal Panitia OMEGA PLUS 2026</h3>' +
    '  <p style="color: #475569; font-size: 13px;">Akses formulir pendaftaran langsung dan dashboard realtime melalui tautan di bawah ini:</p>' +
    '  <div style="margin: 20px 0;">' +
    '    <a href="https://omegaplus.pages.dev" target="_blank" style="background: #285891; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Buka omegaplus.pages.dev &rarr;</a>' +
    '  </div>' +
    '</div>'
  ).setWidth(380).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(html, "Portal Web OMEGA PLUS");
}

/**
 * 1. FUNGSI OTOMATISASI SETUP DATABASE & INISIALISASI COUNTER
 */
function setupDatabase() {
  try {
    var ss;
    var props = PropertiesService.getScriptProperties();
    var savedId = props.getProperty("SPREADSHEET_ID") || SPREADSHEET_ID;

    if (savedId) {
      try {
        ss = SpreadsheetApp.openById(savedId);
        Logger.log("Menggunakan Spreadsheet yang ada: " + ss.getUrl());
      } catch (e) {
        ss = null;
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create("DATABASE_OMEGA_PLUS_2026");
      props.setProperty("SPREADSHEET_ID", ss.getId());
      Logger.log("BERHASIL MEMBUAT DATABASE BARU: " + ss.getUrl());
    } else {
      props.setProperty("SPREADSHEET_ID", ss.getId());
    }

    // --- SHEET 1: PESERTA ---
    var sheetPeserta = getOrCreateSheet(ss, SHEET_NAMES.PESERTA);
    var headersPeserta = [
      "Timestamp",
      "No_Pendaftaran",
      "Nama_Peserta",
      "Asal_Sekolah",
      "Alamat_Sekolah",
      "No_HP_Guru",
      "Level",
      "Mata_Pelajaran",
      "Kode_Peserta",
      "Ruang_Kelas",
      "Bukti_Transfer_Url",
      "Status_Verifikasi",
      "Catatan_Panitia",
      "Waktu_Verifikasi"
    ];
    styleHeader(sheetPeserta, headersPeserta, "#19365f", "#ffffff");

    // --- SHEET 2: PENGATURAN ---
    var sheetPengaturan = getOrCreateSheet(ss, SHEET_NAMES.PENGATURAN);
    var headersPengaturan = ["Parameter", "Nilai", "Keterangan"];
    styleHeader(sheetPengaturan, headersPengaturan, "#285891", "#ffffff");

    var defaultSettings = [
      ["Nama_Event", "OMEGA PLUS 2026", "Nama resmi olimpiade"],
      ["Penyelenggara", "SMP Negeri 1 Pamekasan", "Sekolah penyelenggara"],
      ["Tahun", "2026", "Tahun pelaksanaan"],
      ["Admin_PIN", "8899", "PIN Super Admin (Full Access: verifikasi, edit, hapus, export)"],
      ["Panitia_PIN", "2026", "PIN Panitia / Pengawas (View-Only: lihat data, filter ruang, cetak absen)"],
      ["Biaya_Pendaftaran", "50000", "Biaya pendaftaran per peserta (Rupiah)"],
      ["Rekening_Pembayaran", "BCA 1921605205 a.n Norma Dewi", "Rekening resmi transfer bank panitia"],
      ["Total_Ruang_Kelas", "30", "Jumlah kapasitas ruang kelas ujian yang disediakan"],
      ["Kontak_1", "087781587155 (Bapak Rasyidi)", "Narahubung 1"],
      ["Kontak_2", "085259349169 (Bapak Indra)", "Narahubung 2"],
      ["Kontak_3", "081235922003 (Ibu Dwi Elly)", "Narahubung 3"],
      ["Status_Pendaftaran", "BUKA", "Status form pendaftaran (BUKA / TUTUP)"],
      ["Sesi_1", "IPA & IPS (07.30 - 08.30 WIB)", "Jadwal Ujian Sesi 1"],
      ["Sesi_2", "Matematika & Bahasa Inggris (09.00 - 10.00 WIB)", "Jadwal Ujian Sesi 2"]
    ];

    if (sheetPengaturan.getLastRow() <= 1) {
      sheetPengaturan.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
      sheetPengaturan.autoResizeColumns(1, 3);
    }

    // Sinkronisasi paksa
    SpreadsheetApp.flush();

    // Hitung ulang statistik
    recalculateCountersAndStats(ss);

    Logger.log("SETUP DATABASE BARU SELESAI: " + ss.getUrl());
    return {
      status: "success",
      message: "Setup database OMEGA PLUS 2026 berhasil",
      spreadsheetId: ss.getId(),
      url: ss.getUrl()
    };
  } catch (err) {
    Logger.log("Error setupDatabase: " + err.toString());
    return {
      status: "error",
      message: "Gagal inisialisasi database: " + err.toString()
    };
  }
}

/**
 * Helper untuk mendapatkan atau membuat Sheet
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper styling header sheet
 */
function styleHeader(sheet, headers, bgColor, textColor) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor)
             .setFontColor(textColor)
             .setFontWeight("bold")
             .setFontFamily("Arial")
             .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Mendapatkan referensi Google Spreadsheet aktif
 */
function getDatabase() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID") || SPREADSHEET_ID;
  if (!id) {
    setupDatabase();
    id = props.getProperty("SPREADSHEET_ID");
  }
  return SpreadsheetApp.openById(id);
}

/**
 * HITUNG ULANG COUNTER & STATISTIK REALTIME
 */
function recalculateCountersAndStats(ss) {
  if (!ss) ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();

  var counters = { master: 0 };
  for (var r = 1; r <= 30; r++) {
    var rKey = "Ruang " + padZero(r, 2);
    counters[rKey] = 0;
  }

  var stats = {
    total: 0,
    level1: 0,
    level2: 0,
    matematika: 0,
    bahasaInggris: 0,
    ipa: 0,
    ips: 0,
    verified: 0,
    pending: 0
  };

  if (lastRow > 1) {
    // Ambil kolom No_Pendaftaran (B/2) s/d Status (L/12) -> 11 kolom (indeks 0..10)
    var range = sheet.getRange(2, 2, lastRow - 1, 11).getValues();
    stats.total = range.length;
    var maxMaster = 0;

    for (var i = 0; i < range.length; i++) {
      var noReg = String(range[i][0] || "");
      var m = noReg.match(/(\d+)$/);
      if (m) {
        var num = parseInt(m[1], 10);
        if (num > maxMaster) maxMaster = num;
      }

      var lvl = String(range[i][5] || "");
      var mapel = String(range[i][6] || "");
      var ruang = String(range[i][8] || "");
      var status = String(range[i][10] || "");

      if (lvl.indexOf("1") !== -1) stats.level1++;
      if (lvl.indexOf("2") !== -1) stats.level2++;

      if (mapel.indexOf("Matematika") !== -1) stats.matematika++;
      if (mapel.indexOf("Bahasa Inggris") !== -1) stats.bahasaInggris++;
      if (mapel.indexOf("IPA") !== -1) stats.ipa++;
      if (mapel.indexOf("IPS") !== -1) stats.ips++;

      if (status === "Terverifikasi" || status === "Lunas") stats.verified++;
      else stats.pending++;

      if (ruang && counters[ruang] !== undefined) {
        counters[ruang]++;
      }
    }
    counters.master = Math.max(range.length, maxMaster);
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));
  props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));

  var cache = CacheService.getScriptCache();
  cache.put("DASHBOARD_STATS", JSON.stringify(stats), 21600); // 6 jam cache
  Logger.log("Counters & Stats terbarui: " + JSON.stringify(stats));
}

/**
 * 2. ROUTER GET
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var result = {};

  try {
    switch (action) {
      case "ping":
        result = { status: "success", message: "API OMEGA PLUS Aktif & Siap", timestamp: new Date() };
        break;

      case "getPublicConfig":
        result = handleGetPublicConfig();
        break;

      case "getDashboardStats":
        result = handleGetDashboardStats();
        break;

      case "getPesertaList":
        result = handleGetPesertaList(e.parameter);
        break;

      case "cekStatus":
        var keyword = (e && e.parameter) ? (e.parameter.keyword || e.parameter.q || "") : "";
        result = handleCekStatus(keyword);
        break;

      case "recalc":
        var recalcAuth = handleVerifyDualPin(e && e.parameter ? e.parameter.pin : "");
        if (!recalcAuth.authorized || recalcAuth.role !== "super_admin") {
          result = { status: "error", message: "Akses ditolak: PIN Super Admin diperlukan." };
          break;
        }
        recalculateCountersAndStats();
        result = { status: "success", message: "Statistik berhasil dihitung ulang dari data sheet" };
        break;

      default:
        result = { status: "error", message: "Aksi GET '" + action + "' tidak dikenali" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. ROUTER POST
 */
function doPost(e) {
  var result = {};
  try {
    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else {
      payload = e.parameter || {};
    }

    var action = payload.action;

    switch (action) {
      case "daftarPeserta":
      case "registerPeserta":
        result = handleDaftarPesertaTurbo(payload);
        break;

      case "verifyAdminPin":
        result = handleVerifyDualPin(payload.pin);
        break;

      case "getPesertaList":
        result = handleGetPesertaList(payload);
        break;

      case "verifikasiPeserta":
        result = handleVerifikasiPeserta(payload);
        break;

      case "updatePeserta":
        result = handleUpdatePeserta(payload);
        break;

      case "deletePeserta":
        result = handleDeletePeserta(payload);
        break;

      default:
        result = { status: "error", message: "Aksi POST '" + action + "' tidak dikenali" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mengambil Pengaturan Publik (Dengan Cache)
 */
function handleGetPublicConfig() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("PUBLIC_CONFIG");
  if (cached) {
    return { status: "success", data: JSON.parse(cached) };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    config[key] = val;
  }

  cache.put("PUBLIC_CONFIG", JSON.stringify(config), 21600);
  return { status: "success", data: config };
}

/**
 * DUAL-ROLE AUTHENTICATION: PANITIA (VIEW-ONLY) VS SUPER ADMIN (FULL ACCESS)
 */
function handleVerifyDualPin(inputPin) {
  var pinStr = String(inputPin || "").trim();
  if (!pinStr) {
    return { status: "error", authorized: false, message: "PIN tidak boleh kosong!" };
  }

  var props = PropertiesService.getScriptProperties();
  var savedAdminPin = props.getProperty("ADMIN_PIN") || "8899";
  var savedPanitiaPin = props.getProperty("PANITIA_PIN") || "2026";

  // Cek langsung kecocokan
  if (pinStr === savedAdminPin) {
    return {
      status: "success",
      authorized: true,
      role: "super_admin",
      roleLabel: "Super Admin (Akses Penuh)",
      message: "Autentikasi Super Admin Berhasil"
    };
  }

  if (pinStr === savedPanitiaPin) {
    return {
      status: "success",
      authorized: true,
      role: "panitia",
      roleLabel: "Panitia / Pengawas (Lihat Saja)",
      message: "Autentikasi Panitia Berhasil"
    };
  }

  // Fallback: reload dari Sheet Pengaturan bila ada perubahan manual
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "Admin_PIN") {
        savedAdminPin = String(data[i][1]).trim();
        props.setProperty("ADMIN_PIN", savedAdminPin);
      }
      if (data[i][0] === "Panitia_PIN") {
        savedPanitiaPin = String(data[i][1]).trim();
        props.setProperty("PANITIA_PIN", savedPanitiaPin);
      }
    }

    if (pinStr === savedAdminPin) {
      return { status: "success", authorized: true, role: "super_admin", roleLabel: "Super Admin (Akses Penuh)", message: "Autentikasi Super Admin Berhasil" };
    }
    if (pinStr === savedPanitiaPin) {
      return { status: "success", authorized: true, role: "panitia", roleLabel: "Panitia / Pengawas (Lihat Saja)", message: "Autentikasi Panitia Berhasil" };
    }
  } catch (e) {
    // Ignore fallback error
  }

  return {
    status: "error",
    authorized: false,
    message: "PIN Keamanan tidak sesuai!"
  };
}

/**
 * 4. LOGIKA PENDAFTARAN TURBO DENGAN PEMBAGIAN 30 KELAS & UPLOAD DRIVE
 */
function handleDaftarPesertaTurbo(data) {
  try {
    var pubCfg = handleGetPublicConfig();
    if (pubCfg && pubCfg.data && String(pubCfg.data.Status_Pendaftaran || "").trim().toUpperCase() === "TUTUP") {
      return { status: "error", message: "Mohon maaf, pendaftaran OMEGA PLUS 2026 saat ini sedang ditutup oleh panitia." };
    }

    var nama = String(data.nama || "").trim().toUpperCase();
    var sekolah = String(data.sekolah || "").trim().toUpperCase();
    var alamatSekolah = String(data.alamatSekolah || "").trim();
    var noHpGuru = String(data.noHpGuru || data.noHp || "").trim();
    var level = String(data.level || "").trim();
    var mapel = String(data.mapel || "").trim();

    if (!nama || !sekolah || !noHpGuru || !level || !mapel) {
      return { status: "error", message: "Mohon lengkapi seluruh isian formulir yang bertanda bintang (*)" };
    }

    if (!data.buktiBase64) {
      return { status: "error", message: "Bukti transfer pembayaran wajib diunggah!" };
    }

    // 1. Upload Bukti Transfer ke Google Drive di luar lock agar tidak menahan antrean
    var buktiTransferUrl = "-";
    var driveFile = null;
    try {
      var folderName = "BUKTI_TRANSFER_OMEGA_2026";
      var folders = DriveApp.getFoldersByName(folderName);
      var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      var base64Data = String(data.buktiBase64);
      var mimeType = data.buktiMimeType || "image/jpeg";
      var cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9\/\-+.]+;base64,/, '');
      var decodedBytes = Utilities.base64Decode(cleanBase64);
      var ext = mimeType.indexOf("png") !== -1 ? ".png" : (mimeType.indexOf("pdf") !== -1 ? ".pdf" : ".jpg");
      var tempFileName = "BUKTI_" + nama.replace(/[^A-Z0-9]/g, "_").slice(0, 20) + "_" + new Date().getTime() + ext;

      var blob = Utilities.newBlob(decodedBytes, mimeType, tempFileName);
      driveFile = targetFolder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      buktiTransferUrl = driveFile.getUrl();
    } catch (uploadErr) {
      Logger.log("Gagal upload Drive: " + uploadErr.toString());
      return { status: "error", message: "Gagal mengunggah file bukti transfer ke Google Drive. Silakan coba lagi." };
    }

    // 2. Lock eksekusi untuk penomoran & penulisan baris ke Sheet PESERTA secara atomik
    var lock = LockService.getScriptLock();
    lock.waitLock(25000);

    var noPendaftaran = "";
    var kodePeserta = "";
    var ruangKelas = "";
    var roomNum = 1;
    var timestamp = new Date();
    var statusVerif = "Menunggu Verifikasi";

    try {
      var props = PropertiesService.getScriptProperties();
      var countersRaw = props.getProperty("OMEGA_COUNTERS");
      var counters = countersRaw ? JSON.parse(countersRaw) : null;

      if (!counters || typeof counters.master !== "number") {
        recalculateCountersAndStats();
        counters = JSON.parse(props.getProperty("OMEGA_COUNTERS"));
      }

      // Increment Master Sequence Number
      counters.master = (counters.master || 0) + 1;
      var curNum = counters.master;
      var num4Str = padZero(curNum, 4);

      // Alokasi Otomatis 30 Ruang Kelas Ujian (Ruang 01 s/d Ruang 30 secara berurutan)
      roomNum = ((curNum - 1) % 30) + 1;
      var room2Str = padZero(roomNum, 2);
      ruangKelas = "Ruang " + room2Str;

      // Format Kode Peserta Baku Permintaan Klien:
      // omega 0001-kode level-kelas -2026 (contoh: omega-0001-L1-01-2026)
      var levelCode = (level.indexOf("1") !== -1) ? "L1" : "L2";
      kodePeserta = "omega-" + num4Str + "-" + levelCode + "-" + room2Str + "-2026";
      noPendaftaran = "OMP-2026-" + num4Str;

      // Tulis Atomic Single-Row ke Sheet PESERTA di dalam lock
      var ss = getDatabase();
      var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);

      sheet.appendRow([
        timestamp,
        noPendaftaran,
        sanitizeSheetCell(nama),
        sanitizeSheetCell(sekolah),
        sanitizeSheetCell(alamatSekolah),
        sanitizeSheetCell(noHpGuru),
        sanitizeSheetCell(level),
        sanitizeSheetCell(mapel),
        kodePeserta,
        ruangKelas,
        buktiTransferUrl,
        statusVerif,
        "Pendaftaran via Web Portal Resmi",
        "-"
      ]);

      SpreadsheetApp.flush();

      // Update counter ruang & simpan setelah appendRow sukses
      counters[ruangKelas] = (counters[ruangKelas] || 0) + 1;
      props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));

      // Update Dashboard Stats Memory
      var statsRaw = props.getProperty("DASHBOARD_STATS");
      var stats = statsRaw ? JSON.parse(statsRaw) : { total: 0, level1: 0, level2: 0, matematika: 0, bahasaInggris: 0, ipa: 0, ips: 0, verified: 0, pending: 0 };
      stats.total = (stats.total || 0) + 1;
      if (levelCode === "L1") stats.level1++; else stats.level2++;
      if (mapel.indexOf("Matematika") !== -1) stats.matematika++;
      if (mapel.indexOf("Bahasa Inggris") !== -1) stats.bahasaInggris++;
      if (mapel.indexOf("IPA") !== -1) stats.ipa++;
      if (mapel.indexOf("IPS") !== -1) stats.ips++;
      stats.pending++;

      props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));
      CacheService.getScriptCache().put("DASHBOARD_STATS", JSON.stringify(stats), 21600);
    } finally {
      lock.releaseLock();
    }

    // Rename file Drive sesuai kode peserta (opsional, di luar lock)
    if (driveFile && kodePeserta) {
      try {
        var extFinal = (data.buktiMimeType || "").indexOf("png") !== -1 ? ".png" : ((data.buktiMimeType || "").indexOf("pdf") !== -1 ? ".pdf" : ".jpg");
        driveFile.setName("BUKTI_" + kodePeserta + extFinal);
      } catch (e) {}
    }

    return {
      status: "success",
      message: "Pendaftaran OMEGA PLUS 2026 berhasil disimpan!",
      data: {
        noPendaftaran: noPendaftaran,
        nama: nama,
        sekolah: sekolah,
        alamatSekolah: alamatSekolah,
        noHpGuru: noHpGuru,
        level: level,
        mapel: mapel,
        kodePeserta: kodePeserta,
        ruangKelas: ruangKelas,
        buktiTransferUrl: buktiTransferUrl,
        statusVerifikasi: statusVerif,
        timestamp: Utilities.formatDate(timestamp, "Asia/Jakarta", "dd MMMM yyyy HH:mm:ss")
      }
    };
  } catch (err) {
    Logger.log("Error handleDaftarPesertaTurbo: " + err.toString());
    return {
      status: "error",
      message: "Gagal memproses pendaftaran: " + err.toString()
    };
  }
}

/**
 * 5. GET DASHBOARD STATS (ZERO SPREADSHEET READS)
 */
function handleGetDashboardStats() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("DASHBOARD_STATS");
  if (cached) {
    return { status: "success", source: "cache", data: JSON.parse(cached) };
  }

  var props = PropertiesService.getScriptProperties();
  var statsRaw = props.getProperty("DASHBOARD_STATS");
  if (statsRaw) {
    cache.put("DASHBOARD_STATS", statsRaw, 21600);
    return { status: "success", source: "properties", data: JSON.parse(statsRaw) };
  }

  recalculateCountersAndStats();
  statsRaw = props.getProperty("DASHBOARD_STATS");
  return { status: "success", source: "calculated", data: JSON.parse(statsRaw) };
}

/**
 * 6. GET PESERTA LIST DENGAN FILTER RUANG, LEVEL, MAPEL & SEARCH
 */
function handleGetPesertaList(params) {
  var auth = handleVerifyDualPin(params ? params.pin : "");
  if (!auth.authorized) {
    return { status: "error", message: "Akses ditolak: PIN Panitia atau Super Admin tidak valid." };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { status: "success", total: 0, data: [] };
  }

  var limit = (params && params.limit) ? parseInt(params.limit, 10) : 5000;
  var startRow = Math.max(2, lastRow - limit + 1);
  var numRows = lastRow - startRow + 1;

  // Baca 14 kolom lengkap
  var dataRange = sheet.getRange(startRow, 1, numRows, 14).getValues();
  var list = [];

  var filterLevel = params ? params.level : "";
  var filterMapel = params ? params.mapel : "";
  var filterRuang = params ? params.ruang : "";
  var filterStatus = params ? params.status : "";
  var search = params ? String(params.search || "").toLowerCase() : "";

  // Loop mundur dari pendaftar paling baru
  for (var i = dataRange.length - 1; i >= 0; i--) {
    var r = dataRange[i];
    if (!r[1]) continue;

    var noReg = String(r[1]);
    var nama = String(r[2]);
    var sekolah = String(r[3]);
    var alamatSekolah = String(r[4] || "");
    var noHpGuru = String(r[5] || "");
    var level = String(r[6] || "");
    var mapel = String(r[7] || "");
    var kodePeserta = String(r[8] || "");
    var ruangKelas = String(r[9] || "");
    var buktiUrl = String(r[10] || "");
    var status = String(r[11] || "");
    var catatan = String(r[12] || "");
    var waktuVerif = String(r[13] || "");

    if (filterLevel && filterLevel !== "Semua" && level.indexOf(filterLevel) === -1) continue;
    if (filterMapel && filterMapel !== "Semua" && mapel.indexOf(filterMapel) === -1) continue;
    if (filterRuang && filterRuang !== "Semua" && ruangKelas !== filterRuang) continue;
    if (filterStatus && filterStatus !== "Semua" && status !== filterStatus) continue;

    if (search) {
      var searchContent = (noReg + " " + nama + " " + sekolah + " " + alamatSekolah + " " + noHpGuru + " " + kodePeserta + " " + ruangKelas).toLowerCase();
      if (searchContent.indexOf(search) === -1) continue;
    }

    list.push({
      noPendaftaran: noReg,
      nama: nama,
      sekolah: sekolah,
      alamatSekolah: alamatSekolah,
      noHpGuru: noHpGuru,
      level: level,
      mataPelajaran: mapel,
      kodePeserta: kodePeserta,
      ruangKelas: ruangKelas,
      buktiTransferUrl: buktiUrl,
      status: status,
      catatan: catatan,
      waktuVerifikasi: waktuVerif
    });
  }

  return { status: "success", total: list.length, data: list };
}

/**
 * 7. CEK STATUS PENDAFTARAN MANDIRI (Nomor Pendaftaran / HP Guru / Kode Peserta)
 */
function handleCekStatus(keyword) {
  if (!keyword) {
    return { status: "error", message: "Silakan masukkan Nomor Pendaftaran, Nomor WhatsApp Guru, atau Kode Peserta!" };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { status: "error", message: "Belum ada data pendaftaran yang tersimpan di sistem." };
  }

  var query = String(keyword).trim().toLowerCase();
  var dataRange = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
  var results = [];

  for (var i = dataRange.length - 1; i >= 0; i--) {
    var r = dataRange[i];
    var noReg = String(r[1]).toLowerCase();
    var nama = String(r[2]).toLowerCase();
    var noHpGuru = String(r[5]).toLowerCase();
    var kodePeserta = String(r[8]).toLowerCase();

    if (noReg === query || noHpGuru === query || kodePeserta === query || (query.length >= 4 && nama.indexOf(query) !== -1)) {
      results.push({
        noPendaftaran: r[1],
        nama: r[2],
        sekolah: r[3],
        alamatSekolah: r[4],
        noHpGuru: r[5],
        level: r[6],
        mataPelajaran: r[7],
        kodePeserta: r[8],
        ruangKelas: r[9],
        buktiTransferUrl: r[10],
        status: r[11],
        catatan: r[12]
      });
      if (results.length >= 5) break; // Maksimal 5 hasil jika pencarian nama
    }
  }

  if (results.length === 0) {
    return { status: "error", message: "Data tidak ditemukan. Pastikan Nomor Pendaftaran, No. WhatsApp Guru, atau Kode Peserta sudah sesuai." };
  }

  return { status: "success", data: results };
}

/**
 * 8. VERIFIKASI PESERTA (Super Admin Action)
 */
function handleVerifikasiPeserta(payload) {
  try {
    var auth = handleVerifyDualPin(payload ? payload.pin : "");
    if (!auth.authorized || auth.role !== "super_admin") {
      return { status: "error", message: "Akses ditolak: Hanya Super Admin yang berhak memverifikasi peserta." };
    }

    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noPendaftaran = String(payload.noPendaftaran || "").trim();
    var statusBaru = payload.status || "Lunas";
    var catatan = payload.catatan || "Telah diverifikasi sah oleh Panitia OMEGA PLUS 2026";

    if (!noPendaftaran) {
      return { status: "error", message: "Nomor pendaftaran wajib disertakan!" };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRow = -1;

    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noPendaftaran) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Peserta tidak ditemukan!" };
    }

    var waktuNow = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    // Kolom 12 (Status), 13 (Catatan), 14 (Waktu Verifikasi)
    sheet.getRange(targetRow, 12, 1, 3).setValues([[statusBaru, catatan, waktuNow]]);
    SpreadsheetApp.flush();

    // Update Counter Stats
    recalculateCountersAndStats(ss);

    return { status: "success", message: "Status peserta " + noPendaftaran + " berhasil diubah menjadi: " + statusBaru };
  } catch (err) {
    Logger.log("Error handleVerifikasiPeserta: " + err.toString());
    return { status: "error", message: "Gagal memproses verifikasi: " + err.message };
  }
}

/**
 * 9. UPDATE DATA PESERTA
 */
function handleUpdatePeserta(payload) {
  try {
    var auth = handleVerifyDualPin(payload ? payload.pin : "");
    if (!auth.authorized || auth.role !== "super_admin") {
      return { status: "error", message: "Akses ditolak: Hanya Super Admin yang berhak mengubah data peserta." };
    }

    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noReg = String(payload.noPendaftaran || "").trim();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noReg) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) return { status: "error", message: "Data tidak ditemukan!" };

    // Batch read kolom 3 s/d 10 (Nama, Sekolah, Alamat, NoHp, Level, Mapel, Kode, Ruang)
    var rowData = sheet.getRange(targetRow, 3, 1, 8).getValues()[0];
    if (payload.nama) rowData[0] = sanitizeSheetCell(String(payload.nama).toUpperCase());
    if (payload.sekolah) rowData[1] = sanitizeSheetCell(String(payload.sekolah).toUpperCase());
    if (payload.alamatSekolah) rowData[2] = sanitizeSheetCell(String(payload.alamatSekolah));
    if (payload.noHpGuru) rowData[3] = sanitizeSheetCell(String(payload.noHpGuru));
    if (payload.level) rowData[4] = sanitizeSheetCell(String(payload.level));
    if (payload.mapel) rowData[5] = sanitizeSheetCell(String(payload.mapel));
    if (payload.ruangKelas) rowData[7] = sanitizeSheetCell(String(payload.ruangKelas));

    sheet.getRange(targetRow, 3, 1, 8).setValues([rowData]);
    SpreadsheetApp.flush();
    recalculateCountersAndStats(ss);

    return { status: "success", message: "Data peserta berhasil diperbarui!" };
  } catch (err) {
    Logger.log("Error in handleUpdatePeserta: " + err.toString());
    return { status: "error", message: "Gagal memperbarui data: " + err.message };
  }
}

/**
 * 10. HAPUS DATA PESERTA
 */
function handleDeletePeserta(payload) {
  try {
    var auth = handleVerifyDualPin(payload ? payload.pin : "");
    if (!auth.authorized || auth.role !== "super_admin") {
      return { status: "error", message: "Akses ditolak: Hanya Super Admin yang berhak menghapus data peserta." };
    }

    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noReg = String(payload.noPendaftaran || "").trim();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noReg) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) return { status: "error", message: "Data tidak ditemukan!" };

    sheet.deleteRow(targetRow);
    SpreadsheetApp.flush();
    recalculateCountersAndStats(ss);
    return { status: "success", message: "Data peserta berhasil dihapus dari sistem." };
  } catch (err) {
    Logger.log("Error in handleDeletePeserta: " + err.toString());
    return { status: "error", message: "Gagal menghapus data peserta: " + err.message };
  }
}

/**
 * Helper Pad Zero
 */
function padZero(num, size) {
  var s = String(num);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}

/**
 * Helper pencegah formula injection (=, +, -, @) di Google Sheets
 */
function sanitizeSheetCell(val) {
  var s = String(val == null ? "" : val).trim();
  if (/^[=+\-@]/.test(s)) {
    return "'" + s;
  }
  return s;
}
