/* Logika perhitungan tagihan — murni fungsi, tanpa DOM */
window.Calculator = (function () {
  'use strict';

  /**
   * Hitung tagihan dari pembacaan meter.
   * @param {number} meterAwal
   * @param {number} meterAkhir
   * @returns {{ok: boolean, error: string, pemakaian: number, abonemen: number, biayaPemakaian: number, total: number}}
   */
  function hitung(meterAwal, meterAkhir) {
    const cfg = window.AppConfig;

    if (!Number.isFinite(meterAwal) || !Number.isFinite(meterAkhir)) {
      return fail('Meter awal dan meter akhir wajib diisi angka.');
    }
    if (meterAwal < 0 || meterAkhir < 0) {
      return fail('Nilai meter tidak boleh negatif.');
    }
    if (meterAkhir < meterAwal) {
      return fail('Meter akhir tidak boleh lebih kecil dari meter awal.');
    }

    const pemakaian = meterAkhir - meterAwal;
    const abonemen = cfg.ABONEMEN;
    const biayaPemakaian = pemakaian * cfg.TARIF_PER_M3;
    const total = abonemen + biayaPemakaian;

    return {
      ok: true,
      error: '',
      pemakaian: pemakaian,
      abonemen: abonemen,
      biayaPemakaian: biayaPemakaian,
      total: total
    };
  }

  function fail(message) {
    return {
      ok: false,
      error: message,
      pemakaian: 0,
      abonemen: window.AppConfig.ABONEMEN,
      biayaPemakaian: 0,
      total: 0
    };
  }

  return { hitung: hitung };
})();
