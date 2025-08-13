// Camera module for handling camera access and capture

// Camera state
const cameraState = {
  stream: null,
  videoElement: null,
  facingMode: 'user', // 'user' for front camera, 'environment' for back camera
  constraints: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
    audio: false,
  },
};

// Initialize camera
export async function initCamera() {
  try {
    // Get video element
    const videoElement = document.getElementById('video');
    if (!videoElement) throw new Error('Video element not found');
    
    cameraState.videoElement = videoElement;
    
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not supported in this browser');
    }
    
    // iOS Safari requires user gesture to start video
    if (isIOS()) {
      await setupIOSCamera(videoElement);
    } else {
      await startCamera();
    }
    
    // Expose camera module to window for external access
    window.cameraModule = {
      switchCamera,
    };
    
    return true;
  } catch (error) {
    console.error('Camera initialization error:', error);
    handleCameraError(error);
    throw error;
  }
}

// Start camera stream
async function startCamera() {
  try {
    // Stop any existing stream
    if (cameraState.stream) {
      stopCameraStream();
    }
    
    // Set constraints based on current facing mode
    cameraState.constraints.video.facingMode = cameraState.facingMode;
    
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia(cameraState.constraints);
    cameraState.stream = stream;
    
    // Set video source
    if (cameraState.videoElement) {
      cameraState.videoElement.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        cameraState.videoElement.onloadedmetadata = () => {
          resolve();
        };
      });
      
      // Start playing
      await cameraState.videoElement.play();
    }
    
    return true;
  } catch (error) {
    console.error('Error starting camera:', error);
    handleCameraError(error);
    throw error;
  }
}

// Special handling for iOS Safari
async function setupIOSCamera(videoElement) {
  // Create a button for user gesture
  const startButton = document.createElement('button');
  startButton.textContent = 'Mulai Kamera';
  startButton.className = 'btn btn-primary ios-camera-btn';
  startButton.style.position = 'absolute';
  startButton.style.top = '50%';
  startButton.style.left = '50%';
  startButton.style.transform = 'translate(-50%, -50%)';
  startButton.style.zIndex = '10';
  
  // Add button to video container
  const videoContainer = videoElement.parentElement;
  videoContainer.appendChild(startButton);
  
  // Wait for user gesture
  return new Promise((resolve) => {
    startButton.addEventListener('click', async () => {
      try {
        await startCamera();
        videoContainer.removeChild(startButton);
        resolve(true);
      } catch (error) {
        console.error('iOS camera start error:', error);
        handleCameraError(error);
        throw error;
      }
    });
  });
}

// Switch between front and back camera
export async function switchCamera() {
  // Toggle facing mode
  cameraState.facingMode = cameraState.facingMode === 'user' ? 'environment' : 'user';
  
  // Restart camera with new facing mode
  await startCamera();
  return true;
}

// Capture image from video stream
export async function captureImage() {
  return new Promise((resolve, reject) => {
    try {
      if (!cameraState.videoElement || !cameraState.stream) {
        throw new Error('Camera not initialized');
      }
      
      // Create canvas with same dimensions as video
      const canvas = document.createElement('canvas');
      const video = cameraState.videoElement;
      
      // Set canvas size to match video dimensions
      // Use video's videoWidth and videoHeight to get actual resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      
      // Check if we need to handle orientation
      if (isIOS() && cameraState.facingMode === 'environment') {
        // For iOS back camera, we may need to flip the image
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      resolve(canvas);
    } catch (error) {
      console.error('Error capturing image:', error);
      reject(error);
    }
  });
}

// Stop camera stream
export function stopCameraStream() {
  if (cameraState.stream) {
    const tracks = cameraState.stream.getTracks();
    tracks.forEach(track => track.stop());
    cameraState.stream = null;
    
    if (cameraState.videoElement) {
      cameraState.videoElement.srcObject = null;
    }
  }
}

// Handle camera errors
function handleCameraError(error) {
  console.error('Camera error:', error);
  
  let errorMessage = 'Terjadi kesalahan saat mengakses kamera';
  
  // Check for permission denied
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    errorMessage = 'Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser Anda.';
    
    // Show permission instructions
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
      const permissionMsg = document.createElement('div');
      permissionMsg.className = 'camera-permission-error';
      permissionMsg.innerHTML = `
        <h3>Izin Kamera Dibutuhkan</h3>
        <p>Aplikasi ini membutuhkan akses ke kamera Anda untuk berfungsi.</p>
        <p>Silakan aktifkan izin kamera di pengaturan browser Anda:</p>
        <ol>
          <li>Klik ikon kunci/info di address bar</li>
          <li>Pilih "Izin" atau "Setelan Situs"</li>
          <li>Aktifkan izin kamera</li>
          <li>Muat ulang halaman</li>
        </ol>
        <button id="retry-camera" class="btn btn-primary">Coba Lagi</button>
      `;
      
      videoContainer.appendChild(permissionMsg);
      
      // Add retry button handler
      document.getElementById('retry-camera').addEventListener('click', async () => {
        videoContainer.removeChild(permissionMsg);
        try {
          await initCamera();
        } catch (err) {
          handleCameraError(err);
        }
      });
    }
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    errorMessage = 'Tidak dapat menemukan kamera. Pastikan perangkat Anda memiliki kamera yang berfungsi.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    errorMessage = 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang mungkin menggunakan kamera.';
  } else if (error.name === 'OverconstrainedError') {
    errorMessage = 'Resolusi kamera yang diminta tidak didukung oleh perangkat Anda.';
    // Try with lower resolution
    cameraState.constraints.video = { facingMode: cameraState.facingMode };
    setTimeout(() => {
      startCamera().catch(handleCameraError);
    }, 1000);
  }
  
  // Show error toast
  if (window.showToast) {
    window.showToast(errorMessage, 'error');
  } else {
    alert(errorMessage);
  }
}

// Check if running on iOS
function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) ||
  // iPad on iOS 13 detection
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}