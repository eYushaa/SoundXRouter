import winreg
import subprocess
import sounddevice as sd

CAPTURE_PATH = r"SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Capture"
RENDER_PATH = r"SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Render"

PKEY_FRIENDLY_NAME = "{a45c254e-df1c-4efd-8020-67d146a850e0},2"
PKEY_INTERFACE_NAME = "{b3f8fa53-0004-438e-9003-51a46e139bfc},6"

def get_installed_registry_endpoints():
    """
    Dynamically scans Windows Registry for all audio capture and render endpoints.
    Returns a dict with 'capture' and 'render' lists without relying on hardcoded GUIDs.
    """
    endpoints = {"capture": [], "render": []}
    for category, reg_path in [("capture", CAPTURE_PATH), ("render", RENDER_PATH)]:
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_path) as root_key:
                count = winreg.QueryInfoKey(root_key)[0]
                for i in range(count):
                    guid = winreg.EnumKey(root_key, i)
                    try:
                        with winreg.OpenKey(root_key, rf"{guid}\Properties") as pkey:
                            fname = ""
                            iname = ""
                            try:
                                fname, _ = winreg.QueryValueEx(pkey, PKEY_FRIENDLY_NAME)
                            except Exception:
                                pass
                            try:
                                iname, _ = winreg.QueryValueEx(pkey, PKEY_INTERFACE_NAME)
                            except Exception:
                                pass
                            
                            endpoints[category].append({
                                "guid": guid,
                                "friendly_name": fname,
                                "interface_name": iname
                            })
                    except Exception:
                        pass
        except Exception as e:
            print(f"Warning: Could not read registry path {reg_path}: {e}")
    return endpoints

def ensure_soundx_router_names():
    """
    Ensures VB-Audio Virtual Cable endpoints retain or restore their standard clean names:
    - Capture: 'CABLE Output' (Interface: 'VB-Audio Virtual Cable')
    - Render: 'CABLE Input' (Interface: 'VB-Audio Virtual Cable')
    STRICTLY preserves and restores SteelSeries Sonar endpoints so user mic voice NEVER leaks.
    """
    endpoints = get_installed_registry_endpoints()
    updated = False

    # 1. Clean and restore any Sonar endpoints if they were ever aliased
    for ep in endpoints["capture"]:
        fname = ep["friendly_name"].lower()
        iname = ep["interface_name"].lower()
        if "sonar" in iname and "soundx" in fname:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, rf"{CAPTURE_PATH}\{ep['guid']}\Properties", 0, winreg.KEY_SET_VALUE) as k:
                    winreg.SetValueEx(k, PKEY_FRIENDLY_NAME, 0, winreg.REG_SZ, "SteelSeries Sonar - Microphone")
            except Exception:
                pass

    for ep in endpoints["render"]:
        fname = ep["friendly_name"].lower()
        iname = ep["interface_name"].lower()
        if "sonar" in iname and "soundx" in fname:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, rf"{RENDER_PATH}\{ep['guid']}\Properties", 0, winreg.KEY_SET_VALUE) as k:
                    winreg.SetValueEx(k, PKEY_FRIENDLY_NAME, 0, winreg.REG_SZ, "SteelSeries Sonar - Chat")
            except Exception:
                pass

    # 2. Target VB-Audio Virtual Cable: Guarantee original standard names
    # Capture: Must be named 'CABLE Output'
    for ep in endpoints["capture"]:
        fname = ep["friendly_name"].lower()
        iname = ep["interface_name"].lower()
        is_vb = ("vb-audio" in iname or "vbaudiovacwdm" in iname or "vbaudio" in iname or "cable" in fname or "soundx" in fname) and "sonar" not in iname and "sonar" not in fname
        if is_vb and ("soundx" in fname or ep["friendly_name"] != "CABLE Output"):
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, rf"{CAPTURE_PATH}\{ep['guid']}\Properties", 0, winreg.KEY_SET_VALUE) as k:
                    winreg.SetValueEx(k, PKEY_FRIENDLY_NAME, 0, winreg.REG_SZ, "CABLE Output")
                    winreg.SetValueEx(k, PKEY_INTERFACE_NAME, 0, winreg.REG_SZ, "VB-Audio Virtual Cable")
                    updated = True
            except PermissionError:
                return {
                    "status": "permission_denied",
                    "message": "Windows Administrator permission required to rename endpoints in registry."
                }
            except Exception as e:
                print(f"Could not update capture endpoint {ep['guid']}: {e}")

    # Render: Must be named 'CABLE Input'
    for ep in endpoints["render"]:
        fname = ep["friendly_name"].lower()
        iname = ep["interface_name"].lower()
        is_vb = ("vb-audio" in iname or "vbaudiovacwdm" in iname or "vbaudio" in iname or "cable" in fname or "soundx" in fname) and "sonar" not in iname and "sonar" not in fname
        if is_vb and ("soundx" in fname or ep["friendly_name"] != "CABLE Input"):
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, rf"{RENDER_PATH}\{ep['guid']}\Properties", 0, winreg.KEY_SET_VALUE) as k:
                    winreg.SetValueEx(k, PKEY_FRIENDLY_NAME, 0, winreg.REG_SZ, "CABLE Input")
                    winreg.SetValueEx(k, PKEY_INTERFACE_NAME, 0, winreg.REG_SZ, "VB-Audio Virtual Cable")
                    updated = True
            except PermissionError:
                return {
                    "status": "permission_denied",
                    "message": "Windows Administrator permission required to rename endpoints in registry."
                }
            except Exception as e:
                print(f"Could not update render endpoint {ep['guid']}: {e}")

    return {
        "status": "ok" if updated else "info",
        "updated": updated,
        "message": "VB-Audio Virtual Cable standart adları doğrulandı (CABLE Output / CABLE Input)."
    }

