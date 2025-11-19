let audioData = {
    host_apis: [],
    devices: [],
    sounds: []
};

let selectedSound = null;
let isRunning = false;
let previewingSound = null;
let meterInterval = null;
let waveAnimationId = null;

// DOM Elements
const driverSelect = document.getElementById('driver-select');
const inputSelect = document.getElementById('input-select');
const outputSelect = document.getElementById('output-select');
const soundGrid = document.getElementById('sound-grid');
const volumeSlider = document.getElementById('volume-slider');
const volDisplay = document.getElementById('vol-display');
const toggleBtn = document.getElementById('toggle-btn');
const statusIndicator = document.getElementById('status-indicator');
const header = document.querySelector('header');
const presetSelect = document.getElementById('preset-select');
const presetNameInput = document.getElementById('preset-name');
const loadPresetBtn = document.getElementById('load-preset');
const savePresetBtn = document.getElementById('save-preset');
const inputMeterFill = document.getElementById('input-meter-fill');
const outputMeterFill = document.getElementById('output-meter-fill');
const inputMeterValue = document.getElementById('input-meter-value');
const outputMeterValue = document.getElementById('output-meter-value');
const waveCanvas = document.getElementById('wave-canvas');
const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
let waveData = [];

// Init
document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/init');
    const data = await res.json();

    audioData = data;
    audioData.sounds = data.sounds;
    populateDrivers();
    populateSounds(data.sounds);
    await refreshPresets();
    await refreshBindings();
    startMeterPolling();
    initWaveCanvas();

    // Set default driver (MME)
    const mmeIndex = data.host_apis.findIndex(api => api.includes("MME"));
    if (mmeIndex !== -1) {
        driverSelect.value = mmeIndex;
        updateDevices(mmeIndex);
    }
});

async function refreshPresets() {
    const res = await fetch('/api/presets');
    const presets = await res.json();
    presetSelect.innerHTML = `<option value="">Presets</option>`;
    presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        presetSelect.appendChild(opt);
    });
}

loadPresetBtn.addEventListener('click', async () => {
    const name = presetSelect.value;
    if (!name) return;
    const res = await fetch('/api/presets/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (res.ok) {
        const data = await res.json();
        applyPreset(data.preset);
    }
});

savePresetBtn.addEventListener('click', async () => {
    const name = presetNameInput.value.trim();
    if (!name) {
        showToast('Enter a preset name.', 'error');
        return;
    }
    const payload = {
        name,
        driver_index: driverSelect.value ? parseInt(driverSelect.value) : null,
        input_id: inputSelect.value || null,
        output_id: outputSelect.value || null,
        sound: selectedSound,
        volume: volumeSlider.value
    };
    const res = await fetch('/api/presets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        presetNameInput.value = '';
        await refreshPresets();
        presetSelect.value = name;
    }
});

function applyPreset(preset) {
    if (typeof preset.driver_index === 'number') {
        driverSelect.value = preset.driver_index;
        updateDevices(preset.driver_index);
    }
    if (preset.input_id) {
        inputSelect.value = preset.input_id;
    }
    if (preset.output_id) {
        outputSelect.value = preset.output_id;
    }
    selectedSound = preset.sound || null;
    populateSounds(audioData.sounds);
    if (preset.volume) {
        volumeSlider.value = preset.volume;
        volDisplay.textContent = preset.volume + '%';
    }
}

// --- Window Controls & Dragging (HTTP Based) ---
function closeApp() {
    fetch('/api/window/close', { method: 'POST' });
}

function minimizeApp() {
    fetch('/api/window/minimize', { method: 'POST' });
}

// Drag Logic
let isDragging = false;
let startX, startY;
let lastMoveTime = 0;

