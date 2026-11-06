/**
 * =========================================================================
 * BACKEND SISTEM PENDAFTARAN OLIMPIADE OMEGA PLUS (TURBO HIGH-SCALE EDITION)
 * SMP NEGERI 1 PAMEKASAN - SE-MADURA
 * =========================================================================
 * File: Code.gs (Refactored for Client Specifications: Direct Form, 30 Rooms,
 * Dual Role PIN: Panitia vs Super Admin, BCA Norma Dewi, and Drive Upload)
 * =========================================================================
 */

var SPREADSHEET_ID = "1HirE660KgSHG5CWlQMs7jEDXHfV1s6L4tS3sHEfi0kg"; 

var SHEET_NAMES = {
  PESERTA: "PESERTA",
  PENGATURAN: "PENGATURAN"
};

var CATEGORY_SHEETS = [
  "Matematika Level 1",
  "Matematika Level 2",
  "B. Inggris Level 1",
  "B. Inggris Level 2",
  "IPA Level 1",
  "IPA Level 2",
  "IPS Level 1",
  "IPS Level 2"
];

/**
 * Mapping Kode Mapel (01-04) dan Kode Level (01-02)
 */
function getCategoryInfo(mapel, level) {
  var mapelStr = String(mapel || "");
  var levelStr = String(level || "");

  var mapelCode = "01";
  var mapelName = "Matematika";
  if (mapelStr.indexOf("Inggris") !== -1) {
    mapelCode = "02";
    mapelName = "B. Inggris";
  } else if (mapelStr.indexOf("IPA") !== -1) {
    mapelCode = "03";
    mapelName = "IPA";
  } else if (mapelStr.indexOf("IPS") !== -1) {
    mapelCode = "04";
    mapelName = "IPS";
  }

  var levelCode = (levelStr.indexOf("1") !== -1) ? "01" : "02";
  var levelName = (levelCode === "01") ? "Level 1" : "Level 2";

  var catKey = mapelCode + "-" + levelCode;
  var sheetName = mapelName + " " + levelName;

  return {
    mapelCode: mapelCode,
    levelCode: levelCode,
    catKey: catKey,
    sheetName: sheetName
  };
}

// --- MENU SETUP UNTUK GOOGLE SHEETS WORKSPACE ---
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("✦ OMEGA PLUS 2026")
    .addItem("Inisialisasi Database Baru (Master + 8 Sheet)", "setupDatabase")
    .addItem("Hitung Ulang Counter & Statistik", "recalculateCountersAndStats")
    .addItem("Sinkronkan 8 Database Kategori", "syncAllCategorySheets")
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
 * Helper untuk mendapatkan ID Spreadsheet Asli secara otomatis dari Drive
 */
function getSpreadsheetAutoDiscovery() {
  // 1. Coba SpreadsheetApp.getActiveSpreadsheet() jika script container-bound
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", activeSs.getId());
      return activeSs;
    }
  } catch (e) {}

  // 2. Coba cari berdasarkan nama file "DATABASE_OMEGA_PLUS_2026" di Google Drive
  try {
    var files = DriveApp.getFilesByName("DATABASE_OMEGA_PLUS_2026");
    if (files.hasNext()) {
      var f = files.next();
      var foundSs = SpreadsheetApp.openById(f.getId());
      if (foundSs) {
        PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", f.getId());
        Logger.log("Auto-Discovery Sukses! Menggunakan file Drive ID: " + f.getId());
        return foundSs;
      }
    }
  } catch (e) {
    Logger.log("Gagal auto-discovery Drive: " + e.toString());
  }

  return null;
}

/**
 * Fungsi Utility: Jalankan fungsi ini di Apps Script editor untuk melihat ID asli
 */
function cekDanDapatkanIdSpreadsheet() {
  var ss = getSpreadsheetAutoDiscovery();
  if (ss) {
    var realId = ss.getId();
    Logger.log("=========================================");
    Logger.log("ID ASLI SPREADSHEET ANDA:");
    Logger.log(realId);
    Logger.log("URL SPREADSHEET:");
    Logger.log(ss.getUrl());
    Logger.log("=========================================");
    return realId;
  } else {
    Logger.log("File DATABASE_OMEGA_PLUS_2026 tidak ditemukan di Google Drive.");
    return null;
  }
}

