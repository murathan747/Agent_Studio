/**
 * =========================================================================
 * NodeAgent Studio - Application Bootstrap & Main Entry Point
 * Initializes Canvas, Wires, NodeRegistry, i18n and default workspace nodes.
 * =========================================================================
 */

import { CanvasEngine } from './core/canvas.js';
import { WiresEngine } from './core/wires.js';
import { NodeRegistry } from './core/nodeRegistry.js';
import { ApiClient } from './core/api.js';

// Core Node Definitions
import { BatchLoaderNode } from './nodes/batchLoaderNode.js';
import { SplitAssetsNode } from './nodes/splitAssetsNode.js';
import { RemoveBgNode } from './nodes/removeBgNode.js';
import { RelightNode } from './nodes/relightNode.js';
import { TimelineNode } from './nodes/timelineNode.js';
import { ResizeAlignNode } from './nodes/resizeAlignNode.js';
import { AutoSaveNode } from './nodes/autoSaveNode.js';

class App {
    constructor() {
        this.canvas = null;
        this.wires = null;
        this.registry = null;
    }

    init() {
        // 1. Initialize Localization
        this.initLanguage();

        // 2. Initialize Canvas & Wires Subsystems
        this.canvas = new CanvasEngine();
        window.CanvasEngine = this.canvas;

        this.wires = new WiresEngine(this.canvas);
        window.WiresEngine = this.wires;

        // 3. Initialize Node Registry & Register Core Nodes
        this.registry = new NodeRegistry(this.canvas);
        window.NodeRegistry = this.registry;

        this.registry.register(BatchLoaderNode);
        this.registry.register(SplitAssetsNode);
        this.registry.register(RemoveBgNode);
        this.registry.register(RelightNode);
        this.registry.register(TimelineNode);
        this.registry.register(ResizeAlignNode);
        this.registry.register(AutoSaveNode);

        // 4. Bind Sidebar drag/click spawning
        const sidebarToolsMap = {
            'batch-loader-tool': 'batch-loader',
            'asset-splitter-tool': 'asset-splitter',
            'bg-remove-tool': 'remove-bg',
            'relight-tool': 'relight',
            'timeline-tool': 'timeline-sequencer',
            'resize-tool': 'resize',
            'auto-save-tool': 'auto-save'
        };
        this.registry.bindSidebar(sidebarToolsMap);

        // 5. Fullscreen Toggle Button
        const fsBtn = document.getElementById('fullscreen-toggle-btn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log("Fullscreen request:", err));
                } else {
                    document.exitFullscreen().catch(err => console.log("Fullscreen exit:", err));
                }
            });
        }

        // 6. Spawn Default Ready-to-Use Pipeline (Split -> Remove BG -> Resize & Align)
        this.initDefaultWorkflow();

        console.log('✨ NodeAgent Studio initialized successfully with modular architecture.');
    }

    initDefaultWorkflow() {
        const splitNode = this.registry.createNode('asset-splitter', 60, 80);
        const bgNode = this.registry.createNode('remove-bg', 420, 80);
        const resizeNode = this.registry.createNode('resize', 780, 80);

        if (splitNode && bgNode && resizeNode) {
            const splitOut = splitNode.querySelector('.port-output');
            const bgIn = bgNode.querySelector('.port-input');
            const bgOut = bgNode.querySelector('.port-output');
            const resizeIn = resizeNode.querySelector('.port-input');

            if (splitOut && bgIn) {
                this.wires.addConnection(splitNode, splitOut, bgNode, bgIn);
            }
            if (bgOut && resizeIn) {
                this.wires.addConnection(bgNode, bgOut, resizeNode, resizeIn);
            }
            this.wires.updateAllWires();
        }
    }

    initLanguage() {
        if (window.i18n) {
            const langSelect = document.getElementById('language-select');
            if (langSelect) {
                langSelect.value = window.i18n.getLanguage();
                langSelect.onchange = (e) => {
                    window.i18n.setLanguage(e.target.value);
                };
            }
            window.i18n.updateDOM();
        }
    }
}

// Global bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
