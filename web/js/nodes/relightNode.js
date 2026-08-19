/**
 * =========================================================================
 * NodeAgent Studio - Node: Relight & Atmosphere (IC-Light & Directional Engine)
 * Relights transparent assets & scenes with directional lighting, rim light,
 * atmospheric color grading, and ambient fill.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';
import { ApiClient } from '../core/api.js';

export const RelightNode = {
    type: 'relight',
    title: 'Relight & Atmosphere',
    titleKey: 'node.relight.title',
    subtitle: 'AI Işık & Ortam Aydınlatma',
    subtitleKey: 'node.relight.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'asset-relight',
            title: 'Relight & Atmosphere',
            titleKey: 'node.relight.title',
            subtitle: 'AI Işık & Ortam Aydınlatma',
            subtitleKey: 'node.relight.subtitle',
            x, y,
            width: '310px',
            hasInputPort: true,
            hasOutputPort: true,
            inputPortTitle: 'Giriş: Önceki düğümden resim alır',
            outputPortTitle: 'Çıkış Pini'
        });

        // Set header theme color (Warm Amber/Gold) and model pill
        const header = node.querySelector('.node-header');
        if (header) {
            header.style.backgroundColor = '#b45309';
            const rightContainer = header.querySelector('div:last-child');
            if (rightContainer) {
                const pill = document.createElement('span');
                pill.className = 'model-status-pill';
                pill.style.cssText = 'font-size:10px; padding:2px 7px; border-radius:10px; font-weight:bold; background:#1f2937; color:#94a3b8;';
                pill.innerText = 'Kontrol...';
                rightContainer.insertBefore(pill, rightContainer.querySelector('.close-btn'));
            }
        }

        const content = document.createElement('div');
        content.className = 'node-content';
        content.style.padding = '12px';
        content.innerHTML = `
            <!-- Model Download / Status Card -->
            <div class="model-manager-card" style="display:none; width:100%; background:#0f172a; border:1px solid #334155; border-radius:8px; padding:12px; box-sizing:border-box; text-align:center; margin-bottom:10px;">
                <div style="font-size:13px; font-weight:bold; color:#fbbf24; margin-bottom:4px;">📦 IC-Light</div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;" data-i18n="model.card.desc">Model henüz bilgisayarınızda yüklü değil.</div>
                <button type="button" class="download-model-btn" style="width:100%; padding:8px 12px; background:#b45309; color:white; font-weight:bold; border:none; border-radius:6px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;" data-i18n="model.card.btn_download">
                    📥 Modeli İndir (~1.7 GB)
                </button>
                <div class="model-download-progress" style="display:none; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#38bdf8; font-weight:bold; margin-bottom:4px;">
                        <span class="model-prog-text">İndiriliyor...</span>
                        <span class="model-prog-pct">%0</span>
                    </div>
                    <div style="width:100%; height:6px; background:#1e293b; border-radius:3px; overflow:hidden;">
                        <div class="model-prog-fill" style="width:0%; height:100%; background:#f59e0b; transition:width 0.3s;"></div>
                    </div>
                </div>
                <div class="model-download-error" style="display:none; margin-top:8px; font-size:11px; color:#ef4444;">
                    <div class="error-msg" style="margin-bottom:6px;" data-i18n="model.card.error_msg">İndirme kesildi.</div>
                    <button type="button" class="retry-download-btn" style="background:#dc2626; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer; font-weight:bold;" data-i18n="model.card.btn_retry">🔄 Tekrar Dene</button>
                </div>
            </div>

            <!-- Live Preview / Drop Zone -->
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:4px;">
                <span style="font-size:10px; color:#94a3b8; font-weight:bold;" data-i18n="node.relight.preview">Canlı Önizleme</span>
                <div class="asset-nav-bar" style="display:none; align-items:center; gap:4px;">
                    <button type="button" class="nav-prev-btn" style="background:#1e293b; border:1px solid #334155; color:#f59e0b; font-size:9px; padding:1px 5px; border-radius:3px; cursor:pointer;">◀</button>
                    <span class="asset-count-label" style="font-size:10px; color:#fbbf24; font-weight:bold;">1/1</span>
                    <button type="button" class="nav-next-btn" style="background:#1e293b; border:1px solid #334155; color:#f59e0b; font-size:9px; padding:1px 5px; border-radius:3px; cursor:pointer;">▶</button>
                </div>
            </div>

            <div class="relight-drop-zone drop-zone transparent-bg" style="width:100%; height:140px; border:1px solid #374151; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; margin-bottom:8px; position:relative; cursor:pointer; background-color:#070b12;">
                <span class="relight-placeholder" style="font-size:11px; color:#94a3b8; text-align:center; padding:10px; pointer-events:none;" data-i18n="node.relight.drop_hint">
                    Resmi Buraya Sürükle veya <b style="color:#f59e0b;">Tıkla</b>
                </span>
                <input type="file" class="relight-file-input" accept="image/*" style="display:none;">
                
                <img class="relight-preview-img" style="width:100%; height:100%; object-fit:contain; display:none; position:relative; z-index:2;" src="">

                <!-- Pipeline Connected Pulsing Play Status Overlay -->
                <div class="pipeline-status" style="display:none;">
                    <div style="font-size:12px; color:#38bdf8; font-weight:700;" data-i18n="node.relight.conn_active">🔍— Bağlantı Aktif</div>
                    <div class="play-btn-connected pulse-btn" title="Işıklandırmayı Başlat" style="background:#b45309; border-color:#fbbf24;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left:3px;"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <button type="button" class="run-pipeline-btn" style="background:#b45309; color:white; border:1px solid #fbbf24; border-radius:4px; padding:5px 14px; font-size:11px; font-weight:800; cursor:pointer;" data-i18n="node.relight.btn_run_pipeline">
                        ⚡ TÜM AKIŞI ÇALIŞTIR
                    </button>
                </div>

                <div class="relight-loader loader" style="position:absolute; z-index:5;"></div>
                <div class="relight-progress-text progress-text" style="display:none; position:absolute; bottom:6px; font-size:10px; color:#fbbf24; background:rgba(0,0,0,0.85); padding:2px 8px; border-radius:4px; font-weight:bold; z-index:6;">💡 Işıklandırılıyor...</div>
            </div>

            <!-- Engine Mode Selector -->
            <div style="margin-bottom:8px; width:100%;">
                <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;" data-i18n="node.relight.engine_label">İşleme Motoru / AI Modu:</div>
                <select class="relight-engine-select" style="width:100%; background:#030712; border:1px solid #4b5563; border-radius:4px; color:#fbbf24; font-weight:bold; padding:5px 8px; font-size:10px; cursor:pointer; outline:none;">
                    <option value="fast" selected data-i18n="node.relight.engine_fast">⚡ Hızlı Mod (Real-time Shader - 0.05 sn)</option>
                    <option value="ai" data-i18n="node.relight.engine_ai">🧠 Derin AI Modu (IC-Light Diffusion)</option>
                </select>
            </div>

            <!-- Lighting Presets -->
            <div style="margin-bottom:8px; width:100%;">
                <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;" data-i18n="node.relight.preset_label">Işık Teması / Preset:</div>
                <select class="relight-preset-select" style="width:100%; background:#0f172a; border:1px solid #334155; color:#fbbf24; font-size:11px; padding:5px 8px; border-radius:4px; outline:none; font-weight:bold; cursor:pointer;">
                    <option value="custom" selected data-i18n="node.relight.preset_custom">🎨 Özel / Manuel Ayar</option>
                    <option value="golden_hour" data-i18n="node.relight.preset_golden">🌅 Golden Hour (Gün Batımı)</option>
                    <option value="cyberpunk" data-i18n="node.relight.preset_cyberpunk">🟣 Cyberpunk Neon (Cyan/Pembe)</option>
                    <option value="studio" data-i18n="node.relight.preset_studio">📸 Studio Softbox (Doğal)</option>
                    <option value="moonlight" data-i18n="node.relight.preset_moonlight">🌙 Moonlight (Gece Mavisi)</option>
                    <option value="rim_light" data-i18n="node.relight.preset_rim">⚡ Rim Light (Arka Vurgu)</option>
                    <option value="dramatic" data-i18n="node.relight.preset_dramatic">🎭 Dramatic (Yüksek Kontrast)</option>
                </select>
            </div>

            <!-- 3D Orbit Viewport & Degree (Derece °) Dashboard -->
            <div style="display:flex; gap:8px; margin-bottom:8px; width:100%; align-items:center; background:#090d16; padding:6px; border-radius:6px; border:1px solid #1e293b;">
                <!-- Interactive 3D Degree Compass Viewport -->
                <div style="display:flex; flex-direction:column; align-items:center; width:84px;">
                    <div style="font-size:9px; color:#94a3b8; margin-bottom:2px; font-weight:bold;">3D DERECE (°)</div>
                    <div style="position:relative; width:74px; height:74px; border-radius:6px; box-shadow:inset 0 0 10px rgba(0,0,0,0.8); cursor:crosshair; background:#020617; border:1px solid #334155; overflow:hidden;" title="Pusula üzerinde farenizle derece açısını döndürün">
                        <canvas class="relight-sphere-canvas" width="74" height="74" style="width:74px; height:74px; display:block;"></canvas>
                    </div>
                    <span class="relight-angle-label" style="font-size:8px; color:#fbbf24; font-family:monospace; margin-top:2px; font-weight:bold; text-align:center; white-space:nowrap;">180° Sol</span>
                </div>

                <!-- Precision Degree Sliders (Azimuth / Elevation / Depth) -->
                <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                    <!-- Yatay Açı (Azimuth / Yaw: 0° - 360°) -->
                    <div style="display:flex; align-items:center; gap:3px;">
                        <span style="font-size:9px; color:#f87171; font-weight:bold; width:34px;" title="Yatay Dönüş Açısı (0° - 360°)">Yatay:</span>
                        <input type="range" class="relight-yaw-slider" min="0" max="360" value="180" style="flex:1; accent-color:#f87171; height:3px; cursor:pointer;">
                        <span class="yaw-val" style="font-size:9px; color:#f87171; font-family:monospace; width:28px; text-align:right;">180°</span>
                    </div>

                    <!-- Dikey Eğim (Elevation / Pitch: -90° ... +90°) -->
                    <div style="display:flex; align-items:center; gap:3px;">
                        <span style="font-size:9px; color:#4ade80; font-weight:bold; width:34px;" title="Dikey Yükseklik Açısı (-90° Alttan ... +90° Üstten)">Dikey:</span>
                        <input type="range" class="relight-pitch-slider" min="-90" max="90" value="0" style="flex:1; accent-color:#4ade80; height:3px; cursor:pointer;">
                        <span class="pitch-val" style="font-size:9px; color:#4ade80; font-family:monospace; width:28px; text-align:right;">0°</span>
                    </div>

                    <!-- Ön-Arka Derinlik (Depth: -90° Arka ... +90° Ön) -->
                    <div style="display:flex; align-items:center; gap:3px;">
                        <span style="font-size:9px; color:#38bdf8; font-weight:bold; width:34px;" title="Ön / Arka Derinlik Açısı (-90° Arka Silüet ... +90° Ön)">Derin:</span>
                        <input type="range" class="relight-depth-slider" min="-90" max="90" value="30" style="flex:1; accent-color:#38bdf8; height:3px; cursor:pointer;">
                        <span class="depth-val" style="font-size:9px; color:#38bdf8; font-family:monospace; width:28px; text-align:right;">+30°</span>
                    </div>

                    <!-- Color, Intensity & Ambient Row -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                        <div style="display:flex; align-items:center; gap:3px;">
                            <span style="font-size:9px; color:#cbd5e1; font-weight:bold;">Renk:</span>
                            <input type="color" class="relight-color" value="#ffffff" style="width:18px; height:16px; border:none; padding:0; background:transparent; cursor:pointer;">
                        </div>
                        <div style="display:flex; align-items:center; gap:3px;">
                            <span style="font-size:9px; color:#94a3b8;">Şiddet:</span>
                            <input type="range" class="relight-intensity" min="10" max="200" value="100" style="width:36px; accent-color:#f59e0b; height:3px; cursor:pointer;">
                            <span class="intensity-val" style="font-size:8px; color:#cbd5e1;">100%</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:3px;">
                            <span style="font-size:9px; color:#94a3b8;">Ortam:</span>
                            <input type="range" class="relight-ambient" min="0" max="100" value="35" style="width:36px; accent-color:#f59e0b; height:3px; cursor:pointer;">
                            <span class="ambient-val" style="font-size:8px; color:#cbd5e1;">35%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons: Run / Re-Run & Download -->
            <div style="display:flex; gap:6px; width:100%; flex-wrap:wrap;">
                <button type="button" class="run-relight-btn" style="flex:1; min-width:120px; padding:7px 10px; background:#b45309; border:1px solid #fbbf24; border-radius:5px; color:white; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;" data-i18n="node.relight.btn_run">
                    ⚡ Işıklandır
                </button>
                <button type="button" class="download-relight-btn" style="display:none; padding:7px 10px; background:#1e293b; border:1px solid #f59e0b; border-radius:5px; color:#fbbf24; font-size:11px; font-weight:bold; cursor:pointer;" data-i18n="node.relight.btn_download">
                    ⬇ İndir
                </button>
                <button type="button" class="download-all-relight-btn" style="display:none; padding:7px 10px; background:#1e293b; border:1px solid #10b981; border-radius:5px; color:#34d399; font-size:11px; font-weight:bold; cursor:pointer;" data-i18n="node.relight.btn_download_all">
                    📥 Tümünü İndir
                </button>
            </div>
        `;
        node.appendChild(content);

        // Setup Model Manager for IC-Light
        BaseNode.setupModelManager(node, 'iclight', 'IC-Light');

        // Elements
        const dropZone = node.querySelector('.relight-drop-zone');
        const placeholder = node.querySelector('.relight-placeholder');
        const previewImg = node.querySelector('.relight-preview-img');
        const loader = node.querySelector('.relight-loader');
        const progressText = node.querySelector('.relight-progress-text');
        const fileInput = node.querySelector('.relight-file-input');
        const runBtn = node.querySelector('.run-relight-btn');
        const downloadBtn = node.querySelector('.download-relight-btn');
        const downloadAllBtn = node.querySelector('.download-all-relight-btn');
        const pipelineStatus = node.querySelector('.pipeline-status');
        const playBtnConnected = node.querySelector('.play-btn-connected');
        const runPipelineBtn = node.querySelector('.run-pipeline-btn');

        const engineSelect = node.querySelector('.relight-engine-select');
        const presetSelect = node.querySelector('.relight-preset-select');
        const sphereCanvas = node.querySelector('.relight-sphere-canvas');
        const angleLabel = node.querySelector('.relight-angle-label');
        
        const yawSlider = node.querySelector('.relight-yaw-slider');
        const yawVal = node.querySelector('.yaw-val');
        const pitchSlider = node.querySelector('.relight-pitch-slider');
        const pitchVal = node.querySelector('.pitch-val');
        const depthSlider = node.querySelector('.relight-depth-slider');
        const depthVal = node.querySelector('.depth-val');

        const colorInput = node.querySelector('.relight-color');
        const intensitySlider = node.querySelector('.relight-intensity');
        const intensityVal = node.querySelector('.intensity-val');
        const ambientSlider = node.querySelector('.relight-ambient');
        const ambientVal = node.querySelector('.ambient-val');

        const navBar = node.querySelector('.asset-nav-bar');
        const navPrevBtn = node.querySelector('.nav-prev-btn');
        const navNextBtn = node.querySelector('.nav-next-btn');
        const assetCountLabel = node.querySelector('.asset-count-label');

        // State (Spherical Degrees & Cartesian Vectors)
        let lightYawDeg = 180;   // 0° to 360° (0=Sağ, 90=Alt, 180=Sol, 270=Üst)
        let lightPitchDeg = 0;   // -90° to +90° (Dikey Eğim)
        let lightDepthDeg = 30;  // -90° (Arka Rim) to +90° (Ön)
        
        let lightDirX = -0.85;
        let lightDirY = 0.0;
        let lightDirZ = 0.5;
        let currentDirection = 'left';
        let currentSeed = 12345;
        let previewDebounce = null;
        let loadedAssets = [];
        let processedRelitAssets = [];
        let activeAssetIndex = 0;
        let lastRelitDataUrl = null;
        let originalImageBlob = null;

        node.hasImage = () => originalImageBlob !== null;

        function updateVectorsFromDegrees() {
            const radYaw = (lightYawDeg * Math.PI) / 180.0;
            const radPitch = (lightPitchDeg * Math.PI) / 180.0;
            const radDepth = (lightDepthDeg * Math.PI) / 180.0;

            const horizScale = Math.cos(radPitch);
            lightDirX = Math.cos(radYaw) * horizScale;
            lightDirY = Math.sin(radYaw) * horizScale;
            lightDirZ = Math.sin(radDepth);
            
            // Map to named direction for presets
            if (lightDepthDeg < -35) {
                currentDirection = 'rim';
            } else if (lightPitchDeg > 55) {
                currentDirection = 'top';
            } else if (lightPitchDeg < -55) {
                currentDirection = 'bottom';
            } else {
                if (lightYawDeg >= 337.5 || lightYawDeg < 22.5) currentDirection = 'right';
                else if (lightYawDeg >= 22.5 && lightYawDeg < 67.5) currentDirection = 'bottom_right';
                else if (lightYawDeg >= 67.5 && lightYawDeg < 112.5) currentDirection = 'bottom';
                else if (lightYawDeg >= 112.5 && lightYawDeg < 157.5) currentDirection = 'bottom_left';
                else if (lightYawDeg >= 157.5 && lightYawDeg < 202.5) currentDirection = 'left';
                else if (lightYawDeg >= 202.5 && lightYawDeg < 247.5) currentDirection = 'top_left';
                else if (lightYawDeg >= 247.5 && lightYawDeg < 292.5) currentDirection = 'top';
                else currentDirection = 'top_right';
            }
        }

        // 3D Degree Compass & Orbit Gizmo Renderer
        function renderSphereGizmo() {
            if (!sphereCanvas) return;
            const ctx = sphereCanvas.getContext('2d');
            const w = sphereCanvas.width;
            const h = sphereCanvas.height;
            const r = w / 2 - 6;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Sync Sliders & Displays
            if (yawSlider && yawVal) {
                yawSlider.value = Math.round(lightYawDeg);
                yawVal.innerText = `${Math.round(lightYawDeg)}°`;
            }
            if (pitchSlider && pitchVal) {
                pitchSlider.value = Math.round(lightPitchDeg);
                const pSign = lightPitchDeg >= 0 ? '+' : '';
                pitchVal.innerText = `${pSign}${Math.round(lightPitchDeg)}°`;
            }
            if (depthSlider && depthVal) {
                depthSlider.value = Math.round(lightDepthDeg);
                const dSign = lightDepthDeg >= 0 ? '+' : '';
                depthVal.innerText = `${dSign}${Math.round(lightDepthDeg)}°`;
            }

            // 3D Compass Sphere Base
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = '#060a12';
            ctx.fill();

            // Degree Cardinal Ticks (0° Sağ, 90° Alt, 180° Sol, 270° Üst)
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.lineWidth = 1;
            for (let a = 0; a < 360; a += 45) {
                const rad = (a * Math.PI) / 180.0;
                const tx1 = cx + Math.cos(rad) * (r - 3);
                const ty1 = cy + Math.sin(rad) * (r - 3);
                const tx2 = cx + Math.cos(rad) * r;
                const ty2 = cy + Math.sin(rad) * r;
                ctx.beginPath();
                ctx.moveTo(tx1, ty1);
                ctx.lineTo(tx2, ty2);
                ctx.stroke();
            }

            // 3D Coordinate Grid (Equator & Meridian)
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 0.35, r, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Outer Sphere Ring
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // 3D Light Position
            const lx = cx + lightDirX * (r * 0.82);
            const ly = cy + lightDirY * (r * 0.82);
            const hexCol = colorInput ? colorInput.value : '#ffffff';

            // Light Ray
            ctx.beginPath();
            if (lightDepthDeg < 0) {
                ctx.setLineDash([2, 2]);
                ctx.strokeStyle = 'rgba(232, 121, 249, 0.75)';
            } else {
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
            }
            ctx.moveTo(cx, cy);
            ctx.lineTo(lx, ly);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // 3D Orbiting Sun/Bulb Indicator
            const isBack = lightDepthDeg < 0;
            const orbRadius = !isBack ? (4.5 + (lightDepthDeg / 90.0) * 2.5) : (4.0 - (Math.abs(lightDepthDeg) / 90.0) * 1.5);
            
            ctx.beginPath();
            ctx.arc(lx, ly, orbRadius, 0, Math.PI * 2);
            if (!isBack) {
                ctx.fillStyle = hexCol;
                ctx.shadowColor = hexCol;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(232, 121, 249, 0.35)';
                ctx.fill();
                ctx.strokeStyle = '#e879f9';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Origin Marker
            ctx.beginPath();
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fill();

            // Update Label
            if (angleLabel) {
                let dirName = 'Özel';
                if (lightDepthDeg < -45) dirName = 'Arka Silüet';
                else if (lightYawDeg >= 337.5 || lightYawDeg < 22.5) dirName = 'Sağ';
                else if (lightYawDeg >= 22.5 && lightYawDeg < 67.5) dirName = 'Sağ-Alt';
                else if (lightYawDeg >= 67.5 && lightYawDeg < 112.5) dirName = 'Alt';
                else if (lightYawDeg >= 112.5 && lightYawDeg < 157.5) dirName = 'Sol-Alt';
                else if (lightYawDeg >= 157.5 && lightYawDeg < 202.5) dirName = 'Sol';
                else if (lightYawDeg >= 202.5 && lightYawDeg < 247.5) dirName = 'Sol-Üst';
                else if (lightYawDeg >= 247.5 && lightYawDeg < 292.5) dirName = 'Üst';
                else dirName = 'Sağ-Üst';

                angleLabel.innerText = `${Math.round(lightYawDeg)}° ${dirName}`;
                angleLabel.style.color = isBack ? '#e879f9' : '#fbbf24';
            }
        }

        // Degree Slider Handlers
        function handleDegreeSliders() {
            if (yawSlider) lightYawDeg = parseFloat(yawSlider.value);
            if (pitchSlider) lightPitchDeg = parseFloat(pitchSlider.value);
            if (depthSlider) lightDepthDeg = parseFloat(depthSlider.value);
            updateVectorsFromDegrees();
            renderSphereGizmo();
            node.setNodeStatus('dirty');
            triggerPreview();
        }

        if (yawSlider) yawSlider.addEventListener('input', handleDegreeSliders);
        if (pitchSlider) pitchSlider.addEventListener('input', handleDegreeSliders);
        if (depthSlider) depthSlider.addEventListener('input', handleDegreeSliders);

        // Canvas Mouse Dragging -> Degree Conversion
        let isDraggingSphere = false;
        function updateLightFromEvent(e) {
            if (!sphereCanvas) return;
            const rect = sphereCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const r = rect.width / 2;

            let dx = (x - cx) / r;
            let dy = (y - cy) / r;
            const dist = Math.min(1.0, Math.sqrt(dx * dx + dy * dy));

            let deg = Math.round((Math.atan2(dy, dx) * 180.0) / Math.PI);
            if (deg < 0) deg += 360;
            lightYawDeg = deg % 360;
            lightPitchDeg = Math.round((1.0 - dist) * 90.0 * (dy < 0 ? 1 : -1));

            updateVectorsFromDegrees();
            renderSphereGizmo();
            node.setNodeStatus('dirty');
            triggerPreview();
        }

        if (sphereCanvas) {
            sphereCanvas.addEventListener('mousedown', (e) => {
                if (e.button === 2) { // Right click flips depth angle
                    e.preventDefault();
                    lightDepthDeg = -lightDepthDeg;
                    updateVectorsFromDegrees();
                    renderSphereGizmo();
                    node.setNodeStatus('dirty');
                    triggerPreview();
                    return;
                }
                isDraggingSphere = true;
                updateLightFromEvent(e);
            });
            sphereCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
            sphereCanvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                lightDepthDeg = Math.max(-90, Math.min(90, lightDepthDeg + (e.deltaY < 0 ? 10 : -10)));
                updateVectorsFromDegrees();
                renderSphereGizmo();
                node.setNodeStatus('dirty');
                triggerPreview();
            });
            window.addEventListener('mousemove', (e) => {
                if (isDraggingSphere) updateLightFromEvent(e);
            });
            window.addEventListener('mouseup', () => {
                isDraggingSphere = false;
            });
            updateVectorsFromDegrees();
            renderSphereGizmo();
        }

        // Export Keyframing & Animation API in Degrees
        node.getLight3DState = () => ({
            yaw: lightYawDeg,
            pitch: lightPitchDeg,
            depth: lightDepthDeg,
            x: lightDirX,
            y: lightDirY,
            z: lightDirZ,
            intensity: intensitySlider ? (parseFloat(intensitySlider.value) / 100.0) : 1.0,
            ambient: ambientSlider ? (parseFloat(ambientSlider.value) / 100.0) : 0.35,
            color: colorInput ? colorInput.value : '#ffffff',
            preset: presetSelect ? presetSelect.value : 'custom',
            engine: engineSelect ? engineSelect.value : 'fast',
            seed: currentSeed
        });

        node.setLight3DState = (state) => {
            if (!state) return;
            if (state.yaw !== undefined) lightYawDeg = state.yaw;
            if (state.pitch !== undefined) lightPitchDeg = state.pitch;
            if (state.depth !== undefined) lightDepthDeg = state.depth;
            if (state.intensity !== undefined && intensitySlider) intensitySlider.value = Math.round(state.intensity * 100);
            if (state.ambient !== undefined && ambientSlider) ambientSlider.value = Math.round(state.ambient * 100);
            if (state.color && colorInput) colorInput.value = state.color;
            if (state.preset && presetSelect) presetSelect.value = state.preset;
            if (state.engine && engineSelect) engineSelect.value = state.engine;
            updateVectorsFromDegrees();
            renderSphereGizmo();
            node.setNodeStatus('dirty');
            triggerPreview();
        };

        // Engine, Sliders & Preset Listeners
        if (engineSelect) {
            engineSelect.addEventListener('change', () => {
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        }

        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        }

        if (colorInput) {
            colorInput.addEventListener('input', () => {
                if (presetSelect) presetSelect.value = 'custom';
                renderSphereGizmo();
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        }

        if (intensitySlider && intensityVal) {
            intensitySlider.addEventListener('input', () => {
                intensityVal.innerText = `${intensitySlider.value}%`;
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        }

        if (ambientSlider && ambientVal) {
            ambientSlider.addEventListener('input', () => {
                ambientVal.innerText = `${ambientSlider.value}%`;
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        }

        // Asset Navigation
        function updateNavUI() {
            if (loadedAssets.length > 1) {
                navBar.style.display = 'flex';
                assetCountLabel.innerText = `${activeAssetIndex + 1}/${loadedAssets.length}`;
            } else {
                navBar.style.display = 'none';
            }
        }

        navPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (loadedAssets.length > 1) {
                activeAssetIndex = (activeAssetIndex - 1 + loadedAssets.length) % loadedAssets.length;
                updateNavUI();
                triggerPreview();
            }
        });

        navNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (loadedAssets.length > 1) {
                activeAssetIndex = (activeAssetIndex + 1) % loadedAssets.length;
                updateNavUI();
                triggerPreview();
            }
        });

        // Direct File Drag & Drop
        async function handleDirectFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            originalImageBlob = file;
            const dataUrl = await ApiClient.fileToBase64(file);
            loadedAssets = [{
                name: file.name,
                label: 'single',
                data: dataUrl,
                rawData: dataUrl
            }];
            activeAssetIndex = 0;
            updateNavUI();
            node.setNodeStatus('dirty');
            triggerPreview();
        }

        dropZone.addEventListener('click', (e) => {
            if (e.target.closest('.nav-prev-btn') || e.target.closest('.nav-next-btn') || e.target.closest('.loader') || e.target.closest('.play-btn-connected') || e.target.closest('.run-pipeline-btn')) return;
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (!upstream && fileInput) {
                fileInput.click();
            }
        });

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleDirectFile(e.target.files[0]);
                }
            });
        }

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleDirectFile(e.dataTransfer.files[0]);
            }
        });

        // Connected Play Buttons
        if (playBtnConnected) {
            playBtnConnected.addEventListener('click', (e) => {
                e.stopPropagation();
                runBtn.click();
            });
        }
        if (runPipelineBtn) {
            runPipelineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                runBtn.click();
            });
        }

        // Upstream connection hook
        node.onConnectionChange = () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream) {
                runBtn.innerHTML = window.i18n ? window.i18n.t('node.relight.btn_run_pipeline') : '⚡ TÜM AKIŞI ÇALIŞTIR';
                if (typeof upstream.getCachedAssets === 'function') {
                    const upstreamAssets = upstream.getCachedAssets();
                    if (upstreamAssets && upstreamAssets.length > 0) {
                        if (pipelineStatus) pipelineStatus.style.display = 'none';
                        node.processAssetsDirectly(upstreamAssets);
                        return;
                    }
                }
                if (loadedAssets.length === 0) {
                    if (pipelineStatus) pipelineStatus.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                }
            } else {
                runBtn.innerHTML = window.i18n ? window.i18n.t('node.relight.btn_run') : '⚡ Işıklandır';
                if (pipelineStatus) pipelineStatus.style.display = 'none';
                if (loadedAssets.length === 0) {
                    if (placeholder) {
                        placeholder.style.display = 'block';
                        placeholder.innerHTML = window.i18n ? window.i18n.t('node.relight.drop_hint') : 'Resmi Buraya Sürükle veya Tıkla';
                    }
                    if (previewImg) previewImg.style.display = 'none';
                    if (downloadBtn) downloadBtn.style.display = 'none';
                    if (downloadAllBtn) downloadAllBtn.style.display = 'none';
                }
            }
        };

        // Live Preview Execution
        async function triggerPreview() {
            if (loadedAssets.length === 0) return;
            const targetAsset = loadedAssets[activeAssetIndex];
            if (!targetAsset || !targetAsset.data) return;

            clearTimeout(previewDebounce);
            previewDebounce = setTimeout(async () => {
                loader.style.display = 'block';
                if (progressText) {
                    progressText.style.display = 'block';
                    progressText.innerText = '💡 Işık & Atmosfer Hesaplanıyor...';
                }
                if (pipelineStatus) pipelineStatus.style.display = 'none';
                placeholder.style.display = 'none';
                previewImg.style.display = 'block';
                previewImg.style.opacity = '0.3';

                try {
                    const fd = new FormData();
                    const rawSource = targetAsset.rawData || targetAsset.data;
                    const res = await fetch(rawSource);
                    const blob = await res.blob();

                    fd.append('file', blob, targetAsset.name || 'preview.png');
                    fd.append('light_direction', currentDirection);
                    fd.append('light_x', lightDirX);
                    fd.append('light_y', lightDirY);
                    fd.append('light_z', lightDirZ);
                    fd.append('seed', currentSeed);
                    fd.append('light_color', colorInput ? colorInput.value : '#ffffff');
                    fd.append('intensity', intensitySlider ? (parseFloat(intensitySlider.value) / 100.0) : 1.0);
                    fd.append('ambient_level', ambientSlider ? (parseFloat(ambientSlider.value) / 100.0) : 0.35);
                    fd.append('prompt_preset', presetSelect ? presetSelect.value : 'custom');
                    fd.append('engine', engineSelect ? engineSelect.value : 'fast');

                    const apiRes = await fetch('http://127.0.0.1:8000/api/relight', { method: 'POST', body: fd });
                    if (apiRes.ok) {
                        const resultBlob = await apiRes.blob();
                        lastRelitDataUrl = await ApiClient.fileToBase64(resultBlob);
                        previewImg.src = lastRelitDataUrl;
                        previewImg.style.opacity = '1';
                        downloadBtn.style.display = 'block';
                        node.setNodeStatus('completed');

                        // Forward to downstream connected preview nodes (e.g. Resize & Align)
                        const forwardAsset = [{
                            name: targetAsset.name || 'relit.png',
                            label: targetAsset.label || 'relit',
                            data: lastRelitDataUrl
                        }];
                        processedRelitAssets = forwardAsset;
                        const connectedTargets = window.WiresEngine ? window.WiresEngine.getConnectedNodes(node) : [];
                        if (connectedTargets.length > 0) {
                            connectedTargets.forEach(targetNode => {
                                if (targetNode.dataset.nodeType !== 'auto-save' && typeof targetNode.processAssetsDirectly === 'function') {
                                    targetNode.processAssetsDirectly(forwardAsset);
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error("Relight preview error", e);
                    node.setNodeStatus('error');
                } finally {
                    loader.style.display = 'none';
                    if (progressText) progressText.style.display = 'none';
                }
            }, 300);
        }

        // Run Button Handler
        runBtn.addEventListener('click', async () => {
            if (loadedAssets.length > 0) {
                node.setNodeStatus('running');
                triggerPreview();
                return;
            }

            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream) {
                const check = BaseNode.validateChainInput(node);
                if (!check.valid) {
                    node.setNodeStatus('idle');
                    alert(check.message);
                    return;
                }

                node.setNodeStatus('running');
                try {
                    const assets = await BaseNode.pullUpstreamAssets(node);
                    if (assets && assets.length > 0) {
                        await node.processAssetsDirectly(assets);
                        return;
                    } else {
                        node.setNodeStatus('idle');
                        return;
                    }
                } catch (err) {
                    console.error("Relight pull error:", err);
                    node.setNodeStatus('error');
                    alert((window.i18n ? window.i18n.t('node.relight.alert_pipeline_error') : "Akış Hatası: ") + err.message);
                    return;
                }
            }

            node.setNodeStatus('idle');
            alert(window.i18n ? window.i18n.t('node.relight.alert_no_input') : "Lütfen önce Relight düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!");
        });

        // Single Image Download
        downloadBtn.addEventListener('click', () => {
            if (!lastRelitDataUrl) return;
            const currentAsset = loadedAssets[activeAssetIndex];
            const baseName = currentAsset && currentAsset.name ? currentAsset.name.replace(/\.[^/.]+$/, "") : 'relit';
            const a = document.createElement('a');
            a.href = lastRelitDataUrl;
            a.download = `${baseName}_relit_${currentDirection}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        // Download All Relit Assets
        downloadAllBtn.addEventListener('click', () => {
            const assetsToDownload = (processedRelitAssets && processedRelitAssets.length > 0) ? processedRelitAssets : loadedAssets;
            if (!assetsToDownload || assetsToDownload.length === 0) return;

            assetsToDownload.forEach((item, idx) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = item.data;
                    const base = (item.name || `asset_${idx + 1}`).replace(/\.[^/.]+$/, "");
                    a.download = `${base}_relit_${currentDirection}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, idx * 200);
            });
        });

        node.getCachedAssets = () => (processedRelitAssets.length > 0 ? processedRelitAssets : loadedAssets);

        // Pipeline Batch Processing
        node.processAssetsDirectly = async (assets) => {
            if (!assets || assets.length === 0) return [];
            node.setNodeStatus('running');
            loader.style.display = 'block';

            loadedAssets = assets.map(a => ({
                name: a.name,
                label: a.label,
                data: a.data,
                rawData: a.rawData || a.data
            }));
            activeAssetIndex = assets.length - 1;
            updateNavUI();

            let final_assets = [];
            for (let i = 0; i < assets.length; i++) {
                const ast = assets[i];
                if (progressText) {
                    progressText.style.display = 'block';
                    progressText.innerText = `💡 [${i+1}/${assets.length}] ${ast.name || 'Görsel'} Işıklandırılıyor...`;
                }

                const fd = new FormData();
                const rawSource = ast.rawData || ast.data;
                const res = await fetch(rawSource);
                const blob = await res.blob();
                fd.append('file', blob, ast.name);
                fd.append('light_direction', currentDirection);
                fd.append('light_x', lightDirX);
                fd.append('light_y', lightDirY);
                fd.append('light_z', lightDirZ);
                fd.append('seed', currentSeed);
                fd.append('light_color', colorInput ? colorInput.value : '#ffffff');
                fd.append('intensity', intensitySlider ? (parseFloat(intensitySlider.value) / 100.0) : 1.0);
                fd.append('ambient_level', ambientSlider ? (parseFloat(ambientSlider.value) / 100.0) : 0.35);
                fd.append('prompt_preset', presetSelect ? presetSelect.value : 'custom');
                fd.append('engine', engineSelect ? engineSelect.value : 'fast');

                try {
                    const apiRes = await fetch('http://127.0.0.1:8000/api/relight', { method: 'POST', body: fd });
                    if (apiRes.ok) {
                        const resultBlob = await apiRes.blob();
                        const dataUrl = await ApiClient.fileToBase64(resultBlob);
                        final_assets.push({
                            name: ast.name.replace(/\.[^/.]+$/, "") + `_relit.png`,
                            label: ast.label,
                            data: dataUrl
                        });

                        if (i === activeAssetIndex) {
                            lastRelitDataUrl = dataUrl;
                            placeholder.style.display = 'none';
                            previewImg.src = dataUrl;
                            previewImg.style.display = 'block';
                            previewImg.style.opacity = '1';
                            downloadBtn.style.display = 'block';
                        }
                    }
                } catch (e) {
                    console.error("Relight pipeline error", e);
                }
            }

            loader.style.display = 'none';
            if (progressText) progressText.style.display = 'none';

            processedRelitAssets = final_assets;
            if (final_assets.length > 1) {
                downloadAllBtn.style.display = 'block';
            } else {
                downloadAllBtn.style.display = 'none';
            }

            node.setNodeStatus('completed');

            // Forward to downstream connected preview nodes (e.g. Resize & Align, Auto Save)
            const connectedTargets = window.WiresEngine ? window.WiresEngine.getConnectedNodes(node) : [];
            if (connectedTargets.length > 0 && final_assets.length > 0) {
                connectedTargets.forEach(targetNode => {
                    if (targetNode.dataset.nodeType !== 'auto-save' && typeof targetNode.processAssetsDirectly === 'function') {
                        targetNode.processAssetsDirectly(final_assets);
                    }
                });
            }

            return final_assets;
        };

        node.getRelightSettings = () => {
            const intensitySlider = node.querySelector('.intensity-slider');
            const ambientSlider = node.querySelector('.ambient-slider');
            const colorPicker = node.querySelector('.light-color-picker');
            const promptPreset = node.querySelector('.prompt-preset-select');
            const engineSelect = node.querySelector('.engine-mode-select');
            return {
                intensity: intensitySlider ? (parseFloat(intensitySlider.value) / 100.0) : 1.0,
                ambient_level: ambientSlider ? (parseFloat(ambientSlider.value) / 100.0) : 0.35,
                light_color: colorPicker ? colorPicker.value : '#ffffff',
                prompt_preset: promptPreset ? promptPreset.value : 'custom',
                engine: engineSelect ? engineSelect.value : 'fast'
            };
        };

        return node;
    }
};
