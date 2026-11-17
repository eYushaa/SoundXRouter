<div align="center">

![SoundX Router Banner](static/logo1.png)

**The Ultimate Studio Audio Routing & Mixing Tool for Streamers, Gamers, and Creators.**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**Languages:**
**English** ·
[Türkçe](docs/readme/README.tr.md) ·
[العربية](docs/readme/README.ar.md) ·
[Русский](docs/readme/README.ru.md) ·
[简体中文](docs/readme/README.zh.md) ·
[日本語](docs/readme/README.ja.md) ·
[עברית](docs/readme/README.he.md) ·
[Français](docs/readme/README.fr.md) ·
[Deutsch](docs/readme/README.de.md) ·
[Español](docs/readme/README.es.md)

</div>

---

## What's New in V1.0.3

- **8 Studio Themes:** Built-in theme switcher featuring **Liquid Glass**, **Midnight Indigo**, **Daylight White**, **Pure Black AMOLED**, **Cyberpunk Neon**, **Emerald Forest**, **Warm Sunset**, and **Arctic Nord** — complete with tuned surface contrast, borders, and matching oscilloscope waveform palettes.
- **10-Language Localization & Auto-Detection:** Full UI localization in **English, Türkçe, العربية, Русский, 简体中文, 日本語, עברית, Français, Deutsch, and Español**. On first startup, SoundX Router automatically detects your Windows OS display language (falling back to English if unsupported) and lets you switch languages anytime from the header.
- **Complete Vector SVG Icon Overhaul:** Replaced legacy UI emojis with crisp, theme-aware inline SVG icons across navigation tabs, mixer app cards, mute controls, routing alerts, and soundboard actions.
- **Per-Script Typography & Full RTL Support:** Curated font stacks (`Plus Jakarta Sans`, `Inter`, `Cairo`, `Rubik`, `Noto Sans SC`, `Noto Sans JP`), non-Japanese readability font scaling, full Right-to-Left (`RTL`) layout mirroring for Arabic and Hebrew, and a BiDi fix so device names with parentheses (such as `CABLE Output (VB-Audio Virtual Cable)`) render accurately in RTL dropdowns.
- **Header Alignment & Rendering Polish:** Locked the 3-column header (`1fr auto 1fr`) so the navigation pill remains strictly centered (`0px` shift) when toggling routing state, eliminated rounded-corner translucent dark edges, shortened and vertically aligned the footer action button (**ROUTE / STOP**) flush with the waveform oscilloscope, and added a Chromium 83 `flex-gap` polyfill for `PyQtWebEngine`.

---

## Screenshots

| Application Audio Mixer | Routing & Devices |
| :---: | :---: |
| ![Application Audio Mixer](docs/screenshots/app-mixer.png) | ![Routing and Devices](docs/screenshots/routing-devices.png) |

| Integrated Soundboard | Daylight White & Pure Black AMOLED Themes |
| :---: | :---: |
| ![Soundboard](docs/screenshots/soundboard.png) | ![Daylight White Theme](docs/screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](docs/screenshots/theme-amoled.png)

</div>

---

## What is SoundX Router?

**SoundX Router** is your personal sonic alchemy deck for Windows. Forget sending a bare, lifeless microphone signal — fuse your voice in real time with any soundtrack, game audio, browser tab, ambient soundscape, or soundboard hit running on your desktop, sculpt the exact balance live, and route that one-of-a-kind audio blend straight into Discord, OBS Studio, games, or Windows Voice Recorder as a single razor-sharp virtual microphone feed.

### Core Capabilities

1. **Real-Time Multi-Application Audio Mixer:** Capture and mix audio simultaneously from running desktop processes into your microphone stream with independent `0–150%` sliders, instant mute toggles, and per-app VU meters.
2. **Virtual Microphone Bridge:** Route your final studio mix directly to **SteelSeries Sonar - Microphone**, **VB-Audio Virtual Cable**, or any virtual audio driver.
3. **One-Click Device Copy & Test Chime:** Copy your active output device name or send an instant test tone to verify microphone levels in Discord, OBS, or Voice Recorder.
4. **Feedback Loop Hazard Protection:** Automatically detects if the same virtual cable is chosen for both input and output and warns you before echo loops happen.
5. **Smart Zero-Feedback Headphone Monitoring:** Preview the exact outgoing stream in your real headphones without feeding audio back into the microphone.
6. **Live VU Meters & Waveform Oscilloscope:** Real-time monitoring for **Mic In**, **Apps Mix**, and **Master Out** in the persistent studio footer.
7. **Presets & Auto-Persistence:** Save and recall complete setups (`presets.json`) while active apps, volumes, theme, and language persist automatically in `config.json`.
8. **Integrated Soundboard:** Play continuous ambient loops or trigger tracks from `sounds/` using global hotkeys (`keybinds.json`), even in full-screen games.

---

## Installation

You can easily install SoundX Router simply by downloading and running `SoundXRouter-Setup.exe` from the [Releases](https://github.com/eYushaa/SoundXRouter/releases) page.

---

## Recommended Discord / OBS Setup

| SoundX Router Setting | Selection in SoundX Router | Discord / OBS Microphone Setting |
| --- | --- | --- |
| **Microphone / Primary Input** | USB Microphone or `CABLE Output (VB-Audio Virtual Cable)` | — |
| **Master Virtual Output** | `SteelSeries Sonar - Microphone` or `CABLE Input` | Select the corresponding microphone input (`CABLE Output` or `SteelSeries Sonar`) |
| **Headphone Monitoring** | Your Physical Headphones / Speakers | Select your real headphones as playback device |

---

## Project Structure

```text
SoundXRouter/
├── app.py                  # Flask REST server + frameless PyQt5 QtWebEngine window
├── audio_manager.py        # Device discovery, routing coordination & presets helper
├── audio_engine.py         # Low-latency sounddevice/numpy stream & ambience mixing engine
├── app_audio_manager.py    # Per-process WASAPI loopback capture (proctap + pycaw)
├── device_helper.py        # Windows registry & audio endpoint helpers
├── hotkey_manager.py       # Global soundboard keyboard shortcuts manager
├── requirements.txt        # Python dependencies
├── templates/index.html    # Single-page studio UI template
├── static/                 # Modular CSS, themes, i18n, flex-gap polyfill, JS & logo.ico
└── docs/                   # Localized READMEs and release screenshots
```

---

<div align="center">

**Made with care by eYushaa**  
*Control your sound, own your stream.*

</div>
