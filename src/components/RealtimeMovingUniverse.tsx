import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WallpaperAmbiance } from '../types';
import {
  createSunTexture,
  createEarthTexture,
  createCloudsTexture,
  createMoonTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingsTexture,
  createMarsTexture,
  createNebulaSpriteTexture,
  createNeptuneTexture,
  createUranusTexture,
  createVenusTexture,
  createMercuryTexture
} from '../utils/proceduralSpaceTextures';
import {
  createRealistic3DSatellite,
  createRealistic3DAstronaut,
  createRealistic3DSpaceship,
  createRealistic3DAtom,
  createRealistic3DDnaHelix,
  createRealistic3DJellyfish,
  createRealistic3DCyberDrone,
  createRealistic3DSacredGeometry,
  createRealistic3DObsidianCrystal,
  createRealistic3DSpaceStation,
  createRealistic3DDeepSpaceProbe,
  createRealistic3DComet,
  createRealistic3DMiniScout,
  createRealistic3DSpaceCapsule,
  createRealistic3DJWST,
  createRealistic3DHubble,
  createRealistic3DFreighter,
  createRealistic3DScholar,
  createRealistic3DChemistryFlask,
  createRealistic3DPencilRocket,
  createRealistic3DFlyingBird,
  createRealistic3DButterfly,
  createRealistic3DKoiFish,
  createRealistic3DAutumnLeaf,
  createRealistic3DDandelionSeed,
  createRealistic3DFirefly,
  createRealistic3DScubaDiver,
  createRealistic3DDolphin,
  createRealistic3DSeaTurtle,
  createRealistic3DMantaRay,
  createRealistic3DCyborg,
  createRealistic3DQuantumCpuCube,
  createRealistic3DHoloDataCrystal,
  createRealistic3D8BitHero,
  createRealistic3DUfoSpaceInvader,
  createRealistic3D8BitCoin,
  createRealistic3D8BitStar,
  createRealistic3D8BitHeart,
  createRealistic3DZenMonk,
  createRealistic3DOrigamiCrane
} from '../utils/procedural3DModels';

interface RealtimeMovingUniverseProps {
  theme: WallpaperAmbiance;
  interactive?: boolean;
}

interface Dynamic3DObject {
  mesh: THREE.Object3D;
  update: (time: number, delta: number) => void;
}

// Helper to create 3D text formula sprites for science lab
function createFormulaSprite(formula: string, color = '#38bdf8'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(formula, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.5, 2.25, 1);
  return sprite;
}

