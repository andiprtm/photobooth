// Editor module for handling image editing and composition

// Editor state
const editorState = {
  canvas: null,
  ctx: null,
  sourceImage: null,
  currentFrame: null,
  controls: {
    zoom: 1,
    rotate: 0,
    brightness: 1,
    contrast: 1,
  },
};

// Initialize editor
export function initEditor() {
  // Get canvas element
  const canvas = document.getElementById('editor-canvas');
  if (!canvas) {
    console.error('Editor canvas not found');
    return false;
  }
  
  editorState.canvas = canvas;
  editorState.ctx = canvas.getContext('2d');
  
  // Set initial canvas size untuk landscape
  canvas.width = 1396; // Sesuai ukuran frame
  canvas.height = 1006;
  
  return true;
}

// Apply frame to image
export function applyFrame(sourceCanvas, frameId = '', controls = null) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!editorState.canvas || !editorState.ctx) {
        throw new Error('Editor not initialized');
      }
      
      // Save source image
      editorState.sourceImage = sourceCanvas;
      
      // Update controls if provided
      if (controls) {
        editorState.controls = { ...editorState.controls, ...controls };
      }
      
      // Clear canvas
      editorState.ctx.clearRect(0, 0, editorState.canvas.width, editorState.canvas.height);
      
      // Draw background
      editorState.ctx.fillStyle = '#000';
      editorState.ctx.fillRect(0, 0, editorState.canvas.width, editorState.canvas.height);
      
      // Draw image with transformations
      await drawImageWithTransformations();
      
      // Draw frame if selected
      if (frameId) {
        await drawFrame(frameId);
      }
      
      resolve(true);
    } catch (error) {
      console.error('Error applying frame:', error);
      reject(error);
    }
  });
}

// Draw image with transformations
async function drawImageWithTransformations() {
  if (!editorState.sourceImage) return;
  
  const { ctx, canvas, controls } = editorState;
  const { zoom, rotate, brightness, contrast } = controls;
  
  // Save context state
  ctx.save();
  
  // Move to center of canvas
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Apply rotation (convert degrees to radians)
  ctx.rotate(rotate * Math.PI / 180);
  
  // Apply zoom
  ctx.scale(zoom, zoom);
  
  // Calculate dimensions to maintain aspect ratio
  const sourceWidth = editorState.sourceImage.width;
  const sourceHeight = editorState.sourceImage.height;
  
  // Calculate scaling to fit canvas
  const scale = Math.min(
    canvas.width / sourceWidth,
    canvas.height / sourceHeight
  );
  
  // Calculate dimensions
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  
  // Draw image centered
  ctx.drawImage(
    editorState.sourceImage,
    -width / 2,
    -height / 2,
    width,
    height
  );
  
  // Apply brightness and contrast
  if (brightness !== 1 || contrast !== 1) {
    applyBrightnessContrast(brightness, contrast);
  }
  
  // Restore context state
  ctx.restore();
}

// Apply brightness and contrast adjustments
function applyBrightnessContrast(brightness, contrast) {
  const { ctx, canvas } = editorState;
  
  try {
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply brightness and contrast to each pixel
    for (let i = 0; i < data.length; i += 4) {
      // Skip transparent pixels
      if (data[i + 3] === 0) continue;
      
      // Apply brightness
      data[i] = data[i] * brightness;
      data[i + 1] = data[i + 1] * brightness;
      data[i + 2] = data[i + 2] * brightness;
      
      // Apply contrast
      // Formula: (value - 128) * contrast + 128
      data[i] = (data[i] - 128) * contrast + 128;
      data[i + 1] = (data[i + 1] - 128) * contrast + 128;
      data[i + 2] = (data[i + 2] - 128) * contrast + 128;
      
      // Ensure values are within 0-255 range
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
    
    // Put modified image data back to canvas
    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error('Error applying brightness/contrast:', error);
  }
}

// Draw frame on canvas
async function drawFrame(frameId) {
  try {
    // Get frame from frames module
    const framesModule = await import('./frames.js');
    const frame = framesModule.getFrameById(frameId);
    
    if (!frame) {
      console.warn(`Frame with ID ${frameId} not found`);
      return;
    }
    
    // Load frame image
    const frameImage = await loadImage(frame.url);
    editorState.currentFrame = frameImage;
    
    // Draw frame on top of the image
    const { ctx, canvas } = editorState;
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Error drawing frame:', error);
  }
}

// Load image from URL
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Get edited image as blob
export function getEditedImage(format = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) => {
    try {
      if (!editorState.canvas) {
        throw new Error('Editor not initialized');
      }
      
      editorState.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        format,
        quality
      );
    } catch (error) {
      console.error('Error getting edited image:', error);
      reject(error);
    }
  });
}

// Reset editor
export function resetEditor() {
  if (editorState.ctx && editorState.canvas) {
    editorState.ctx.clearRect(0, 0, editorState.canvas.width, editorState.canvas.height);
  }
  
  editorState.sourceImage = null;
  editorState.currentFrame = null;
  editorState.controls = {
    zoom: 1,
    rotate: 0,
    brightness: 1,
    contrast: 1,
  };
}