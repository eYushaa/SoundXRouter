import sounddevice as sd

def select_host_api():
    """
    Lists available Host APIs and asks user to select one.
    Returns the hostapi index.
    """
    print("\n--- Select Audio Driver Type (Host API) ---")
    print("To avoid errors, Input and Output must use the same driver type.")
    hostapis = sd.query_hostapis()
    for i, api in enumerate(hostapis):
        print(f"[{i}] {api['name']}")
    
    while True:
        try:
            idx = int(input("Enter the ID of the driver type to use (Recommended: MME or Windows DirectSound): "))
            if 0 <= idx < len(hostapis):
                return idx
            print("Invalid ID.")
        except ValueError:
            print("Please enter a number.")

def list_devices(api_index):
    """
    Lists devices only for the specified API.
    Returns a list of (original_device_index, device_info) tuples.
    """
    print(f"\n--- Available Devices for {sd.query_hostapis()[api_index]['name']} ---")
    devices = sd.query_devices()
    valid_devices = []
    
    # Filter devices by API
    for i, device in enumerate(devices):
        if device['hostapi'] == api_index:
            # Filter out useless devices
            if device['max_input_channels'] == 0 and device['max_output_channels'] == 0:
                continue
            valid_devices.append((i, device))
            
            io_str = f"({device['max_input_channels']} in, {device['max_output_channels']} out)"
            # We use a local index for display, but return the global index
            print(f"[{len(valid_devices)-1}] {device['name']} {io_str}")
            
    return valid_devices

def get_device_selection(valid_devices, kind='input'):
    while True:
        try:
            local_idx = int(input(f"Enter the ID of the {kind} device from the list above: "))
            if 0 <= local_idx < len(valid_devices):
                global_idx, device_info = valid_devices[local_idx]
                
                # Validate channels
                if kind == 'input' and device_info['max_input_channels'] == 0:
                    print(f"Error: Device '{device_info['name']}' has 0 input channels. Cannot use as Input.")
                    continue
                if kind == 'output' and device_info['max_output_channels'] == 0:
                    print(f"Error: Device '{device_info['name']}' has 0 output channels. Cannot use as Output.")
                    continue
                    
                return global_idx
            print("Invalid ID.")
        except ValueError:
            print("Please enter a number.")


if __name__ == "__main__":
    list_devices()
