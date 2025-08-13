// WhatsApp client module for frontend

// Send image to WhatsApp
export async function sendToWhatsApp(imageBlob, recipients, caption = '') {
  try {
    // Create FormData
    const formData = new FormData();
    
    // Add image file
    formData.append('file', imageBlob, 'photobooth.jpg');
    
    // Add recipients (can be single number or array)
    if (Array.isArray(recipients)) {
      recipients.forEach(recipient => {
        formData.append('to', recipient);
      });
    } else {
      formData.append('to', recipients);
    }
    
    // Add caption if provided
    if (caption) {
      formData.append('caption', caption);
    }
    
    // Send request to server
    const response = await fetch('/api/wa/send', {
      method: 'POST',
      body: formData,
    });
    
    // Parse response
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send message');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending to WhatsApp:', error);
    throw error;
  }
}

// Get WhatsApp connection status
export async function getWhatsAppStatus() {
  try {
    const response = await fetch('/api/wa/status');
    const data = await response.json();
    return data.state;
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    return 'error';
  }
}

// Get WhatsApp QR code
export async function getWhatsAppQR() {
  try {
    const response = await fetch('/api/wa/qr');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'QR code not available');
    }
    
    return data.qr;
  } catch (error) {
    console.error('Error getting WhatsApp QR:', error);
    throw error;
  }
}

// Logout from WhatsApp
export async function logoutWhatsApp() {
  try {
    const response = await fetch('/api/wa/logout', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to logout');
    }
    
    return true;
  } catch (error) {
    console.error('Error logging out from WhatsApp:', error);
    throw error;
  }
}

// Reconnect to WhatsApp
export async function reconnectWhatsApp() {
  try {
    const response = await fetch('/api/wa/reconnect', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to reconnect');
    }
    
    return true;
  } catch (error) {
    console.error('Error reconnecting to WhatsApp:', error);
    throw error;
  }
}