/* Konfigurasi tarif & konstanta aplikasi */
window.AppConfig = {
  ABONEMEN: 3000,          // Rp
  TARIF_PER_M3: 3000,      // Rp / m³
  STORAGE_KEY: 'pamsimas_history_v1',
  APP_NAME: 'PAMSIMAS',
  // Format rupiah tanpa desimal: Rp 150.000
  formatRupiah(value) {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },
  formatNumber(value) {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2
    }).format(value);
  }
};
