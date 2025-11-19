import keyboard
import json
import os
import threading

class HotkeyManager:
    def __init__(self, bindings_file, callback_fn):
        self.bindings_file = bindings_file
        self.callback_fn = callback_fn # Function to call: fn(sound_path)
        self.bindings = {} # { key: sound_name }
        self.load()

    def load(self):
        if os.path.exists(self.bindings_file):
            try:
                with open(self.bindings_file, 'r') as f:
                    self.bindings = json.load(f)
            except:
                self.bindings = {}
        self.apply_bindings()

    def save(self):
        with open(self.bindings_file, 'w') as f:
            json.dump(self.bindings, f, indent=2)

    def apply_bindings(self):
        keyboard.unhook_all()
        for key, sound in self.bindings.items():
            if key and sound:
                try:
                    # We use a closure to capture the sound variable
                    keyboard.add_hotkey(key, lambda s=sound: self.callback_fn(s))
                except Exception as e:
                    print(f"Failed to bind {key}: {e}")

    def set_binding(self, key, sound_name):
        # Remove old binding for this sound if exists (optional, or allow multiple keys?)
        # Let's allow 1 key per sound for simplicity in UI
        # But wait, the UI maps Key -> Sound.
        # If we rebind a key, we overwrite.
        
        # Also check if sound was bound to another key?
        # The UI logic in script.js was: keyBindings[code] = file.
        
        self.bindings[key] = sound_name
        self.save()
        self.apply_bindings()

    def remove_binding(self, key):
        if key in self.bindings:
            del self.bindings[key]
            self.save()
            self.apply_bindings()

    def get_bindings(self):
        return self.bindings

    def clear_sound_binding(self, sound_name):
        # Remove any key bound to this sound
        keys_to_remove = [k for k, v in self.bindings.items() if v == sound_name]
        for k in keys_to_remove:
            del self.bindings[k]
        self.save()
        self.apply_bindings()
