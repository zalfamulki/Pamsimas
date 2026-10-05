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
        'RT': e.rt || '-',
        'Meter Awal (m³)': e.meterAwal,
        'Meter Akhir (m³)': e.meterAkhir,
        'Pemakaian (m³)': e.pemakaian,
        'Biaya Abonemen (Rp)': e.abonemen,
        'Biaya Pemakaian (Rp)': e.biayaPemakaian,
        'Total Tagihan (Rp)': e.total
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Format rupiah Indonesia: sel tetap angka (bisa di-SUM),
    // tampil sebagai "Rp. 25.000". [$‑421] = locale Indonesia
    // agar titik ribuan muncul di semua locale Excel.
    const RUPIAH_FMT = '[$-421]"Rp. "#,##0';
    for (let r = 1; r <= entries.length; r++) {
      [7, 8, 9].forEach(function (c) {
        const ref = XLSX.utils.encode_cell({ r: r, c: c });
        if (ws[ref]) ws[ref].z = RUPIAH_FMT;
      });
    }

    // Lebar kolom agar rapi
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 18 },  // Tanggal
      { wch: 24 },  // Nama
      { wch: 10 },  // RT
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
    setCell(ws, summaryRow, 6, 'Total Pemakaian');
    setCell(ws, summaryRow, 9, entries.reduce(function (s, e) { return s + e.pemakaian; }, 0));

    setCell(ws, totalRow, 6, 'GRAND TOTAL');
    setCell(ws, totalRow, 9, entries.reduce(function (s, e) { return s + e.total; }, 0), RUPIAH_FMT);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tagihan Air');

    const filename = 'pamsimas-tagihan-' + fileStamp() + '.xlsx';
    XLSX.writeFile(wb, filename);
    return true;
  }

  /**
   * Unduh riwayat setoran sebagai file Excel.
   * @param {Array} entries daftar entri setoran
   * @returns {boolean} true jika berhasil
   */
  function exportSetoranToExcel(entries) {
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
        'RT': e.rt || '-',
        'Setoran (Rp)': e.jumlah,
        'Keterangan': e.keterangan || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    const RUPIAH_FMT = '[$-421]"Rp. "#,##0';
    for (let r = 1; r <= entries.length; r++) {
      const ref = XLSX.utils.encode_cell({ r: r, c: 4 });
      if (ws[ref]) ws[ref].z = RUPIAH_FMT;
    }

    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 18 },  // Tanggal
      { wch: 24 },  // Nama
      { wch: 10 },  // RT
      { wch: 16 },  // Setoran
      { wch: 30 }   // Keterangan
    ];

    const range = XLSX.utils.decode_range(ws['!ref']);
    const summaryRow = range.e.r + 2;

    setCell(ws, summaryRow, 3, 'TOTAL SETORAN');
    setCell(ws, summaryRow, 4, entries.reduce(function (s, e) { return s + e.jumlah; }, 0), RUPIAH_FMT);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Setoran');

    const filename = 'pamsimas-setoran-' + fileStamp() + '.xlsx';
    XLSX.writeFile(wb, filename);
    return true;
  }

  function setCell(ws, r, c, value, fmt) {
    const ref = XLSX.utils.encode_cell({ r: r, c: c });
    ws[ref] = { t: typeof value === 'number' ? 'n' : 's', v: value };
    if (fmt) ws[ref].z = fmt;
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

  return { exportToExcel: exportToExcel, exportSetoranToExcel: exportSetoranToExcel };
})();
