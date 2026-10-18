let audioData = {
    host_apis: [],
    devices: [],
    sounds: [],
    soundx_info: {},
    app_states: [],
    available_apps: []
};

let activeApps = []; // [ { pid, name, volume, muted, level } ]
let availableAppsList = [];
let selectedSound = null;
let isRunning = false;
let isMicMuted = false;
let isMonitoring = false;
let previewingSound = null;
let meterInterval = null;
let waveAnimationId = null;

// DOM Elements
const driverSelect = document.getElementById('driver-select');
const inputSelect = document.getElementById('input-select');
const outputSelect = document.getElementById('output-select');
const monitorSelect = document.getElementById('monitor-device-select');
const monitorCheckbox = document.getElementById('monitor-toggle-checkbox');
const monitorSlider = document.getElementById('monitor-volume-slider');
const monitorVolDisplay = document.getElementById('monitor-vol-display');
const micSlider = document.getElementById('mic-volume-slider');
const micVolDisplay = document.getElementById('mic-vol-display');
const micMuteBtn = document.getElementById('mic-mute-btn');
const micMuteText = document.getElementById('mic-mute-text');

const soundGrid = document.getElementById('sound-grid');
const volumeSlider = document.getElementById('volume-slider');
const volDisplay = document.getElementById('vol-display');
const toggleBtn = document.getElementById('toggle-btn');
const toggleBtnText = document.getElementById('toggle-btn-text');
const statusIndicator = document.getElementById('status-indicator');
const header = document.querySelector('header');

const presetSelect = document.getElementById('preset-select');
const presetNameInput = document.getElementById('preset-name');
const loadPresetBtn = document.getElementById('load-preset');
const savePresetBtn = document.getElementById('save-preset');

const inputMeterFill = document.getElementById('input-meter-fill');
const inputMeterValue = document.getElementById('input-meter-value');
const appsMeterFill = document.getElementById('apps-meter-fill');
const appsMeterValue = document.getElementById('apps-meter-value');
const outputMeterFill = document.getElementById('output-meter-fill');
const outputMeterValue = document.getElementById('output-meter-value');

const waveCanvas = document.getElementById('wave-canvas');
const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;

const appRackGrid = document.getElementById('app-rack-grid');
const appsEmptyState = document.getElementById('apps-empty-state');
const appsCountBadge = document.getElementById('apps-count-badge');
const soundxStatusPill = document.getElementById('soundx-status-pill');
const soundxBannerText = document.getElementById('soundx-banner-text');

const appModalOverlay = document.getElementById('app-modal-overlay');
const appSearchInput = document.getElementById('app-search-input');
const modalAppList = document.getElementById('modal-app-list');
const openAppModalBtn = document.getElementById('open-app-modal-btn');
const refreshAppsBtn = document.getElementById('refresh-apps-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initWindowControls();
    initWaveCanvas();

    try {
        const res = await fetch('/api/init');
        const data = await res.json();
        audioData = data;
        audioData.sounds = data.sounds || [];
        activeApps = data.app_states || [];
        availableAppsList = data.available_apps || [];

        populateDrivers();
        populateSounds(audioData.sounds);
        renderAppRack();
        updateSoundXStatus(data.soundx_info);

        await refreshPresets();
        const cfg = data.config || {};

        // Migrate legacy soundx names in localStorage
        const oldIn = localStorage.getItem('soundx_input_name');
        if (oldIn && oldIn.toLowerCase().includes('soundx router')) {
            localStorage.setItem('soundx_input_name', 'CABLE Output (VB-Audio Virtual Cable)');
        }
        const oldOut = localStorage.getItem('soundx_output_name');
        if (oldOut && oldOut.toLowerCase().includes('soundx router')) {
            localStorage.setItem('soundx_output_name', 'CABLE Input (VB-Audio Virtual Cable)');
        }

        // Find saved driver or pick default (DirectSound / MME)
        let activeDriverIndex = -1;
        if (cfg.driver_name) {
            activeDriverIndex = data.host_apis.findIndex(api => api === cfg.driver_name);
        }
        if (activeDriverIndex === -1 && typeof cfg.driver_index === 'number' && cfg.driver_index < data.host_apis.length) {
            activeDriverIndex = cfg.driver_index;
        }
        if (activeDriverIndex === -1) {
            const directSoundIndex = data.host_apis.findIndex(api => api.includes("DirectSound"));
            const mmeIndex = data.host_apis.findIndex(api => api.includes("MME"));
            activeDriverIndex = directSoundIndex !== -1 ? directSoundIndex : (mmeIndex !== -1 ? mmeIndex : 0);
        }

        if (activeDriverIndex !== -1 && driverSelect) {
            driverSelect.value = activeDriverIndex;
            updateDevices(activeDriverIndex);
        }

        // Apply saved controls
        if (typeof cfg.monitor_enabled === 'boolean' && monitorCheckbox) {
            monitorCheckbox.checked = cfg.monitor_enabled;
            isMonitoring = cfg.monitor_enabled;
        }
        if (typeof cfg.monitor_volume === 'number' && monitorSlider) {
            monitorSlider.value = cfg.monitor_volume;
            if (monitorVolDisplay) monitorVolDisplay.textContent = `${cfg.monitor_volume}%`;
        }
        if (typeof cfg.mic_volume === 'number' && micSlider) {
            micSlider.value = cfg.mic_volume;
            if (micVolDisplay) micVolDisplay.textContent = `${cfg.mic_volume}%`;
        }
        if (typeof cfg.volume === 'number' && volumeSlider) {
            volumeSlider.value = cfg.volume;
            if (volDisplay) volDisplay.textContent = `${cfg.volume}%`;
        }
        if (typeof cfg.mic_muted === 'boolean' && micMuteBtn) {
            isMicMuted = cfg.mic_muted;
            if (isMicMuted) {
                micMuteBtn.classList.add('active');
                micMuteBtn.textContent = 'Unmute';
                if (micMuteText) {
                    micMuteText.textContent = 'Muted';
                    micMuteText.style.color = 'var(--danger-color)';
                }
            }
        }

        if (typeof data.is_running === 'boolean') {
            setRunningState(data.is_running);
        }

        startMeterPolling();
    } catch (e) {
        console.error("Initialization error:", e);
    }
});

