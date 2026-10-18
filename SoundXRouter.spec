# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all

datas = [
    ('templates', 'templates'),
    ('static', 'static'),
]

binaries = []
hiddenimports = [
    'proctap',
    'pycaw',
    'comtypes',
    'comtypes.stream',
    'keyboard',
    'psutil',
    'sounddevice',
    'soundfile',
    'numpy',
    'flask',
    'jinja2',
    'werkzeug',
    'PyQt5',
    'PyQt5.QtCore',
    'PyQt5.QtGui',
    'PyQt5.QtWidgets',
    'PyQt5.QtWebEngineWidgets',
    'PyQt5.QtWebChannel',
    'audio_manager',
    'audio_engine',
    'app_audio_manager',
    'device_helper',
    'device_selector',
    'hotkey_manager',
]

for pkg in ['sounddevice', 'soundfile', 'proctap', 'pycaw']:
    try:
        tmp_datas, tmp_binaries, tmp_hidden = collect_all(pkg)
        datas += tmp_datas
        binaries += tmp_binaries
        hiddenimports += tmp_hidden
    except Exception as e:
        print(f"collect_all warning for {pkg}: {e}")

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SoundXRouter',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='static/logo.ico'
)
