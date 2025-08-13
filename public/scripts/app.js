// Main application entry point
import { initCamera, captureImage } from './camera.js';
import { initEditor, applyFrame, getEditedImage } from './editor.js';
import { loadFrames, getFramesList } from './frames.js';
import { sendToWhatsApp } from './waClient.js';
import { showToast, isOnline } from './utils.js';

// DOM Elements
const cameraSection = document.getElementById('camera-section');
const editorSection = document.getElementById('editor-section');
const whatsappSection = document.getElementById('whatsapp-section');
const captureBtn = document.getElementById('capture-btn');
const switchCameraBtn = document.getElementById('switch-camera');
const backBtn = document.getElementById('back-btn');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const frameSelect = document.getElementById('frame-select');
const zoomControl = document.getElementById('zoom-control');
const rotateControl = document.getElementById('rotate-control');
const brightnessControl = document.getElementById('brightness-control');
const contrastControl = document.getElementById('contrast-control');
const whatsappPreview = document.getElementById('whatsapp-preview');
const whatsappForm = document.getElementById('whatsapp-form');
const phoneNumberInput = document.getElementById('phone-number');
const addNumberBtn = document.getElementById('add-number');
const recipientsList = document.getElementById('recipients-list');
const captionInput = document.getElementById('caption');
const backToEditorBtn = document.getElementById('back-to-editor');
const sendWaBtn = document.getElementById('send-wa-btn');

// App State
const appState = {
  currentSection: 'camera',
  recipients: [],
  capturedImage: null,
  editedImage: null,
  sentHistory: JSON.parse(localStorage.getItem('sentHistory') || '[]'),
};

// Initialize app
async function initApp() {
  // Check if online
  if (!isOnline()) {
    document.body.classList.add('offline');
    showToast('Anda sedang offline. Beberapa fitur mungkin tidak tersedia.', 'warning');
  }

  // Initialize camera
  try {
    await initCamera();
  } catch (error) {
    showToast('Gagal mengakses kamera: ' + error.message, 'error');
    console.error('Camera initialization error:', error);
  }

  // Load frames
  try {
    await loadFrames();
    populateFrameSelect();
  } catch (error) {
    showToast('Gagal memuat frame', 'error');
    console.error('Frame loading error:', error);
  }

  // Initialize editor
  initEditor();

  // Setup event listeners
  setupEventListeners();
}

// Populate frame select dropdown
function populateFrameSelect() {
  const frames = getFramesList();
  frames.forEach((frame, index) => {
    const option = document.createElement('option');
    option.value = frame.id;
    option.textContent = frame.name;
    option.selected = index === 0; // Select the first frame by default
    frameSelect.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Camera controls
  captureBtn.addEventListener('click', handleCapture);
  switchCameraBtn.addEventListener('click', handleSwitchCamera);

  // Editor controls
  backBtn.addEventListener('click', () => switchSection('camera'));
  downloadBtn.addEventListener('click', handleDownload);
  shareBtn.addEventListener('click', handleShare);
  frameSelect.addEventListener('change', handleFrameChange);
  zoomControl.addEventListener('input', handleEditorControlChange);
  rotateControl.addEventListener('input', handleEditorControlChange);
  brightnessControl.addEventListener('input', handleEditorControlChange);
  contrastControl.addEventListener('input', handleEditorControlChange);

  // WhatsApp form
  addNumberBtn.addEventListener('click', handleAddRecipient);
  backToEditorBtn.addEventListener('click', () => switchSection('editor'));
  whatsappForm.addEventListener('submit', handleSendWhatsApp);
  phoneNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  });

  // Check online status
  window.addEventListener('online', handleOnlineStatusChange);
  window.addEventListener('offline', handleOnlineStatusChange);
}

