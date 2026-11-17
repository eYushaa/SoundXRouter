<div align="center">

![SoundX Router Banner](../../static/logo1.png)

**La herramienta de estudio para enrutamiento y mezcla de audio multi-aplicación en Windows.**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**Idiomas:**
[English](../../README.md) ·
[Türkçe](README.tr.md) ·
[العربية](README.ar.md) ·
[Русский](README.ru.md) ·
[简体中文](README.zh.md) ·
[日本語](README.ja.md) ·
[עברית](README.he.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
**Español**

</div>

---

## Novedades de la V1.0.3 (Changelog)

- **8 Temas de Estudio:** Selector integrado con **Liquid Glass**, **Midnight Indigo**, **Blanco Día (Light)**, **Negro Puro AMOLED**, **Cyberpunk Neon**, **Bosque Esmeralda**, **Atardecer** y **Nórdico Ártico**, con contraste calibrado y paletas de osciloscopio a juego.
- **10 Idiomas y Detección Automática:** Traducción completa en **English, Türkçe, العربية, Русский, 简体中文, 日本語, עברית, Français, Deutsch y Español**. Al iniciar por primera vez, detecta automáticamente el idioma de Windows (o usa inglés por defecto) y permite cambiarlo desde la barra superior.
- **Renovación Total con Iconos SVG Vectoriales:** Sustitución de todos los emojis por iconos SVG nítidos adaptados al tema en pestañas, tarjetas de aplicaciones, controles de silencio, alertas y botones del Soundboard.
- **Tipografía por Escritura y Soporte RTL Completo:** Fuentes dedicadas (`Plus Jakarta Sans`, `Inter`, `Cairo`, `Rubik`, `Noto Sans SC`, `Noto Sans JP`), escalado de fuente fuera del japonés para mejorar la legibilidad, diseño espejo de derecha a izquierda (`RTL`) para árabe y hebreo, y corrección BiDi de paréntesis en listas de dispositivos.
- **Encabezado Centrado y Ajustes Visuales:** Cuadrícula simétrica de 3 columnas (`1fr auto 1fr`) que mantiene centradas las pestañas (`0px` de desplazamiento) al activar el enrutamiento, eliminación de bordes oscuros en esquinas redondeadas, botón inferior compacto **INICIAR / DETENER** alineado al osciloscopio y polyfill `flex-gap` para QtWebEngine Chromium 83.

---

## Capturas de pantalla

> Capturas tomadas sobre la interfaz en inglés de la versión V1.0.3.

| Mezclador de Audio por App | Enrutamiento y Dispositivos |
| :---: | :---: |
| ![Application Audio Mixer](../screenshots/app-mixer.png) | ![Routing and Devices](../screenshots/routing-devices.png) |

| Soundboard Integrado | Temas Blanco Día y Negro Puro AMOLED |
| :---: | :---: |
| ![Soundboard](../screenshots/soundboard.png) | ![Daylight White Theme](../screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](../screenshots/theme-amoled.png)

</div>

---

## ¿Qué es SoundX Router?

**SoundX Router** es tu laboratorio de alquimia sonora para Windows. Olvídate de transmitir un micrófono seco y solitario: fusiona tu voz en tiempo real con música, audio de juegos, pestañas del navegador, atmósferas ambientales y efectos de tu soundboard en una mezcla única, y enruta ese cóctel sonoro directamente hacia Discord, OBS Studio, tus partidas o la Grabadora de voz.

### Capacidades principales

1. **Mezclador Multi-Aplicación en Tiempo Real:** Captura y mezcla audio de varios programas simultáneamente en tu canal de micrófono con deslizadores (`0–150%`), botón de silencio y medidores VU por aplicación.
2. **Puente de Micrófono Virtual:** Envía la mezcla final a **SteelSeries Sonar - Microphone**, **VB-Audio Virtual Cable** o cualquier controlador virtual.
3. **Copia en 1 Clic y Tono de Prueba:** Copia el nombre del dispositivo de salida o envía un tono de prueba para verificar los niveles en Discord u OBS.
4. **Protección contra Bucles de Retroalimentación:** Detecta automáticamente si el mismo cable virtual se selecciona en entrada y salida para evitar ecos.
5. **Monitoreo Inteligente en Auriculares (Smart Preview):** Escucha exactamente lo que transmites en tus auriculares reales sin retroalimentación en el micrófono.
6. **Medidores VU y Osciloscopio en Vivo:** Monitorización continua de **Entrada Mic**, **Mezcla Apps** y **Salida Master**.
7. **Preajustes y Guardado Automático:** Guarda perfiles completos en `presets.json`; aplicaciones activas, volúmenes, tema e idioma se conservan en `config.json`.
8. **Soundboard Integrado:** Reproduce bucles ambientales y efectos desde `sounds/` mediante atajos globales (`keybinds.json`) incluso en juegos a pantalla completa.

---

## Instalación

Puedes instalar SoundX Router fácilmente descargando y ejecutando `SoundXRouter-Setup.exe` desde la página de [Releases](https://github.com/eYushaa/SoundXRouter/releases).

---

## Configuración Recomendada para Discord / OBS

| Ajuste en SoundX Router | Selección en SoundX Router | Entrada de Micrófono en Discord / OBS |
| --- | --- | --- |
| **Micrófono / Entrada principal** | Micrófono USB o `CABLE Output (VB-Audio Virtual Cable)` | — |
| **Salida virtual Master** | `SteelSeries Sonar - Microphone` o `CABLE Input` | Elige el dispositivo correspondiente (`CABLE Output` o `SteelSeries Sonar`) |
| **Monitoreo en Auriculares** | Tus auriculares o altavoces físicos | Selecciona tus auriculares reales como salida |

---

## Estructura del Proyecto

```text
SoundXRouter/
├── app.py                  # Servidor Flask + ventana PyQt5 QtWebEngine sin bordes
├── audio_manager.py        # Detección de dispositivos, enrutamiento y preajustes
├── audio_engine.py         # Motor de mezcla y baja latencia con sounddevice/numpy
├── app_audio_manager.py    # Captura WASAPI por proceso (proctap + pycaw)
├── device_helper.py        # Utilidades del registro y dispositivos de Windows
├── hotkey_manager.py       # Gestor de atajos globales del Soundboard
├── requirements.txt        # Dependencias de Python
├── templates/index.html    # Plantilla HTML principal de la interfaz
├── static/                 # Módulos CSS, temas, i18n, polyfill flex-gap, JS y logo.ico
└── docs/                   # READMEs en 10 idiomas y capturas de pantalla
```

---

<div align="center">

**Desarrollado con dedicación por eYushaa**  
*Controla tu sonido, domina tu directo.*

</div>
