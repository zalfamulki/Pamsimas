/* Cetak struk tagihan — mengisi elemen #receipt lalu memanggil window.print() */
window.Receipt = (function () {
  'use strict';

  const cfg = window.AppConfig;

  /**
   * Cetak struk untuk satu entri.
   * @param {object} entry {nama, meterAwal, meterAkhir, pemakaian, abonemen, biayaPemakaian, total, tanggal}
   * @param {string} [receiptNo] nomor struk opsional
   */
  function print(entry, receiptNo) {
    const $ = function (id) { return document.getElementById(id); };

    $('rcNo').textContent = receiptNo || autoNumber(entry);
    $('rcDate').textContent = formatDate(entry.tanggal);
    $('rcName').textContent = entry.nama || '-';
    $('rcAwal').textContent = cfg.formatNumber(entry.meterAwal) + ' m³';
    $('rcAkhir').textContent = cfg.formatNumber(entry.meterAkhir) + ' m³';
    $('rcUsage').textContent = cfg.formatNumber(entry.pemakaian) + ' m³';
    $('rcAbon').textContent = cfg.formatRupiah(entry.abonemen);
    $('rcBiaya').textContent = cfg.formatRupiah(entry.biayaPemakaian);
    $('rcTotal').textContent = cfg.formatRupiah(entry.total);

    // beri jeda agar DOM ter-update sebelum dialog cetak terbuka
    requestAnimationFrame(function () {
      window.print();
    });
  }

  function autoNumber(entry) {
    const d = new Date(entry.tanggal || Date.now());
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const tail = (entry.id || String(Date.now())).slice(-5).toUpperCase();
    return 'PMS-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + tail;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  return { print: print };
})();
