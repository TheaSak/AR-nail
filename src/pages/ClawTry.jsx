import { useEffect, useRef, useState } from 'react';
import '../App.css';

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

/** Pre-populated stylish sample items for ClawsFit digital closet */
const INITIAL_CLOSET = [
  {
    id: 'item-1',
    name: 'Ivory Silk Camisole',
    category: 'Tops',
    color: '#fdf6f0',
    colorName: 'Ivory Cream',
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&auto=format&fit=crop&q=80',
    breathable: true,
    warmth: 'light'
  },
  {
    id: 'item-2',
    name: 'Tailored Rose Trousers',
    category: 'Bottoms',
    color: '#c9919c',
    colorName: 'Dusty Rose',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=80',
    breathable: true,
    warmth: 'medium'
  },
  {
    id: 'item-3',
    name: 'Gilded Strappy Stilettos',
    category: 'Shoes',
    color: '#c9a96e',
    colorName: 'Champagne Gold',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=80',
    breathable: true,
    warmth: 'light'
  },
  {
    id: 'item-4',
    name: 'Cashmere Knit Cardigan',
    category: 'Tops',
    color: '#e8bfb8',
    colorName: 'Blush Pink',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=80',
    breathable: false,
    warmth: 'warm'
  },
  {
    id: 'item-5',
    name: 'Pleated Mauve Midi Skirt',
    category: 'Bottoms',
    color: '#a85c6e',
    colorName: 'Deep Mauve',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&auto=format&fit=crop&q=80',
    breathable: true,
    warmth: 'medium'
  },
  {
    id: 'item-6',
    name: 'Classic Pearl White Sneakers',
    category: 'Shoes',
    color: '#ffffff',
    colorName: 'Pearl White',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
    breathable: true,
    warmth: 'medium'
  }
];