header.addEventListener('mousedown', (e) => {
    // Don't drag if clicking buttons
    if (e.target.closest('.win-btn')) return;

    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const now = Date.now();
    if (now - lastMoveTime < 10) return; // Throttle to ~100fps

    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    if (dx === 0 && dy === 0) return;

    fetch('/api/window/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dx: Math.round(dx), dy: Math.round(dy) })
    });

    startX = e.screenX;
    startY = e.screenY;
    lastMoveTime = now;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// --- Audio Logic ---

// Drivers
function populateDrivers() {
    driverSelect.innerHTML = '';
    audioData.host_apis.forEach((api, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = api;
        driverSelect.appendChild(opt);
    });
}

driverSelect.addEventListener('change', (e) => {
    updateDevices(parseInt(e.target.value));
});

function updateDevices(apiIndex) {
    const apiName = audioData.host_apis[apiIndex];

    // Filter devices
    const inputs = audioData.devices.filter(d => d.api === apiName && d.inputs > 0);
    const outputs = audioData.devices.filter(d => d.api === apiName && d.outputs > 0);

    // Populate Input
    inputSelect.innerHTML = '';
    if (inputs.length === 0) {
        inputSelect.innerHTML = '<option>No Inputs Found</option>';
    } else {
        inputs.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev.id;
            opt.textContent = dev.name;
            inputSelect.appendChild(opt);
        });
    }

    // Populate Output
    outputSelect.innerHTML = '';
    if (outputs.length === 0) {
        outputSelect.innerHTML = '<option>No Outputs Found</option>';
    } else {
        outputs.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev.id;
            opt.textContent = dev.name;
            outputSelect.appendChild(opt);
        });
    }
}

// Sounds
function truncateName(name, max = 12) {
    return name.length > max ? name.slice(0, max - 3) + '...' : name;
}

function populateSounds(files) {
    soundGrid.innerHTML = '';

    // None option
    const noneDiv = document.createElement('div');
    noneDiv.className = 'sound-item ' + (selectedSound === null ? 'active' : '');
    noneDiv.innerHTML = '<div class="sound-name" title="None">None</div>';
    noneDiv.onclick = () => selectSound(noneDiv, null);
    soundGrid.appendChild(noneDiv);

    files.forEach(file => {
        const short = truncateName(file);
        const div = document.createElement('div');
        div.className = 'sound-item ' + (selectedSound === file ? 'active' : '');

        // Preview Button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'sound-preview';
        previewBtn.type = 'button';
        previewBtn.textContent = previewingSound === file ? '\u25A0' : '\u25B6';
        if (previewingSound === file) previewBtn.classList.add('playing');
        previewBtn.onclick = (e) => {
            e.stopPropagation();
            togglePreview(file, previewBtn);
        };

        // Keybind Badge/Button
        const bindBtn = document.createElement('button');
        bindBtn.className = 'keybind-badge';
        const currentKey = getKeyForSound(file);
        bindBtn.textContent = currentKey || '+';
        if (currentKey) bindBtn.classList.add('bound');

        bindBtn.onclick = (e) => {
            e.stopPropagation();
            startBinding(file, bindBtn);
        };

        const nameDiv = document.createElement('div');
        nameDiv.className = 'sound-name';
        nameDiv.title = file;
        nameDiv.textContent = short;

        div.appendChild(previewBtn);
        div.appendChild(bindBtn);
        div.appendChild(nameDiv);
        div.onclick = () => selectSound(div, file);
        soundGrid.appendChild(div);
    });
}

// --- Keybinding Logic ---
let keyBindings = {}; // { "a": "sound.mp3" } - Now just for UI display
let isBinding = false;
let bindingTarget = null;

async function refreshBindings() {
    const res = await fetch('/api/bindings');
    keyBindings = await res.json();
    // Refresh UI
    populateSounds(audioData.sounds);
}



function getKeyForSound(filename) {
    // keyBindings is { key: sound }
    return Object.keys(keyBindings).find(key => keyBindings[key] === filename);
}

function startBinding(filename, btn) {
    if (isBinding) return;
    isBinding = true;
    bindingTarget = { file: filename, btn: btn };
    btn.textContent = '...';
    btn.classList.add('binding');

    document.addEventListener('keydown', handleBindKey);
}

