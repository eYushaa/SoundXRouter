import device_selector
from audio_engine import AudioEngine
import sys

def main():
    print("=== NoiseX Setup ===")
    
    # 1. Select Host API
    api_index = device_selector.select_host_api()
    
    # 2. List Devices for that API
    valid_devices = device_selector.list_devices(api_index)
    
    if not valid_devices:
        print("No valid devices found for this driver type.")
        return

    print("\n---------------------------------------------------")
    print("STEP 1: Select INPUT Device")
    print("This should be the output of your RVC (e.g., CABLE Output)")
    input_id = device_selector.get_device_selection(valid_devices, 'input')
    
    print("\n---------------------------------------------------")
    print("STEP 2: Select OUTPUT Device")
    print("This should be your Virtual Mic Input (e.g., CABLE-B Input or SteelSeries Mic)")
    output_id = device_selector.get_device_selection(valid_devices, 'output')
    
    print("\n---------------------------------------------------")
    print("STEP 3: Select Background Noise File")
    noise_path = input("Enter the full path to your audio file (mp3/wav) [Press Enter to skip]: ").strip()
    noise_vol = 0.2
    if noise_path:
        # Remove quotes if user copied as path
        noise_path = noise_path.replace('"', '').replace("'", "")
        
        # Ask for volume
        try:
            vol_input = input("Enter noise volume (0-100) [Default: 20]: ").strip()
            if vol_input:
                noise_vol = float(vol_input) / 100.0
                noise_vol = max(0.0, min(1.0, noise_vol)) # Clamp between 0 and 1
        except ValueError:
            print("Invalid volume. Using default 20%.")
    
    print("\n---------------------------------------------------")
    print(f"Starting NoiseX Routing: Device {input_id} -> Device {output_id}")
    if noise_path:
        print(f"Background Noise: {noise_path} (Volume: {int(noise_vol*100)}%)")
    
    engine = AudioEngine(input_id, output_id, noise_file_path=noise_path, noise_volume=noise_vol)
    engine.start()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