export const RealtimeMovingUniverse: React.FC<RealtimeMovingUniverseProps> = ({
  theme = 'solar_system',
  interactive = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // -------------------------------------------------------------------------
    // 1. SCENE, CAMERA, RENDERER SETUP
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();

    // Thematic background fog
    const fogColors: Record<WallpaperAmbiance, number> = {
      solar_system: 0x020617,
      cosmic_nebula: 0x07051a,
      earth_forest: 0x021d13,
      deep_ocean: 0x021329,
      cyber_matrix: 0x020f09,
      science_chalkboard: 0x071510,
      retro_arcade: 0x140428,
      celestial_zen: 0x0c0817,
      deep_obsidian: 0x030308
    };
    scene.fog = new THREE.FogExp2(fogColors[theme] ?? 0x020617, 0.0008);

    const cameraFieldOfView = 54;
    const camera = new THREE.PerspectiveCamera(
      cameraFieldOfView,
      window.innerWidth / window.innerHeight,
      0.1,
      3500
    );
    camera.position.set(0, 10, 68);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 2. THEMATIC LIGHTING ENGINE
    // -------------------------------------------------------------------------
    const rootThemeGroup = new THREE.Group();
    scene.add(rootThemeGroup);
    const dynamicObjects: Dynamic3DObject[] = [];

    // Base ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Primary & Secondary Directional Lights matched to theme colors
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(60, 50, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.9);
    dirLight2.position.set(-60, -40, 40);
    scene.add(dirLight2);

    // -------------------------------------------------------------------------
    // 3. BACKGROUND PARTICLES (STARS, DUST, CODE, BUBBLES, EMBERS)
    // -------------------------------------------------------------------------
    const particleCount = theme === 'solar_system' || theme === 'cosmic_nebula' ? 2400 : 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const getPaletteForTheme = (t: WallpaperAmbiance) => {
      switch (t) {
        case 'science_chalkboard':
          return [new THREE.Color(0xf8fafc), new THREE.Color(0x38bdf8), new THREE.Color(0x34d399), new THREE.Color(0xfde047)];
        case 'earth_forest':
          return [new THREE.Color(0x4ade80), new THREE.Color(0x86efac), new THREE.Color(0xfef08a), new THREE.Color(0xfbbf24)];
        case 'deep_ocean':
          return [new THREE.Color(0x38bdf8), new THREE.Color(0x06b6d4), new THREE.Color(0x67e8f9), new THREE.Color(0xffffff)];
        case 'cyber_matrix':
          return [new THREE.Color(0x22c55e), new THREE.Color(0x4ade80), new THREE.Color(0x06b6d4), new THREE.Color(0x10b981)];
        case 'retro_arcade':
          return [new THREE.Color(0xf43f5e), new THREE.Color(0xa855f7), new THREE.Color(0x06b6d4), new THREE.Color(0xfacc15)];
        case 'celestial_zen':
        case 'deep_obsidian':
          return [new THREE.Color(0xf59e0b), new THREE.Color(0xfef08a), new THREE.Color(0xd97706), new THREE.Color(0xffffff)];
        case 'solar_system':
        case 'cosmic_nebula':
        default:
          return [new THREE.Color(0x38bdf8), new THREE.Color(0xffffff), new THREE.Color(0xfef08a), new THREE.Color(0xfb923c), new THREE.Color(0xc084fc)];
      }
    };

    const palette = getPaletteForTheme(theme);

    for (let i = 0; i < particleCount; i++) {
      const radius = 180 + Math.random() * 950;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const col = palette[Math.floor(Math.random() * palette.length)];
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: theme === 'retro_arcade' ? 3.5 : 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      sizeAttenuation: true
    });

    const backgroundParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(backgroundParticles);

    // -------------------------------------------------------------------------
    // 4. AUTONOMOUS ORGANIC WANDERER HELPER
    // -------------------------------------------------------------------------
    const createAutonomousWanderer = (
      obj: THREE.Object3D,
      config: {
        initPos: [number, number, number];
        speed?: number;
        rotSpeed?: [number, number, number];
        driftRadius?: [number, number, number];
        frequencies?: [number, number, number];
        phases?: [number, number, number];
        wrapBounds?: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
        linearVelocity?: [number, number, number];
        customAnimate?: (time: number, delta: number) => void;
      }
    ) => {
      const [initX, initY, initZ] = config.initPos;
      obj.position.set(initX, initY, initZ);

      const radX = config.driftRadius?.[0] ?? 12;
      const radY = config.driftRadius?.[1] ?? 8;
      const radZ = config.driftRadius?.[2] ?? 10;

      const fX = config.frequencies?.[0] ?? (0.05 + Math.random() * 0.08);
      const fY = config.frequencies?.[1] ?? (0.04 + Math.random() * 0.07);
      const fZ = config.frequencies?.[2] ?? (0.03 + Math.random() * 0.06);

      const pX = config.phases?.[0] ?? Math.random() * Math.PI * 2;
      const pY = config.phases?.[1] ?? Math.random() * Math.PI * 2;
      const pZ = config.phases?.[2] ?? Math.random() * Math.PI * 2;

      const rx = config.rotSpeed?.[0] ?? (Math.random() - 0.5) * 0.15;
      const ry = config.rotSpeed?.[1] ?? (Math.random() - 0.5) * 0.25;
      const rz = config.rotSpeed?.[2] ?? (Math.random() - 0.5) * 0.12;

      const vx = (config.linearVelocity?.[0] ?? (Math.random() - 0.5) * 0.04) * (config.speed ?? 1);
      const vy = (config.linearVelocity?.[1] ?? (Math.random() - 0.5) * 0.025) * (config.speed ?? 1);
      const vz = (config.linearVelocity?.[2] ?? (Math.random() - 0.5) * 0.03) * (config.speed ?? 1);

      let currentX = initX;
      let currentY = initY;
      let currentZ = initZ;

      const bounds = config.wrapBounds ?? { minX: -85, maxX: 85, minY: -45, maxY: 45, minZ: -100, maxZ: 38 };

      dynamicObjects.push({
        mesh: obj,
        update: (time, delta) => {
          currentX += vx * (delta * 60);
          currentY += vy * (delta * 60);
          currentZ += vz * (delta * 60);

          const wanderX = Math.sin(time * fX + pX) * radX * 0.4 + Math.cos(time * (fX * 0.618) + pY) * (radX * 0.2);
          const wanderY = Math.sin(time * fY + pY) * radY * 0.4 + Math.sin(time * (fY * 0.732) + pZ) * (radY * 0.2);
          const wanderZ = Math.cos(time * fZ + pZ) * radZ * 0.4 + Math.sin(time * (fZ * 0.541) + pX) * (radZ * 0.2);

          let finalX = currentX + wanderX;
          let finalY = currentY + wanderY;
          let finalZ = currentZ + wanderZ;

          if (finalX > bounds.maxX) { currentX = bounds.minX; finalX = bounds.minX; }
          if (finalX < bounds.minX) { currentX = bounds.maxX; finalX = bounds.maxX; }
          if (finalY > bounds.maxY) { currentY = bounds.minY; finalY = bounds.minY; }
          if (finalY < bounds.minY) { currentY = bounds.maxY; finalY = bounds.maxY; }
          if (finalZ > bounds.maxZ) { currentZ = bounds.minZ; finalZ = bounds.minZ; }
          if (finalZ < bounds.minZ) { currentZ = bounds.maxZ; finalZ = bounds.maxZ; }

          obj.position.set(finalX, finalY, finalZ);

          obj.rotation.x += rx * delta;
          obj.rotation.y += ry * delta;
          obj.rotation.z += rz * delta;

          if (config.customAnimate) {
            config.customAnimate(time, delta);
          }
        }
      });
    };

    // -------------------------------------------------------------------------
    // 5. THEME-SPECIFIC POPULATION (ALL 8 DISTINCT THEMES)
    // -------------------------------------------------------------------------

    if (theme === 'solar_system') {
      // -----------------------------------------------------------------------
      // THEME 1: SOLAR SYSTEM & PLANETARY ORBITS
      // -----------------------------------------------------------------------
      const sunPointLight = new THREE.PointLight(0xffedd5, 4.5, 600, 0.35);
      sunPointLight.position.set(-45, 26, -35);
      scene.add(sunPointLight);

      // Sun
      const sunGroup = new THREE.Group();
      sunGroup.position.copy(sunPointLight.position);
      const sunGeo = new THREE.SphereGeometry(5.2, 36, 36);
      const sunMat = new THREE.MeshBasicMaterial({ map: createSunTexture() });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      const coronaMesh = new THREE.Mesh(
        new THREE.SphereGeometry(5.9, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.32, side: THREE.BackSide })
      );
      sunGroup.add(sunMesh, coronaMesh);
      rootThemeGroup.add(sunGroup);
      dynamicObjects.push({
        mesh: sunGroup,
        update: (time) => {
          sunMesh.rotation.y = time * 0.05;
          coronaMesh.scale.setScalar(1 + Math.sin(time * 1.8) * 0.05);
        }
      });

      // Planets & Moons
      // Mercury
      const mercury = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), new THREE.MeshStandardMaterial({ map: createMercuryTexture(), roughness: 0.85 }));
      rootThemeGroup.add(mercury);
      createAutonomousWanderer(mercury, { initPos: [-52, -6, -22], speed: 0.6, rotSpeed: [0, 0.12, 0] });

      // Venus
      const venus = new THREE.Mesh(new THREE.SphereGeometry(1.35, 28, 28), new THREE.MeshStandardMaterial({ map: createVenusTexture(), roughness: 0.45 }));
      rootThemeGroup.add(venus);
      createAutonomousWanderer(venus, { initPos: [-36, 4, 10], speed: 0.5, rotSpeed: [0, -0.08, 0] });

      // Earth + Moon
      const earthGroup = new THREE.Group();
      const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.75, 32, 32), new THREE.MeshStandardMaterial({ map: createEarthTexture(), roughness: 0.65 }));
      const earthClouds = new THREE.Mesh(new THREE.SphereGeometry(1.78, 32, 32), new THREE.MeshStandardMaterial({ map: createCloudsTexture(), transparent: true, opacity: 0.5 }));
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), new THREE.MeshStandardMaterial({ map: createMoonTexture(), roughness: 0.9 }));
      earthGroup.add(earthMesh, earthClouds, moonMesh);
      rootThemeGroup.add(earthGroup);
      createAutonomousWanderer(earthGroup, {
        initPos: [42, -5, 14],
        speed: 0.4,
        rotSpeed: [0, 0.06, 0],
        customAnimate: (time) => {
          earthClouds.rotation.y = time * 0.08;
          moonMesh.position.set(Math.cos(time * 0.6) * 4.2, Math.sin(time * 0.6) * 1.2, Math.sin(time * 0.6) * 4.2);
        }
      });

      // Mars
      const mars = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 24), new THREE.MeshStandardMaterial({ map: createMarsTexture(), roughness: 0.8 }));
      rootThemeGroup.add(mars);
      createAutonomousWanderer(mars, { initPos: [56, 16, -18], speed: 0.45, rotSpeed: [0, 0.1, 0] });

      // Jupiter + Moons
      const jupiterGroup = new THREE.Group();
      const jupiterMesh = new THREE.Mesh(new THREE.SphereGeometry(3.6, 36, 36), new THREE.MeshStandardMaterial({ map: createJupiterTexture(), roughness: 0.5 }));
      jupiterGroup.add(jupiterMesh);
      for (let jm = 0; jm < 4; jm++) {
        const jMoon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        jMoon.position.set(Math.cos((jm * Math.PI) / 2) * (5.5 + jm * 1.2), (jm - 1.5) * 0.4, Math.sin((jm * Math.PI) / 2) * (5.5 + jm * 1.2));
        jupiterGroup.add(jMoon);
      }
      rootThemeGroup.add(jupiterGroup);
      createAutonomousWanderer(jupiterGroup, { initPos: [-48, 18, -48], speed: 0.3, rotSpeed: [0, 0.08, 0] });

      // Saturn + Rings
      const saturnGroup = new THREE.Group();
      const saturnMesh = new THREE.Mesh(new THREE.SphereGeometry(2.9, 32, 32), new THREE.MeshStandardMaterial({ map: createSaturnTexture(), roughness: 0.55 }));
      const ringGeo = new THREE.RingGeometry(3.6, 7.2, 64);
      const ringMat = new THREE.MeshStandardMaterial({ map: createSaturnRingsTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
      const rings = new THREE.Mesh(ringGeo, ringMat);
      rings.rotation.x = Math.PI / 2.3;
      saturnGroup.add(saturnMesh, rings);
      rootThemeGroup.add(saturnGroup);
      createAutonomousWanderer(saturnGroup, { initPos: [50, -18, -45], speed: 0.32, rotSpeed: [0, 0.04, 0] });

      // Uranus
      const uranus = new THREE.Mesh(new THREE.SphereGeometry(1.9, 28, 28), new THREE.MeshStandardMaterial({ map: createUranusTexture(), roughness: 0.4 }));
      rootThemeGroup.add(uranus);
      createAutonomousWanderer(uranus, { initPos: [-28, -22, -65], speed: 0.35, rotSpeed: [0, 0.05, 0] });

      // Neptune
      const neptune = new THREE.Mesh(new THREE.SphereGeometry(1.85, 28, 28), new THREE.MeshStandardMaterial({ map: createNeptuneTexture(), roughness: 0.4 }));
      rootThemeGroup.add(neptune);
      createAutonomousWanderer(neptune, { initPos: [34, 25, -75], speed: 0.3, rotSpeed: [0, 0.05, 0] });

      // Space Stations, Telescopes, Probes & Comets
      const iss = createRealistic3DSpaceStation();
      rootThemeGroup.add(iss);
      createAutonomousWanderer(iss, { initPos: [28, 8, 22], speed: 0.5, rotSpeed: [0.05, 0.08, 0.02] });

      const jwst = createRealistic3DJWST();
      rootThemeGroup.add(jwst);
      createAutonomousWanderer(jwst, { initPos: [-24, 14, 18], speed: 0.4, rotSpeed: [0.02, 0.06, 0.04] });

      const hubble = createRealistic3DHubble();
      rootThemeGroup.add(hubble);
      createAutonomousWanderer(hubble, { initPos: [15, -12, 12], speed: 0.5, rotSpeed: [0.04, 0.08, 0] });

      const voyager = createRealistic3DDeepSpaceProbe();
      rootThemeGroup.add(voyager);
      createAutonomousWanderer(voyager, { initPos: [-40, -14, -30], speed: 0.6, rotSpeed: [0.06, 0.04, 0.02] });

      for (let sat = 0; sat < 3; sat++) {
        const satellite = createRealistic3DSatellite();
        satellite.scale.setScalar(1.2);
        rootThemeGroup.add(satellite);
        createAutonomousWanderer(satellite, {
          initPos: [18 + sat * 12, -8 + sat * 6, 8 + sat * 4],
          speed: 0.5,
          rotSpeed: [0.03, 0.08, 0.02]
        });
      }

      for (let c = 0; c < 3; c++) {
        const comet = createRealistic3DComet();
        rootThemeGroup.add(comet);
        createAutonomousWanderer(comet, {
          initPos: [c * 30 - 30, 20 + c * 8, -50 + c * 20],
          linearVelocity: [0.08, -0.04, 0.05],
          speed: 0.8
        });
      }

    } else if (theme === 'science_chalkboard') {
      // -----------------------------------------------------------------------
      // THEME 2: SCIENCE LAB & LIVING SCHOLARS
      // -----------------------------------------------------------------------
      // Living Science Scholars (Professors in Lab Coats with spectacles & chalks)
      for (let s = 0; s < 6; s++) {
        const scholar = createRealistic3DScholar();
        const sc = 1.1 + Math.random() * 0.4;
        scholar.scale.set(sc, sc, sc);
        rootThemeGroup.add(scholar);
        createAutonomousWanderer(scholar, {
          initPos: [(s - 2.5) * 24, (s % 2 === 0 ? 1 : -1) * 12, -10 + s * 6],
          speed: 0.35,
          rotSpeed: [0, 0.15, 0],
          driftRadius: [14, 8, 12],
          frequencies: [0.04, 0.05, 0.03]
        });
      }

      // Bubbling Chemical Flasks (Erlenmeyer & Beakers)
      const flaskColors = [0x06b6d4, 0x10b981, 0xa855f7, 0xf59e0b, 0xef4444, 0x3b82f6];
      for (let f = 0; f < 10; f++) {
        const flask = createRealistic3DChemistryFlask(flaskColors[f % flaskColors.length]);
        const fScale = 1.3 + Math.random() * 0.7;
        flask.scale.set(fScale, fScale, fScale);
        rootThemeGroup.add(flask);
        createAutonomousWanderer(flask, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 50, -30 + Math.random() * 50],
          speed: 0.4,
          rotSpeed: [0.1, 0.15, 0.05],
          driftRadius: [10, 6, 8]
        });
      }

      // Pencil Rockets
      for (let p = 0; p < 8; p++) {
        const pencil = createRealistic3DPencilRocket();
        const pScale = 1.2 + Math.random() * 0.6;
        pencil.scale.set(pScale, pScale, pScale);
        rootThemeGroup.add(pencil);
        createAutonomousWanderer(pencil, {
          initPos: [(Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60, -25 + Math.random() * 45],
          speed: 0.55,
          rotSpeed: [0.08, 0.12, 0.2],
          linearVelocity: [0.04, 0.03, -0.02]
        });
      }

      // Rutherford 3D Atoms
      for (let a = 0; a < 8; a++) {
        const atom = createRealistic3DAtom();
        const aScale = 1.4 + Math.random() * 0.8;
        atom.scale.set(aScale, aScale, aScale);
        rootThemeGroup.add(atom);
        createAutonomousWanderer(atom, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 55, -20 + Math.random() * 40],
          speed: 0.45,
          rotSpeed: [0.25, 0.35, 0.15]
        });
      }

      // DNA Double Helix Strands
      for (let d = 0; d < 6; d++) {
        const dna = createRealistic3DDnaHelix();
        const dScale = 1.3 + Math.random() * 0.5;
        dna.scale.set(dScale, dScale, dScale);
        rootThemeGroup.add(dna);
        createAutonomousWanderer(dna, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, -15 + Math.random() * 35],
          speed: 0.38,
          rotSpeed: [0.1, 0.2, 0.05]
        });
      }

      // Floating 3D Scientific Equations & Math Formulas
      const formulas = [
        'E = mc²', 'F = ma', '∇ × B = μ₀J', 'λ = h / p',
        '∫ f(x)dx', '∑ aₙ xⁿ', 'iℏ ∂ψ/∂t = Ĥψ', 'PV = nRT',
        'Δx · Δp ≥ ℏ/2', 'e^(iπ) + 1 = 0', 'c² = a² + b²', 'G = 6.674×10⁻¹¹'
      ];
      formulas.forEach((form, idx) => {
        const sprite = createFormulaSprite(form, idx % 2 === 0 ? '#38bdf8' : '#34d399');
        rootThemeGroup.add(sprite);
        createAutonomousWanderer(sprite, {
          initPos: [(idx % 4 - 1.5) * 28, (Math.floor(idx / 4) - 1) * 20, -10 + (idx % 3) * 12],
          speed: 0.3,
          rotSpeed: [0, 0, 0],
          driftRadius: [12, 6, 8]
        });
      });

    } else if (theme === 'cosmic_nebula') {
      // -----------------------------------------------------------------------
      // THEME 3: COSMIC NEBULA & LIVING ASTRONAUTS
      // -----------------------------------------------------------------------
      // Volumetric Glowing Nebula Clouds
      const nebulaTex1 = createNebulaSpriteTexture('rgba(236, 72, 153, 0.35)', 'rgba(168, 85, 247, 0.18)');
      const nebulaTex2 = createNebulaSpriteTexture('rgba(56, 189, 248, 0.30)', 'rgba(59, 130, 246, 0.15)');
      const nebulaTex3 = createNebulaSpriteTexture('rgba(245, 158, 11, 0.25)', 'rgba(217, 119, 6, 0.10)');

      const nebulaMats = [
        new THREE.SpriteMaterial({ map: nebulaTex1, transparent: true, blending: THREE.AdditiveBlending }),
        new THREE.SpriteMaterial({ map: nebulaTex2, transparent: true, blending: THREE.AdditiveBlending }),
        new THREE.SpriteMaterial({ map: nebulaTex3, transparent: true, blending: THREE.AdditiveBlending })
      ];

      for (let n = 0; n < 18; n++) {
        const sprite = new THREE.Sprite(nebulaMats[n % nebulaMats.length]);
        const dist = 90 + Math.random() * 120;
        const angle = (n / 18) * Math.PI * 2;
        sprite.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 90, Math.sin(angle) * dist - 50);
        const sc = 130 + Math.random() * 100;
        sprite.scale.set(sc, sc, 1);
        rootThemeGroup.add(sprite);
      }

      // Spacewalking Astronauts with articulated limbs & gold visors
      for (let a = 0; a < 8; a++) {
        const astronaut = createRealistic3DAstronaut();
        const sc = 1.3 + Math.random() * 0.5;
        astronaut.scale.set(sc, sc, sc);
        rootThemeGroup.add(astronaut);
        createAutonomousWanderer(astronaut, {
          initPos: [(a - 3.5) * 22, (a % 2 === 0 ? 1 : -1) * 14, -15 + a * 6],
          speed: 0.38,
          rotSpeed: [0.08, 0.12, 0.05],
          driftRadius: [14, 8, 12]
        });
      }

      // Spaceships, Interstellar Explorers & Mini Scouts
      for (let s = 0; s < 6; s++) {
        const ship = s % 2 === 0 ? createRealistic3DSpaceship() : createRealistic3DMiniScout();
        const sc = 1.4 + Math.random() * 0.5;
        ship.scale.set(sc, sc, sc);
        rootThemeGroup.add(ship);
        createAutonomousWanderer(ship, {
          initPos: [(Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60, -30 + Math.random() * 50],
          speed: 0.55,
          rotSpeed: [0.06, 0.1, 0.15],
          linearVelocity: [0.04, -0.02, 0.03]
        });
      }

      // Interstellar Freighters & Space Capsules
      for (let f = 0; f < 4; f++) {
        const craft = f % 2 === 0 ? createRealistic3DFreighter() : createRealistic3DSpaceCapsule();
        craft.scale.setScalar(1.4);
        rootThemeGroup.add(craft);
        createAutonomousWanderer(craft, {
          initPos: [(f - 1.5) * 35, (f % 2 === 0 ? -1 : 1) * 18, -35 + f * 10],
          speed: 0.42,
          rotSpeed: [0.04, 0.06, 0.03]
        });
      }

    } else if (theme === 'earth_forest') {
      // -----------------------------------------------------------------------
      // THEME 4: EARTH NATURE & LIVING WILDLIFE
      // -----------------------------------------------------------------------
      // Soaring Flying Birds / Eagles (Articulated Wing Flapping)
      const birdColors = [0x3b82f6, 0x1d4ed8, 0x0284c7, 0x0369a1, 0x0f766e];
      for (let b = 0; b < 10; b++) {
        const bird = createRealistic3DFlyingBird(birdColors[b % birdColors.length]);
        const sc = 1.4 + Math.random() * 0.6;
        bird.scale.set(sc, sc, sc);
        rootThemeGroup.add(bird);

        createAutonomousWanderer(bird, {
          initPos: [(Math.random() - 0.5) * 120, 10 + Math.random() * 25, -25 + Math.random() * 45],
          speed: 0.65,
          rotSpeed: [0.02, 0.08, 0.04],
          linearVelocity: [0.05, 0.01, -0.03],
          customAnimate: (time) => {
            const flap = Math.sin(time * 6 + b) * 0.45;
            if (bird.userData.leftWing) bird.userData.leftWing.rotation.z = flap;
            if (bird.userData.rightWing) bird.userData.rightWing.rotation.z = -flap;
          }
        });
      }

      // Fluttering Monarch & Blue Morpho Butterflies
      const butterflyColors = [0xf97316, 0x38bdf8, 0x10b981, 0xfacc15, 0xa855f7, 0xf43f5e];
      for (let bf = 0; bf < 14; bf++) {
        const butterfly = createRealistic3DButterfly(butterflyColors[bf % butterflyColors.length]);
        const sc = 1.2 + Math.random() * 0.5;
        butterfly.scale.set(sc, sc, sc);
        rootThemeGroup.add(butterfly);

        createAutonomousWanderer(butterfly, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.5,
          rotSpeed: [0.1, 0.2, 0.1],
          driftRadius: [15, 10, 12],
          frequencies: [0.1, 0.12, 0.08],
          customAnimate: (time) => {
            const wingFlap = Math.sin(time * 12 + bf) * 0.75;
            if (butterfly.userData.leftWing) butterfly.userData.leftWing.rotation.y = wingFlap;
            if (butterfly.userData.rightWing) butterfly.userData.rightWing.rotation.y = -wingFlap;
          }
        });
      }

      // Swimming Koi Fish with Undulating Caudal Tails
      for (let k = 0; k < 8; k++) {
        const koi = createRealistic3DKoiFish(k % 2 === 0);
        const sc = 1.3 + Math.random() * 0.5;
        koi.scale.set(sc, sc, sc);
        rootThemeGroup.add(koi);

        createAutonomousWanderer(koi, {
          initPos: [(k - 3.5) * 20, -12 + (k % 2) * 6, -15 + k * 5],
          speed: 0.45,
          rotSpeed: [0.02, 0.08, 0.02],
          driftRadius: [12, 6, 10],
          customAnimate: (time) => {
            const tailWag = Math.sin(time * 4 + k) * 0.5;
            if (koi.userData.tail) koi.userData.tail.rotation.y = tailWag;
          }
        });
      }

      // Floating Autumn Maple Leaves
      const leafColors = [0xd97706, 0xef4444, 0xf59e0b, 0xb45309];
      for (let l = 0; l < 16; l++) {
        const leaf = createRealistic3DAutumnLeaf(leafColors[l % leafColors.length]);
        const sc = 1.2 + Math.random() * 0.6;
        leaf.scale.set(sc, sc, sc);
        rootThemeGroup.add(leaf);
        createAutonomousWanderer(leaf, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 55, -25 + Math.random() * 45],
          speed: 0.35,
          rotSpeed: [0.2, 0.25, 0.15],
          driftRadius: [10, 8, 10]
        });
      }

      // Floating Dandelion Seeds
      for (let d = 0; d < 12; d++) {
        const seed = createRealistic3DDandelionSeed();
        const sc = 1.4 + Math.random() * 0.6;
        seed.scale.set(sc, sc, sc);
        rootThemeGroup.add(seed);
        createAutonomousWanderer(seed, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, -20 + Math.random() * 40],
          speed: 0.3,
          rotSpeed: [0.08, 0.15, 0.05],
          driftRadius: [12, 10, 8]
        });
      }

      // Bioluminescent Fireflies
      for (let ff = 0; ff < 10; ff++) {
        const firefly = createRealistic3DFirefly();
        rootThemeGroup.add(firefly);
        createAutonomousWanderer(firefly, {
          initPos: [(Math.random() - 0.5) * 90, (Math.random() - 0.5) * 45, -15 + Math.random() * 30],
          speed: 0.45,
          driftRadius: [8, 6, 6]
        });
      }

    } else if (theme === 'deep_ocean') {
      // -----------------------------------------------------------------------
      // THEME 5: DEEP OCEAN & LIVING MARINE LIFE
      // -----------------------------------------------------------------------
      // Swimming Scuba Divers with Kicking Flippers
      for (let d = 0; d < 6; d++) {
        const diver = createRealistic3DScubaDiver();
        const sc = 1.4 + Math.random() * 0.4;
        diver.scale.set(sc, sc, sc);
        rootThemeGroup.add(diver);

        createAutonomousWanderer(diver, {
          initPos: [(d - 2.5) * 24, (d % 2 === 0 ? 1 : -1) * 12, -15 + d * 6],
          speed: 0.4,
          rotSpeed: [0.03, 0.06, 0.02],
          linearVelocity: [0.03, 0.01, -0.02],
          customAnimate: (time) => {
            const kick = Math.sin(time * 5 + d) * 0.4;
            if (diver.userData.leftLeg) diver.userData.leftLeg.rotation.x = Math.PI / 2 + kick;
            if (diver.userData.rightLeg) diver.userData.rightLeg.rotation.x = Math.PI / 2 - kick;
          }
        });
      }

      // Playful Dolphins with Undulating Flukes
      for (let dp = 0; dp < 6; dp++) {
        const dolphin = createRealistic3DDolphin();
        const sc = 1.5 + Math.random() * 0.5;
        dolphin.scale.set(sc, sc, sc);
        rootThemeGroup.add(dolphin);

        createAutonomousWanderer(dolphin, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.6,
          rotSpeed: [0.04, 0.1, 0.03],
          linearVelocity: [0.05, 0.02, 0.01],
          customAnimate: (time) => {
            const wave = Math.sin(time * 4 + dp) * 0.4;
            if (dolphin.userData.tail) dolphin.userData.tail.rotation.x = wave;
          }
        });
      }

      // Majestic Sea Turtles with Paddling Flippers
      for (let st = 0; st < 6; st++) {
        const turtle = createRealistic3DSeaTurtle();
        const sc = 1.5 + Math.random() * 0.5;
        turtle.scale.set(sc, sc, sc);
        rootThemeGroup.add(turtle);

        createAutonomousWanderer(turtle, {
          initPos: [(st - 2.5) * 22, -8 + (st % 2) * 14, -15 + st * 6],
          speed: 0.35,
          rotSpeed: [0.02, 0.05, 0.02],
          customAnimate: (time) => {
            const paddle = Math.sin(time * 3 + st) * 0.45;
            if (turtle.userData.leftFlipper) turtle.userData.leftFlipper.rotation.z = paddle;
            if (turtle.userData.rightFlipper) turtle.userData.rightFlipper.rotation.z = -paddle;
          }
        });
      }

      // Majestic Manta Rays
      for (let mr = 0; mr < 5; mr++) {
        const manta = createRealistic3DMantaRay();
        const sc = 1.6 + Math.random() * 0.6;
        manta.scale.set(sc, sc, sc);
        rootThemeGroup.add(manta);

        createAutonomousWanderer(manta, {
          initPos: [(mr - 2) * 28, 6 - mr * 3, -25 + mr * 8],
          speed: 0.4,
          rotSpeed: [0.02, 0.04, 0.02]
        });
      }

      // Translucent Bioluminescent Jellyfish
      for (let jf = 0; jf < 12; jf++) {
        const jellyfish = createRealistic3DJellyfish();
        const sc = 1.4 + Math.random() * 0.6;
        jellyfish.scale.set(sc, sc, sc);
        rootThemeGroup.add(jellyfish);

        createAutonomousWanderer(jellyfish, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 50, -20 + Math.random() * 40],
          speed: 0.3,
          rotSpeed: [0.05, 0.1, 0.04],
          driftRadius: [10, 12, 8]
        });
      }

    } else if (theme === 'cyber_matrix') {
      // -----------------------------------------------------------------------
      // THEME 6: CYBER MATRIX & LIVING CYBORGS
      // -----------------------------------------------------------------------
      // 3D Holographic Wireframe Grid Floor
      const gridHelper = new THREE.GridHelper(200, 40, 0x10b981, 0x064e3b);
      gridHelper.position.set(0, -25, 0);
      rootThemeGroup.add(gridHelper);

      // Humanoid Living Cyborgs
      for (let c = 0; c < 8; c++) {
        const cyborg = createRealistic3DCyborg();
        const sc = 1.3 + Math.random() * 0.5;
        cyborg.scale.set(sc, sc, sc);
        rootThemeGroup.add(cyborg);

        createAutonomousWanderer(cyborg, {
          initPos: [(c - 3.5) * 22, -10 + (c % 2) * 16, -15 + c * 6],
          speed: 0.45,
          rotSpeed: [0.02, 0.12, 0.02],
          driftRadius: [14, 8, 12]
        });
      }

      // Cyber Recon Drones with Active Rotating Searchlight Beams
      for (let cd = 0; cd < 8; cd++) {
        const drone = createRealistic3DCyberDrone();
        const sc = 1.4 + Math.random() * 0.5;
        drone.scale.set(sc, sc, sc);
        rootThemeGroup.add(drone);

        createAutonomousWanderer(drone, {
          initPos: [(Math.random() - 0.5) * 110, 8 + Math.random() * 20, -20 + Math.random() * 40],
          speed: 0.6,
          rotSpeed: [0.1, 0.35, 0.08],
          linearVelocity: [0.04, 0.01, -0.03]
        });
      }

      // Quantum CPU Cubes
      for (let q = 0; q < 8; q++) {
        const quantum = createRealistic3DQuantumCpuCube();
        const sc = 1.3 + Math.random() * 0.5;
        quantum.scale.set(sc, sc, sc);
        rootThemeGroup.add(quantum);

        createAutonomousWanderer(quantum, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 50, -25 + Math.random() * 45],
          speed: 0.4,
          rotSpeed: [0.2, 0.3, 0.15]
        });
      }

      // Holographic Octahedral Data Crystals
      for (let hc = 0; hc < 12; hc++) {
        const crystal = createRealistic3DHoloDataCrystal();
        const sc = 1.3 + Math.random() * 0.6;
        crystal.scale.set(sc, sc, sc);
        rootThemeGroup.add(crystal);

        createAutonomousWanderer(crystal, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.42,
          rotSpeed: [0.25, 0.25, 0.15]
        });
      }

    } else if (theme === 'retro_arcade') {
      // -----------------------------------------------------------------------
      // THEME 7: 8-BIT RETRO ARCADE UNIVERSE
      // -----------------------------------------------------------------------
      // Synthwave Neon Horizon Grid
      const retroGrid = new THREE.GridHelper(200, 30, 0xf43f5e, 0x7e22ce);
      retroGrid.position.set(0, -25, 0);
      rootThemeGroup.add(retroGrid);

      // 8-Bit Voxel Arcade Heroes (Running / Jumping)
      for (let h = 0; h < 6; h++) {
        const hero = createRealistic3D8BitHero();
        const sc = 1.4 + Math.random() * 0.5;
        hero.scale.set(sc, sc, sc);
        rootThemeGroup.add(hero);

        createAutonomousWanderer(hero, {
          initPos: [(h - 2.5) * 22, -10 + (h % 2) * 14, -15 + h * 6],
          speed: 0.5,
          rotSpeed: [0.05, 0.15, 0.05],
          driftRadius: [12, 8, 10]
        });
      }

      // 8-Bit UFO Space Invaders
      const invaderColors = [0xa855f7, 0xef4444, 0x06b6d4, 0x10b981, 0xf59e0b];
      for (let inv = 0; inv < 8; inv++) {
        const ufo = createRealistic3DUfoSpaceInvader(invaderColors[inv % invaderColors.length]);
        const sc = 1.5 + Math.random() * 0.5;
        ufo.scale.set(sc, sc, sc);
        rootThemeGroup.add(ufo);

        createAutonomousWanderer(ufo, {
          initPos: [(Math.random() - 0.5) * 110, 10 + Math.random() * 20, -20 + Math.random() * 40],
          speed: 0.55,
          rotSpeed: [0.08, 0.25, 0.05],
          linearVelocity: [0.04, -0.01, -0.02]
        });
      }

      // Spinning 8-Bit Golden Coins
      for (let c = 0; c < 12; c++) {
        const coin = createRealistic3D8BitCoin();
        const sc = 1.3 + Math.random() * 0.5;
        coin.scale.set(sc, sc, sc);
        rootThemeGroup.add(coin);

        createAutonomousWanderer(coin, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.45,
          rotSpeed: [0.1, 0.45, 0.15]
        });
      }

      // 8-Bit Power Stars
      for (let ps = 0; ps < 8; ps++) {
        const star = createRealistic3D8BitStar();
        const sc = 1.3 + Math.random() * 0.5;
        star.scale.set(sc, sc, sc);
        rootThemeGroup.add(star);

        createAutonomousWanderer(star, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, -20 + Math.random() * 40],
          speed: 0.48,
          rotSpeed: [0.2, 0.35, 0.15]
        });
      }

      // 8-Bit Pixel Hearts
      for (let ph = 0; ph < 8; ph++) {
        const heart = createRealistic3D8BitHeart();
        const sc = 1.3 + Math.random() * 0.5;
        heart.scale.set(sc, sc, sc);
        rootThemeGroup.add(heart);

        createAutonomousWanderer(heart, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.42,
          rotSpeed: [0.15, 0.25, 0.1]
        });
      }

    } else if (theme === 'celestial_zen' || theme === 'deep_obsidian') {
      // -----------------------------------------------------------------------
      // THEME 8: CELESTIAL ZEN & LEVITATING MONKS
      // -----------------------------------------------------------------------
      // Levitating Zen Monks in Lotus Pose with Golden Halos
      for (let m = 0; m < 6; m++) {
        const monk = createRealistic3DZenMonk();
        const sc = 1.4 + Math.random() * 0.4;
        monk.scale.set(sc, sc, sc);
        rootThemeGroup.add(monk);

        createAutonomousWanderer(monk, {
          initPos: [(m - 2.5) * 22, -6 + (m % 2) * 14, -15 + m * 6],
          speed: 0.3,
          rotSpeed: [0.01, 0.08, 0.01],
          driftRadius: [10, 6, 8]
        });
      }

      // Flapping Origami Cranes Gliding in Peaceful Circles
      for (let oc = 0; oc < 10; oc++) {
        const crane = createRealistic3DOrigamiCrane();
        const sc = 1.4 + Math.random() * 0.5;
        crane.scale.set(sc, sc, sc);
        rootThemeGroup.add(crane);

        createAutonomousWanderer(crane, {
          initPos: [(Math.random() - 0.5) * 110, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.48,
          rotSpeed: [0.02, 0.12, 0.04],
          customAnimate: (time) => {
            const flap = Math.sin(time * 5 + oc) * 0.45;
            if (crane.userData.leftWing) crane.userData.leftWing.rotation.z = Math.PI / 2 + flap;
            if (crane.userData.rightWing) crane.userData.rightWing.rotation.z = -Math.PI / 2 - flap;
          }
        });
      }

      // Golden Sacred Geometry Polyhedrons
      for (let sg = 0; sg < 8; sg++) {
        const geom = createRealistic3DSacredGeometry();
        const sc = 1.4 + Math.random() * 0.6;
        geom.scale.set(sc, sc, sc);
        rootThemeGroup.add(geom);

        createAutonomousWanderer(geom, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, -25 + Math.random() * 45],
          speed: 0.35,
          rotSpeed: [0.15, 0.25, 0.1]
        });
      }

      // Faceted Obsidian Crystals
      for (let ob = 0; ob < 10; ob++) {
        const prism = createRealistic3DObsidianCrystal();
        const sc = 1.5 + Math.random() * 0.6;
        prism.scale.set(sc, sc, sc);
        rootThemeGroup.add(prism);

        createAutonomousWanderer(prism, {
          initPos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 45, -20 + Math.random() * 40],
          speed: 0.38,
          rotSpeed: [0.2, 0.2, 0.15]
        });
      }
    }

    // -------------------------------------------------------------------------
    // 6. DYNAMIC CAMERA CONTROLS (PARALLAX & POINTER RESILIENT)
    // -------------------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 10;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouseX = (clientX / window.innerWidth - 0.5) * 2;
      mouseY = (clientY / window.innerHeight - 0.5) * 2;

      targetCameraX = mouseX * 22;
      targetCameraY = 10 - mouseY * 14;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);

    // -------------------------------------------------------------------------
    // 8. WINDOW RESIZE LISTENER & RESIZEOBSERVER
    // -------------------------------------------------------------------------
    let resizeTimeout: any = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 60);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Visibility change handling for power efficiency and performance scalability
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // -------------------------------------------------------------------------
    // 9. REAL-TIME 60FPS ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation (Damped Spring Inertia)
      camera.position.x += (targetCameraX - camera.position.x) * 0.04;
      camera.position.y += (targetCameraY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Starfield / particle slow celestial rotation
      backgroundParticles.rotation.y = elapsedTime * 0.012;
      backgroundParticles.rotation.x = Math.sin(elapsedTime * 0.006) * 0.04;

      // Update all 3D Dynamic Objects (Autonomous Wanderers)
      for (let i = 0; i < dynamicObjects.length; i++) {
        dynamicObjects[i].update(elapsedTime, delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------------------
    // 8. CLEANUP & MEMORY MANAGEMENT
    // -------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme, interactive]);

  return (
    <div
      ref={mountRef}
      id="realtime-moving-universe-3d-canvas"
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full overflow-hidden select-none"
    />
  );
};

export default RealtimeMovingUniverse;
