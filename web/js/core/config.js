/**
 * =========================================================================
 * Central Application Configuration
 * Single source of truth for Application Name, Title, Version, and Storage
 * =========================================================================
 */

export const APP_CONFIG = {
    appName: "AgentStudio",
    appTitle: "AgentStudio - Open-Source Visual AI Pipeline",
    version: "1.0.0",
    storagePrefix: "agentstudio",
    
    // Dynamically fetch config from backend if available
    async syncWithBackend() {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const remote = await res.json();
                Object.assign(this, remote);
            }
        } catch (e) {
            // Backend offline or fallback to defaults
        }
    }
};