async function handleBindKey(e) {
    e.preventDefault();
    e.stopPropagation();

    const key = mapJsKeyToPython(e);

    // Remove listener immediately
    document.removeEventListener('keydown', handleBindKey);

    if (key === 'escape') {
        isBinding = false;
        bindingTarget = null;
        refreshBindings();
        return;
    }

    if (key === 'backspace' || key === 'delete') {
        // Unbind current sound? Or unbind the key pressed?
        // Let's assume backspace clears the binding for the target sound
        // But wait, we don't know the old key easily without looking it up.
        // Let's just say if they press Backspace, we clear the binding for this sound.
        // But the API expects a key to remove.
        // Let's just bind the key they pressed. If they want to clear, maybe a right click?
        // For now, let's just bind the key.
    }

    try {
        await fetch('/api/bindings/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, sound: bindingTarget.file })
        });
    } catch (err) {
        console.error(err);
    }

    isBinding = false;
    bindingTarget = null;
    await refreshBindings();
}

function mapJsKeyToPython(e) {
    // Simple mapping
    let k = e.key.toLowerCase();
    if (k === ' ') return 'space';
    if (k === 'arrowup') return 'up';
    if (k === 'arrowdown') return 'down';
    if (k === 'arrowleft') return 'left';
    if (k === 'arrowright') return 'right';
    // Add more if needed
    return k;
}


async function triggerSoundEffect(sound) {
    try {
        await fetch('/api/play_effect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sound: sound, volume: 1.0 })
        });
    } catch (err) {
        console.error(err);
    }
}

function selectSound(el, filename) {
    stopPreviewUI();
    // UI Update
    document.querySelectorAll('.sound-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');

    selectedSound = filename;

    if (isRunning) {
        sendConfigUpdate();
    }
}

async function refreshSounds() {
    const res = await fetch('/api/sounds');
    const files = await res.json();
    audioData.sounds = files;
    populateSounds(files);
}

function openFolder() {
    fetch('/api/open_folder');
}

// Volume
volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    volDisplay.textContent = val + '%';

    // Debounce or just send
    fetch('/api/update_volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: val })
    });
});

// --- Toast Notification ---
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease-in forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Start/Stop
toggleBtn.addEventListener('click', async () => {
    if (isRunning) {
        // STOP
        await fetch('/api/stop', { method: 'POST' });
        isRunning = false;
        toggleBtn.textContent = "Start Routing";
        toggleBtn.classList.remove('stop');
        statusIndicator.textContent = "READY";
        statusIndicator.classList.remove('running');
    } else {
        // START
        const inputId = inputSelect.value;
        const outputId = outputSelect.value;

        if (!inputId || !outputId) {
            showToast("Please select devices first.", 'error');
            return;
        }

        const res = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input_id: inputId,
                output_id: outputId,
                sound: selectedSound,
                volume: volumeSlider.value
            })
        });

        const data = await res.json();
        if (data.status === 'started' || data.status === 'already_running') {
            isRunning = true;
            toggleBtn.textContent = "Stop Routing";
            toggleBtn.classList.add('stop');
            statusIndicator.textContent = "RUNNING";
            statusIndicator.classList.add('running');
            showToast("Routing started successfully.", 'success');
        } else {
            showToast("Error: " + data.message, 'error');
        }
    }
});

function sendConfigUpdate() {
    const inputId = inputSelect.value;
    const outputId = outputSelect.value;

    fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input_id: inputId,
            output_id: outputId,
            sound: selectedSound,
            volume: volumeSlider.value
        })
    });
}

async function togglePreview(sound, button) {
    if (previewingSound === sound) {
        await stopPreviewUI();
        return;
    }
    await stopPreviewUI();
    // Always use null for output_id to force default device (headphones) for preview
    // This ensures the user hears the preview, not the virtual cable
    const res = await fetch('/api/preview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sound, output_id: null })
    });
    if (res.ok) {
        previewingSound = sound;
        button.classList.add('playing');
        button.textContent = '■';
    }
}

async function stopPreviewUI() {
    if (!previewingSound) return;
    await fetch('/api/preview/stop', { method: 'POST' });
    previewingSound = null;
    document.querySelectorAll('.sound-preview').forEach(btn => {
        btn.classList.remove('playing');
        btn.textContent = '\u25B6';
    });
}

