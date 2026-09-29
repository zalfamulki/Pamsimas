/* Ekspor riwayat ke file Excel (.xlsx) memakai SheetJS */
window.ExcelExporter = (function () {
  'use strict';

  /**
   * Unduh riwayat sebagai file Excel.
   * @param {Array} entries daftar entri riwayat
   * @returns {boolean} true jika berhasil
   */
  function exportToExcel(entries) {
    if (!entries || !entries.length) return false;

    if (typeof XLSX === 'undefined') {
      window.App.toast('Library Excel belum termuat. Periksa koneksi internet.', 'error');
      return false;
    }

    const cfg = window.AppConfig;
    const rows = entries.map(function (e, i) {
      return {
        'No': i + 1,
        'Tanggal': formatDate(e.tanggal),
        'Nama Pelanggan': e.nama || '-',
        'Meter Awal (m³)': e.meterAwal,
        'Meter Akhir (m³)': e.meterAkhir,
        'Pemakaian (m³)': e.pemakaian,
        'Biaya Abonemen (Rp)': e.abonemen,
        'Biaya Pemakaian (Rp)': e.biayaPemakaian,
        'Total Tagihan (Rp)': e.total
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Lebar kolom agar rapi
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 18 },  // Tanggal
      { wch: 24 },  // Nama
      { wch: 14 },  // Awal
      { wch: 14 },  // Akhir
      { wch: 14 },  // Pemakaian
      { wch: 18 },  // Abonemen
      { wch: 20 },  // Biaya pakai
      { wch: 18 }   // Total
    ];

    // Baris ringkasan di bawah data
    const range = XLSX.utils.decode_range(ws['!ref']);
    const summaryRow = range.e.r + 2; // satu baris kosong lalu ringkasan
    const totalRow = summaryRow;

    setCell(ws, summaryRow, 0, 'RINGKASAN');
    setCell(ws, summaryRow, 5, 'Total Pemakaian');
    setCell(ws, summaryRow, 8, entries.reduce(function (s, e) { return s + e.pemakaian; }, 0));

    setCell(ws, totalRow, 5, 'GRAND TOTAL');
    setCell(ws, totalRow, 8, entries.reduce(function (s, e) { return s + e.total; }, 0));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tagihan Air');

    const filename = 'pamsimas-tagihan-' + fileStamp() + '.xlsx';
    XLSX.writeFile(wb, filename);
    return true;
  }

  function setCell(ws, r, c, value) {
    const ref = XLSX.utils.encode_cell({ r: r, c: c });
    ws[ref] = { t: typeof value === 'number' ? 'n' : 's', v: value };
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fileStamp() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes());
  }

  return { exportToExcel: exportToExcel };
})();
