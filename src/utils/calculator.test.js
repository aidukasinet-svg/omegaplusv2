import { describe, it, expect } from 'vitest';
import { add, subtract, multiply, divide } from './calculator.js';

describe('Calculator Utility Module', () => {
  // ==========================================
  // Skenario 1: Input Valid Standar
  // ==========================================
  describe('Skenario 1: Input Valid Standar', () => {
    it('harus menjumlahkan dua bilangan positif dengan benar', () => {
      expect(add(10, 5)).toBe(15);
      expect(add(2.5, 3.5)).toBe(6.0);
    });

    it('harus mengurangkan dua bilangan positif dengan benar', () => {
      expect(subtract(20, 8)).toBe(12);
      expect(subtract(10.5, 2.5)).toBe(8);
    });

    it('harus mengalikan dua bilangan positif dengan benar', () => {
      expect(multiply(6, 7)).toBe(42);
      expect(multiply(2.5, 4)).toBe(10);
    });

    it('harus membagi dua bilangan positif dengan benar', () => {
      expect(divide(20, 4)).toBe(5);
      expect(divide(7.5, 2.5)).toBe(3);
    });
  });

  // ==========================================
  // Skenario 2: Input Berupa Nilai 0 dan Nilai Negatif
  // ==========================================
  describe('Skenario 2: Nilai 0 dan Nilai Negatif', () => {
    it('harus menangani penjumlahan dengan angka 0 dan bilangan negatif', () => {
      expect(add(0, 10)).toBe(10);
      expect(add(10, 0)).toBe(10);
      expect(add(0, 0)).toBe(0);
      expect(add(-5, -7)).toBe(-12);
      expect(add(-10, 15)).toBe(5);
    });

    it('harus menangani pengurangan dengan angka 0 dan bilangan negatif', () => {
      expect(subtract(10, 0)).toBe(10);
      expect(subtract(0, 10)).toBe(-10);
      expect(subtract(-10, -5)).toBe(-5);
      expect(subtract(-5, 10)).toBe(-15);
    });

    it('harus menangani perkalian dengan angka 0 dan bilangan negatif', () => {
      expect(multiply(10, 0)).toBe(0);
      expect(multiply(0, -10)).toBe(0);
      expect(multiply(-4, 5)).toBe(-20);
      expect(multiply(-3, -6)).toBe(18);
    });

    it('harus menangani pembagian bilangan negatif dan melempar error saat dibagi 0', () => {
      expect(divide(-20, 4)).toBe(-5);
      expect(divide(-20, -5)).toBe(4);
      expect(divide(0, 10)).toBe(0);
      expect(() => divide(10, 0)).toThrow('Pembagian dengan angka 0 tidak diperbolehkan');
      expect(() => divide(-5, 0)).toThrow('Pembagian dengan angka 0 tidak diperbolehkan');
    });
  });

  // ==========================================
  // Skenario 3: Tipe Data Tidak Sesuai (Non-Number & NaN)
  // ==========================================
  describe('Skenario 3: Tipe Data Tidak Sesuai', () => {
    const invalidTypes = ['10', true, false, [], {}, () => {}, Symbol('test'), NaN];

    it('harus melempar TypeError pada fungsi add jika tipe data bukan number valid', () => {
      invalidTypes.forEach(val => {
        expect(() => add(val, 5)).toThrow(TypeError);
        expect(() => add(5, val)).toThrow(TypeError);
      });
    });

    it('harus melempar TypeError pada fungsi subtract jika tipe data bukan number valid', () => {
      invalidTypes.forEach(val => {
        expect(() => subtract(val, 5)).toThrow(TypeError);
        expect(() => subtract(5, val)).toThrow(TypeError);
      });
    });

    it('harus melempar TypeError pada fungsi multiply jika tipe data bukan number valid', () => {
      invalidTypes.forEach(val => {
        expect(() => multiply(val, 5)).toThrow(TypeError);
        expect(() => multiply(5, val)).toThrow(TypeError);
      });
    });

    it('harus melempar TypeError pada fungsi divide jika tipe data bukan number valid', () => {
      invalidTypes.forEach(val => {
        expect(() => divide(val, 5)).toThrow(TypeError);
        expect(() => divide(5, val)).toThrow(TypeError);
      });
    });
  });

  // ==========================================
  // Skenario 4: Penanganan Parameter Null / Undefined
  // ==========================================
  describe('Skenario 4: Parameter Bernilai Null atau Undefined', () => {
    it('harus melempar TypeError saat parameter add bernilai null atau undefined', () => {
      expect(() => add(null, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => add(5, null)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => add(undefined, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => add(5, undefined)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => add()).toThrow(/tidak boleh bernilai null atau undefined/);
    });

    it('harus melempar TypeError saat parameter subtract bernilai null atau undefined', () => {
      expect(() => subtract(null, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => subtract(5, null)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => subtract(undefined, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => subtract(5, undefined)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => subtract()).toThrow(/tidak boleh bernilai null atau undefined/);
    });

    it('harus melempar TypeError saat parameter multiply bernilai null atau undefined', () => {
      expect(() => multiply(null, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => multiply(5, null)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => multiply(undefined, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => multiply(5, undefined)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => multiply()).toThrow(/tidak boleh bernilai null atau undefined/);
    });

    it('harus melempar TypeError saat parameter divide bernilai null atau undefined', () => {
      expect(() => divide(null, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => divide(5, null)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => divide(undefined, 5)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => divide(5, undefined)).toThrow(/tidak boleh bernilai null atau undefined/);
      expect(() => divide()).toThrow(/tidak boleh bernilai null atau undefined/);
    });
  });
});