// --- Tab Switching & Outline Prevention ---
function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.blur) tab.blur();
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const activeContent = document.getElementById(`tab-content-${target}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
            updateRoutingGuide();
        });
    });
}

// Global removal of focus outlines on buttons and tabs
document.addEventListener('mouseup', () => {
    setTimeout(() => {
        if (document.activeElement && 
            document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    }, 10);
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .nav-tab, .action-btn, .app-icon-btn, .win-btn, .mute-btn-small');
    if (btn && btn.blur) {
        btn.blur();
    }
});

// --- SoundX Device Helper ---
function updateSoundXStatus(info) {
    if (!info) return;
    const scan = info.scan || {};
    const hasVirtual = scan.has_virtual_devices !== undefined ? scan.has_virtual_devices : info.registered;
    
    if (soundxStatusPill) {
        soundxStatusPill.textContent = hasVirtual ? "VB-Cable Ready" : "Driver Needed";
        soundxStatusPill.style.background = hasVirtual ? "rgba(48, 209, 88, 0.2)" : "rgba(255, 159, 10, 0.2)";
        soundxStatusPill.style.color = hasVirtual ? "#30d158" : "#ff9f0a";
    }
    
    const missingVBCableCard = document.getElementById('missing-vbcable-card');
    if (missingVBCableCard) {
        missingVBCableCard.style.display = hasVirtual ? "none" : "flex";
    }

    if (soundxBannerText) {
        soundxBannerText.innerHTML = hasVirtual 
            ? "<strong>Sanal Ses Köprüsü Aktif:</strong> Discord veya Ses Kaydedici'de Mikrofon olarak <strong>'CABLE Output (VB-Audio Virtual Cable)'</strong> seçin."
            : "<strong>Sanal Ses Sürücüsü Gerekli:</strong> Diğer uygulamalara ses aktarabilmek için ücretsiz VB-Cable kurun.";
    }
}

async function registerSoundXDevice() {
    showToast("VB-Cable aygıtları kontrol ediliyor...", "info");
    try {
        const res = await fetch('/api/soundx/register', { method: 'POST' });
        const data = await res.json();
        showToast("VB-Cable aygıtları hazır (CABLE Output / CABLE Input)!", "success");
        
        // Refresh device list
        const initRes = await fetch('/api/init');
        const initData = await initRes.json();
        audioData.devices = initData.devices;
        updateSoundXStatus(initData.soundx_info);
        if (driverSelect && driverSelect.value) {
            updateDevices(parseInt(driverSelect.value));
        }
    } catch (e) {
        showToast("Bilgi: " + e, "info");
    }
}

// --- Device Population ---
function populateDrivers() {
    if (!driverSelect) return;
    driverSelect.innerHTML = '';
    audioData.host_apis.forEach((api, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = api;
        driverSelect.appendChild(opt);
    });

    driverSelect.addEventListener('change', (e) => {
        updateDevices(parseInt(e.target.value));
    });
}

let saveConfigTimeout = null;
function saveCurrentConfigDebounced() {
    clearTimeout(saveConfigTimeout);
    saveConfigTimeout = setTimeout(() => {
        const inOpt = inputSelect && inputSelect.selectedIndex >= 0 ? inputSelect.options[inputSelect.selectedIndex] : null;
        const outOpt = outputSelect && outputSelect.selectedIndex >= 0 ? outputSelect.options[outputSelect.selectedIndex] : null;
        const monOpt = monitorSelect && monitorSelect.selectedIndex >= 0 ? monitorSelect.options[monitorSelect.selectedIndex] : null;
        const drvOpt = driverSelect && driverSelect.selectedIndex >= 0 ? driverSelect.options[driverSelect.selectedIndex] : null;

        const payload = {
            driver_name: drvOpt ? drvOpt.textContent : null,
            driver_index: driverSelect ? parseInt(driverSelect.value) : 0,
            input_name: inOpt ? inOpt.textContent : null,
            input_id: inputSelect ? inputSelect.value : null,
            output_name: outOpt ? outOpt.textContent : null,
            output_id: outputSelect ? outputSelect.value : null,
            monitor_name: monOpt ? monOpt.textContent : null,
            monitor_id: monitorSelect ? monitorSelect.value : null,
            monitor_enabled: monitorCheckbox ? monitorCheckbox.checked : false,
            monitor_volume: monitorSlider ? parseFloat(monitorSlider.value) : 80,
            mic_volume: micSlider ? parseFloat(micSlider.value) : 100,
            mic_muted: isMicMuted,
            volume: volumeSlider ? parseFloat(volumeSlider.value) : 20
        };

        fetch('/api/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Failed to save config:", err));
    }, 350);
}

function isVBCableDevice(name, isCapture) {
    if (!name) return false;
    const n = name.toLowerCase();
    if (isCapture) {
        return n.includes("cable output") || n.includes("soundx router out") || (n.includes("cable") && !n.includes("cable input"));
    } else {
        return n.includes("cable input") || n.includes("soundx router in") || (n.includes("cable") && !n.includes("cable output"));
    }
}

function updateDevices(apiIndex) {
    if (!audioData.host_apis || apiIndex >= audioData.host_apis.length) return;
    const apiName = audioData.host_apis[apiIndex];
    const inputs = audioData.devices.filter(d => d.api === apiName && d.inputs > 0);
    // Include both render outputs AND microphones (Sonar Microphone, CABLE Output, etc.) in Master Output list
    const outputs = audioData.devices.filter(d => d.api === apiName && (d.outputs > 0 || d.inputs > 0));
    // Monitoring is strictly for playback devices (real headphones/speakers)
    const monitorOutputs = audioData.devices.filter(d => d.api === apiName && d.outputs > 0);

    const cfg = audioData.config || {};
    const savedInputName = localStorage.getItem('soundx_input_name') || cfg.input_name;
    const savedOutputName = localStorage.getItem('soundx_output_name') || cfg.output_name;
    const savedMonitorName = localStorage.getItem('soundx_monitor_name') || cfg.monitor_name;

    const savedInputId = localStorage.getItem('soundx_input_id') || cfg.input_id;
    const savedOutputId = localStorage.getItem('soundx_output_id') || cfg.output_id;

    // Helper: does dev match saved input preference?
    function matchesSavedInput(dev) {
        if (savedInputName) {
            if (dev.name === savedInputName) return true;
            if (isVBCableDevice(savedInputName, true) && isVBCableDevice(dev.name, true)) return true;
        }
        if (savedInputId !== null && savedInputId !== undefined && String(dev.id) === String(savedInputId)) return true;
        return false;
    }

    // Helper: does dev match saved output preference?
    function matchesSavedOutput(dev) {
        if (savedOutputName) {
            if (dev.name === savedOutputName) return true;
            if (savedOutputName.toLowerCase().includes("sonar") && dev.name.toLowerCase().includes("sonar - microphone")) return true;
            if (isVBCableDevice(savedOutputName, false) && isVBCableDevice(dev.name, false)) return true;
        }
        if (savedOutputId !== null && savedOutputId !== undefined && String(dev.id) === String(savedOutputId)) return true;
        return false;
    }

    // 1. Populate Inputs
    if (inputSelect) {
        inputSelect.innerHTML = '';
        const noMicOpt = document.createElement('option');
        noMicOpt.value = "-1";
        noMicOpt.textContent = "None (App Mixing Only)";
        inputSelect.appendChild(noMicOpt);

        let inputSelected = false;
        inputs.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev.id;
            opt.textContent = dev.name;
            opt.dataset.devname = dev.name;

            if (matchesSavedInput(dev)) {
                opt.selected = true;
                inputSelected = true;
            }
            inputSelect.appendChild(opt);
        });

        // Default selection if no previous match: prefer CABLE Output or real microphone
        if (!inputSelected && inputs.length > 0) {
            let vbCandidate = inputs.find(d => isVBCableDevice(d.name, true));
            let realMic = inputs.find(d => {
                const n = d.name.toLowerCase();
                return !n.includes("cable") && !n.includes("virtual") && !n.includes("sonar");
            });
            let candidate = vbCandidate || realMic || inputs[0];
            if (candidate) {
                inputSelect.value = candidate.id;
            } else {
                inputSelect.selectedIndex = 0;
            }
        }
    }

    // 2. Populate Master Outputs (Includes Microphones like SteelSeries Sonar Microphone)
    if (outputSelect) {
        outputSelect.innerHTML = '';
        let outputSelected = false;
        outputs.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev.id;
            opt.textContent = dev.name;
            opt.dataset.devname = dev.name;

            if (matchesSavedOutput(dev)) {
                opt.selected = true;
                outputSelected = true;
            }
            outputSelect.appendChild(opt);
        });

        if (!outputSelected && outputs.length > 0) {
            // Prioritize: SteelSeries Sonar Microphone or CABLE Input
            let sonarMic = outputs.find(d => d.name.toLowerCase().includes("sonar - microphone"));
            let cableIn = outputs.find(d => isVBCableDevice(d.name, false));
            let bestOut = sonarMic || cableIn || outputs.find(d => d.outputs > 0) || outputs[0];
            if (bestOut) {
                outputSelect.value = bestOut.id;
            } else {
                outputSelect.selectedIndex = 0;
            }
        }
    }

    // 3. Populate Monitor Device (Real Headphones)
    if (monitorSelect) {
        monitorSelect.innerHTML = '';
        let monitorSelected = false;
        monitorOutputs.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev.id;
            opt.textContent = dev.name;
            opt.dataset.devname = dev.name;

            if (savedMonitorName && dev.name === savedMonitorName) {
                opt.selected = true;
                monitorSelected = true;
            }
            monitorSelect.appendChild(opt);
        });

        if (!monitorSelected && monitorOutputs.length > 0) {
            // Auto pick physical headphones/speakers (NOT virtual, NOT sonar)
            let realHeadphones = monitorOutputs.find(d => {
                const n = d.name.toLowerCase();
                return !n.includes("soundx") && !n.includes("cable") && !n.includes("virtual") && !n.includes("sonar");
            });
            if (realHeadphones) {
                monitorSelect.value = realHeadphones.id;
            }
        }
    }

    updateRoutingGuide();
}

function updateRoutingGuide() {
    if (!inputSelect || !outputSelect) return;
    const selectedInputOpt = inputSelect.options[inputSelect.selectedIndex];
    const selectedOutputOpt = outputSelect.options[outputSelect.selectedIndex];
    const selectedMonitorOpt = monitorSelect ? monitorSelect.options[monitorSelect.selectedIndex] : null;

    const inName = selectedInputOpt ? selectedInputOpt.textContent : "";
    const outName = selectedOutputOpt ? selectedOutputOpt.textContent : "";
    const monName = selectedMonitorOpt ? selectedMonitorOpt.textContent : "";

    // Save choices to localStorage so they persist across reboots and driver switches
    if (inName && inName !== "Select Driver First") {
        localStorage.setItem('soundx_input_name', inName);
        localStorage.setItem('soundx_input_id', inputSelect.value);
    }
    if (outName && outName !== "Select Driver First") {
        localStorage.setItem('soundx_output_name', outName);
        localStorage.setItem('soundx_output_id', outputSelect.value);
    }
    if (monName && monName !== "Select Driver First") {
        localStorage.setItem('soundx_monitor_name', monName);
        if (monitorSelect) localStorage.setItem('soundx_monitor_id', monitorSelect.value);
    }

    // Calculate corresponding Discord / Windows Ses Kaydedici Microphone name
    let targetDiscordMic = "CABLE Output (VB-Audio Virtual Cable)";
    const outLow = outName.toLowerCase();
    if (outLow.includes("cable input") || outLow.includes("soundx router") || outLow.includes("vb-cable")) {
        targetDiscordMic = "CABLE Output (VB-Audio Virtual Cable)";
    } else if (outLow.includes("sonar")) {
        targetDiscordMic = "SteelSeries Sonar - Microphone";
    } else if (outName) {
        targetDiscordMic = outName;
    }

    // Update banner with active target microphone
    if (soundxBannerText) {
        soundxBannerText.innerHTML = `<strong>Sanal Ses Köprüsü Aktif:</strong> Discord veya Ses Kaydedici'de Mikrofon olarak <strong>'${targetDiscordMic}'</strong> seçin.`;
    }

    // Detect feedback loop hazard
    const inLow = inName.toLowerCase();
    const isLoop = (inLow.includes("cable output") && outLow.includes("cable input")) ||
                   (inLow.includes("soundx router out") && outLow.includes("soundx router in")) ||
                   (inLow.includes("vb-cable") && outLow.includes("vb-cable"));
    if (loopAlertBanner) {
        loopAlertBanner.style.display = isLoop ? "flex" : "none";
    }

    // Persist to server config.json
    saveCurrentConfigDebounced();
}

