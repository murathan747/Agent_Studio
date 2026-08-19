/**
 * =========================================================================
 * NodeAgent Studio - Node: Auto Save
 * Handles Master Batch Pipeline Orchestration and direct saving to disk.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';
import { ApiClient } from '../core/api.js';

export const AutoSaveNode = {
    type: 'auto-save',
    title: 'Auto Save',
    titleKey: 'node.auto_save.title',
    subtitle: 'Diske Otomatik Kaydetme',
    subtitleKey: 'node.auto_save.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'auto-save',
            title: 'Auto Save',
            titleKey: 'node.auto_save.title',
            subtitle: 'Diske Otomatik Kaydetme',
            subtitleKey: 'node.auto_save.subtitle',
            x, y,
            width: '320px',
            hasInputPort: true,
            hasOutputPort: false,
            inputPortTitle: 'Giriş: Kaydedilecek asset listesini alır'
        });

        // Set header theme color
        const header = node.querySelector('.node-header');
        if (header) header.style.backgroundColor = '#831843';

        const content = document.createElement('div');
        content.className = 'node-content';
        content.innerHTML = `
            <div style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:6px; padding:10px; box-sizing:border-box; font-size:11px;">
                <div style="color:#94a3b8; margin-bottom:4px; font-weight:600;" data-i18n="node.auto_save.target_folder">Hedef Kayıt Dizini:</div>
                <div style="display:flex; gap:4px;">
                    <input type="text" class="save-dir-input" value="" placeholder="Otomatik (Giriş Dizini) veya özel klasör..." style="flex:1; background:#030712; border:1px solid #4b5563; border-radius:4px; color:#fff; padding:6px 8px; font-size:11px; box-sizing:border-box;">
                    <button type="button" class="browse-save-dir-btn" style="background:#1e293b; border:1px solid #4b5563; color:#93c5fd; border-radius:4px; padding:0 8px; font-size:12px; cursor:pointer;" title="Klasör Seç">📂</button>
                </div>
                <div style="font-size:9px; color:#64748b; margin-top:4px;">💡 Boş bırakılırsa dosyaların okunduğu giriş klasörüne otomatik kaydeder.</div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; color:#cbd5e1;">
                    <span data-i18n="node.auto_save.subfolders">Tarih/İşlem Alt Klasörlerine Ayır</span>
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:18px;">
                        <input type="checkbox" class="subfolder-toggle" checked style="opacity:0; width:0; height:0;">
                        <span class="slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#374151; transition:.3s; border-radius:18px;"></span>
                    </label>
                </div>
            </div>

            <!-- Master Run Button -->
            <div style="width:100%; margin-top:12px;">
                <button type="button" class="run-batch-pipeline-btn pulse-btn" style="width:100%; padding:10px; background:#059669; border:1px solid #34d399; border-radius:6px; color:white; font-size:12px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span data-i18n="node.auto_save.btn_run_pipeline">⚡ TÜM TOPLU AKIŞI ÇALIŞTIR</span>
                </button>
            </div>

            <!-- Save Status Log -->
            <div class="save-status-box" style="display:none; width:100%; margin-top:10px; background:#030712; border:1px solid #334155; border-radius:6px; padding:8px; font-size:10px; color:#38bdf8; box-sizing:border-box;">
                <div class="save-log-text">Hazır</div>
            </div>
        `;
        node.appendChild(content);

        // Styling the custom toggle switch slider
        const toggleInput = content.querySelector('.subfolder-toggle');
        const sliderSpan = content.querySelector('.slider');
        function updateToggleUI() {
            if (toggleInput.checked) {
                sliderSpan.style.backgroundColor = '#059669';
            } else {
                sliderSpan.style.backgroundColor = '#374151';
            }
        }
        toggleInput.addEventListener('change', updateToggleUI);
        updateToggleUI();

        const saveDirInput = node.querySelector('.save-dir-input');
        const browseSaveDirBtn = node.querySelector('.browse-save-dir-btn');
        const subfolderToggle = node.querySelector('.subfolder-toggle');
        const runBatchBtn = node.querySelector('.run-batch-pipeline-btn');
        const saveStatusBox = node.querySelector('.save-status-box');
        const saveLogText = node.querySelector('.save-log-text');

        if (browseSaveDirBtn) {
            browseSaveDirBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch('http://127.0.0.1:8000/api/dialog/select-folder', { method: 'POST' });
                    if (res.ok) {
                        const data = await res.json();
                        if (!data.cancelled && data.path) {
                            saveDirInput.value = data.path;
                        }
                    }
                } catch (e) {
                    console.error("Browse error:", e);
                }
            });
        }

        node.saveBatchToDisk = async (assets, sourceFileName, sourceFolder) => {
            if (!assets || assets.length === 0) return { saved_count: 0 };
            
            const payload = {
                assets: assets.map(a => ({ name: a.name, label: a.label || '', data: a.data })),
                output_dir: saveDirInput.value.trim(),
                source_filename: sourceFileName || 'sheet',
                source_folder: sourceFolder || '',
                create_subfolder: subfolderToggle.checked
            };

            const res = await fetch('http://127.0.0.1:8000/api/save-assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());
            return await res.json();
        };

        // Master End-to-End Orchestrator
        runBatchBtn.addEventListener('click', async () => {
            const upstream = window.WiresEngine ? window.WiresEngine.getUpstreamNode(node) : null;
            if (!upstream) {
                alert("Lütfen önce Auto Save node'unun sol pinine bir işlem node'u (Resize & Align, Remove Background veya Split Assets) bağlayın!");
                return;
            }

            // Trace back to root node (Batch Loader, Split Assets, Remove BG, Resize)
            let currentNode = upstream;
            let path = [currentNode];
            while (true) {
                const prev = window.WiresEngine ? window.WiresEngine.getUpstreamNode(currentNode) : null;
                if (prev) {
                    path.unshift(prev);
                    currentNode = prev;
                } else {
                    break;
                }
            }

            const rootNode = path[0];
            let rootSourceFolder = (rootNode && typeof rootNode.getSourceFolder === 'function') ? rootNode.getSourceFolder() : '';

            saveStatusBox.style.display = 'block';
            runBatchBtn.style.display = 'none';
            node.setNodeStatus('running');
            let totalSavedAll = 0;
            let lastSavedFolder = '';

            try {
                // CASE 1: Batch Loader is the root with multiple files
                if (rootNode.dataset.nodeType === 'batch-loader') {
                    const queue = (typeof rootNode.getFileQueue === 'function') ? rootNode.getFileQueue() : [];
                    if (queue.length === 0) {
                        alert("Lütfen önce Batch Loader node'una klasör veya resimleri yükleyin!");
                        node.setNodeStatus('idle');
                        runBatchBtn.style.display = 'flex';
                        return;
                    }

                    for (let i = 0; i < queue.length; i++) {
                        const file = queue[i];
                        saveLogText.innerText = `[${i + 1}/${queue.length}] İşleniyor: ${file.name}...`;
                        if (typeof rootNode.updateBatchProgress === 'function') {
                            rootNode.updateBatchProgress(i, queue.length, file.name);
                        }

                        // Step 1: Split Assets (if in chain)
                        const splitterNode = path.find(n => n.dataset.nodeType === 'asset-splitter');
                        let splitAssets = [];
                        if (splitterNode && typeof splitterNode.processSingleFile === 'function') {
                            splitAssets = await splitterNode.processSingleFile(file);
                        } else {
                            splitAssets = [{ name: file.name, label: 'asset', data: file.data || (await ApiClient.fileToBase64(file)) }];
                        }

                        // Step 2: Remove Background (if in chain)
                        const bgNode = path.find(n => n.dataset.nodeType === 'remove-bg');
                        let bgAssets = [];
                        if (bgNode && splitAssets.length > 0 && typeof bgNode.processAssetsDirectly === 'function') {
                            saveLogText.innerText = `[${i + 1}/${queue.length}] ${file.name}: Arka planlar temizleniyor...`;
                            bgAssets = await bgNode.processAssetsDirectly(splitAssets);
                        } else {
                            bgAssets = splitAssets;
                        }

                        // Step 2.5: Relight / Atmosphere (if in chain)
                        const relightNode = path.find(n => n.dataset.nodeType === 'relight');
                        let relitAssets = bgAssets;
                        if (relightNode && bgAssets.length > 0 && typeof relightNode.processAssetsDirectly === 'function') {
                            saveLogText.innerText = `[${i + 1}/${queue.length}] ${file.name}: Işıklandırılıyor...`;
                            relitAssets = await relightNode.processAssetsDirectly(bgAssets);
                        }

                        // Step 2.8: Timeline Sequencer (if in chain & active)
                        const timelineNode = path.find(n => n.dataset.nodeType === 'timeline-sequencer');
                        let timedAssets = relitAssets;
                        if (timelineNode && relitAssets.length > 0 && typeof timelineNode.processAssetsDirectly === 'function') {
                            saveLogText.innerText = `[${i + 1}/${queue.length}] ${file.name}: Keyframe sekansı üretiliyor...`;
                            timedAssets = await timelineNode.processAssetsDirectly(relitAssets);
                        }

                        // Step 3: Resize (if in chain)
                        const resizeNode = path.find(n => n.dataset.nodeType === 'asset-resize');
                        let finalAssets = [];
                        if (resizeNode && timedAssets.length > 0 && typeof resizeNode.processAssetsDirectly === 'function') {
                            saveLogText.innerText = `[${i + 1}/${queue.length}] ${file.name}: Ölçekleniyor...`;
                            finalAssets = await resizeNode.processAssetsDirectly(timedAssets);
                        } else {
                            finalAssets = timedAssets;
                        }

                        // Step 4: Save to Disk
                        if (finalAssets.length > 0) {
                            saveLogText.innerText = `[${i + 1}/${queue.length}] ${file.name}: Diske kaydediliyor (${finalAssets.length} kare)...`;
                            const saveRes = await node.saveBatchToDisk(finalAssets, file.name, rootSourceFolder);
                            totalSavedAll += (saveRes.saved_count || 0);
                            if (saveRes.target_dir) lastSavedFolder = saveRes.target_dir;
                        }
                    }
                }
                // CASE 2: Single pipeline chain (Split Assets -> Remove BG -> Relight -> Timeline -> Resize)
                else {
                    let currentAssets = [];
                    
                    // 1. Check if upstream (e.g. Timeline or Resize) ALREADY has rendered/cached assets
                    const upstreamCached = (typeof upstream.getCachedAssets === 'function') ? upstream.getCachedAssets() : [];
                    if (upstreamCached && upstreamCached.length > 0 && upstream !== rootNode) {
                        currentAssets = upstreamCached;
                    } else {
                        // 2. Otherwise start from root and flow through all nodes in path
                        if (typeof rootNode.getCachedAssets === 'function' && rootNode.getCachedAssets().length > 0) {
                            currentAssets = rootNode.getCachedAssets();
                        } else if (typeof rootNode.getImageFile === 'function' && rootNode.getImageFile()) {
                            const file = rootNode.getImageFile();
                            const b64 = await ApiClient.fileToBase64(file);
                            currentAssets = [{ name: file.name, label: 'asset', data: b64, rawData: b64 }];
                        }
                        
                        if (currentAssets.length === 0) {
                            saveLogText.innerText = "Kaynak düğüm çalıştırılıyor...";
                            if (typeof rootNode.triggerPipeline === 'function') {
                                await rootNode.triggerPipeline();
                            } else if (typeof rootNode.runSplitter === 'function') {
                                await rootNode.runSplitter(false);
                            }
                            currentAssets = (typeof rootNode.getCachedAssets === 'function') ? rootNode.getCachedAssets() : [];
                        }

                        // Sequentially process each intermediate node in path
                        for (let pIdx = 1; pIdx < path.length; pIdx++) {
                            const stepNode = path[pIdx];
                            const stepType = stepNode.dataset.nodeType || '';
                            saveLogText.innerText = `İşleniyor (${stepType})...`;
                            if (typeof stepNode.processAssetsDirectly === 'function') {
                                currentAssets = await stepNode.processAssetsDirectly(currentAssets);
                            }
                        }
                    }

                    if (currentAssets && currentAssets.length > 0) {
                        saveLogText.innerText = `Diske kaydediliyor (${currentAssets.length} asset / kare)...`;
                        const srcName = (rootNode && rootNode.getImageFile && rootNode.getImageFile()) ? (rootNode.getImageFile().name || 'sheet') : 'processed_assets';
                        const saveRes = await node.saveBatchToDisk(currentAssets, srcName, rootSourceFolder);
                        totalSavedAll = saveRes.saved_count || currentAssets.length;
                        if (saveRes.target_dir) lastSavedFolder = saveRes.target_dir;
                    } else {
                        throw new Error("Kaydedilecek hazır asset bulunamadı. Lütfen önceki düğümlerde bir resim olduğundan emin olun.");
                    }
                }

                saveLogText.innerHTML = `✅ <b>Bitti!</b> Toplam <b>${totalSavedAll}</b> adet asset kaydedildi.<br><span style="font-size:9px; color:#94a3b8; word-break:break-all;">📁 ${lastSavedFolder || 'output/assets'}</span>`;
                saveLogText.style.color = '#34d399';
                node.setNodeStatus('completed');
            } catch (err) {
                console.error("Batch Run Error:", err);
                saveLogText.innerText = `❌ Hata: ${err.message}`;
                saveLogText.style.color = '#ef4444';
                node.setNodeStatus('error');
            } finally {
                runBatchBtn.style.display = 'flex';
            }
        });

        return node;
    }
};
