import sys
import os
import threading
import json
import ctypes
from flask import Flask, render_template, jsonify, request
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage
from PyQt5.QtWebChannel import QWebChannel
from PyQt5.QtCore import Qt, QUrl, QPoint, pyqtSlot, QObject, pyqtSignal
from PyQt5.QtGui import QIcon
from audio_manager import AudioManager

# --- Flask App Setup ---
if sys.platform.startswith("win"):
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("SoundXRouter.App")
    except Exception:
        pass

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
    BASE_DIR = sys._MEIPASS
else:
    app = Flask(__name__)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

manager = AudioManager()
SOUNDS_DIR = os.path.join(os.getcwd(), "sounds")
PRESETS_FILE = os.path.join(os.getcwd(), "presets.json")
APP_ICON_PATH = os.path.join(BASE_DIR, "static", "logo.png")
CURRENT_VERSION = "1.0"
UPDATE_URL = "https://api.github.com/repos/eYushaa/SoundXRouter/releases/latest" # Example URL

@app.route('/api/version')
def get_version():
    return jsonify({"version": CURRENT_VERSION})

@app.route('/api/check_update')
def check_update():
    # In a real app, you would fetch UPDATE_URL and compare versions.
    # For now, we simulate an update is available to show the flow.
    try:
        # Simulation:
        # import requests
        # res = requests.get(UPDATE_URL)
        # latest = res.json()["tag_name"]
        # if latest != CURRENT_VERSION: ...
        
        # SIMULATING UPDATE AVAILABLE
        return jsonify({
            "current": CURRENT_VERSION,
            "latest": "1.1", 
            "update_available": True,
            "download_url": "https://github.com/eYushaa/SoundXRouter/releases/latest", # Example
            "message": "New version 1.1 is available!"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/open_url', methods=['POST'])
def open_url():
    data = request.json
    url = data.get('url')
    if url:
        import webbrowser
        webbrowser.open(url)
    return jsonify({"status": "opened"})

def load_presets():
    if not os.path.exists(PRESETS_FILE):
        return []
    try:
        with open(PRESETS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_presets(presets):
    with open(PRESETS_FILE, 'w', encoding='utf-8') as f:
        json.dump(presets, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/init')
def init_data():
    return jsonify({
        "host_apis": manager.get_host_apis(),
        "devices": manager.get_devices(),
        "sounds": get_sound_files()
    })

@app.route('/api/sounds')
def get_sounds():
    return jsonify(get_sound_files())

def get_sound_files():
    if not os.path.exists(SOUNDS_DIR):
        os.makedirs(SOUNDS_DIR)
    files = [f for f in os.listdir(SOUNDS_DIR) if f.lower().endswith(('.mp3', '.wav', '.flac', '.ogg'))]
    return files

@app.route('/api/start', methods=['POST'])
def start_engine():
    data = request.json
    manager.stop_preview()
    manager.set_config(
        data['input_id'],
        data['output_id'],
        os.path.join(SOUNDS_DIR, data['sound']) if data['sound'] else None,
        data['volume']
    )
    result = manager.start()
    return jsonify(result)

@app.route('/api/stop', methods=['POST'])
def stop_engine():
    return jsonify(manager.stop())

@app.route('/api/update_volume', methods=['POST'])
def update_volume():
    data = request.json
    if manager.engine and manager.engine.running:
        manager.engine.noise_volume = float(data['volume']) / 100.0
    return jsonify({"status": "ok"})

@app.route('/api/open_folder')
def open_folder():
    if not os.path.exists(SOUNDS_DIR):
        os.makedirs(SOUNDS_DIR)
    os.startfile(SOUNDS_DIR)
    return jsonify({"status": "ok"})

@app.route('/api/preview/start', methods=['POST'])
def preview_start():
    data = request.json
    sound = data.get('sound')
    if not sound:
        return jsonify({"status": "error", "message": "No sound specified"}), 400
    output_id = data.get('output_id')
    path = os.path.join(SOUNDS_DIR, sound)
    result = manager.start_preview(path, int(output_id) if output_id is not None else None)
    return jsonify(result)

@app.route('/api/preview/stop', methods=['POST'])
def preview_stop():
    return jsonify(manager.stop_preview())

@app.route('/api/play_effect', methods=['POST'])
def play_effect():
    data = request.json
    sound_name = data.get('sound')
    volume = float(data.get('volume', 1.0))
    
    if not sound_name:
        return jsonify({"status": "error", "message": "No sound specified"}), 400
        
    sound_path = os.path.join(SOUNDS_DIR, sound_name)
    res = manager.play_effect(sound_path, volume)
    return jsonify(res)

@app.route('/api/meters')
def get_meters():
    return jsonify(manager.get_levels())

@app.route('/api/presets', methods=['GET'])
def list_presets():
    return jsonify(load_presets())

@app.route('/api/presets/save', methods=['POST'])
def save_preset():
    data = request.json
    if not data.get('name'):
        return jsonify({"status": "error", "message": "Preset name required"}), 400
    presets = load_presets()
    presets = [p for p in presets if p.get('name') != data['name']]
    presets.append(data)
    save_presets(presets)
    return jsonify({"status": "saved"})

@app.route('/api/presets/load', methods=['POST'])
def load_preset():
    data = request.json
    name = data.get('name')
    presets = load_presets()
    for preset in presets:
        if preset.get('name') == name:
            return jsonify({"status": "ok", "preset": preset})
    return jsonify({"status": "error", "message": "Preset not found"}), 404

# --- Hotkey Manager ---
from hotkey_manager import HotkeyManager
BINDINGS_FILE = os.path.join(os.getcwd(), "keybinds.json")

def on_hotkey_triggered(sound_name):
    # Run in a separate thread to avoid blocking the keyboard hook
    def run():
        path = os.path.join(SOUNDS_DIR, sound_name)
        manager.play_effect(path)
    threading.Thread(target=run).start()

hotkey_manager = HotkeyManager(BINDINGS_FILE, on_hotkey_triggered)

@app.route('/api/bindings', methods=['GET'])
def get_bindings():
    return jsonify(hotkey_manager.get_bindings())

@app.route('/api/bindings/set', methods=['POST'])
def set_binding():
    data = request.json
    key = data.get('key')
    sound = data.get('sound')
    if not key or not sound:
        return jsonify({"status": "error"}), 400
    
    # Clear previous binding for this sound if we want 1-to-1? 
    # User might want multiple keys for same sound, but let's keep it simple.
    # The frontend logic implies 1 key per sound visually.
    hotkey_manager.clear_sound_binding(sound)
    hotkey_manager.set_binding(key, sound)
    return jsonify({"status": "ok"})

@app.route('/api/bindings/remove', methods=['POST'])
def remove_binding():
    data = request.json
    key = data.get('key')
    if key:
        hotkey_manager.remove_binding(key)
    return jsonify({"status": "ok"})

# --- Thread-Safe Signal Emitter ---
class SignalEmitter(QObject):
    minimize_signal = pyqtSignal()
    close_signal = pyqtSignal()
    move_signal = pyqtSignal(int, int)

emitter = SignalEmitter()

@app.route('/api/window/minimize', methods=['POST'])
def window_minimize():
    emitter.minimize_signal.emit()
    return jsonify({"status": "ok"})

@app.route('/api/window/close', methods=['POST'])
def window_close():
    emitter.close_signal.emit()
    return jsonify({"status": "ok"})

@app.route('/api/window/move', methods=['POST'])
def window_move():
    data = request.json
    dx = int(data['dx'])
    dy = int(data['dy'])
    emitter.move_signal.emit(dx, dy)
    return jsonify({"status": "ok"})

def start_flask():
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

# --- Custom WebEnginePage for Console Logging ---
class WebEnginePage(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        pass # print(f"JS Console: {message} (Line {lineNumber})")

# --- PyQt5 Custom Window ---
class ModernWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # Connect signals for thread safety
        emitter.minimize_signal.connect(self.showMinimized)
        emitter.close_signal.connect(self.close)
        emitter.move_signal.connect(self.move_window)
        
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowTitle("SoundX Router")
        self.resize(900, 650)

        if os.path.exists(APP_ICON_PATH):
            self.setWindowIcon(QIcon(APP_ICON_PATH))
        
        # Central Widget
        self.central_widget = QWidget()
        self.central_widget.setStyleSheet("background: transparent;")
        self.setCentralWidget(self.central_widget)
        
        # Layout
        self.layout = QVBoxLayout(self.central_widget)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        # Web View
        self.browser = QWebEngineView()
        self.browser.setPage(WebEnginePage(self.browser)) # Set custom page for logging
        self.browser.page().setBackgroundColor(Qt.transparent)
        
        self.browser.setUrl(QUrl("http://127.0.0.1:5000"))
        self.layout.addWidget(self.browser)

    def move_window(self, dx, dy):
        new_pos = self.pos() + QPoint(dx, dy)
        self.move(new_pos)

# --- Main Execution ---
if __name__ == '__main__':
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Start PyQt App
    app_qt = QApplication(sys.argv)
    if os.path.exists(APP_ICON_PATH):
        app_qt.setWindowIcon(QIcon(APP_ICON_PATH))
    window = ModernWindow()
    window.show()
    
    sys.exit(app_qt.exec_())
