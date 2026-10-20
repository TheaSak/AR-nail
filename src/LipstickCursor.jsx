import { useEffect, useRef, useCallback } from 'react';

/* ─── Particle pool ──────────────────────────────────────────────────────── */
const COLORS = [
  '#ff6b81', '#ff0055', '#ff8fa3', '#ffd6e0',
  '#c084fc', '#f472b6', '#fbbf24', '#ffffff',
];

function createParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.6 + Math.random() * 1.8;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 1.2,
    alpha: 1,
    size: 2 + Math.random() * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    decay: 0.025 + Math.random() * 0.025,
    sparkle: Math.random() > 0.5,
  };
}

/* ─── Star path helper ───────────────────────────────────────────────────── */
function drawStar(ctx, x, y, r) {
  const pts = 4;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const a = (i * Math.PI) / pts;
    i === 0
      ? ctx.moveTo(x + radius * Math.cos(a), y + radius * Math.sin(a))
      : ctx.lineTo(x + radius * Math.cos(a), y + radius * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function LipstickCursor() {
  const canvasRef = useRef(null);
  const lipstickRef = useRef(null);
  const particles = useRef([]);
  const rafId = useRef(null);
  const lastPos = useRef({ x: -200, y: -200 });
  const mousePos = useRef({ x: -200, y: -200 });

  /* Move the visible lipstick div + spawn trail particles */
  const onMouseMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;
    mousePos.current = { x, y };

    // Move the lipstick icon so it follows the cursor exactly
    if (lipstickRef.current) {
      lipstickRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    // Spawn particles only when the mouse has moved enough
    const dx = x - lastPos.current.x;
    const dy = y - lastPos.current.y;
    if (dx * dx + dy * dy > 4) {
      lastPos.current = { x, y };
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        // Trail emits from the brush tip at the top of the nail polish bottle
        particles.current.push(createParticle(x - 2, y + 6));
      }
      if (particles.current.length > 200) {
        particles.current.splice(0, particles.current.length - 200);
      }
    }
  }, []);

  /* Animation loop for the trail canvas */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.current = particles.current.filter((p) => p.alpha > 0.01);

    for (const p of particles.current) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.sparkle) {
        drawStar(ctx, p.x, p.y, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.alpha -= p.decay;
      p.size *= 0.98;
    }

    ctx.globalAlpha = 1;
    rafId.current = requestAnimationFrame(animate);
  }, []);

  /* Resize canvas to fill viewport */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [resize, onMouseMove, animate]);

  return (
    <>
      {/* ── Trail canvas ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 99998,
        }}
      />

      {/* ── Visible nail polish cursor ── */}
      <div
        ref={lipstickRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          /* brush tip is the hot-spot — sits at the very top of the SVG */
          marginLeft: '-12px',
          marginTop: '-4px',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
          transform: 'translate3d(-200px, -200px, 0)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="68"
          viewBox="0 0 40 68"
        >
          {/* ── brush bristles (tip = hot-spot at top) ── */}
          <rect x="18" y="0" width="4" height="10" rx="2" fill="#1a1a1a" />
          <rect x="17" y="3" width="2" height="8" rx="1" fill="rgba(255,255,255,0.15)" />

          {/* ── brush ferrule (metal band) ── */}
          <rect x="15" y="9" width="10" height="4" rx="1" fill="#bbb" />
          <rect x="15" y="9" width="10" height="1.5" rx="0.75" fill="#ddd" />

          {/* ── cap (long dark rectangle) ── */}
          <rect x="12" y="13" width="16" height="20" rx="3" fill="#2d2d2d" />
          {/* cap shine */}
          <rect x="14" y="14" width="4" height="17" rx="2" fill="rgba(255,255,255,0.08)" />
          {/* cap bottom rim */}
          <rect x="12" y="31" width="16" height="2" rx="1" fill="#444" />

          {/* ── neck / collar ── */}
          <rect x="14" y="33" width="12" height="4" rx="1" fill="#999" />
          <rect x="14" y="33" width="12" height="1.5" rx="0.75" fill="#ccc" />

          {/* ── bottle body ── */}
          <rect x="8" y="37" width="24" height="26" rx="5" fill="#ff4d6d" />
          {/* glass highlight — left edge */}
          <rect x="10" y="39" width="5" height="20" rx="2.5" fill="rgba(255,255,255,0.22)" />
          {/* inner polish color shows through glass */}
          <rect x="17" y="40" width="12" height="20" rx="3" fill="#e6003a" opacity="0.5" />
          {/* bottle bottom sheen */}
          <ellipse cx="20" cy="62" rx="9" ry="2.5" fill="rgba(0,0,0,0.2)" />
        </svg>
      </div>
    </>
  );
}
