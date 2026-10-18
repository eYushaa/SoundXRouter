import threading
import time
import collections
import numpy as np
import psutil
try:
    from pycaw.pycaw import AudioUtilities
except ImportError:
    try:
        from pycaw.utils import AudioUtilities
    except ImportError:
        AudioUtilities = None

try:
    import proctap
except ImportError:
    proctap = None


class AppAudioSource:
    def __init__(self, pid: int, name: str, volume: float = 1.0, muted: bool = False, raw_name: str = ""):
        self.pid = pid
        self.name = name
        self.raw_name = raw_name or name
        self.volume = max(0.0, float(volume))
        self.muted = bool(muted)
        
        self.capture = None
        self.lock = threading.Lock()
        # Holds numpy arrays of shape (N, 2), float32, 48000Hz
        self.chunks = collections.deque(maxlen=50)
        self.last_level = 0.0
        self.is_running = False
        self._residual = np.zeros((0, 2), dtype=np.float32)

    def _on_audio_data(self, data: bytes, frames_hint: int):
        if not data or self.muted:
            return
        try:
            arr = np.frombuffer(data, dtype=np.float32)
            if arr.size == 0:
                return
            arr = arr.reshape(-1, 2)
            
            # Compute peak/RMS level for visualizer
            rms = float(np.sqrt(np.mean(np.square(arr))))
            self.last_level = rms

            with self.lock:
                self.chunks.append(arr)
        except Exception:
            pass

    def start(self):
        if self.is_running:
            return
        if proctap is None:
            print(f"Warning: proctap is not available, cannot capture PID {self.pid}")
            return
        try:
            self.capture = proctap.ProcessAudioCapture(pid=self.pid, on_data=self._on_audio_data)
            self.capture.start()
            self.is_running = True
        except Exception as e:
            print(f"Error starting capture for PID {self.pid} ({self.name}): {e}")
            self.is_running = False

    def stop(self):
        self.is_running = False
        if self.capture:
            try:
                self.capture.stop()
            except Exception:
                pass
            self.capture = None
        with self.lock:
            self.chunks.clear()
            self._residual = np.zeros((0, 2), dtype=np.float32)
        self.last_level = 0.0

    def pull_audio(self, frames: int, channels: int = 2) -> np.ndarray:
        """
        Pulls exactly 'frames' of audio samples. If buffer is empty or short,
        pads with zeros. Applies current volume and mute state.
        Returns array of shape (frames, channels), dtype float32.
        """
        out = np.zeros((frames, 2), dtype=np.float32)
        if self.muted or self.volume <= 0.001:
            self.last_level = 0.0
            if channels == 1:
                return out[:, :1]
            return out

        pulled = 0
        needed = frames

        with self.lock:
            # 1. Take from residual if any
            if len(self._residual) > 0:
                take = min(needed, len(self._residual))
                out[:take] = self._residual[:take]
                self._residual = self._residual[take:]
                pulled += take
                needed -= take

            # 2. Take from chunks deque
            while needed > 0 and self.chunks:
                chunk = self.chunks.popleft()
                take = min(needed, len(chunk))
                out[pulled:pulled+take] = chunk[:take]
                pulled += take
                needed -= take
                if take < len(chunk):
                    # Save remaining
                    self._residual = chunk[take:]
                    break

        if pulled > 0:
            rms = float(np.sqrt(np.mean(np.square(out[:pulled]))))
            self.last_level = rms * self.volume
        else:
            self.last_level = 0.0

        # Apply volume
        out *= self.volume

        # Match requested output channels
        if channels == 1:
            # Downmix to mono
            return np.mean(out, axis=1, keepdims=True)
        elif channels > 2:
            expanded = np.zeros((frames, channels), dtype=np.float32)
            expanded[:, :2] = out
            return expanded
        return out


def format_app_display_name(raw_name: str) -> str:
    if not raw_name:
        return "Unknown App"
    name = raw_name.strip()
    if name.lower().endswith(".exe"):
        name = name[:-4]
    
    mapping = {
        "discord": "Discord",
        "steam": "Steam",
        "spotify": "Spotify",
        "chrome": "Google Chrome",
        "brave": "Brave Browser",
        "msedge": "Microsoft Edge",
        "firefox": "Mozilla Firefox",
        "opera": "Opera",
        "operagx": "Opera GX",
        "telegram": "Telegram",
        "teams": "Microsoft Teams",
        "skype": "Skype",
        "vlc": "VLC Media Player",
        "obs64": "OBS Studio",
        "obs32": "OBS Studio",
        "steelseriessonar": "SteelSeries Sonar",
        "steelseriesengine": "SteelSeries Engine",
        "steelseriesgg": "SteelSeries GG",
        "voicemod": "Voicemod",
        "voice-changer-native-client": "Voice Changer (RVC Client)",
        "voice_changer": "Voice Changer (RVC)",
        "w-okada": "W-Okada Voice Changer",
        "devenv": "Visual Studio",
        "code": "Visual Studio Code",
        "valorant": "VALORANT",
        "cs2": "Counter-Strike 2",
        "csgo": "Counter-Strike",
        "gta5": "Grand Theft Auto V",
        "leagueclient": "League of Legends",
        "epicgameslauncher": "Epic Games Launcher"
    }

    clean_key = name.lower().replace("-", "").replace("_", "").replace(" ", "")
    for k, v in mapping.items():
        if k.replace("-", "").replace("_", "").replace(" ", "") == clean_key:
            return v
            
    import re
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1 \2', name)
    s2 = re.sub('([a-z0-9])([A-Z])', r'\1 \2', s1)
    formatted = s2.replace("-", " ").replace("_", " ")
    return " ".join(word.capitalize() for word in formatted.split())

