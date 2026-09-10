import React, { useEffect, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [nailColor, setNailColor] = useState('#ff0055');
  const [extractedImageName, setExtractedImageName] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const nailImageRef = useRef(null);

  useEffect(() => {
    let cameraInstance = null;
    let handsInstance = null;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext('2d');

    if (window.Hands && window.Camera) {
      handsInstance = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsInstance.onResults((results) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            // Pair each fingertip with its adjacent joint to calculate angle and nail bed position
            const fingerPairs = [
              [4, 3],   // Thumb
              [8, 7],   // Index
              [12, 11], // Middle
              [16, 15], // Ring
              [20, 19]  // Pinky
            ];

            fingerPairs.forEach(([tipId, jointId]) => {
              const tip = landmarks[tipId];
              const joint = landmarks[jointId];

              const tipX = tip.x * canvasElement.width;
              const tipY = tip.y * canvasElement.height;
              const jointX = joint.x * canvasElement.width;
              const jointY = joint.y * canvasElement.height;

              // Calculate finger orientation angle
              const dx = tipX - jointX;
              const dy = tipY - jointY;
              const angle = Math.atan2(dy, dx);

              // Shift slightly closer to the fingertip (upward)
              const nailX = tipX - dx * 0.15;
              const nailY = tipY - dy * 0.15;

              const radiusX = 10; // Realistic nail width
              const radiusY = 14; // Realistic nail length

              canvasCtx.save();
              canvasCtx.translate(nailX, nailY);
              canvasCtx.rotate(angle - Math.PI / 2); // Align rotation with the finger angle

              canvasCtx.beginPath();
              canvasCtx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
              canvasCtx.closePath();
              canvasCtx.clip();

              if (nailImageRef.current) {
                // Map the Pinterest design inside the realistic nail ellipse
                canvasCtx.drawImage(
                  nailImageRef.current,
                  -radiusX,
                  -radiusY,
                  radiusX * 2,
                  radiusY * 2
                );
              } else {
                canvasCtx.fillStyle = nailColor;
                canvasCtx.globalAlpha = 0.8;
                canvasCtx.fill();
              }

              canvasCtx.restore();
            });
          }
        }
        canvasCtx.restore();
      });

      cameraInstance = new window.Camera(videoElement, {
        onFrame: async () => {
          if (videoElement) {
            await handsInstance.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      cameraInstance
        .start()
        .then(() => setIsModelReady(true))
        .catch((err) => console.error('Camera initialization error:', err));
    }

    return () => {
      if (cameraInstance) {
        const stream = videoElement.srcObject;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, [nailColor]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtractedImageName(file.name);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      nailImageRef.current = img;
    };
  };

  const handleResetDesign = () => {
    nailImageRef.current = null;
    setExtractedImageName('');
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Nail Style Try-On Studio</h1>
        <p>Upload any Pinterest design to project its exact pattern onto your nails live.</p>
      </header>

      <div className="camera-viewport">
        <video ref={videoRef} className="input_video" playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} className="output_canvas" />
        {!isModelReady && <div className="loading-overlay">Initializing Camera & AI Hand Tracker...</div>}
      </div>

      <div className="control-panel">
        <div className="control-group">
          <label htmlFor="colorPicker">Fallback Color:</label>
          <div className="color-picker-wrapper">
            <input
              id="colorPicker"
              type="color"
              value={nailColor}
              onChange={(e) => {
                setNailColor(e.target.value);
                nailImageRef.current = null;
                setExtractedImageName('');
              }}
            />
            <span className="hex-label">{nailColor}</span>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="pinterestUpload" className="upload-btn">
            Upload Pinterest Design
          </label>
          <input
            id="pinterestUpload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {extractedImageName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="file-name">{extractedImageName}</span>
              <button 
                onClick={handleResetDesign} 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                Clear
              </button>
            </div>
          ) : (
            <span className="file-name">No design loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}