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

    // Waktu cetak realtime; dipakai jika entri belum punya tanggal valid
    const nowIso = new Date().toISOString();
    const data = Object.assign({}, entry, {
      tanggal: isValidDate(entry.tanggal) ? entry.tanggal : nowIso
    });

    $('rcNo').textContent = receiptNo || autoNumber(data);
    $('rcDate').textContent = formatDate(data.tanggal);
    $('rcName').textContent = data.nama || '-';
    $('rcAwal').textContent = cfg.formatNumber(data.meterAwal) + ' m³';
    $('rcAkhir').textContent = cfg.formatNumber(data.meterAkhir) + ' m³';
    $('rcUsage').textContent = cfg.formatNumber(data.pemakaian) + ' m³';
    $('rcAbon').textContent = cfg.formatRupiah(data.abonemen);
    $('rcBiaya').textContent = cfg.formatRupiah(data.biayaPemakaian);
    $('rcTotal').textContent = cfg.formatRupiah(data.total);

    // beri jeda agar DOM ter-update sebelum dialog cetak terbuka
    requestAnimationFrame(function () {
      window.print();
    });
  }

  function isValidDate(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    return !Number.isNaN(d.getTime());
  }

  function autoNumber(entry) {
    const d = isValidDate(entry.tanggal) ? new Date(entry.tanggal) : new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const tail = (entry.id || String(Date.now())).slice(-5).toUpperCase();
    return 'PMS-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + tail;
  }

  function formatDate(iso) {
    const d = isValidDate(iso) ? new Date(iso) : new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  return { print: print };
})();