function startMeterPolling() {
    if (meterInterval) return;
    meterInterval = setInterval(updateMeters, 200);
}

async function updateMeters() {
    try {
        const res = await fetch('/api/meters');
        const data = await res.json();
        setMeter(inputMeterFill, inputMeterValue, data.input || 0);
        setMeter(outputMeterFill, outputMeterValue, data.output || 0);
        addWaveSample(((data.input || 0) + (data.output || 0)) / 2);
    } catch (err) {
        // ignore
    }
}

async function checkUpdate() {
    const btn = document.querySelector('.update-btn');

    // If button is already in "Download" state
    if (btn.dataset.url) {
        showToast('Opening download page...', 'info');
        await fetch('/api/open_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: btn.dataset.url })
        });
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Checking...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/check_update');
        const data = await res.json();

        if (data.update_available) {
            showToast(`Update Available: ${data.latest}`, 'success');
            btn.textContent = `Download V${data.latest}`;
            btn.dataset.url = data.download_url;
            btn.classList.add('update-available'); // Add class for styling if needed
            btn.disabled = false; // Re-enable to allow click
        } else {
            showToast(data.message, 'info');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        showToast('Check failed', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Init Version
fetch('/api/version')
    .then(r => r.json())
    .then(d => {
        document.getElementById('version-display').textContent = `V ${d.version}`;
    });

setInterval(updateMeters, 100);

function setMeter(fillEl, valueEl, level) {
    const pct = Math.min(100, Math.round(level * 120));
    fillEl.style.width = pct + '%';
    valueEl.textContent = pct + '%';
}

let waveTime = 0;
let currentAmplitude = 0;
let targetAmplitude = 0;

function initWaveCanvas() {
    if (!waveCanvas || !waveCtx) return;
    const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        waveCanvas.width = waveCanvas.clientWidth * ratio;
        waveCanvas.height = waveCanvas.clientHeight * ratio;
        waveCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
        drawWave();
        waveAnimationId = requestAnimationFrame(render);
    };
    render();
}

function addWaveSample(level) {
    // Level is 0.0 to 1.0 (roughly)
    // We want to smooth it a bit
    targetAmplitude = Math.min(1.5, level * 2.5);
}

function drawWave() {
    if (!waveCtx) return;
    const width = waveCanvas.clientWidth;
    const height = waveCanvas.clientHeight;
    waveCtx.clearRect(0, 0, width, height);

    // Smoothly interpolate amplitude
    currentAmplitude += (targetAmplitude - currentAmplitude) * 0.1;

    // Base amplitude for idle state (so it's not completely flat)
    const baseAmp = 0.05;
    const activeAmp = currentAmplitude;
    const totalAmp = baseAmp + activeAmp;

    waveTime += 0.05;

    // Draw multiple waves
    // Layer 1: Background - Slow, deep
    drawSineWave(width, height, waveTime * 0.5, totalAmp * 0.8, 0, 'rgba(41, 151, 255, 0.2)');

    // Layer 2: Mid - Medium speed
    drawSineWave(width, height, waveTime * 0.8, totalAmp * 0.9, 2, 'rgba(123, 97, 255, 0.3)');

    // Layer 3: Front - Fast, bright
    drawSineWave(width, height, waveTime * 1.2, totalAmp, 4, 'rgba(41, 151, 255, 0.6)');
}

function drawSineWave(width, height, time, amplitude, phaseOffset, color) {
    waveCtx.beginPath();
    waveCtx.moveTo(0, height / 2);

    const frequency = 0.02; // Controls wavelength

    for (let x = 0; x <= width; x += 2) {
        // y = A * sin(B * (x + C)) + D
        // We modulate amplitude slightly along the x axis for more organic feel
        const y = height / 2 +
            Math.sin(x * frequency + time + phaseOffset) * (height * 0.4 * amplitude);
        waveCtx.lineTo(x, y);
    }

    // Fill the bottom
    waveCtx.lineTo(width, height);
    waveCtx.lineTo(0, height);
    waveCtx.closePath();
    waveCtx.fillStyle = color;
    waveCtx.fill();
}
