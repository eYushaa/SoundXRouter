# SoundX Router 🎛️

![SoundX Router Banner](static/logo1.png)

<div align="center">

**The Ultimate Audio Routing & Mixing Tool for Streamers, Gamers, and RVC Enthusiasts.**  
*Yayıncılar, Oyuncular ve RVC Tutkunları için Nihai Ses Yönlendirme ve Miksleme Aracı.*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-win.svg)](https://www.microsoft.com/windows)

</div>

---

<details open>
<summary><h1>🇺🇸 English (Click to Expand)</h1></summary>

## 🚀 What is SoundX Router?

**SoundX Router** is not just another audio tool; it's the command center for your digital voice. In the modern streaming and gaming landscape, managing audio inputs, AI voice changers (RVC), and sound effects can be a nightmare of virtual cables and latency.

**SoundX Router solves this.** It acts as a high-performance middleware that sits between your microphone (or RVC output) and your streaming software (OBS/Discord). It allows you to:
1.  **Inject** background ambience and music into your voice stream.
2.  **Trigger** sound effects with global hotkeys.
3.  **Route** the final mix to a virtual microphone.
4.  **Monitor** everything in real-time with zero latency.

All of this is wrapped in a stunning **Liquid Glass UI** that looks as good as it sounds.

## ✨ Key Features

### 🎛️ Professional Audio Routing
- **Device Agnostic:** Works with any input (Microphone, Cable Output, RVC) and any output (Speakers, Cable Input).
- **Low Latency Engine:** Built on `sounddevice` and `numpy` for real-time DSP (Digital Signal Processing) with minimal delay.
- **Smart Mixing:** Automatically ducks background noise when sound effects are triggered (optional).

### 🎹 Integrated Soundboard
- **Drag & Drop:** Just drop your `.mp3`, `.wav`, or `.ogg` files into the `sounds/` folder.
- **Global Hotkeys:** Bind any sound to any key (e.g., `Numpad 1`, `Ctrl+F1`). Works even when you are in-game!
- **Loop & One-Shot:** Toggle sounds to loop forever (ambience) or play once (effects).

### 🎧 Smart Preview System
- **The Problem:** Usually, if you want to hear your effects, you have to route them to your speakers, which causes feedback loops or double audio on stream.
- **The Solution:** SoundX Router's **Smart Preview** lets you hear the final mix in your headphones *without* sending that monitoring audio back into the microphone feed.

### 🎨 Liquid Glass UI
- **Modern Aesthetics:** A fully transparent, blur-backed interface (Glassmorphism) that blends into your desktop.
- **Reactive Visuals:** The "Reactive Aura" and Waveform visualizers pulse and move in sync with your voice intensity.
- **User Experience:** Smooth animations, toast notifications, and intuitive controls.

## 🛠️ Installation

### Prerequisites
- **OS:** Windows 10 or 11
- **Python:** Version 3.10 or higher
- **Virtual Cable:** Recommended (e.g., VB-Audio Cable) to route audio to Discord/OBS.

### Step-by-Step Guide

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/eYushaa/SoundXRouter.git
    cd SoundXRouter
    ```

2.  **Set Up Virtual Environment (Optional but Recommended):**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Application:**
    ```bash
    python app.py
    ```

## 🎮 Usage Scenarios

### 🎙️ For RVC (AI Voice) Users
1.  Set your RVC software output to **"CABLE Input"**.
2.  In SoundX Router, set **Input Device** to **"CABLE Output"**.
3.  Set **Output Device** to another virtual cable (e.g., **"CABLE-B Input"**) or **"SteelSeries Sonar Microphone"**.
4.  Now you can add background rain, lo-fi music, or sound effects on top of your AI voice!

### 🎥 For Streamers
1.  Route your microphone through SoundX Router.
2.  Use the **Soundboard** to trigger funny sounds during your stream.
3.  Use **Presets** to switch between "Just Chatting" (light background music) and "Gaming" (no music, just effects) modes instantly.

## 🔧 Technical Architecture

- **Backend:** Python Flask serves as the local API server.
- **Audio Engine:** A custom-threaded engine using `sounddevice` for raw stream manipulation and `numpy` for mixing.
- **Frontend:** A Single Page Application (SPA) built with HTML5, CSS3, and Vanilla JS, served via `PyQtWebEngine`.
- **Inter-Process Communication:** The frontend communicates with the Python backend via REST API calls (`/api/...`).

</details>

---

<details>
<summary><h1>🇹🇷 Türkçe (Okumak için Tıklayın)</h1></summary>

## 🚀 SoundX Router Nedir?

**SoundX Router**, sıradan bir ses aracı değildir; dijital sesiniz için bir komuta merkezidir. Modern yayıncılık ve oyun dünyasında, ses girişlerini, Yapay Zeka ses değiştiricilerini (RVC) ve ses efektlerini yönetmek, sanal kablolar ve gecikme sorunlarıyla dolu bir kabusa dönüşebilir.

**SoundX Router bunu çözer.** Mikrofonunuz (veya RVC çıkışınız) ile yayın yazılımınız (OBS/Discord) arasında duran yüksek performanslı bir ara katman görevi görür. Şunları yapmanızı sağlar:
1.  **Entegre Et:** Ses akışınıza arka plan ambiyansı ve müzik ekleyin.
2.  **Tetikle:** Global kısayol tuşlarıyla ses efektlerini ateşleyin.
3.  **Yönlendir:** Son miksi sanal bir mikrofona aktarın.
4.  **Dinle:** Her şeyi sıfır gecikmeyle gerçek zamanlı olarak takip edin.

Tüm bunlar, göründüğü kadar iyi duyulan muhteşem bir **Liquid Glass (Sıvı Cam)** arayüzü içinde sunulur.

## ✨ Öne Çıkan Özellikler

### 🎛️ Profesyonel Ses Yönlendirme
- **Cihaz Bağımsız:** Herhangi bir giriş (Mikrofon, Cable Output, RVC) ve herhangi bir çıkış (Hoparlör, Cable Input) ile çalışır.
- **Düşük Gecikme Motoru:** `sounddevice` ve `numpy` kullanılarak minimum gecikme ile gerçek zamanlı DSP (Dijital Sinyal İşleme) yapılır.
- **Akıllı Miksleme:** Ses efektleri çaldığında arka plan gürültüsünü otomatik olarak kısar (opsiyonel).

### 🎹 Entegre Soundboard
- **Sürükle & Bırak:** `.mp3`, `.wav` veya `.ogg` dosyalarınızı `sounds/` klasörüne atmanız yeterli.
- **Global Kısayollar:** Herhangi bir sesi herhangi bir tuşa atayın (örn: `Numpad 1`, `Ctrl+F1`). Oyundayken bile çalışır!
- **Döngü & Tek Seferlik:** Sesleri sonsuz döngüye alın (ambiyans için) veya tek seferlik çalın (efektler için).

### 🎧 Akıllı Önizleme Sistemi
- **Sorun:** Genellikle efektlerinizi duymak isterseniz, bunları hoparlörünüze yönlendirmeniz gerekir; bu da yayında yankı veya çift ses sorununa yol açar.
- **Çözüm:** SoundX Router'ın **Akıllı Önizleme** özelliği, son miksi yayına giden sesi bozmadan *sadece* kulaklığınızdan duymanızı sağlar.

### 🎨 Liquid Glass Arayüzü
- **Modern Estetik:** Masaüstünüzle bütünleşen, tamamen şeffaf, arkası bulanık (Glassmorphism) bir arayüz.
- **Reaktif Görseller:** Sesinizin şiddetiyle senkronize olarak parlayan ve hareket eden "Reaktif Aura" ve Dalga Formu görselleştirmeleri.
- **Kullanıcı Deneyimi:** Akıcı animasyonlar, bildirimler ve sezgisel kontroller.

## 🛠️ Kurulum

### Gereksinimler
- **İşletim Sistemi:** Windows 10 veya 11
- **Python:** Sürüm 3.10 veya üzeri
- **Sanal Kablo:** Sesi Discord/OBS'e aktarmak için önerilir (örn: VB-Audio Cable).

### Adım Adım Rehber

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/eYushaa/SoundXRouter.git
    cd SoundXRouter
    ```

2.  **Sanal Ortam Oluşturun (Opsiyonel ama Önerilir):**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Gerekli Kütüphaneleri Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    python app.py
    ```

## 🎮 Kullanım Senaryoları

### 🎙️ RVC (Yapay Zeka Ses) Kullanıcıları İçin
1.  RVC yazılımınızın çıkışını **"CABLE Input"** olarak ayarlayın.
2.  SoundX Router'da **Input Device** olarak **"CABLE Output"** seçin.
3.  **Output Device** olarak başka bir sanal kablo (örn: **"CABLE-B Input"**) veya doğrudan Discord girişini seçin.
4.  Artık yapay zeka sesinizin üzerine yağmur sesi, lo-fi müzik veya efektler ekleyebilirsiniz!

### 🎥 Yayıncılar İçin
1.  Mikrofonunuzu SoundX Router üzerinden geçirin.
2.  Yayında komik anlar için **Soundboard**'u kullanın.
3.  **Presetler** sayesinde "Sohbet" (hafif müzik) ve "Oyun" (sadece efektler) modları arasında anında geçiş yapın.

## 🔧 Teknik Mimari

- **Backend:** Python Flask, yerel API sunucusu olarak çalışır.
- **Audio Engine:** Ham ses işleme için `sounddevice` ve miksaj için `numpy` kullanan özel iş parçacıklı (threaded) motor.
- **Frontend:** HTML5, CSS3 ve Vanilla JS ile oluşturulmuş, `PyQtWebEngine` üzerinden sunulan Tek Sayfa Uygulaması (SPA).
- **İletişim:** Arayüz ve Python arka ucu, REST API çağrıları (`/api/...`) ile haberleşir.

</details>

---

<div align="center">

**Made with ❤️ by eYushaa**  
*Control your sound, own your stream.*

</div>
