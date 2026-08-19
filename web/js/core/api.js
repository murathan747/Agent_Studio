/**
 * =========================================================================
 * NodeAgent Studio - Central API Client
 * Clean interface for backend server calls and model management.
 * =========================================================================
 */

const API_BASE = window.location.origin.includes('http') 
    ? window.location.origin 
    : 'http://127.0.0.1:8000';

export const ApiClient = {
    baseUrl: API_BASE,

    async getModelStatuses() {
        const res = await fetch(`${this.baseUrl}/api/models/status`);
        if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
        return await res.json();
    },

    async downloadModel(modelKey) {
        const res = await fetch(`${this.baseUrl}/api/models/download/${modelKey}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error(`Model download trigger failed: ${res.statusText}`);
        return await res.json();
    },

    async removeBackground(formData) {
        const res = await fetch(`${this.baseUrl}/remove-bg`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Background removal failed');
        }
        return await res.json();
    },

    async splitAssets(formData) {
        const res = await fetch(`${this.baseUrl}/split-assets`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Asset splitting failed');
        }
        return await res.json();
    },

    async resizeImage(payload) {
        const res = await fetch(`${this.baseUrl}/resize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Resize failed');
        }
        return await res.json();
    },

    async saveAsset(payload) {
        const res = await fetch(`${this.baseUrl}/save-asset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Save asset failed');
        }
        return await res.json();
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};

window.ApiClient = ApiClient;
