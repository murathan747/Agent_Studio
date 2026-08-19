/**
 * =========================================================================
 * AgentStudio - Node: Batch Loader
 * Handles bulk file queue (folders & multi-files) without memory overload.
 * =========================================================================
 */

import { BaseNode } from '../core/baseNode.js';

export const BatchLoaderNode = {
    type: 'batch-loader',
    title: 'Batch Loader',
    titleKey: 'node.batch_loader.title',
    subtitle: 'Toplu Dosya Yükleyici',
    subtitleKey: 'node.batch_loader.subtitle',

    createInstance(x, y) {
        const node = BaseNode.createNodeShell({
            type: 'batch-loader',
            title: 'Batch Loader',
            titleKey: 'node.batch_loader.title',
            subtitle: 'Toplu Dosya Yükleyici',
            subtitleKey: 'node.batch_loader.subtitle',
            x, y,
            width: '320px',
            hasInputPort: false,
            hasOutputPort: true,
            outputPortTitle: 'Çıkış: Dosyaları Pipeline\'a gönderir'
        });

        // Set header theme color
        const header = node.querySelector('.node-header');
        if (header) header.style.backgroundColor = '#78350f';

        const content = document.createElement('div');
        content.className = 'node-content';
        content.innerHTML = `
            <div class="drop-zone" style="height: 140px; cursor:pointer;">
                <!-- Default Empty Upload UI -->
                <div class="loader-empty-state" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:10px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span style="font-size:11px; color:#cbd5e1;" data-i18n="node.batch_loader.drop_text">Klasörü veya Dosyaları Sürükleyin</span>
                    <div style="display:flex; gap:6px; margin-top:4px;">
                        <button type="button" class="select-folder-btn" style="background:#262626; color:#f59e0b; border:1px solid #f59e0b; border-radius:4px; padding:4px 8px; font-size:10px; font-weight:bold; cursor:pointer;" data-i18n="node.batch_loader.btn_select_folder">📂 Klasör Seç</button>
                        <button type="button" class="select-files-btn" style="background:#262626; color:#e2e8f0; border:1px solid #4b5563; border-radius:4px; padding:4px 8px; font-size:10px; font-weight:bold; cursor:pointer;" data-i18n="node.batch_loader.btn_select_files">📁 Dosya Seç</button>
                    </div>
                </div>

                <!-- Loaded State (Lightweight Counter & Progress) -->
                <div class="loader-loaded-state" style="display:none; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; padding:10px; box-sizing:border-box;">
                    <div style="font-size:14px; font-weight:bold; color:#f59e0b; display:flex; align-items:center; gap:6px;">
                        <span class="file-count-text">0 Dosya Kuyrukta</span>
                    </div>
                    <div class="current-file-name" style="font-size:10px; color:#94a3b8; margin-top:4px; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        Hazır
                    </div>
                    <div class="batch-bar-container" style="display:block; width:100%; height:5px; background:#1e293b; border-radius:3px; margin-top:8px; overflow:hidden;">
                        <div class="batch-bar-fill" style="width:0%; height:100%; background:#f59e0b; transition:width 0.2s;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; width:100%; margin-top:8px; font-size:10px; color:#64748b;">
                        <span class="batch-status-text">Bekliyor...</span>
                        <button type="button" class="clear-files-btn" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:10px; text-decoration:underline;" data-i18n="node.batch_loader.btn_clear">Temizle</button>
                    </div>
                </div>

                <input type="file" class="folder-input" webkitdirectory directory multiple style="display:none;">
                <input type="file" class="files-input" multiple accept="image/*" style="display:none;">
            </div>
        `;
        node.appendChild(content);

        // Wiring output port data attributes
        const outPort = node.querySelector('.port-output');
        if (outPort) {
            outPort.dataset.port = 'output';
            outPort.setAttribute('data-i18n-title', 'node.batch_loader.port_out');
        }

        // Logic & Events
        const dropZone = node.querySelector('.drop-zone');
        const emptyState = node.querySelector('.loader-empty-state');
        const loadedState = node.querySelector('.loader-loaded-state');
        const fileCountText = node.querySelector('.file-count-text');
        const currentFileName = node.querySelector('.current-file-name');
        const batchBarFill = node.querySelector('.batch-bar-fill');
        const batchStatusText = node.querySelector('.batch-status-text');
        const folderInput = node.querySelector('.folder-input');
        const filesInput = node.querySelector('.files-input');
        const selectFolderBtn = node.querySelector('.select-folder-btn');
        const selectFilesBtn = node.querySelector('.select-files-btn');
        const clearFilesBtn = node.querySelector('.clear-files-btn');

        let fileQueue = [];
        let sourceFolder = "";

        function setFiles(files) {
            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length === 0) return;

            fileQueue = imageFiles;
            sourceFolder = "";
            if (imageFiles[0].webkitRelativePath) {
                const parts = imageFiles[0].webkitRelativePath.split('/');
                if (parts.length > 1) {
                    sourceFolder = parts[0];
                }
            }

            emptyState.style.display = 'none';
            loadedState.style.display = 'flex';
            fileCountText.innerText = `📦 ${fileQueue.length} Görsel Kuyrukta`;
            currentFileName.innerText = sourceFolder ? `📂 [${sourceFolder}] İlk: ${fileQueue[0].name}` : `İlk: ${fileQueue[0].name}`;
            batchBarFill.style.width = '0%';
            batchStatusText.innerText = `Hazır (${fileQueue.length} adet)`;
            node.setNodeStatus('completed');
        }

        selectFolderBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const res = await fetch('http://127.0.0.1:8000/api/dialog/select-folder', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (!data.cancelled && data.path && data.files && data.files.length > 0) {
                        fileQueue = data.files.map(f => ({
                            name: f.name,
                            path: f.path,
                            data: f.data,
                            type: 'image/png'
                        }));
                        sourceFolder = data.path;
                        emptyState.style.display = 'none';
                        loadedState.style.display = 'flex';
                        fileCountText.innerText = `📦 ${fileQueue.length} Görsel Kuyrukta`;
                        currentFileName.innerText = `📂 ${sourceFolder}`;
                        currentFileName.title = sourceFolder;
                        batchBarFill.style.width = '0%';
                        batchStatusText.innerText = `Hazır (${fileQueue.length} adet)`;
                        node.setNodeStatus('completed');
                        return;
                    }
                }
            } catch (err) {
                console.warn("Native dialog error, falling back to browser folder input:", err);
            }
            folderInput.click();
        });
        selectFilesBtn.addEventListener('click', (e) => { e.stopPropagation(); filesInput.click(); });
        folderInput.addEventListener('change', (e) => setFiles(e.target.files));
        filesInput.addEventListener('change', (e) => setFiles(e.target.files));

        clearFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileQueue = [];
            sourceFolder = "";
            emptyState.style.display = 'flex';
            loadedState.style.display = 'none';
            node.setNodeStatus('idle');
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                setFiles(e.dataTransfer.files);
            }
        });

        node.getFileQueue = () => fileQueue;
        node.getSourceFolder = () => sourceFolder;
        node.updateBatchProgress = (currentIdx, total, fileName) => {
            const pct = Math.round(((currentIdx + 1) / total) * 100);
            batchBarFill.style.width = `${pct}%`;
            currentFileName.innerText = `İşleniyor [${currentIdx + 1}/${total}]: ${fileName}`;
            batchStatusText.innerText = `%${pct} Tamamlandı`;
        };

        return node;
    }
};
