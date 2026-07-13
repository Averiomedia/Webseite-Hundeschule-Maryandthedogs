/**
 * Kontaktformular – Botschutz
 * Mary and the Dogs | maryandthedogs.de
 *
 * Schutzmechanismen:
 *  1. Honeypot   — verstecktes Feld muss leer bleiben
 *  2. Zeitstempel — Formular muss >= 3 s offen sein
 *  3. Client-Validierung — Name, E-Mail, Datenschutz-Checkbox
 *
 * Kein Backend nötig — valide Anfragen öffnen einen
 * vorausgefüllten mailto:-Link im E-Mail-Client.
 */

(function () {
  'use strict';

  var MIN_TIME_MS = 3000;

  function initContactForm(trainingPreset) {
    var form     = document.getElementById('contact-form');
    if (!form) return;

    var tsInput  = document.getElementById('cf-ts');
    var hpInput  = document.getElementById('cf-hp');
    var msgEl    = document.getElementById('cf-msg');
    var training = document.getElementById('cf-training');

    // Zeitstempel beim Laden setzen
    tsInput.value = Date.now();

    // Trainingstyp vorauswählen (optional, wenn übergeben)
    if (trainingPreset && training) {
      training.value = trainingPreset;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showMsg(msgEl, '', false);

      // 1. Honeypot-Check
      if (hpInput && hpInput.value !== '') {
        return;
      }

      // 2. Zeitstempel-Check
      var elapsed = Date.now() - parseInt(tsInput.value || '0', 10);
      if (elapsed < MIN_TIME_MS) {
        showMsg(msgEl, 'Bitte warte einen Moment und versuche es nochmal.', true);
        return;
      }

      // 3. Pflichtfelder validieren
      var name    = form.querySelector('#cf-name').value.trim();
      var email   = form.querySelector('#cf-email').value.trim();
      var privacy = form.querySelector('#cf-privacy').checked;
      var msg     = form.querySelector('#cf-message') ? form.querySelector('#cf-message').value.trim() : '';
      var subject = (training && training.value) ? training.value : (trainingPreset || 'Trainingsanfrage');

      if (!name) {
        showMsg(msgEl, 'Bitte gib deinen Namen ein.', true);
        form.querySelector('#cf-name').focus();
        return;
      }
      if (!email || !isValidEmail(email)) {
        showMsg(msgEl, 'Bitte gib eine gültige E-Mail-Adresse ein.', true);
        form.querySelector('#cf-email').focus();
        return;
      }
      if (!privacy) {
        showMsg(msgEl, 'Bitte stimme der Datenschutzerklärung zu.', true);
        return;
      }

      // 4. mailto-URL bauen und öffnen
      var body = 'Hallo Marie,\n\n'
        + 'Name: ' + name + '\n'
        + 'E-Mail: ' + email + '\n'
        + (subject ? 'Interesse an: ' + subject + '\n' : '')
        + (msg ? '\nNachricht:\n' + msg : '')
        + '\n\nViele Grüße,\n' + name;

      var mailto = 'mailto:info@maryandthedogs.de'
        + '?subject=' + encodeURIComponent('Trainingsanfrage – ' + subject)
        + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      showMsg(msgEl, 'Dein E-Mail-Programm öffnet sich gleich. Falls nicht, schreib uns direkt an info@maryandthedogs.de', false);
      form.reset();
      tsInput.value = Date.now();
    });
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function showMsg(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
    el.className = 'cf-msg' + (isError ? ' cf-msg-error' : ' cf-msg-ok');
  }

  window.initContactForm = initContactForm;
})();