// Add event listeners for device changes
if (inputSelect) {
    inputSelect.addEventListener('change', () => {
        updateRoutingGuide();
    });
}
if (outputSelect) {
    outputSelect.addEventListener('change', () => {
        updateRoutingGuide();
    });
}
if (monitorSelect) {
    monitorSelect.addEventListener('change', () => {
        updateRoutingGuide();
    });
}

function copyDiscordMicName() {
    let textToCopy = "SteelSeries Sonar - Microphone";
    const selectedOutputOpt = outputSelect && outputSelect.selectedIndex >= 0 ? outputSelect.options[outputSelect.selectedIndex] : null;
    if (selectedOutputOpt && selectedOutputOpt.textContent) {
        const outName = selectedOutputOpt.textContent;
        if (outName.toLowerCase().includes("sonar")) {
            textToCopy = "SteelSeries Sonar - Microphone";
        } else if (outName.toLowerCase().includes("cable")) {
            textToCopy = "CABLE Output (VB-Audio Virtual Cable)";
        } else {
            textToCopy = outName;
        }
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Kopyalandı! Discord ve Ses Kaydedici'de Giriş Aygıtı (Mikrofon) olarak seçin: " + textToCopy, "success");
    }).catch(() => {
        showToast("Seçilecek aygıt: " + textToCopy, "info");
    });
}

