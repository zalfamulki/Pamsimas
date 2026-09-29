/* Orkestrator DOM — menghubungkan form, hasil, riwayat, ekspor, cetak, dan PWA */
(function () {
  'use strict';

  const cfg = window.AppConfig;
  const $ = function (id) { return document.getElementById(id); };

  let lastResult = null;   // hasil perhitungan terakhir (belum/habis disimpan)
  let toastTimer = null;

  /* ============ Toast ============ */
  function toast(message, type) {
    const el = $('toast');
    el.textContent = message;
    el.className = 'toast' + (type ? ' ' + type : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  window.App = { toast: toast };

  /* ============ Form Hitung ============ */
  const form = $('billForm');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const awalRaw = $('meterAwal').value.trim();
    const akhirRaw = $('meterAkhir').value.trim();

    $('meterAwal').classList.remove('invalid');
    $('meterAkhir').classList.remove('invalid');

    if (awalRaw === '' || akhirRaw === '') {
      toast('Isi meter awal dan meter akhir.', 'error');
      (awalRaw === '' ? $('meterAwal') : $('meterAkhir')).classList.add('invalid');
      return;
    }

    const result = window.Calculator.hitung(Number(awalRaw), Number(akhirRaw));

    if (!result.ok) {
      const isAwalIssue = result.error.indexOf('awal') !== -1 && result.error.indexOf('akhir') === -1;
      (isAwalIssue ? $('meterAwal') : $('meterAkhir')).classList.add('invalid');
      toast(result.error, 'error');
      return;
    }

    lastResult = Object.assign({}, result, {
      nama: $('pelanggan').value.trim(),
      meterAwal: Number(awalRaw),
      meterAkhir: Number(akhirRaw)
    });

    renderResult(lastResult);
    $('resultCard').hidden = false;
    $('resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  form.addEventListener('reset', function () {
    $('meterAwal').classList.remove('invalid');
    $('meterAkhir').classList.remove('invalid');
    setTimeout(function () {
      $('resultCard').hidden = true;
      lastResult = null;
    }, 0);
  });

  function renderResult(r) {
    $('resultName').hidden = !r.nama;
    if (r.nama) $('resultName').textContent = 'Pelanggan: ' + r.nama;
    $('rPemakaian').textContent = cfg.formatNumber(r.pemakaian) + ' m³';
    $('rAbonemen').textContent = cfg.formatRupiah(r.abonemen);
    $('rBiayaPakai').textContent = cfg.formatRupiah(r.biayaPemakaian);
    $('rTotal').textContent = cfg.formatRupiah(r.total);
  }

  /* ============ Simpan ============ */
  $('saveBtn').addEventListener('click', function () {
    if (!lastResult) return;

    Store.add({
      nama: lastResult.nama,
      meterAwal: lastResult.meterAwal,
      meterAkhir: lastResult.meterAkhir,
      pemakaian: lastResult.pemakaian,
      abonemen: lastResult.abonemen,
      biayaPemakaian: lastResult.biayaPemakaian,
      total: lastResult.total
    });

    toast('Tersimpan ke riwayat.', 'success');
    renderHistory();
    form.reset();
    $('pelanggan').focus();
  });

  /* ============ Cetak struk (hasil aktif) ============ */
  $('printBtn').addEventListener('click', function () {
    if (!lastResult) {
      toast('Hitung tagihan dulu.', 'error');
      return;
    }
    window.Receipt.print(lastResult);
  });

  /* ============ Riwayat ============ */
  function renderHistory() {
    const entries = Store.all();
    const body = $('histBody');
    const has = entries.length > 0;

    $('emptyMsg').hidden = has;
    $('tableWrap').hidden = !has;
    $('summary').hidden = !has;
    $('exportBtn').disabled = !has;
    $('clearBtn').disabled = !has;
    $('histCount').textContent = entries.length + ' entri';

    body.innerHTML = '';

    entries.forEach(function (e, i) {
      const tr = document.createElement('tr');

      tr.innerHTML =
        '<td class="num">' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(e.nama || '-') + '</td>' +
        '<td class="num">' + cfg.formatNumber(e.meterAwal) + '</td>' +
        '<td class="num">' + cfg.formatNumber(e.meterAkhir) + '</td>' +
        '<td class="num">' + cfg.formatNumber(e.pemakaian) + '</td>' +
        '<td class="num">' + cfg.formatRupiah(e.abonemen) + '</td>' +
        '<td class="num">' + cfg.formatRupiah(e.biayaPemakaian) + '</td>' +
        '<td class="num total-cell">' + cfg.formatRupiah(e.total) + '</td>' +
        '<td class="num">' + formatShortDate(e.tanggal) + '</td>' +
        '<td><div class="row-actions">' +
          '<button type="button" class="icon-btn" data-act="print" title="Cetak struk" aria-label="Cetak struk">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
          '</button>' +
          '<button type="button" class="icon-btn danger" data-act="delete" title="Hapus" aria-label="Hapus entri">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>' +
        '</div></td>';

      tr.querySelector('[data-act="print"]').addEventListener('click', function () {
        window.Receipt.print(e);
      });
      tr.querySelector('[data-act="delete"]').addEventListener('click', function () {
        Store.remove(e.id);
        renderHistory();
        toast('Entri dihapus.');
      });

      body.appendChild(tr);
    });

    const grandTotal = entries.reduce(function (s, e) { return s + e.total; }, 0);
    const totalUsage = entries.reduce(function (s, e) { return s + e.pemakaian; }, 0);
    $('grandTotal').textContent = cfg.formatRupiah(grandTotal);
    $('totalUsage').textContent = 'Total pemakaian: ' + cfg.formatNumber(totalUsage) + ' m³';
  }

  /* ============ Ekspor & Hapus Semua ============ */
  $('exportBtn').addEventListener('click', function () {
    const ok = window.ExcelExporter.exportToExcel(Store.all());
    if (ok) toast('File Excel berhasil diunduh.', 'success');
  });

  $('clearBtn').addEventListener('click', function () {
    if (!confirm('Hapus semua riwayat? Tindakan ini tidak bisa dibatalkan.')) return;
    Store.clear();
    renderHistory();
    toast('Riwayat dikosongkan.');
  });

  /* ============ Info tarif ============ */
  $('aboutBtn').addEventListener('click', function () {
    alert(
      'Ketentuan Tarif PAMSIMAS\n\n' +
      'Total Tagihan = Abonemen + (Pemakaian × Tarif per m³)\n\n' +
      'Abonemen      : ' + cfg.formatRupiah(cfg.ABONEMEN) + ' / bulan\n' +
      'Tarif Pemakaian : ' + cfg.formatRupiah(cfg.TARIF_PER_M3) + ' / m³\n\n' +
      'Contoh: pemakaian 15 m³\n' +
      '= ' + cfg.formatRupiah(cfg.ABONEMEN) + ' + (15 × ' + cfg.formatRupiah(cfg.TARIF_PER_M3) + ')\n' +
      '= ' + cfg.formatRupiah(cfg.ABONEMEN + 15 * cfg.TARIF_PER_M3)
    );
  });

  /* ============ Util ============ */
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatShortDate(iso) {
    const d = new Date(iso);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* ============ PWA: Service Worker ============ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('Registrasi service worker gagal:', err);
      });
    });
  }

  /* ============ PWA: tombol pasang ============ */
  let deferredPrompt = null;
  const installBtn = $('installBtn');

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      installBtn.hidden = true;
      toast('Aplikasi dipasang di perangkat.', 'success');
    }
    deferredPrompt = null;
  });

  window.addEventListener('appinstalled', function () {
    installBtn.hidden = true;
  });

  /* ============ Status koneksi ============ */
  const netStatus = $('netStatus');

  function updateNetStatus() {
    const online = navigator.onLine;
    netStatus.hidden = false;
    netStatus.textContent = online ? 'Online' : 'Offline';
    netStatus.className = 'badge ' + (online ? 'badge-online' : 'badge-offline');
  }

  window.addEventListener('online', updateNetStatus);
  window.addEventListener('offline', updateNetStatus);
  updateNetStatus();

  /* ============ Init ============ */
  renderHistory();
})();
