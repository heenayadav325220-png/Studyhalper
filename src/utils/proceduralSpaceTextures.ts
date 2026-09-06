import * as THREE from 'three';

/**
 * High-definition procedural texture generator for realistic 3D planets, clouds, rings, and nebulae.
 * Renders into high-res offscreen canvases and returns THREE.CanvasTexture objects.
 */

// Helper to create a canvas
function createOffscreenCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

/**
 * 1. Procedural 3D Sun Texture with granulation and solar flares
 */
export function createSunTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(1024, 512);
  const w = canvas.width;
  const h = canvas.height;

  // Base luminous solar gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#fffbeb');
  grad.addColorStop(0.2, '#fef08a');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(0.8, '#d97706');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Solar granulation noise cells
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 2 + Math.random() * 8;
    const bright = Math.random() > 0.4;
    ctx.fillStyle = bright ? 'rgba(255, 255, 255, 0.4)' : 'rgba(180, 83, 9, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunspots
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * w;
    const sy = h * 0.25 + Math.random() * (h * 0.5);
    const rad = 8 + Math.random() * 16;
    const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    sGrad.addColorStop(0, '#451a03');
    sGrad.addColorStop(0.6, '#78350f');
    sGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 2. Procedural 3D Earth Surface Texture (Oceans, Continents, Ice Caps, Deserts)
 */
