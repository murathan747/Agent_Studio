/**
 * =========================================================================
 * NodeAgent Studio - Node: Split Assets
 * Florence-2 Object Detection & Sub-Asset Extraction Node.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';

export const SplitAssetsNode = {
    type: 'asset-splitter',
    title: 'Split Assets',
    titleKey: 'node.split_assets.title',
    subtitle: 'AI Nesne Ayrıştırma & Kırpma',
    subtitleKey: 'node.split_assets.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'asset-splitter',
            title: 'Split Assets',
            titleKey: 'node.split_assets.title',
            subtitle: 'AI Nesne Ayrıştırma & Kırpma',
            subtitleKey: 'node.split_assets.subtitle',
            x, y,
            width: '320px',
            hasInputPort: true,
            hasOutputPort: true,
            inputPortTitle: 'Giriş Pini: Tıklayarak veya sürükleyerek bağlayın',
            outputPortTitle: 'Çıkış: Ayrıştırılan nesneleri iletir'
        });

        // Set header theme color
        const header = node.querySelector('.node-header');
        if (header) {
            header.style.backgroundColor = '#1e3a8a';
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
                <div style="font-size:13px; font-weight:bold; color:#60a5fa; margin-bottom:4px;">📦 Florence-2</div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;" data-i18n="model.card.desc">Model henüz bilgisayarınızda yüklü değil.</div>
                <button type="button" class="download-model-btn" style="width:100%; padding:8px 12px; background:#2563eb; color:white; font-weight:bold; border:none; border-radius:6px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;" data-i18n="model.card.btn_download">
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
                <span class="placeholder-text" data-i18n="node.split_assets.drop_text">Sheet Resmini Sürükle veya Sol Pin'e Bağla</span>
                <input type="file" class="single-file-input" accept="image/*" style="display:none;">
                <img src="" alt="preview">
                <div class="play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                
                <!-- Pipeline Connected Pulsing Play Status Overlay -->
                <div class="pipeline-status" style="display:none;">
                    <div style="font-size:12px; color:#38bdf8; font-weight:700;">🔍— Bağlantı Aktif</div>
                    <div class="play-btn-connected pulse-btn" title="Ayrıştırmayı Başlat" style="background:#2563eb; border-color:#60a5fa;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left:3px;"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <button type="button" class="run-pipeline-btn" style="background:#2563eb; color:white; border:1px solid #3b82f6; border-radius:4px; padding:5px 14px; font-size:11px; font-weight:800; cursor:pointer;" data-i18n="node.split_assets.btn_run">
                        AYRIŞTIRMAYI BAŞLAT
                    </button>
                </div>

                <div class="loader"></div>
                <div class="progress-text">Varlıklar Ayrıştırılıyor...</div>
            </div>

            <div style="width:100%; margin-top:10px; display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:#9ca3af; font-weight:600;" data-i18n="node.split_assets.split_mode">Kırpma Modu:</span>
                    <button type="button" class="rerun-splitter-btn" title="Tekrar çalıştır" style="background:#1e3a8a; color:#93c5fd; border:1px solid #3b82f6; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:3px;" data-i18n="node.split_assets.btn_rerun">
                        🔄 Yeniden
                    </button>
                </div>
                <select class="split-mode-select" style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:6px; color:#93c5fd; padding:6px 8px; font-size:11px; font-weight:bold; cursor:pointer; outline:none;">
                    <option value="balanced" selected data-i18n="node.split_assets.mode_balanced">🔍 Dengeli Mod (Ana Varlıklar)</option>
                    <option value="whole" data-i18n="node.split_assets.mode_whole">👑 Bütün Nesne (Karakter + Eşya)</option>
                    <option value="detailed" data-i18n="node.split_assets.mode_detailed">🔬 Parça / Alt Detay (Derin Ayrıştırma)</option>
                </select>
            </div>

            <div class="results-grid" style="display:none; width:100%; margin-top:12px; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 220px; overflow-y: auto;"></div>
            <button type="button" class="download-all-splitter-btn" style="display:none; width:100%; padding:9px; background:#2563eb; border:none; border-radius:6px; color:white; font-size:12px; font-weight:bold; cursor:pointer; margin-top:10px;" data-i18n="node.split_assets.btn_download_all">📥 Tüm Ayrıştırılanları İndir</button>
        `;
        node.appendChild(content);

        // Setup Model Manager for Florence-2
        BaseNode.setupModelManager(node, 'florence2', 'Florence-2');

        // Dropzone & Pipeline Handlers
        const dropZone = node.querySelector('.drop-zone');
        const placeholder = node.querySelector('.placeholder-text');
        const img = node.querySelector('img');
        const playBtn = node.querySelector('.play-btn');
        const loader = node.querySelector('.loader');
        const progressText = node.querySelector('.progress-text');
        const resultsGrid = node.querySelector('.results-grid');
        const splitModeSelect = node.querySelector('.split-mode-select');
        const downloadAllSplitterBtn = node.querySelector('.download-all-splitter-btn');
        const rerunBtn = node.querySelector('.rerun-splitter-btn');
        const fileInput = node.querySelector('.single-file-input');
        const pipelineStatus = node.querySelector('.pipeline-status');
        const playBtnConnected = node.querySelector('.play-btn-connected');
        const runPipelineBtn = node.querySelector('.run-pipeline-btn');

        let originalImageBlob = null;
        let imageURL = null;
        let currentSplitterAssets = [];
        let isDirty = true;
        let imageSourceDir = "";

        node.hasImage = () => originalImageBlob !== null;
        node.getImageFile = () => originalImageBlob;
        node.getSourceFolder = () => imageSourceDir;
        node.hasFreshResults = () => !isDirty && currentSplitterAssets && currentSplitterAssets.length > 0;
        node.getCachedAssets = () => currentSplitterAssets;
        node.markDirty = () => { isDirty = true; node.setNodeStatus('dirty'); };

        node.onConnectionChange = () => {
            isDirty = true;
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream && upstream.dataset.nodeType === 'batch-loader') {
                placeholder.innerHTML = `🔍— <b style="color:#60a5fa;">Batch Loader Bağlı</b><br><span style="font-size:10px; color:#94a3b8;">Çalıştır'a basarak toplu ayrıştırın</span>`;
            } else if (!originalImageBlob) {
                placeholder.innerText = window.i18n ? window.i18n.t('node.split_assets.drop_text') : 'Sheet Resmini Sürükle veya Sol Pin\'e Bağla';
            }
        };

        if (splitModeSelect) {
            splitModeSelect.addEventListener('change', () => {
                isDirty = true;
                node.setNodeStatus('dirty');
            });
        }

        function handleSplitterFile(file) {
            if (!file) return;
            originalImageBlob = file;
            isDirty = true;
            currentSplitterAssets = [];
            node.setNodeStatus('dirty');
            if (imageURL) URL.revokeObjectURL(imageURL);
            imageURL = URL.createObjectURL(originalImageBlob);
            img.src = imageURL;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            playBtn.style.display = 'flex';
            resultsGrid.style.display = 'none';
            if (downloadAllSplitterBtn) downloadAllSplitterBtn.style.display = 'none';
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    imageSourceDir = "";
                    handleSplitterFile(e.target.files[0]);
                }
            });
        }

        async function openNativeFileDialog() {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/dialog/select-file', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (!data.cancelled && data.path && data.data) {
                        imageSourceDir = data.dir || "";
                        const blobRes = await fetch(data.data);
                        const blob = await blobRes.blob();
                        blob.name = data.name;
                        handleSplitterFile(blob);
                        return true;
                    }
                }
            } catch (err) {
                console.warn("Native file dialog fallback:", err);
            }
            return false;
        }

        dropZone.addEventListener('click', async (e) => {
            if (e.target.closest('.play-btn') || e.target.closest('.loader') || e.target.closest('.results-grid') || e.target.closest('.download-all-splitter-btn') || e.target.closest('.rerun-splitter-btn')) return;
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (!originalImageBlob && (!upstream || upstream.dataset.nodeType !== 'batch-loader')) {
                const handled = await openNativeFileDialog();
                if (!handled && fileInput) fileInput.click();
            }
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleSplitterFile(e.dataTransfer.files[0]);
            }
        });

        node.processSingleFile = async (file) => {
            const formData = new FormData();
            if (file instanceof Blob || file instanceof File) {
                formData.append("file", file, file.name);
            } else if (file.data) {
                const res = await fetch(file.data);
                const blob = await res.blob();
                formData.append("file", blob, file.name || "image.png");
            } else {
                formData.append("file", file);
            }
            formData.append("split_mode", splitModeSelect ? splitModeSelect.value : "balanced");

            const response = await fetch('http://127.0.0.1:8000/api/split-assets', { method: "POST", body: formData });
            if (!response.ok) throw new Error(await response.text());
            const result = await response.json();
            return result.assets || [];
        };

        node.runSplitter = async (force = false) => {
            if (!force && node.hasFreshResults()) {
                return currentSplitterAssets;
            }
            return await executeSplitter();
        };

        const executeSplitter = async () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            let queue = [];
            if (upstream && upstream.dataset.nodeType === 'batch-loader') {
                queue = upstream.getFileQueue();
                if (queue.length === 0) {
                    node.setNodeStatus('idle');
                    alert("Lütfen önce Batch Loader düğümüne klasör veya resimleri yükleyin!");
                    return;
                }
            } else if (originalImageBlob) {
                queue = [originalImageBlob];
            } else {
                node.setNodeStatus('idle');
                alert("Lütfen önce Split Assets düğümüne bir resim yükleyin veya sol pine Batch Loader bağlayın!");
                return;
            }

            node.setNodeStatus('running');
            if (pipelineStatus) pipelineStatus.style.display = 'none';
            playBtn.style.display = 'none';
            loader.style.display = 'block';
            progressText.style.display = 'block';
            resultsGrid.innerHTML = '';
            resultsGrid.style.display = 'grid';
            currentSplitterAssets = [];

            try {
                for (let i = 0; i < queue.length; i++) {
                    const file = queue[i];
                    progressText.innerText = `[${i + 1}/${queue.length}] ${file.name} ayrıştırılıyor...`;
                    if (upstream && upstream.dataset.nodeType === 'batch-loader') {
                        upstream.updateBatchProgress(i, queue.length, file.name);
                    }
                    const assets = await node.processSingleFile(file);
                    currentSplitterAssets.push(...assets);

                    assets.forEach(asset => {
                        const wrapper = document.createElement('div');
                        wrapper.style.cssText = 'background:#0f172a; border:1px solid #334155; border-radius:6px; padding:6px; text-align:center;';
                        wrapper.innerHTML = `
                            <img src="${asset.data}" style="max-width:100%; height:75px; object-fit:contain; background:#fff; border-radius:3px;">
                            <div style="font-size:11px; color:#93c5fd; font-weight:bold; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${asset.label}</div>
                            <a href="${asset.data}" download="${asset.name}" style="display:block; margin-top:4px; font-size:11px; color:#38bdf8; text-decoration:none; cursor:pointer; background:#1e293b; padding:3px 0; border-radius:3px; font-weight:700;">⬇ İndir</a>
                        `;
                        resultsGrid.appendChild(wrapper);
                    });
                }

                isDirty = false;
                node.setNodeStatus('completed');
                if (downloadAllSplitterBtn && currentSplitterAssets.length > 0) {
                    downloadAllSplitterBtn.style.display = 'block';
                }

                const connectedTargets = window.WiresEngine ? window.WiresEngine.getConnectedNodes(node) : [];
                if (connectedTargets.length > 0 && currentSplitterAssets.length > 0) {
                    connectedTargets.forEach(targetNode => {
                        if (targetNode.dataset.nodeType !== 'auto-save') {
                            if (typeof targetNode.processBatchAssets === 'function') {
                                targetNode.processBatchAssets(currentSplitterAssets);
                            } else if (typeof targetNode.processAssetsDirectly === 'function') {
                                targetNode.processAssetsDirectly(currentSplitterAssets);
                            }
                        }
                    });
                }
                return currentSplitterAssets;
            } catch (err) {
                node.setNodeStatus('error');
                alert("Ayrıştırma hatası: " + err.message);
            } finally {
                loader.style.display = 'none';
                progressText.style.display = 'none';
                if (originalImageBlob) playBtn.style.display = 'flex';
            }
        };

        playBtn.addEventListener('click', executeSplitter);
        if (rerunBtn) rerunBtn.addEventListener('click', executeSplitter);

        if (playBtnConnected) {
            playBtnConnected.addEventListener('click', (e) => {
                e.stopPropagation();
                executeSplitter();
            });
        }
        if (runPipelineBtn) {
            runPipelineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                executeSplitter();
            });
        }

        // Connection hook for batch loader
        node.onConnectionChange = () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (upstream && upstream.dataset.nodeType === 'batch-loader') {
                if (currentSplitterAssets.length === 0 && !originalImageBlob) {
                    if (pipelineStatus) pipelineStatus.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                    if (img) img.style.display = 'none';
                    if (playBtn) playBtn.style.display = 'none';
                }
            } else {
                if (pipelineStatus) pipelineStatus.style.display = 'none';
                if (!originalImageBlob && currentSplitterAssets.length === 0) {
                    if (placeholder) placeholder.style.display = 'block';
                }
            }
        };

        if (downloadAllSplitterBtn) {
            downloadAllSplitterBtn.addEventListener('click', () => {
                currentSplitterAssets.forEach((asset, idx) => {
                    setTimeout(() => {
                        const a = document.createElement('a');
                        a.href = asset.data;
                        a.download = asset.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, idx * 200);
                });
            });
        }

        return node;
    }
};