/** Weather configurations with conditions and stylist guidelines */
const WEATHER_DATA = {
  hot: {
    key: 'hot',
    name: 'Hot & Sunny',
    temp: '33°C (91°F)',
    tempValue: 33,
    icon: '☀️',
    summary: 'High UV index, solar heat, humid air',
    humidity: '46%',
    wind: '10 km/h',
    badge: 'Heatwave Alert',
    fabrics: 'Opt for lightweight, breathable natural fabrics such as organic linen, raw silk, and airy cotton to maximize natural ventilation.',
    cautions: 'Avoid heavy synthetic fabrics and dark/black clothing that absorb solar heat and elevate body temperature.',
    reminder: "Don't forget sunscreen, a hat, and deodorant!"
  },
  rainy: {
    key: 'rainy',
    name: 'Rainy & Overcast',
    temp: '22°C (72°F)',
    tempValue: 22,
    icon: '🌧️',
    summary: 'Scattered downpours, wet sidewalks, overcast sky',
    humidity: '88%',
    wind: '18 km/h',
    badge: 'Wet Weather Advisory',
    fabrics: 'Choose water-resistant outerwear, quick-drying performance fabrics, and treated leather footwear to withstand moisture.',
    cautions: 'Avoid delicate suede shoes and long trailing hemlines that can absorb road puddle splash and street dirt.',
    reminder: 'Bring an umbrella or raincoat!'
  },
  cold: {
    key: 'cold',
    name: 'Chilly & Crisp',
    temp: '14°C (57°F)',
    tempValue: 14,
    icon: '❄️',
    summary: 'Crisp autumn breeze, low temperature, biting wind',
    humidity: '55%',
    wind: '22 km/h',
    badge: 'Cool Temperature Advisory',
    fabrics: 'Embrace smart warm layering: thermal base layers, chunky cashmere/wool knits, topped with a tailored coat.',
    cautions: 'Avoid single thin cotton garments that leave you shivering in sudden wind gusts.',
    reminder: 'Bundle up with a cozy knit scarf and keep warm insulated footwear ready!'
  }
};

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
        const stream = videoElement.srcObject;
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
     CLAWSFIT WARDROBE & STYLIST STATE
     ══════════════════════════════════════════════════════════════ */
  const [closetItems, setClosetItems] = useState(INITIAL_CLOSET);
  const [closetCategoryFilter, setClosetCategoryFilter] = useState('All');
  const [weatherCondition, setWeatherCondition] = useState('hot');
  const [generatedOutfit, setGeneratedOutfit] = useState(null);

  // Add Item Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Tops');
  const [newItemColor, setNewItemColor] = useState('#c9919c');
  const [newItemColorName, setNewItemColorName] = useState('Dusty Rose');
  const [newItemImage, setNewItemImage] = useState('');

  // Fallback SVG image helper when network image fails
  const handleImgFallback = (e, item) => {
    e.target.onerror = null;
    const catIcon = item.category === 'Tops' ? '👚' : item.category === 'Bottoms' ? '👖' : '👠';
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

  // Add clothing item
  const handleAddClosetItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const fallbackImg = newItemCategory === 'Tops'
      ? 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&auto=format&fit=crop&q=80'
      : newItemCategory === 'Bottoms'
      ? 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=80';

    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      color: newItemColor,
      colorName: newItemColorName.trim() || 'Custom Hue',
      image: newItemImage.trim() || fallbackImg,
      breathable: newItemCategory === 'Tops' ? true : false,
      warmth: newItemCategory === 'Tops' ? 'medium' : 'light'
    };

    setClosetItems([newItem, ...closetItems]);
    setNewItemName('');
    setNewItemImage('');
    setShowAddForm(false);
  };

  // Local file upload for clothing photo
  const handleClosetPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewItemImage(url);
  };

  // Delete clothing item
  const handleDeleteClosetItem = (id) => {
    setClosetItems(closetItems.filter((item) => item.id !== id));
    if (generatedOutfit && (generatedOutfit.top?.id === id || generatedOutfit.bottom?.id === id || generatedOutfit.shoes?.id === id)) {
      setGeneratedOutfit(null);
    }
  };

  // Smart Outfit Generator with color harmony & weather synergy
  const handleGenerateOutfit = () => {
    const tops = closetItems.filter((i) => i.category === 'Tops');
    const bottoms = closetItems.filter((i) => i.category === 'Bottoms');
    const shoes = closetItems.filter((i) => i.category === 'Shoes');

    if (!tops.length || !bottoms.length || !shoes.length) {
      alert('Please ensure you have at least one Top, one Bottom, and one pair of Shoes in your closet to generate a complete outfit!');
      return;
    }

    // Weather-aware filtering
    let candidateTops = tops;
    if (weatherCondition === 'hot') {
      const breathable = tops.filter((t) => t.warmth === 'light' || t.breathable);
      if (breathable.length) candidateTops = breathable;
    } else if (weatherCondition === 'cold') {
      const warmTops = tops.filter((t) => t.warmth === 'warm' || !t.breathable);
      if (warmTops.length) candidateTops = warmTops;
    }

    const selectedTop = candidateTops[Math.floor(Math.random() * candidateTops.length)];
    const selectedBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const selectedShoes = shoes[Math.floor(Math.random() * shoes.length)];

    // Color harmony calculation
    const activeWeather = WEATHER_DATA[weatherCondition];
    let harmonyScore = 96;
    let harmonyDesc = 'Romantic Monochromatic Harmony';

    if (weatherCondition === 'hot') {
      harmonyScore = 98;
      harmonyDesc = 'Breezy Pastel Glow & Lightweight Balance';
    } else if (weatherCondition === 'rainy') {
      harmonyScore = 95;
      harmonyDesc = 'Protected Earthy Contrast with Water-Resistant Anchors';
    } else if (weatherCondition === 'cold') {
      harmonyScore = 97;
      harmonyDesc = 'Luxe Layered Warmth with Gilded Accents';
    }

    setGeneratedOutfit({
      top: selectedTop,
      bottom: selectedBottom,
      shoes: selectedShoes,
      score: harmonyScore,
      desc: harmonyDesc,
      weather: activeWeather
    });
  };

  const filteredCloset = closetCategoryFilter === 'All'
    ? closetItems
    : closetItems.filter((i) => i.category === closetCategoryFilter);

  const currentWeather = WEATHER_DATA[weatherCondition];

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

              {/* Weather testing toggles */}
              <div className="weather-toggle-section">
                <label className="toggle-label">Switch Weather For Testing:</label>
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
                <span className="card-badge gold">Stylist AI</span>
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

            {/* 3. Smart Outfit Generator */}
            <div className="clawsfit-card outfit-generator-card">
              <div className="card-header">
                <span className="card-badge mauve">AI Harmony</span>
                <h2>Smart Outfit Generator</h2>
              </div>
              <p className="generator-desc">
                Algorithmically curates matching Tops, Bottoms, and Shoes engineered for color harmony and {currentWeather.name}.
              </p>

              <button
                type="button"
                className="generate-fit-btn"
                onClick={handleGenerateOutfit}
              >
                <span>✨</span> Generate Today's Fit
              </button>

              {generatedOutfit && (
                <div className="generated-outfit-showcase">
                  <div className="harmony-score-banner">
                    <span className="score-star">★</span>
                    <span className="score-label">{generatedOutfit.score}% Color Harmony Match</span>
                    <span className="score-desc">• {generatedOutfit.desc}</span>
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
                        <span className="piece-category-tag">Top</span>
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
                        <span className="piece-category-tag">Bottom</span>
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
                        <span className="piece-category-tag">Shoes</span>
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
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT COLUMN: Digital Closet Manager ── */}
          <section className="clawsfit-closet-section">
            <div className="clawsfit-card closet-manager-card">
              <div className="closet-header-row">
                <div>
                  <div className="closet-title-wrap">
                    <h2>Digital Closet Manager</h2>
                    <span className="closet-count-badge">{closetItems.length} items</span>
                  </div>
                  <p className="closet-subtitle">Organize, preview, and manage your wardrobe collection.</p>
                </div>

                <button
                  type="button"
                  className="add-item-toggle-btn"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? '✕ Close Form' : '＋ Add Clothing'}
                </button>
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
                      <label htmlFor="itemCategory">Category</label>
                      <select
                        id="itemCategory"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                      >
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Shoes">Shoes</option>
                      </select>
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
                      <label htmlFor="itemImage">Image URL or Local Upload</label>
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
                      <span className="clothing-category-badge">{item.category}</span>
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
