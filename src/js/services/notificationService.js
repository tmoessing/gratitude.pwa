/**
 * Notification service for user feedback
 */

const NOTIFICATION_DURATION = 2000;

/**
 * Shows a notification to the user
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('success' or 'error')
 */
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.warn('Notification element not found');
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, NOTIFICATION_DURATION);
}

