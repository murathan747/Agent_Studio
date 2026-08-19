/**
 * =========================================================================
 * AgentStudio - Node: Timeline Sequencer (Keyframe Animation)
 * Unreal Engine Style Timeline & Keyframe Animator for 3D Relighting & VFX.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';
import { ApiClient } from '../core/api.js';

export const TimelineNode = {
    type: 'timeline-sequencer',
    title: 'Timeline Sequencer',
    titleKey: 'node.timeline.title',
    subtitle: 'Keyframe Animasyon & Sekans Motoru',
    subtitleKey: 'node.timeline.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'timeline-sequencer',
            title: 'Timeline Sequencer',
            titleKey: 'node.timeline.title',
            subtitle: 'Keyframe Animasyon & Sekans Motoru',
            subtitleKey: 'node.timeline.subtitle',
            x, y,
            width: '360px',
            hasInputPort: true,
            hasOutputPort: true,
            inputPortTitle: 'Giriş: Animasyonu yapılacak görseli alır',
            outputPortTitle: 'Çıkış: Numaralı kare sekansını (people_0000.png...) aktarır'
        });

        // Unreal Engine Indigo/Violet Theme Header
        const header = node.querySelector('.node-header');
        if (header) header.style.backgroundColor = '#3730a3';

        const content = document.createElement('div');
        content.className = 'node-content';
        content.innerHTML = `
            <!-- Top Controls: Active Toggle & Scope (Single vs All) -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:#0f172a; padding:6px 10px; border-radius:6px; border:1px solid #1e293b;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:11px; font-weight:bold; color:#cbd5e1;">Animasyon:</span>
                    <button type="button" class="timeline-active-btn" style="padding:3px 8px; font-size:10px; font-weight:bold; background:#059669; border:1px solid #10b981; color:#fff; border-radius:4px; cursor:pointer;" title="Animasyon Aktif / Pasif">
                        🟢 AKTİF
                    </button>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                    <span style="font-size:10px; color:#94a3b8;">Kapsam:</span>
                    <select class="timeline-scope-select" style="background:#020617; border:1px solid #4b5563; border-radius:4px; color:#38bdf8; font-size:10px; padding:2px 4px; cursor:pointer;" title="Tekli veya Tüm Görseller">
                        <option value="single" selected>🎯 Tekli Görsel (Test)</option>
                        <option value="all">🌐 Tüm Görseller</option>
                    </select>
                </div>
            </div>

            <!-- Asset Selector Bar (When Multiple Assets Connected) -->
            <div class="timeline-asset-nav-bar" style="display:none; justify-content:space-between; align-items:center; background:#0b1329; border:1px solid #1e3a8a; border-radius:6px; padding:4px 8px; margin-bottom:8px; font-size:10px;">
                <button type="button" class="asset-prev-btn" style="background:#1e293b; border:1px solid #3b82f6; color:#93c5fd; border-radius:4px; padding:2px 6px; cursor:pointer;">◀</button>
                <span class="current-asset-label" style="color:#60a5fa; font-weight:bold; font-family:monospace;">Obje 1/1: image.png</span>
                <button type="button" class="asset-next-btn" style="background:#1e293b; border:1px solid #3b82f6; color:#93c5fd; border-radius:4px; padding:2px 6px; cursor:pointer;">▶</button>
            </div>

            <!-- Frame Count, FPS, Curve & Engine Settings -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:8px; background:#090d16; padding:6px; border-radius:6px; border:1px solid #1e293b; font-size:10px;">
                <div>
                    <div style="display:flex; justify-content:space-between; color:#94a3b8; margin-bottom:2px;">
                        <span>Kare Sayısı:</span>
                        <b class="frame-count-label" style="color:#fbbf24; font-family:monospace;">64 Kare</b>
                    </div>
                    <input type="range" class="timeline-frames-slider" min="4" max="180" step="2" value="64" style="width:100%; accent-color:#f59e0b; height:4px; cursor:pointer;">
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; color:#94a3b8; margin-bottom:2px;">
                        <span>Hız / Süre:</span>
                        <b class="timeline-duration-label" style="color:#38bdf8; font-family:monospace;">24 fps (2.67s)</b>
                    </div>
                    <input type="range" class="timeline-fps-slider" min="12" max="60" step="1" value="24" style="width:100%; accent-color:#38bdf8; height:4px; cursor:pointer;">
                </div>
                <div>
                    <span style="color:#94a3b8;">Eğri:</span>
                    <select class="timeline-interp-select" style="width:100%; background:#020617; border:1px solid #4b5563; border-radius:4px; color:#38bdf8; font-size:10px; padding:2px 4px; margin-top:2px; cursor:pointer;">
                        <option value="linear">Linear (Doğrusal)</option>
                        <option value="spline" selected>Spline (Yumuşak S-Eğrisi)</option>
                        <option value="ease_in">Ease In (Yavaş Başla)</option>
                        <option value="ease_out">Ease Out (Yavaş Dur)</option>
                    </select>
                </div>
                <div>
                    <span style="color:#94a3b8;">Motor:</span>
                    <select class="timeline-engine-select" style="width:100%; background:#020617; border:1px solid #4b5563; border-radius:4px; color:#f59e0b; font-size:10px; padding:2px 4px; margin-top:2px; cursor:pointer;">
                        <option value="fast" selected>⚡ Hızlı Shader (0.05s)</option>
                        <option value="ai">🧠 Derin AI (IC-Light)</option>
                    </select>
                </div>
            </div>

            <!-- Keyframe Tracks: Start Key (0) vs End Key (N) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:8px;">
                <!-- Start Key (Frame 0) -->
                <div style="background:#0b1329; border:1px solid #3b82f6; border-radius:6px; padding:6px; font-size:10px;">
                    <div style="color:#60a5fa; font-weight:bold; margin-bottom:4px; display:flex; justify-content:space-between;">
                        <span>📍 Başlangıç (Kare 0)</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <div style="display:flex; justify-content:space-between; color:#cbd5e1;">
                            <span>Yatay:</span>
                            <span class="start-yaw-val" style="color:#f87171; font-family:monospace;">180° (Sol)</span>
                        </div>
                        <input type="range" class="start-yaw-slider" min="0" max="360" value="180" style="width:100%; accent-color:#f87171; height:3px; cursor:pointer;">
                        
                        <div style="display:flex; justify-content:space-between; color:#cbd5e1; margin-top:2px;">
                            <span>Dikey:</span>
                            <span class="start-pitch-val" style="color:#4ade80; font-family:monospace;">0°</span>
                        </div>
                        <input type="range" class="start-pitch-slider" min="-90" max="90" value="0" style="width:100%; accent-color:#4ade80; height:3px; cursor:pointer;">

                        <div style="display:flex; justify-content:space-between; color:#cbd5e1; margin-top:2px;">
                            <span>Derinlik:</span>
                            <span class="start-depth-val" style="color:#38bdf8; font-family:monospace;">+30°</span>
                        </div>
                        <input type="range" class="start-depth-slider" min="-90" max="90" value="30" style="width:100%; accent-color:#38bdf8; height:3px; cursor:pointer;">
                    </div>
                </div>

                <!-- End Key (Frame N) -->
                <div style="background:#1e1035; border:1px solid #a855f7; border-radius:6px; padding:6px; font-size:10px;">
                    <div style="color:#c084fc; font-weight:bold; margin-bottom:4px; display:flex; justify-content:space-between;">
                        <span>🏁 Bitiş (Son Kare)</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <div style="display:flex; justify-content:space-between; color:#cbd5e1;">
                            <span>Yatay:</span>
                            <span class="end-yaw-val" style="color:#f87171; font-family:monospace;">0° (Sağ)</span>
                        </div>
                        <input type="range" class="end-yaw-slider" min="0" max="360" value="0" style="width:100%; accent-color:#f87171; height:3px; cursor:pointer;">
                        
                        <div style="display:flex; justify-content:space-between; color:#cbd5e1; margin-top:2px;">
                            <span>Dikey:</span>
                            <span class="end-pitch-val" style="color:#4ade80; font-family:monospace;">0°</span>
                        </div>
                        <input type="range" class="end-pitch-slider" min="-90" max="90" value="0" style="width:100%; accent-color:#4ade80; height:3px; cursor:pointer;">

                        <div style="display:flex; justify-content:space-between; color:#cbd5e1; margin-top:2px;">
                            <span>Derinlik:</span>
                            <span class="end-depth-val" style="color:#38bdf8; font-family:monospace;">+30°</span>
                        </div>
                        <input type="range" class="end-depth-slider" min="-90" max="90" value="30" style="width:100%; accent-color:#38bdf8; height:3px; cursor:pointer;">
                    </div>
                </div>
            </div>

            <!-- Interactive Scrubber & Timeline Bar -->
            <div style="background:#090d16; border:1px solid #1e293b; border-radius:6px; padding:6px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <button type="button" class="timeline-play-btn" style="padding:2px 8px; font-size:10px; font-weight:bold; background:#1e293b; border:1px solid #4ade80; color:#4ade80; border-radius:4px; cursor:pointer;">
                        ▶ Oynat
                    </button>
                    <span class="current-frame-badge" style="font-size:10px; color:#fbbf24; font-family:monospace; font-weight:bold;">
                        Kare: 0 / 64 (0.00s)
                    </span>
                    <span class="current-interp-angle" style="font-size:9px; color:#94a3b8; font-family:monospace;">
                        180° Sol
                    </span>
                </div>
                <input type="range" class="timeline-scrubber" min="0" max="63" value="0" style="width:100%; accent-color:#818cf8; height:5px; cursor:pointer;">
            </div>

            <!-- Live Preview / Render Progress Box -->
            <div class="timeline-preview-container" style="display:none; position:relative; width:100%; min-height:130px; max-height:170px; background:#020617; border-radius:6px; border:1px solid #334155; margin-bottom:8px; overflow:hidden; justify-content:center; align-items:center;">
                <img class="timeline-preview-img" style="max-width:100%; max-height:170px; object-fit:contain; display:block;" src="" alt="Frame Preview">
                <div class="timeline-render-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.8); flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:10px; text-align:center;">
                    <div style="width:24px; height:24px; border:3px solid rgba(255,255,255,0.2); border-top-color:#818cf8; border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <div class="timeline-progress-text" style="font-size:11px; color:#cbd5e1; font-weight:bold;">[0/64] Kareler Üretiliyor...</div>
                </div>
            </div>

            <!-- Action Buttons: Render Sequence & Save to Folder -->
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <div style="display:flex; gap:6px; width:100%;">
                    <button type="button" class="run-sequence-btn" style="flex:1; padding:8px 10px; background:#4338ca; border:1px solid #818cf8; border-radius:5px; color:white; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
                        ⚡ Sekansı Render Al (64 Kare)
                    </button>
                    <button type="button" class="save-folder-btn" style="display:none; padding:8px 10px; background:#065f46; border:1px solid #10b981; border-radius:5px; color:#6ee7b7; font-size:11px; font-weight:bold; cursor:pointer;" title="Doğrudan Klasöre Kaydet (ZIP'siz)">
                        💾 Diske Kaydet
                    </button>
                </div>
                <button type="button" class="open-folder-btn" style="display:none; width:100%; padding:6px 10px; background:#1e293b; border:1px solid #38bdf8; border-radius:5px; color:#38bdf8; font-size:10px; font-weight:bold; cursor:pointer; align-items:center; justify-content:center; gap:4px;">
                    📂 Klasörü Aç (Explorer)
                </button>
            </div>
        `;
        node.appendChild(content);

        // Elements
        const activeBtn = node.querySelector('.timeline-active-btn');
        const scopeSelect = node.querySelector('.timeline-scope-select');
        const assetNavBar = node.querySelector('.timeline-asset-nav-bar');
        const assetPrevBtn = node.querySelector('.asset-prev-btn');
        const assetNextBtn = node.querySelector('.asset-next-btn');
        const currentAssetLabel = node.querySelector('.current-asset-label');

        const interpSelect = node.querySelector('.timeline-interp-select');
        const engineSelect = node.querySelector('.timeline-engine-select');
        const framesSlider = node.querySelector('.timeline-frames-slider');
        const frameCountLabel = node.querySelector('.frame-count-label');
        const fpsSlider = node.querySelector('.timeline-fps-slider');
        const durationLabel = node.querySelector('.timeline-duration-label');

        const startYawSlider = node.querySelector('.start-yaw-slider');
        const startYawVal = node.querySelector('.start-yaw-val');
        const startPitchSlider = node.querySelector('.start-pitch-slider');
        const startPitchVal = node.querySelector('.start-pitch-val');
        const startDepthSlider = node.querySelector('.start-depth-slider');
        const startDepthVal = node.querySelector('.start-depth-val');

        const endYawSlider = node.querySelector('.end-yaw-slider');
        const endYawVal = node.querySelector('.end-yaw-val');
        const endPitchSlider = node.querySelector('.end-pitch-slider');
        const endPitchVal = node.querySelector('.end-pitch-val');
        const endDepthSlider = node.querySelector('.end-depth-slider');
        const endDepthVal = node.querySelector('.end-depth-val');

        const playBtn = node.querySelector('.timeline-play-btn');
        const scrubber = node.querySelector('.timeline-scrubber');
        const frameBadge = node.querySelector('.current-frame-badge');
        const angleBadge = node.querySelector('.current-interp-angle');

        const previewContainer = node.querySelector('.timeline-preview-container');
        const previewImg = node.querySelector('.timeline-preview-img');
        const renderOverlay = node.querySelector('.timeline-render-overlay');
        const progressText = node.querySelector('.timeline-progress-text');
        const runSeqBtn = node.querySelector('.run-sequence-btn');
        const saveFolderBtn = node.querySelector('.save-folder-btn');
        const openFolderBtn = node.querySelector('.open-folder-btn');

        // State
        let isTimelineActive = true;
        let frameCount = 64;
        let fps = 24;
        let currentFrame = 0;
        let isPlaying = false;
        let playInterval = null;
        let selectedAssetIdx = 0;
        let lastSavedDir = '';

        let startKey = { yaw: 180, pitch: 0, depth: 30 };
        let endKey = { yaw: 0, pitch: 0, depth: 30 };

        let cachedSequenceAssets = [];
        let inputSourceAssets = [];

        // Helper: Format degree direction name
        function formatYawLabel(deg) {
            deg = ((deg % 360) + 360) % 360;
            if (deg >= 337.5 || deg < 22.5) return `${deg}° (Sağ)`;
            if (deg >= 22.5 && deg < 67.5) return `${deg}° (Sağ-Alt)`;
            if (deg >= 67.5 && deg < 112.5) return `${deg}° (Alt)`;
            if (deg >= 112.5 && deg < 157.5) return `${deg}° (Sol-Alt)`;
            if (deg >= 157.5 && deg < 202.5) return `${deg}° (Sol)`;
            if (deg >= 202.5 && deg < 247.5) return `${deg}° (Sol-Üst)`;
            if (deg >= 247.5 && deg < 292.5) return `${deg}° (Üst)`;
            return `${deg}° (Sağ-Üst)`;
        }

        // Calculate Interpolated Angle at Normalized Time s (0.0 to 1.0)
        function interpolateAngle(s, startDeg, endDeg, mode) {
            let curved_s = s;
            if (mode === 'spline') {
                curved_s = s * s * (3.0 - 2.0 * s); // Smoothstep S-Curve
            } else if (mode === 'ease_in') {
                curved_s = s * s;
            } else if (mode === 'ease_out') {
                curved_s = s * (2.0 - s);
            }
            return startDeg + (endDeg - startDeg) * curved_s;
        }

        // Get Full 3D State at Frame Index t
        function getStateAtFrame(t) {
            const total = Math.max(2, frameCount);
            const s = Math.max(0.0, Math.min(1.0, t / (total - 1)));
            const mode = interpSelect ? interpSelect.value : 'spline';

            const yaw = interpolateAngle(s, startKey.yaw, endKey.yaw, mode);
            const pitch = interpolateAngle(s, startKey.pitch, endKey.pitch, mode);
            const depth = interpolateAngle(s, startKey.depth, endKey.depth, mode);

            // Convert to Cartesian 3D Light Vector
            const radYaw = (yaw * Math.PI) / 180.0;
            const radPitch = (pitch * Math.PI) / 180.0;
            const radDepth = (depth * Math.PI) / 180.0;
            const horizScale = Math.cos(radPitch);
            const lx = Math.cos(radYaw) * horizScale;
            const ly = Math.sin(radYaw) * horizScale;
            const lz = Math.sin(radDepth);

            return {
                frame: t,
                timeSec: (t / fps).toFixed(2),
                yaw: Math.round(yaw),
                pitch: Math.round(pitch),
                depth: Math.round(depth),
                lx, ly, lz
            };
        }

        function updateUI() {
            frameCountLabel.innerText = `${frameCount} Kare`;
            const duration = (frameCount / fps).toFixed(2);
            durationLabel.innerText = `${fps} fps (${duration}s)`;
            scrubber.max = frameCount - 1;
            
            const scope = scopeSelect ? scopeSelect.value : 'single';
            if (scope === 'single') {
                runSeqBtn.innerText = `⚡ Tekli Render Al (${frameCount} Kare)`;
            } else {
                const totalTarget = (inputSourceAssets.length || 1) * frameCount;
                runSeqBtn.innerText = `⚡ Tümünü Render Al (${totalTarget} Kare)`;
            }

            const state = getStateAtFrame(currentFrame);
            frameBadge.innerText = `Kare: ${currentFrame} / ${frameCount} (${state.timeSec}s)`;
            angleBadge.innerText = `${formatYawLabel(state.yaw)} | ${state.pitch}° Dikey`;

            // Asset nav bar visibility
            if (inputSourceAssets && inputSourceAssets.length > 1) {
                assetNavBar.style.display = 'flex';
                const cur = inputSourceAssets[selectedAssetIdx] || inputSourceAssets[0];
                currentAssetLabel.innerText = `Obje ${selectedAssetIdx + 1}/${inputSourceAssets.length}: ${cur.name || 'asset.png'}`;
            } else {
                assetNavBar.style.display = 'none';
            }
        }

        // Active Toggle
        activeBtn.addEventListener('click', () => {
            isTimelineActive = !isTimelineActive;
            if (isTimelineActive) {
                activeBtn.innerText = '🟢 AKTİF';
                activeBtn.style.background = '#059669';
                activeBtn.style.borderColor = '#10b981';
            } else {
                activeBtn.innerText = '⚪ PASİF';
                activeBtn.style.background = '#374151';
                activeBtn.style.borderColor = '#6b7280';
            }
            node.setNodeStatus('dirty');
        });

        // Scope Switcher
        scopeSelect.addEventListener('change', () => {
            updateUI();
            node.setNodeStatus('dirty');
        });

        // Asset Prev/Next
        assetPrevBtn.addEventListener('click', () => {
            if (inputSourceAssets.length > 0) {
                selectedAssetIdx = (selectedAssetIdx - 1 + inputSourceAssets.length) % inputSourceAssets.length;
                updateUI();
                const cur = inputSourceAssets[selectedAssetIdx];
                if (cur) {
                    previewContainer.style.display = 'flex';
                    previewImg.src = cur.data || cur.rawData;
                }
            }
        });
        assetNextBtn.addEventListener('click', () => {
            if (inputSourceAssets.length > 0) {
                selectedAssetIdx = (selectedAssetIdx + 1) % inputSourceAssets.length;
                updateUI();
                const cur = inputSourceAssets[selectedAssetIdx];
                if (cur) {
                    previewContainer.style.display = 'flex';
                    previewImg.src = cur.data || cur.rawData;
                }
            }
        });

        // Frame Count & FPS Listeners
        framesSlider.addEventListener('input', () => {
            frameCount = parseInt(framesSlider.value, 10);
            if (currentFrame >= frameCount) currentFrame = frameCount - 1;
            updateUI();
            node.setNodeStatus('dirty');
        });

        fpsSlider.addEventListener('input', () => {
            fps = parseInt(fpsSlider.value, 10);
            updateUI();
        });

        interpSelect.addEventListener('change', () => {
            updateUI();
            node.setNodeStatus('dirty');
        });

        // Start Key Listeners
        startYawSlider.addEventListener('input', () => {
            startKey.yaw = parseInt(startYawSlider.value, 10);
            startYawVal.innerText = formatYawLabel(startKey.yaw);
            updateUI();
            node.setNodeStatus('dirty');
        });
        startPitchSlider.addEventListener('input', () => {
            startKey.pitch = parseInt(startPitchSlider.value, 10);
            const pSign = startKey.pitch >= 0 ? '+' : '';
            startPitchVal.innerText = `${pSign}${startKey.pitch}°`;
            updateUI();
            node.setNodeStatus('dirty');
        });
        startDepthSlider.addEventListener('input', () => {
            startKey.depth = parseInt(startDepthSlider.value, 10);
            const dSign = startKey.depth >= 0 ? '+' : '';
            startDepthVal.innerText = `${dSign}${startKey.depth}°`;
            updateUI();
            node.setNodeStatus('dirty');
        });

        // End Key Listeners
        endYawSlider.addEventListener('input', () => {
            endKey.yaw = parseInt(endYawSlider.value, 10);
            endYawVal.innerText = formatYawLabel(endKey.yaw);
            updateUI();
            node.setNodeStatus('dirty');
        });
        endPitchSlider.addEventListener('input', () => {
            endKey.pitch = parseInt(endPitchSlider.value, 10);
            const pSign = endKey.pitch >= 0 ? '+' : '';
            endPitchVal.innerText = `${pSign}${endKey.pitch}°`;
            updateUI();
            node.setNodeStatus('dirty');
        });
        endDepthSlider.addEventListener('input', () => {
            endKey.depth = parseInt(endDepthSlider.value, 10);
            const dSign = endKey.depth >= 0 ? '+' : '';
            endDepthVal.innerText = `${dSign}${endKey.depth}°`;
            updateUI();
            node.setNodeStatus('dirty');
        });

        // Scrubber & Playback
        scrubber.addEventListener('input', () => {
            currentFrame = parseInt(scrubber.value, 10);
            updateUI();
            if (cachedSequenceAssets && cachedSequenceAssets.length > currentFrame) {
                previewContainer.style.display = 'flex';
                previewImg.src = cachedSequenceAssets[currentFrame].data;
            }
        });

        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playBtn.innerText = '⏸ Durdur';
                playBtn.style.color = '#f87171';
                playBtn.style.borderColor = '#f87171';
                playInterval = setInterval(() => {
                    currentFrame = (currentFrame + 1) % frameCount;
                    scrubber.value = currentFrame;
                    updateUI();
                    if (cachedSequenceAssets && cachedSequenceAssets.length > currentFrame) {
                        previewContainer.style.display = 'flex';
                        previewImg.src = cachedSequenceAssets[currentFrame].data;
                    }
                }, 1000 / fps);
            } else {
                playBtn.innerText = '▶ Oynat';
                playBtn.style.color = '#4ade80';
                playBtn.style.borderColor = '#4ade80';
                if (playInterval) clearInterval(playInterval);
            }
        });

        // Batch Sequencer Engine
        node.processAssetsDirectly = async (inputAssets) => {
            if (!inputAssets || inputAssets.length === 0) return [];
            inputSourceAssets = inputAssets;
            updateUI();

            // If Inactive, forward unchanged
            if (!isTimelineActive) {
                return inputAssets;
            }

            const scope = scopeSelect ? scopeSelect.value : 'single';
            const targetsToProcess = (scope === 'single') 
                ? [inputAssets[selectedAssetIdx] || inputAssets[0]]
                : inputAssets;

            const sequenceAssets = [];
            const totalFrames = Math.max(2, frameCount);
            const engineType = engineSelect ? engineSelect.value : 'fast';

            previewContainer.style.display = 'flex';
            renderOverlay.style.display = 'flex';
            node.setNodeStatus('running');

            // Dynamically inherit Relight & Atmosphere settings if connected
            let inheritedSettings = null;
            let currentUp = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            while (currentUp) {
                if (typeof currentUp.getRelightSettings === 'function') {
                    inheritedSettings = currentUp.getRelightSettings();
                    break;
                }
                currentUp = window.WiresEngine ? window.WiresEngine.getUpstreamNode(currentUp) : null;
            }

            const lightIntensity = inheritedSettings ? inheritedSettings.intensity : 1.0;
            const ambientLevel = inheritedSettings ? inheritedSettings.ambient_level : 0.35;
            const lightColor = inheritedSettings ? inheritedSettings.light_color : '#ffffff';
            const promptPreset = inheritedSettings ? inheritedSettings.prompt_preset : 'custom';

            try {
                for (let astIdx = 0; astIdx < targetsToProcess.length; astIdx++) {
                    const ast = targetsToProcess[astIdx];
                    const rawSource = ast.rawData || ast.data;
                    const res = await fetch(rawSource);
                    const blob = await res.blob();
                    
                    // VFX / DaVinci Resolve Clean Stem Sanitization:
                    // Strips _nobg, _relit, and converts trailing _0 -> -0 so DaVinci sees only ONE trailing frame number!
                    const rawName = (ast.name || 'asset').replace(/\.[^/.]+$/, "");
                    let cleanStem = rawName
                        .replace(/_nobg/gi, "")
                        .replace(/_relit/gi, "")
                        .replace(/_nobg_relit/gi, "")
                        .replace(/_+/g, "_")
                        .replace(/_$/, "");
                    cleanStem = cleanStem.replace(/_(\d+)$/, '-$1') || 'asset';

                    const hasMultiple = (targetsToProcess.length > 1);

                    for (let f = 0; f < totalFrames; f++) {
                        const state = getStateAtFrame(f);
                        const frameFormatted = String(f).padStart(4, '0');
                        const frameFileName = `${cleanStem}_${frameFormatted}.png`;
                        // Put inside dedicated subfolder named after the asset
                        const savePath = `${cleanStem}/${frameFileName}`;

                        progressText.innerText = `[${f + 1}/${totalFrames}] ${frameFileName} render ediliyor (${state.yaw}°)...`;

                        const fd = new FormData();
                        fd.append('file', blob, frameFileName);
                        fd.append('light_direction', 'custom');
                        fd.append('light_x', state.lx);
                        fd.append('light_y', state.ly);
                        fd.append('light_z', state.lz);
                        fd.append('light_color', lightColor);
                        fd.append('intensity', lightIntensity);
                        fd.append('ambient_level', ambientLevel);
                        fd.append('prompt_preset', promptPreset);
                        fd.append('engine', engineType);
                        fd.append('seed', 12345);

                        const apiRes = await fetch('http://127.0.0.1:8000/api/relight', { method: 'POST', body: fd });
                        if (apiRes.ok) {
                            const resultBlob = await apiRes.blob();
                            const dataUrl = await ApiClient.fileToBase64(resultBlob);
                            
                            sequenceAssets.push({
                                name: savePath,
                                downloadName: frameFileName,
                                label: `${cleanStem} (F${f})`,
                                data: dataUrl,
                                rawData: rawSource
                            });

                            // Live frame preview update
                            previewImg.src = dataUrl;
                            currentFrame = f;
                            scrubber.value = f;
                            updateUI();
                        }
                    }
                }

                cachedSequenceAssets = sequenceAssets;
                renderOverlay.style.display = 'none';
                node.setNodeStatus('completed');

                // Determine folder name from the first asset
                const first = cachedSequenceAssets[0];
                let folderName = (first && first.downloadName) ? first.downloadName.replace(/_\d+\.png$/, '') : 'sequence';
                if (!folderName) folderName = 'sequence';

                // Automatically save unzipped sequence directly into output/assets/[folderName]/
                try {
                    const saveRes = await fetch('http://127.0.0.1:8000/api/save-assets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            assets: cachedSequenceAssets.map(a => ({
                                name: a.downloadName || a.name.split('/').pop(),
                                label: a.label || '',
                                data: a.data
                            })),
                            output_dir: '',
                            source_filename: folderName,
                            source_folder: '',
                            create_subfolder: true
                        })
                    });
                    if (saveRes.ok) {
                        const saveData = await saveRes.json();
                        lastSavedDir = saveData.target_dir;
                    }
                } catch (e) {
                    console.error("Auto direct save error:", e);
                }

                saveFolderBtn.style.display = 'block';
                saveFolderBtn.innerText = '💾 Diske Kaydet';
                if (lastSavedDir) {
                    openFolderBtn.style.display = 'flex';
                    openFolderBtn.innerText = `📂 Klasörü Aç (${folderName}/)`;
                }

                // Forward to downstream connected nodes
                const downstream = window.WiresEngine ? window.WiresEngine.getDownstreamNode(node) : null;
                if (downstream && typeof downstream.setConnectedAssets === 'function') {
                    downstream.setConnectedAssets(sequenceAssets);
                }

                return sequenceAssets;
            } catch (err) {
                console.error("Timeline Sequencer Error:", err);
                renderOverlay.style.display = 'none';
                node.setNodeStatus('error');
                throw err;
            }
        };

        // Render Sequence Button Listener
        runSeqBtn.addEventListener('click', async () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            let assets = (upstream && typeof upstream.getCachedAssets === 'function') ? upstream.getCachedAssets() : inputSourceAssets;
            
            if (!assets || assets.length === 0) {
                alert("Lütfen önce Timeline Sequencer'ın sol pinine bir görsel düğümü (Remove BG veya Batch Loader) bağlayın!");
                return;
            }

            await node.processAssetsDirectly(assets);
        });

        // Save to Folder Button (Explicit Click)
        saveFolderBtn.addEventListener('click', async () => {
            if (!cachedSequenceAssets || cachedSequenceAssets.length === 0) return;
            saveFolderBtn.innerText = '💾 Kaydediliyor...';
            
            const first = cachedSequenceAssets[0];
            let folderName = (first && first.downloadName) ? first.downloadName.replace(/_\d+\.png$/, '') : 'sequence';
            if (!folderName) folderName = 'sequence';

            try {
                const saveRes = await fetch('http://127.0.0.1:8000/api/save-assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assets: cachedSequenceAssets.map(a => ({
                            name: a.downloadName || a.name.split('/').pop(),
                            label: a.label || '',
                            data: a.data
                        })),
                        output_dir: '',
                        source_filename: folderName,
                        source_folder: '',
                        create_subfolder: true
                    })
                });

                if (saveRes.ok) {
                    const saveData = await saveRes.json();
                    lastSavedDir = saveData.target_dir;
                    saveFolderBtn.innerText = '✅ Kaydedildi!';
                    openFolderBtn.style.display = 'flex';
                    openFolderBtn.innerText = `📂 Klasörü Aç (${folderName}/)`;
                    setTimeout(() => { saveFolderBtn.innerText = '💾 Tekrar Kaydet'; }, 2000);
                }
            } catch (e) {
                console.error("Save folder error:", e);
                saveFolderBtn.innerText = '❌ Hata';
            }
        });

        // Open in Explorer
        openFolderBtn.addEventListener('click', async () => {
            if (!lastSavedDir) return;
            try {
                await fetch('http://127.0.0.1:8000/api/open-folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: lastSavedDir })
                });
            } catch (e) {
                console.error("Open folder error:", e);
            }
        });

        node.setConnectedAssets = (assets) => {
            inputSourceAssets = assets || [];
            selectedAssetIdx = 0;
            updateUI();
            if (inputSourceAssets.length > 0) {
                previewContainer.style.display = 'flex';
                previewImg.src = inputSourceAssets[0].data || inputSourceAssets[0].rawData;
            }
            node.setNodeStatus('dirty');
        };

        node.onConnectionChange = () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream && typeof upstream.getCachedAssets === 'function') {
                const assets = upstream.getCachedAssets();
                if (assets && assets.length > 0) {
                    node.setConnectedAssets(assets);
                }
            }
        };

        node.getCachedAssets = () => (cachedSequenceAssets.length > 0 ? cachedSequenceAssets : inputSourceAssets);
        node.isTimelineActive = () => isTimelineActive;

        updateUI();
        return node;
    }
};
