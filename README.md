# Storm Chaser — Prototype

Kurzes Prototype für ein Storm Chaser Spiel (Phaser 3, JavaScript).

Starten:
- Öffne das Verzeichnis `storm-chaser` in einem Webserver (z. B. VS Code Live Server oder `python -m http.server`).
- Öffne die Seite im Browser.

Steuerung:
- Bewegung: **WASD** (Tastatur)
- Deploy: **SPACE** (Tastatur)
- Start Wave: **ENTER** (Tastatur)
- Touch: On‑screen Buttons für Start & Deploy sind oben rechts/links verfügbar.

Was ist implementiert:
- Scrollbare Karte mit Gitter
- Fahrzeugauswahl (TIV1/TIV2/DOM1..3)
- Tornados spawn und bewegen sich; auf der Karte als Dreieck (Farbe = Stärke)
- Deploy vs Tornado: wenn Tornado stärker als Fahrzeug, wird Fahrzeug kurz hochgeschleudert

Nächste Schritte / ToDo:
- Bessere Grafiken/Animationen
- Minimap-Icons als echte Dreiecke mit Richtungspfeil
- AI-Pathing für Tornados auf Straßen
- Partikeleffekte und Sounds

Wenn du eigene Fahrzeug-Grafiken lieferst (PNG/SVG), ersetze die Dateien in `assets/vehicles/` mit gleichen Namen (tiv1,tiv2,dom1,dom2,dom3).