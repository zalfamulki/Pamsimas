/* ============================================
   splash.js — Mengontrol transisi & penutupan splash screen
   ============================================ */
(function () {
  'use strict';

  function dismissSplash() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    // Tambahkan class fade-out untuk transisi CSS halus
    splash.classList.add('fade-out');

    // Hapus dari alur render setelah animasi selesai
    setTimeout(function () {
      splash.style.display = 'none';
    }, 550);
  }

  // Tampilkan splash screen minimal 1.6 detik untuk memberi efek riak air & progress bar
  const minDisplayTime = 1700;
  const startTime = Date.now();

  function onReady() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);
    setTimeout(dismissSplash, remaining);
  }

  if (document.readyState === 'complete') {
    onReady();
  } else {
    window.addEventListener('load', onReady);
    // Fallback maksimal bila ada resource eksternal lambat
    setTimeout(dismissSplash, 2600);
  }
})();
