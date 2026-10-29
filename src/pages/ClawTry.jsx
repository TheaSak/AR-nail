import { useEffect, useRef, useState } from 'react';
import '../App.css';
import { INITIAL_CLOSET } from '../data/initialCloset';
import { WEATHER_DATA } from '../data/weatherData';
import {
  generateOutfitWithGemini,
  inferWeatherSuitability,
  normalizeCategory,
  resolveItemWeather
} from '../services/geminiStylist';

/**
 * Helper function to draw the custom nail shape path on the canvas.
 * Local coordinate system:
 * (0, 0) is centered at the nail bed.
 * +Y points along the finger toward the tip / free edge.
 * -Y points toward the cuticle / proximal finger joint.
 * -X and +X are lateral left and right margins of the nail.
 */
function drawNailShape(ctx, shape, radiusX, radiusY) {
  ctx.beginPath();
  const w = radiusX;
  const baseY = -radiusY;

  switch (shape) {
    case 'square': {
      const tipY = radiusY;
      const cornerR = 2.5;
      ctx.moveTo(-w, baseY * 0.3);
      ctx.lineTo(-w, tipY - cornerR);
      ctx.quadraticCurveTo(-w, tipY, -w + cornerR, tipY);
      ctx.lineTo(w - cornerR, tipY);
      ctx.quadraticCurveTo(w, tipY, w, tipY - cornerR);
      ctx.lineTo(w, baseY * 0.3);
      ctx.bezierCurveTo(w, baseY * 1.05, -w, baseY * 1.05, -w, baseY * 0.3);
      break;
    }
    case 'almond': {
      const tipY = radiusY * 1.25;
      const softTipRadius = 2.0;
      ctx.moveTo(-w, baseY * 0.2);
      ctx.bezierCurveTo(-w, tipY * 0.3, -w * 0.55, tipY * 0.75, -softTipRadius, tipY - 0.6);
      ctx.quadraticCurveTo(0, tipY, softTipRadius, tipY - 0.6);
      ctx.bezierCurveTo(w * 0.55, tipY * 0.75, w, tipY * 0.3, w, baseY * 0.2);
      ctx.bezierCurveTo(w, baseY * 1.05, -w, baseY * 1.05, -w, baseY * 0.2);
      break;
    }
    case 'stiletto': {
      const tipY = radiusY * 1.5;
      ctx.moveTo(-w, baseY * 0.2);
      ctx.bezierCurveTo(-w * 0.9, tipY * 0.25, -w * 0.35, tipY * 0.7, 0, tipY);
      ctx.bezierCurveTo(w * 0.35, tipY * 0.7, w * 0.9, tipY * 0.25, w, baseY * 0.2);
      ctx.bezierCurveTo(w, baseY * 1.05, -w, baseY * 1.05, -w, baseY * 0.2);
      break;
    }
    case 'oval':
    default: {
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
      break;
    }
  }

  ctx.closePath();
}

