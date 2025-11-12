/**
 * Service Worker registration and PWA setup
 */

const SERVICE_WORKER_PATH = '/sw.js';

/**
 * Registers the service worker for offline functionality
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(SERVICE_WORKER_PATH)
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
}

/**
 * Handles PWA install prompt
 * Stores the deferred prompt for potential custom install button
 */
let deferredPrompt = null;

export function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // You could show a custom install button here if desired
        console.log('PWA install prompt available');
    });
}

/**
 * Gets the deferred install prompt
 * @returns {Event|null} The deferred prompt event or null
 */
export function getDeferredPrompt() {
    return deferredPrompt;
}