// Handle capture button click
async function handleCapture() {
  try {
    // Start countdown
    const countdownElement = document.getElementById('countdown');
    countdownElement.classList.add('active');
    
    for (let i = 3; i > 0; i--) {
      countdownElement.textContent = i;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    countdownElement.textContent = '';
    countdownElement.classList.remove('active');
    
    // Capture image
    const imageData = await captureImage();
    appState.capturedImage = imageData;
    
    // Switch to editor and load image with selected frame
    applyFrame(imageData, frameSelect.value);
    switchSection('editor');
  } catch (error) {
    showToast('Gagal mengambil gambar: ' + error.message, 'error');
    console.error('Capture error:', error);
  }
}

// Handle switch camera button click
function handleSwitchCamera() {
  try {
    const cameraModule = window.cameraModule;
    if (cameraModule) {
      cameraModule.switchCamera();
    }
  } catch (error) {
    showToast('Gagal mengganti kamera: ' + error.message, 'error');
    console.error('Switch camera error:', error);
  }
}

// Handle frame change
function handleFrameChange() {
  applyFrame(appState.capturedImage, frameSelect.value);
}

// Handle editor control change
function handleEditorControlChange() {
  const editorControls = {
    zoom: parseFloat(zoomControl.value),
    rotate: parseFloat(rotateControl.value),
    brightness: parseFloat(brightnessControl.value),
    contrast: parseFloat(contrastControl.value),
  };
  
  applyFrame(appState.capturedImage, frameSelect.value, editorControls);
}

// Handle download button click
async function handleDownload() {
  try {
    const imageBlob = await getEditedImage();
    const url = URL.createObjectURL(imageBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `photobooth_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Gambar berhasil diunduh', 'success');
  } catch (error) {
    showToast('Gagal mengunduh gambar: ' + error.message, 'error');
    console.error('Download error:', error);
  }
}

// Handle share button click
async function handleShare() {
  try {
    const imageBlob = await getEditedImage();
    appState.editedImage = imageBlob;
    
    // Set preview image
    const url = URL.createObjectURL(imageBlob);
    whatsappPreview.src = url;
    
    // Clear previous recipients
    appState.recipients = [];
    updateRecipientsList();
    
    // Switch to WhatsApp section
    switchSection('whatsapp');
  } catch (error) {
    showToast('Gagal mempersiapkan gambar: ' + error.message, 'error');
    console.error('Share preparation error:', error);
  }
}

// Handle add recipient button click
function handleAddRecipient() {
  const phoneNumber = phoneNumberInput.value.trim();
  if (!phoneNumber) return;
  
  // Simple validation
  if (!isValidPhoneNumber(phoneNumber)) {
    showToast('Format nomor tidak valid', 'error');
    return;
  }
  
  // Format nomor ke format internasional
  const formattedNumber = formatToInternational(phoneNumber);
  
  // Add to recipients list if not already added
  if (!appState.recipients.includes(formattedNumber)) {
    appState.recipients.push(formattedNumber);
    updateRecipientsList();
    phoneNumberInput.value = '';
  } else {
    showToast('Nomor sudah ditambahkan', 'info');
  }
}

// Update recipients list UI
function updateRecipientsList() {
  recipientsList.innerHTML = '';
  
  appState.recipients.forEach(number => {
    const tag = document.createElement('div');
    tag.className = 'recipient-tag';
    tag.innerHTML = `
      <span>${number}</span>
      <button type="button" aria-label="Hapus nomor">&times;</button>
    `;
    
    tag.querySelector('button').addEventListener('click', () => {
      appState.recipients = appState.recipients.filter(n => n !== number);
      updateRecipientsList();
    });
    
    recipientsList.appendChild(tag);
  });
}

// Handle send WhatsApp button click
async function handleSendWhatsApp(e) {
  e.preventDefault();
  
  if (!isOnline()) {
    showToast('Anda sedang offline. Tidak dapat mengirim pesan.', 'error');
    return;
  }
  
  if (appState.recipients.length === 0) {
    // If no recipients added, use the input field value
    const phoneNumber = phoneNumberInput.value.trim();
    if (!phoneNumber) {
      showToast('Masukkan nomor WhatsApp tujuan', 'error');
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      showToast('Format nomor tidak valid', 'error');
      return;
    }
    
    // Format nomor ke format internasional
    const formattedNumber = formatToInternational(phoneNumber);
    appState.recipients.push(formattedNumber);
  }
  
  // Disable send button to prevent double-click
  sendWaBtn.disabled = true;
  sendWaBtn.textContent = 'Mengirim...';
  
  try {
    const caption = captionInput.value.trim();
    const result = await sendToWhatsApp(appState.editedImage, appState.recipients, caption);
    
    // Save to history
    const historyItem = {
      date: new Date().toISOString(),
      recipients: [...appState.recipients],
      success: true,
    };
    appState.sentHistory.push(historyItem);
    localStorage.setItem('sentHistory', JSON.stringify(appState.sentHistory));
    
    showToast('Pesan berhasil dikirim', 'success');
    
    // Go back to camera after successful send
    setTimeout(() => {
      switchSection('camera');
    }, 1500);
  } catch (error) {
    showToast('Gagal mengirim pesan: ' + error.message, 'error');
    console.error('Send error:', error);
    
    // Save failed attempt to history
    const historyItem = {
      date: new Date().toISOString(),
      recipients: [...appState.recipients],
      success: false,
      error: error.message,
    };
    appState.sentHistory.push(historyItem);
    localStorage.setItem('sentHistory', JSON.stringify(appState.sentHistory));
  } finally {
    // Re-enable send button
    sendWaBtn.disabled = false;
    sendWaBtn.textContent = 'Kirim';
  }
}

// Handle online status change
function handleOnlineStatusChange() {
  if (isOnline()) {
    document.body.classList.remove('offline');
    showToast('Anda kembali online', 'success');
  } else {
    document.body.classList.add('offline');
    showToast('Anda sedang offline. Beberapa fitur mungkin tidak tersedia.', 'warning');
  }
}

// Switch between sections
function switchSection(sectionName) {
  // Hide all sections
  cameraSection.classList.remove('active');
  editorSection.classList.remove('active');
  whatsappSection.classList.remove('active');
  
  // Show selected section
  switch (sectionName) {
    case 'camera':
      cameraSection.classList.add('active');
      break;
    case 'editor':
      editorSection.classList.add('active');
      break;
    case 'whatsapp':
      whatsappSection.classList.add('active');
      break;
  }
  
  appState.currentSection = sectionName;
}

// Validate phone number
function isValidPhoneNumber(number) {
  // Accept formats: +628xxx, 628xxx, 08xxx, 8xxx
  const cleanNumber = number.replace(/\s+/g, '');
  
  // Hapus semua karakter non-digit untuk pengecekan panjang
  const digits = cleanNumber.replace(/\D/g, '');
  
  // Validasi sederhana: pastikan nomor memiliki panjang yang valid
  return digits.length >= 9 && digits.length <= 14;
}

// Format nomor telepon ke format internasional (tanpa tanda +)
function formatToInternational(number) {
  const cleanNumber = number.replace(/\s+/g, '');
  
  if (cleanNumber.startsWith('+62')) {
    return cleanNumber.substring(1); // Hapus tanda + di awal
  } else if (cleanNumber.startsWith('62')) {
    return cleanNumber; // Sudah format yang benar
  } else if (cleanNumber.startsWith('0')) {
    return '62' + cleanNumber.substring(1); // Ganti 0 dengan 62
  } else {
    return '62' + cleanNumber; // Tambahkan 62 di depan
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);