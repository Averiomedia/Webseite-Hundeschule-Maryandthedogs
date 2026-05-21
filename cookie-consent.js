/**
 * DSGVO Cookie Banner — Consent Mode v2
 * Mary and the Dogs | maryandthedogs.de
 *
 * ✅ DSGVO / TDDDG konform
 * ✅ 365 Tage Speicherung in localStorage
 * ✅ Widerruf jederzeit über Footer-Link
 * ✅ Schriftarten lokal gehostet – kein Google CDN
 * ✅ Keine externen Abhängigkeiten
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'mad_consent';
  const EXPIRY_DAYS = 365;

  // ── Banner HTML injizieren ────────────────────────────────
  function injectBanner() {
    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'cb-overlay';
    document.body.appendChild(overlay);

    // Banner HTML
    var wrap = document.createElement('div');
    wrap.innerHTML = '\
<div id="cb-banner" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">\
  <div class="cb-inner">\
    <div class="cb-top">\
      <div class="cb-text">\
        <p class="cb-title">Deine Privatsphäre</p>\
        <p>\
          Diese Website verwendet technisch notwendige Dienste für Animationen\
          (GSAP via Cloudflare CDN, Lenis via jsDelivr). Schriftarten werden lokal\
          bereitgestellt – ohne Verbindung zu Google. Mehr Infos in unserer\
          <a href="agb-datenschutz.html">Datenschutzerklärung</a>.\
        </p>\
      </div>\
    </div>\
\
    <div class="cb-toggles">\
      <div class="cb-toggle-row">\
        <label class="cb-switch">\
          <input type="checkbox" checked disabled>\
          <span class="cb-slider"></span>\
        </label>\
        <div class="cb-toggle-label">\
          <strong>Technisch notwendig</strong>\
          <span>GSAP &amp; Lenis (Animationen via Cloudflare / jsDelivr) — immer aktiv, keine Einwilligung erforderlich</span>\
        </div>\
      </div>\
    </div>\
\
    <div class="cb-buttons">\
      <button class="cb-btn cb-btn-accept" id="cb-accept-all">Verstanden</button>\
      <button class="cb-btn cb-btn-reject" id="cb-reject-all">Ablehnen</button>\
    </div>\
  </div>\
</div>';
    document.body.appendChild(wrap.firstElementChild);
  }

  // ── Einwilligung speichern ────────────────────────────────
  function saveConsent() {
    var data = {
      timestamp: new Date().toISOString(),
      version:   '3.0',
      expires:   Date.now() + EXPIRY_DAYS * 86400000
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
      if (raw === 'accepted' || raw === 'declined') return { version: '1.0' };
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

    document.getElementById('cb-accept-all').addEventListener('click', saveConsent);
    document.getElementById('cb-reject-all').addEventListener('click', saveConsent);

    // Footer Widerrufs-Link
    var settingsLink = document.getElementById('cookie-settings');
    if (settingsLink) {
      settingsLink.addEventListener('click', function (e) {
        e.preventDefault();
        openBanner();
      });
    }

    // Bekannten Nutzer: Banner nicht nochmal zeigen
    if (!loadSaved()) {
      setTimeout(openBanner, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
