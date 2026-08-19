/**
 * =========================================================================
 * AgentStudio - BaseNode Standard Component Helper
 * Common lifecycle, standard shell, laser progress line, and draggable handlers.
 * =========================================================================
 */

let globalZIndex = 10;

export class BaseNode {
    static createNodeShell(options) {
        const {
            id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type = 'generic',
            title = 'Node Title',
            titleKey = '',
            subtitle = '',
            subtitleKey = '',
            x = 100,
            y = 100,
            width = '320px',
            hasInputPort = true,
            hasOutputPort = true,
            inputPortTitle = 'Input',
            outputPortTitle = 'Output'
        } = options;

        const node = document.createElement('div');
        node.className = 'node';
        node.id = id;
        node.dataset.nodeType = type;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.width = width;

        // Progress Bar Element
        const progressLine = document.createElement('div');
        progressLine.className = 'node-progress-line state-idle';
        progressLine.innerHTML = '<div class="progress-fill"></div>';

        // Header Element
        const header = document.createElement('div');
        header.className = 'node-header';
        header.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span class="node-title" ${titleKey ? `data-i18n="${titleKey}"` : ''}>${title}</span>
                <span class="node-subtitle" style="font-size:10px; color:#9ca3af; font-weight:normal;" ${subtitleKey ? `data-i18n="${subtitleKey}"` : ''}>${subtitle}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="node-status-badge" style="display:none; font-size:10px; padding:2px 6px; border-radius:4px;"></span>
                <span class="close-btn" title="Kapat / Close">✕</span>
            </div>
        `;

        node.appendChild(header);
        node.appendChild(progressLine);

        // Standard Ports
        if (hasInputPort) {
            const inPort = document.createElement('div');
            inPort.className = 'node-port port-input';
            inPort.title = inputPortTitle;
            inPort.innerText = 'IN';
            node.appendChild(inPort);
        }

        if (hasOutputPort) {
            const outPort = document.createElement('div');
            outPort.className = 'node-port port-output';
            outPort.title = outputPortTitle;
            outPort.innerText = 'OUT';
            node.appendChild(outPort);
        }

        // Status Management API on DOM element
        node.setNodeStatus = function(state) {
            progressLine.className = `node-progress-line state-${state}`;
        };

        // Close / Delete Handlers
        header.querySelector('.close-btn').addEventListener('click', () => {
            if (window.WiresEngine) {
                window.WiresEngine.removeNodeConnections(node);
            }
            if (typeof node.onDestroy === 'function') {
                node.onDestroy();
            }
            node.remove();
        });

        // Draggable setup
        BaseNode.makeDraggable(node, header);

        // Wiring setup
        if (window.WiresEngine) {
            window.WiresEngine.setupPortWiring(node);
        }

        return node;
    }

    /**
     * Finds the full upstream chain up to the root-most node in evaluation order.
     * e.g. [BatchLoader, SplitAssets, RemoveBg]
     */
    static getUpstreamChain(node) {
        const chain = [];
        let curr = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
        while (curr) {
            chain.unshift(curr);
            curr = window.WiresEngine ? window.WiresEngine.getUpstreamNode(curr) : null;
        }
        return chain;
    }

    /**
     * Houdini-style Input & Dependency Validation.
     * Inspects the root-most node of the graph to confirm source files/assets exist
     * BEFORE any node enters the 'running' / cooking state.
     */
    static validateChainInput(node) {
        const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
        if (!upstream) {
            const hasSelfData = (typeof node.hasImage === 'function' && node.hasImage()) ||
                                (typeof node.getCachedAssets === 'function' && node.getCachedAssets().length > 0) ||
                                (typeof node.getFileQueue === 'function' && node.getFileQueue().length > 0);
            return {
                valid: hasSelfData,
                rootNode: node,
                chain: [],
                message: hasSelfData ? "OK" : "Lütfen bu düğüme bir resim yükleyin veya sol pine bir düğüm bağlayın!"
            };
        }

        const chain = BaseNode.getUpstreamChain(node);
        if (chain.length === 0) {
            return { valid: false, rootNode: null, chain: [], message: "Bağlantı bulunamadı." };
        }

        const root = chain[0];
        const rootType = root.dataset.nodeType;

        let hasData = false;
        let rootName = "Önceki Düğüm";

        if (rootType === 'batch-loader') {
            rootName = "Batch Loader";
            hasData = typeof root.getFileQueue === 'function' && root.getFileQueue().length > 0;
        } else if (rootType === 'asset-splitter') {
            rootName = "Split Assets";
            hasData = (typeof root.hasImage === 'function' && root.hasImage()) ||
                      (typeof root.hasFreshResults === 'function' && root.hasFreshResults());
        } else if (rootType === 'remove-bg') {
            rootName = "Remove Background";
            hasData = (typeof root.hasImage === 'function' && root.hasImage()) ||
                      (typeof root.getCachedAssets === 'function' && root.getCachedAssets().length > 0);
        } else if (rootType === 'asset-relight') {
            rootName = "Relight & Atmosphere";
            hasData = (typeof root.hasImage === 'function' && root.hasImage()) ||
                      (typeof root.getCachedAssets === 'function' && root.getCachedAssets().length > 0);
        } else if (rootType === 'asset-resize') {
            rootName = "Resize & Align";
            hasData = typeof root.getCachedAssets === 'function' && root.getCachedAssets().length > 0;
        } else {
            hasData = (typeof root.hasImage === 'function' && root.hasImage()) ||
                      (typeof root.getCachedAssets === 'function' && root.getCachedAssets().length > 0);
        }

        return {
            valid: hasData,
            rootNode: root,
            chain: chain,
            message: hasData ? "OK" : `Akış başlatılamadı: Lütfen en baştaki '${rootName}' düğümüne resim veya dosya yükleyin!`
        };
    }

    /**
     * Centralized upstream pipeline resolver and orchestrator across all nodes.
     * Evaluates dependencies without starting fake progress animations on empty inputs.
     */
    static async pullUpstreamAssets(node) {
        const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
        if (!upstream) return [];

        // 1. If immediate upstream already has cached assets ready, return immediately
        if (typeof upstream.getCachedAssets === 'function') {
            const cached = upstream.getCachedAssets();
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        // 2. Strict Pre-Flight Validation (Houdini Cook Guard)
        const check = BaseNode.validateChainInput(node);
        if (!check.valid) {
            node.setNodeStatus('idle');
            alert(check.message);
            return [];
        }

        // 3. Execute chain forward from root with full live status
        let currentAssets = [];
        for (const stepNode of check.chain) {
            const nodeType = stepNode.dataset.nodeType;

            if (nodeType === 'asset-splitter') {
                if (typeof stepNode.runSplitter === 'function') {
                    currentAssets = await stepNode.runSplitter(false);
                }
            } else if (nodeType === 'remove-bg') {
                if (currentAssets.length > 0 && typeof stepNode.processBatchAssets === 'function') {
                    currentAssets = await stepNode.processBatchAssets(currentAssets);
                } else if (currentAssets.length > 0 && typeof stepNode.processAssetsDirectly === 'function') {
                    currentAssets = await stepNode.processAssetsDirectly(currentAssets);
                } else if (typeof stepNode.runSingleRemoveBg === 'function') {
                    await stepNode.runSingleRemoveBg();
                    if (typeof stepNode.getCachedAssets === 'function') {
                        currentAssets = stepNode.getCachedAssets();
                    }
                }
            } else if (nodeType === 'asset-relight') {
                if (currentAssets.length > 0 && typeof stepNode.processAssetsDirectly === 'function') {
                    currentAssets = await stepNode.processAssetsDirectly(currentAssets);
                }
            } else if (nodeType === 'asset-resize') {
                if (currentAssets.length > 0 && typeof stepNode.processAssetsDirectly === 'function') {
                    currentAssets = await stepNode.processAssetsDirectly(currentAssets);
                }
            }
        }

        if (currentAssets && currentAssets.length > 0) {
            return currentAssets;
        }

        if (typeof upstream.getCachedAssets === 'function') {
            return upstream.getCachedAssets() || [];
        }
        return [];
    }

    static makeDraggable(element, handle) {
        let startClientX, startClientY, initialLeft, initialTop;
        const GRID_SIZE = 20;

        const onMouseMove = (e) => {
            const zoom = window.CanvasEngine ? window.CanvasEngine.zoom : 1;
            let dx = (e.clientX - startClientX) / zoom;
            let dy = (e.clientY - startClientY) / zoom;

            let newLeft = Math.round((initialLeft + dx) / GRID_SIZE) * GRID_SIZE;
            let newTop = Math.round((initialTop + dy) / GRID_SIZE) * GRID_SIZE;

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;

            if (window.WiresEngine) {
                window.WiresEngine.updateAllWires();
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            startClientX = e.clientX;
            startClientY = e.clientY;
            initialLeft = parseFloat(element.style.left) || 0;
            initialTop = parseFloat(element.style.top) || 0;

            globalZIndex++;
            element.style.zIndex = globalZIndex;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    static setupModelManager(node, modelKey, modelTitle) {
        const pill = node.querySelector('.model-status-pill');
        const card = node.querySelector('.model-manager-card');
        const downloadBtn = card ? card.querySelector('.download-model-btn') : null;
        const progBox = card ? card.querySelector('.model-download-progress') : null;
        const progFill = card ? card.querySelector('.model-prog-fill') : null;
        const progText = card ? card.querySelector('.model-prog-text') : null;
        const progPct = card ? card.querySelector('.model-prog-pct') : null;
        const errorBox = card ? card.querySelector('.model-download-error') : null;
        const retryBtn = card ? card.querySelector('.retry-download-btn') : null;
        const dropZone = node.querySelector('.drop-zone');

        let pollTimer = null;

        async function checkStatus() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/models/status`);
                if (!res.ok) return;
                const allData = await res.json();
                const data = allData[modelKey];
                if (!data) return;