async function playTestChime() {
    showToast("Discord / OBS çıkışına test sesi gönderiliyor...", "info");
    try {
        const outId = outputSelect ? outputSelect.value : null;
        const res = await fetch('/api/routing/test_tone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ output_id: outId })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            showToast("🔊 Test sesi gönderildi! Discord veya OBS mikrofon seviyenizi kontrol edin.", "success");
        } else {
            showToast("Test sesi hatası: " + (data.message || "Bilinmiyor"), "error");
        }
    } catch (e) {
        showToast("Hata: " + e, "error");
    }
}

async function openSoundControlPanel() {
    try {
        await fetch('/api/open_sound_control_panel', { method: 'POST' });
        showToast("Windows Ses Denetim Masası açıldı.", "info");
    } catch (e) {
        console.error(e);
    }
}

function openVBCableSite() {
    fetch('/api/open_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: "https://vb-audio.com/Cable/" })
    });
}


// --- Application Mixer Rack ---
function getAppEmoji(name) {
    const n = name.toLowerCase();
    if (n.includes('spotify') || n.includes('music') || n.includes('itunes')) return '🎵';
    if (n.includes('chrome') || n.includes('brave') || n.includes('firefox') || n.includes('edge') || n.includes('opera')) return '🌐';
    if (n.includes('discord') || n.includes('teams') || n.includes('telegram') || n.includes('skype')) return '💬';
    if (n.includes('game') || n.includes('steam') || n.includes('epic') || n.includes('valorant') || n.includes('cs2') || n.includes('gta')) return '🎮';
    if (n.includes('vlc') || n.includes('media') || n.includes('player') || n.includes('mpv')) return '🎬';
    return '🔊';
}