def scan_virtual_audio_infrastructure():
    """
    Comprehensive dynamic scan of all audio hardware and virtual audio devices on any Windows machine.
    """
    try:
        devices = sd.query_devices()
        hostapis = sd.query_hostapis()
    except Exception as e:
        print(f"Error querying audio devices: {e}")
        devices = []
        hostapis = []

    virtual_render_candidates = []
    virtual_capture_candidates = []
    has_soundx_custom = False
    has_vbcable = False
    has_sonar = False

    for i, dev in enumerate(devices):
        name = dev['name']
        api_idx = dev['hostapi']
        api_name = hostapis[api_idx]['name'] if api_idx < len(hostapis) else "Unknown"
        n_low = name.lower()

        is_render = dev['max_output_channels'] > 0
        is_capture = dev['max_input_channels'] > 0

        is_soundx = "soundx router" in n_low
        is_vbcable_in = "cable input" in n_low or "soundx router in" in n_low
        is_vbcable_out = "cable output" in n_low or "soundx router out" in n_low
        is_vbcable_other = "cable-a" in n_low or "cable-b" in n_low or "hi-fi cable" in n_low
        is_sonar_item = "sonar" in n_low
        is_voicemeeter = "voicemeeter" in n_low
        is_vac = "virtual audio cable" in n_low or "line 1" in n_low

        is_virtual = (is_soundx or is_vbcable_in or is_vbcable_out or is_vbcable_other or 
                      is_sonar_item or is_voicemeeter or is_vac)

        if is_soundx:
            has_soundx_custom = True
        if is_vbcable_in or is_vbcable_out:
            has_vbcable = True
        if is_sonar_item:
            has_sonar = True

        if is_render and is_virtual:
            dev_type = "soundx" if ("soundx router in" in n_low or "soundx router" in n_low) else ("vbcable" if "cable input" in n_low else ("sonar" if is_sonar_item else "other"))
            virtual_render_candidates.append({
                "id": i,
                "name": name,
                "api": api_name,
                "type": dev_type
            })

        if is_capture and is_virtual:
            dev_type = "soundx" if ("soundx router out" in n_low or "soundx router" in n_low) else ("vbcable" if "cable output" in n_low else ("sonar" if is_sonar_item else "other"))
            virtual_capture_candidates.append({
                "id": i,
                "name": name,
                "api": api_name,
                "type": dev_type
            })

    # Recommended Master Output (Render)
    recommended_out = None
    for pref_type in ["soundx", "vbcable", "sonar", "other"]:
        match = next((d for d in virtual_render_candidates if d["type"] == pref_type and ("DirectSound" in d["api"] or "WASAPI" in d["api"])), None)
        if not match:
            match = next((d for d in virtual_render_candidates if d["type"] == pref_type), None)
        if match:
            recommended_out = match
            break

    has_any_virtual = len(virtual_render_candidates) > 0 or len(virtual_capture_candidates) > 0

    return {
        "has_virtual_devices": has_any_virtual,
        "has_soundx_custom": has_soundx_custom,
        "has_vbcable": has_vbcable,
        "has_sonar": has_sonar,
        "recommended_master_output": recommended_out,
        "discord_mic_name": "CABLE Output (VB-Audio Virtual Cable)",
        "virtual_render_count": len(virtual_render_candidates),
        "virtual_capture_count": len(virtual_capture_candidates)
    }

