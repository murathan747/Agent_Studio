/**
 * =========================================================================
 * NodeAgent Studio - Node: Remove Background
 * BiRefNet AI Smart Matting, Color Keying, Halo Defringing and Alpha Masking.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';
import { ApiClient } from '../core/api.js';

export const RemoveBgNode = {
    type: 'remove-bg',
    title: 'Remove Background',
    titleKey: 'node.remove_bg.title',
    subtitle: 'AI Arka Plan Temizleme',
    subtitleKey: 'node.remove_bg.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'remove-bg',
            title: 'Remove Background',
            titleKey: 'node.remove_bg.title',
            subtitle: 'AI Arka Plan Temizleme',
            subtitleKey: 'node.remove_bg.subtitle',
            x, y,
            width: '320px',
            hasInputPort: true,
            hasOutputPort: true,
            inputPortTitle: 'Giriş Pini: Tıklayarak veya sürükleyerek bağlayın',
            outputPortTitle: 'Çıkış: Şeffaf asset\'leri iletir'
        });

        // Header style and model pill
        const header = node.querySelector('.node-header');
        if (header) {
            header.style.backgroundColor = '#134e4a';
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
        content.innerHTML = `
            <!-- Model Download / Status Card -->
            <div class="model-manager-card" style="display:none; width:100%; background:#0f172a; border:1px solid #334155; border-radius:8px; padding:12px; box-sizing:border-box; text-align:center; margin-bottom:10px;">
                <div style="font-size:13px; font-weight:bold; color:#f59e0b; margin-bottom:4px;">📦 BiRefNet</div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;" data-i18n="model.card.desc">Model henüz bilgisayarınızda yüklü değil.</div>
                <button type="button" class="download-model-btn" style="width:100%; padding:8px 12px; background:#059669; color:white; font-weight:bold; border:none; border-radius:6px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;" data-i18n="model.card.btn_download">
                    📥 Modeli İndir
                </button>
                <div class="model-download-progress" style="display:none; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#38bdf8; font-weight:bold; margin-bottom:4px;">
                        <span class="model-prog-text">İndiriliyor...</span>
                        <span class="model-prog-pct">%0</span>
                    </div>
                    <div style="width:100%; height:6px; background:#1e293b; border-radius:3px; overflow:hidden;">
                        <div class="model-prog-fill" style="width:0%; height:100%; background:#38bdf8; transition:width 0.3s;"></div>
                    </div>
                </div>
                <div class="model-download-error" style="display:none; margin-top:8px; font-size:11px; color:#ef4444;">
                    <div class="error-msg" style="margin-bottom:6px;" data-i18n="model.card.error_msg">İndirme kesildi.</div>
                    <button type="button" class="retry-download-btn" style="background:#dc2626; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer; font-weight:bold;" data-i18n="model.card.btn_retry">🔄 Tekrar Dene</button>
                </div>
            </div>

            <div class="drop-zone" style="cursor:pointer;">
                <span class="placeholder-text">Resmi Buraya Sürükle veya <b style="color:#34d399;">Tıkla</b></span>
                <input type="file" class="single-file-input" accept="image/*" style="display:none;">
                <img src="" alt="preview">
                <div class="play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                <div class="pipeline-status" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:#0f172a; z-index:10; border-radius:6px; padding:10px; box-sizing:border-box;">
                    <div style="font-size:12px; color:#38bdf8; font-weight:700;">🔍— Bağlantı Aktif</div>
                    <div class="play-btn-connected pulse-btn" style="width:48px; height:48px; background:#059669; border:3px solid #34d399; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left:3px;"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <button type="button" class="run-pipeline-btn" style="background:#059669; color:white; border:1px solid #34d399; border-radius:4px; padding:5px 14px; font-size:11px; font-weight:800; cursor:pointer;">
                        TÜM AKIŞI BAŞLAT
                    </button>
                </div>
                <div class="loader"></div>
                <div class="progress-text">Hazırlanıyor...</div>
            </div>

            <!-- Collapsible Settings Toggle Button -->
            <button class="toggle-settings-btn" type="button">
                <span data-i18n="node.remove_bg.settings_toggle">⚙️ İnce Kenar & Maske Ayarları</span>
                <span class="arrow">▼</span>
            </button>

            <!-- Collapsible Settings Drawer -->
            <div class="settings-drawer">
                <div style="font-size:11px; color:#cbd5e1; display:flex; flex-direction:column; gap:8px;">
                    <!-- Removal Method -->
                    <div>
                        <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;" data-i18n="node.remove_bg.method_label">Temizleme Motoru / Modu:</div>
                        <select class="method-select" style="width:100%; background:#030712; border:1px solid #4b5563; border-radius:4px; color:#34d399; font-weight:bold; padding:5px 8px; font-size:10px; cursor:pointer; outline:none;">
                            <option value="ai" selected data-i18n="node.remove_bg.method_ai">🧠 AI Akıllı Mod (BiRefNet)</option>
                            <option value="corner_key" data-i18n="node.remove_bg.method_corner">🎮 Oyun İkonu / Düz Zemin (Corner Key)</option>
                        </select>
                    </div>

                    <!-- Keep Inside (Hole Filling) Toggle -->
                    <div style="background:#1e293b; padding:6px 8px; border-radius:4px; border:1px solid #334155;">
                        <label style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; font-size:10px; color:#e2e8f0; font-weight:bold;">
                            <span data-i18n="node.remove_bg.keep_inside_label">🛡️ İkon / Madalyon İçini Koru</span>
                            <input type="checkbox" class="keep-inside-checkbox" style="accent-color:#059669; width:14px; height:14px; cursor:pointer;">
                        </label>
                        <div style="font-size:9px; color:#94a3b8; margin-top:2px;" data-i18n="node.remove_bg.keep_inside_desc">Madalyon, çerçeve veya simge içindeki detayların silinmesini engeller.</div>
                    </div>

                    <!-- Threshold Slider -->
                    <div class="threshold-container">
                        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                            <span style="font-size:10px; color:#94a3b8;" data-i18n="node.remove_bg.threshold_label">AI Algılama Hassasiyeti:</span>
                            <b class="threshold-val" style="color:#fbbf24; font-size:11px;">%50</b>
                        </div>
                        <input type="range" class="threshold-slider" min="10" max="90" value="50" step="5" style="width:100%; cursor:pointer;">
                    </div>

                    <!-- Defringe / Choke -->
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                            <span style="font-size:10px; color:#94a3b8;" data-i18n="node.remove_bg.defringe_label">Kenar Temizle (Halo / Sızıntı):</span>
                            <b class="defringe-val" style="color:#34d399; font-size:11px;">0 px</b>
                        </div>
                        <input type="range" class="defringe-slider" min="0" max="5" value="0" step="1" style="width:100%; cursor:pointer;">
                    </div>

                    <!-- Feather / Blur -->
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                            <span style="font-size:10px; color:#94a3b8;" data-i18n="node.remove_bg.feather_label">Kenar Yumuşatma (Feather):</span>
                            <b class="feather-val" style="color:#38bdf8; font-size:11px;">0 px</b>
                        </div>
                        <input type="range" class="feather-slider" min="0" max="5" value="0" step="1" style="width:100%; cursor:pointer;">
                    </div>

                    <!-- Quality / Resolution -->
                    <div>
                        <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;" data-i18n="node.remove_bg.quality_label">İşleme Çözünürlüğü / Kalite:</div>
                        <select class="quality-select" style="width:100%; background:#030712; border:1px solid #4b5563; border-radius:4px; color:#38bdf8; font-weight:bold; padding:5px 8px; font-size:10px; cursor:pointer; outline:none;">
                            <option value="768" data-i18n="node.remove_bg.quality_fast">⚡ Hızlı (768px - Düşük VRAM)</option>
                            <option value="1024" selected data-i18n="node.remove_bg.quality_balanced">⚖️ Dengeli (1024px - Standart)</option>
                            <option value="2048" data-i18n="node.remove_bg.quality_ultra">💎 Ultra HD (2048px - Maksimum Detay)</option>
                        </select>
                    </div>

                    <!-- Output Mode -->
                    <div>
                        <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;" data-i18n="node.remove_bg.output_format">Çıktı Formatı:</div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" class="mode-btn mode-rgba active-mode" data-mode="rgba" style="flex:1; padding:5px 8px; font-size:10px; font-weight:bold; background:#059669; color:white; border:none; border-radius:4px; cursor:pointer;" data-i18n="node.remove_bg.format_rgba">Şeffaf PNG</button>
                            <button type="button" class="mode-btn mode-mask" data-mode="mask" style="flex:1; padding:5px 8px; font-size:10px; font-weight:bold; background:#1e293b; color:#94a3b8; border:1px solid #334155; border-radius:4px; cursor:pointer;" data-i18n="node.remove_bg.format_mask">Alpha Maske</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="result-actions" style="display:none; width:100%; margin-top:10px;">
                <div style="display:flex; gap:6px; width:100%;">
                    <button type="button" class="download-btn" style="flex:1;" data-i18n="node.remove_bg.btn_download_single">İndir (PNG)</button>
                    <button type="button" class="rerun-bg-btn" title="Tekrar çalıştır" style="background:#0f766e; color:white; border:none; border-radius:6px; padding:8px 12px; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap;" data-i18n="node.remove_bg.btn_rerun">
                        🔄 Yeniden
                    </button>
                </div>
            </div>
            <div class="batch-results-grid" style="display:none; width:100%; margin-top:12px; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 220px; overflow-y: auto;"></div>
            <div class="batch-action-bar" style="display:none; width:100%; gap:6px; margin-top:10px;">
                <button type="button" class="download-all-btn" style="flex:1; padding:9px; background:#2563eb; border:none; border-radius:6px; color:white; font-size:12px; font-weight:bold; cursor:pointer;" data-i18n="node.remove_bg.btn_download_all">📥 Tüm Şeffaf Asset'leri İndir</button>
                <button type="button" class="rerun-batch-bg-btn" title="Tüm akışı baştan çalıştır" style="background:#0f766e; color:white; border:none; border-radius:6px; padding:9px 12px; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap;" data-i18n="node.remove_bg.btn_rerun">
                    🔄 Yeniden
                </button>
            </div>
        `;
        node.appendChild(content);

        // Setup Model Manager for BiRefNet
        BaseNode.setupModelManager(node, 'birefnet', 'BiRefNet');

        // Logic & Handlers
        const dropZone = node.querySelector('.drop-zone');
        const placeholder = node.querySelector('.placeholder-text');
        const img = node.querySelector('img');
        const playBtn = node.querySelector('.play-btn');
        const loader = node.querySelector('.loader');
        const progressText = node.querySelector('.progress-text');
        const resultActions = node.querySelector('.result-actions');
        const downloadBtn = node.querySelector('.download-btn');
        const batchGrid = node.querySelector('.batch-results-grid');
        const downloadAllBtn = node.querySelector('.download-all-btn');
        const pipelineStatus = node.querySelector('.pipeline-status');
        const runPipelineBtn = node.querySelector('.run-pipeline-btn');
        const playBtnConnected = node.querySelector('.play-btn-connected');

        const toggleSettingsBtn = node.querySelector('.toggle-settings-btn');
        const settingsDrawer = node.querySelector('.settings-drawer');
        const methodSelect = node.querySelector('.method-select');
        const keepInsideCheckbox = node.querySelector('.keep-inside-checkbox');
        const thresholdSlider = node.querySelector('.threshold-slider');
        const thresholdVal = node.querySelector('.threshold-val');
        const thresholdContainer = node.querySelector('.threshold-container');
        const defringeSlider = node.querySelector('.defringe-slider');
        const defringeVal = node.querySelector('.defringe-val');
        const featherSlider = node.querySelector('.feather-slider');
        const featherVal = node.querySelector('.feather-val');
        const qualitySelect = node.querySelector('.quality-select');
        const modeBtns = node.querySelectorAll('.mode-btn');

        let currentOutputMode = 'rgba';

        if (toggleSettingsBtn && settingsDrawer) {
            toggleSettingsBtn.addEventListener('click', () => {
                const isOpen = settingsDrawer.classList.toggle('open');
                toggleSettingsBtn.classList.toggle('open', isOpen);
                if (window.WiresEngine) {
                    setTimeout(() => window.WiresEngine.updateAllWires(), 50);
                    setTimeout(() => window.WiresEngine.updateAllWires(), 300);
                }
            });
        }

        if (methodSelect) {
            methodSelect.addEventListener('change', () => {
                if (thresholdContainer) {
                    thresholdContainer.style.display = methodSelect.value === 'corner_key' ? 'none' : 'block';
                }
                node.setNodeStatus('dirty');
            });
        }

        if (keepInsideCheckbox) {
            keepInsideCheckbox.addEventListener('change', () => node.setNodeStatus('dirty'));
        }

        if (thresholdSlider && thresholdVal) {
            thresholdSlider.addEventListener('input', () => {
                thresholdVal.innerText = `%${thresholdSlider.value}`;
                node.setNodeStatus('dirty');
            });
        }

        if (defringeSlider && defringeVal) {
            defringeSlider.addEventListener('input', () => {
                defringeVal.innerText = `${defringeSlider.value} px`;
                node.setNodeStatus('dirty');
            });
        }

        if (featherSlider && featherVal) {
            featherSlider.addEventListener('input', () => {
                featherVal.innerText = `${featherSlider.value} px`;
                node.setNodeStatus('dirty');
            });
        }

        if (qualitySelect) {
            qualitySelect.addEventListener('change', () => node.setNodeStatus('dirty'));
        }

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => {
                    b.style.background = '#1e293b';
                    b.style.color = '#94a3b8';
                    b.style.border = '1px solid #334155';
                });
                btn.style.background = '#059669';
                btn.style.color = '#fff';
                btn.style.border = 'none';
                currentOutputMode = btn.dataset.mode;
                node.setNodeStatus('dirty');
            });
        });

        let originalImageBlob = null;
        let resultImageBlob = null;
        let imageURL = null;
        let resultURL = null;
        let processedBatchItems = [];
        const fileInput = node.querySelector('.single-file-input');

        node.getCachedAssets = () => {
            if (processedBatchItems && processedBatchItems.length > 0) {
                return processedBatchItems;
            }
            if (resultURL && originalImageBlob) {
                return [{
                    name: (originalImageBlob.name || 'image.png').replace(/\.[^/.]+$/, "") + '_nobg.png',
                    label: 'single',
                    data: img.src
                }];
            }
            return [];
        };

        node.onConnectionChange = () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream) {
                // If upstream is split-assets and has cached assets, trigger or hint
                if (typeof upstream.getCachedAssets === 'function') {
                    const upstreamAssets = upstream.getCachedAssets();
                    if (upstreamAssets && upstreamAssets.length > 0) {
                        // upstream is ready
                    }
                }
                placeholder.style.display = 'none';
                img.style.display = 'none';
                playBtn.style.display = 'none';
                pipelineStatus.style.display = 'flex';
            } else {
                pipelineStatus.style.display = 'none';
                if (originalImageBlob) {
                    img.style.display = 'block';
                    playBtn.style.display = 'flex';
                } else {
                    placeholder.style.display = 'block';
                }
            }
        };

        function handleFileSelection(file) {
            if (!file || !file.type.startsWith('image/')) return;
            originalImageBlob = file;
            node.setNodeStatus('dirty');
            if (imageURL) URL.revokeObjectURL(imageURL);
            imageURL = URL.createObjectURL(originalImageBlob);
            img.src = imageURL;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            pipelineStatus.style.display = 'none';
            playBtn.style.display = 'flex';
            resultActions.style.display = 'none';
            batchGrid.style.display = 'none';
            downloadAllBtn.style.display = 'none';
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                }
            });
        }

        dropZone.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn') || e.target.closest('.play-btn-connected') || e.target.closest('.run-pipeline-btn') || e.target.closest('.loader')) return;
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (!originalImageBlob && (!upstream || pipelineStatus.style.display === 'none')) {
                if (fileInput) fileInput.click();
            }
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });

        node.processAssetsDirectly = async (assets) => {
            const outAssets = [];
            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];
                const res = await fetch(asset.data);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('method', methodSelect ? methodSelect.value : 'ai');
                formData.append('keep_inside', keepInsideCheckbox ? (keepInsideCheckbox.checked ? 'true' : 'false') : 'false');
                formData.append('threshold', thresholdSlider ? (thresholdSlider.value / 100) : 0.5);
                formData.append('defringe', defringeSlider ? defringeSlider.value : 0);
                formData.append('feather', featherSlider ? featherSlider.value : 0);
                formData.append('quality', qualitySelect ? qualitySelect.value : '1024');
                formData.append('output_mode', currentOutputMode);

                const response = await fetch('http://127.0.0.1:8000/api/remove-bg', { method: 'POST', body: formData });
                if (response.ok) {
                    const noBgBlob = await response.blob();
                    const base64Data = await ApiClient.fileToBase64(noBgBlob);
                    const cleanFileName = asset.name.replace(/\.[^/.]+$/, "") + "_nobg.png";
                    outAssets.push({ name: cleanFileName, label: asset.label, data: base64Data });
                }
            }
            if (outAssets.length > 0) {
                processedBatchItems = outAssets;
            }
            return outAssets;
        };

        node.processBatchAssets = async (assets) => {
            node.setNodeStatus('running');
            pipelineStatus.style.display = 'none';
            loader.style.display = 'block';
            progressText.style.display = 'block';
            progressText.innerText = "Arka planlar temizleniyor...";

            try {
                const processed = await node.processAssetsDirectly(assets);
                batchGrid.innerHTML = '';
                batchGrid.style.display = 'grid';
                processedBatchItems = processed;
                processed.forEach(item => {
                    const card = document.createElement('div');
                    card.style.cssText = 'background:#0f172a; border:1px solid #334155; border-radius:6px; padding:6px; text-align:center;';
                    card.innerHTML = `
                        <img src="${item.data}" style="max-width:100%; height:75px; object-fit:contain; background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKUlEQVQYlWP8//8/AxgwgI2RiZGBgRzMoBxgVI8wUByM6hFGcga4oQUA32EQ31eR9qAAAAAASUVORK5CYII=) repeat;">
                        <div style="font-size:10px; color:#34d399; font-weight:bold; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.label}</div>
                        <a href="${item.data}" download="${item.name}" style="display:block; margin-top:4px; font-size:10px; color:#fff; background:#059669; padding:3px 0; border-radius:3px; text-decoration:none; font-weight:bold;">⬇ İndir</a>
                    `;
                    batchGrid.appendChild(card);
                });
                dropZone.style.display = 'none';
                if (batchActionBar) batchActionBar.style.display = 'flex';
                node.setNodeStatus('completed');

                // Forward to downstream connected preview nodes (e.g. Resize & Align)
                const connectedTargets = window.WiresEngine ? window.WiresEngine.getConnectedNodes(node) : [];
                if (connectedTargets.length > 0 && processed.length > 0) {
                    connectedTargets.forEach(targetNode => {
                        if (targetNode.dataset.nodeType !== 'auto-save') {
                            if (typeof targetNode.processAssetsDirectly === 'function') {
                                targetNode.processAssetsDirectly(processed);
                            } else if (typeof targetNode.processBatchAssets === 'function') {
                                targetNode.processBatchAssets(processed);
                            }
                        }
                    });
                }

                return processed;
            } catch (e) {
                node.setNodeStatus('error');
                alert("Remove BG Hatası: " + e.message);
            } finally {
                loader.style.display = 'none';
                progressText.style.display = 'none';
            }
        };

        const rerunBgBtn = node.querySelector('.rerun-bg-btn');
        const batchActionBar = node.querySelector('.batch-action-bar');
        const rerunBatchBgBtn = node.querySelector('.rerun-batch-bg-btn');

        const runSingleRemoveBg = async () => {
            if (!originalImageBlob) {
                node.setNodeStatus('idle');
                alert("Lütfen önce Remove Background düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!");
                return;
            }
            node.setNodeStatus('running');
            playBtn.style.display = 'none';
            loader.style.display = 'block';
            progressText.style.display = 'block';
            img.style.opacity = '0.3';
            progressText.innerText = "Arka Plan Temizleniyor...";

            try {
                const formData = new FormData();
                formData.append("file", originalImageBlob);
                formData.append('method', methodSelect ? methodSelect.value : 'ai');
                formData.append('keep_inside', keepInsideCheckbox ? (keepInsideCheckbox.checked ? 'true' : 'false') : 'false');
                formData.append('threshold', thresholdSlider ? (thresholdSlider.value / 100) : 0.5);
                formData.append('defringe', defringeSlider ? defringeSlider.value : 0);
                formData.append('feather', featherSlider ? featherSlider.value : 0);
                formData.append('quality', qualitySelect ? qualitySelect.value : '1024');
                formData.append('output_mode', currentOutputMode);
                const response = await fetch('http://127.0.0.1:8000/api/remove-bg', { method: "POST", body: formData });
                if (!response.ok) throw new Error(await response.text());

                const blob = await response.blob();
                resultImageBlob = blob;
                if (resultURL) URL.revokeObjectURL(resultURL);
                resultURL = URL.createObjectURL(blob);
                img.src = resultURL;
                img.style.opacity = '1';
                dropZone.classList.add('transparent-bg');
                loader.style.display = 'none';
                progressText.style.display = 'none';
                resultActions.style.display = 'block';
                node.setNodeStatus('completed');

                // Forward to downstream connected preview nodes
                const singleAsset = [{
                    name: (originalImageBlob.name || 'image.png').replace(/\.[^/.]+$/, "") + '_nobg.png',
                    label: 'single',
                    data: resultURL
                }];
                processedBatchItems = singleAsset;
                const connectedTargets = window.WiresEngine ? window.WiresEngine.getConnectedNodes(node) : [];
                if (connectedTargets.length > 0) {
                    connectedTargets.forEach(targetNode => {
                        if (targetNode.dataset.nodeType !== 'auto-save' && typeof targetNode.processAssetsDirectly === 'function') {
                            targetNode.processAssetsDirectly(singleAsset);
                        }
                    });
                }
            } catch (error) {
                node.setNodeStatus('error');
                alert("Hata: " + error.message);
                playBtn.style.display = 'flex';
                loader.style.display = 'none';
                progressText.style.display = 'none';
            }
        };

        playBtn.addEventListener('click', runSingleRemoveBg);
        if (rerunBgBtn) rerunBgBtn.addEventListener('click', runSingleRemoveBg);

        downloadBtn.addEventListener('click', () => {
            if (!resultImageBlob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(resultImageBlob);
            a.download = 'nobg_asset.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        node.hasImage = () => originalImageBlob !== null;

        const triggerPipeline = async () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (!upstream) {
                if (originalImageBlob) {
                    await node.runSingleRemoveBg();
                } else {
                    node.setNodeStatus('idle');
                    alert("Lütfen önce Remove Background düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!");
                }
                return;
            }

            // Upstream pre-flight validation (Houdini Cook Guard)
            const check = BaseNode.validateChainInput(node);
            if (!check.valid) {
                node.setNodeStatus('idle');
                alert(check.message);
                return;
            }

            node.setNodeStatus('running');
            if (pipelineStatus) pipelineStatus.style.display = 'none';
            if (loader) loader.style.display = 'block';
            if (progressText) {
                progressText.style.display = 'block';
                progressText.innerText = "Arka planlar temizleniyor...";
            }

            try {
                const assets = await BaseNode.pullUpstreamAssets(node);
                if (assets && assets.length > 0) {
                    await node.processBatchAssets(assets);
                } else {
                    node.setNodeStatus('idle');
                }
            } catch (err) {
                node.setNodeStatus('error');
                alert("Akış Hatası: " + err.message);
            } finally {
                if (loader) loader.style.display = 'none';
                if (progressText) progressText.style.display = 'none';
            }
        };

        if (runPipelineBtn) runPipelineBtn.addEventListener('click', triggerPipeline);
        if (playBtnConnected) playBtnConnected.addEventListener('click', triggerPipeline);
        if (rerunBatchBgBtn) rerunBatchBgBtn.addEventListener('click', triggerPipeline);

        node.triggerPipeline = triggerPipeline;
        node.runSingleRemoveBg = runSingleRemoveBg;

        downloadAllBtn.addEventListener('click', () => {
            processedBatchItems.forEach((item, idx) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = item.data;
                    a.download = item.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, idx * 200);
            });
        });

        return node;
    }
};
