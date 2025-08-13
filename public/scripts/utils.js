// Utility functions for the application

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
  // Get toast container
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Remove toast after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Check if online
export function isOnline() {
  return navigator.onLine;
}

// Format date
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Validate phone number (E.164 format)
export function validatePhoneNumber(number) {
  // Remove all non-digit characters
  const digits = number.replace(/\D/g, '');
  
  // Check if starts with +62 or 62 (for Indonesia)
  if (number.startsWith('+62')) {
    return /^\+62\d{9,12}$/.test(number);
  } else if (number.startsWith('62')) {
    return /^62\d{9,12}$/.test(number);
  } else if (number.startsWith('0')) {
    // Convert 08xxx to 62 format
    return /^0\d{9,11}$/.test(number);
  }
  
  return false;
}

// Format phone number to E.164 format
export function formatPhoneNumber(number) {
  // Remove all non-digit characters
  let digits = number.replace(/\D/g, '');
  
  // Convert 08xxx to 62xxx format
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  }
  
  // Add + if not present
  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }
  
  return digits;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}