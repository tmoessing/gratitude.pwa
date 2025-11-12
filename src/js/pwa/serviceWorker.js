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
 * Allows the browser's native install banner to appear
 */
export function setupInstallPrompt() {
    // Let the browser handle the install prompt natively
    // No need to prevent default or store the prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt available');
    });
}


