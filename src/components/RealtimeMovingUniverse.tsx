import React, { useEffect, useRef } from 'react';
import { WallpaperAmbiance } from '../types';

interface RealtimeMovingUniverseProps {
  theme: WallpaperAmbiance;
  interactive?: boolean;
}

// -----------------------------------------------------------------------------
// High-Performance Zero-Allocation Types & Structures
// -----------------------------------------------------------------------------
interface CelestialObject {
  id: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  opacity: number;
  color: string;
  secondaryColor?: string;
  accentColor?: string;
  pulsePhase: number;
  pulseSpeed: number;
  // Orbital Mechanics (Fixed center, radius X/Y, angle, orbitSpeed)
  isOrbital?: boolean;
  orbitCenterX?: number;
  orbitCenterY?: number;
  orbitRadiusX?: number;
  orbitRadiusY?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
  orbitTilt?: number;
  parentObjId?: number; // for nested orbits (e.g. Moon orbiting Earth)
  // Living Animation States
  animState?: 'idle' | 'walking' | 'floating' | 'waving' | 'jumping' | 'flying' | 'swimming';
  walkCycle?: number;
  jumpVelocity?: number;
  wavePhase?: number;
  actionTimer?: number;
  // Dynamic life-cycle for stars & supernovae
  starAge?: number;
  starMaxAge?: number;
  spikes?: number;
  // Custom metadata (formula text, character, etc.)
  customData?: any;
}

interface SupernovaExplosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  secondaryColor: string;
}

interface TouchRipple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