def get_routing_instructions(selected_input_name=None, selected_output_name=None):
    """
    Generates dynamic routing instructions for the user based on their active selection.
    """
    info = scan_virtual_audio_infrastructure()
    
    in_name = (selected_input_name or "").lower()
    out_name = (selected_output_name or "").lower()

    is_using_voice_changer = "cable output" in in_name or "voicemod" in in_name or "vb-cable" in in_name
    
    # Check for loop hazard: both in and out pointing to same physical cable
    is_loop_hazard = False
    if ("cable output" in in_name and "cable input" in out_name) or \
       (("soundx router out" in in_name or "vb-cable" in in_name) and ("soundx router in" in out_name or "vb-cable" in out_name)):
        is_loop_hazard = True

    discord_mic = "CABLE Output (VB-Audio Virtual Cable)"
    master_out = selected_output_name or (info["recommended_master_output"]["name"] if info["recommended_master_output"] else "CABLE Input (VB-Audio Virtual Cable)")

    return {
        "has_virtual_devices": info["has_virtual_devices"],
        "is_using_voice_changer": is_using_voice_changer,
        "is_loop_hazard": is_loop_hazard,
        "discord_mic": discord_mic,
        "master_out_name": master_out,
        "vbcable_installed": info["has_vbcable"],
        "vbcable_download_url": "https://vb-audio.com/Cable/"
    }

def find_soundx_device_ids():
    """
    Searches sounddevice query_devices to find device IDs for:
    - soundx_output_id (the virtual render output / 'CABLE Input')
    - soundx_input_id (the virtual capture mic / 'CABLE Output')
    - vbcable_output_id (commonly used as input from RVC)
    """
    devices = sd.query_devices()
    soundx_out_id = None
    soundx_in_id = None
    vbcable_out_id = None
    cable_in_id = None

    for i, dev in enumerate(devices):
        name = dev['name'].lower()
        if dev['max_output_channels'] > 0:
            if "cable input" in name and cable_in_id is None:
                cable_in_id = i
            elif "soundx router in" in name and soundx_out_id is None:
                soundx_out_id = i
            elif "soundx router" in name and soundx_out_id is None:
                soundx_out_id = i
        if dev['max_input_channels'] > 0:
            if "cable output" in name and vbcable_out_id is None:
                vbcable_out_id = i
            elif "soundx router out" in name and soundx_in_id is None:
                soundx_in_id = i
            elif "soundx router" in name and soundx_in_id is None:
                soundx_in_id = i

    primary_out = cable_in_id if cable_in_id is not None else soundx_out_id
    primary_in = vbcable_out_id if vbcable_out_id is not None else soundx_in_id

    return {
        "soundx_output_id": primary_out,
        "soundx_input_id": primary_in,
        "vbcable_output_id": vbcable_out_id,
        "cable_input_id": cable_in_id
    }

def try_register_soundx_alias():
    return ensure_soundx_router_names()

def find_virtual_cable_endpoints():
    scan = scan_virtual_audio_infrastructure()
    return {
        "has_virtual_devices": scan["has_virtual_devices"],
        "has_soundx_custom": scan["has_soundx_custom"],
        "has_vbcable": scan["has_vbcable"],
        "discord_mic_name": scan["discord_mic_name"]
    }

def open_sound_control_panel():
    """
    Opens classic Windows Sound Control Panel (mmsys.cpl).
    """
    try:
        subprocess.Popen(['control', 'mmsys.cpl', 'sounds'])
        return True
    except Exception as e:
        print(f"Error opening sound control panel: {e}")
        return False

if __name__ == "__main__":
    print("Ensure names result:", ensure_soundx_router_names())
    print("Scan Infrastructure:", scan_virtual_audio_infrastructure())
    print("Routing Instructions:", get_routing_instructions())
    print("Device IDs:", find_soundx_device_ids())
