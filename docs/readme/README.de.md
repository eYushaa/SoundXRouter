<div align="center">

![SoundX Router Banner](../../static/logo1.png)

**Das moderne Studio-Tool für Audio-Routing & Multi-App-Mixing unter Windows.**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**Sprachen:**
[English](../../README.md) ·
[Türkçe](README.tr.md) ·
[العربية](README.ar.md) ·
[Русский](README.ru.md) ·
[简体中文](README.zh.md) ·
[日本語](README.ja.md) ·
[עברית](README.he.md) ·
[Français](README.fr.md) ·
**Deutsch** ·
[Español](README.es.md)

</div>

---

## Neuheiten in V1.0.3 (Changelog)

- **8 Studio-Themes:** Integrierter Theme-Umschalter mit **Liquid Glass**, **Midnight Indigo**, **Tageslicht Weiß (Light)**, **Reines Schwarz (AMOLED)**, **Cyberpunk Neon**, **Smaragdwald**, **Warmer Sonnenuntergang** und **Arktisches Nord** inklusive abgestimmter Kontraste und Oszilloskop-Farbpaletten.
- **10 Sprachen & automatische Spracherkennung:** Vollständige Lokalisierung in **English, Türkçe, العربية, Русский, 简体中文, 日本語, עברית, Français, Deutsch und Español**. Beim ersten Start wird automatisch die Windows-Anzeigesprache erkannt (Fallback auf Englisch) und lässt sich jederzeit in der Kopfzeile wechseln.
- **Vollständige Vektor-SVG-Icons:** Sämtliche UI-Emojis in Tabs, Mixer-Karten, Stummschalt-Buttons, Warnhinweisen und Soundboard-Schaltflächen wurden durch gestochen scharfe SVG-Vektoricons ersetzt.
- **Schriftarten je Schriftsystem & RTL-Unterstützung:** Optimierte Schriftfamilien (`Plus Jakarta Sans`, `Inter`, `Cairo`, `Rubik`, `Noto Sans SC`, `Noto Sans JP`), vergrößerte Schriftgrößen für nicht-japanische Sprachen, vollständiges Right-to-Left (`RTL`) Layout für Arabisch und Hebräisch sowie korrigierte Klammerdarstellung (BiDi) in RTL-Auswahllisten.
- **Stabile Header-Zentrierung & Rendering-Fixes:** Ein symmetrisches 3-Spalten-Raster (`1fr auto 1fr`) verhindert ein Verrutschen der Tabs bei aktivem Routing (`0px` Versatz); transparente dunkle Artefakte an abgerundeten Fensterecken wurden beseitigt; die Start-/Stopp-Schaltfläche wurde auf **STARTEN / STOPPEN** gekürzt; Chromium-83-Kompatibilität über ein `flex-gap`-Polyfill ergänzt.

---

## Bildschirmfotos

> Die folgenden Screenshots zeigen die englische Oberfläche der Version V1.0.3.

| Anwendungs-Audio-Mixer | Routing & Geräte |
| :---: | :---: |
| ![Application Audio Mixer](../screenshots/app-mixer.png) | ![Routing and Devices](../screenshots/routing-devices.png) |

| Integriertes Soundboard | Tageslicht Weiß & Reines Schwarz (AMOLED) |
| :---: | :---: |
| ![Soundboard](../screenshots/soundboard.png) | ![Daylight White Theme](../screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](../screenshots/theme-amoled.png)

</div>

---

## Was ist SoundX Router?

**SoundX Router** ist Ihr persönliches Klanglabor unter Windows. Schluss mit einem trockenen, einsamen Mikrofonsignal: Verschmelzen Sie Ihre Stimme in Echtzeit mit laufenden Apps, Musik, Spielsound, Browser-Audio, dichten Hintergrund-Atmosphären und Soundboard-Effekten zu einer maßgeschneiderten Klangkomposition — und routen Sie genau diesen einzigartigen Mix direkt als kristallklaren Mikrofon-Feed in Discord, OBS Studio, Spiele oder den Sprachrekorder.

### Hauptfunktionen

1. **Echtzeit-App-Audio-Mixer:** Audio von mehreren laufenden Apps gleichzeitig mit eigenen Reglern (`0–150%`), Mute-Schalter und VU-Metern in den Mikrofon-Stream mischen.
2. **Virtuelle Mikrofon-Brücke:** Direkte Ausgabe an **SteelSeries Sonar - Microphone**, **VB-Audio Virtual Cable** oder andere virtuelle Treiber.
3. **1-Klick-Gerätename & Testton:** Gerätenamen sofort kopieren und einen Testton senden, um den Pegel in Discord oder OBS direkt zu prüfen.
4. **Rückkopplungsschutz:** Erkennt automatisch, wenn Ein- und Ausgang auf demselben virtuellen Kabel liegen, und warnt vor Echoschleifen.
5. **Smart Preview (Kopfhörer-Monitoring):** Hören Sie Ihren exakt ausgehenden Mix ohne Rückkopplung über Ihre echten Kopfhörer mit.
6. **Live-VU-Meter & Oszilloskop:** Echtzeitanzeige für **Mic In**, **Apps Mix** und **Master Out** in der Fußzeile.
7. **Presets & automatisches Speichern:** Komplette Konfigurationen in `presets.json` sichern; App-Listen, Regler, Theme und Sprache werden in `config.json` gespeichert.
8. **Soundboard mit globalen Hotkeys:** Hintergrundschleifen und Soundeffekte aus `sounds/` per Tastenkombination (`keybinds.json`) sogar in Vollbildspielen auslösen.

---

## Installation

Sie können SoundX Router ganz einfach installieren, indem Sie `SoundXRouter-Setup.exe` auf der Seite [Releases](https://github.com/eYushaa/SoundXRouter/releases) herunterladen und ausführen.

---

## Empfohlene Einstellungen für Discord / OBS

| Einstellung in SoundX Router | Auswahl in SoundX Router | Mikrofon-Einstellung in Discord / OBS |
| --- | --- | --- |
| **Mikrofon / Primäreingang** | USB-Mikrofon oder `CABLE Output (VB-Audio Virtual Cable)` | — |
| **Virtueller Master-Ausgang** | `SteelSeries Sonar - Microphone` oder `CABLE Input` | Den passenden Mikrofoneingang (`CABLE Output` oder `SteelSeries Sonar`) wählen |
| **Kopfhörer-Monitoring** | Ihre physischen Kopfhörer / Lautsprecher | Ihre echten Kopfhörer als Wiedergabegerät wählen |

---

## Projektstruktur

```text
SoundXRouter/
├── app.py                  # Flask-API-Server + rahmenloses PyQt5-QtWebEngine-Fenster
├── audio_manager.py        # Geräteerkennung, Routing-Koordination & Presets
├── audio_engine.py         # Latenzarme sounddevice/numpy-Audio- und Mix-Engine
├── app_audio_manager.py    # Prozessspezifische WASAPI-Loopback-Erfassung (proctap + pycaw)
├── device_helper.py        # Windows-Registry- & Audiogeräte-Hilfsfunktionen
├── hotkey_manager.py       # Globale Tastenkombinationen für das Soundboard
├── requirements.txt        # Python-Abhängigkeiten
├── templates/index.html    # UI-Vorlage der Studio-Oberfläche
├── static/                 # CSS-Module, Themes, i18n, Flex-Gap-Polyfill, JS & logo.ico
└── docs/                   # Mehrsprachige READMEs und Screenshots
```

---

<div align="center">

**Mit Sorgfalt entwickelt von eYushaa**  
*Kontrolliere deinen Sound, beherrsche deinen Stream.*

</div>