class AppMixerManager:
    def __init__(self):
        self.sources: dict[int, AppAudioSource] = {} # pid -> AppAudioSource
        self.lock = threading.Lock()

    def get_available_apps(self):
        """
        Returns list of running applications that can be captured.
        Audio-active sessions are listed first with clean display names (no .exe).
        """
        apps = {}
        
        # 1. Active Audio Sessions from WASAPI
        if AudioUtilities is not None:
            try:
                sessions = AudioUtilities.GetAllSessions()
                for s in sessions:
                    if s.Process:
                        pid = s.Process.pid
                        raw_name = s.Process.name()
                        if raw_name.lower() in ['python.exe', 'soundxrouter.exe', 'audiodg.exe', 'system', 'conhost.exe']:
                            continue
                        disp_name = format_app_display_name(raw_name)
                        apps[pid] = {
                            "pid": pid,
                            "raw_name": raw_name,
                            "name": disp_name,
                            "title": disp_name,
                            "has_audio": True,
                            "active": pid in self.sources
                        }
            except Exception as e:
                print(f"Error querying audio sessions: {e}")

        # 2. Add other running GUI processes with windows
        try:
            ignore_list = [
                'python.exe', 'soundxrouter.exe', 'audiodg.exe', 'svchost.exe', 
                'explorer.exe', 'system', 'conhost.exe', 'registry', 'aggregatorhost.exe',
                'shellexperiencehost.exe', 'searchhost.exe', 'startmenuexperiencehost.exe',
                'textinputhost.exe', 'applicationframehost.exe', 'securityhealthservice.exe',
                'taskhostw.exe', 'runtimebroker.exe', 'sihost.exe', 'dllhost.exe',
                'smartscreen.exe', 'services.exe', 'lsass.exe', 'wininit.exe', 'winlogon.exe'
            ]
            for proc in psutil.process_iter(['pid', 'name']):
                pid = proc.info['pid']
                raw_name = proc.info['name']
                if not raw_name or pid in apps or pid <= 4:
                    continue
                if raw_name.lower() in ignore_list:
                    continue
                
                disp_name = format_app_display_name(raw_name)
                apps[pid] = {
                    "pid": pid,
                    "raw_name": raw_name,
                    "name": disp_name,
                    "title": disp_name,
                    "has_audio": False,
                    "active": pid in self.sources
                }
        except Exception as e:
            print(f"Error querying psutil: {e}")

        # Sort: currently active sources first, then has_audio=True, then by clean name
        res = list(apps.values())
        res.sort(key=lambda x: (not x['active'], not x['has_audio'], x['name'].lower()))
        return res


    def add_app(self, pid: int, name: str, volume: float = 1.0, is_engine_running: bool = False, muted: bool = False, raw_name: str = ""):
        with self.lock:
            if pid in self.sources:
                return self.sources[pid]
            source = AppAudioSource(pid=pid, name=name, volume=volume, muted=muted, raw_name=raw_name)
            self.sources[pid] = source
            if is_engine_running:
                source.start()
            return source

    def restore_saved_apps(self, saved_apps: list, is_engine_running: bool = False):
        if not saved_apps:
            return
        try:
            available = self.get_available_apps()
            for item in saved_apps:
                target_raw = (item.get("raw_name") or "").lower()
                target_name = (item.get("name") or "").lower()
                vol = float(item.get("volume", 1.0))
                muted = bool(item.get("muted", False))

                # Find match by raw_name or name
                match = next((a for a in available if (target_raw and a.get("raw_name", "").lower() == target_raw) or (target_name and a.get("name", "").lower() == target_name)), None)
                if match:
                    pid = match["pid"]
                    if pid not in self.sources:
                        self.add_app(
                            pid=pid,
                            name=match["name"],
                            volume=vol,
                            is_engine_running=is_engine_running,
                            muted=muted,
                            raw_name=match.get("raw_name", "")
                        )
        except Exception as e:
            print(f"Error restoring saved apps: {e}")

    def remove_app(self, pid: int):
        with self.lock:
            if pid in self.sources:
                source = self.sources.pop(pid)
                source.stop()

    def set_app_volume(self, pid: int, volume: float):
        with self.lock:
            if pid in self.sources:
                self.sources[pid].volume = max(0.0, float(volume))

    def set_app_mute(self, pid: int, muted: bool):
        with self.lock:
            if pid in self.sources:
                self.sources[pid].muted = bool(muted)

    def start_all(self):
        with self.lock:
            for source in self.sources.values():
                source.start()

    def stop_all(self):
        with self.lock:
            for source in self.sources.values():
                source.stop()

    def get_states(self):
        with self.lock:
            return [
                {
                    "pid": s.pid,
                    "name": s.name,
                    "raw_name": getattr(s, "raw_name", s.name),
                    "volume": s.volume,
                    "muted": s.muted,
                    "level": s.last_level,
                    "is_running": s.is_running
                }
                for s in self.sources.values()
            ]

    def pull_mix(self, frames: int, channels: int = 2) -> tuple[np.ndarray, dict[int, float]]:
        """
        Pulls and sums audio from all active application sources.
        Returns (mixed_array, levels_dict)
        """
        mix = np.zeros((frames, channels), dtype=np.float32)
        levels = {}
        with self.lock:
            active_list = list(self.sources.values())

        for source in active_list:
            if source.is_running and not source.muted and source.volume > 0.001:
                app_audio = source.pull_audio(frames, channels)
                mix += app_audio
            levels[source.pid] = source.last_level

        return mix, levels