function renderAppRack() {
    if (!appRackGrid) return;
    appsCountBadge.textContent = activeApps.length;

    if (activeApps.length === 0) {
        appsEmptyState.style.display = 'flex';
        appRackGrid.style.display = 'none';
        appRackGrid.innerHTML = '';
        return;
    }

    appsEmptyState.style.display = 'none';
    appRackGrid.style.display = 'grid';
    appRackGrid.innerHTML = '';

    activeApps.forEach(app => {
        const card = document.createElement('div');
        card.className = `app-card ${app.muted ? 'muted' : ''}`;
        card.id = `app-card-${app.pid}`;

        const emoji = getAppEmoji(app.name);
        const volumePct = Math.round((app.volume || 1.0) * 100);

        card.innerHTML = `
            <div class="app-card-top">
                <div class="app-card-left">
                    <div class="app-avatar">${emoji}</div>
                    <div class="app-meta">
                        <div class="app-name" title="${app.name}">${app.name}</div>
                        <div class="app-pid">
                            <span class="app-live-indicator"></span>
                            <span>PID: ${app.pid}</span>
                        </div>
                    </div>
                </div>
                <div class="app-card-actions">
                    <button class="app-icon-btn mute-btn ${app.muted ? 'active' : ''}" 
                            title="${app.muted ? 'Unmute' : 'Mute'}" 
                            onclick="toggleAppMute(${app.pid})">
                        ${app.muted ? '🔇' : '🔊'}
                    </button>
                    <button class="app-icon-btn remove-btn" 
                            title="Remove from Mix" 
                            onclick="removeApp(${app.pid})">
                        ✕
                    </button>
                </div>
            </div>

            <div class="app-meter-container">
                <div class="app-meter-bar">
                    <div class="app-meter-fill" id="app-meter-${app.pid}" style="width: 0%"></div>
                </div>
            </div>

            <div class="app-slider-row">
                <input type="range" min="0" max="150" value="${volumePct}" 
                       id="app-slider-${app.pid}"
                       oninput="onAppVolumeChange(${app.pid}, this.value)">
                <span class="vol-badge" id="app-vol-${app.pid}">${volumePct}%</span>
            </div>
        `;
        appRackGrid.appendChild(card);
    });
}

function onAppVolumeChange(pid, val) {
    const badge = document.getElementById(`app-vol-${pid}`);
    if (badge) badge.textContent = val + '%';
    const num = parseFloat(val) / 100.0;
    fetch('/api/apps/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, volume: num })
    });
    const found = activeApps.find(a => a.pid === pid);
    if (found) found.volume = num;
}

async function toggleAppMute(pid) {
    const found = activeApps.find(a => a.pid === pid);
    if (!found) return;
    const newMuted = !found.muted;
    found.muted = newMuted;

    await fetch('/api/apps/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, muted: newMuted })
    });
    renderAppRack();
}

async function removeApp(pid) {
    await fetch('/api/apps/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
    });
    activeApps = activeApps.filter(a => a.pid !== pid);
    renderAppRack();
    showToast("Application removed from mix", "info");
}

// --- Modal Logic ---
if (openAppModalBtn) {
    openAppModalBtn.addEventListener('click', openAppModal);
}
if (refreshAppsBtn) {
    refreshAppsBtn.addEventListener('click', async () => {
        showToast("Refreshing running applications...", "info");
        const res = await fetch('/api/apps/available');
        availableAppsList = await res.json();
        showToast(`Found ${availableAppsList.length} applications`, "success");
    });
}

let currentAppFilter = 'playing'; // Default is 'playing' as requested

function setAppFilter(filterType) {
    currentAppFilter = filterType;
    const btnPlaying = document.getElementById('filter-btn-playing');
    const btnAll = document.getElementById('filter-btn-all');
    if (btnPlaying && btnAll) {
        if (filterType === 'playing') {
            btnPlaying.classList.add('active');
            btnAll.classList.remove('active');
        } else {
            btnAll.classList.add('active');
            btnPlaying.classList.remove('active');
        }
    }
    filterAppList();
}

function updateModalFilterBadges() {
    const playingCountBadge = document.getElementById('playing-count-badge');
    const allCountBadge = document.getElementById('all-count-badge');
    if (!availableAppsList) return;
    
    const playingCount = availableAppsList.filter(a => a.has_audio).length;
    const allCount = availableAppsList.length;
    
    if (playingCountBadge) playingCountBadge.textContent = playingCount;
    if (allCountBadge) allCountBadge.textContent = allCount;
}

async function openAppModal() {
    if (!appModalOverlay) return;
    appModalOverlay.classList.add('active');
    appSearchInput.value = '';
    currentAppFilter = 'playing'; // Default is playing
    const btnPlaying = document.getElementById('filter-btn-playing');
    const btnAll = document.getElementById('filter-btn-all');
    if (btnPlaying && btnAll) {
        btnPlaying.classList.add('active');
        btnAll.classList.remove('active');
    }
    modalAppList.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-secondary);">Aktif ses oturumları taranıyor...</div>';

    try {
        const res = await fetch('/api/apps/available');
        availableAppsList = await res.json();
        updateModalFilterBadges();
        filterAppList();
    } catch (e) {
        modalAppList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--danger-color);">Error listing applications: ${e}</div>`;
    }
}