export const RealtimeMovingUniverse: React.FC<RealtimeMovingUniverseProps> = ({
  theme = 'science_chalkboard',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
      initObjects();
    };

    window.addEventListener('resize', handleResize);

    const objects: CelestialObject[] = [];
    const supernovas: SupernovaExplosion[] = [];
    const ripples: TouchRipple[] = [];

    // Helper: Trigger Supernova Star Explosion
    const triggerSupernova = (x: number, y: number, c1 = '#f43f5e', c2 = '#38bdf8') => {
      if (supernovas.length < 3) {
        supernovas.push({
          x,
          y,
          radius: 2,
          maxRadius: 85 + Math.random() * 45,
          alpha: 1,
          color: c1,
          secondaryColor: c2
        });
      }
    };

    // =========================================================================
    // INITIALIZE THEMATIC ECOSYSTEMS (8 DISTINCT DETAILED WORLDS)
    // =========================================================================
    const initObjects = () => {
      objects.length = 0;
      supernovas.length = 0;
      ripples.length = 0;

      // -----------------------------------------------------------------------
      // 1. COSMIC NEBULA (Deep Space Exploration)
      // -----------------------------------------------------------------------
      if (theme === 'cosmic_nebula') {
        // Living Astronauts (Waving, Jetpack Thrusters)
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 10 + i,
            type: 'astronaut',
            x: 60 + Math.random() * (width - 120),
            y: 80 + Math.random() * (height * 0.7),
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.25,
            size: 32,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.003,
            opacity: 0.95,
            color: '#ffffff',
            secondaryColor: '#38bdf8',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.03,
            animState: i % 2 === 0 ? 'waving' : 'floating',
            actionTimer: 100 + Math.random() * 120
          });
        }

        // Rocket Shuttles
        for (let i = 0; i < 3; i++) {
          objects.push({
            id: 20 + i,
            type: 'rocket',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.5),
            vy: (Math.random() - 0.5) * 0.35,
            size: 32,
            rotation: 0,
            vRot: 0,
            opacity: 1,
            color: '#ffffff',
            secondaryColor: '#ef4444',
            accentColor: '#fbbf24',
            pulsePhase: 0,
            pulseSpeed: 0.1
          });
        }

        // Orbital Satellites with elliptical Kepler orbits
        for (let i = 0; i < 5; i++) {
          objects.push({
            id: 30 + i,
            type: 'satellite',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 26,
            rotation: 0,
            vRot: 0.004,
            opacity: 0.9,
            color: '#38bdf8',
            secondaryColor: '#eab308',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.04,
            isOrbital: true,
            orbitCenterX: width * 0.5 + (i - 2) * 120,
            orbitCenterY: height * 0.45 + (i - 2) * 60,
            orbitRadiusX: 180 + i * 70,
            orbitRadiusY: 90 + i * 35,
            orbitAngle: (i * Math.PI * 2) / 5,
            orbitSpeed: 0.004 + i * 0.001,
            orbitTilt: 0.25
          });
        }

        // Saturn & Ring Planets
        for (let i = 0; i < 2; i++) {
          objects.push({
            id: 40 + i,
            type: 'planet',
            x: width * (0.25 + i * 0.5),
            y: 120 + i * 200,
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.03,
            size: 36 + i * 14,
            rotation: 0.3,
            vRot: 0.001,
            opacity: 0.85,
            color: i === 0 ? '#c084fc' : '#38bdf8',
            secondaryColor: '#f43f5e',
            pulsePhase: 0,
            pulseSpeed: 0.01,
            customData: { hasRings: true }
          });
        }

        // 110+ Realistic 4-Point Diffraction Stars
        for (let i = 0; i < 110; i++) {
          const isLarge = i < 24;
          objects.push({
            id: 100 + i,
            type: 'realistic_star',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.06,
            vy: (Math.random() - 0.5) * 0.06,
            size: isLarge ? 3.0 : 1.4,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.008,
            opacity: 0.35 + Math.random() * 0.65,
            color: i % 5 === 0 ? '#67e8f9' : i % 3 === 0 ? '#fef08a' : i % 4 === 0 ? '#c084fc' : '#ffffff',
            secondaryColor: '#38bdf8',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.03,
            starAge: Math.floor(Math.random() * 600),
            starMaxAge: 800 + Math.floor(Math.random() * 800),
            spikes: isLarge ? 4 : 0
          });
        }
      }

      // -----------------------------------------------------------------------
      // 2. SOLAR SYSTEM (Planetary Orbits & Astronomy)
      // -----------------------------------------------------------------------
      else if (theme === 'solar_system') {
        const sunX = width * 0.5;
        const sunY = height * 0.45;

        // Central Blazing Sun
        objects.push({
          id: 1,
          type: 'sun',
          x: sunX,
          y: sunY,
          vx: 0,
          vy: 0,
          size: 46,
          rotation: 0,
          vRot: 0.005,
          opacity: 1,
          color: '#fbbf24',
          secondaryColor: '#f97316',
          pulsePhase: 0,
          pulseSpeed: 0.03
        });

        // Planets Orbiting Sun
        const planetsData = [
          { name: 'Mercury', color: '#94a3b8', size: 10, rx: 110, ry: 60, speed: 0.015, tilt: 0.15 },
          { name: 'Venus', color: '#fde047', size: 16, rx: 170, ry: 90, speed: 0.011, tilt: 0.18 },
          { name: 'Earth', color: '#38bdf8', size: 18, rx: 240, ry: 130, speed: 0.008, tilt: 0.22, hasMoon: true },
          { name: 'Mars', color: '#ef4444', size: 14, rx: 310, ry: 170, speed: 0.006, tilt: 0.25 },
          { name: 'Jupiter', color: '#f59e0b', size: 30, rx: 390, ry: 210, speed: 0.004, tilt: 0.28 },
          { name: 'Saturn', color: '#eab308', size: 26, rx: 470, ry: 250, speed: 0.003, tilt: 0.32, hasRings: true }
        ];

        planetsData.forEach((p, idx) => {
          objects.push({
            id: 200 + idx,
            type: 'solar_planet',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: p.size,
            rotation: 0,
            vRot: 0.01,
            opacity: 0.95,
            color: p.color,
            pulsePhase: 0,
            pulseSpeed: 0.02,
            isOrbital: true,
            orbitCenterX: sunX,
            orbitCenterY: sunY,
            orbitRadiusX: p.rx,
            orbitRadiusY: p.ry,
            orbitAngle: (idx * Math.PI * 2) / 6,
            orbitSpeed: p.speed,
            orbitTilt: p.tilt,
            customData: { name: p.name, hasRings: p.hasRings, hasMoon: p.hasMoon }
          });
        });

        // Orbiting Satellites & Space Telescopes
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 250 + i,
            type: 'satellite',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 20,
            rotation: 0,
            vRot: 0.01,
            opacity: 0.9,
            color: '#67e8f9',
            secondaryColor: '#f59e0b',
            pulsePhase: 0,
            pulseSpeed: 0.05,
            isOrbital: true,
            orbitCenterX: sunX,
            orbitCenterY: sunY,
            orbitRadiusX: 140 + i * 90,
            orbitRadiusY: 80 + i * 50,
            orbitAngle: i * 1.5,
            orbitSpeed: 0.009 + i * 0.002,
            orbitTilt: -0.2
          });
        }

        // 110+ Celestial background stars
        for (let i = 0; i < 110; i++) {
          objects.push({
            id: 300 + i,
            type: 'realistic_star',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.04,
            vy: (Math.random() - 0.5) * 0.04,
            size: 1.5 + Math.random() * 1.5,
            rotation: 0,
            vRot: 0,
            opacity: 0.3 + Math.random() * 0.6,
            color: i % 4 === 0 ? '#fde047' : i % 3 === 0 ? '#38bdf8' : '#ffffff',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.03
          });
        }
      }

      // -----------------------------------------------------------------------
      // 3. EARTH NATURE & LIVING WILDLIFE (Forest Flora & Fauna)
      // -----------------------------------------------------------------------
      else if (theme === 'earth_forest') {
        // Soaring Birds
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 10 + i,
            type: 'bird',
            x: Math.random() * width,
            y: 60 + Math.random() * (height * 0.5),
            vx: (0.8 + Math.random() * 0.6) * (i % 2 === 0 ? 1 : -1),
            vy: (Math.random() - 0.5) * 0.25,
            size: 24 + Math.random() * 6,
            rotation: 0,
            vRot: 0,
            opacity: 0.9,
            color: '#38bdf8',
            secondaryColor: '#f8fafc',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.12, // Wing flapping frequency
            animState: 'flying'
          });
        }

        // Swimming Colorful Koi Fish
        for (let i = 0; i < 5; i++) {
          objects.push({
            id: 20 + i,
            type: 'koi_fish',
            x: Math.random() * width,
            y: height * 0.5 + Math.random() * (height * 0.45),
            vx: (Math.random() > 0.5 ? 0.7 : -0.7),
            vy: (Math.random() - 0.5) * 0.2,
            size: 32 + Math.random() * 8,
            rotation: 0,
            vRot: 0,
            opacity: 0.9,
            color: i % 2 === 0 ? '#f97316' : '#ffffff',
            secondaryColor: '#ef4444',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.08,
            animState: 'swimming'
          });
        }

        // Fluttering Butterflies
        for (let i = 0; i < 8; i++) {
          objects.push({
            id: 30 + i,
            type: 'butterfly',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.4,
            size: 20 + Math.random() * 6,
            rotation: (Math.random() - 0.5) * 0.3,
            vRot: (Math.random() - 0.5) * 0.02,
            opacity: 0.9,
            color: i % 3 === 0 ? '#a855f7' : i % 2 === 0 ? '#fbbf24' : '#38bdf8',
            secondaryColor: '#f43f5e',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.15
          });
        }

        // 110+ Drifting Autumn Leaves, Dandelion Seeds & Glowing Fireflies
        for (let i = 0; i < 110; i++) {
          const isFirefly = i < 30;
          const isLeaf = i >= 30 && i < 70;
          objects.push({
            id: 100 + i,
            type: isFirefly ? 'firefly' : isLeaf ? 'leaf' : 'dandelion',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: isFirefly ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 0.4 + 0.2,
            vy: isFirefly ? (Math.random() - 0.5) * 0.3 : 0.4 + Math.random() * 0.5,
            size: isFirefly ? 3 : isLeaf ? (10 + Math.random() * 6) : (5 + Math.random() * 3),
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.02,
            opacity: 0.4 + Math.random() * 0.6,
            color: isFirefly ? '#84cc16' : isLeaf ? (i % 2 === 0 ? '#f97316' : '#eab308') : '#f8fafc',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.04
          });
        }
      }

      // -----------------------------------------------------------------------
      // 4. DEEP OCEAN & LIVING MARINE LIFE (Aquatic Biosphere)
      // -----------------------------------------------------------------------
      else if (theme === 'deep_ocean') {
        // Swimming Scuba Divers
        for (let i = 0; i < 3; i++) {
          objects.push({
            id: 10 + i,
            type: 'scuba_diver',
            x: 80 + Math.random() * (width - 160),
            y: 100 + Math.random() * (height * 0.6),
            vx: (i % 2 === 0 ? 0.5 : -0.5),
            vy: (Math.random() - 0.5) * 0.2,
            size: 34,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: '#0284c7',
            secondaryColor: '#eab308',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.06,
            animState: 'swimming'
          });
        }

        // Playful Dolphins & Sea Turtles
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 20 + i,
            type: i % 2 === 0 ? 'dolphin' : 'sea_turtle',
            x: Math.random() * width,
            y: 80 + Math.random() * (height * 0.7),
            vx: (0.7 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1),
            vy: (Math.random() - 0.5) * 0.2,
            size: 38 + Math.random() * 8,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: i % 2 === 0 ? '#38bdf8' : '#10b981',
            secondaryColor: '#0f172a',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.05,
            animState: 'swimming'
          });
        }

        // Bioluminescent Jellyfish
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 30 + i,
            type: 'jellyfish',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: -0.35 - Math.random() * 0.25,
            size: 32 + Math.random() * 12,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.003,
            opacity: 0.85,
            color: i % 2 === 0 ? '#c084fc' : '#38bdf8',
            secondaryColor: '#f472b6',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.04
          });
        }

        // 110+ Oceanic Bubbles & Bioluminescent Plankton
        for (let i = 0; i < 110; i++) {
          objects.push({
            id: 100 + i,
            type: 'ocean_bubble',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.4 - Math.random() * 0.5,
            size: 2 + Math.random() * 5,
            rotation: 0,
            vRot: 0,
            opacity: 0.25 + Math.random() * 0.65,
            color: i % 3 === 0 ? '#67e8f9' : i % 2 === 0 ? '#a7f3d0' : '#ffffff',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.04
          });
        }
      }

      // -----------------------------------------------------------------------
      // 5. CYBER MATRIX (Neon High-Tech Grid)
      // -----------------------------------------------------------------------
      else if (theme === 'cyber_matrix') {
        // Living Cyborgs
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 10 + i,
            type: 'cyborg',
            x: 80 + (i * (width / 4)),
            y: height - 130 - (i * 80),
            vx: (Math.random() > 0.5 ? 0.6 : -0.6),
            vy: 0,
            size: 34,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: '#06b6d4',
            secondaryColor: '#10b981',
            pulsePhase: 0,
            pulseSpeed: 0.05,
            animState: 'walking',
            actionTimer: 100 + Math.random() * 120
          });
        }

        // Surveillance Scanning Drones
        for (let i = 0; i < 5; i++) {
          objects.push({
            id: 20 + i,
            type: 'cyber_drone',
            x: Math.random() * width,
            y: 80 + Math.random() * (height * 0.6),
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.3,
            size: 26,
            rotation: 0,
            vRot: 0,
            opacity: 0.9,
            color: '#22d3ee',
            secondaryColor: '#f43f5e',
            pulsePhase: Math.random() * Math.PI,
            pulseSpeed: 0.06
          });
        }

        // 3D Quantum CPU Data Cubes
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 30 + i,
            type: 'cyber_cube',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: 26 + Math.random() * 8,
            rotation: Math.random() * Math.PI,
            vRot: 0.015,
            opacity: 0.85,
            color: '#34d399',
            secondaryColor: '#06b6d4',
            pulsePhase: 0,
            pulseSpeed: 0.04
          });
        }

        // 110+ Matrix Rain Glyphs
        const glyphs = ['0', '1', 'λ', 'Ω', 'Ψ', 'Σ', '⚡', '∆', 'AI', 'CORE', '01', '💎'];
        for (let i = 0; i < 110; i++) {
          objects.push({
            id: 100 + i,
            type: 'matrix_glyph',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0.8 + Math.random() * 1.2,
            size: 12 + Math.random() * 4,
            rotation: 0,
            vRot: 0,
            opacity: 0.3 + Math.random() * 0.7,
            color: i % 4 === 0 ? '#6ee7b7' : i % 3 === 0 ? '#38bdf8' : '#10b981',
            pulsePhase: 0,
            pulseSpeed: 0.05,
            customData: { text: glyphs[i % glyphs.length] }
          });
        }
      }

      // -----------------------------------------------------------------------
      // 6. RETRO ARCADE (8-Bit Pixel Nostalgia)
      // -----------------------------------------------------------------------
      else if (theme === 'retro_arcade') {
        // 8-Bit Pixel Heroes (Walking & Jumping)
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 10 + i,
            type: 'pixel_hero',
            x: 60 + i * (width / 4),
            y: height - 120 - i * 70,
            vx: (Math.random() > 0.5 ? 0.7 : -0.7),
            vy: 0,
            size: 32,
            rotation: 0,
            vRot: 0,
            opacity: 1,
            color: i % 2 === 0 ? '#ef4444' : '#3b82f6',
            secondaryColor: '#fde047',
            pulsePhase: 0,
            pulseSpeed: 0.1,
            animState: 'walking',
            actionTimer: 90 + Math.random() * 100
          });
        }

        // 8-Bit Space Invader UFOs
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 20 + i,
            type: 'space_invader',
            x: Math.random() * width,
            y: 80 + Math.random() * (height * 0.5),
            vx: (0.7 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1),
            vy: 0,
            size: 26,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: i % 3 === 0 ? '#22c55e' : i % 2 === 0 ? '#ec4899' : '#06b6d4',
            pulsePhase: 0,
            pulseSpeed: 0.08
          });
        }

        // Spinning 8-Bit Coins
        for (let i = 0; i < 8; i++) {
          objects.push({
            id: 30 + i,
            type: 'pixel_coin',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: 20,
            rotation: 0,
            vRot: 0.08,
            opacity: 0.9,
            color: '#fbbf24',
            secondaryColor: '#d97706',
            pulsePhase: 0,
            pulseSpeed: 0.05
          });
        }

        // 110+ 8-Bit Retro Pixels & Floating Score Badges
        const arcadePopups = ['100', '200', '1UP', '★', 'GO!', 'MAX'];
        for (let i = 0; i < 110; i++) {
          const isText = i < 20;
          objects.push({
            id: 100 + i,
            type: isText ? 'arcade_text' : 'pixel_star',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: isText ? 12 : (3 + Math.random() * 3),
            rotation: 0,
            vRot: 0,
            opacity: 0.35 + Math.random() * 0.65,
            color: i % 4 === 0 ? '#fbbf24' : i % 3 === 0 ? '#ec4899' : i % 2 === 0 ? '#22d3ee' : '#ffffff',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.05,
            customData: { text: isText ? arcadePopups[i % arcadePopups.length] : undefined }
          });
        }
      }

      // -----------------------------------------------------------------------
      // 7. SCIENCE LAB & LIVING SCHOLARS (Chalkboard Formulas)
      // -----------------------------------------------------------------------
      else if (theme === 'science_chalkboard') {
        // Living Science Professors
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 10 + i,
            type: 'scholar',
            x: 70 + (i * (width / 4)),
            y: height - 120 - (i * 80),
            vx: (Math.random() > 0.5 ? 0.45 : -0.45),
            vy: 0,
            size: 34,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: '#67e8f9',
            secondaryColor: '#fef08a',
            pulsePhase: 0,
            pulseSpeed: 0.05,
            animState: i % 2 === 0 ? 'walking' : 'waving',
            actionTimer: 100 + Math.random() * 120
          });
        }

        // Rutherford-Bohr Spinning Atoms with 3D Orbiting Electrons
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 20 + i,
            type: 'atom',
            x: Math.random() * width,
            y: 80 + Math.random() * (height * 0.7),
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            size: 28 + Math.random() * 8,
            rotation: 0,
            vRot: 0.02,
            opacity: 0.9,
            color: '#38bdf8',
            secondaryColor: '#f43f5e',
            accentColor: '#fef08a',
            pulsePhase: 0,
            pulseSpeed: 0.05
          });
        }

        // Bubbling Chemistry Flasks
        for (let i = 0; i < 5; i++) {
          objects.push({
            id: 30 + i,
            type: 'flask',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            size: 28 + Math.random() * 6,
            rotation: (Math.random() - 0.5) * 0.15,
            vRot: 0.003,
            opacity: 0.9,
            color: i % 2 === 0 ? '#34d399' : '#f472b6',
            secondaryColor: '#fef08a',
            pulsePhase: 0,
            pulseSpeed: 0.08
          });
        }

        // Pencil Rockets
        for (let i = 0; i < 4; i++) {
          objects.push({
            id: 40 + i,
            type: 'pencil_rocket',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 0.4),
            vy: (Math.random() - 0.5) * 0.35,
            size: 32,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: '#fbbf24',
            secondaryColor: '#60a5fa',
            pulsePhase: 0,
            pulseSpeed: 0.1
          });
        }

        // 110+ Scientific Formulas & Chalk Dust
        const formulas = [
          'E = mc²', 'F = ma', '∇ × B = μ₀J', '∫ f(x)dx', 'λ = h/p', 'PV = nRT',
          'iℏ ∂ψ/∂t = Hψ', 'sin²θ + cos²θ = 1', 'Δx · Δp ≥ ℏ/2', 'pH = -log[H⁺]',
          'e^(iπ) + 1 = 0', 'v = u + at', 'a² + b² = c²', 'G = 6.67×10⁻¹¹',
          'π ≈ 3.14159', 'c = 3×10⁸ m/s', 'DNA 🧬', 'H₂O', '∑ xᵢ', 'F = G(m₁m₂)/r²'
        ];

        for (let i = 0; i < 110; i++) {
          const isFormula = i < 28;
          objects.push({
            id: 100 + i,
            type: isFormula ? 'formula' : 'chalk_dust',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (isFormula ? 0.25 : 0.2),
            vy: (Math.random() - 0.5) * (isFormula ? 0.25 : 0.2),
            size: isFormula ? (12 + Math.random() * 3) : (1.5 + Math.random() * 3),
            rotation: 0,
            vRot: 0.003,
            opacity: isFormula ? (0.45 + Math.random() * 0.5) : (0.25 + Math.random() * 0.6),
            color: i % 4 === 0 ? '#67e8f9' : i % 3 === 0 ? '#fef08a' : i % 5 === 0 ? '#86efac' : '#ffffff',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.03,
            customData: { text: isFormula ? formulas[i % formulas.length] : undefined }
          });
        }
      }

      // -----------------------------------------------------------------------
      // 8. DEEP OBSIDIAN (Celestial Zen & Tranquility)
      // -----------------------------------------------------------------------
      else {
        // Levitating Zen Monks
        for (let i = 0; i < 3; i++) {
          objects.push({
            id: 10 + i,
            type: 'zen_monk',
            x: (width * 0.2) + (i * width * 0.3),
            y: (height * 0.25) + (i * 150),
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.12,
            size: 38,
            rotation: 0,
            vRot: 0,
            opacity: 0.95,
            color: '#fbbf24',
            secondaryColor: '#f59e0b',
            accentColor: '#fde68a',
            pulsePhase: i * 1.5,
            pulseSpeed: 0.025,
            animState: 'floating'
          });
        }

        // Flapping Origami Cranes
        for (let i = 0; i < 6; i++) {
          objects.push({
            id: 20 + i,
            type: 'origami_crane',
            x: Math.random() * width,
            y: 80 + Math.random() * (height * 0.7),
            vx: 0.7 + Math.random() * 0.4,
            vy: (Math.random() - 0.5) * 0.2,
            size: 28,
            rotation: 0,
            vRot: 0,
            opacity: 0.9,
            color: '#f8fafc',
            secondaryColor: '#fbbf24',
            pulsePhase: 0,
            pulseSpeed: 0.08
          });
        }

        // Bioluminescent Jellyfish
        for (let i = 0; i < 5; i++) {
          objects.push({
            id: 30 + i,
            type: 'jellyfish',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: -0.3 - Math.random() * 0.25,
            size: 32 + Math.random() * 10,
            rotation: 0,
            vRot: 0.003,
            opacity: 0.85,
            color: i % 2 === 0 ? '#c084fc' : '#38bdf8',
            secondaryColor: '#f472b6',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.035
          });
        }

        // 110+ Zen Embers & Lotus Particles
        for (let i = 0; i < 110; i++) {
          objects.push({
            id: 100 + i,
            type: 'zen_ember',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.15 - Math.random() * 0.25,
            size: 1.5 + Math.random() * 3.5,
            rotation: Math.random() * Math.PI,
            vRot: 0.015,
            opacity: 0.25 + Math.random() * 0.75,
            color: i % 4 === 0 ? '#fbbf24' : i % 3 === 0 ? '#f472b6' : i % 5 === 0 ? '#c084fc' : '#38bdf8',
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.03
          });
        }
      }
    };

    initObjects();

    // -------------------------------------------------------------------------
    // TOUCH / POINTER INTERACTION
    // -------------------------------------------------------------------------
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      mousePosRef.current = { x: clientX, y: clientY, active: true };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (ripples.length < 6) {
        ripples.push({
          x: clientX,
          y: clientY,
          r: 4,
          maxR: 90,
          alpha: 0.9,
          color: theme === 'cyber_matrix' ? '#22d3ee' : theme === 'cosmic_nebula' ? '#c084fc' : theme === 'earth_forest' ? '#4ade80' : theme === 'solar_system' ? '#f59e0b' : '#38bdf8'
        });
      }

      if (theme === 'cosmic_nebula' || theme === 'solar_system') {
        triggerSupernova(clientX, clientY);
      }

      // Responsive living characters respond on touch
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const dx = obj.x - clientX;
        const dy = obj.y - clientY;
        if (dx * dx + dy * dy < 40000 && (obj.type === 'astronaut' || obj.type === 'cyborg' || obj.type === 'scholar' || obj.type === 'pixel_hero')) {
          obj.animState = Math.random() > 0.5 ? 'waving' : 'jumping';
          obj.actionTimer = 160;
          obj.jumpVelocity = -4.8;
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);

    // =========================================================================
    // HIGH SPEED 60/120 FPS SMOOTH RENDER LOOP (Zero-Allocation Physics)
    // =========================================================================
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. RENDER TOUCH RIPPLES
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += 2.8;
        rip.alpha -= 0.024;
        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = rip.color;
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. RENDER SUPERNOVA EXPLOSIONS
      for (let s = supernovas.length - 1; s >= 0; s--) {
        const sn = supernovas[s];
        sn.radius += 2.2;
        sn.alpha -= 0.018;
        if (sn.alpha <= 0 || sn.radius >= sn.maxRadius) {
          supernovas.splice(s, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sn.x, sn.y, sn.radius, 0, Math.PI * 2);
        ctx.fillStyle = sn.color;
        ctx.globalAlpha = sn.alpha * 0.4;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sn.x, sn.y, sn.radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = sn.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. RENDER ALL 100+ CELESTIAL & LIVING OBJECTS
      const numObjs = objects.length;
      for (let i = 0; i < numObjs; i++) {
        const obj = objects[i];
        obj.pulsePhase += obj.pulseSpeed;

        // Life Cycle / Star Supernova
        if (obj.type === 'realistic_star' && obj.starAge !== undefined && obj.starMaxAge !== undefined) {
          obj.starAge++;
          if (obj.starAge > obj.starMaxAge) {
            triggerSupernova(obj.x, obj.y, obj.color, obj.secondaryColor || '#38bdf8');
            obj.starAge = 0;
            obj.x = Math.random() * width;
            obj.y = Math.random() * height;
          }
        }

        // Action timer & Jump Physics
        if (obj.actionTimer && obj.actionTimer > 0) {
          obj.actionTimer--;
          if (obj.actionTimer === 0) {
            const rand = Math.random();
            if (rand < 0.35) obj.animState = 'waving';
            else if (rand < 0.65) {
              obj.animState = 'jumping';
              obj.jumpVelocity = -4.5;
            } else {
              obj.animState = 'walking';
            }
            obj.actionTimer = 140 + Math.random() * 160;
          }
        }

        if (obj.animState === 'jumping' && obj.jumpVelocity !== undefined) {
          obj.y += obj.jumpVelocity;
          obj.jumpVelocity += 0.22;
          if (obj.jumpVelocity > 4.5) {
            obj.animState = 'walking';
            obj.jumpVelocity = 0;
          }
        }

        // Orbital Physics Movement
        if (obj.isOrbital && obj.orbitCenterX !== undefined && obj.orbitCenterY !== undefined && obj.orbitRadiusX !== undefined && obj.orbitRadiusY !== undefined) {
          obj.orbitAngle = (obj.orbitAngle || 0) + (obj.orbitSpeed || 0.005);
          const tilt = obj.orbitTilt || 0;
          const rawX = Math.cos(obj.orbitAngle) * obj.orbitRadiusX;
          const rawY = Math.sin(obj.orbitAngle) * obj.orbitRadiusY;
          // Apply tilt matrix
          obj.x = obj.orbitCenterX + (rawX * Math.cos(tilt) - rawY * Math.sin(tilt));
          obj.y = obj.orbitCenterY + (rawX * Math.sin(tilt) + rawY * Math.cos(tilt));
        } else {
          // Standard Linear Float Physics
          obj.x += obj.vx;
          obj.y += obj.vy;
          obj.rotation += obj.vRot;

          // Boundary wrapping
          if (obj.x < -60) obj.x = width + 50;
          if (obj.x > width + 60) obj.x = -50;
          if (obj.y < -60) obj.y = height + 50;
          if (obj.y > height + 60) obj.y = -50;
        }

        // Sub-pixel smooth translation
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (obj.rotation !== 0) ctx.rotate(obj.rotation);
        ctx.globalAlpha = obj.opacity;

        // ---------------------------------------------------------------------
        // VECTOR SHAPE DRAW CALLS
        // ---------------------------------------------------------------------

        // A. REALISTIC 4-POINT DIFFRACTION STARS
        if (obj.type === 'realistic_star') {
          const s = obj.size * (0.85 + Math.sin(obj.pulsePhase) * 0.3);
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();

          if (obj.spikes) {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -s * 3.5);
            ctx.lineTo(0, s * 3.5);
            ctx.moveTo(-s * 3.5, 0);
            ctx.lineTo(s * 3.5, 0);
            ctx.stroke();
          }
        }

        // B. BLAZING SUN (Solar System)
        else if (obj.type === 'sun') {
          const s = obj.size;
          ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
          ctx.beginPath();
          ctx.arc(0, 0, s * 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // C. SOLAR PLANET
        else if (obj.type === 'solar_planet') {
          const s = obj.size;
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
          ctx.fill();

          if (obj.customData?.hasRings) {
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.9, s * 0.25, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (obj.customData?.hasMoon) {
            const mAngle = tick * 0.08;
            const mx = Math.cos(mAngle) * (s * 0.9);
            const my = Math.sin(mAngle) * (s * 0.9);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // D. ASTRONAUT
        else if (obj.type === 'astronaut') {
          const s = obj.size;
          const floatOffset = Math.sin(obj.pulsePhase) * 4;
          const wave = Math.sin(tick * 0.15);

          // Suit
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-s * 0.25, -s * 0.2 + floatOffset, s * 0.5, s * 0.5);

          // Helmet & Visor
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -s * 0.35 + floatOffset, s * 0.24, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(s * 0.03, -s * 0.35 + floatOffset, s * 0.16, 0, Math.PI * 2);
          ctx.fill();

          // Left Arm
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-s * 0.2, -s * 0.1 + floatOffset);
          ctx.lineTo(-s * 0.38, s * 0.1 + floatOffset);
          ctx.stroke();

          // Right Arm (Waving)
          ctx.beginPath();
          ctx.moveTo(s * 0.2, -s * 0.1 + floatOffset);
          if (obj.animState === 'waving') {
            const hx = s * 0.4 + wave * 4;
            const hy = -s * 0.45 + wave * 3;
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.lineTo(s * 0.38, s * 0.1 + floatOffset);
            ctx.stroke();
          }

          // Legs
          ctx.beginPath();
          ctx.moveTo(-s * 0.12, s * 0.3 + floatOffset);
          ctx.lineTo(-s * 0.16, s * 0.6 + floatOffset);
          ctx.moveTo(s * 0.12, s * 0.3 + floatOffset);
          ctx.lineTo(s * 0.16, s * 0.6 + floatOffset);
          ctx.stroke();
        }

        // E. SATELLITE
        else if (obj.type === 'satellite') {
          const s = obj.size;
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-s * 0.15, -s * 0.15, s * 0.3, s * 0.3);

          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-s * 0.7, -s * 0.15, s * 0.45, s * 0.3);
          ctx.fillRect(s * 0.25, -s * 0.15, s * 0.45, s * 0.3);

          const blink = (tick + obj.id * 10) % 30 < 15;
          ctx.fillStyle = blink ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -s * 0.35, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // F. ROCKET SHUTTLE
        else if (obj.type === 'rocket') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(s * 0.5, 0);
          ctx.lineTo(-s * 0.35, -s * 0.18);
          ctx.lineTo(-s * 0.35, s * 0.18);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(s * 0.5, 0);
          ctx.lineTo(s * 0.2, -s * 0.12);
          ctx.lineTo(s * 0.2, s * 0.12);
          ctx.closePath();
          ctx.fill();

          // Exhaust flame
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-s * 0.35, -s * 0.1);
          ctx.lineTo(-s * 0.65, 0);
          ctx.lineTo(-s * 0.35, s * 0.1);
          ctx.closePath();
          ctx.fill();
        }

        // G. SOARING BIRD (Earth Nature)
        else if (obj.type === 'bird') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const wing = Math.sin(obj.pulsePhase) * (s * 0.4);

          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-s * 0.4, wing);
          ctx.quadraticCurveTo(-s * 0.1, -wing * 0.5, 0, 0);
          ctx.quadraticCurveTo(s * 0.1, -wing * 0.5, s * 0.4, wing);
          ctx.stroke();
        }

        // H. SWIMMING KOI FISH (Earth Nature)
        else if (obj.type === 'koi_fish') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const undulate = Math.sin(obj.pulsePhase) * (s * 0.15);

          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.45, s * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = obj.secondaryColor || '#ef4444';
          ctx.beginPath();
          ctx.moveTo(-s * 0.4, 0);
          ctx.lineTo(-s * 0.75, -s * 0.2 + undulate);
          ctx.lineTo(-s * 0.75, s * 0.2 + undulate);
          ctx.closePath();
          ctx.fill();
        }

        // I. FLUTTERING BUTTERFLY
        else if (obj.type === 'butterfly') {
          const s = obj.size;
          const flap = Math.abs(Math.sin(obj.pulsePhase));

          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.ellipse(-s * 0.25 * flap, 0, s * 0.3 * flap, s * 0.4, 0, 0, Math.PI * 2);
          ctx.ellipse(s * 0.25 * flap, 0, s * 0.3 * flap, s * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-1.5, -s * 0.3, 3, s * 0.6);
        }

        // J. NATURE LEAF / FIREFLY / DANDELION
        else if (obj.type === 'leaf') {
          const s = obj.size;
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.5, s * 0.25, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'firefly') {
          const glow = 0.5 + Math.sin(obj.pulsePhase) * 0.5;
          ctx.fillStyle = obj.color;
          ctx.globalAlpha = glow;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size * glow, 0, Math.PI * 2);
          ctx.fill();
        }

        // K. SCUBA DIVER (Deep Ocean)
        else if (obj.type === 'scuba_diver') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const kick = Math.sin(obj.pulsePhase) * 4;

          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-s * 0.35, -s * 0.15, s * 0.6, s * 0.3);

          // Yellow tank
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-s * 0.25, -s * 0.28, s * 0.4, s * 0.1);

          // Mask
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(s * 0.28, 0, s * 0.12, 0, Math.PI * 2);
          ctx.fill();

          // Flippers
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-s * 0.35, 0);
          ctx.lineTo(-s * 0.65, kick);
          ctx.stroke();
        }

        // L. DOLPHIN / SEA TURTLE
        else if (obj.type === 'dolphin') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const wave = Math.sin(obj.pulsePhase) * (s * 0.1);

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(s * 0.5, 0);
          ctx.quadraticCurveTo(s * 0.1, -s * 0.3, -s * 0.4, 0);
          ctx.lineTo(-s * 0.6, -s * 0.15 + wave);
          ctx.lineTo(-s * 0.6, s * 0.15 + wave);
          ctx.lineTo(-s * 0.4, 0);
          ctx.quadraticCurveTo(s * 0.1, s * 0.2, s * 0.5, 0);
          ctx.fill();
        } else if (obj.type === 'sea_turtle') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const fin = Math.sin(obj.pulsePhase) * (s * 0.2);

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();

          // Flippers
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s * 0.1, -s * 0.2);
          ctx.lineTo(s * 0.3, -s * 0.4 + fin);
          ctx.moveTo(s * 0.1, s * 0.2);
          ctx.lineTo(s * 0.3, s * 0.4 - fin);
          ctx.stroke();
        }

        // M. BIOLUMINESCENT JELLYFISH
        else if (obj.type === 'jellyfish') {
          const s = obj.size;
          const pulse = Math.sin(obj.pulsePhase);
          const radY = (0.35 + pulse * 0.08) * s;

          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.ellipse(0, -s * 0.1, s * 0.45, radY, 0, Math.PI, 0);
          ctx.fill();

          ctx.strokeStyle = obj.secondaryColor || '#f472b6';
          ctx.lineWidth = 1.5;
          for (let t = -2; t <= 2; t++) {
            const tx = t * (s * 0.15);
            ctx.beginPath();
            ctx.moveTo(tx, -s * 0.1);
            ctx.lineTo(tx + Math.sin(tick * 0.1 + t) * 4, s * 0.6);
            ctx.stroke();
          }
        }

        // N. OCEAN BUBBLE
        else if (obj.type === 'ocean_bubble') {
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
          ctx.stroke();
        }

        // O. PIXEL HERO (Retro 8-Bit)
        else if (obj.type === 'pixel_hero') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const walk = Math.sin(tick * 0.2) * 4;

          ctx.fillStyle = obj.color;
          ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.4);

          ctx.fillStyle = obj.secondaryColor || '#fde047';
          ctx.fillRect(-s * 0.15, -s * 0.45, s * 0.3, s * 0.25);

          // Legs
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-s * 0.15, s * 0.2, s * 0.12, s * 0.25 + walk);
          ctx.fillRect(s * 0.03, s * 0.2, s * 0.12, s * 0.25 - walk);
        }

        // P. SPACE INVADER
        else if (obj.type === 'space_invader') {
          const s = obj.size;
          ctx.fillStyle = obj.color;
          // Classic 8-bit chunky block pattern
          ctx.fillRect(-s * 0.35, -s * 0.25, s * 0.7, s * 0.5);
          ctx.fillRect(-s * 0.45, -s * 0.1, s * 0.9, s * 0.2);
          ctx.clearRect(-s * 0.2, -s * 0.15, s * 0.1, s * 0.1);
          ctx.clearRect(s * 0.1, -s * 0.15, s * 0.1, s * 0.1);
        }

        // Q. PIXEL COIN
        else if (obj.type === 'pixel_coin') {
          const s = obj.size;
          const spin = Math.abs(Math.cos(tick * 0.1));
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.45 * spin, s * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // R. CYBORG (Cyber Matrix)
        else if (obj.type === 'cyborg') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const walk = Math.sin(tick * 0.15) * 5;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-s * 0.2, -s * 0.25, s * 0.4, s * 0.45);

          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-s * 0.15, -s * 0.5, s * 0.3, s * 0.12);

          // Arms & Legs
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-s * 0.18, -s * 0.15);
          ctx.lineTo(-s * 0.35, walk);
          ctx.moveTo(s * 0.18, -s * 0.15);
          if (obj.animState === 'waving') {
            ctx.lineTo(s * 0.35, -s * 0.55 + Math.sin(tick * 0.2) * 5);
          } else {
            ctx.lineTo(s * 0.35, -walk);
          }
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-s * 0.1, s * 0.2);
          ctx.lineTo(-s * 0.15, s * 0.5 + walk);
          ctx.moveTo(s * 0.1, s * 0.2);
          ctx.lineTo(s * 0.15, s * 0.5 - walk);
          ctx.stroke();
        }

        // S. CYBER DRONE
        else if (obj.type === 'cyber_drone') {
          const s = obj.size;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.3);

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-s * 0.4, -s * 0.15);
          ctx.lineTo(-s * 0.4, -s * 0.3);
          ctx.moveTo(s * 0.4, -s * 0.15);
          ctx.lineTo(s * 0.4, -s * 0.3);
          ctx.stroke();
        }

        // T. 3D CYBER CUBE
        else if (obj.type === 'cyber_cube') {
          const s = obj.size;
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
          ctx.strokeRect(-s * 0.2, -s * 0.2, s * 0.7, s * 0.7);
        }

        // U. SCIENCE PROFESSOR
        else if (obj.type === 'scholar') {
          const s = obj.size;
          if (obj.vx < 0) ctx.scale(-1, 1);
          const walk = Math.sin(tick * 0.14) * 4;

          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-s * 0.2, -s * 0.25, s * 0.4, s * 0.45);

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, -s * 0.45, s * 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(s * 0.15, -s * 0.15);
          if (obj.animState === 'waving') {
            ctx.lineTo(s * 0.35, -s * 0.55 + Math.sin(tick * 0.2) * 5);
          } else {
            ctx.lineTo(s * 0.35, walk);
          }
          ctx.stroke();
        }

        // V. RUTHERFORD ATOM
        else if (obj.type === 'atom') {
          const s = obj.size;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1.2;
          for (let r = 0; r < 3; r++) {
            ctx.save();
            ctx.rotate((r * Math.PI) / 3);
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.7, s * 0.22, 0, 0, Math.PI * 2);
            ctx.stroke();

            const eAngle = tick * 0.06 + r * 2;
            const ex = Math.cos(eAngle) * (s * 0.7);
            const ey = Math.sin(eAngle) * (s * 0.22);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // W. FORMULAS / TEXT GLYPHS
        else if ((obj.type === 'formula' || obj.type === 'matrix_glyph' || obj.type === 'arcade_text') && obj.customData?.text) {
          ctx.font = `bold ${obj.size}px monospace`;
          ctx.fillStyle = obj.color;
          ctx.fillText(obj.customData.text, 0, 0);
        }

        // X. ZEN MONK
        else if (obj.type === 'zen_monk') {
          const s = obj.size;
          const breath = Math.sin(obj.pulsePhase) * 4;

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, -s * 0.4 + breath, s * 0.32, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(-s * 0.3, s * 0.25 + breath);
          ctx.lineTo(s * 0.3, s * 0.25 + breath);
          ctx.lineTo(0, -s * 0.2 + breath);
          ctx.closePath();
          ctx.fill();
        }

        // Y. ORIGAMI CRANE
        else if (obj.type === 'origami_crane') {
          const s = obj.size;
          const flap = Math.sin(obj.pulsePhase) * (s * 0.25);
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.moveTo(-s * 0.3, flap);
          ctx.lineTo(0, -s * 0.15);
          ctx.lineTo(s * 0.3, flap);
          ctx.lineTo(0, s * 0.25);
          ctx.closePath();
          ctx.fill();
        }

        // DEFAULT: SOFT GLOW PARTICLE
        else {
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [theme, interactive]);

  return (
    <canvas
      ref={canvasRef}
      id="realtime-moving-universe-canvas"
      className="fixed inset-0 pointer-events-auto z-[1] w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};

export default RealtimeMovingUniverse;
