![SoundX Router Banner](static/logo1.png)

<div align="center">

**The Ultimate Studio Audio Routing & Mixing Tool for Streamers, Gamers, and Creators.**  
*Yayıncılar, Oyuncular ve İçerik Üreticileri için Gelişmiş Stüdyo Ses Yönlendirme ve Miksleme Aracı.*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-win.svg)](https://www.microsoft.com/windows)
[![Download](https://img.shields.io/badge/Download-V1.0.1_Single_EXE-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)

</div>

---

<details open>
<summary><h1>🇺🇸 English</h1></summary>

## 🚀 What is SoundX Router?

**SoundX Router** is a modern, high-performance studio audio routing middleware and mixer for Windows. It acts as the central command bridge between your physical microphone (or AI voice changer like RVC / Voicemod), your running applications (Spotify, Chrome, Discord, Games), and your target streaming software (Discord, OBS Studio, Games, Windows Voice Recorder).

### 💡 Core Capabilities:
1. **Multi-Application Audio Mixer:** Capture and mix audio simultaneously from multiple running applications into your microphone feed with independent faders, mute controls, and VU meters.
2. **Smart Virtual Microphone Routing:** Easily route your final studio mix to **SteelSeries Sonar - Microphone**, **VB-Audio Virtual Cable**, or any virtual microphone driver.
3. **One-Click Target Device Copy:** Copy the exact device name to select as your microphone in Discord, OBS, or Windows Voice Recorder with one click.
4. **Smart Zero-Feedback Headphone Monitoring:** Listen to the live mix in your real headphones without feedback loops or audio leakage.
5. **Audio Driver System:** Supports **Windows DirectSound**, **MME**, **Windows WASAPI**, and **WDM-KS**.
6. **Live Multi-Channel VU Meters & Oscilloscope:** Real-time audio waveform animation and volume meters for Mic In, Apps Mix, and Master Out.
7. **Configuration Presets & Auto-Persistence:** Switch between different audio setups with 1-click presets; last used devices and volumes are automatically restored on launch.
8. **Integrated Soundboard:** Trigger background ambience or sound effects with global hotkeys even while in full-screen games.

---

## ✨ Key Features in Detail

### 🎛️ Real-Time Multi-Application Audio Mixer
- **Dynamic Application Discovery:** Automatically detects currently playing and running audio processes.
- **Smart Filtering:** Switch between **"Playing"** (active audio output) and **"All"** running apps.
- **Clean Application Names:** Formatted friendly names without ugly `.exe` extensions.
- **Independent Channels:** Dedicated volume control (0-150%), instant mute toggle, and live VU meters for every app.
- **Auto-Restoration:** Your mixed application list, volume levels, and mute states are saved and restored automatically across restarts.

### 🎙️ Advanced Routing & Virtual Device Bridge
- **Dynamic Detection:** Automatically detects VB-Cable, SteelSeries Sonar, Voicemod, and standard audio endpoints.
- **Discord & OBS Quick Setup:** View direct status and copy the active microphone name (`SteelSeries Sonar - Microphone` or `CABLE Output`).
- **Test Tone (Chime):** Send a test chime to the Master Output to verify your Discord or OBS microphone input meter with zero hassle.
- **Feedback Loop Hazard Protection:** Automatically detects if the same virtual cable is chosen for input and output, displaying an alert to prevent feedback screeching.

### 🎧 Zero-Feedback Headphone Monitoring (Smart Preview)
- **The Problem:** Hearing what Discord hears usually requires routing audio to speakers, creating echo and feedback loops.
- **The Solution:** Smart Preview sends the mixed audio directly to your real headphones on a dedicated stream without routing back into the microphone.
- **Dedicated Volume:** Adjust monitor volume independently from the master stream.

### 💾 Presets & Instant State Restoration
- Save and load complete routing setups (driver, input mic, master output, monitor output, volume levels).
- Persistent state: The app remembers your last selected devices, active apps, and slider settings automatically in `config.json`.

### 🎨 Liquid Glass Studio UI
- Frameless, translucent Glassmorphism interface with smooth gradients and micro-animations.
- Fluid responsive layout with spacious controls, clear button spacing, and no distracting focus outlines.

---

## 🛠️ Installation & Quick Start

### 📦 Standalone Portable Executable (Recommended)
1. Download `SoundXRouter.exe` from the [Releases](https://github.com/eYushaa/SoundXRouter/releases) page.
2. Place it in any folder and run `SoundXRouter.exe` — **no installation required!**
3. Select your input microphone and target output (e.g. `SteelSeries Sonar - Microphone` or `CABLE Output`).
4. Click **START ROUTING** to begin!

### ⚡ Running from Source
```bash
# 1. Clone repository
git clone https://github.com/eYushaa/SoundXRouter.git
cd SoundXRouter

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch application
python app.py
```

---

## 🎮 Recommended Setup for Discord / OBS

| SoundX Router Setting | Your Selection in SoundX Router | In Discord / OBS Microphone Input |
|---|---|---|
| **Input (Microphone)** | Your USB Microphone or `CABLE Output` | — |
| **Master Virtual Output** | `SteelSeries Sonar - Microphone` or `CABLE Output` | Select the same device as your **Microphone / Input** |
| **Headphone Monitoring** | Your Physical Headphones / Speakers | Select your real headphones |

---

## 🔧 Technical Architecture

- **Backend:** Python Flask API server running in a background thread.
- **GUI & Web View:** Built with `PyQt5` + `PyQtWebEngine` (Chromium-based), using dynamic cache-busting headers.
- **Audio Engine:** Low-latency stream processing with `sounddevice` and `numpy`.
- **Application Audio Capture:** Real-time per-process loopback capture powered by `proctap` and `pycaw`.
- **Packaging:** Standalone single-file Windows executable created with `PyInstaller`.

</details>

---

<details>
<summary><h1>🇹🇷 Türkçe</h1></summary>

## 🚀 SoundX Router Nedir?

**SoundX Router**, Windows için geliştirilmiş modern, yüksek performanslı bir stüdyo ses yönlendirme ve miksleme aracıdır. Fiziksel mikrofonunuz (veya RVC / Voicemod gibi yapay zeka ses değiştiriciniz), çalışan uygulamalarınız (Spotify, Chrome, Discord, Oyunlar) ve yayın/ses kayıt yazılımlarınız (Discord, OBS Studio, Oyunlar, Windows Ses Kaydedici) arasında akıllı bir ses köprüsü kurar.

### 💡 Temel Yetenekler:
1. **Çoklu Uygulama Ses Mikseri:** İstediğiniz uygulamaların sesini aynı anda mikrofon akışınıza miksleyin; her uygulama için bağımsız ses ayarı, sessize alma (Mute) ve canlı seviye göstergesi.
2. **Akıllı Sanal Mikrofon Yönlendirmesi:** Miksi **SteelSeries Sonar - Microphone**, **VB-Audio Virtual Cable** veya diğer sanal mikrofon sürücülerine doğrudan aktarın.
3. **Tek Tıkla Aygıt Adı Kopyalama:** Discord veya OBS'de seçmeniz gereken mikrofon aygıt adını tek tıkla kopyalayın.
4. **Sıfır Geri Besleme (Feedback) Kulaklık İzleme:** Son miksi, mikrofona yankı veya döngü yapmadan doğrudan gerçek kulaklığınızdan dinleyin.
5. **Ses Sürücü Desteği:** **Windows DirectSound**, **MME**, **Windows WASAPI** ve **WDM-KS** sürücüleri arasında kolay geçiş.
6. **Canlı Çok Kanallı VU Metreler & Osiloskop:** Alt panelde canlı dalga formu görselleştiricisi ile Mic In, Apps Mix ve Master Out ses seviye göstergeleri.
7. **Yapılandırma Presetleri & Otomatik Kayıt:** Farklı ses düzenlerinizi preset olarak kaydedin; son seçtiğiniz aygıtlar ve ses seviyeleri uygulama her açıldığında otomatik olarak geri yüklenir.
8. **Entegre Soundboard:** `sounds/` klasöründeki ses efektlerini global kısayol tuşlarıyla oyundayken bile tetikleyin.

---

## ✨ Öne Çıkan Özellikler

### 🎛️ Gerçek Zamanlı Çoklu Uygulama Mikseri
- **Dinamik Uygulama Tarama:** Ses çalan uygulamaları otomatik tespit eder.
- **Akıllı Filtreleme:** **"Playing"** (sadece ses oynatanlar) ve **"All"** (tüm uygulamalar) modları arasında geçiş yapabilirsiniz.
- **Temiz Uygulama Adları:** Çirkin `.exe` uzantıları gizlenir, uygulamanın gerçek ve temiz adı gösterilir.
- **Ayrı Kanallar:** Her uygulama için %0-150 arası ses seviyesi, tek tıkla Mute ve gerçek zamanlı seviye göstergesi.
- **Kalıcı Durum:** Mikse eklediğiniz uygulamalar, ses düzeyleri ve sessiz durumları uygulama yeniden başlatıldığında otomatik hatırlanır.

### 🎙️ Gelişmiş Ses Yönlendirme & Sanal Köprü
- **Otomatik Aygıt Tespiti:** VB-Cable, SteelSeries Sonar ve diğer sanal sürücüleri otomatik algılar.
- **Test Sesi Gönder:** Master Çıkış'a tek tıkla test sesi göndererek Discord veya OBS'deki mikrofon seviye çubuğunu anında test edin.
- **Döngü (Loop) Koruması:** Giriş ve çıkışta aynı kablo seçildiğinde kullanıcıyı uyararak kulak zarını rahatsız eden geri besleme seslerini engeller.

### 🎧 Sıfır Gecikmeli Kulaklık Önizleme (Smart Preview)
- Yayına veya Discord'a giden sesi, mikrofon yayınına geri besleme yapmadan doğrudan kulaklığınızdan önizleyin.
- Ayrı kulaklık ses kontrol çubuğu ile izleme seviyesini dilediğiniz gibi ayarlayın.

### 💾 Presetler ve Otomatik Ayar Hatırlama
- Tek tıkla Preset kaydetme ve geri yükleme.
- `config.json` dosyası sayesinde seçtiğiniz sürücü, mikrofon, çıkış aygıtı ve ses düzeyleri otomatik olarak kaydedilir ve her açılışta korunur.

### 🎨 Sıvı Cam (Liquid Glass) Stüdyo Arayüzü
- Şeffaf, bulanıklık efektli (Glassmorphism), modern ve ferah tasarım.
- Tuşlar ve form alanları arasında ferah boşluklar ve pürüzsüz geçişler.

---

## 🛠️ Kurulum & Çalıştırma

### 📦 Tek Dosya Taşınabilir EXE (Önerilen)
1. [Releases](https://github.com/eYushaa/SoundXRouter/releases) sayfasından `SoundXRouter.exe` dosyasını indirin.
2. İstediğiniz klasöre koyun ve çift tıklayarak çalıştırın — **kurulum gerektirmez!**
3. Mikrofonunuzu ve Master Çıkışınızı seçin.
4. **START ROUTING** butonuna basarak ses aktarımını başlatın!

### ⚡ Kaynak Koddan Çalıştırma
```bash
# 1. Depoyu klonlayın
git clone https://github.com/eYushaa/SoundXRouter.git
cd SoundXRouter

# 2. Gereksinimleri yükleyin
pip install -r requirements.txt

# 3. Uygulamayı başlatın
python app.py
```

---

## 🎮 Discord ve OBS Ayar Rehberi

| SoundX Router Ayarı | SoundX Router İçinde Seçilecek | Discord / OBS Mikrofon Ayarı |
|---|---|---|
| **Microphone / Primary Input** | USB Mikrofonunuz veya `CABLE Output` | — |
| **Master Virtual Output** | `SteelSeries Sonar - Microphone` veya `CABLE Output` | Discord/OBS'de **Giriş Aygıtı (Mikrofon)** olarak aynı aygıtı seçin |
| **Headphone Monitoring** | Gerçek Kulaklığınız / Hoparlörünüz | Gerçek kulaklığınızı seçin |

---

## 🔧 Teknik Mimari

- **Arka Uç:** Arka planda çalışan Python Flask REST API sunucusu.
- **Arayüz:** `PyQt5` + `PyQtWebEngine` (Chromium motoru) ile çalışan modern Tek Sayfa Uygulaması (SPA).
- **Ses Motoru:** `sounddevice` ve `numpy` ile sıfır gecikmeli çok kanallı ses işleme.
- **Uygulama Ses Yakalama:** `proctap` ve `pycaw` tabanlı Windows WASAPI loopback yakalama.
- **Dağıtım:** `PyInstaller` ile derlenmiş bağımsız tek parça Windows `.exe` dosyası.

</details>

---

<div align="center">

**Made with ❤️ by eYushaa**  
*Control your sound, own your stream.*

</div>
