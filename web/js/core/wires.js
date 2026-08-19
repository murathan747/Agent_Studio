/**
 * =========================================================================
 * NodeAgent Studio - Wires & Connection Graph Engine
 * High-performance SVG Bezier Wire Routing, Multi-port wiring & Topology queries.
 * =========================================================================
 */

export class WiresEngine {
    constructor(canvasEngine) {
        this.canvas = canvasEngine;
        this.svg = document.getElementById('wires-svg');
        this.connections = []; // Array of { id, fromNode, fromPort, toNode, toPort, pathEl }
        this.activeWireDrag = null; // { fromNode, fromPort, startX, startY, pathEl }
        this.selectedStartPort = null;

        this.initGlobalEvents();
    }

    getBezierPath(x1, y1, x2, y2) {
        const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }

    getPortCenter(portEl) {
        const portRect = portEl.getBoundingClientRect();
        const worldRect = this.canvas.world.getBoundingClientRect();
        return {
            x: (portRect.left + portRect.width / 2 - worldRect.left) / this.canvas.zoom,
            y: (portRect.top + portRect.height / 2 - worldRect.top) / this.canvas.zoom
        };
    }

    updateAllWires() {
        this.connections.forEach(conn => {
            if (!conn.fromPort || !conn.toPort || !conn.pathEl) return;
            const p1 = this.getPortCenter(conn.fromPort);
            const p2 = this.getPortCenter(conn.toPort);
            conn.pathEl.setAttribute('d', this.getBezierPath(p1.x, p1.y, p2.x, p2.y));
        });
    }

    addConnection(fromNode, fromPort, toNode, toPort) {
        if (!fromNode || !toNode || fromNode === toNode) return null;

        // Prevent duplicates
        const existing = this.connections.find(c => c.fromNode === fromNode && c.toNode === toNode);
        if (existing) return existing;

        const connId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.className.baseVal = 'wire-path';
        this.svg.appendChild(pathEl);

        pathEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.removeConnection(connId);
        });

        const connection = {
            id: connId,
            fromNode,
            fromPort,
            toNode,
            toPort,
            pathEl
        };

        this.connections.push(connection);
        this.updateAllWires();

        if (typeof toNode.onConnectionChange === 'function') toNode.onConnectionChange();
        if (typeof fromNode.onConnectionChange === 'function') fromNode.onConnectionChange();

        return connection;
    }

    removeConnection(connId) {
        const idx = this.connections.findIndex(c => c.id === connId);
        if (idx !== -1) {
            const targetNode = this.connections[idx].toNode;
            const sourceNode = this.connections[idx].fromNode;
            this.connections[idx].pathEl.remove();
            this.connections.splice(idx, 1);

            if (targetNode && typeof targetNode.onConnectionChange === 'function') targetNode.onConnectionChange();
            if (sourceNode && typeof sourceNode.onConnectionChange === 'function') sourceNode.onConnectionChange();
        }
    }

    removeNodeConnections(node) {
        const toRemove = this.connections.filter(c => c.fromNode === node || c.toNode === node);
        toRemove.forEach(c => this.removeConnection(c.id));
    }

    getConnectedNodes(sourceNode) {
        return this.connections.filter(c => c.fromNode === sourceNode).map(c => c.toNode);
    }

    getUpstreamNode(targetNode) {
        const conn = this.connections.find(c => c.toNode === targetNode);
        return conn ? conn.fromNode : null;
    }

    setupPortWiring(node) {
        const outPorts = node.querySelectorAll('.port-output');
        const inPorts = node.querySelectorAll('.port-input');

        outPorts.forEach(outPort => {
            outPort.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const p = this.getPortCenter(outPort);
                const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.className.baseVal = 'wire-path wire-temp';
                this.svg.appendChild(pathEl);

                this.activeWireDrag = {
                    fromNode: node,
                    fromPort: outPort,
                    startX: p.x,
                    startY: p.y,
                    pathEl: pathEl
                };
            });

            outPort.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.selectedStartPort === outPort) {
                    outPort.classList.remove('selected');
                    this.selectedStartPort = null;
                } else {
                    if (this.selectedStartPort) this.selectedStartPort.classList.remove('selected');
                    this.selectedStartPort = outPort;
                    outPort.classList.add('selected');
                }
            });
        });

        inPorts.forEach(inPort => {
            inPort.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (this.activeWireDrag && this.activeWireDrag.fromNode !== node) {
                    this.addConnection(this.activeWireDrag.fromNode, this.activeWireDrag.fromPort, node, inPort);
                    this.activeWireDrag.pathEl.remove();
                    this.activeWireDrag = null;
                }
            });

            inPort.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.selectedStartPort && this.selectedStartPort !== inPort) {
                    const fromNode = this.selectedStartPort.closest('.node');
                    if (fromNode !== node) {
                        this.addConnection(fromNode, this.selectedStartPort, node, inPort);
                        this.selectedStartPort.classList.remove('selected');
                        this.selectedStartPort = null;
                    }
                }
            });
        });
    }

    initGlobalEvents() {
        document.addEventListener('mousemove', (e) => {
            if (!this.activeWireDrag) return;
            const worldRect = this.canvas.world.getBoundingClientRect();
            const mouseX = (e.clientX - worldRect.left) / this.canvas.zoom;
            const mouseY = (e.clientY - worldRect.top) / this.canvas.zoom;

            const sx = this.activeWireDrag.startX;
            const sy = this.activeWireDrag.startY;
            this.activeWireDrag.pathEl.setAttribute('d', this.getBezierPath(sx, sy, mouseX, mouseY));
        });

        document.addEventListener('mouseup', (e) => {
            if (this.activeWireDrag && !e.target.classList.contains('port-input')) {
                this.activeWireDrag.pathEl.remove();
                this.activeWireDrag = null;
            }
        });
    }
}
