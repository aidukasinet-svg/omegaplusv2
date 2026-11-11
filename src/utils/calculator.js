/**
 * Modul Kalkulator Sederhana dengan Validasi Tipe Data dan Nilai
 */

function validateNumber(val, paramName = 'Parameter') {
  if (val === null || val === undefined) {
    throw new TypeError(`${paramName} tidak boleh bernilai null atau undefined`);
  }
  if (typeof val !== 'number' || Number.isNaN(val)) {
    throw new TypeError(`${paramName} harus berupa angka valid (number)`);
  }
}

/**
 * Operasi Penjumlahan (a + b)
 */
export function add(a, b) {
  validateNumber(a, 'Parameter pertama');
  validateNumber(b, 'Parameter kedua');
  return a + b;
}

/**
 * Operasi Pengurangan (a - b)
 */
export function subtract(a, b) {
  validateNumber(a, 'Parameter pertama');
  validateNumber(b, 'Parameter kedua');
  return a - b;
}

/**
 * Operasi Perkalian (a * b)
 */
export function multiply(a, b) {
  validateNumber(a, 'Parameter pertama');
  validateNumber(b, 'Parameter kedua');
  const res = a * b;
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Operasi Pembagian (a / b)
 */
export function divide(a, b) {
  validateNumber(a, 'Parameter pertama');
  validateNumber(b, 'Parameter kedua');
  if (b === 0) {
    throw new Error('Pembagian dengan angka 0 tidak diperbolehkan');
  }
  return a / b;
}

export default {
  add,
  subtract,
  multiply,
  divide
};

