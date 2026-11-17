<div align="center">

![SoundX Router Banner](../../static/logo1.png)

**أداة استوديو متطورة لتوجيه ومزج صوت التطبيقات للبث المباشر والألعاب وصنّاع المحتوى على Windows.**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**اللغات:**
[English](../../README.md) ·
[Türkçe](README.tr.md) ·
**العربية** ·
[Русский](README.ru.md) ·
[简体中文](README.zh.md) ·
[日本語](README.ja.md) ·
[עברית](README.he.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Español](README.es.md)

</div>

---

<div dir="rtl">

## ما الجديد في الإصدار V1.0.3 (سجل التغييرات)

- **8 سمات استوديو احترافية:** مبدّل سمات مدمج يضم **الزجاج السائل (Liquid Glass)** و**نيلي منتصف الليل** و**النهار الأبيض (Light)** و**الأسود النقي AMOLED** و**نيون سايبربانك** و**الغابة الزمردية** و**الغروب** و**الشمال القطبي** مع تباين مضبوط وألوان متناسقة لموجة الصوت.
- **دعم 10 لغات والتعرف التلقائي على لغة النظام:** تعريب كامل يشمل **العربية وEnglish وTürkçe وРусский و简体中文 و日本語 وעברית وFrançais وDeutsch وEspañol**. عند أول تشغيل يتعرف التطبيق تلقائياً على لغة نظام Windows (أو يعود إلى الإنجليزية) مع إمكانية التبديل في أي وقت من الشريط العلوي.
- **أيقونات SVG متجهة بالكامل:** استبدال جميع الرموز التعبيرية القديمة بأيقونات SVG حادة ومتوافقة مع كل سمة في التبويبات وبطاقات التطبيقات وأزرار الكتم والتنبيهات ولوحة الأصوات.
- **خطوط مخصصة لكل أبجدية ودعم كامل للاتجاه من اليمين إلى اليسار (RTL):** خطوط عربية مقروءة (`Cairo` / `Noto Sans Arabic`)، تكبير أحجام النصوص للغات غير اليابانية لوضوح أفضل، عكس كامل للتخطيط إلى `RTL` للغتين العربية والعبرية، وإصلاح عرض الأقواس (BiDi) لأسماء الأجهزة مثل `CABLE Output (VB-Audio Virtual Cable)`.
- **توسيط دقيق للشريط العلوي وتحسينات العرض:** شبكة رأس متناظرة (`1fr auto 1fr`) تبقي أزرار التنقل في المنتصف تماماً (`0px` إزاحة) عند بدء البث، إزالة الحواف الداكنة عند زوايا النافذة المستديرة، محاذاة زر التشغيل والإيقاف أفقياً بمستوى راسم الموجة، وإضافة توافق `flex-gap` لمحرك QtWebEngine Chromium 83.

</div>

---

## لقطات الشاشة

> تم التقاط الصور من الواجهة الإنجليزية للإصدار V1.0.3.

| مازج صوت التطبيقات | التوجيه والأجهزة |
| :---: | :---: |
| ![Application Audio Mixer](../screenshots/app-mixer.png) | ![Routing and Devices](../screenshots/routing-devices.png) |

| لوحة الأصوات المدمجة | سمة النهار الأبيض والأسود النقي AMOLED |
| :---: | :---: |
| ![Soundboard](../screenshots/soundboard.png) | ![Daylight White Theme](../screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](../screenshots/theme-amoled.png)

</div>

---

<div dir="rtl">

## ما هو SoundX Router؟

**SoundX Router** هو مختبر الخيمياء الصوتية الخاص بك على نظام Windows. انسَ إرسال صوت ميكروفون جاف ووحيد: امزج صوتك الحي في الوقت الفعلي مع الموسيقى، أصوات الألعاب، تبويبات المتصفح، الأجواء المحيطية الغامرة ومؤثرات لوحة الأصوات لتصنع خلطة صوتية استثنائية لا تشبه غيرها، ووجّه هذا المزيج المتكامل مباشرة كبث ميكروفون نقي إلى Discord أو OBS Studio أو الألعاب أو مسجل الصوت.

