import sounddevice as sd
import numpy as np
import soundfile as sf
import sys
import os
import threading
import collections

class AudioEngine:
    def __init__(self, input_device_id, output_device_id, noise_file_path=None, noise_volume=0.2, 
                 sample_rate=48000, block_size=256, app_mixer=None, monitor_device_id=None,
                 monitor_enabled=False, monitor_volume=1.0, mic_volume=1.0):
        self.input_device_id = input_device_id
        self.output_device_id = output_device_id
        self.monitor_device_id = monitor_device_id
        self.monitor_enabled = monitor_enabled
        self.monitor_volume = monitor_volume
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.noise_volume = noise_volume
        self.mic_volume = mic_volume
        self.mic_muted = False
        self.app_mixer = app_mixer

        self.stream = None
        self.monitor_stream = None
        self.running = False
        
        # Audio levels
        self.last_input_level = 0.0
        self.last_output_level = 0.0
        self.last_mic_level = 0.0
        self.app_levels = {}
        
        # Background noise
        self.noise_data = None
        self.noise_index = 0
        
        # Preview data
        self.preview_data = None
        self.preview_index = 0
        
        # Active sound effects
        self.active_effects = []
        self.effects_lock = threading.Lock()
        
        # Monitor buffer for headphones
        self.monitor_buffer = collections.deque(maxlen=40)
        self.monitor_lock = threading.Lock()
        
        if noise_file_path:
            self.load_noise(noise_file_path)

    def load_noise(self, file_path):
        if not file_path or not os.path.exists(file_path):
            self.noise_data = None
            return

        try:
            data, fs = sf.read(file_path, dtype='float32')
            if len(data.shape) == 1:
                data = data.reshape(-1, 1)
            
            if fs != self.sample_rate:
                data = self.resample_audio(data, fs, self.sample_rate)
            
            self.noise_data = data
            self.noise_index = 0
        except Exception as e:
            print(f"Error loading noise file: {e}")
            self.noise_data = None

    def load_preview(self, file_path):
        if not file_path or not os.path.exists(file_path):
            self.preview_data = None
            return

        try:
            data, fs = sf.read(file_path, dtype='float32')
            if len(data.shape) == 1:
                data = data.reshape(-1, 1)
            
            if fs != self.sample_rate:
                data = self.resample_audio(data, fs, self.sample_rate)
            
            self.preview_data = data
            self.preview_index = 0
        except Exception as e:
            print(f"Error loading preview: {e}")
            self.preview_data = None

    def stop_preview(self):
        self.preview_data = None
        self.preview_index = 0

    def play_effect(self, file_path, volume=1.0):
        if not os.path.exists(file_path):
            return
        try:
            data, fs = sf.read(file_path, dtype='float32')
            if len(data.shape) == 1:
                data = data.reshape(-1, 1)
            
            if fs != self.sample_rate:
                data = self.resample_audio(data, fs, self.sample_rate)
            
            with self.effects_lock:
                self.active_effects.append({
                    'data': data,
                    'index': 0,
                    'volume': volume
                })
        except Exception as e:
            print(f"Error playing effect: {e}")

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

    def callback(self, indata, outdata, frames, time_info, status):
        channels = outdata.shape[1]
        mixed = np.zeros((frames, channels), dtype=np.float32)

        # 1. Microphone / Physical Input
        if indata is not None and indata.size > 0 and not self.mic_muted:
            in_ch = indata.shape[1]
            mic_audio = indata.copy()
            if in_ch != channels:
                if in_ch == 1:
                    mic_audio = np.tile(mic_audio, (1, channels))
                else:
                    new_mic = np.zeros((frames, channels), dtype=np.float32)
                    min_ch = min(in_ch, channels)
                    new_mic[:, :min_ch] = mic_audio[:, :min_ch]
                    mic_audio = new_mic
            
            mic_audio *= self.mic_volume
            mixed += mic_audio
            peak = float(np.max(np.abs(mic_audio)))
            rms = float(np.sqrt(np.mean(np.square(mic_audio))))
            curr_mic = max(peak, rms * 2.2)
            if curr_mic >= self.last_mic_level:
                self.last_mic_level = curr_mic
            else:
                self.last_mic_level *= 0.92
        else:
            self.last_mic_level *= 0.88
            if self.last_mic_level < 0.001:
                self.last_mic_level = 0.0

        self.last_input_level = self.last_mic_level

        # 2. Mix Captured Applications
        if self.app_mixer:
            app_mix, app_levels = self.app_mixer.pull_mix(frames, channels)
            mixed += app_mix
            self.app_levels = app_levels

        # 3. Mix Background Noise
        if self.noise_data is not None and self.noise_volume > 0.001:
            noise_len = len(self.noise_data)
            current_idx = self.noise_index
            remaining = frames
            
            noise_chunk = np.zeros((frames, self.noise_data.shape[1]), dtype='float32')
            chunk_idx = 0
            while remaining > 0:
                take = min(remaining, noise_len - current_idx)
                noise_chunk[chunk_idx:chunk_idx+take] = self.noise_data[current_idx:current_idx+take]
                remaining -= take
                chunk_idx += take
                current_idx = (current_idx + take) % noise_len
            
            self.noise_index = current_idx
            
            if noise_chunk.shape[1] != channels:
                if noise_chunk.shape[1] == 1:
                    noise_chunk = np.tile(noise_chunk, (1, channels))
                else:
                    new_noise = np.zeros((frames, channels), dtype=np.float32)
                    min_ch = min(noise_chunk.shape[1], channels)
                    new_noise[:, :min_ch] = noise_chunk[:, :min_ch]
                    noise_chunk = new_noise
            
            mixed += noise_chunk * self.noise_volume

        # 4. Mix Preview if active
        if self.preview_data is not None:
            prev_len = len(self.preview_data)
            current_idx = self.preview_index
            remaining = frames
            prev_chunk = np.zeros((frames, self.preview_data.shape[1]), dtype='float32')
            chunk_idx = 0
            while remaining > 0:
                take = min(remaining, prev_len - current_idx)
                prev_chunk[chunk_idx:chunk_idx+take] = self.preview_data[current_idx:current_idx+take]
                remaining -= take
                chunk_idx += take
                current_idx = (current_idx + take) % prev_len
            self.preview_index = current_idx
            
            if prev_chunk.shape[1] != channels:
                if prev_chunk.shape[1] == 1:
                    prev_chunk = np.tile(prev_chunk, (1, channels))
                else:
                    new_prev = np.zeros((frames, channels), dtype=np.float32)
                    min_ch = min(prev_chunk.shape[1], channels)
                    new_prev[:, :min_ch] = prev_chunk[:, :min_ch]
                    prev_chunk = new_prev
            mixed += prev_chunk

        # 5. Mix Soundboard Effects
        with self.effects_lock:
            for i in range(len(self.active_effects) - 1, -1, -1):
                effect = self.active_effects[i]
                data = effect['data']
                idx = effect['index']
                vol = effect['volume']
                effect_len = len(data)
                
                if idx >= effect_len:
                    self.active_effects.pop(i)
                    continue
                
                take = min(frames, effect_len - idx)
                effect_chunk = data[idx:idx+take]
                
                if effect_chunk.shape[1] != channels:
                    if effect_chunk.shape[1] == 1:
                        effect_chunk = np.tile(effect_chunk, (1, channels))
                    else:
                        temp = np.zeros((take, channels), dtype='float32')
                        min_ch = min(effect_chunk.shape[1], channels)
                        temp[:, :min_ch] = effect_chunk[:, :min_ch]
                        effect_chunk = temp
                
                mixed[:take] += effect_chunk * vol
                effect['index'] += take
                if effect['index'] >= effect_len:
                    self.active_effects.pop(i)

        # 6. Limiting and Master Output
        np.clip(mixed, -1.0, 1.0, out=mixed)
        outdata[:] = mixed

        if mixed.size:
            out_peak = float(np.max(np.abs(mixed)))
            out_rms = float(np.sqrt(np.mean(np.square(mixed))))
            curr_out = max(out_peak, out_rms * 2.2)
            if curr_out >= self.last_output_level:
                self.last_output_level = curr_out
            else:
                self.last_output_level *= 0.92
        else:
            self.last_output_level *= 0.88
            if self.last_output_level < 0.001:
                self.last_output_level = 0.0

        # 7. Push to Monitor (Headphones) buffer if monitoring is enabled
        if self.monitor_enabled and self.monitor_stream:
            with self.monitor_lock:
                self.monitor_buffer.append(mixed.copy())

    def monitor_callback(self, outdata, frames, time_info, status):
        """Callback for real-time headphone monitoring stream."""
        channels = outdata.shape[1]
        out = np.zeros((frames, channels), dtype=np.float32)

        with self.monitor_lock:
            if self.monitor_buffer:
                chunk = self.monitor_buffer.popleft()
                take = min(frames, len(chunk))
                if chunk.shape[1] == channels:
                    out[:take] = chunk[:take]
                elif chunk.shape[1] == 1 and channels == 2:
                    out[:take] = np.tile(chunk[:take], (1, 2))
                else:
                    min_ch = min(chunk.shape[1], channels)
                    out[:take, :min_ch] = chunk[:take, :min_ch]

        out *= self.monitor_volume
        np.clip(out, -1.0, 1.0, out=out)
        outdata[:] = out

    def start(self):
        if self.running:
            return
            
        self.running = True
        try:
            # Check devices and determine channels
            out_info = sd.query_devices(self.output_device_id)
            out_channels = min(2, out_info['max_output_channels'])
            if out_channels < 1:
                out_channels = 2

            # Start App Mixers
            if self.app_mixer:
                self.app_mixer.start_all()

            # Input stream configuration
            in_channels = 0
            if self.input_device_id is not None and self.input_device_id >= 0:
                try:
                    in_info = sd.query_devices(self.input_device_id)
                    in_channels = min(2, in_info['max_input_channels'])
                except Exception:
                    in_channels = 0

            print(f"Starting SoundX Router Stream: In={self.input_device_id} ({in_channels} ch), Out={self.output_device_id} ({out_channels} ch) @ {self.sample_rate}Hz")

            if in_channels > 0:
                self.stream = sd.Stream(
                    device=(self.input_device_id, self.output_device_id),
                    samplerate=self.sample_rate,
                    blocksize=self.block_size,
                    latency='low',
                    channels=(in_channels, out_channels),
                    callback=self.callback
                )
            else:
                # Output only (no microphone, only apps & sounds)
                def output_only_callback(outdata, frames, time_info, status):
                    self.callback(None, outdata, frames, time_info, status)

                self.stream = sd.OutputStream(
                    device=self.output_device_id,
                    samplerate=self.sample_rate,
                    blocksize=self.block_size,
                    latency='low',
                    channels=out_channels,
                    callback=output_only_callback
                )

            self.stream.start()

            # Start Headphone Monitoring Stream if enabled
            if self.monitor_enabled and self.monitor_device_id is not None:
                self._start_monitor_stream()

            print("SoundX Router Engine started successfully.")
        except Exception as e:
            print(f"Error starting audio engine: {e}")
            self.running = False
            if self.app_mixer:
                self.app_mixer.stop_all()
            raise e

    def _start_monitor_stream(self):
        try:
            mon_info = sd.query_devices(self.monitor_device_id)
            mon_channels = min(2, mon_info['max_output_channels'])
            self.monitor_stream = sd.OutputStream(
                device=self.monitor_device_id,
                samplerate=self.sample_rate,
                blocksize=self.block_size,
                latency='low',
                channels=mon_channels,
                callback=self.monitor_callback
            )
            self.monitor_stream.start()
            print(f"Monitor stream started on device {self.monitor_device_id}.")
        except Exception as e:
            print(f"Error starting monitor stream: {e}")
            self.monitor_stream = None

    def _stop_monitor_stream(self):
        if self.monitor_stream:
            try:
                self.monitor_stream.stop()
                self.monitor_stream.close()
            except Exception:
                pass
            self.monitor_stream = None

    def set_monitor(self, enabled: bool, device_id: int = None, volume: float = 1.0):
        self.monitor_enabled = bool(enabled)
        self.monitor_volume = float(volume)
        if device_id is not None:
            self.monitor_device_id = int(device_id)

        if self.running:
            if self.monitor_enabled and not self.monitor_stream and self.monitor_device_id is not None:
                self._start_monitor_stream()
            elif not self.monitor_enabled and self.monitor_stream:
                self._stop_monitor_stream()

    def stop(self):
        if not self.running:
            return
            
        print("Stopping SoundX Router Engine...")
        self.running = False

        if self.app_mixer:
            self.app_mixer.stop_all()

        self._stop_monitor_stream()

        if self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass
            self.stream = None

        with self.monitor_lock:
            self.monitor_buffer.clear()
