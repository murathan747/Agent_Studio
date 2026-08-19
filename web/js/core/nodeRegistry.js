/**
 * =========================================================================
 * NodeAgent Studio - Node Registry & Factory Engine
 * Scalable, plugin-friendly registration for all Node Types (Core & Custom).
 * =========================================================================
 */

export class NodeRegistry {
    constructor(canvasEngine) {
        this.canvas = canvasEngine;
        this.registry = new Map();
        this.draggedType = null;
    }

    register(definition) {
        if (!definition.type) {
            console.error('Node registration failed: missing "type" property', definition);
            return;
        }
        this.registry.set(definition.type, definition);
    }

    get(type) {
        return this.registry.get(type);
    }

    getAll() {
        return Array.from(this.registry.values());
    }

    createNode(type, x, y) {
        const def = this.registry.get(type);
        if (!def || typeof def.createInstance !== 'function') {
            console.error(`Cannot create node: type "${type}" is not registered.`);
            return null;
        }

        const nodeEl = def.createInstance(x, y);
        if (nodeEl) {
            this.canvas.world.appendChild(nodeEl);
            if (window.i18n) {
                window.i18n.updateDOM();
            }
        }
        return nodeEl;
    }

    bindSidebar(toolsMap) {
        Object.keys(toolsMap).forEach(toolId => {
            const el = document.getElementById(toolId);
            const type = toolsMap[toolId];
            if (!el) return;

            el.addEventListener('dragstart', (e) => {
                this.draggedType = type;
                e.dataTransfer.setData('text/plain', type);
                e.dataTransfer.effectAllowed = 'copy';
            });

            el.addEventListener('dragend', () => {
                setTimeout(() => { this.draggedType = null; }, 100);
            });

            // Click to spawn node in viewport center
            el.addEventListener('click', () => {
                const { x, y } = this.canvas.getViewportCenterWorld();
                this.createNode(type, x, y);
            });
        });

        // Drop on canvas viewport
        this.canvas.viewport.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.viewport.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = this.draggedType || e.dataTransfer.getData('text/plain');
            if (type && this.registry.has(type)) {
                const { x, y } = this.canvas.screenToWorld(e.clientX, e.clientY);
                this.createNode(type, x, y);
                this.draggedType = null;
            }
        });
    }
}
