(function () {
  const KEY = 'mad_consent';

  function loadFonts() {
    ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].forEach(function (href, i) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = href;
      if (i === 1) pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    });
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }

  var consent = localStorage.getItem(KEY);
  if (consent === 'accepted') { loadFonts(); return; }
  if (consent === 'declined') { return; }

  function showBanner() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    requestAnimationFrame(function () { banner.classList.add('cookie-visible'); });

    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem(KEY, 'accepted');
      banner.classList.remove('cookie-visible');
      setTimeout(function () { banner.style.display = 'none'; }, 400);
      loadFonts();
    });

    document.getElementById('cookie-decline').addEventListener('click', function () {
      localStorage.setItem(KEY, 'declined');
      banner.classList.remove('cookie-visible');
      setTimeout(function () { banner.style.display = 'none'; }, 400);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
