// Admin panel script
import { getWhatsAppStatus, getWhatsAppQR, logoutWhatsApp, reconnectWhatsApp } from './waClient.js';
import { showToast } from './utils.js';

// DOM Elements
const statusBadge = document.getElementById('wa-status');
const qrContainer = document.getElementById('qr-container');
const qrcodeElement = document.getElementById('qrcode');
const connectedInfo = document.getElementById('connected-info');
const refreshBtn = document.getElementById('refresh-btn');
const reconnectBtn = document.getElementById('reconnect-btn');
const logoutBtn = document.getElementById('logout-btn');

// Admin state
const adminState = {
  status: 'initializing',
  qrCode: null,
  pollingInterval: null,
};

// Initialize admin panel
async function initAdmin() {
  try {
    // Check initial status
    await updateStatus();
    
    // Start polling for status updates
    startStatusPolling();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Admin initialization error:', error);
    showToast('Gagal menginisialisasi panel admin', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  refreshBtn.addEventListener('click', updateStatus);
  reconnectBtn.addEventListener('click', handleReconnect);
  logoutBtn.addEventListener('click', handleLogout);
}

// Start polling for status updates
function startStatusPolling() {
  // Clear any existing interval
  if (adminState.pollingInterval) {
    clearInterval(adminState.pollingInterval);
  }
  
  // Poll every 5 seconds
  adminState.pollingInterval = setInterval(async () => {
    await updateStatus();
  }, 5000);
}

// Update WhatsApp status
async function updateStatus() {
  try {
    // Get current status
    const status = await getWhatsAppStatus();
    adminState.status = status;
    
    // Update UI based on status
    updateStatusUI(status);
    
    // If status is 'qr', get QR code
    if (status === 'qr') {
      await updateQRCode();
    }
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Gagal memperbarui status', 'error');
  }
}

// Update QR code
async function updateQRCode() {
  try {
    const qrCode = await getWhatsAppQR();
    adminState.qrCode = qrCode;
    
    // Generate QR code
    generateQRCode(qrCode);
  } catch (error) {
    console.error('Error updating QR code:', error);
    // Don't show toast here as this might fail when already authenticated
  }
}

// Generate QR code
function generateQRCode(qrData) {
  if (!qrcodeElement) return;
  
  // Clear previous QR code
  qrcodeElement.innerHTML = '';
  
  try {
    // Use qrcode-generator library
    const qr = qrcode(0, 'L');
    qr.addData(qrData);
    qr.make();
    
    // Create QR code image
    const qrImage = qr.createImgTag(5);
    qrcodeElement.innerHTML = qrImage;
  } catch (error) {
    console.error('Error generating QR code:', error);
    qrcodeElement.innerHTML = '<p>Failed to generate QR code</p>';
  }
}

// Update status UI
function updateStatusUI(status) {
  if (!statusBadge) return;
  
  // Update status badge
  statusBadge.className = 'status-badge ' + status;
  
  // Set status text
  switch (status) {
    case 'initializing':
      statusBadge.textContent = 'Menginisialisasi';
      break;
    case 'qr':
      statusBadge.textContent = 'Scan QR Code';
      break;
    case 'connected':
      statusBadge.textContent = 'Terhubung';
      break;
    case 'disconnected':
      statusBadge.textContent = 'Terputus';
      break;
    default:
      statusBadge.textContent = status;
  }
  
  // Show/hide QR container and connected info
  if (status === 'qr') {
    qrContainer.style.display = 'flex';
    connectedInfo.style.display = 'none';
  } else if (status === 'connected') {
    qrContainer.style.display = 'none';
    connectedInfo.style.display = 'block';
  } else {
    qrContainer.style.display = 'none';
    connectedInfo.style.display = 'none';
  }
}

// Handle reconnect button click
async function handleReconnect() {
  try {
    reconnectBtn.disabled = true;
    reconnectBtn.textContent = 'Menghubungkan...';
    
    await reconnectWhatsApp();
    showToast('Mencoba menghubungkan kembali ke WhatsApp', 'info');
    
    // Update status immediately
    await updateStatus();
  } catch (error) {
    console.error('Error reconnecting:', error);
    showToast('Gagal menghubungkan kembali: ' + error.message, 'error');
  } finally {
    reconnectBtn.disabled = false;
    reconnectBtn.textContent = 'Reconnect';
  }
}

// Handle logout button click
async function handleLogout() {
  try {
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Logging out...';
    
    await logoutWhatsApp();
    showToast('Berhasil logout dari WhatsApp', 'success');
    
    // Update status immediately
    await updateStatus();
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Gagal logout: ' + error.message, 'error');
  } finally {
    logoutBtn.disabled = false;
    logoutBtn.textContent = 'Logout';
  }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdmin);