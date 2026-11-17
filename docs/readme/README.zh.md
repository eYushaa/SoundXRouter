<div align="center">

![SoundX Router Banner](../../static/logo1.png)

**面向主播、玩家与创作者的专业级 Windows 音频路由与多应用混音工具。**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**语言:**
[English](../../README.md) ·
[Türkçe](README.tr.md) ·
[العربية](README.ar.md) ·
[Русский](README.ru.md) ·
**简体中文** ·
[日本語](README.ja.md) ·
[עברית](README.he.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Español](README.es.md)

</div>

---

## V1.0.3 更新日志 (Changelog)

- **8 套工作室主题：** 顶部栏内置主题切换器，提供 **液态玻璃 (Liquid Glass)**、**午夜靛蓝**、**日光白 (Light)**、**纯黑 AMOLED**、**赛博霓虹**、**翡翠森林**、**暖阳日落** 与 **北欧极简**，并针对浅色与 AMOLED 对比度以及波形示波器配色进行了精细调校。
- **10 种语言与系统语言自动识别：** 完整支持 **English、Türkçe、العربية、Русский、简体中文、日本語、עברית、Français、Deutsch 和 Español**。首次启动自动检测 Windows 显示语言（未覆盖时回退为英语），并可随时手动切换。
- **全量矢量 SVG 图标重构：** 使用清晰的主题自适应 SVG 矢量图标全面替换导航标签、应用混音卡片、静音按钮、路由警告和音效板中的旧 Emoji。
- **分文字排版优化与完整 RTL 支持：** 为拉丁、西里尔、阿拉伯文 (`Cairo`)、希伯来文 (`Rubik`) 及中日文字 (`Noto Sans SC / JP`) 匹配字体栈；为非日语界面放大字号提高可读性；支持阿拉伯语/希伯来语从右到左 (`RTL`) 布局及下拉设备名括号 BiDi 修正。
- **标题栏居中锁定与渲染修复：** 采用对称三列网格 (`1fr auto 1fr`) 保证开启路由时顶部导航栏严格居中（`0px` 偏移），消除无边框圆角窗口边缘黑影，并将底部操作按钮与示波器齐平对齐，同时为 QtWebEngine Chromium 83 提供 `flex-gap` 兼容层。

---

## 界面截图

> 以下截图均采集自 V1.0.3 英文界面。

| 应用音频混音器 | 路由与设备配置 |
| :---: | :---: |
| ![Application Audio Mixer](../screenshots/app-mixer.png) | ![Routing and Devices](../screenshots/routing-devices.png) |

| 集成音效板 | 日光白 & 纯黑 AMOLED 主题 |
| :---: | :---: |
| ![Soundboard](../screenshots/soundboard.png) | ![Daylight White Theme](../screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](../screenshots/theme-amoled.png)

</div>

---

## 什么是 SoundX Router？

**SoundX Router** 是专属于你的 Windows 声学炼金台。告别干瘪单调的孤立麦克风信号——在实时流中将你的人声与正在播放的音乐、游戏音效、浏览器标签页、沉浸式环境音以及音效板特效自由调和，融为独一无二的声音鸡尾酒，并作为纯净的虚拟麦克风信号直接路由至 Discord、OBS Studio、游戏或 Windows 录音机。

### 核心功能

1. **实时多应用音频混音器：** 同时捕获并混合多个进程的音频，支持独立 `0–150%` 音量滑块、一键静音和实时 VU 电平表。
2. **虚拟麦克风桥接：** 轻松将混合输出路由至 **SteelSeries Sonar - Microphone**、**VB-Audio Virtual Cable** 或任意虚拟声卡驱动。
3. **一键复制设备名与测试音：** 快速复制目标麦克风名称，并发送测试提示音以验证 Discord 或 OBS 的输入电平。
4. **回声反馈环路保护：** 自动检测输入和输出是否选中了同一虚拟线缆并给出警示，防止啸叫。
5. **零反馈耳机监听 (Smart Preview)：** 通过真实耳机实时监听混音效果，且不会把监听声音回灌至麦克风。
6. **实时多通道电平表与示波器：** 底部面板实时显示 **麦克输入**、**应用混音** 与 **主输出** 动态。
7. **预设方案与自动记忆：** 一键保存和加载完整路由预设 (`presets.json`)；应用列表、音量、主题及语言自动保存在 `config.json`。
8. **集成音效板 (Soundboard)：** 支持在全屏游戏中通过全局热键 (`keybinds.json`) 触发 `sounds/` 内的环境背景循环音轨。

---

## 安装

您只需前往 [Releases](https://github.com/eYushaa/SoundXRouter/releases) 下载并运行 `SoundXRouter-Setup.exe`，即可轻松完成 SoundX Router 的安装。

---

## Discord / OBS 推荐配置

| SoundX Router 设置项 | 软件内选择 | Discord / OBS 麦克风设置 |
| --- | --- | --- |
| **麦克风 / 主输入** | USB 麦克风或 `CABLE Output (VB-Audio Virtual Cable)` | — |
| **主虚拟输出** | `SteelSeries Sonar - Microphone` 或 `CABLE Input` | 选择对应的输入设备（`CABLE Output` 或 `SteelSeries Sonar`） |
| **耳机监听输出** | 你的物理耳机 / 扬声器 | 选择你的真实耳机作为播放设备 |

---

## 项目结构

```text
SoundXRouter/
├── app.py                  # Flask API 服务 + PyQt5 无边框 QtWebEngine 窗口
├── audio_manager.py        # 设备发现、路由调度与预设管理
├── audio_engine.py         # 基于 sounddevice/numpy 的低延迟混音引擎
├── app_audio_manager.py    # 按进程 WASAPI 回环音频捕获 (proctap + pycaw)
├── device_helper.py        # Windows 注册表与音频端点辅助模块
├── hotkey_manager.py       # 音效板全局快捷键管理
├── requirements.txt        # Python 依赖列表
├── templates/index.html    # 工作室单页界面模板
├── static/                 # 模块化 CSS、主题、多语言、flex-gap 兼容、JS 与 logo.ico
└── docs/                   # 10 种语言 README 文档与截图
```

---

<div align="center">

**由 eYushaa 用心打造**  
*掌控你的声音，主宰你的直播。*

</div>
