/**
 * Utility functions for showing toast notifications
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {string} title - Optional title for the toast
 */
export const showToast = (message, type = 'info', title = null) => {
  // Dispatch a custom event that will be caught by the ToastNotification component
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: {
        message,
        type,
        title
      }
    })
  );
};
