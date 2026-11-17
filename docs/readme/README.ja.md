<div align="center">

![SoundX Router Banner](../../static/logo1.png)

**配信者・ゲーマー・クリエイター向けのスタジオ品質オーディオルーティング＆ミキシングツール。**

[![Version](https://img.shields.io/badge/Version-V1.0.3-blueviolet)](https://github.com/eYushaa/SoundXRouter/releases/latest)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/eYushaa/SoundXRouter)

**言語:**
[English](../../README.md) ·
[Türkçe](README.tr.md) ·
[العربية](README.ar.md) ·
[Русский](README.ru.md) ·
[简体中文](README.zh.md) ·
**日本語** ·
[עברית](README.he.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Español](README.es.md)

</div>

---

## V1.0.3 更新内容 (Changelog)

- **8種類のスタジオテーマ：** ヘッダーから即座に切り替えられる **Liquid Glass**、**Midnight Indigo**、**デイライトホワイト (Light)**、**Pure Black AMOLED**、**Cyberpunk Neon**、**エメラルドフォレスト**、**サンセット**、**Nordic Frost** を追加。ライト・AMOLED 向けの高コントラスト調整とテーマ連動オシロスコープ波形を搭載。
- **10言語ローカライズ＆OS言語の自動検出：** **English、Türkçe、العربية、Русский、简体中文、日本語、עברית、Français、Deutsch、Español** に完全対応。初回起動時に Windows の表示言語を自動判別し（未対応言語は英語で起動）、いつでも切り替えられます。
- **完全ベクター SVG アイコン化：** ナビゲーションタブ、アプリカード、ミュート操作、警告バナー、サウンドボードの絵文字をすべてテーマ対応の高精細 SVG アイコンに刷新。
- **文字体系別の最適フォント＆RTL対応：** ラテン文字・キリル文字・アラビア文字 (`Cairo`)・ヘブライ文字 (`Rubik`)・日本語 (`Noto Sans JP`) 向けに最適なフォントを設定。日本語以外の言語での可読性向上スケーリング、アラビア語・ヘブライ語向けの完全な右から左 (`RTL`) レイアウト、ドロップダウン内の括弧表示を整える BiDi 修正を実施。
- **ヘッダー中央固定＆描画品質向上：** 対称3カラムグリッド (`1fr auto 1fr`) によりルーティング開始時も中央タブのズレ（`0px`）を完全に解消。角丸ウィンドウの黒ずみアーティファクトを除去し、フッターの開始・停止ボタンを波形パネルと完全水平揃えにし、QtWebEngine Chromium 83 向けの `flex-gap` ポリフィルを搭載。

---

## スクリーンショット

> スクリーンショットは V1.0.3 英語版 UI の画面です。

| アプリ別オーディオミキサー | ルーティング＆デバイス設定 |
| :---: | :---: |
| ![Application Audio Mixer](../screenshots/app-mixer.png) | ![Routing and Devices](../screenshots/routing-devices.png) |

| サウンドボード | デイライトホワイト & Pure Black AMOLED テーマ |
| :---: | :---: |
| ![Soundboard](../screenshots/soundboard.png) | ![Daylight White Theme](../screenshots/theme-light.png) |

<div align="center">

![Pure Black AMOLED Theme](../screenshots/theme-amoled.png)

</div>

---

## SoundX Router とは？

**SoundX Router** は、あなた専用の Windows サウンド・アルケミースタジオです。味気ない素のマイク音声だけを届けるのはもう終わり。マイクから届くあなたの声に、BGM・ゲームの迫力ある効果音・ブラウザの音声・環境アンビエンス・サウンドボードのワンショットをリアルタイムで織り交ぜ、唯一無二の音響ブレンドとして Discord・OBS Studio・ゲーム・ボイスレコーダーへそのままルーティングできます。

### 主な機能

1. **リアルタイム複数アプリミキサー：** 複数アプリの音声を `0–150%` の個別フェーダー、ミュート、VU メーター付きでマイクストリームへ同時ミックス。
2. **仮想マイクブリッジ：** 最終ミックスを **SteelSeries Sonar - Microphone** や **VB-Audio Virtual Cable** などへ直接出力。
3. **ワンクリックコピー＆テストトーン：** 出力デバイス名をコピーしたり、テスト音を送信して Discord / OBS の入力レベルを即確認。
4. **フィードバックループ保護：** 入力と出力に同じ仮想ケーブルが選ばれた場合、自動で警告を表示してハウリングを防止。
5. **スマートヘッドホンモニター：** マイクへ音漏れ・ループを戻さず、実際のヘッドホンで配信音声をそのままモニタリング。
6. **ライブ VU メーター＆オシロスコープ：** **マイク入力**、**アプリミックス**、**マスター出力** をリアルタイムで可視化。
7. **プリセット＆状態自動保存：** 設定セットを `presets.json` に保存でき、アプリ構成・音量・テーマ・言語は `config.json` に自動保存。
8. **統合サウンドボード：** フルスクリーンゲーム中でもグローバルホットキー (`keybinds.json`) で `sounds/` 内の環境ループを再生。

---

## インストール

[Releases](https://github.com/eYushaa/SoundXRouter/releases) ページから `SoundXRouter-Setup.exe` をダウンロードして実行するだけで、SoundX Router を簡単にインストールできます。

---

## Discord / OBS 推奨設定

| SoundX Router の設定 | アプリ内の選択例 | Discord / OBS のマイク設定 |
| --- | --- | --- |
| **マイク / プライマリ入力** | USBマイク または `CABLE Output (VB-Audio Virtual Cable)` | — |
| **マスター仮想出力** | `SteelSeries Sonar - Microphone` または `CABLE Input` | 対応する入力デバイス（`CABLE Output` または `SteelSeries Sonar`）を選択 |
| **ヘッドホンモニター** | お使いの実機ヘッドホン / スピーカー | 出力デバイスに実際のヘッドホンを選択 |

---

## プロジェクト構成

```text
SoundXRouter/
├── app.py                  # Flask API サーバー + フレームレス PyQt5 QtWebEngine ウィンドウ
├── audio_manager.py        # デバイス検出・ルーティング統合・プリセット管理
├── audio_engine.py         # sounddevice/numpy 低遅延ミキシングエンジン
├── app_audio_manager.py    # プロセス別 WASAPI ループバック取得 (proctap + pycaw)
├── device_helper.py        # Windows レジストリ＆オーディオエンドポイント補助
├── hotkey_manager.py       # サウンドボード用グローバルホットキー管理
├── requirements.txt        # Python 依存ライブラリ
├── templates/index.html    # スタジオ UI テンプレート
├── static/                 # モジュール CSS・テーマ・i18n・flex-gap ポリフィル・JS・logo.ico
└── docs/                   # 10言語の README およびスクリーンショット
```

---

<div align="center">

**Made with care by eYushaa**  
*Control your sound, own your stream.*

</div>