function closeAppModal() {
    if (appModalOverlay) {
        appModalOverlay.classList.remove('active');
    }
}

function filterAppList() {
    updateModalFilterBadges();
    const q = appSearchInput.value.toLowerCase().trim();
    
    let list = availableAppsList || [];
    if (currentAppFilter === 'playing') {
        list = list.filter(a => a.has_audio);
    }
    
    if (q) {
        list = list.filter(a => 
            a.name.toLowerCase().includes(q) || 
            (a.raw_name && a.raw_name.toLowerCase().includes(q)) || 
            String(a.pid).includes(q)
        );
    }
    renderModalAppList(list);
}

function renderModalAppList(apps) {
    if (!modalAppList) return;
    modalAppList.innerHTML = '';

    if (apps.length === 0) {
        if (currentAppFilter === 'playing') {
            modalAppList.innerHTML = `
                <div class="modal-empty-state">
                    <div class="empty-icon">🔇</div>
                    <h4>Şu an ses oynatan aktif uygulama bulunamadı</h4>
                    <p>Spotify, YouTube veya oyun açıp ses çaldığınızda burada otomatik listelenecektir.<br>Açık tüm pencereleri görmek için yukarıdan <strong>All</strong> sekmesine tıklayabilirsiniz.</p>
                </div>
            `;
        } else {
            modalAppList.innerHTML = `
                <div class="modal-empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>Aramanızla eşleşen uygulama bulunamadı</h4>
                    <p>Farklı bir kelime deneyin veya arama çubuğunu temizleyin.</p>
                </div>
            `;
        }
        return;
    }

    apps.forEach(app => {
        const isAdded = activeApps.some(a => a.pid === app.pid);
        const item = document.createElement('div');
        item.className = 'modal-app-item';

        const emoji = getAppEmoji(app.name);

        item.innerHTML = `
            <div class="modal-app-info">
                <div class="modal-app-icon">${emoji}</div>
                <div class="modal-app-text">
                    <div class="modal-app-title">${app.name}</div>
                    <div class="modal-app-sub">
                        <span>PID: ${app.pid}</span>
                        ${app.has_audio ? '<span class="audio-active-badge">● Playing Sound</span>' : ''}
                    </div>
                </div>
            </div>
            <button class="modal-add-btn ${isAdded ? 'added' : ''}" 
                    onclick="addAppFromModal(${app.pid}, '${escapeHtml(app.name)}', '${escapeHtml(app.raw_name || '')}', this)" 
                    ${isAdded ? 'disabled' : ''}>
                ${isAdded ? 'Added' : '＋ Add to Mix'}
            </button>
        `;
        modalAppList.appendChild(item);
    });
}

function escapeHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function addAppFromModal(pid, name, rawName, btn) {
    if (typeof rawName === 'object' && btn === undefined) {
        btn = rawName;
        rawName = '';
    }
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding...';
    }

    const res = await fetch('/api/apps/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, name, raw_name: rawName, volume: 1.0 })
    });
    const data = await res.json();
    if (data.status === 'ok') {
        activeApps = data.apps || [];
        renderAppRack();
        if (btn) {
            btn.textContent = 'Added';
            btn.classList.add('added');
        }
        showToast(`Added ${name} to mix!`, "success");
    } else {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '＋ Add to Mix';
        }
        showToast("Error adding app", "error");
    }
}

// --- Microphone Controls ---
if (micSlider) {
    micSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (micVolDisplay) micVolDisplay.textContent = val + '%';
        fetch('/api/mic/volume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: val })
        });
    });
}

function toggleMicMute() {
    isMicMuted = !isMicMuted;
    if (micMuteBtn) {
        micMuteBtn.classList.toggle('active', isMicMuted);
        micMuteBtn.textContent = isMicMuted ? 'Unmute' : 'Mute';
    }
    if (micMuteText) {
        micMuteText.textContent = isMicMuted ? 'Muted' : 'Active';
        micMuteText.style.color = isMicMuted ? 'var(--danger-color)' : 'var(--text-secondary)';
    }
    fetch('/api/mic/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted: isMicMuted })
    });
}

// --- Headphone Monitoring ---
if (monitorCheckbox) {
    monitorCheckbox.addEventListener('change', (e) => {
        isMonitoring = e.target.checked;
        sendMonitorUpdate();
    });
}
if (monitorSelect) {
    monitorSelect.addEventListener('change', sendMonitorUpdate);
}
if (monitorSlider) {
    monitorSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (monitorVolDisplay) monitorVolDisplay.textContent = val + '%';
        sendMonitorUpdate();
    });
}

function sendMonitorUpdate() {
    if (!monitorSelect || !monitorSlider || !monitorCheckbox) return;
    fetch('/api/monitor/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            enabled: monitorCheckbox.checked,
            device_id: monitorSelect.value,
            volume: monitorSlider.value
        })
    });
}

