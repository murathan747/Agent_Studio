/**
 * =========================================================================
 * AgentStudio - Canvas Viewport & Navigation Engine
 * Handles Infinite Grid, Zooming (cursor-centered), Panning, and Snap-to-Grid.
 * =========================================================================
 */

export class CanvasEngine {
    constructor() {
        this.viewport = document.getElementById('canvas-viewport');
        this.world = document.getElementById('canvas-world');
        this.zoomText = document.getElementById('zoom-level-text');
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.zoomResetBtn = document.getElementById('zoom-reset-btn');

        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.minZoom = 0.25;
        this.maxZoom = 2.5;
        this.gridSize = 20;

        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.isSpacePressed = false;

        this.init();
    }

    init() {
        this.updateTransform();
        this.bindEvents();
    }

    updateTransform() {
        if (!this.world || !this.viewport) return;
        this.world.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.viewport.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
        this.viewport.style.backgroundSize = `${24 * this.zoom}px ${24 * this.zoom}px`;
        if (this.zoomText) {
            this.zoomText.innerText = `${Math.round(this.zoom * 100)}%`;
        }
        if (window.WiresEngine) {
            window.WiresEngine.updateAllWires();
        }
    }

    setZoomAt(newZoom, clientX, clientY) {
        newZoom = Math.min(Math.max(newZoom, this.minZoom), this.maxZoom);
        if (Math.abs(newZoom - this.zoom) < 0.001) return;

        const rect = this.viewport.getBoundingClientRect();
        const mouseX = (clientX !== undefined ? clientX : (rect.left + rect.width / 2)) - rect.left;
        const mouseY = (clientY !== undefined ? clientY : (rect.top + rect.height / 2)) - rect.top;

        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        this.updateTransform();
    }

    screenToWorld(clientX, clientY) {
        const worldRect = this.world.getBoundingClientRect();
        return {
            x: Math.round(((clientX - worldRect.left) / this.zoom) / this.gridSize) * this.gridSize,
            y: Math.round(((clientY - worldRect.top) / this.zoom) / this.gridSize) * this.gridSize
        };
    }

    getViewportCenterWorld(offsetRandom = true) {
        const rect = this.viewport.getBoundingClientRect();
        const worldRect = this.world.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let x = Math.round(((cx - worldRect.left) / this.zoom) / this.gridSize) * this.gridSize - 120;
        let y = Math.round(((cy - worldRect.top) / this.zoom) / this.gridSize) * this.gridSize - 80;

        if (offsetRandom) {
            x += (Math.floor(Math.random() * 5) - 2) * (this.gridSize * 2);
            y += (Math.floor(Math.random() * 5) - 2) * (this.gridSize * 2);
        }
        return { x, y };
    }

    bindEvents() {
        // Wheel Zoom (Mouse wheel zooming centered at cursor everywhere)
        this.viewport.addEventListener('wheel', (e) => {
            // Only skip canvas zoom if scrolling inside specific scrollable lists, dropdowns, or sidebar
            if (
                e.target.closest('.sidebar') ||
                e.target.closest('.results-grid') ||
                e.target.closest('.batch-results-grid') ||
                e.target.closest('.batch-queue-list') ||
                e.target.closest('input[type="range"]') ||
                e.target.closest('select')
            ) {
                return;
            }

            // Ignore micro noise / inertial touchpad drift
            if (Math.abs(e.deltaY) < 3) {
                return;
            }

            e.preventDefault();

            // Smooth normalized zoom calculation
            const zoomSensitivity = 0.0010;
            const delta = -e.deltaY;
            const factor = Math.exp(Math.max(-0.25, Math.min(0.25, delta * zoomSensitivity)));
            this.setZoomAt(this.zoom * factor, e.clientX, e.clientY);
        }, { passive: false });

        // Zoom Buttons
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', () => {
                const rect = this.viewport.getBoundingClientRect();
                this.setZoomAt(this.zoom * 1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
        }
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', () => {
                const rect = this.viewport.getBoundingClientRect();
                this.setZoomAt(this.zoom / 1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
        }
        if (this.zoomResetBtn) {
            this.zoomResetBtn.addEventListener('click', () => {
                this.zoom = 1;
                this.panX = 0;
                this.panY = 0;
                this.updateTransform();
            });
        }
        if (this.zoomText) {
            this.zoomText.addEventListener('click', () => {
                this.zoom = 1;
                this.panX = 0;
                this.panY = 0;
                this.updateTransform();
            });
        }

        // Spacebar Panning Mode
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
                this.isSpacePressed = true;
                this.viewport.style.cursor = 'grab';
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpacePressed = false;
                if (!this.isPanning) this.viewport.style.cursor = 'default';
            }
        });

        // Mouse Panning
        this.viewport.addEventListener('mousedown', (e) => {
            const wiresSvg = document.getElementById('wires-svg');
            const isCanvasBg = e.target === this.viewport || e.target === this.world || e.target === wiresSvg;
            if (isCanvasBg || e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
                if (e.button === 0 || e.button === 1) {
                    this.isPanning = true;
                    this.panStartX = e.clientX - this.panX;
                    this.panStartY = e.clientY - this.panY;
                    this.viewport.style.cursor = 'grabbing';
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.panX = e.clientX - this.panStartX;
                this.panY = e.clientY - this.panStartY;
                this.updateTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.viewport.style.cursor = this.isSpacePressed ? 'grab' : 'default';
            }
        });
    }
}
