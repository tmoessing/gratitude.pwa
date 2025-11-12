/**
 * Main application initialization
 */

import { setupEventListeners, switchView, initializeDarkMode } from './ui/handlers.js';
import { renderAll } from './ui/views.js';
import { registerServiceWorker, setupInstallPrompt } from './pwa/serviceWorker.js';

/**
 * Initializes the application
 */
function initializeApp() {
    // Initialize dark mode first (before rendering)
    initializeDarkMode();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial UI
    renderAll();
    
    // Show highlights view on page load (with small delay to ensure DOM is ready)
    setTimeout(() => {
        switchView('highlights');
    }, 100);
    
    // Register service worker for PWA
    registerServiceWorker();
    setupInstallPrompt();
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