                if (data.installed || data.status === 'ready') {
                    if (pill) {
                        pill.setAttribute('data-i18n', 'model.status.ready');
                        pill.innerHTML = window.i18n ? window.i18n.t('model.status.ready') : '🟢 Ready';
                        pill.style.cssText = 'font-size:10px; padding:2px 7px; border-radius:10px; font-weight:bold; background:#064e3b; color:#34d399; cursor:pointer;';
                        pill.title = 'Model hazır. Tıklayarak eksik parçaları tamamlayabilir veya yeniden indirebilirsiniz.';
                    }
                    if (card && card.dataset.userOpened !== 'true') card.style.display = 'none';
                    if (dropZone && card.dataset.userOpened !== 'true') dropZone.style.display = 'flex';
                    if (downloadBtn) {
                        downloadBtn.innerHTML = '🔄 Eksik Parçaları Tamamla / Yeniden İndir';
                        downloadBtn.style.display = card.dataset.userOpened === 'true' ? 'flex' : 'none';
                    }
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                } else if (data.status === 'downloading') {
                    if (pill) {
                        pill.innerHTML = window.i18n ? window.i18n.t('model.status.downloading', { pct: data.percent }) : `⏳ %${data.percent}`;
                        pill.style.cssText = 'font-size:10px; padding:2px 7px; border-radius:10px; font-weight:bold; background:#1e3a8a; color:#60a5fa; cursor:default;';
                    }
                    if (card) {
                        card.dataset.userOpened = 'false';
                        card.style.display = 'block';
                    }
                    if (dropZone) dropZone.style.display = 'none';
                    if (downloadBtn) downloadBtn.style.display = 'none';
                    if (progBox) progBox.style.display = 'block';
                    if (errorBox) errorBox.style.display = 'none';
                    if (progFill) progFill.style.width = `${data.percent}%`;
                    if (progPct) progPct.innerText = `%${data.percent}`;
                    if (progText) progText.innerText = data.message || 'İndiriliyor...';

                    if (!pollTimer) {
                        pollTimer = setInterval(checkStatus, 1500);
                    }
                } else if (data.status === 'error') {
                    if (pill) {
                        pill.setAttribute('data-i18n', 'model.status.error');
                        pill.innerHTML = window.i18n ? window.i18n.t('model.status.error') : '❌ Error';
                        pill.style.cssText = 'font-size:10px; padding:2px 7px; border-radius:10px; font-weight:bold; background:#7f1d1d; color:#f87171; cursor:pointer;';
                    }
                    if (card) card.style.display = 'block';
                    if (dropZone) dropZone.style.display = 'none';
                    if (downloadBtn) downloadBtn.style.display = 'none';
                    if (progBox) progBox.style.display = 'none';
                    if (errorBox) {
                        errorBox.style.display = 'block';
                        const msg = errorBox.querySelector('.error-msg');
                        if (msg) msg.innerText = data.error || 'İndirme hatası oluştu.';
                    }
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                } else {
                    if (pill) {
                        pill.setAttribute('data-i18n', 'model.status.download');
                        pill.innerHTML = window.i18n ? window.i18n.t('model.status.download') : '📥 Download';
                        pill.style.cssText = 'font-size:10px; padding:2px 7px; border-radius:10px; font-weight:bold; background:#451a03; color:#fbbf24; cursor:pointer;';
                    }
                    if (card) card.style.display = 'block';
                    if (dropZone) dropZone.style.display = 'none';
                    if (downloadBtn) downloadBtn.style.display = 'flex';
                    if (progBox) progBox.style.display = 'none';
                    if (errorBox) errorBox.style.display = 'none';
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                }
            } catch (e) {
                console.log('Model status check error:', e);
            }
        }

        async function triggerDownload() {
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (progBox) progBox.style.display = 'block';
            if (errorBox) errorBox.style.display = 'none';
            if (progFill) progFill.style.width = '5%';
            if (progPct) progPct.innerText = '%5';
            if (progText) progText.innerText = 'İndirme başlatılıyor...';

            try {
                await fetch(`http://127.0.0.1:8000/api/models/download/${modelKey}`, { method: 'POST' });
                checkStatus();
                if (!pollTimer) {
                    pollTimer = setInterval(checkStatus, 1500);
                }
            } catch (err) {
                if (errorBox) {
                    errorBox.style.display = 'block';
                    const msg = errorBox.querySelector('.error-msg');
                    if (msg) msg.innerText = err.message;
                }
            }
        }

        if (downloadBtn) downloadBtn.addEventListener('click', triggerDownload);
        if (retryBtn) retryBtn.addEventListener('click', triggerDownload);
        if (pill) pill.addEventListener('click', () => {
            if (card) {
                const isOpen = card.style.display !== 'none';
                if (isOpen) {
                    card.dataset.userOpened = 'false';
                    card.style.display = 'none';
                    if (dropZone) dropZone.style.display = 'flex';
                } else {
                    card.dataset.userOpened = 'true';
                    card.style.display = 'block';
                    if (downloadBtn) {
                        downloadBtn.innerHTML = '🔄 Eksik Parçaları Tamamla / Yeniden İndir';
                        downloadBtn.style.display = 'flex';
                    }
                }
            }
        });

        node.onDestroy = () => {
            if (pollTimer) clearInterval(pollTimer);
        };

        checkStatus();
    }
}
