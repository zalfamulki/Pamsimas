/* Penyimpanan riwayat di localStorage (tanpa database) */
window.Store = (function () {
  'use strict';

  const KEY = window.AppConfig.STORAGE_KEY;
  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cache)) cache = [];
    } catch (e) {
      console.warn('Gagal membaca penyimpanan:', e);
      cache = [];
    }
    return cache;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Gagal menyimpan:', e);
      return false;
    }
    return true;
  }

  function all() {
    return load().slice();
  }

  /** Tambah entri baru; mengembalikan entri lengkap dengan id & tanggal. */
  function add(entry) {
    const list = load();
    const record = Object.assign({
      id: 'pms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nama: '',
      tanggal: new Date().toISOString()
    }, entry);
    list.push(record);
    persist();
    return record;
  }

  function remove(id) {
    const list = load();
    const idx = list.findIndex(function (e) { return e.id === id; });
    if (idx === -1) return false;
    list.splice(idx, 1);
    persist();
    return true;
  }

  function clear() {
    cache = [];
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
  }

  function count() {
    return load().length;
  }

  return { all: all, add: add, remove: remove, clear: clear, count: count };
})();
