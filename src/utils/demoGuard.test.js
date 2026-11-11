import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
} from './demoGuard.js';

describe('Demo Guard Utility Module (demoGuard.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // =========================================================================
  // 1. isDemoLocked
  // =========================================================================
  describe('isDemoLocked()', () => {
    it('harus mengembalikan true jika konfigurasi kosong, null, atau tidak memiliki properti DEMO_MODE', () => {
      expect(isDemoLocked(undefined)).toBe(true);
      expect(isDemoLocked(null)).toBe(true);
      expect(isDemoLocked({})).toBe(true);
      expect(isDemoLocked({ DEMO_MODE: null })).toBe(true);
    });

    it('harus mengembalikan true jika DEMO_MODE.LOCKED bernilai true', () => {
      expect(isDemoLocked({ DEMO_MODE: { LOCKED: true } })).toBe(true);
    });

    it('harus mengembalikan false jika DEMO_MODE.LOCKED bernilai false', () => {
      expect(isDemoLocked({ DEMO_MODE: { LOCKED: false } })).toBe(false);
    });

    it('harus membaca dari global window.APP_CONFIG jika parameter tidak diberikan', () => {
      vi.stubGlobal('window', {
        APP_CONFIG: {
          DEMO_MODE: { LOCKED: false }
        }
      });
      expect(isDemoLocked()).toBe(false);
    });
  });

  // =========================================================================
  // 2. isFunctionalPageUrl
  // =========================================================================
  describe('isFunctionalPageUrl()', () => {
    it('harus mengidentifikasi halaman fungsional pendaftaran, admin, dan login (case-insensitive)', () => {
      expect(isFunctionalPageUrl('/pendaftaran.html')).toBe(true);
      expect(isFunctionalPageUrl('/formpendaftaran.html')).toBe(true);
      expect(isFunctionalPageUrl('/admin.html')).toBe(true);
      expect(isFunctionalPageUrl('/ADMIN.HTML')).toBe(true);
      expect(isFunctionalPageUrl('/login.html')).toBe(true);
      expect(isFunctionalPageUrl('https://example.com/portal/admin')).toBe(true);
      expect(isFunctionalPageUrl('/app/pendaftaran/step1')).toBe(true);
    });

    it('harus mengembalikan false untuk landing page biasa atau halaman umum', () => {
      expect(isFunctionalPageUrl('/')).toBe(false);
      expect(isFunctionalPageUrl('/index.html')).toBe(false);
      expect(isFunctionalPageUrl('/tentang-kami.html')).toBe(false);
      expect(isFunctionalPageUrl('https://example.com/kontak')).toBe(false);
    });

    it('harus mengembalikan false untuk input non-string, string kosong, null, atau undefined', () => {
      expect(isFunctionalPageUrl('')).toBe(false);
      expect(isFunctionalPageUrl(null)).toBe(false);
      expect(isFunctionalPageUrl(undefined)).toBe(false);
      expect(isFunctionalPageUrl(123)).toBe(false);
      expect(isFunctionalPageUrl({})).toBe(false);
    });
  });

  // =========================================================================
  // 3. checkCurrentPageIsFunctional (Mocking window.location)
  // =========================================================================
  describe('checkCurrentPageIsFunctional() dengan Mock window.location', () => {
    it('harus mengembalikan true jika pathname atau href mengandung halaman fungsional', () => {
      const mockLocationAdmin = {
        pathname: '/admin.html',
        href: 'https://omegaplusv2.pages.dev/admin.html'
      };
      expect(checkCurrentPageIsFunctional(mockLocationAdmin)).toBe(true);

      const mockLocationPendaftaran = {
        pathname: '/pendaftaran',
        href: 'https://omegaplusv2.pages.dev/pendaftaran'
      };
      expect(checkCurrentPageIsFunctional(mockLocationPendaftaran)).toBe(true);
    });

    it('harus mengembalikan false jika berada di beranda (index.html)', () => {
      const mockLocationHome = {
        pathname: '/index.html',
        href: 'https://omegaplusv2.pages.dev/index.html'
      };
      expect(checkCurrentPageIsFunctional(mockLocationHome)).toBe(false);
    });

    it('harus membaca global window.location saat di-mock via vi.stubGlobal', () => {
      vi.stubGlobal('window', {
        location: {
          pathname: '/admin.html',
          href: 'https://omegaplus.sch.id/admin.html'
        }
      });
      expect(checkCurrentPageIsFunctional()).toBe(true);
    });

    it('harus menangani kasus saat window.location bernilai null atau undefined secara aman', () => {
      expect(checkCurrentPageIsFunctional(null)).toBe(false);
      expect(checkCurrentPageIsFunctional(undefined)).toBe(false);
    });
  });

  // =========================================================================
  // 4. isRestrictedActionLink
  // =========================================================================
  describe('isRestrictedActionLink()', () => {
    it('harus mengembalikan true untuk tautan yang mengarah ke fitur fungsional', () => {
      expect(isRestrictedActionLink('pendaftaran.html')).toBe(true);
      expect(isRestrictedActionLink('/formpendaftaran.html')).toBe(true);
      expect(isRestrictedActionLink('admin.html')).toBe(true);
      expect(isRestrictedActionLink('/admin')).toBe(true);
      expect(isRestrictedActionLink('pendaftaran')).toBe(true);
      expect(isRestrictedActionLink('#status')).toBe(true);
      expect(isRestrictedActionLink('index.html#status')).toBe(true);
    });

    it('harus mengabaikan (mengembalikan false) untuk link eksternal seperti WhatsApp, tel, dan mailto', () => {
      expect(isRestrictedActionLink('https://wa.me/6281234567890')).toBe(false);
      expect(isRestrictedActionLink('https://api.whatsapp.com/send?phone=628123')).toBe(false);
      expect(isRestrictedActionLink('http://wa.me/628123')).toBe(false);
      expect(isRestrictedActionLink('tel:081234567890')).toBe(false);
      expect(isRestrictedActionLink('mailto:info@smpn1pamekasan.sch.id')).toBe(false);
    });

    it('harus mengembalikan false untuk tautan internal non-fungsional', () => {
      expect(isRestrictedActionLink('index.html')).toBe(false);
      expect(isRestrictedActionLink('#beranda')).toBe(false);
      expect(isRestrictedActionLink('#jadwal-ujian')).toBe(false);
      expect(isRestrictedActionLink('logo.png')).toBe(false);
      expect(isRestrictedActionLink('')).toBe(false);
      expect(isRestrictedActionLink(null)).toBe(false);
    });
  });

  // =========================================================================
  // 5. generateDeveloperWaLink
  // =========================================================================
  describe('generateDeveloperWaLink()', () => {
    it('harus mengubah nomor HP awalan 0 menjadi kode negara 62', () => {
      const link = generateDeveloperWaLink('088228511309', 'Halo Dev');
      expect(link).toContain('https://wa.me/6288228511309');
    });

    it('harus membersihkan karakter non-digit dan melakukan encode URI komponen pesan', () => {
      const link = generateDeveloperWaLink('0882-2851-1309', 'Konfirmasi & aktivasi!');
      expect(link).toBe('https://wa.me/6288228511309?text=Konfirmasi%20%26%20aktivasi!');
    });

    it('harus mempertahankan nomor yang sudah berawalan 62', () => {
      const link = generateDeveloperWaLink('6288228511309', 'Halo');
      expect(link).toBe('https://wa.me/6288228511309?text=Halo');
    });
  });

  // =========================================================================
  // 6. getDismissBehavior
  // =========================================================================
  describe('getDismissBehavior()', () => {
    it('harus mengembalikan redirect ke index.html jika di halaman fungsional', () => {
      expect(getDismissBehavior(true)).toEqual({
        action: 'redirect',
        target: 'index.html'
      });
    });

    it('harus mengembalikan hide jika di landing page', () => {
      expect(getDismissBehavior(false)).toEqual({
        action: 'hide',
        target: null
      });
    });
  });

  // =========================================================================
  // 7. getDemoDismissedStatus & setDemoDismissedStatus (Mocking localStorage)
  // =========================================================================
  describe('Status Dismiss dengan Mock localStorage', () => {
    it('harus menyimpan dan membaca status dismiss dari mock localStorage', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: vi.fn((key) => storageMap.get(key) ?? null),
        setItem: vi.fn((key, val) => storageMap.set(key, String(val))),
        removeItem: vi.fn((key) => storageMap.delete(key))
      };

      expect(getDemoDismissedStatus(mockStorage)).toBe(false);

      setDemoDismissedStatus(true, mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith('omega_demo_dismissed', 'true');
      expect(getDemoDismissedStatus(mockStorage)).toBe(true);

      setDemoDismissedStatus(false, mockStorage);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('omega_demo_dismissed');
      expect(getDemoDismissedStatus(mockStorage)).toBe(false);
    });

    it('harus membaca dan menulis ke global window.localStorage saat di-mock', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: vi.fn((key) => storageMap.get(key) ?? null),
        setItem: vi.fn((key, val) => storageMap.set(key, String(val))),
        removeItem: vi.fn((key) => storageMap.delete(key))
      };

      vi.stubGlobal('window', { localStorage: mockStorage });

      expect(getDemoDismissedStatus()).toBe(false);
      setDemoDismissedStatus(true);
      expect(getDemoDismissedStatus()).toBe(true);
    });

    it('harus menangani kasus saat storage tidak tersedia secara aman tanpa melempar exception', () => {
      expect(getDemoDismissedStatus(null)).toBe(false);
      expect(setDemoDismissedStatus(true, null)).toBe(false);
    });
  });

  // =========================================================================
  // 8. resolveDemoConfig
  // =========================================================================
  describe('resolveDemoConfig()', () => {
    it('harus mengembalikan DEFAULT_DEMO_CONFIG jika tidak ada parameter konfigurasi', () => {
      const resolved = resolveDemoConfig();
      expect(resolved.LOCKED).toBe(true);
      expect(resolved.DEVELOPER_WA).toBe('088228511309');
      expect(resolved.BADGE).toBe('PREVIEW EKSKLUSIF SISTEM');
    });

    it('harus menimpa properti dengan konfigurasi kustom yang diberikan', () => {
      const customConfig = {
        DEMO_MODE: {
          LOCKED: false,
          TITLE: 'Sistem Resmi Aktif'
        }
      };
      const resolved = resolveDemoConfig(customConfig);
      expect(resolved.LOCKED).toBe(false);
      expect(resolved.TITLE).toBe('Sistem Resmi Aktif');
      // Properti yang tidak ditimpa tetap menggunakan default
      expect(resolved.DEVELOPER_WA).toBe('088228511309');
    });
  });
});

