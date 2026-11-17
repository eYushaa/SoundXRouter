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
const loopAlertBanner = document.getElementById('routing-loop-alert');

const appModalOverlay = document.getElementById('app-modal-overlay');
const appSearchInput = document.getElementById('app-search-input');
const modalAppList = document.getElementById('modal-app-list');
const openAppModalBtn = document.getElementById('open-app-modal-btn');
const refreshAppsBtn = document.getElementById('refresh-apps-btn');

// --- Theme Manager ---
const THEMES = [
    { id: 'glass', name: 'Aurora Glass', sw: ['#5e17eb', '#2997ff', '#f72585'] },
    { id: 'midnight', name: 'Gece Mavisi', sw: ['#1d3a8a', '#5b8cff', '#8b7bff'] },
    { id: 'light', name: 'Beyaz', sw: ['#f6f8fd', '#2f6bff', '#7c4dff'] },
    { id: 'amoled', name: 'Saf Siyah', sw: ['#000000', '#f2f2f5', '#9a9aa3'] },
    { id: 'cyberpunk', name: 'Cyberpunk', sw: ['#5a00ff', '#00f0ff', '#ff2d95'] },
    { id: 'forest', name: 'Orman', sw: ['#0f6b4c', '#34d399', '#2dd4bf'] },
    { id: 'sunset', name: 'Gün Batımı', sw: ['#be185d', '#fb923c', '#f472b6'] },
    { id: 'nord', name: 'Nord', sw: ['#3b5878', '#88c0d0', '#b48ead'] }
];
let waveColors = null;

function getTheme() {
    return document.documentElement.dataset.theme || 'glass';
}

function applyTheme(id, persist = true) {
    if (!THEMES.some(t => t.id === id)) id = 'glass';
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem('soundx_theme', id); } catch (e) { }
    waveColors = null;
    renderThemeMenu();
    if (persist) {
        fetch('/api/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: id })
        }).catch(() => { });
    }
}

let hasVirtualDevices = false;

function renderThemeMenu() {
    const menu = document.getElementById('theme-menu');
    if (!menu) return;
    const current = getTheme();
    menu.innerHTML = `<div class="theme-menu-title">${t('header.theme_menu')}</div>`;
    THEMES.forEach(th => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-option' + (th.id === current ? ' active' : '');
        btn.innerHTML = `
            <span class="theme-swatch" style="background: linear-gradient(135deg, ${th.sw[0]} 0%, ${th.sw[1]} 55%, ${th.sw[2]} 100%)"></span>
            <span class="theme-name">${t('theme.' + th.id)}</span>
            <span class="theme-check"></span>`;
        btn.addEventListener('click', () => {
            applyTheme(th.id);
            document.getElementById('theme-picker').classList.remove('open');
        });
        menu.appendChild(btn);
    });
}

function initThemePicker() {
    const picker = document.getElementById('theme-picker');
    const btn = document.getElementById('theme-btn');
    if (!picker || !btn) return;
    renderThemeMenu();
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lp = document.getElementById('lang-picker');
        if (lp) lp.classList.remove('open');
        picker.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target)) picker.classList.remove('open');
    });
}

function updateDynamicTranslations() {
    if (inputSelect && inputSelect.options.length > 0 && inputSelect.options[0].value === '-1') {
        inputSelect.options[0].textContent = t('devices.input_none');
    }
    if (presetSelect && presetSelect.options.length > 0 && presetSelect.options[0].value === '') {
        presetSelect.options[0].textContent = t('presets.select_placeholder');
    }
    if (micMuteBtn) {
        micMuteBtn.textContent = isMicMuted ? t('devices.unmute_btn') : t('devices.mute_btn');
    }
    setRunningState(isRunning);
    updateSoundXStatus(audioData.soundx_info);
    updateRoutingGuide(false);
    renderAppRack();
    populateSounds(audioData.sounds || []);
    if (appModalOverlay && appModalOverlay.classList.contains('active')) {
        filterAppList();
    }
}

function readWaveColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fb) => (cs.getPropertyValue(name).trim() || fb);
    const accent = v('--accent-color', '#2997ff');
    const accent2 = v('--accent-2', '#af52de');
    const a1 = v('--accent-rgb', '41, 151, 255');
    const a2 = v('--accent-2-rgb', '175, 82, 222');
    const a3 = v('--wave-3-rgb', '48, 209, 88');
    const isLight = getTheme() === 'light';
    waveColors = {
        fade: isLight ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)',
        l1: [`rgba(${a1}, ${isLight ? 0.08 : 0.22})`, accent],
        l2: [`rgba(${a2}, ${isLight ? 0.10 : 0.28})`, accent2],
        l3: [`rgba(${a3}, ${isLight ? 0.12 : 0.35})`, `rgb(${a3})`]
    };
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    initLangPicker();
    initThemePicker();
    applyLanguage(detectSystemLanguage(), false);
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
        if (data.config && data.config.theme && data.config.theme !== getTheme()) {
            applyTheme(data.config.theme, false);
        }
        applyLanguage(detectSystemLanguage(data.system_lang), false);

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
            micMuteBtn.classList.toggle('active', isMicMuted);
            micMuteBtn.textContent = isMicMuted ? t('devices.unmute_btn') : t('devices.mute_btn');
            if (isMicMuted && micMuteText) {
                micMuteText.textContent = 'Muted';
                micMuteText.style.color = 'var(--danger-color)';
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
    hasVirtualDevices = !!hasVirtual;

    if (soundxStatusPill) {
        soundxStatusPill.textContent = hasVirtual ? t('pill.ready') : t('pill.needed');
        soundxStatusPill.style.background = hasVirtual ? "rgba(48, 209, 88, 0.2)" : "rgba(255, 159, 10, 0.2)";
        soundxStatusPill.style.color = hasVirtual ? "#30d158" : "#ff9f0a";
    }

    const missingVBCableCard = document.getElementById('missing-vbcable-card');
    if (missingVBCableCard) {
        missingVBCableCard.style.display = hasVirtual ? "none" : "flex";
    }

    if (soundxBannerText) {
        soundxBannerText.innerHTML = hasVirtual
            ? t('routing.banner_active', { device: 'CABLE Output (VB-Audio Virtual Cable)' })
            : t('routing.banner_needed');
    }
}

async function registerSoundXDevice() {
    showToast(t('toast.scanning_vb'), "info");
    try {
        await fetch('/api/soundx/register', { method: 'POST' });
        showToast(t('toast.vb_ready'), "success");

        // Refresh device list
        const initRes = await fetch('/api/init');
        const initData = await initRes.json();
        audioData.devices = initData.devices;
        audioData.soundx_info = initData.soundx_info;
        updateSoundXStatus(initData.soundx_info);
        if (driverSelect && driverSelect.value) {
            updateDevices(parseInt(driverSelect.value));
        }
    } catch (e) {
        showToast(t('toast.info', { msg: e }), "info");
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
        noMicOpt.textContent = t('devices.input_none');
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

function updateRoutingGuide(persist = true) {
    if (!inputSelect || !outputSelect) return;
    const selectedInputOpt = inputSelect.options[inputSelect.selectedIndex];
    const selectedOutputOpt = outputSelect.options[outputSelect.selectedIndex];
    const selectedMonitorOpt = monitorSelect ? monitorSelect.options[monitorSelect.selectedIndex] : null;

    const inName = selectedInputOpt ? selectedInputOpt.textContent : "";
    const outName = selectedOutputOpt ? selectedOutputOpt.textContent : "";
    const monName = selectedMonitorOpt ? selectedMonitorOpt.textContent : "";
    const hasValidIn = inputSelect.value !== "" && inputSelect.options.length > 0 && inName !== t('devices.select_driver_first');
    const hasValidOut = outputSelect.value !== "" && outputSelect.options.length > 0 && outName !== t('devices.select_driver_first');

    if (persist) {
        if (inName && hasValidIn) {
            localStorage.setItem('soundx_input_name', inName);
            localStorage.setItem('soundx_input_id', inputSelect.value);
        }
        if (outName && hasValidOut) {
            localStorage.setItem('soundx_output_name', outName);
            localStorage.setItem('soundx_output_id', outputSelect.value);
        }
        if (monName && monitorSelect && monitorSelect.value !== "" && monName !== t('devices.select_driver_first')) {
            localStorage.setItem('soundx_monitor_name', monName);
            localStorage.setItem('soundx_monitor_id', monitorSelect.value);
        }
    }

    // Calculate corresponding Discord / Voice Recorder Microphone name
    let targetDiscordMic = "CABLE Output (VB-Audio Virtual Cable)";
    const outLow = outName.toLowerCase();
    if (outLow.includes("cable input") || outLow.includes("soundx router") || outLow.includes("vb-cable")) {
        targetDiscordMic = "CABLE Output (VB-Audio Virtual Cable)";
    } else if (outLow.includes("sonar")) {
        targetDiscordMic = "SteelSeries Sonar - Microphone";
    } else if (hasValidOut && outName) {
        targetDiscordMic = outName;
    }

    // Update banner with active target microphone
    if (soundxBannerText) {
        soundxBannerText.innerHTML = hasVirtualDevices || hasValidOut
            ? t('routing.banner_active', { device: escapeHtml(targetDiscordMic) })
            : t('routing.banner_needed');
    }

    // Detect feedback loop hazard
    const inLow = inName.toLowerCase();
    const isLoop = (inLow.includes("cable output") && outLow.includes("cable input")) ||
                   (inLow.includes("soundx router out") && outLow.includes("soundx router in")) ||
                   (inLow.includes("vb-cable") && outLow.includes("vb-cable"));
    if (loopAlertBanner) {
        loopAlertBanner.style.display = isLoop ? "flex" : "none";
    }

    if (persist) {
        saveCurrentConfigDebounced();
    }
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
        showToast(t('toast.copied_mic', { device: textToCopy }), "success");
    }).catch(() => {
        showToast(t('toast.select_mic', { device: textToCopy }), "info");
    });
}