### القدرات الأساسية

1. **مازج تطبيقات فوري:** التقاط ودمج صوت عدة برامج معاً في بث الميكروفون مع منزلقات صوت مستقلة (`0–150%`) وزر كتم ومؤشرات VU لكل تطبيق.
2. **جسر الميكروفون الافتراضي:** توجيه المزيج النهائي مباشرة إلى **SteelSeries Sonar - Microphone** أو **VB-Audio Virtual Cable** أو أي تعريف افتراضي.
3. **نسخ بنقرة واحدة ونغمة اختبار:** انسخ اسم جهاز الإخراج أو أرسل نغمة اختبار للتحقق الفوري من مستوى الصوت في Discord أو OBS.
4. **الحماية من حلقات الصدى (Feedback Loop):** يكتشف تلقائياً اختيار الكابل نفسه للإدخال والإخراج وينبهك لتجنب الصفير والصدى.
5. **مراقبة ذكية عبر السماعات (Smart Preview):** استمع إلى المزيج الخارج كما يسمعه الآخرون في سماعاتك دون إرجاع الصوت للميكروفون.
6. **مؤشرات VU وراسم موجة مباشر:** عرض فوري لمستوى **الميكروفون** و**مزيج التطبيقات** و**الإخراج الرئيسي**.
7. **إعدادات مسبقة وحفظ تلقائي:** احفظ تكويناتك في `presets.json` بينما تُحفظ التطبيقات والأحجام والسمة واللغة تلقائياً في `config.json`.
8. **لوحة أصوات مدمجة (Soundboard):** تشغيل حلقات الأجواء الصوتية من مجلد `sounds/` عبر اختصارات لوحة المفاتيح العامة (`keybinds.json`) حتى داخل الألعاب بوضع ملء الشاشة.

---

## التثبيت

يمكنك تثبيت SoundX Router بسهولة بمجرد تنزيل `SoundXRouter-Setup.exe` وتشغيله من صفحة [Releases](https://github.com/eYushaa/SoundXRouter/releases).

---

## الإعداد الموصى به لبرامج Discord و OBS

</div>

| إعداد SoundX Router | الاختيار داخل التطبيق | إعداد الميكروفون في Discord / OBS |
| --- | --- | --- |
| **الميكروفون / الإدخال الرئيسي** | ميكروفون USB أو `CABLE Output (VB-Audio Virtual Cable)` | — |
| **الإخراج الافتراضي الرئيسي** | `SteelSeries Sonar - Microphone` أو `CABLE Input` | اختر جهاز الإدخال المقابل (`CABLE Output` أو `SteelSeries Sonar`) |
| **مراقبة سماعات الرأس** | سماعات الرأس أو مكبرات الصوت الحقيقية | اختر سماعتك الفعلية كجهاز تشغيل |

---

## هيكل المشروع / Project Structure

```text
SoundXRouter/
├── app.py                  # Flask server + frameless PyQt5 QtWebEngine window
├── audio_manager.py        # Device discovery, routing coordination & presets helper
├── audio_engine.py         # Low-latency sounddevice/numpy stream & ambience engine
├── app_audio_manager.py    # Per-process WASAPI loopback capture (proctap + pycaw)
├── device_helper.py        # Windows registry & audio endpoint helpers
├── hotkey_manager.py       # Global soundboard keyboard shortcuts manager
├── requirements.txt        # Python dependencies
├── templates/index.html    # Single-page studio UI template
├── static/                 # Modular CSS, themes, i18n, flex-gap polyfill, JS & logo.ico
└── docs/                   # Localized READMEs and screenshots
```

---

<div align="center">

**صُنع بعناية بواسطة eYushaa**  
*تحكم بصوتك، وسيطر على بثك.*

</div>
