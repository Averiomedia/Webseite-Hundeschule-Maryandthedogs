# 14 Tage Winter-Hundechallenge – Admin-Anleitung

## Zugangscodes verwalten

Codes werden in der Netlify-Umgebungsvariable `CHALLENGE_CODES` gespeichert.

### Code hinzufügen
1. Netlify → Dein Projekt → **Site configuration → Environment variables**
2. Variable `CHALLENGE_CODES` bearbeiten
3. Codes kommagetrennt eintragen, z. B.: `winter2024,team-hati,hund-bello`
4. **Save** klicken → dann **Deploys → Trigger deploy** (oder einfach pushen)

Codes sind Groß-/Kleinschreibung egal und Leerzeichen werden ignoriert.
`WINTER2024` und `winter 2024` funktionieren beide.

### Code sperren
Code aus der Liste entfernen → speichern → neu deployen.
Bestehende Cookies mit diesem Code werden beim nächsten Aufruf automatisch ungültig.

---

## Secret setzen (einmalig)

1. Netlify → **Environment variables → Add variable**
2. Name: `CHALLENGE_SECRET`
3. Wert: ein langes, zufälliges Passwort (z. B. 32+ Zeichen, kein Sonderzeichen nötig)
   Beispiel: `xK9mP2qL8nR5vT3wY7uJ4hD6fA1cB0eG`
4. **Save** → neu deployen

**Wichtig:** Das Secret nie im Code oder öffentlichen Repos speichern.
Es signiert die Login-Cookies – bei Änderung werden alle bestehenden Logins ungültig.

---

## Wie der Schutz funktioniert

- Eine Netlify Edge Function (Deno) fängt alle Anfragen auf `/winter-challenge/*` ab
- Die Login-Seite (`login.html`) ist öffentlich erreichbar
- Nach richtigem Code setzt die Edge Function ein **HttpOnly + Secure** Cookie
  - Cookie-Wert: `base64(code:HMAC-SHA256(secret, code))`
  - Gültig 90 Tage
  - Ein zweites nicht-HttpOnly Cookie speichert nur den Code (für localStorage-Schlüssel)
- Bei jedem Aufruf wird das Cookie geprüft:
  - Ist der Code noch in `CHALLENGE_CODES`? → Zugang
  - Stimmt die HMAC-Signatur? → Zugang
  - Sonst → Login-Seite

---

## Lokal testen mit netlify dev

1. Netlify CLI installieren: `npm install -g netlify-cli`
2. Im Projektordner Datei `.env` anlegen (wird nicht eingecheckt):
   ```
   CHALLENGE_CODES=testcode,hund2024
   CHALLENGE_SECRET=mein-lokales-test-secret
   ```
3. `netlify dev` starten
4. Öffne `http://localhost:8888/winter-challenge/`

### Checkliste
- [ ] Ohne Code → nur Login-Seite
- [ ] Challenge-Dateien direkt aufrufen → gesperrt
- [ ] Falscher Code → Fehlermeldung
- [ ] Richtiger Code → Challenge öffnet sich
- [ ] Häkchen, Stufe, Zähler, Notiz, Hundename bleiben nach Neuladen erhalten
- [ ] Code aus `CHALLENGE_CODES` entfernen → Zugang gesperrt
- [ ] Ansicht auf 375 px Breite testen
- [ ] Druckansicht der Urkunde testen

---

## Datenschutz-Absatz für die Datenschutzerklärung

Bitte diesen Absatz in deine Datenschutzerklärung aufnehmen (nach Prüfung anpassen):

> **Zugangsgeschützter Bereich (Winter-Hundechallenge)**
>
> Für den Zugang zur „14 Tage Winter-Hundechallenge" wird ein technisch notwendiges
> Cookie gesetzt (`ch_token`), das deinen verschlüsselten Zugangscode enthält.
> Dieses Cookie ist erforderlich, um den geschützten Bereich zugänglich zu machen,
> und wird ohne deine Einwilligung gesetzt (Art. 6 Abs. 1 lit. b DSGVO).
> Es enthält keine personenbezogenen Daten und wird nach 90 Tagen automatisch ungültig.
> Dein Trainingsfortschritt wird ausschließlich lokal in deinem Browser gespeichert
> (`localStorage`) und nicht an Server übertragen.
