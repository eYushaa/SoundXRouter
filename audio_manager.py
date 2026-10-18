import sounddevice as sd
import os
import numpy as np
import soundfile as sf
from audio_engine import AudioEngine
from app_audio_manager import AppMixerManager
import device_helper

class AudioManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AudioManager, cls).__new__(cls)
            cls._instance.engine = None
            cls._instance.input_id = None
            cls._instance.output_id = None
            cls._instance.monitor_id = None
            cls._instance.monitor_enabled = False
            cls._instance.monitor_volume = 1.0
            cls._instance.mic_volume = 1.0
            cls._instance.mic_muted = False
            cls._instance.noise_path = None
            cls._instance.noise_volume = 0.2
            cls._instance.preview_stream = None
            cls._instance.preview_data = None
            cls._instance.preview_index = 0
            cls._instance.preview_samplerate = 48000
            cls._instance.preview_channels = 1
            cls._instance.app_mixer = AppMixerManager()
            
            # Ensure SoundX Router names in Windows registry
            try:
                device_helper.ensure_soundx_router_names()
            except Exception as e:
                print(f"Warning: Could not auto-rename virtual devices: {e}")

        return cls._instance

    def get_devices(self):
        devices = sd.query_devices()
        hostapis = sd.query_hostapis()
        
        result = []
        for i, dev in enumerate(devices):
            api_name = hostapis[dev['hostapi']]['name']
            if dev['max_input_channels'] > 0 or dev['max_output_channels'] > 0:
                raw_name = dev['name']
                clean_name = raw_name
                low_name = raw_name.lower()
                if low_name.startswith("cable output"):
                    clean_name = "CABLE Output (VB-Audio Virtual Cable)"
                elif low_name.startswith("cable input"):
                    clean_name = "CABLE Input (VB-Audio Virtual Cable)"

                is_soundx = "soundx" in low_name or "cable" in low_name
                result.append({
                    "id": i,
                    "name": clean_name,
                    "raw_name": raw_name,
                    "api": api_name,
                    "inputs": dev['max_input_channels'],
                    "outputs": dev['max_output_channels'],
                    "is_soundx": is_soundx
                })
        return result

    def get_host_apis(self):
        return [api['name'] for api in sd.query_hostapis()]

    def get_device_name(self, dev_id):
        if dev_id is None or dev_id < 0:
            return None
        try:
            devices = sd.query_devices()
            if 0 <= dev_id < len(devices):
                raw = devices[dev_id]['name']
                low = raw.lower()
                if low.startswith("cable output"):
                    return "CABLE Output (VB-Audio Virtual Cable)"
                if low.startswith("cable input"):
                    return "CABLE Input (VB-Audio Virtual Cable)"
                return raw
        except Exception:
            pass
        return None

    def get_soundx_info(self):
        scan = device_helper.scan_virtual_audio_infrastructure()
        ids = device_helper.find_soundx_device_ids()
        instructions = device_helper.get_routing_instructions(
            selected_input_name=self.get_device_name(self.input_id),
            selected_output_name=self.get_device_name(self.output_id)
        )
        return {
            "scan": scan,
            "device_ids": ids,
            "instructions": instructions,
            "has_virtual_devices": scan["has_virtual_devices"],
            "registered": scan["has_virtual_devices"]
        }

    def register_soundx_device(self):
        res = device_helper.ensure_soundx_router_names()
        return res

    def resolve_effective_output_device_id(self, dev_id):
        if dev_id is None or str(dev_id) == "":
            return None
        try:
            dev_id = int(dev_id)
            devices = sd.query_devices()
            if dev_id < 0 or dev_id >= len(devices):
                return dev_id
            
            target = devices[dev_id]
            if target['max_output_channels'] > 0:
                return dev_id
            
            # The target is a capture endpoint (Microphone) selected as output!
            name = target['name'].lower()
            api_idx = target['hostapi']

            # 1. SteelSeries Sonar Microphone -> route to Sonar Chat or Gaming
            if "sonar" in name:
                for i, d in enumerate(devices):
                    if d['hostapi'] == api_idx and d['max_output_channels'] > 0 and "sonar - chat" in d['name'].lower():
                        return i
                for i, d in enumerate(devices):
                    if d['hostapi'] == api_idx and d['max_output_channels'] > 0 and "sonar" in d['name'].lower():
                        return i

            # 2. VB-Cable CABLE Output -> route to CABLE Input
            if "cable output" in name or "vb-cable" in name or "cable" in name:
                for i, d in enumerate(devices):
                    if d['hostapi'] == api_idx and d['max_output_channels'] > 0 and "cable input" in d['name'].lower():
                        return i

            # 3. Voicemod Microphone -> route to Dummy Output (Voicemod)
            if "voicemod" in name:
                for i, d in enumerate(devices):
                    if d['hostapi'] == api_idx and d['max_output_channels'] > 0 and "voicemod" in d['name'].lower():
                        return i

            # 4. General fallback: find first virtual output or first output on same API
            for i, d in enumerate(devices):
                if d['hostapi'] == api_idx and d['max_output_channels'] > 0 and ("virtual" in d['name'].lower() or "cable" in d['name'].lower() or "sonar" in d['name'].lower()):
                    return i
            for i, d in enumerate(devices):
                if d['hostapi'] == api_idx and d['max_output_channels'] > 0:
                    return i

            return dev_id
        except Exception as e:
            print(f"Error in resolve_effective_output_device_id: {e}")
            return dev_id

    def play_test_routing_tone(self, target_output_id=None):
        out_id = target_output_id if target_output_id is not None and str(target_output_id) != "" else self.output_id
        if out_id is None:
            ids = device_helper.find_soundx_device_ids()
            out_id = ids["soundx_output_id"]
        
        out_id = self.resolve_effective_output_device_id(out_id)
        if out_id is None:
            return {"status": "error", "message": "No output device available"}
        
        try:
            import numpy as np
            import threading
            sr = 48000
            t1 = np.linspace(0, 0.18, int(sr * 0.18), False)
            t2 = np.linspace(0, 0.22, int(sr * 0.22), False)
            tone1 = (0.35 * np.sin(2 * np.pi * 523.25 * t1)).astype(np.float32)
            tone2 = (0.35 * np.sin(2 * np.pi * 659.25 * t2)).astype(np.float32)
            fade_len = 120
            tone1[:fade_len] *= np.linspace(0, 1, fade_len)
            tone1[-fade_len:] *= np.linspace(1, 0, fade_len)
            tone2[:fade_len] *= np.linspace(0, 1, fade_len)
            tone2[-fade_len:] *= np.linspace(1, 0, fade_len)
            chime = np.concatenate([tone1, tone2])
            
            def play_async():
                try:
                    sd.play(chime, samplerate=sr, device=int(out_id))
                    sd.wait()
                except Exception as ex:
                    print(f"Error playing test tone: {ex}")
            
            threading.Thread(target=play_async, daemon=True).start()
            return {"status": "ok", "message": "Test tone sent to Master Output! Check Discord/OBS input meter."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def set_config(self, input_id, output_id, noise_path, volume, mic_volume=100, monitor_id=None, monitor_enabled=False, monitor_volume=100):
        self.input_id = int(input_id) if input_id is not None and str(input_id) != "" and int(input_id) >= 0 else None
        self.output_id = int(output_id) if output_id is not None and str(output_id) != "" else None
        self.monitor_id = int(monitor_id) if monitor_id is not None and str(monitor_id) != "" and int(monitor_id) >= 0 else None
        self.monitor_enabled = bool(monitor_enabled)
        self.monitor_volume = float(monitor_volume) / 100.0
        self.noise_path = noise_path
        self.noise_volume = float(volume) / 100.0
        self.mic_volume = float(mic_volume) / 100.0
        
        # If running, update on the fly
        if self.engine and self.engine.running:
            self.engine.noise_volume = self.noise_volume
            self.engine.mic_volume = self.mic_volume
            self.engine.set_monitor(self.monitor_enabled, self.monitor_id, self.monitor_volume)
            if self.noise_path:
                self.engine.load_noise(self.noise_path)
            else:
                self.engine.noise_data = None

    def start(self):
        if self.engine and self.engine.running:
            return {"status": "already_running"}

        if self.output_id is None:
            # Try to auto-select SoundX Router output device
            dev_ids = device_helper.find_soundx_device_ids()
            if dev_ids["soundx_output_id"] is not None:
                self.output_id = dev_ids["soundx_output_id"]
            else:
                return {"status": "error", "message": "No output device selected."}

        eff_output_id = self.resolve_effective_output_device_id(self.output_id)
        if eff_output_id is None:
            return {"status": "error", "message": "No valid output device available."}
            
        try:
            self.engine = AudioEngine(
                input_device_id=self.input_id, 
                output_device_id=eff_output_id, 
                noise_file_path=self.noise_path, 
                noise_volume=self.noise_volume,
                sample_rate=48000,
                app_mixer=self.app_mixer,
                monitor_device_id=self.monitor_id,
                monitor_enabled=self.monitor_enabled,
                monitor_volume=self.monitor_volume,
                mic_volume=self.mic_volume
            )
            self.engine.start()
            return {"status": "started"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def stop(self):
        if self.engine:
            self.engine.stop()
            self.engine = None
        return {"status": "stopped"}

    def get_status(self):
        if self.engine and self.engine.running:
            return "running"
        return "stopped"

    def play_effect(self, sound_path, volume=1.0):
        if self.engine and self.engine.running:
            self.engine.play_effect(sound_path, volume)
            return {"status": "playing"}
        return {"status": "not_running"}

    # --- Live meter helpers ---
    def get_levels(self):
        if self.engine and self.engine.running:
            return {
                "input": self.engine.last_input_level,
                "output": self.engine.last_output_level,
                "mic": self.engine.last_mic_level,
                "apps": self.engine.app_levels
            }
        return {"input": 0.0, "output": 0.0, "mic": 0.0, "apps": {}}

    # --- App mixer helpers ---
    def get_available_apps(self):
        return self.app_mixer.get_available_apps()

    def add_app(self, pid: int, name: str, volume: float = 1.0, muted: bool = False, raw_name: str = ""):
        is_running = self.engine is not None and self.engine.running
        self.app_mixer.add_app(pid, name, volume, is_engine_running=is_running, muted=muted, raw_name=raw_name)
        return {"status": "ok", "apps": self.app_mixer.get_states()}

    def restore_saved_apps(self, saved_apps: list):
        is_running = self.engine is not None and self.engine.running
        self.app_mixer.restore_saved_apps(saved_apps, is_engine_running=is_running)
        return {"status": "ok", "apps": self.app_mixer.get_states()}

    def remove_app(self, pid: int):
        self.app_mixer.remove_app(pid)
        return {"status": "ok", "apps": self.app_mixer.get_states()}

    def set_app_volume(self, pid: int, volume: float):
        self.app_mixer.set_app_volume(pid, volume)
        return {"status": "ok"}

    def set_app_mute(self, pid: int, muted: bool):
        self.app_mixer.set_app_mute(pid, muted)
        return {"status": "ok"}

    def get_app_states(self):
        return self.app_mixer.get_states()

    def set_mic_volume(self, volume: float):
        self.mic_volume = float(volume) / 100.0
        if self.engine:
            self.engine.mic_volume = self.mic_volume
        return {"status": "ok"}

    def set_mic_mute(self, muted: bool):
        self.mic_muted = bool(muted)
        if self.engine:
            self.engine.mic_muted = self.mic_muted
        return {"status": "ok"}

    def set_monitor(self, enabled: bool, device_id=None, volume=100):
        self.monitor_enabled = bool(enabled)
        self.monitor_volume = float(volume) / 100.0
        if device_id is not None:
            self.monitor_id = int(device_id) if int(device_id) >= 0 else None
        if self.engine:
            self.engine.set_monitor(self.monitor_enabled, self.monitor_id, self.monitor_volume)
        return {"status": "ok"}

    # --- Sound preview helpers ---
    def _preview_callback(self, outdata, frames, time, status):
        if status:
            print(status)
        if self.preview_data is None:
            outdata.fill(0)
            return

        chunk = np.zeros((frames, self.preview_channels), dtype='float32')
        remaining = frames
        start = 0
        data_len = len(self.preview_data)

        while remaining > 0 and data_len > 0:
            take = min(remaining, data_len - self.preview_index)
            chunk[start:start+take] = self.preview_data[self.preview_index:self.preview_index+take]
            self.preview_index = (self.preview_index + take) % data_len
            remaining -= take
            start += take

        outdata[:] = chunk

    def resample_audio(self, data, src_rate, target_rate):
        if src_rate == target_rate:
            return data
        ratio = target_rate / src_rate
        new_length = int(len(data) * ratio)
        x_old = np.linspace(0, len(data), len(data))
        x_new = np.linspace(0, len(data), new_length)
        new_data = np.zeros((new_length, data.shape[1]), dtype='float32')
        for i in range(data.shape[1]):
            new_data[:, i] = np.interp(x_new, x_old, data[:, i])
        return new_data

    def start_preview(self, sound_path, output_device=None):
        if not os.path.exists(sound_path):
            return {"status": "error", "message": "Sound file not found"}

        self.stop_preview()

        device = output_device if output_device is not None else sd.default.device[1]
        try:
            dev_info = sd.query_devices(device)
            target_fs = int(dev_info['default_samplerate'])
        except Exception:
            target_fs = 48000

        data, fs = sf.read(sound_path, dtype='float32')
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        if fs != target_fs:
            data = self.resample_audio(data, fs, target_fs)
            fs = target_fs

        self.preview_samplerate = fs
        self.preview_channels = data.shape[1]
        self.preview_data = data
        self.preview_index = 0

        try:
            self.preview_stream = sd.OutputStream(
                device=device,
                samplerate=self.preview_samplerate,
                channels=self.preview_channels,
                blocksize=256,
                latency='low',
                callback=self._preview_callback
            )
            self.preview_stream.start()
            return {"status": "previewing"}
        except Exception as e:
            self.preview_data = None
            self.preview_stream = None
            return {"status": "error", "message": str(e)}

    def stop_preview(self):
        if self.preview_stream:
            try:
                self.preview_stream.stop()
                self.preview_stream.close()
            except Exception:
                pass
        self.preview_stream = None
        self.preview_data = None
        self.preview_index = 0
        return {"status": "stopped"}