async function playTestChime() {
    showToast(t('toast.sending_test'), "info");
    try {
        const outId = outputSelect ? outputSelect.value : null;
        const res = await fetch('/api/routing/test_tone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ output_id: outId })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            showToast(t('toast.test_sent'), "success");
        } else {
            showToast(t('toast.test_err', { msg: data.message || "Unknown" }), "error");
        }
    } catch (e) {
        showToast(t('toast.error', { msg: e }), "error");
    }
}

async function openSoundControlPanel() {
    try {
        await fetch('/api/open_sound_control_panel', { method: 'POST' });
        showToast(t('toast.sound_panel'), "info");
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
function svgIcon(body, size = 18, strokeWidth = 1.85) {
    return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const APP_ICON_TABLE = [
    {
        keys: ['spotify', 'music', 'itunes', 'tidal', 'deezer'],
        path: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'
    },
    {
        keys: ['chrome', 'brave', 'firefox', 'edge', 'opera', 'vivaldi'],
        path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
    },
    {
        keys: ['discord', 'teams', 'telegram', 'skype', 'zoom', 'slack'],
        path: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
    },
    {
        keys: ['game', 'steam', 'epic', 'valorant', 'cs2', 'gta'],
        path: '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/>'
    },
    {
        keys: ['vlc', 'media', 'player', 'mpv', 'obs'],
        path: '<rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 16 12 10 15 10 9"/>'
    }
];
const ICON_SPEAKER_WAVES = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
const ICON_SPEAKER_MUTE = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
const ICON_SPEAKER_LOW = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
const ICON_SEARCH = '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>';

function getAppIconSvg(name) {
    const n = name.toLowerCase();
    const match = APP_ICON_TABLE.find(entry => entry.keys.some(k => n.includes(k)));
    return svgIcon(match ? match.path : ICON_SPEAKER_WAVES, 18, 1.85);
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

        const appIcon = getAppIconSvg(app.name);
        const volumePct = Math.round((app.volume || 1.0) * 100);

        card.innerHTML = `
            <div class="app-card-top">
                <div class="app-card-left">
                    <div class="app-avatar">${appIcon}</div>
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
                            title="${app.muted ? t('apps.unmute') : t('apps.mute')}" 
                            onclick="toggleAppMute(${app.pid})">
                        ${svgIcon(app.muted ? ICON_SPEAKER_MUTE : ICON_SPEAKER_LOW, 15, 1.9)}
                    </button>
                    <button class="app-icon-btn remove-btn" 
                            title="${t('apps.remove')}" 
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
    showToast(t('toast.app_removed'), "info");
}

// --- Modal Logic ---
if (openAppModalBtn) {
    openAppModalBtn.addEventListener('click', openAppModal);
}
if (refreshAppsBtn) {
    refreshAppsBtn.addEventListener('click', async () => {
        showToast(t('toast.refreshing_apps'), "info");
        const res = await fetch('/api/apps/available');
        availableAppsList = await res.json();
        showToast(t('toast.found_apps', { count: availableAppsList.length }), "success");
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
    modalAppList.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-secondary);">${t('modal.scanning')}</div>`;

    try {
        const res = await fetch('/api/apps/available');
        availableAppsList = await res.json();
        updateModalFilterBadges();
        filterAppList();
    } catch (e) {
        modalAppList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--danger-color);">${t('toast.error', { msg: e })}</div>`;
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
                    <div class="empty-icon">${svgIcon(ICON_SPEAKER_MUTE, 28, 1.65)}</div>
                    <h4>${t('modal.empty_playing_title')}</h4>
                    <p>${t('modal.empty_playing_desc')}</p>
                </div>
            `;
        } else {
            modalAppList.innerHTML = `
                <div class="modal-empty-state">
                    <div class="empty-icon">${svgIcon(ICON_SEARCH, 28, 1.65)}</div>
                    <h4>${t('modal.empty_search_title')}</h4>
                    <p>${t('modal.empty_search_desc')}</p>
                </div>
            `;
        }
        return;
    }

    apps.forEach(app => {
        const isAdded = activeApps.some(a => a.pid === app.pid);
        const item = document.createElement('div');
        item.className = 'modal-app-item';

        const appIcon = getAppIconSvg(app.name);

        item.innerHTML = `
            <div class="modal-app-info">
                <div class="modal-app-icon">${appIcon}</div>
                <div class="modal-app-text">
                    <div class="modal-app-title">${app.name}</div>
                    <div class="modal-app-sub">
                        <span>PID: ${app.pid}</span>
                        ${app.has_audio ? `<span class="audio-active-badge">${t('modal.playing_badge')}</span>` : ''}
                    </div>
                </div>
            </div>
            <button class="modal-add-btn ${isAdded ? 'added' : ''}" 
                    onclick="addAppFromModal(${app.pid}, '${escapeHtml(app.name)}', '${escapeHtml(app.raw_name || '')}', this)" 
                    ${isAdded ? 'disabled' : ''}>
                ${isAdded ? t('modal.added_btn') : t('modal.add_btn')}
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
        btn.textContent = t('modal.adding_btn');
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
            btn.textContent = t('modal.added_btn');
            btn.classList.add('added');
        }
        showToast(t('toast.app_added', { name }), "success");
    } else {
        if (btn) {
            btn.disabled = false;
            btn.textContent = t('modal.add_btn');
        }
        showToast(t('toast.add_app_err'), "error");
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
        micMuteBtn.textContent = isMicMuted ? t('devices.unmute_btn') : t('devices.mute_btn');
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
        toggleBtnText.textContent = isRunning ? t('footer.stop') : t('footer.start');
    }
    if (statusIndicator) {
        statusIndicator.textContent = isRunning ? t('status.live') : t('status.ready');
        statusIndicator.classList.toggle('running', isRunning);
    }
    if (isRunning) {
        startMeterPolling();
    } else {
        resetMeters();
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
                showToast(t('toast.routing_stopped'), "info");
            } catch (err) {
                showToast(t('toast.stop_err', { msg: err }), "error");
            }
        } else {
            // START
            const inputId = inputSelect ? inputSelect.value : null;
            const outputId = outputSelect ? outputSelect.value : null;

            if (!outputId || outputId === "Select Driver First" || outputId === "") {
                showToast(t('toast.select_output_first'), "error");
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

                let data;
                try {
                    data = await res.json();
                } catch (jsonErr) {
                    throw new Error(`HTTP ${res.status}: Server returned non-JSON response`);
                }

                if (data.status === 'started' || data.status === 'already_running') {
                    setRunningState(true);
                    showToast(t('toast.routing_started'), "success");
                } else {
                    setRunningState(false);
                    showToast(t('toast.start_failed', { msg: data.message || "Unknown error" }), "error");
                }
            } catch (err) {
                showToast(t('toast.conn_err', { msg: err.message || err }), "error");
            }
        }
    });
}

