/**
 * =========================================================================
 * AgentStudio - Node: Resize & Align
 * Standardizes resolution (e.g. 512x512), 9-slice grid alignment and padding.
 * Features: Direct drag-and-drop upload, object switcher (shows latest asset),
 * Run / Re-run execution button and single asset download.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';
import { ApiClient } from '../core/api.js';

export const ResizeAlignNode = {
    type: 'resize',
    title: 'Resize & Align',
    titleKey: 'node.resize.title',
    subtitle: 'Resim Boyutu Standartlaştırma',
    subtitleKey: 'node.resize.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'asset-resize',
            title: 'Resize & Align',
            titleKey: 'node.resize.title',
            subtitle: 'Resim Boyutu Standartlaştırma',
            subtitleKey: 'node.resize.subtitle',
            x, y,
            width: '300px',
            hasInputPort: true,
            hasOutputPort: true,
            inputPortTitle: 'Giriş: Önceki düğümden resim alır',
            outputPortTitle: 'Çıkış Pini'
        });

        // Set header theme color
        const header = node.querySelector('.node-header');
        if (header) header.style.backgroundColor = '#065f46';

        const content = document.createElement('div');
        content.className = 'node-content';
        content.style.padding = '12px';
        content.innerHTML = `
            <!-- Live Preview / Drop Zone -->
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:4px;">
                <span style="font-size:10px; color:#94a3b8; font-weight:bold;" data-i18n="node.resize.preview">Canlı Önizleme</span>
                <div class="asset-nav-bar" style="display:none; align-items:center; gap:4px;">
                    <button type="button" class="nav-prev-btn" style="background:#1e293b; border:1px solid #334155; color:#93c5fd; font-size:9px; padding:1px 5px; border-radius:3px; cursor:pointer;">◀</button>
                    <span class="asset-count-label" style="font-size:10px; color:#34d399; font-weight:bold;">1/1</span>
                    <button type="button" class="nav-next-btn" style="background:#1e293b; border:1px solid #334155; color:#93c5fd; font-size:9px; padding:1px 5px; border-radius:3px; cursor:pointer;">▶</button>
                </div>
            </div>

            <div class="resize-drop-zone drop-zone transparent-bg" style="width:100%; height:140px; border:1px solid #374151; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; margin-bottom:8px; position:relative; cursor:pointer; background-color:#070b12;">
                <span class="resize-placeholder" style="font-size:11px; color:#94a3b8; text-align:center; padding:10px; pointer-events:none;" data-i18n="node.resize.drop_hint">
                    Resmi Buraya Sürükle veya <b style="color:#34d399;">Tıkla</b>
                </span>
                <input type="file" class="resize-file-input" accept="image/*" style="display:none;">
                
                <!-- Target Dimensions Dashed Bounding Frame -->
                <div class="resize-target-frame" style="display:none; position:relative; height:120px; max-width:94%; border:2px dashed #34d399; box-shadow:0 0 12px rgba(52,211,153,0.35); border-radius:4px; overflow:hidden; box-sizing:border-box; background:#0b0f17;">
                    <!-- Crosshair Center Guide -->
                    <div style="position:absolute; top:50%; left:0; width:100%; height:1px; background:rgba(52,211,153,0.2); pointer-events:none; z-index:1;"></div>
                    <div style="position:absolute; left:50%; top:0; height:100%; width:1px; background:rgba(52,211,153,0.2); pointer-events:none; z-index:1;"></div>
                    <img class="resize-preview-img" style="width:100%; height:100%; object-fit:contain; display:block; position:relative; z-index:2;" src="">
                    <span class="target-res-badge" style="position:absolute; bottom:2px; right:4px; font-size:8px; background:rgba(0,0,0,0.85); border:1px solid #334155; color:#34d399; padding:1px 5px; border-radius:3px; font-weight:bold; font-family:monospace; pointer-events:none; z-index:3;">512×512</span>
                </div>

                <!-- Pipeline Connected Pulsing Play Status Overlay -->
                <div class="pipeline-status" style="display:none;">
                    <div style="font-size:12px; color:#38bdf8; font-weight:700;" data-i18n="node.resize.conn_active">🔍— Bağlantı Aktif</div>
                    <div class="play-btn-connected pulse-btn" title="Tüm Akışı Çalıştır">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left:3px;"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <button type="button" class="run-pipeline-btn" style="background:#059669; color:white; border:1px solid #34d399; border-radius:4px; padding:5px 14px; font-size:11px; font-weight:800; cursor:pointer;" data-i18n="node.resize.btn_run_pipeline">
                        ⚡ TÜM AKIŞI ÇALIŞTIR
                    </button>
                </div>

                <div class="resize-loader loader" style="position:absolute; z-index:5;"></div>
            </div>
            
            <!-- Dimensions -->
            <div style="display:flex; gap:8px; margin-bottom:8px; width:100%;">
                <div style="flex:1;">
                    <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;" data-i18n="node.resize.dimensions">Hedef Ölçüler (W x H):</div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <input type="number" class="resize-w" value="512" style="width:100%; background:#0f172a; border:1px solid #334155; color:#fff; font-size:11px; padding:4px; border-radius:4px; text-align:center;">
                        <span style="color:#64748b;">x</span>
                        <input type="number" class="resize-h" value="512" style="width:100%; background:#0f172a; border:1px solid #334155; color:#fff; font-size:11px; padding:4px; border-radius:4px; text-align:center;">
                    </div>
                </div>
            </div>
            
            <!-- Mode & Alignment -->
            <div style="display:flex; gap:8px; margin-bottom:10px; width:100%;">
                <div style="flex:2;">
                    <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;" data-i18n="node.resize.scale_mode">Sığdırma Modu:</div>
                    <select class="resize-mode" style="width:100%; background:#0f172a; border:1px solid #334155; color:#34d399; font-size:10px; padding:4px; border-radius:4px; outline:none; font-weight:bold;">
                        <option value="fit" selected data-i18n="node.resize.mode_fit">Fit (Orantılı Sığdır)</option>
                        <option value="fill" data-i18n="node.resize.mode_fill">Fill (Kırparak Doldur)</option>
                        <option value="stretch" data-i18n="node.resize.mode_stretch">Stretch (Uzat)</option>
                    </select>
                </div>
                <div style="flex:1;">
                    <div style="font-size:10px; color:#94a3b8; margin-bottom:2px; text-align:center;" data-i18n="node.resize.alignment">Hizalama (9-Nokta):</div>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:2px; width:48px; margin:0 auto;" class="resize-align-grid">
                        <div class="align-cell" data-x="left" data-y="top" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="center" data-y="top" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="right" data-y="top" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="left" data-y="center" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell active" data-x="center" data-y="center" style="height:12px; background:#059669; border:1px solid #34d399; cursor:pointer;"></div>
                        <div class="align-cell" data-x="right" data-y="center" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="left" data-y="bottom" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="center" data-y="bottom" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                        <div class="align-cell" data-x="right" data-y="bottom" style="height:12px; background:#1e293b; border:1px solid #334155; cursor:pointer;"></div>
                    </div>
                </div>
            </div>
            
            <!-- Background Color -->
            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:6px; border-radius:4px; border:1px solid #334155; width:100%; box-sizing:border-box; margin-bottom:10px;">
                <span style="font-size:10px; color:#cbd5e1; font-weight:bold;" data-i18n="node.resize.bg">Arka Plan:</span>
                <div style="display:flex; gap:6px; align-items:center;">
                    <label style="display:flex; align-items:center; gap:4px; font-size:10px; color:#94a3b8; cursor:pointer;">
                        <input type="checkbox" class="resize-bg-transparent" checked style="accent-color:#059669; cursor:pointer;">
                        <span data-i18n="node.resize.transparent">Şeffaf</span>
                    </label>
                    <input type="color" class="resize-bg-color" value="#ffffff" style="width:24px; height:20px; border:none; padding:0; background:transparent; cursor:pointer; opacity:0.3; pointer-events:none;">
                </div>
            </div>

            <!-- Action Buttons: Run / Re-Run & Download -->
            <div style="display:flex; gap:6px; width:100%; flex-wrap:wrap;">
                <button type="button" class="run-resize-btn" style="flex:1; min-width:120px; padding:7px 10px; background:#059669; border:1px solid #34d399; border-radius:5px; color:white; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;" data-i18n="node.resize.btn_run">
                    ⚡ Yeniden Boyutlandır
                </button>
                <button type="button" class="download-resize-btn" style="display:none; padding:7px 10px; background:#1e293b; border:1px solid #3b82f6; border-radius:5px; color:#60a5fa; font-size:11px; font-weight:bold; cursor:pointer;" data-i18n="node.resize.btn_download">
                    ⬇ İndir
                </button>
                <button type="button" class="download-all-resize-btn" style="display:none; padding:7px 10px; background:#1e293b; border:1px solid #10b981; border-radius:5px; color:#34d399; font-size:11px; font-weight:bold; cursor:pointer;" data-i18n="node.resize.btn_download_all">
                    📥 Tümünü İndir
                </button>
            </div>
        `;
        node.appendChild(content);

        // Elements
        const dropZone = node.querySelector('.resize-drop-zone');
        const placeholder = node.querySelector('.resize-placeholder');
        const targetFrame = node.querySelector('.resize-target-frame');
        const targetResBadge = node.querySelector('.target-res-badge');
        const previewImg = node.querySelector('.resize-preview-img');
        const loader = node.querySelector('.resize-loader');
        const fileInput = node.querySelector('.resize-file-input');
        const runBtn = node.querySelector('.run-resize-btn');
        const downloadBtn = node.querySelector('.download-resize-btn');
        const downloadAllBtn = node.querySelector('.download-all-resize-btn');
        const pipelineStatus = node.querySelector('.pipeline-status');
        const playBtnConnected = node.querySelector('.play-btn-connected');
        const runPipelineBtn = node.querySelector('.run-pipeline-btn');
        
        const navBar = node.querySelector('.asset-nav-bar');
        const navPrevBtn = node.querySelector('.nav-prev-btn');
        const navNextBtn = node.querySelector('.nav-next-btn');
        const assetCountLabel = node.querySelector('.asset-count-label');

        const widthInput = node.querySelector('.resize-w');
        const heightInput = node.querySelector('.resize-h');
        const modeSelect = node.querySelector('.resize-mode');
        const bgTrans = node.querySelector('.resize-bg-transparent');
        const bgColor = node.querySelector('.resize-bg-color');
        const alignCells = node.querySelectorAll('.align-cell');

        function updateFrameDimensions() {
            const w = parseInt(widthInput.value) || 512;
            const h = parseInt(heightInput.value) || 512;
            if (targetFrame) targetFrame.style.aspectRatio = `${w} / ${h}`;
            if (targetResBadge) targetResBadge.innerText = `${w}×${h}`;
        }

        // State
        let currentAlignX = 'center';
        let currentAlignY = 'center';
        let previewDebounce = null;
        let loadedAssets = []; // [{ name, label, data }]
        let processedResizedAssets = []; // [{ name, label, data }]
        let activeAssetIndex = 0;
        let lastResizedDataUrl = null;

        // Alignment grid click handler
        alignCells.forEach(cell => {
            cell.addEventListener('click', () => {
                alignCells.forEach(c => {
                    c.style.background = '#1e293b';
                    c.style.borderColor = '#334155';
                    c.classList.remove('active');
                });
                cell.style.background = '#059669';
                cell.style.borderColor = '#34d399';
                cell.classList.add('active');
                currentAlignX = cell.dataset.x;
                currentAlignY = cell.dataset.y;
                node.setNodeStatus('dirty');
                triggerPreview();
            });
        });

        // Background transparency toggle
        bgTrans.addEventListener('change', () => {
            if (bgTrans.checked) {
                bgColor.style.opacity = '0.3';
                bgColor.style.pointerEvents = 'none';
                dropZone.classList.add('transparent-bg');
            } else {
                bgColor.style.opacity = '1';
                bgColor.style.pointerEvents = 'auto';
                dropZone.classList.remove('transparent-bg');
            }
            node.setNodeStatus('dirty');
            triggerPreview();
        });

        widthInput.addEventListener('input', updateFrameDimensions);
        heightInput.addEventListener('input', updateFrameDimensions);
        widthInput.addEventListener('change', () => { node.setNodeStatus('dirty'); triggerPreview(); });
        heightInput.addEventListener('change', () => { node.setNodeStatus('dirty'); triggerPreview(); });
        modeSelect.addEventListener('change', () => { node.setNodeStatus('dirty'); triggerPreview(); });
        bgColor.addEventListener('change', () => { node.setNodeStatus('dirty'); triggerPreview(); });

        // Update Multi-Asset Navigation Display
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

        // Direct File Dropzone Handler
        function handleDirectFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = () => {
                loadedAssets = [{
                    name: file.name,
                    label: 'uploaded',
                    data: reader.result
                }];
                activeAssetIndex = 0;
                updateNavUI();
                node.setNodeStatus('dirty');
                triggerPreview();
            };
            reader.readAsDataURL(file);
        }

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleDirectFile(e.target.files[0]);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleDirectFile(e.dataTransfer.files[0]);
            }
        });

        // Click handlers on connected play button
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
                runBtn.innerHTML = window.i18n ? window.i18n.t('node.resize.btn_run_pipeline') : '⚡ TÜM AKIŞI ÇALIŞTIR';
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
                    if (targetFrame) targetFrame.style.display = 'none';
                }
            } else {
                runBtn.innerHTML = window.i18n ? window.i18n.t('node.resize.btn_run') : '⚡ Yeniden Boyutlandır';
                if (pipelineStatus) pipelineStatus.style.display = 'none';
                if (loadedAssets.length === 0) {
                    if (placeholder) {
                        placeholder.style.display = 'block';
                        placeholder.innerHTML = window.i18n ? window.i18n.t('node.resize.drop_hint') : 'Resmi Buraya Sürükle veya Tıkla';
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
                if (pipelineStatus) pipelineStatus.style.display = 'none';
                placeholder.style.display = 'none';
                if (targetFrame) {
                    targetFrame.style.display = 'block';
                    updateFrameDimensions();
                }
                previewImg.style.display = 'block';
                previewImg.style.opacity = '0.3';

                try {
                    const fd = new FormData();
                    const res = await fetch(targetAsset.data);
                    const blob = await res.blob();

                    fd.append('file', blob, targetAsset.name || 'preview.png');
                    fd.append('target_w', widthInput.value || 512);
                    fd.append('target_h', heightInput.value || 512);
                    fd.append('scale_mode', modeSelect.value);
                    fd.append('align_x', currentAlignX);
                    fd.append('align_y', currentAlignY);
                    fd.append('bg_color', bgTrans.checked ? 'transparent' : bgColor.value);

                    const apiRes = await fetch('http://127.0.0.1:8000/api/resize', { method: 'POST', body: fd });
                    if (apiRes.ok) {
                        const resultBlob = await apiRes.blob();
                        lastResizedDataUrl = await ApiClient.fileToBase64(resultBlob);
                        previewImg.src = lastResizedDataUrl;
                        previewImg.style.opacity = '1';
                        downloadBtn.style.display = 'block';
                        node.setNodeStatus('completed');
                    }
                } catch (e) {
                    console.error("Resize preview error", e);
                    node.setNodeStatus('error');
                } finally {
                    loader.style.display = 'none';
                }
            }, 300);
        }

        // Run Button Click: Pull from upstream if needed or execute preview
        runBtn.addEventListener('click', async () => {
            // 1. If this node already has loaded assets, run preview
            if (loadedAssets.length > 0) {
                node.setNodeStatus('running');
                triggerPreview();
                return;
            }

            // 2. If upstream node is connected, try to pull assets
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
                    console.error("Upstream pull error:", err);
                    node.setNodeStatus('error');
                    alert((window.i18n ? window.i18n.t('node.resize.alert_pipeline_error') : "Akış Hatası: ") + err.message);
                    return;
                }
            }

            // 3. No inputs available -> stay idle
            node.setNodeStatus('idle');
            alert(window.i18n ? window.i18n.t('node.resize.alert_no_input') : "Lütfen önce Resize & Align düğümüne bir resim yükleyin veya sol pine bir düğüm bağlayın!");
        });

        // Single Image Download
        downloadBtn.addEventListener('click', () => {
            if (!lastResizedDataUrl) return;
            const currentAsset = loadedAssets[activeAssetIndex];
            const baseName = currentAsset && currentAsset.name ? currentAsset.name.replace(/\.[^/.]+$/, "") : 'resized';
            const a = document.createElement('a');
            a.href = lastResizedDataUrl;
            a.download = `${baseName}_${widthInput.value}x${heightInput.value}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        // Download All Resized Assets
        downloadAllBtn.addEventListener('click', () => {
            const assetsToDownload = (processedResizedAssets && processedResizedAssets.length > 0) ? processedResizedAssets : loadedAssets;
            if (!assetsToDownload || assetsToDownload.length === 0) return;

            assetsToDownload.forEach((item, idx) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = item.data;
                    const base = (item.name || `asset_${idx + 1}`).replace(/\.[^/.]+$/, "");
                    a.download = `${base}_${widthInput.value}x${heightInput.value}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, idx * 200);
            });
        });

        node.getCachedAssets = () => (processedResizedAssets.length > 0 ? processedResizedAssets : loadedAssets);

        // Pipeline Batch Processing (Receives array of assets from previous node)
        node.processAssetsDirectly = async (assets) => {
            if (!assets || assets.length === 0) return [];
            node.setNodeStatus('running');
            if (pipelineStatus) pipelineStatus.style.display = 'none';
            if (placeholder) placeholder.style.display = 'none';

            loadedAssets = assets;
            // SHOW THE LAST ASSET BY DEFAULT (as requested: "eğer birden çok obje varsa en sonuncu")
            activeAssetIndex = assets.length - 1;
            updateNavUI();

            let final_assets = [];
            for (let i = 0; i < assets.length; i++) {
                const ast = assets[i];
                const fd = new FormData();
                const res = await fetch(ast.data);
                const blob = await res.blob();
                fd.append('file', blob, ast.name);
                fd.append('target_w', widthInput.value || 512);
                fd.append('target_h', heightInput.value || 512);
                fd.append('scale_mode', modeSelect.value);
                fd.append('align_x', currentAlignX);
                fd.append('align_y', currentAlignY);
                fd.append('bg_color', bgTrans.checked ? 'transparent' : bgColor.value);

                try {
                    const apiRes = await fetch('http://127.0.0.1:8000/api/resize', { method: 'POST', body: fd });
                    if (apiRes.ok) {
                        const resultBlob = await apiRes.blob();
                        const dataUrl = await ApiClient.fileToBase64(resultBlob);
                        final_assets.push({
                            name: ast.name,
                            label: ast.label,
                            data: dataUrl
                        });

                        // If it is the active/latest asset, update live preview immediately
                        if (i === activeAssetIndex) {
                            lastResizedDataUrl = dataUrl;
                            placeholder.style.display = 'none';
                            if (targetFrame) {
                                targetFrame.style.display = 'block';
                                updateFrameDimensions();
                            }
                            previewImg.src = dataUrl;
                            previewImg.style.display = 'block';
                            previewImg.style.opacity = '1';
                            downloadBtn.style.display = 'block';
                        }
                    }
                } catch (e) {
                    console.error("Resize pipeline error", e);
                }
            }

            processedResizedAssets = final_assets;
            if (final_assets.length > 1) {
                downloadAllBtn.style.display = 'block';
            } else {
                downloadAllBtn.style.display = 'none';
            }

            node.setNodeStatus('completed');

            // Forward to downstream connected preview nodes
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

        return node;
    }
};