// --- Master Toggle (Start / Stop Routing) ---
function setRunningState(running) {
    isRunning = !!running;
    if (toggleBtn) {
        toggleBtn.classList.toggle('running', isRunning);
    }
    if (toggleBtnText) {
        toggleBtnText.textContent = isRunning ? "STOP ROUTING" : "START ROUTING";
    }
    if (statusIndicator) {
        statusIndicator.textContent = isRunning ? "LIVE STREAMING" : "READY";
        statusIndicator.classList.toggle('running', isRunning);
    }
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isRunning) {
            // STOP
            try {
                await fetch('/api/stop', { method: 'POST' });
                setRunningState(false);
                showToast("Routing stopped", "info");
            } catch (err) {
                showToast("Stop error: " + err, "error");
            }
        } else {
            // START
            const inputId = inputSelect ? inputSelect.value : null;
            const outputId = outputSelect ? outputSelect.value : null;

            if (!outputId || outputId === "Select Driver First" || outputId === "") {
                showToast("Please select an Output Device first.", "error");
                return;
            }

            const payload = {
                input_id: inputId,
                output_id: outputId,
                sound: selectedSound,
                volume: volumeSlider ? volumeSlider.value : 20,
                mic_volume: micSlider ? micSlider.value : 100,
                monitor_id: monitorSelect ? monitorSelect.value : null,
                monitor_enabled: monitorCheckbox ? monitorCheckbox.checked : false,
                monitor_volume: monitorSlider ? monitorSlider.value : 80
            };

            try {
                const res = await fetch('/api/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.status === 'started' || data.status === 'already_running') {
                    setRunningState(true);
                    showToast("SoundX Router is actively mixing and routing!", "success");
                } else {
                    setRunningState(false);
                    showToast("Start failed: " + (data.message || "Unknown error"), "error");
                }
            } catch (err) {
                showToast("Connection error: " + err, "error");
            }
        }
    });
}

// --- VU Meter Polling ---
function startMeterPolling() {
    if (meterInterval) clearInterval(meterInterval);
    meterInterval = setInterval(updateMeters, 80);
}

async function updateMeters() {
    try {
        const res = await fetch('/api/meters');
        const data = await res.json();

        // Sync routing status
        if (typeof data.is_running === 'boolean' && data.is_running !== isRunning) {
            setRunningState(data.is_running);
        }

        // Mic in
        const micLevel = data.mic || 0;
        setMeter(inputMeterFill, inputMeterValue, micLevel);

        // Apps Combined
        let maxAppLevel = 0;
        if (data.apps && typeof data.apps === 'object') {
            for (const [pid, lvl] of Object.entries(data.apps)) {
                if (lvl > maxAppLevel) maxAppLevel = lvl;
                const fillEl = document.getElementById(`app-meter-${pid}`);
                if (fillEl) {
                    const pct = Math.min(100, Math.round(lvl * 140));
                    fillEl.style.width = pct + '%';
                }
            }
        }
        setMeter(appsMeterFill, appsMeterValue, maxAppLevel);

        // Master Output
        const outLevel = data.output || 0;
        setMeter(outputMeterFill, outputMeterValue, outLevel);

        // Oscilloscope sample
        addWaveSample((micLevel + maxAppLevel + outLevel) / 3.0);
    } catch (err) {
        // quiet error
    }
}

function setMeter(fillEl, valueEl, level) {
    if (!fillEl || !valueEl) return;
    const pct = Math.min(100, Math.round(level * 130));
    fillEl.style.width = pct + '%';
    valueEl.textContent = pct + '%';
}

// --- Live Oscilloscope Canvas ---
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
    targetAmplitude = Math.min(1.5, level * 2.8);
}

function drawWave() {
    if (!waveCtx || !waveCanvas) return;
    const width = waveCanvas.clientWidth;
    const height = waveCanvas.clientHeight;
    waveCtx.clearRect(0, 0, width, height);

    currentAmplitude += (targetAmplitude - currentAmplitude) * 0.12;
    const baseAmp = 0.05;
    const totalAmp = baseAmp + currentAmplitude;
    waveTime += 0.06;

    drawSineWave(width, height, waveTime * 0.6, totalAmp * 0.7, 0, 'rgba(41, 151, 255, 0.25)');
    drawSineWave(width, height, waveTime * 0.9, totalAmp * 0.85, 2, 'rgba(175, 82, 222, 0.35)');
    drawSineWave(width, height, waveTime * 1.3, totalAmp, 4, 'rgba(48, 209, 88, 0.6)');
}

function drawSineWave(width, height, time, amplitude, phaseOffset, color) {
    waveCtx.beginPath();
    waveCtx.moveTo(0, height / 2);
    const frequency = 0.025;

    for (let x = 0; x <= width; x += 3) {
        const y = height / 2 + Math.sin(x * frequency + time + phaseOffset) * (height * 0.45 * amplitude);
        waveCtx.lineTo(x, y);
    }

    waveCtx.lineTo(width, height);
    waveCtx.lineTo(0, height);
    waveCtx.closePath();
    waveCtx.fillStyle = color;
    waveCtx.fill();
}

// --- Presets ---
async function refreshPresets() {
    if (!presetSelect) return;
    const res = await fetch('/api/presets');
    const presets = await res.json();
    presetSelect.innerHTML = `<option value="">Select Preset</option>`;
    presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        presetSelect.appendChild(opt);
    });
}