/**
 * 1. FUNGSI OTOMATISASI SETUP DATABASE & INISIALISASI COUNTER
 */
function setupDatabase() {
  try {
    var ss = null;
    var props = PropertiesService.getScriptProperties();
    var targetId = SPREADSHEET_ID || props.getProperty("SPREADSHEET_ID");

    if (targetId) {
      try {
        ss = SpreadsheetApp.openById(targetId);
        props.setProperty("SPREADSHEET_ID", ss.getId());
        Logger.log("Menggunakan Spreadsheet yang ada: " + ss.getUrl());
      } catch (e) {
        Logger.log("Target ID gagal dibuka (" + targetId + "), mencoba auto-discovery...");
        ss = null;
      }
    }

    // Auto-discovery via Drive jika targetId gagal
    if (!ss) {
      ss = getSpreadsheetAutoDiscovery();
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
      ["Pengaturan_Ruang", "MANUAL", "Pengaturan ruangan dilakukan secara manual oleh panitia"],
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

    // --- 8 SHEET DATABASE KATEGORI (TIAP LEVEL & MAPEL) ---
    for (var c = 0; c < CATEGORY_SHEETS.length; c++) {
      var catSheet = getOrCreateSheet(ss, CATEGORY_SHEETS[c]);
      styleHeader(catSheet, headersPeserta, "#1e3a5f", "#ffffff");
    }

    // Sinkronisasi paksa
    SpreadsheetApp.flush();

    // Hitung ulang statistik & sinkronisasi data kategori
    recalculateCountersAndStats(ss);
    syncAllCategorySheets(ss);

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
 * Helper styling header sheet & kunci format Plain Text pada kolom No_HP_Guru & Kode_Peserta
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

  // Kunci kolom F (No_HP_Guru) dan kolom I (Kode_Peserta) sebagai Plain Text (@) agar tidak diubah jadi Tanggal/Angka oleh Google Sheets
  if (headers.length >= 9) {
    try {
      sheet.getRange("F2:F").setNumberFormat("@");
      sheet.getRange("I2:I").setNumberFormat("@");
    } catch (e) {}
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Normalisasi Kode Peserta:
 * Memperbaiki kode yang diubah jadi Tanggal oleh Google Sheets (02-02-2001 / Date object)
 * maupun kode format lama (omega-0001-L1-01-2026) menjadi format baku XX-YY-ZZZ (contoh: 02-02-001)
 */
function normalizeKodePeserta(rawVal, mapel, level, fallbackSeq) {
  var catInfo = getCategoryInfo(mapel, level);
  var prefix = catInfo.mapelCode + "-" + catInfo.levelCode + "-";

  // 1. Jika Google Sheets mengubahnya menjadi Date object (misal 02-02-001 -> Feb 2, 2001)
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    var yr = rawVal.getFullYear();
    var seqFromYear = yr % 1000;
    if (seqFromYear <= 0) seqFromYear = fallbackSeq || 1;
    return prefix + padZero(seqFromYear, 3);
  }

  var str = String(rawVal == null ? "" : rawVal).trim().replace(/^'+/, "");

  // 2. Jika string sudah berpola XX-YY-ZZZ atau XX-YY-2ZZZ
  var exactMatch = str.match(/^(\d{2})-(\d{2})-(\d{1,4})$/);
  if (exactMatch) {
    var seqRaw = exactMatch[3];
    var seqNum = parseInt(seqRaw, 10);
    // Jika 4 digit dimulai angka 2 (misal 2001 akibat konversi tahun Google Sheets dari 001)
    if (seqRaw.length === 4 && seqNum >= 2000 && seqNum < 2999) {
      seqNum = seqNum - 2000;
    }
    if (seqNum <= 0) seqNum = fallbackSeq || 1;
    return exactMatch[1] + "-" + exactMatch[2] + "-" + padZero(seqNum, 3);
  }

  // 3. Jika string adalah hasil Date.toString() (contoh: "Fri Feb 02 2001 00:00:00 GMT+0700...")
  var dateStrMatch = str.match(/\b2(\d{3})\b/);
  if (str.indexOf("GMT") !== -1 && dateStrMatch) {
    var seqFromDateStr = parseInt(dateStrMatch[1], 10);
    if (seqFromDateStr <= 0) seqFromDateStr = fallbackSeq || 1;
    return prefix + padZero(seqFromDateStr, 3);
  }

  // 4. Jika format lama (contoh: omega-0001-L1-01-2026)
  if (fallbackSeq && fallbackSeq > 0) {
    return prefix + padZero(fallbackSeq, 3);
  }
  var oldMatch = str.match(/omega-(\d+)/i);
  if (oldMatch) {
    return prefix + padZero(parseInt(oldMatch[1], 10), 3);
  }

  return str || (prefix + padZero(fallbackSeq || 1, 3));
}

/**
 * Normalisasi Nomor HP Guru:
 * Memastikan angka 0 di depan tidak hilang (misal 81233713000 -> 081233713000)
 */
function normalizeNoHp(rawVal) {
  var s = String(rawVal == null ? "" : rawVal).trim().replace(/^'+/, "");
  if (/^8\d{7,13}$/.test(s)) {
    return "0" + s;
  }
  return s;
}

/**
 * Mendapatkan referensi Google Spreadsheet aktif (Fail-safe Auto Discovery)
 */
function getDatabase() {
  var props = PropertiesService.getScriptProperties();
  var id = SPREADSHEET_ID || props.getProperty("SPREADSHEET_ID");
  
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      Logger.log("Gagal openById (" + id + "), beralih ke auto-discovery di Drive...");
    }
  }

  // Auto-discovery via Drive
  var ss = getSpreadsheetAutoDiscovery();
  if (ss) {
    return ss;
  }

  // Inisialisasi jika belum pernah ada
  setupDatabase();
  var finalId = props.getProperty("SPREADSHEET_ID");
  if (finalId) {
    return SpreadsheetApp.openById(finalId);
  }

  throw new Error("Tidak dapat membuka Google Spreadsheet DATABASE_OMEGA_PLUS_2026.");
}

/**
 * HITUNG ULANG COUNTER & STATISTIK REALTIME
 */
function recalculateCountersAndStats(ss) {
  if (!ss) ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();

  var counters = { master: 0 };
  var catKeys = ["01-01", "01-02", "02-01", "02-02", "03-01", "03-02", "04-01", "04-02"];
  for (var k = 0; k < catKeys.length; k++) {
    counters[catKeys[k]] = 0;
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
      var info = getCategoryInfo(mapel, lvl);
      var kodePeserta = normalizeKodePeserta(range[i][7], mapel, lvl, (counters[info.catKey] || 0) + 1);
      var ruang = String(range[i][8] || "");
      var status = String(range[i][10] || "");

      // Hitung sequence number tertinggi per kombinasi mapel & level (XX-YY-ZZZ)
      var km = kodePeserta.match(/^(\d{2})-(\d{2})-(\d+)$/);
      if (km) {
        var cKey = km[1] + "-" + km[2];
        var seqNum = parseInt(km[3], 10);
        if (counters[cKey] !== undefined) {
          counters[cKey] = Math.max(counters[cKey], seqNum);
        } else {
          counters[cKey] = seqNum;
        }
      }

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
 * SINKRONISASI OTOMATIS DATA DARI SHEET MASTER KE 8 DATABASE KATEGORI
 */
function syncAllCategorySheets(ss) {
  if (!ss) ss = getDatabase();
  var masterSheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  if (!masterSheet) return { status: "error", message: "Sheet Master PESERTA tidak ditemukan" };
  var lastRow = masterSheet.getLastRow();

  var headersPeserta = [
    "Timestamp", "No_Pendaftaran", "Nama_Peserta", "Asal_Sekolah",
    "Alamat_Sekolah", "No_HP_Guru", "Level", "Mata_Pelajaran",
    "Kode_Peserta", "Ruang_Kelas", "Bukti_Transfer_Url",
    "Status_Verifikasi", "Catatan_Panitia", "Waktu_Verifikasi"
  ];

  var categoryData = {};
  for (var c = 0; c < CATEGORY_SHEETS.length; c++) {
    categoryData[CATEGORY_SHEETS[c]] = [];
    var cSheet = getOrCreateSheet(ss, CATEGORY_SHEETS[c]);
    var cLast = cSheet.getLastRow();
    if (cLast > 1) {
      cSheet.getRange(2, 1, cLast - 1, 14).clearContent();
    }
    styleHeader(cSheet, headersPeserta, "#1e3a5f", "#ffffff");
  }

  if (lastRow > 1) {
    try {
      masterSheet.getRange(2, 6, lastRow - 1, 1).setNumberFormat("@");
      masterSheet.getRange(2, 9, lastRow - 1, 1).setNumberFormat("@");
    } catch (e) {}

    var allData = masterSheet.getRange(2, 1, lastRow - 1, 14).getValues();
    var catSeq = {};
    var writeBackMaster = [];

    for (var i = 0; i < allData.length; i++) {
      var r = allData[i];
      var lvl = String(r[6] || "");
      var mpl = String(r[7] || "");
      var info = getCategoryInfo(mpl, lvl);
      catSeq[info.catKey] = (catSeq[info.catKey] || 0) + 1;

      var cleanHp = normalizeNoHp(r[5]);
      var cleanKode = normalizeKodePeserta(r[8], mpl, lvl, catSeq[info.catKey]);

      r[5] = "'" + cleanHp;
      r[8] = "'" + cleanKode;
      r[9] = "-"; // Pastikan kolom ruang dikosongkan ("-") sesuai kesepakatan

      writeBackMaster.push(r);
      if (categoryData[info.sheetName]) {
        categoryData[info.sheetName].push(r);
      }
    }

    // Perbaiki juga Sheet Master agar kode yang sempat jadi Tanggal / format lama berubah permanen jadi teks XX-YY-ZZZ
    masterSheet.getRange(2, 1, writeBackMaster.length, 14).setValues(writeBackMaster);

    for (var name in categoryData) {
      if (categoryData[name].length > 0) {
        var targetSheet = ss.getSheetByName(name);
        try {
          targetSheet.getRange(2, 6, categoryData[name].length, 1).setNumberFormat("@");
          targetSheet.getRange(2, 9, categoryData[name].length, 1).setNumberFormat("@");
        } catch (e) {}
        targetSheet.getRange(2, 1, categoryData[name].length, 14).setValues(categoryData[name]);
        targetSheet.autoResizeColumns(1, 14);
      }
    }
  }

  SpreadsheetApp.flush();
  Logger.log("8 Database Kategori berhasil disinkronkan.");
  return { status: "success", message: "8 Database Kategori berhasil disinkronkan dari Sheet Master" };
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
        syncAllCategorySheets();
        result = { status: "success", message: "Statistik & 8 Database Kategori berhasil dihitung ulang dan disinkronkan" };
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

      // 1. Resolve Category Info (Mapel 01-04, Level 01-02)
      var catInfo = getCategoryInfo(mapel, level);

      // 2. Increment Master Sequence Number (OMP-2026-XXXX)
      counters.master = (counters.master || 0) + 1;
      var curNum = counters.master;
      var num4Str = padZero(curNum, 4);
      noPendaftaran = "OMP-2026-" + num4Str;

      // 3. Increment Sequence per Mapel & Level (001, 002, ...)
      counters[catInfo.catKey] = (counters[catInfo.catKey] || 0) + 1;
      var seqNum = counters[catInfo.catKey];
      var seq3Str = padZero(seqNum, 3);

      // 4. Format Kode Peserta Baku Sesuai Kesepakatan: XX-YY-ZZZ (contoh: 01-01-001)
      kodePeserta = catInfo.mapelCode + "-" + catInfo.levelCode + "-" + seq3Str;

      // 5. Alokasi Ruang Kelas: Manual oleh Panitia (disetel "-" oleh sistem)
      ruangKelas = "-";

      // 6. Tulis Atomic Single-Row ke Sheet PESERTA (Master) di dalam lock
      var ss = getDatabase();
      var sheetMaster = ss.getSheetByName(SHEET_NAMES.PESERTA);
      var cleanHp = normalizeNoHp(noHpGuru);

      var rowValues = [
        timestamp,
        noPendaftaran,
        sanitizeSheetCell(nama),
        sanitizeSheetCell(sekolah),
        sanitizeSheetCell(alamatSekolah),
        "'" + cleanHp,
        sanitizeSheetCell(level),
        sanitizeSheetCell(mapel),
        "'" + kodePeserta,
        ruangKelas,
        buktiTransferUrl,
        statusVerif,
        "Pendaftaran via Web Portal Resmi",
        "-"
      ];

      // Tulis ke Sheet MASTER (PESERTA)
      sheetMaster.appendRow(rowValues);

      // Tulis ke Sheet Kategori terkait (1 dari 8 Database)
      var catSheet = getOrCreateSheet(ss, catInfo.sheetName);
      catSheet.appendRow(rowValues);

      SpreadsheetApp.flush();

      // Update counters di ScriptProperties
      props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));

      // Update Dashboard Stats Memory
      var statsRaw = props.getProperty("DASHBOARD_STATS");
      var stats = statsRaw ? JSON.parse(statsRaw) : { total: 0, level1: 0, level2: 0, matematika: 0, bahasaInggris: 0, ipa: 0, ips: 0, verified: 0, pending: 0 };
      stats.total = (stats.total || 0) + 1;
      if (catInfo.levelCode === "01") stats.level1++; else stats.level2++;
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

  // Auto-heal jika ada baris yang sempat diubah jadi Date oleh Google Sheets atau masih berformat lama (omega-...)
  var needsAutoHeal = false;
  for (var h = 0; h < dataRange.length; h++) {
    var rawK = dataRange[h][8];
    var rawR = String(dataRange[h][9] || "");
    if (rawK instanceof Date || /^omega-/i.test(String(rawK)) || /^(\d{2})-(\d{2})-2(\d{3})$/.test(String(rawK)) || (rawR && rawR !== "-")) {
      needsAutoHeal = true;
      break;
    }
  }
  if (needsAutoHeal) {
    try {
      syncAllCategorySheets(ss);
      recalculateCountersAndStats(ss);
      dataRange = sheet.getRange(startRow, 1, numRows, 14).getValues();
    } catch (e) {}
  }

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
    var noHpGuru = normalizeNoHp(r[5]);
    var level = String(r[6] || "");
    var mapel = String(r[7] || "");
    var kodePeserta = normalizeKodePeserta(r[8], mapel, level);
    var ruangKelas = "-";
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
    var cleanHp = normalizeNoHp(r[5]);
    var cleanKode = normalizeKodePeserta(r[8], r[7], r[6]);
    var noReg = String(r[1]).toLowerCase();
    var nama = String(r[2]).toLowerCase();
    var noHpGuru = cleanHp.toLowerCase();
    var kodePeserta = cleanKode.toLowerCase();

    if (noReg === query || noHpGuru === query || kodePeserta === query || (query.length >= 4 && nama.indexOf(query) !== -1)) {
      results.push({
        noPendaftaran: r[1],
        nama: r[2],
        sekolah: r[3],
        alamatSekolah: r[4],
        noHpGuru: cleanHp,
        level: r[6],
        mataPelajaran: r[7],
        kodePeserta: cleanKode,
        ruangKelas: "-",
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

    // Update Counter Stats & 8 Database Kategori
    recalculateCountersAndStats(ss);
    syncAllCategorySheets(ss);

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
    if (payload.noHpGuru) rowData[3] = "'" + normalizeNoHp(payload.noHpGuru);
    if (payload.level) rowData[4] = sanitizeSheetCell(String(payload.level));
    if (payload.mapel) rowData[5] = sanitizeSheetCell(String(payload.mapel));
    rowData[6] = "'" + normalizeKodePeserta(rowData[6], rowData[5], rowData[4]);
    rowData[7] = "-";

    sheet.getRange(targetRow, 3, 1, 8).setValues([rowData]);
    SpreadsheetApp.flush();
    recalculateCountersAndStats(ss);
    syncAllCategorySheets(ss);

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
    syncAllCategorySheets(ss);
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