export function createEarthTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(1024, 512);
  const w = canvas.width;
  const h = canvas.height;

  // Deep oceanic blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#1e3a8a');
  oceanGrad.addColorStop(0.5, '#0284c7');
  oceanGrad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Polar Ice Caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h * 0.12);
  ctx.fillRect(0, h * 0.88, w, h * 0.12);

  // Continental landmasses
  const drawContinent = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const noise = 0.75 + Math.sin(a * 5) * 0.15 + Math.cos(a * 8) * 0.1;
      const x = cx + Math.cos(a) * rx * noise;
      const y = cy + Math.sin(a) * ry * noise;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // North America & South America
  drawContinent(w * 0.25, h * 0.35, w * 0.12, h * 0.18, '#15803d');
  drawContinent(w * 0.32, h * 0.65, w * 0.08, h * 0.2, '#166534');
  // Eurasia & Africa
  drawContinent(w * 0.62, h * 0.32, w * 0.18, h * 0.16, '#15803d');
  drawContinent(w * 0.58, h * 0.58, w * 0.11, h * 0.22, '#ca8a04'); // Sahara / Africa
  // Australia
  drawContinent(w * 0.82, h * 0.7, w * 0.07, h * 0.1, '#b45309');

  // Mountain ranges & green textures
  for (let m = 0; m < 400; m++) {
    const mx = Math.random() * w;
    const my = h * 0.2 + Math.random() * (h * 0.6);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.beginPath();
    ctx.arc(mx, my, 4 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 3. Procedural 3D Earth Clouds Texture (Transparent swirling cloud bands)
 */
export function createCloudsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(1024, 512);
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Swirling white cloud vortices
  for (let i = 0; i < 280; i++) {
    const cx = Math.random() * w;
    const cy = h * 0.15 + Math.random() * (h * 0.7);
    const rad = 25 + Math.random() * 70;
    const alpha = 0.25 + Math.random() * 0.55;

    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    cGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    cGrad.addColorStop(0.5, `rgba(240, 249, 255, ${alpha * 0.5})`);
    cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 4. Procedural 3D Moon Surface Texture (Cratered Mare & Highlands)
 */
export function createMoonTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, w, h);

  // Lunar Mare (Dark basaltic plains)
  for (let m = 0; m < 35; m++) {
    const mx = Math.random() * w;
    const my = Math.random() * h;
    const mr = 20 + Math.random() * 45;
    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mGrad.addColorStop(0, 'rgba(51, 65, 85, 0.7)');
    mGrad.addColorStop(0.7, 'rgba(71, 85, 105, 0.4)');
    mGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lunar Craters with rim highlights and central shadows
  for (let c = 0; c < 120; c++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const cr = 3 + Math.random() * 12;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, cr, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 5. Procedural 3D Jupiter Texture (Cloud bands, Great Red Spot, turbulent whorls)
 */
export function createJupiterTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(1024, 512);
  const w = canvas.width;
  const h = canvas.height;

  const bandColors = [
    '#fef3c7', '#d97706', '#fed7aa', '#9a3412', '#ffedd5',
    '#ea580c', '#fff7ed', '#c2410c', '#fef3c7', '#7c2d12'
  ];

  const bandHeight = h / bandColors.length;
  for (let b = 0; b < bandColors.length; b++) {
    ctx.fillStyle = bandColors[b];
    ctx.fillRect(0, b * bandHeight, w, bandHeight + 2);

    // Zonal jet-stream turbulence
    for (let t = 0; t < 20; t++) {
      const tx = Math.random() * w;
      const ty = b * bandHeight + Math.random() * bandHeight;
      ctx.fillStyle = b % 2 === 0 ? 'rgba(124, 45, 18, 0.4)' : 'rgba(255, 247, 237, 0.5)';
      ctx.beginPath();
      ctx.ellipse(tx, ty, 30 + Math.random() * 50, 4 + Math.random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The Great Red Spot
  const grsX = w * 0.65;
  const grsY = h * 0.62;
  const grsGrad = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 45);
  grsGrad.addColorStop(0, '#991b1b');
  grsGrad.addColorStop(0.6, '#dc2626');
  grsGrad.addColorStop(0.85, '#ea580c');
  grsGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 6. Procedural 3D Saturn Texture (Muted golden beige ammonia bands)
 */
export function createSaturnTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(1024, 512);
  const w = canvas.width;
  const h = canvas.height;

  const saturnBands = [
    '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04',
    '#fef08a', '#eab308', '#d97706', '#fde047', '#ca8a04'
  ];

  const bH = h / saturnBands.length;
  for (let b = 0; b < saturnBands.length; b++) {
    ctx.fillStyle = saturnBands[b];
    ctx.fillRect(0, b * bH, w, bH + 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 7. Procedural 3D Saturn Rings Texture (High-res transparency strip with Cassini division)
 */
export function createSaturnRingsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 64);
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.0, 'rgba(254, 240, 138, 0)');
  grad.addColorStop(0.15, 'rgba(234, 179, 8, 0.4)');
  grad.addColorStop(0.45, 'rgba(202, 138, 4, 0.85)');
  // Cassini Division (transparent dark gap)
  grad.addColorStop(0.52, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(0.56, 'rgba(0, 0, 0, 0.05)');
  // Outer Ring A
  grad.addColorStop(0.65, 'rgba(250, 204, 21, 0.7)');
  grad.addColorStop(0.92, 'rgba(217, 119, 6, 0.3)');
  grad.addColorStop(1.0, 'rgba(254, 240, 138, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Micro fine ringlets
  for (let x = 0; x < w; x += 4) {
    if (Math.random() > 0.6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x, 0, 1.5, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * 8. Procedural 3D Mars Texture (Rust red, Valles Marineris canyon, polar ice cap)
 */
export function createMarsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  // Martian iron oxide red
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, w, h);

  // Dark basaltic plains
  for (let p = 0; p < 25; p++) {
    const px = Math.random() * w;
    const py = h * 0.25 + Math.random() * (h * 0.5);
    const pr = 15 + Math.random() * 40;
    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    pGrad.addColorStop(0, 'rgba(69, 26, 3, 0.65)');
    pGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Polar ice cap
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.05, w * 0.2, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 9. Procedural Nebula Cloud Canvas Texture (for 3D volumetric space sprites/planes)
 */
export function createNebulaSpriteTexture(color1: string, color2: string): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(256, 256);
  const cx = 128;
  const cy = 128;
  const rad = 120;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.4, color2);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * 10. Procedural 3D Neptune Texture (Deep azure with dark spots and bright cirrus clouds)
 */
export function createNeptuneTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.3, '#2563eb');
  grad.addColorStop(0.7, '#1d4ed8');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let c = 0; c < 30; c++) {
    const cx = Math.random() * w;
    const cy = h * 0.2 + Math.random() * (h * 0.6);
    ctx.fillStyle = 'rgba(238, 242, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 25 + Math.random() * 40, 2 + Math.random() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const dsGrad = ctx.createRadialGradient(w * 0.4, h * 0.55, 0, w * 0.4, h * 0.55, 25);
  dsGrad.addColorStop(0, '#0f172a');
  dsGrad.addColorStop(0.8, '#1e3a8a');
  dsGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');
  ctx.fillStyle = dsGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.4, h * 0.55, 25, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 11. Procedural 3D Uranus Texture (Pale cyan-aquamarine atmosphere)
 */
export function createUranusTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#67e8f9');
  grad.addColorStop(0.5, '#a5f3fc');
  grad.addColorStop(1, '#67e8f9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(6, 182, 212, 0.12)';
    ctx.fillRect(0, i * (h / 12), w, h / 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 12. Procedural 3D Venus Texture (Swirling golden-amber sulfuric clouds)
 */
export function createVenusTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.4, '#fde047');
  grad.addColorStop(0.7, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = 'rgba(202, 138, 4, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 40 + Math.random() * 50, 6 + Math.random() * 12, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 13. Procedural 3D Mercury Texture (Heavily cratered dark silicate crust)
 */
export function createMercuryTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, w, h);

  for (let c = 0; c < 150; c++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 2 + Math.random() * 10;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 14. Procedural 3D Lava Planet Texture (Basalt crust with glowing magma fissures)
 */
export function createLavaPlanetTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, w, h);

  for (let l = 0; l < 25; l++) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let lx = Math.random() * w;
    let ly = Math.random() * h;
    ctx.moveTo(lx, ly);
    for (let s = 0; s < 6; s++) {
      lx += (Math.random() - 0.5) * 40;
      ly += (Math.random() - 0.5) * 30;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 15. Procedural 3D Alien Bioluminescent Exoplanet Texture (Violet oceans, emerald flora)
 */
export function createAlienPlanetTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createOffscreenCanvas(512, 256);
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#4c1d95';
  ctx.fillRect(0, 0, w, h);

  for (let a = 0; a < 30; a++) {
    const ax = Math.random() * w;
    const ay = Math.random() * h;
    const ar = 15 + Math.random() * 35;
    const aGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar);
    aGrad.addColorStop(0, '#10b981');
    aGrad.addColorStop(0.7, '#065f46');
    aGrad.addColorStop(1, 'rgba(76, 29, 149, 0)');
    ctx.fillStyle = aGrad;
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

