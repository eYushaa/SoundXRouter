import sounddevice as sd
import os
import numpy as np
import soundfile as sf
from audio_engine import AudioEngine

class AudioManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AudioManager, cls).__new__(cls)
            cls._instance.engine = None
            cls._instance.input_id = None
            cls._instance.output_id = None
            cls._instance.noise_path = None
            cls._instance.noise_volume = 0.2
            cls._instance.preview_stream = None
            cls._instance.preview_data = None
            cls._instance.preview_index = 0
            cls._instance.preview_samplerate = 44100
            cls._instance.preview_channels = 1
        return cls._instance

    def get_devices(self):
        devices = sd.query_devices()
        hostapis = sd.query_hostapis()
        
        result = []
        for i, dev in enumerate(devices):
            api_name = hostapis[dev['hostapi']]['name']
            # Only include useful devices
            if dev['max_input_channels'] > 0 or dev['max_output_channels'] > 0:
                result.append({
                    "id": i,
                    "name": dev['name'],
                    "api": api_name,
                    "inputs": dev['max_input_channels'],
                    "outputs": dev['max_output_channels']
                })
        return result

    def get_host_apis(self):
        return [api['name'] for api in sd.query_hostapis()]

    def set_config(self, input_id, output_id, noise_path, volume):
        self.input_id = int(input_id)
        self.output_id = int(output_id)
        self.noise_path = noise_path
        self.noise_volume = float(volume) / 100.0
        
        # If running, update on the fly
        if self.engine and self.engine.running:
            self.engine.noise_volume = self.noise_volume
            if self.noise_path:
                self.engine.load_noise(self.noise_path)
            else:
                self.engine.noise_data = None

    def start(self):
        if self.engine and self.engine.running:
            return {"status": "already_running"}
            
        try:
            self.engine = AudioEngine(
                self.input_id, 
                self.output_id, 
                noise_file_path=self.noise_path, 
                noise_volume=self.noise_volume
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
                "output": self.engine.last_output_level
            }
        return {"input": 0.0, "output": 0.0}

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
        
        # Create time indices for interpolation
        x_old = np.linspace(0, len(data), len(data))
        x_new = np.linspace(0, len(data), new_length)
        
        # Resample each channel
        new_data = np.zeros((new_length, data.shape[1]), dtype='float32')
        for i in range(data.shape[1]):
            new_data[:, i] = np.interp(x_new, x_old, data[:, i])
            
        return new_data

    def start_preview(self, sound_path, output_device=None):
        if not os.path.exists(sound_path):
            return {"status": "error", "message": "Sound file not found"}

        self.stop_preview()

        # Always use a separate stream for preview to target the monitoring device (headphones)
        # instead of the routing output (virtual cable).
        
        device = output_device if output_device is not None else sd.default.device[1]
        
        # Get device sample rate
        try:
            dev_info = sd.query_devices(device)
            target_fs = int(dev_info['default_samplerate'])
        except:
            target_fs = 44100 # Fallback

        data, fs = sf.read(sound_path, dtype='float32')
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        # Resample to match device
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
                blocksize=1024,
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
