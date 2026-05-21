/**
 * DSGVO Cookie Banner — Consent Mode v2
 * Mary and the Dogs | maryandthedogs.de
 *
 * ✅ DSGVO / TDDDG konform
 * ✅ 365 Tage Speicherung in localStorage
 * ✅ Widerruf jederzeit über Footer-Link
 * ✅ Granulare Zustimmung: technisch notwendig / Google Fonts
 * ✅ Keine externen Abhängigkeiten
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'mad_consent';
  const EXPIRY_DAYS = 365;

  // ── Banner HTML injizieren ────────────────────────────────
  function injectBanner() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'cb-overlay';
    document.body.appendChild(overlay);

    // Banner HTML
    const wrap = document.createElement('div');
    wrap.innerHTML = `
<div id="cb-banner" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
  <div class="cb-inner">
    <div class="cb-top">
      <div class="cb-text">
        <p class="cb-title">Deine Privatsphäre</p>
        <p>
          Diese Website verwendet Cookies und ähnliche Technologien.
          Technisch notwendige Dienste (Animationsbibliotheken) sind immer aktiv.
          Google Fonts kannst du separat aktivieren – standardmäßig deaktiviert.
          Mehr Infos in unserer <a href="agb-datenschutz.html">Datenschutzerklärung</a>.
        </p>
      </div>
    </div>

    <div class="cb-toggles">
      <div class="cb-toggle-row">
        <label class="cb-switch">
          <input type="checkbox" checked disabled>
          <span class="cb-slider"></span>
        </label>
        <div class="cb-toggle-label">
          <strong>Technisch notwendig</strong>
          <span>GSAP &amp; Lenis (Animationen via Cloudflare / jsDelivr) — immer aktiv, keine Einwilligung erforderlich</span>
        </div>
      </div>

      <div class="cb-toggle-row">
        <label class="cb-switch">
          <input type="checkbox" id="cb-fonts">
          <span class="cb-slider"></span>
        </label>
        <div class="cb-toggle-label">
          <strong>Google Fonts</strong>
          <span>Schriftarten von Google LLC (USA) — Übertragung Ihrer IP-Adresse an Google-Server</span>
        </div>
      </div>
    </div>

    <div class="cb-buttons">
      <button class="cb-btn cb-btn-accept" id="cb-accept-all">Alle akzeptieren</button>
      <button class="cb-btn cb-btn-save"   id="cb-save">Auswahl speichern</button>
      <button class="cb-btn cb-btn-reject" id="cb-reject-all">Alle ablehnen</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  // ── Google Fonts laden ────────────────────────────────────
  function loadFonts() {
    if (document.getElementById('cb-fonts-link')) return;
    ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].forEach(function (href, i) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = href;
      if (i === 1) pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    });
    var link = document.createElement('link');
    link.id = 'cb-fonts-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }

  // ── Einwilligung anwenden ─────────────────────────────────
  function applyConsent(fonts) {
    if (fonts) loadFonts();
  }

  // ── Einwilligung speichern ────────────────────────────────
  function saveConsent(fonts) {
    var data = {
      fonts:     fonts,
      timestamp: new Date().toISOString(),
      version:   '2.0',
      expires:   Date.now() + EXPIRY_DAYS * 86400000
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyConsent(fonts);
    closeBanner();
  }

  // ── Banner öffnen ─────────────────────────────────────────
  function openBanner() {
    var overlay = document.getElementById('cb-overlay');
    var banner  = document.getElementById('cb-banner');
    if (!overlay || !banner) return;
    overlay.classList.add('cb-visible');
    banner.classList.add('cb-visible');
    requestAnimationFrame(function () {
      overlay.classList.add('cb-show');
      banner.classList.add('cb-show');
    });
    document.body.style.overflow = 'hidden';
  }

  // ── Banner schließen ──────────────────────────────────────
  function closeBanner() {
    var overlay = document.getElementById('cb-overlay');
    var banner  = document.getElementById('cb-banner');
    if (!overlay || !banner) return;
    banner.classList.remove('cb-show');
    overlay.classList.remove('cb-show');
    setTimeout(function () {
      banner.classList.remove('cb-visible');
      overlay.classList.remove('cb-visible');
      document.body.style.overflow = '';
    }, 450);
  }

  // ── Gespeicherte Einwilligung laden ───────────────────────
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      // Rückwärtskompatibilität: altes Format war String
      if (raw === 'accepted') return { fonts: true,  version: '1.0' };
      if (raw === 'declined') return { fonts: false, version: '1.0' };
      var data = JSON.parse(raw);
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  // ── Initialisierung ───────────────────────────────────────
  function init() {
    injectBanner();

    var chkFonts = document.getElementById('cb-fonts');

    document.getElementById('cb-accept-all').addEventListener('click', function () {
      chkFonts.checked = true;
      saveConsent(true);
    });
    document.getElementById('cb-reject-all').addEventListener('click', function () {
      chkFonts.checked = false;
      saveConsent(false);
    });
    document.getElementById('cb-save').addEventListener('click', function () {
      saveConsent(chkFonts.checked);
    });

    // Footer Widerrufs-Link
    var settingsLink = document.getElementById('cookie-settings');
    if (settingsLink) {
      settingsLink.addEventListener('click', function (e) {
        e.preventDefault();
        var saved = loadSaved();
        if (saved) chkFonts.checked = saved.fonts || false;
        openBanner();
      });
    }

    // Bekannten Nutzer sofort anwenden, sonst Banner zeigen
    var saved = loadSaved();
    if (saved) {
      applyConsent(saved.fonts || false);
    } else {
      setTimeout(openBanner, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