if (loadPresetBtn) {
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
            showToast(`Preset '${name}' loaded`, "success");
        }
    });
}

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', async () => {
        const name = presetNameInput.value.trim();
        if (!name) {
            showToast('Enter a preset name.', 'error');
            return;
        }
        const payload = {
            name,
            driver_index: driverSelect ? parseInt(driverSelect.value) : null,
            input_id: inputSelect ? inputSelect.value : null,
            output_id: outputSelect ? outputSelect.value : null,
            sound: selectedSound,
            volume: volumeSlider ? volumeSlider.value : 20,
            mic_volume: micSlider ? micSlider.value : 100,
            monitor_enabled: monitorCheckbox ? monitorCheckbox.checked : false,
            monitor_id: monitorSelect ? monitorSelect.value : null,
            monitor_volume: monitorSlider ? monitorSlider.value : 80,
            apps: activeApps.map(a => ({ pid: a.pid, name: a.name, volume: a.volume, muted: a.muted }))
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
            showToast(`Preset '${name}' saved!`, 'success');
        }
    });
}

function applyPreset(preset) {
    if (typeof preset.driver_index === 'number' && driverSelect) {
        driverSelect.value = preset.driver_index;
        updateDevices(preset.driver_index);
    }
    if (preset.input_id && inputSelect) inputSelect.value = preset.input_id;
    if (preset.output_id && outputSelect) outputSelect.value = preset.output_id;
    if (preset.monitor_id && monitorSelect) monitorSelect.value = preset.monitor_id;
    if (typeof preset.monitor_enabled === 'boolean' && monitorCheckbox) {
        monitorCheckbox.checked = preset.monitor_enabled;
    }
    if (preset.monitor_volume && monitorSlider) {
        monitorSlider.value = preset.monitor_volume;
        if (monitorVolDisplay) monitorVolDisplay.textContent = preset.monitor_volume + '%';
    }
    if (preset.mic_volume && micSlider) {
        micSlider.value = preset.mic_volume;
        if (micVolDisplay) micVolDisplay.textContent = preset.mic_volume + '%';
    }
    selectedSound = preset.sound || null;
    populateSounds(audioData.sounds);
    if (preset.volume && volumeSlider) {
        volumeSlider.value = preset.volume;
        if (volDisplay) volDisplay.textContent = preset.volume + '%';
    }
    if (Array.isArray(preset.apps)) {
        activeApps = preset.apps;
        renderAppRack();
    }
}

// --- Soundboard Logic ---
function truncateName(name, max = 14) {
    return name.length > max ? name.slice(0, max - 3) + '...' : name;
}

function populateSounds(files) {
    if (!soundGrid) return;
    soundGrid.innerHTML = '';

    const noneDiv = document.createElement('div');
    noneDiv.className = 'sound-item ' + (selectedSound === null ? 'active' : '');
    noneDiv.innerHTML = '<div class="sound-name" title="None">None</div>';
    noneDiv.onclick = () => selectSound(noneDiv, null);
    soundGrid.appendChild(noneDiv);

    files.forEach(file => {
        const short = truncateName(file);
        const div = document.createElement('div');
        div.className = 'sound-item ' + (selectedSound === file ? 'active' : '');

        const previewBtn = document.createElement('button');
        previewBtn.className = 'sound-preview';
        previewBtn.type = 'button';
        previewBtn.textContent = previewingSound === file ? '■' : '▶';
        if (previewingSound === file) previewBtn.classList.add('playing');
        previewBtn.onclick = (e) => {
            e.stopPropagation();
            togglePreview(file, previewBtn);
        };

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

function selectSound(el, filename) {
    stopPreviewUI();
    document.querySelectorAll('.sound-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    selectedSound = filename;
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

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (volDisplay) volDisplay.textContent = val + '%';
        fetch('/api/update_volume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: val })
        });
        saveCurrentConfigDebounced();
    });
}

// --- Keybinding Logic ---
let keyBindings = {};
let isBinding = false;
let bindingTarget = null;

async function refreshBindings() {
    const res = await fetch('/api/bindings');
    keyBindings = await res.json();
    populateSounds(audioData.sounds);
}

function getKeyForSound(filename) {
    return Object.keys(keyBindings).find(key => keyBindings[key] === filename);
}

function startBinding(filename, btn) {
    if (isBinding) return;
    isBinding = true;
    bindingTarget = { file: filename, btn: btn };
    btn.textContent = '...';
    btn.classList.add('binding');

    const handleKey = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('keydown', handleKey);

        const key = e.key.toLowerCase();
        if (key !== 'escape') {
            await fetch('/api/bindings/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, sound: bindingTarget.file })
            });
        }
        isBinding = false;
        bindingTarget = null;
        await refreshBindings();
    };

    document.addEventListener('keydown', handleKey);
}

// --- Sound Preview ---
async function togglePreview(sound, button) {
    if (previewingSound === sound) {
        await stopPreviewUI();
        return;
    }
    await stopPreviewUI();
    const res = await fetch('/api/preview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sound, output_id: monitorSelect ? monitorSelect.value : null })
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
        btn.textContent = '▶';
    });
}

// --- Window Controls & Dragging ---
function closeApp() {
    fetch('/api/window/close', { method: 'POST' });
}

function minimizeApp() {
    fetch('/api/window/minimize', { method: 'POST' });
}

function initWindowControls() {
    let isDragging = false;
    let startX, startY;
    let lastMoveTime = 0;

    if (!header) return;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.nav-tab')) return;
        isDragging = true;
        startX = e.screenX;
        startY = e.screenY;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const now = Date.now();
        if (now - lastMoveTime < 10) return;
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
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease-in forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3200);
}
