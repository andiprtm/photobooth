// Frames module for managing photo frames

// Frames state
const framesState = {
  frames: [],
  loaded: false,
};

// Load frames from server
export async function loadFrames() {
  try {
    // If frames already loaded, return them
    if (framesState.loaded && framesState.frames.length > 0) {
      return framesState.frames;
    }
    
    // Fetch frames from server or use predefined list
    // For simplicity, we'll use a predefined list for now
    // In a real app, you might want to fetch this from the server
    
    // Check if we're online
    if (navigator.onLine) {
      try {
        // Try to fetch frames from server
        const response = await fetch('/frames/index.json');
        if (response.ok) {
          const data = await response.json();
          framesState.frames = data.frames;
          framesState.loaded = true;
          return framesState.frames;
        }
      } catch (error) {
        console.warn('Failed to fetch frames from server, using default frames', error);
      }
    }
    
    // Use default frames if fetch fails or offline
    framesState.frames = [
      {
        id: 'frame1',
        name: 'Frame 1',
        url: '/frames/frame1.png',
        thumbnail: '/frames/frame1.png',
        type: 'png'
      },
      {
        id: 'frame2',
        name: 'Frame 2',
        url: '/frames/frame2.png',
        thumbnail: '/frames/frame2.png',
        type: 'png'
      }
    ];
    
    framesState.loaded = true;
    return framesState.frames;
  } catch (error) {
    console.error('Error loading frames:', error);
    throw error;
  }
}

// Get all frames
export function getFramesList() {
  return framesState.frames;
}

// Get frame by ID
export function getFrameById(frameId) {
  return framesState.frames.find(frame => frame.id === frameId);
}

// Create default frames if they don't exist
export async function createDefaultFrames() {
  // This function would create default frame files if they don't exist
  // For a real app, you might want to implement this on the server side
  console.log('Creating default frames is not implemented in this demo');
}