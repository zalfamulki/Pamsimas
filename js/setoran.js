/* ============================================
   setoran.js — Menu Setoran (terpisah dari tagihan)
   Tanpa rumus: nominal dicatat apa adanya,
   untuk pelanggan yang bayar cicilan.
   ============================================ */
(function () {
  'use strict';

  const cfg = window.AppConfig;
  const $ = function (id) { return document.getElementById(id); };

  const form = $('setoranForm');
  const namaInput = $('sNama');
  const rtInput = $('sRt');
  const jumlahInput = $('sJumlah');
  const ketInput = $('sKet');

  function toast(message, type) {
    if (window.App && window.App.toast) window.App.toast(message, type);
  }

  function clearFieldState() {
    [namaInput, jumlahInput].forEach(function (inp) {
      inp.classList.remove('invalid');
      inp.classList.remove('shake');
    });
    $('errSNama').textContent = '';
    $('errSJumlah').textContent = '';
  }

  function flagInvalid(input, errEl, message) {
    input.classList.remove('shake');
    void input.offsetWidth; /* restart animasi goyang */
    input.classList.add('invalid', 'shake');
    errEl.textContent = message;
  }

  /* Live: bersihkan error saat mengetik */
  [namaInput, jumlahInput].forEach(function (inp) {
    inp.addEventListener('input', function () {
      inp.classList.remove('invalid');
      const err = inp === namaInput ? $('errSNama') : $('errSJumlah');
      err.textContent = '';
    });
  });

  /* ============ Simpan setoran ============ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldState();

    const nama = namaInput.value.trim();
    const jumlahRaw = jumlahInput.value.trim();
    const jumlah = Number(jumlahRaw);

    if (!nama) {
      flagInvalid(namaInput, $('errSNama'), 'Nama wajib diisi.');
      toast('Nama pelanggan wajib diisi.', 'error');
      namaInput.focus();
      return;
    }

    if (jumlahRaw === '') {
      flagInvalid(jumlahInput, $('errSJumlah'), 'Wajib diisi.');
      toast('Isi jumlah setoran.', 'error');
      jumlahInput.focus();
      return;
    }

    if (!isFinite(jumlah) || jumlah <= 0) {
      flagInvalid(jumlahInput, $('errSJumlah'), 'Jumlah setoran harus lebih dari 0.');
      toast('Jumlah setoran harus lebih dari 0.', 'error');
      jumlahInput.focus();
      return;
    }

    const record = SetoranStore.add({
      nama: nama,
      rt: rtInput.value || '',
      jumlah: Math.round(jumlah),
      keterangan: ketInput.value.trim()
    });

    toast('Setoran tersimpan.', 'success');
    renderHistory(record.id);
    form.reset();
    clearFieldState();
    namaInput.focus();
  });

  form.addEventListener('reset', function () {
    setTimeout(clearFieldState, 0);
  });

  /* ============ Render riwayat ============ */
  function renderHistory(newEntryId) {
    const entries = SetoranStore.all();
    const body = $('sHistBody');
    const has = entries.length > 0;

    $('sEmptyState').hidden = has;
    $('sTableWrap').hidden = !has;
    $('sSummary').hidden = !has;
    $('sExportBtn').disabled = !has;
    $('sClearBtn').disabled = !has;
    $('sHistCount').textContent = entries.length + ' entri';

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
        '<td class="num total-cell">' + cfg.formatRupiah(e.jumlah) + '</td>' +
        '<td>' + escapeHtml(e.keterangan || '-') + '</td>' +
        '<td class="num">' + formatShortDate(e.tanggal) + '</td>' +
        '<td><div class="row-actions">' +
          '<button type="button" class="icon-btn danger" data-act="delete" title="Hapus" aria-label="Hapus setoran">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>' +
        '</div></td>';

      tr.querySelector('[data-act="delete"]').addEventListener('click', function () {
        SetoranStore.remove(e.id);
        renderHistory();
        toast('Setoran dihapus.');
      });

      body.appendChild(tr);
    });

    const grand = entries.reduce(function (s, e) { return s + e.jumlah; }, 0);
    $('sGrandTotal').textContent = cfg.formatRupiah(grand);
    $('sCountText').textContent = entries.length + ' entri';
  }

  /* ============ Ekspor & Hapus Semua ============ */
  $('sExportBtn').addEventListener('click', function () {
    const ok = window.ExcelExporter.exportSetoranToExcel(SetoranStore.all());
    if (ok) toast('File Excel berhasil diunduh.', 'success');
  });

  $('sClearBtn').addEventListener('click', function () {
    if (!confirm('Hapus semua riwayat setoran? Tindakan ini tidak bisa dibatalkan.')) return;
    SetoranStore.clear();
    renderHistory();
    toast('Riwayat setoran dikosongkan.');
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

  /* ============ Init ============ */
  renderHistory();
})();