// --- VU Meter Polling ---
function startMeterPolling() {
    if (meterInterval) clearInterval(meterInterval);
    meterInterval = setInterval(updateMeters, 65);
}

function calculateVuPercent(level) {
    if (!level || level <= 0.001) return 0;
    // Perceptual studio VU meter curve (maps low & high signals dynamically)
    const curved = Math.pow(Math.min(1.0, level * 1.35), 0.45);
    return Math.min(100, Math.max(0, Math.round(curved * 100)));
}

function resetMeters() {
    setMeter(inputMeterFill, inputMeterValue, 0);
    setMeter(appsMeterFill, appsMeterValue, 0);
    setMeter(outputMeterFill, outputMeterValue, 0);
    targetAmplitude = 0;
}

async function updateMeters() {
    try {
        const res = await fetch('/api/meters');
        if (!res.ok) return;
        const data = await res.json();

        // Sync routing status
        if (typeof data.is_running === 'boolean' && data.is_running !== isRunning) {
            setRunningState(data.is_running);
        }

        // Mic in
        const micLevel = data.mic || data.input || 0;
        setMeter(inputMeterFill, inputMeterValue, micLevel);

        // Apps Combined
        let maxAppLevel = 0;
        if (data.apps && typeof data.apps === 'object') {
            for (const [pid, lvl] of Object.entries(data.apps)) {
                if (lvl > maxAppLevel) maxAppLevel = lvl;
                const fillEl = document.getElementById(`app-meter-${pid}`);
                if (fillEl) {
                    const pct = calculateVuPercent(lvl);
                    fillEl.style.width = pct + '%';
                }
            }
        }
        setMeter(appsMeterFill, appsMeterValue, maxAppLevel);

        // Master Output
        const outLevel = data.output || 0;
        setMeter(outputMeterFill, outputMeterValue, outLevel);

        // Oscilloscope sample: track active sound
        const activeLevel = Math.max(outLevel, micLevel, maxAppLevel);
        addWaveSample(activeLevel);
    } catch (err) {
        // quiet error
    }
}