export default function ClawTry({ initialTab = 'nailar' }) {
  // Navigation active tab: 'nailar' | 'clawsfit'
  const [activeTab, setActiveTab] = useState(initialTab);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  /* ══════════════════════════════════════════════════════════════
     NAILAR STUDIO STATE & REFS
     ══════════════════════════════════════════════════════════════ */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [nailColor, setNailColor] = useState('#ff0055');
  const [nailShape, setNailShape] = useState('oval');
  const [extractedImageName, setExtractedImageName] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const nailImageRef = useRef(null);

  // Live state refs for 60fps canvas loop without restarting webcam
  const nailColorRef = useRef(nailColor);
  const nailShapeRef = useRef(nailShape);

  useEffect(() => {
    nailColorRef.current = nailColor;
  }, [nailColor]);

  useEffect(() => {
    nailShapeRef.current = nailShape;
  }, [nailShape]);

  // Initialize MediaPipe Hands & Camera once
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
        // Sync canvas resolution with live video dimensions
        if (videoElement.videoWidth && videoElement.videoHeight) {
          if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
          }
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
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

              // Finger orientation angle
              const dx = tipX - jointX;
              const dy = tipY - jointY;
              const angle = Math.atan2(dy, dx);

              // Shift toward fingertip
              const nailX = tipX - dx * 0.15;
              const nailY = tipY - dy * 0.15;

              const radiusX = 10;
              const radiusY = 14;

              canvasCtx.save();
              canvasCtx.translate(nailX, nailY);
              canvasCtx.rotate(angle - Math.PI / 2);

              // Draw custom shape path and clip
              drawNailShape(canvasCtx, nailShapeRef.current, radiusX, radiusY);
              canvasCtx.clip();

              if (nailImageRef.current) {
                const currentShape = nailShapeRef.current;
                const tipMultiplier = currentShape === 'stiletto' ? 1.5 : (currentShape === 'almond' ? 1.25 : 1.0);
                const totalHeight = radiusY * (1 + tipMultiplier);

                canvasCtx.drawImage(
                  nailImageRef.current,
                  -radiusX,
                  -radiusY,
                  radiusX * 2,
                  totalHeight
                );
              } else {
                canvasCtx.fillStyle = nailColorRef.current;
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
          // Only send frames to MediaPipe if NailAR tab is active to save CPU/battery
          if (videoElement && activeTabRef.current === 'nailar') {
            await handsInstance.send({ image: videoElement });
          }
        },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      });

      cameraInstance
        .start()
        .then(() => setIsModelReady(true))
        .catch((err) => console.error('Camera initialization error:', err));
    }

    return () => {
      if (cameraInstance) {
        const stream = videoElement?.srcObject;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, []);

  const handleNailImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtractedImageName(file.name);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      nailImageRef.current = img;
    };
  };

  const handleResetNailDesign = () => {
    nailImageRef.current = null;
    setExtractedImageName('');
  };

  /* ══════════════════════════════════════════════════════════════
     CLAWSFIT WARDROBE & STYLIST STATE (DYNAMIC & PERSISTENT)
     ══════════════════════════════════════════════════════════════ */
  
  // 1. Persistent Closet Items (Guaranteed Fresh with Ref & LocalStorage)
  const [closetItems, setClosetItems] = useState(() => {
    try {
      const saved = localStorage.getItem('preptogo_closet_items') || localStorage.getItem('clawson_closet_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse closet items from localStorage:', err);
    }
    return INITIAL_CLOSET;
  });

  // Keep Ref synchronized to eliminate any stale closures in event handlers
  const closetItemsRef = useRef(closetItems);
  useEffect(() => {
    closetItemsRef.current = closetItems;
  }, [closetItems]);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('preptogo_closet_items', JSON.stringify(closetItems));
    } catch (err) {
      console.warn('Failed to save closet items to localStorage:', err);
    }
  }, [closetItems]);

  // 2. Persistent Generated Outfit State
  const [generatedOutfit, setGeneratedOutfit] = useState(() => {
    try {
      const saved = localStorage.getItem('preptogo_generated_outfit') || localStorage.getItem('clawson_generated_outfit');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to parse generated outfit from localStorage:', err);
    }
    return null;
  });

  // Keep generated outfit synced to localStorage
  useEffect(() => {
    try {
      if (generatedOutfit) {
        localStorage.setItem('preptogo_generated_outfit', JSON.stringify(generatedOutfit));
      } else {
        localStorage.removeItem('preptogo_generated_outfit');
      }
    } catch (err) {
      console.warn('Failed to sync generated outfit with localStorage:', err);
    }
  }, [generatedOutfit]);

  // Weather & Filtering State (5 weather conditions)
  const [closetCategoryFilter, setClosetCategoryFilter] = useState('All');
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stylistNotice, setStylistNotice] = useState('');

  // Add Item Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Tops');
  const [newItemColor, setNewItemColor] = useState('#c9919c');
  const [newItemColorName, setNewItemColorName] = useState('Dusty Rose');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemWarmth, setNewItemWarmth] = useState('medium');
  const [newItemBreathable, setNewItemBreathable] = useState(true);
  const [newItemWeathers, setNewItemWeathers] = useState([]);

  const toggleNewItemWeather = (w) => {
    setNewItemWeathers((prev) =>
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w]
    );
  };

  // Fallback SVG image helper when network image fails
  const handleImgFallback = (e, item) => {
    e.target.onerror = null;
    const cat = normalizeCategory(item.category, item.name, item.description);
    const catIcon = cat === 'Tops' ? '👚' : cat === 'Bottoms' ? '👖' : '👠';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#fbf5f2"/>
        <circle cx="150" cy="130" r="75" fill="${item.color || '#e8bfb8'}" opacity="0.35"/>
        <text x="150" y="145" text-anchor="middle" font-size="44">${catIcon}</text>
        <text x="150" y="210" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#6e3646">${item.name}</text>
      </svg>
    `.trim();
    e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Add clothing item: updates state, ref, and localStorage immediately
  const handleAddClosetItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const normalizedCat = normalizeCategory(newItemCategory, newItemName, newItemDescription);

    const fallbackImg = normalizedCat === 'Tops'
      ? 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&auto=format&fit=crop&q=80'
      : normalizedCat === 'Bottoms'
      ? 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=80';

    const resolvedSuitability =
      newItemWeathers.length > 0
        ? newItemWeathers
        : inferWeatherSuitability({
            name: newItemName.trim(),
            category: newItemCategory,
            description: newItemDescription.trim(),
            warmth: newItemWarmth,
            breathable: newItemBreathable
          });

    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory, // Preserves user's tag while normalizer resolves flexible semantics
      color: newItemColor,
      colorName: newItemColorName.trim() || 'Custom Hue',
      image: newItemImage.trim() || fallbackImg,
      breathable: newItemBreathable,
      warmth: newItemWarmth,
      description: newItemDescription.trim() || `${newItemColorName} ${newItemCategory.toLowerCase()} piece added to personal wardrobe.`,
      weatherSuitability: resolvedSuitability
    };

    // Immediate synchronous update to ref and state
    const updated = [newItem, ...closetItemsRef.current];
    closetItemsRef.current = updated;
    setClosetItems(updated);

    try {
      localStorage.setItem('preptogo_closet_items', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save closet items to localStorage:', err);
    }

    setNewItemName('');
    setNewItemImage('');
    setNewItemDescription('');
    setNewItemWeathers([]);
    setShowAddForm(false);
  };

  // Local file upload converted to DataURL so images persist across refresh in localStorage
  const handleClosetPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewItemImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete clothing item with persistent storage update
  const handleDeleteClosetItem = (id) => {
    const updated = closetItemsRef.current.filter((item) => item.id !== id);
    closetItemsRef.current = updated;
    setClosetItems(updated);

    try {
      localStorage.setItem('preptogo_closet_items', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save closet items after deletion:', err);
    }

    if (generatedOutfit && (generatedOutfit.top?.id === id || generatedOutfit.bottom?.id === id || generatedOutfit.shoes?.id === id)) {
      setGeneratedOutfit(null);
    }
  };

  // Restore Default 21 Designer Pieces
  const handleResetDefaultCloset = () => {
    if (window.confirm('Reset your digital wardrobe back to the 21 curated designer pieces?')) {
      closetItemsRef.current = INITIAL_CLOSET;
      setClosetItems(INITIAL_CLOSET);
      try {
        localStorage.setItem('preptogo_closet_items', JSON.stringify(INITIAL_CLOSET));
      } catch (err) {
        console.warn('Failed to reset wardrobe items in localStorage:', err);
      }
    }
  };

  // Dynamically reads the freshest closet list right when the generate button is clicked
  const handleGenerateOutfit = async () => {
    const currentActiveWeather = WEATHER_DATA[weatherCondition] || WEATHER_DATA.sunny;

    // 1. Retrieve the absolute latest closet state from localStorage or Ref (avoids stale closures)
    let freshCloset = closetItemsRef.current;
    try {
      const saved = localStorage.getItem('preptogo_closet_items') || localStorage.getItem('clawson_closet_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          freshCloset = parsed;
        }
      }
    } catch (err) {
      console.warn('Error reading fresh closet items from localStorage:', err);
    }

    // Ensure state and ref reflect the dynamic fresh list
    closetItemsRef.current = freshCloset;
    setClosetItems(freshCloset);

    try {
      setIsGenerating(true);
      setStylistNotice('');

      // 2. Generate outfit with flexible category resolution and automatic fallback items
      const result = await generateOutfitWithGemini({
        closetItems: freshCloset,
        weatherCondition,
        weatherInfo: currentActiveWeather
      });

      setGeneratedOutfit(result.outfit);

      if (result.notice) {
        setStylistNotice(result.notice);
      } else if (result.isAi) {
        setStylistNotice(`✨ Styled live by Gemini AI (${result.outfit.modelUsed || 'Gemini 2.5'})`);
      }
    } catch (err) {
      console.error('Outfit generation error:', err);
      alert(err.message || 'Unable to generate outfit.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear current generated outfit
  const handleClearOutfit = () => {
    setGeneratedOutfit(null);
    setStylistNotice('');
  };

  // One-click apply recommended nail style to NailAR Studio
  const handleApplyNailRecommendation = () => {
    if (!generatedOutfit?.nailRecommendation) return;
    const { hex, shape } = generatedOutfit.nailRecommendation;

    if (hex) setNailColor(hex);
    if (shape && ['oval', 'square', 'almond', 'stiletto'].includes(shape)) {
      setNailShape(shape);
    }
    nailImageRef.current = null;
    setExtractedImageName('');
    setActiveTab('nailar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flexible Category Filter for Digital Closet Manager
  const filteredCloset = closetCategoryFilter === 'All'
    ? closetItems
    : closetItems.filter((i) => normalizeCategory(i.category, i.name, i.description) === closetCategoryFilter);

  const currentWeather = WEATHER_DATA[weatherCondition] || WEATHER_DATA.sunny;

  return (
    <div className="studio-page-wrapper">
      {/* ── Sub-header with Top-Level Tab Switcher ── */}
      <div className="studio-tab-bar-container">
        <nav className="tab-switcher" role="tablist" aria-label="Studio Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'nailar'}
            className={`tab-btn ${activeTab === 'nailar' ? 'active' : ''}`}
            onClick={() => setActiveTab('nailar')}
          >
            <span className="tab-emoji">💅</span>
            <span className="tab-text">NailAR Studio</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'clawsfit'}
            className={`tab-btn ${activeTab === 'clawsfit' ? 'active' : ''}`}
            onClick={() => setActiveTab('clawsfit')}
          >
            <span className="tab-emoji">👗</span>
            <span className="tab-text">ClawsFit Wardrobe &amp; Outfits</span>
          </button>
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: NAILAR STUDIO (PRESERVED LIVE AR CAMERA VIEW)
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="app-container tab-content"
        style={{ display: activeTab === 'nailar' ? 'flex' : 'none' }}
      >
        <header className="page-header">
          <h1>AI Nail Style Try&#x2011;On</h1>
          <p>Drape bespoke patterns or high-gloss nail polish live onto your fingertips in real time.</p>
        </header>

        <div className="camera-viewport">
          <video ref={videoRef} className="input_video" playsInline muted />
          <canvas ref={canvasRef} className="output_canvas" />
          {!isModelReady && <div className="loading-overlay">Initialising camera &amp; hand tracker…</div>}
        </div>

        <div className="control-panel">
          {/* Nail Shape Customizer Dropdown */}
          <div className="control-group">
            <label htmlFor="shapeSelector">Nail Shape</label>
            <div className="select-wrapper">
              <select
                id="shapeSelector"
                value={nailShape}
                onChange={(e) => setNailShape(e.target.value)}
                className="shape-select"
              >
                <option value="oval">Oval</option>
                <option value="square">Square</option>
                <option value="almond">Almond</option>
                <option value="stiletto">Stiletto</option>
              </select>
            </div>
          </div>

          {/* Nail Colour Swatch Picker */}
          <div className="control-group">
            <label htmlFor="colorPicker">Nail Colour</label>
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

          {/* Design Upload & Clear Controls */}
          <div className="control-group">
            <label htmlFor="pinterestUpload" className="upload-btn">
              Upload Design
            </label>
            <input
              id="pinterestUpload"
              type="file"
              accept="image/*"
              onChange={handleNailImageUpload}
              style={{ display: 'none' }}
            />
            {extractedImageName ? (
              <div className="design-file-row">
                <span className="file-name">{extractedImageName}</span>
                <button
                  type="button"
                  onClick={handleResetNailDesign}
                  className="clear-btn"
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

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: CLAWSFIT WARDROBE & WEATHER STYLIST
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="clawsfit-container tab-content"
        style={{ display: activeTab === 'clawsfit' ? 'flex' : 'none' }}
      >
        <header className="page-header">
          <h1>ClawsFit Wardrobe &amp; Stylist</h1>
          <p>Curate your personal digital closet and generate weather-tailored outfits balanced by color harmony.</p>
        </header>

        <div className="clawsfit-dashboard-grid">
          {/* ── LEFT COLUMN: Weather Hub, Stylist Tips & Outfit Generator ── */}
          <section className="clawsfit-sidebar">
            {/* 1. Weather Widget */}
            <div className="clawsfit-card weather-widget-card">
              <div className="card-header">
                <span className="card-badge">{currentWeather.badge}</span>
                <h2>Simulated Weather</h2>
              </div>

              <div className="weather-display">
                <span className="weather-icon-large">{currentWeather.icon}</span>
                <div className="weather-meta">
                  <span className="weather-temp">{currentWeather.temp}</span>
                  <span className="weather-condition-name">{currentWeather.name}</span>
                  <span className="weather-summary">{currentWeather.summary}</span>
                </div>
              </div>

              <div className="weather-stats-row">
                <div className="weather-stat">
                  <span className="stat-label">Humidity</span>
                  <span className="stat-val">{currentWeather.humidity}</span>
                </div>
                <div className="weather-stat">
                  <span className="stat-label">Wind</span>
                  <span className="stat-val">{currentWeather.wind}</span>
                </div>
              </div>

              {/* Weather testing toggles with all 5 conditions */}
              <div className="weather-toggle-section">
                <label className="toggle-label">Switch Weather Condition:</label>
                <div className="weather-toggle-pills">
                  {Object.values(WEATHER_DATA).map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      className={`weather-pill-btn ${weatherCondition === w.key ? 'active' : ''}`}
                      onClick={() => setWeatherCondition(w.key)}
                    >
                      <span className="pill-icon">{w.icon}</span>
                      <span className="pill-text">{w.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Weather-Aware Stylist Tips */}
            <div className="clawsfit-card stylist-tips-card">
              <div className="card-header">
                <span className="card-badge gold">Stylist Guidelines</span>
                <h2>Weather-Aware Styling Advice</h2>
              </div>

              <div className="stylist-advice-block">
                <div className="advice-point">
                  <span className="point-icon">✨</span>
                  <div className="point-content">
                    <strong>Recommended Fabrics:</strong>
                    <p>{currentWeather.fabrics}</p>
                  </div>
                </div>

                <div className="advice-point caution">
                  <span className="point-icon">⚠️</span>
                  <div className="point-content">
                    <strong>Caution:</strong>
                    <p>{currentWeather.cautions}</p>
                  </div>
                </div>

                {/* Highlighted Essential Checklist Reminder */}
                <div className="reminder-box">
                  <span className="reminder-icon">💡</span>
                  <div className="reminder-text">
                    <span className="reminder-title">Daily Essential Checklist</span>
                    <p className="reminder-quote">"{currentWeather.reminder}"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Smart Outfit Generator Powered by Gemini AI */}
            <div className="clawsfit-card outfit-generator-card">
              <div className="card-header">
                <span className="card-badge mauve">AI Stylist</span>
                <h2>Smart Outfit Generator</h2>
              </div>

              <p className="generator-desc">
                AI analyzes color theory, silhouettes, and {currentWeather.name} suitability to engineer your optimal look.
              </p>

              {/* Notice / Status Banner */}
              {stylistNotice && (
                <div className="stylist-notice-banner">
                  <span className="notice-icon">💬</span>
                  <div className="notice-content">{stylistNotice}</div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="generator-actions-group">
                <button
                  type="button"
                  className="generate-fit-btn"
                  onClick={handleGenerateOutfit}
                  disabled={isGenerating}
                  style={{ opacity: isGenerating ? 0.75 : 1 }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinning-icon">✨</span>
                      <span>Styling with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>{generatedOutfit ? "Regenerate Today's Fit" : "Generate Today's Fit"}</span>
                    </>
                  )}
                </button>

                {generatedOutfit && (
                  <button
                    type="button"
                    className="clear-fit-btn"
                    onClick={handleClearOutfit}
                    title="Clear current outfit"
                  >
                    ✕ Clear Fit
                  </button>
                )}
              </div>

              {/* Persistent Generated Outfit Showcase */}
              {generatedOutfit && (
                <div className="generated-outfit-showcase">
                  <div className="harmony-score-banner">
                    <span className="score-star">★</span>
                    <span className="score-label">{generatedOutfit.score}% Color Harmony Match</span>
                    <span className="score-desc">• {generatedOutfit.styleTitle || generatedOutfit.desc}</span>
                  </div>

                  <div className="outfit-items-row">
                    {/* Top */}
                    <div className="outfit-piece-card">
                      <div className="piece-img-wrap">
                        <img
                          src={generatedOutfit.top.image}
                          alt={generatedOutfit.top.name}
                          onError={(e) => handleImgFallback(e, generatedOutfit.top)}
                        />
                        <span className="piece-category-tag">
                          {normalizeCategory(generatedOutfit.top.category, generatedOutfit.top.name)}
                        </span>
                      </div>
                      <div className="piece-info">
                        <span className="piece-name">{generatedOutfit.top.name}</span>
                        <div className="piece-color-tag">
                          <span className="color-dot" style={{ backgroundColor: generatedOutfit.top.color }} />
                          <span>{generatedOutfit.top.colorName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="outfit-piece-card">
                      <div className="piece-img-wrap">
                        <img
                          src={generatedOutfit.bottom.image}
                          alt={generatedOutfit.bottom.name}
                          onError={(e) => handleImgFallback(e, generatedOutfit.bottom)}
                        />
                        <span className="piece-category-tag">
                          {normalizeCategory(generatedOutfit.bottom.category, generatedOutfit.bottom.name)}
                        </span>
                      </div>
                      <div className="piece-info">
                        <span className="piece-name">{generatedOutfit.bottom.name}</span>
                        <div className="piece-color-tag">
                          <span className="color-dot" style={{ backgroundColor: generatedOutfit.bottom.color }} />
                          <span>{generatedOutfit.bottom.colorName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shoes */}
                    <div className="outfit-piece-card">
                      <div className="piece-img-wrap">
                        <img
                          src={generatedOutfit.shoes.image}
                          alt={generatedOutfit.shoes.name}
                          onError={(e) => handleImgFallback(e, generatedOutfit.shoes)}
                        />
                        <span className="piece-category-tag">
                          {normalizeCategory(generatedOutfit.shoes.category, generatedOutfit.shoes.name)}
                        </span>
                      </div>
                      <div className="piece-info">
                        <span className="piece-name">{generatedOutfit.shoes.name}</span>
                        <div className="piece-color-tag">
                          <span className="color-dot" style={{ backgroundColor: generatedOutfit.shoes.color }} />
                          <span>{generatedOutfit.shoes.colorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stylist AI Detailed Rationale */}
                  <div className="stylist-commentary-card">
                    <div className="commentary-title-row">
                      <span className="commentary-title">Stylist Analysis &amp; Color Rationale</span>
                      <span className="ai-engine-tag">
                        {generatedOutfit.source === 'gemini' ? 'Gemini AI Stylist' : 'Smart Stylist Harmony'}
                      </span>
                    </div>

                    <p className="commentary-body">{generatedOutfit.stylingAdvice}</p>

                    {generatedOutfit.weatherSuitability && (
                      <div className="weather-verdict-row">
                        <span>🌤️</span>
                        <span>
                          <strong>Weather Fitness:</strong> {generatedOutfit.weatherSuitability}
                        </span>
                      </div>
                    )}

                    {/* Dual-feature Nail Pairing Recommendation */}
                    {generatedOutfit.nailRecommendation && (
                      <div className="nail-pairing-box">
                        <div className="nail-pairing-info">
                          <span
                            className="nail-swatch-circle"
                            style={{ backgroundColor: generatedOutfit.nailRecommendation.hex }}
                          />
                          <div className="nail-pairing-meta">
                            <span className="nail-pairing-label">Suggested Nail Pairing</span>
                            <span className="nail-pairing-name">
                              {generatedOutfit.nailRecommendation.shadeName} (
                              {generatedOutfit.nailRecommendation.shape})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="try-nail-ar-btn"
                          onClick={handleApplyNailRecommendation}
                          title="Try this suggested nail polish live in the AR camera"
                        >
                          💅 Try in NailAR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT COLUMN: Digital Closet Manager (With Dynamic LocalStorage) ── */}
          <section className="clawsfit-closet-section">
            <div className="clawsfit-card closet-manager-card">
              <div className="closet-header-row">
                <div>
                  <div className="closet-title-wrap">
                    <h2>Digital Closet Manager</h2>
                    <span className="closet-count-badge">{closetItems.length} items</span>
                  </div>
                  <p className="closet-subtitle">
                    Organize, preview, and manage your wardrobe collection. All edits save automatically.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="reset-wardrobe-btn"
                    onClick={handleResetDefaultCloset}
                    title="Reset to 21 curated designer items"
                  >
                    ↺ Reset Closet
                  </button>

                  <button
                    type="button"
                    className="add-item-toggle-btn"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? '✕ Close Form' : '＋ Add Clothing'}
                  </button>
                </div>
              </div>

              {/* Add Clothing Item Form / Collapsible Drawer */}
              {showAddForm && (
                <form className="add-clothing-form" onSubmit={handleAddClosetItem}>
                  <h3>Add Piece to Closet</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="itemName">Item Name</label>
                      <input
                        id="itemName"
                        type="text"
                        placeholder="e.g. Linen Button-Down Blouse"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="itemCategory">Category / Type</label>
                      <input
                        id="itemCategory"
                        type="text"
                        list="categorySuggestions"
                        placeholder="e.g. Top, Sweater, Pants, Boots..."
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        required
                      />
                      <datalist id="categorySuggestions">
                        <option value="Tops">Tops (Shirt, Sweater, Hoodie, Jacket)</option>
                        <option value="Bottoms">Bottoms (Pants, Jeans, Skirt, Shorts)</option>
                        <option value="Shoes">Shoes (Sneakers, Heels, Boots, Slides)</option>
                      </datalist>
                    </div>

                    <div className="form-field">
                      <label htmlFor="itemColor">Item Color</label>
                      <div className="color-input-wrapper">
                        <input
                          id="itemColor"
                          type="color"
                          value={newItemColor}
                          onChange={(e) => setNewItemColor(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Color Name (e.g. Dusty Rose)"
                          value={newItemColorName}
                          onChange={(e) => setNewItemColorName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="itemWarmth">Warmth &amp; Fabric</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          id="itemWarmth"
                          value={newItemWarmth}
                          onChange={(e) => setNewItemWarmth(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="light">Light (Cool)</option>
                          <option value="medium">Medium</option>
                          <option value="warm">Warm (Insulated)</option>
                        </select>
                        <select
                          value={newItemBreathable ? 'yes' : 'no'}
                          onChange={(e) => setNewItemBreathable(e.target.value === 'yes')}
                          style={{ flex: 1 }}
                        >
                          <option value="yes">Breathable</option>
                          <option value="no">Insulating/Waterproof</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Weather Suitability (Optional - auto-detected if unselected)</label>
                      <div className="form-weather-pills">
                        {[
                          { id: 'sunny', label: '☀️ Sunny' },
                          { id: 'rainy', label: '🌧️ Rainy' },
                          { id: 'chilly', label: '❄️ Chilly' },
                          { id: 'hot', label: '🔥 Hot' },
                          { id: 'windy', label: '💨 Windy' }
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            className={`form-weather-pill-btn ${newItemWeathers.includes(w.id) ? 'selected' : ''}`}
                            onClick={() => toggleNewItemWeather(w.id)}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="itemDescription">Description &amp; Material Details</label>
                      <input
                        id="itemDescription"
                        type="text"
                        placeholder="e.g. 100% French linen shirt, breathable, great for sunny warm days"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="itemImage">Image URL or Local Upload (Persisted to Storage)</label>
                      <div className="image-input-group">
                        <input
                          id="itemImage"
                          type="url"
                          placeholder="Paste image URL..."
                          value={newItemImage}
                          onChange={(e) => setNewItemImage(e.target.value)}
                        />
                        <label htmlFor="localPhotoUpload" className="upload-photo-label">
                          📁 Upload File
                        </label>
                        <input
                          id="localPhotoUpload"
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleClosetPhotoUpload}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-item-btn">
                      Save to Closet
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Category Filter Pills */}
              <div className="category-filter-bar">
                {['All', 'Tops', 'Bottoms', 'Shoes'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-pill-btn ${closetCategoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setClosetCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Clothing Grid */}
              <div className="clothing-grid">
                {filteredCloset.map((item) => (
                  <div key={item.id} className="clothing-card">
                    <div className="clothing-image-container">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => handleImgFallback(e, item)}
                      />
                      <span className="clothing-category-badge">
                        {normalizeCategory(item.category, item.name, item.description)}
                      </span>
                      <button
                        type="button"
                        className="clothing-delete-btn"
                        title="Delete item"
                        onClick={() => handleDeleteClosetItem(item.id)}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="clothing-details">
                      <h4 className="clothing-name">{item.name}</h4>
                      <div className="clothing-color-row">
                        <span
                          className="clothing-color-swatch"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="clothing-color-label">{item.colorName}</span>
                      </div>
                      {item.description && (
                        <p className="clothing-desc-text" title={item.description}>
                          {item.description}
                        </p>
                      )}
                      {(() => {
                        const itemWeathers = resolveItemWeather(item);
                        if (!itemWeathers || itemWeathers.length === 0) return null;
                        const weatherIcons = {
                          sunny: '☀️',
                          rainy: '🌧️',
                          chilly: '❄️',
                          hot: '🔥',
                          windy: '💨'
                        };
                        return (
                          <div className="clothing-weather-tags">
                            {itemWeathers.map((tag) => (
                              <span key={tag} className={`weather-tag-pill weather-tag-${tag}`}>
                                {weatherIcons[tag] || '🌤️'} {tag}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {filteredCloset.length === 0 && (
                <div className="empty-closet-notice">
                  <p>No items found in this category.</p>
                  <button
                    type="button"
                    className="add-item-toggle-btn"
                    onClick={() => setShowAddForm(true)}
                  >
                    ＋ Add Your First {closetCategoryFilter}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
