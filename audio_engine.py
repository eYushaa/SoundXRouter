import sounddevice as sd
import numpy as np
import soundfile as sf
import sys
import os

class AudioEngine:
    def __init__(self, input_device_id, output_device_id, noise_file_path=None, noise_volume=0.2, sample_rate=44100, block_size=1024):
        self.input_device_id = input_device_id
        self.output_device_id = output_device_id
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.noise_volume = noise_volume
        self.stream = None
        self.running = False
        self.last_input_level = 0.0
        self.last_output_level = 0.0
        
        self.noise_data = None
        self.noise_index = 0
        
        self.preview_data = None
        self.preview_index = 0
        
        self.active_effects = [] # List of currently playing effects
        
        if noise_file_path:
            self.load_noise(noise_file_path)

    def load_noise(self, file_path):
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            self.noise_data = None
            return

        print(f"Loading noise file: {file_path}")
        try:
            data, fs = sf.read(file_path, dtype='float32')
            
            # Handle channels first
            if len(data.shape) == 1:
                data = data.reshape(-1, 1)
            
            # Resample if necessary
            if fs != self.sample_rate:
                print(f"Resampling noise from {fs} to {self.sample_rate}...")
                data = self.resample_audio(data, fs, self.sample_rate)
            
            self.noise_data = data
            self.noise_index = 0 # Reset index
            print(f"Noise loaded. Shape: {self.noise_data.shape}")
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
                # Resample
                data = self.resample_audio(data, fs, self.sample_rate)
            
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
        
        # Create time indices for interpolation
        x_old = np.linspace(0, len(data), len(data))
        x_new = np.linspace(0, len(data), new_length)
        
        # Resample each channel
        new_data = np.zeros((new_length, data.shape[1]), dtype='float32')
        for i in range(data.shape[1]):
            new_data[:, i] = np.interp(x_new, x_old, data[:, i])
            
        return new_data

    def callback(self, indata, outdata, frames, time, status):
        if status:
            print(status, file=sys.stderr)
        
        # 1. Start with Input
        mixed = indata.copy()
        # Track RMS input level
        if indata.size:
            self.last_input_level = float(np.sqrt(np.mean(np.square(indata))))
        else:
            self.last_input_level = 0.0
        
        # 2. Mix Noise if available
        if self.noise_data is not None:
            noise_len = len(self.noise_data)
            current_idx = self.noise_index
            remaining = frames
            
            noise_chunk = np.zeros((frames, self.noise_data.shape[1]), dtype='float32')
            
            # Fill chunk with looping
            chunk_idx = 0
            while remaining > 0:
                take = min(remaining, noise_len - current_idx)
                noise_chunk[chunk_idx:chunk_idx+take] = self.noise_data[current_idx:current_idx+take]
                
                remaining -= take
                chunk_idx += take
                current_idx = (current_idx + take) % noise_len
            
            self.noise_index = current_idx
            
            # Match channels
            if noise_chunk.shape[1] != indata.shape[1]:
                if noise_chunk.shape[1] == 1:
                    noise_chunk = np.tile(noise_chunk, (1, indata.shape[1]))
                else:
                    new_noise = np.zeros_like(indata)
                    min_ch = min(noise_chunk.shape[1], indata.shape[1])
                    new_noise[:, :min_ch] = noise_chunk[:, :min_ch]
                    noise_chunk = new_noise
            
            mixed += noise_chunk * self.noise_volume

        # 2.5 Mix Preview if available (Looping)
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
            
            # Match channels
            if prev_chunk.shape[1] != indata.shape[1]:
                if prev_chunk.shape[1] == 1:
                    prev_chunk = np.tile(prev_chunk, (1, indata.shape[1]))
                else:
                    new_prev = np.zeros_like(indata)
                    min_ch = min(prev_chunk.shape[1], indata.shape[1])
                    new_prev[:, :min_ch] = prev_chunk[:, :min_ch]
                    prev_chunk = new_prev
            
            mixed += prev_chunk # Full volume for preview

        # 3. Mix Active Effects
        # Iterate backwards to allow removal
        for i in range(len(self.active_effects) - 1, -1, -1):
            effect = self.active_effects[i]
            data = effect['data']
            idx = effect['index']
            vol = effect['volume']
            
            remaining = frames
            effect_len = len(data)
            
            if idx >= effect_len:
                self.active_effects.pop(i)
                continue
                
            take = min(remaining, effect_len - idx)
            
            # Get chunk
            effect_chunk = data[idx:idx+take]
            
            # Match channels
            if effect_chunk.shape[1] != indata.shape[1]:
                if effect_chunk.shape[1] == 1:
                    effect_chunk = np.tile(effect_chunk, (1, indata.shape[1]))
                else:
                    # Truncate or pad
                    # For simplicity, just take min channels or pad
                    temp = np.zeros((take, indata.shape[1]), dtype='float32')
                    min_ch = min(effect_chunk.shape[1], indata.shape[1])
                    temp[:, :min_ch] = effect_chunk[:, :min_ch]
                    effect_chunk = temp

            # Add to mix (handle if effect is shorter than frame)
            # We need to add it to the correct part of 'mixed'
            # Since we are processing the whole frame at once, and effects might end mid-frame,
            # we actually need to be careful. 
            # Simplified: We just add what we have to the start of the mix buffer (since we don't support sub-frame timing for start yet)
            # But wait, if we are in a loop for noise, we are filling a buffer.
            # For effects, we just take the next 'take' samples and add them to mixed[:take]
            
            mixed[:take] += effect_chunk * vol
            
            effect['index'] += take
            
            if effect['index'] >= effect_len:
                self.active_effects.pop(i)

        # 4. Clip and Output
        np.clip(mixed, -1, 1, out=mixed)
        outdata[:] = mixed
        if mixed.size:
            self.last_output_level = float(np.sqrt(np.mean(np.square(mixed))))
        else:
            self.last_output_level = 0.0

    def start(self):
        if self.running:
            return
            
        self.running = True
        try:
            # Check device capabilities to match channels
            in_info = sd.query_devices(self.input_device_id)
            out_info = sd.query_devices(self.output_device_id)
            
            # Determine channels (min of both)
            channels = min(in_info['max_input_channels'], out_info['max_output_channels'])
            
            print(f"Starting stream with {channels} channels...")
            
            # Create and start the stream
            self.stream = sd.Stream(device=(self.input_device_id, self.output_device_id),
                                   samplerate=self.sample_rate,
                                   blocksize=self.block_size,
                                   channels=channels,
                                   callback=self.callback)
            self.stream.start()
            print("Audio stream started.")
            
        except Exception as e:
            print(f"\nError starting stream: {e}")
            self.running = False
            raise e

    def stop(self):
        if not self.running:
            return
            
        print("Stopping stream...")
        self.running = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

if __name__ == "__main__":
    # Test with default devices if run directly
    print("Running AudioEngine test with default devices...")
    engine = AudioEngine(input_device_id=sd.default.device[0], 
                         output_device_id=sd.default.device[1])
    engine.start()