function setMeter(fillEl, valueEl, level) {
    if (!fillEl || !valueEl) return;
    const pct = calculateVuPercent(level);
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
    if (level > 0.001) {
        targetAmplitude = Math.min(2.0, Math.pow(level, 0.42) * 2.2);
    } else {
        targetAmplitude = 0;
    }
}

function drawWave() {
    if (!waveCtx || !waveCanvas) return;
    const width = waveCanvas.clientWidth;
    const height = waveCanvas.clientHeight;
    if (!width || !height) return;
    waveCtx.clearRect(0, 0, width, height);

    currentAmplitude += (targetAmplitude - currentAmplitude) * 0.14;
    const baseAmp = 0.08;
    const totalAmp = baseAmp + currentAmplitude;
    waveTime += 0.05;

    // Layer 1: Ambient (accent)
    if (!waveColors) readWaveColors();
    drawSineWave(width, height, waveTime * 0.6, totalAmp * 0.65, 0, waveColors.l1[0], waveColors.l1[1]);
    // Layer 2: Mid (secondary accent)
    drawSineWave(width, height, waveTime * 0.9, totalAmp * 0.85, 2, waveColors.l2[0], waveColors.l2[1]);
    // Layer 3: Crisp front wave
    drawSineWave(width, height, waveTime * 1.3, totalAmp, 4, waveColors.l3[0], waveColors.l3[1]);
}

function drawSineWave(width, height, time, amplitude, phaseOffset, fillColor, strokeColor) {
    waveCtx.beginPath();
    waveCtx.moveTo(0, height / 2);
    const frequency = 0.022;

    for (let x = 0; x <= width; x += 3) {
        const y = height / 2 + Math.sin(x * frequency + time + phaseOffset) * (height * 0.42 * amplitude);
        waveCtx.lineTo(x, y);
    }

    // Soft gradient fill to bottom
    waveCtx.lineTo(width, height);
    waveCtx.lineTo(0, height);
    waveCtx.closePath();

    const grad = waveCtx.createLinearGradient(0, height / 2, 0, height);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, (waveColors && waveColors.fade) || 'rgba(0, 0, 0, 0)');
    waveCtx.fillStyle = grad;
    waveCtx.fill();

    // Top crest neon line
    waveCtx.beginPath();
    waveCtx.moveTo(0, height / 2);
    for (let x = 0; x <= width; x += 3) {
        const y = height / 2 + Math.sin(x * frequency + time + phaseOffset) * (height * 0.42 * amplitude);
        waveCtx.lineTo(x, y);
    }
    waveCtx.strokeStyle = strokeColor;
    waveCtx.lineWidth = amplitude > 0.15 ? 1.5 : 1.0;
    waveCtx.stroke();
}

// --- Presets ---
async function refreshPresets() {
    if (!presetSelect) return;
    const res = await fetch('/api/presets');
    const presets = await res.json();
    presetSelect.innerHTML = `<option value="">${t('presets.select_placeholder')}</option>`;
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
            showToast(t('toast.preset_loaded', { name }), "success");
        }
    });
}

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', async () => {
        const name = presetNameInput.value.trim();
        if (!name) {
            showToast(t('toast.enter_preset_name'), 'error');
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
            showToast(t('toast.preset_saved', { name }), 'success');
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
function truncateName(name, max = 26) {
    return name.length > max ? name.slice(0, max - 3) + '...' : name;
}

function populateSounds(files) {
    if (!soundGrid) return;
    soundGrid.innerHTML = '';

    const noneDiv = document.createElement('div');
    noneDiv.className = 'sound-item ' + (selectedSound === null ? 'active' : '');
    const noneLabel = t('soundboard.none');
    noneDiv.innerHTML = `<div class="sound-name" title="${noneLabel}">${noneLabel}</div>`;
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
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.nav-tab') || e.target.closest('.theme-picker') || e.target.closest('.lang-picker')) return;
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

// Start live polling unconditionally
startMeterPolling();

