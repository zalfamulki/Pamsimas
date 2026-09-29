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
  const awalInput = $('meterAwal');
  const akhirInput = $('meterAkhir');
  const namaInput = $('pelanggan');
  const rtInput = $('rt');
  const kurangGerak = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clearFieldState() {
    [awalInput, akhirInput].forEach(function (inp) {
      inp.classList.remove('invalid');
      inp.classList.remove('shake');
    });
    $('errAwal').textContent = '';
    $('errAkhir').textContent = '';
  }

  function flagInvalid(input, errEl, message) {
    input.classList.remove('shake');
    void input.offsetWidth; /* restart animasi goyang */
    input.classList.add('invalid', 'shake');
    errEl.textContent = message;
  }

  /**
   * Hitung & tampilkan hasil. Dipakai saat submit maupun live-preview saat mengetik.
   * @param {object} opts {silent: boolean, scroll: boolean, animate: boolean}
   * @returns {object|null} lastResult bila valid
   */
  function tryCalculate(opts) {
    opts = opts || {};
    const awalRaw = awalInput.value.trim();
    const akhirRaw = akhirInput.value.trim();
    clearFieldState();

    if (awalRaw === '' || akhirRaw === '') {
      lastResult = null;
      $('resultCard').hidden = true;
      return null;
    }

    const result = window.Calculator.hitung(Number(awalRaw), Number(akhirRaw));

    if (!result.ok) {
      const msg = result.error;
      const isAwal = msg.indexOf('awal') !== -1 && msg.indexOf('akhir') === -1;
      flagInvalid(isAwal ? awalInput : akhirInput, isAwal ? $('errAwal') : $('errAkhir'), msg);
      lastResult = null;
      $('resultCard').hidden = true;
      if (!opts.silent) toast(msg, 'error');
      return null;
    }

    lastResult = Object.assign({}, result, {
      nama: namaInput.value.trim(),
      rt: rtInput.value,
      meterAwal: Number(awalRaw),
      meterAkhir: Number(akhirRaw),
      tanggal: new Date().toISOString()
    });

    renderResult(lastResult, opts.animate !== false);
    $('resultCard').hidden = false;
    if (opts.scroll) $('resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return lastResult;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const awalRaw = awalInput.value.trim();
    const akhirRaw = akhirInput.value.trim();

    if (awalRaw === '' || akhirRaw === '') {
      const empty = awalRaw === '' ? awalInput : akhirInput;
      flagInvalid(empty, awalRaw === '' ? $('errAwal') : $('errAkhir'), 'Wajib diisi.');
      toast('Isi meter awal dan meter akhir.', 'error');
      empty.focus();
      return;
    }

    tryCalculate({ silent: false, scroll: true });
  });

  /* Live preview: hitung otomatis setiap ada ketikan */
  [awalInput, akhirInput].forEach(function (inp) {
    inp.addEventListener('input', function () {
      tryCalculate({ silent: true, scroll: false });
    });
  });
  function renderIdentity(r) {
    const parts = [];
    if (r.nama) parts.push('Pelanggan: ' + r.nama);
    if (r.rt) parts.push(r.rt);
    $('resultName').hidden = parts.length === 0;
    $('resultName').textContent = parts.join(' • ');
  }

  function syncIdentity() {
    if (!lastResult) return;
    lastResult.nama = namaInput.value.trim();
    lastResult.rt = rtInput.value;
    renderIdentity(lastResult);
  }

  namaInput.addEventListener('input', syncIdentity);
  rtInput.addEventListener('change', syncIdentity);

  form.addEventListener('reset', function () {
    clearFieldState();
    setTimeout(function () {
      $('resultCard').hidden = true;
      lastResult = null;
    }, 0);
  });

  /* Animasi angka naik (count-up) untuk nilai hasil */
  function animateValue(el, target, format) {
    if (kurangGerak) {
      el.textContent = format(target);
      return;
    }
    if (el._rafId) cancelAnimationFrame(el._rafId);
    const dur = 400;
    const t0 = performance.now();
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) el._rafId = requestAnimationFrame(step);
    })(t0);
  }

  function renderResult(r, animate) {
    renderIdentity(r);
    $('rAbonemen').textContent = cfg.formatRupiah(r.abonemen);
    if (animate) {
      animateValue($('rPemakaian'), r.pemakaian, function (v) { return cfg.formatNumber(v) + ' m³'; });
      animateValue($('rBiayaPakai'), r.biayaPemakaian, cfg.formatRupiah);
      animateValue($('rTotal'), r.total, cfg.formatRupiah);
    } else {
      $('rPemakaian').textContent = cfg.formatNumber(r.pemakaian) + ' m³';
      $('rBiayaPakai').textContent = cfg.formatRupiah(r.biayaPemakaian);
      $('rTotal').textContent = cfg.formatRupiah(r.total);
    }
  }

  /* ============ Simpan ============ */
  $('saveBtn').addEventListener('click', function () {
    if (!lastResult) return;

    const saved = Store.add({
      nama: lastResult.nama,
      rt: lastResult.rt || '',
      meterAwal: lastResult.meterAwal,
      meterAkhir: lastResult.meterAkhir,
      pemakaian: lastResult.pemakaian,
      abonemen: lastResult.abonemen,
      biayaPemakaian: lastResult.biayaPemakaian,
      total: lastResult.total
    });

    toast('Tersimpan ke riwayat.', 'success');
    renderHistory(saved ? saved.id : null);
    lastResult = null; /* cegah simpan ganda bila tombol ditekan 2x */
    $('resultCard').hidden = true;
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

  /* ============ Ripple Wave Click Effect pada Tombol ============ */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn');
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = diameter + 'px';
    circle.style.left = (e.clientX - rect.left - radius) + 'px';
    circle.style.top = (e.clientY - rect.top - radius) + 'px';
    circle.classList.add('ripple-wave');
    const existing = btn.querySelector('.ripple-wave');
    if (existing) existing.remove();
    btn.appendChild(circle);
    setTimeout(function () { circle.remove(); }, 600);
  });

  /* ============ Riwayat ============ */
  function renderHistory(newEntryId) {
    const entries = Store.all();
    const body = $('histBody');
    const has = entries.length > 0;

    const emptyEl = $('emptyState') || $('emptyMsg');
    if (emptyEl) emptyEl.hidden = has;
    $('tableWrap').hidden = !has;
    $('summary').hidden = !has;
    $('exportBtn').disabled = !has;
    $('clearBtn').disabled = !has;
    $('histCount').textContent = entries.length + ' entri';

    body.innerHTML = '';

    entries.forEach(function (e, i) {
      const tr = document.createElement('tr');
      if (newEntryId && e.id === newEntryId) {
        tr.classList.add('row-new');
      }

      tr.innerHTML =
        '<td class="num">' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(e.nama || '-') + '</td>' +
        '<td>' + escapeHtml(e.rt || '-') + '</td>' +
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
  /* Guard: elemen aboutBtn tidak ada di HTML → lewati agar init tidak crash */
  const aboutBtn = $('aboutBtn');
  if (aboutBtn) aboutBtn.addEventListener('click', function () {
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

  /* ============ PWA: tombol pasang (selalu tampil di navbar) ============ */
  let deferredPrompt = null;
  const installBtn = $('installBtn');

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true; /* iOS */
  }

  function refreshInstallBtn() {
    installBtn.hidden = isStandalone(); /* sembunyi hanya bila sudah terpasang */
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    refreshInstallBtn();
  });

  installBtn.addEventListener('click', async function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast('Aplikasi dipasang di perangkat.', 'success');
      }
      deferredPrompt = null;
      refreshInstallBtn();
      return;
    }
    /* Browser tidak menyediakan prompt otomatis (mis. Safari/iPhone):
       tampilkan petunjuk manual. */
    toast('Menu browser > Instal aplikasi / Tambah ke Layar Utama.', 'success');
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    refreshInstallBtn();
  });

  if (window.matchMedia) {
    const mqStandalone = window.matchMedia('(display-mode: standalone)');
    if (mqStandalone.addEventListener) mqStandalone.addEventListener('change', refreshInstallBtn);
    else if (mqStandalone.addListener) mqStandalone.addListener(refreshInstallBtn);
  }
  refreshInstallBtn();

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
