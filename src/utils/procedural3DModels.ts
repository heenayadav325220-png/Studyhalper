import * as THREE from 'three';

/**
 * Procedural 3D Model Builders using Three.js Geometries & PBR Materials
 * Completely standalone, instant rendering, 100% realistic.
 */

// -----------------------------------------------------------------------------
// 1. REALISTIC 3D SATELLITE (COMMUNICATION / ORBITAL SATELLITE)
// -----------------------------------------------------------------------------
export function createRealistic3DSatellite(): THREE.Group {
  const satellite = new THREE.Group();

  // Central Gold Foil / Metallic Avionics Core Body (Octagonal prism)
  const bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 8);
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.25,
    envMapIntensity: 1.2
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, goldMaterial);
  satellite.add(bodyMesh);

  // High-Tech Solar Panels (Left & Right Array)
  const panelFrameGeo = new THREE.BoxGeometry(3.6, 1.2, 0.08);
  const panelFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.4
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    emissive: 0x0f172a,
    metalness: 0.95,
    roughness: 0.15
  });

  // Left Panel
  const leftPanelGroup = new THREE.Group();
  const leftFrame = new THREE.Mesh(panelFrameGeo, panelFrameMat);
  const leftCells = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.05, 0.09), solarCellMat);
  leftPanelGroup.add(leftFrame, leftCells);
  leftPanelGroup.position.set(-2.8, 0, 0);

  // Right Panel
  const rightPanelGroup = leftPanelGroup.clone();
  rightPanelGroup.position.set(2.8, 0, 0);

  satellite.add(leftPanelGroup, rightPanelGroup);

  // Boom Arms connecting solar panels
  const boomGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.0);
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
  const leftBoom = new THREE.Mesh(boomGeo, boomMat);
  leftBoom.rotation.z = Math.PI / 2;
  leftBoom.position.set(-1.4, 0, 0);

  const rightBoom = new THREE.Mesh(boomGeo, boomMat);
  rightBoom.rotation.z = Math.PI / 2;
  rightBoom.position.set(1.4, 0, 0);

  satellite.add(leftBoom, rightBoom);

  // Parabolic High-Gain Dish Antenna
  const dishGeo = new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.8,
    roughness: 0.2,
    side: THREE.DoubleSide
  });
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.position.set(0, 1.2, 0.5);
  dishMesh.rotation.x = -Math.PI / 4;
  satellite.add(dishMesh);

  // Antenna Feed Horn
  const hornGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
  const hornMesh = new THREE.Mesh(hornGeo, boomMat);
  hornMesh.position.set(0, 1.4, 0.8);
  hornMesh.rotation.x = -Math.PI / 4;
  satellite.add(hornMesh);

  // Navigation Status Beacon LEDs (Green and Red)
  const redBeaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const redBeacon = new THREE.Mesh(redBeaconGeo, redBeaconMat);
  redBeacon.position.set(-4.5, 0.5, 0);

  const greenBeaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const greenBeaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const greenBeacon = new THREE.Mesh(greenBeaconGeo, greenBeaconMat);
  greenBeacon.position.set(4.5, 0.5, 0);

  satellite.add(redBeacon, greenBeacon);

  return satellite;
}

// -----------------------------------------------------------------------------
// 2. REALISTIC 3D ASTRONAUT (SPACECRAFT EVA)
// -----------------------------------------------------------------------------
export function createRealistic3DAstronaut(): THREE.Group {
  const astronaut = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.2,
    roughness: 0.7
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.98,
    roughness: 0.05,
    emissive: 0x78350f,
    emissiveIntensity: 0.3
  });

  // Torso / Pressurized Suit Chest
  const torsoGeo = new THREE.BoxGeometry(0.9, 1.2, 0.6);
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  astronaut.add(torso);

  // Life Support Backpack (PLSS)
  const backpackGeo = new THREE.BoxGeometry(0.8, 1.0, 0.45);
  const backpackMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4 });
  const backpack = new THREE.Mesh(backpackGeo, backpackMat);
  backpack.position.set(0, 0.05, -0.45);
  astronaut.add(backpack);

  // Helmet Sphere
  const helmetGeo = new THREE.SphereGeometry(0.48, 16, 16);
  const helmet = new THREE.Mesh(helmetGeo, suitMat);
  helmet.position.set(0, 0.95, 0);
  astronaut.add(helmet);

  // Golden Sun Visor
  const visorGeo = new THREE.SphereGeometry(0.36, 16, 16, 0, Math.PI, 0, Math.PI * 0.5);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.x = -Math.PI / 2;
  visor.position.set(0, 0.95, 0.16);
  astronaut.add(visor);

  // Left Arm (Floating in zero gravity)
  const armGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.8, 8);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.65, 0.2, 0.2);
  leftArm.rotation.z = Math.PI / 4;
  leftArm.rotation.x = Math.PI / 6;
  astronaut.add(leftArm);

  // Right Arm (Waving friendly gesture)
  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.65, 0.35, 0.2);
  rightArm.rotation.z = -Math.PI / 2.8;
  rightArm.rotation.x = Math.PI / 4;
  astronaut.add(rightArm);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.18, 0.15, 1.0, 8);
  const leftLeg = new THREE.Mesh(legGeo, suitMat);
  leftLeg.position.set(-0.3, -1.0, 0.1);
  leftLeg.rotation.x = -Math.PI / 12;
  astronaut.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, suitMat);
  rightLeg.position.set(0.3, -1.0, -0.1);
  rightLeg.rotation.x = Math.PI / 10;
  astronaut.add(rightLeg);

  return astronaut;
}

// -----------------------------------------------------------------------------
// 3. REALISTIC 3D SCI-FI SPACESHIP / ROCKET
// -----------------------------------------------------------------------------
export function createRealistic3DSpaceship(): THREE.Group {
  const ship = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.85,
    roughness: 0.25
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.6,
    roughness: 0.3
  });

  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.95,
    roughness: 0.05,
    emissive: 0x0891b2,
    emissiveIntensity: 0.4
  });

  // Aerodynamic Fuselage Nose Cone
  const coneGeo = new THREE.ConeGeometry(0.7, 2.5, 16);
  const nose = new THREE.Mesh(coneGeo, hullMat);
  nose.position.set(0, 1.6, 0);
  ship.add(nose);

  // Main Cylindrical Fuselage
  const bodyGeo = new THREE.CylinderGeometry(0.7, 0.75, 2.4, 16);
  const body = new THREE.Mesh(bodyGeo, hullMat);
  body.position.set(0, -0.4, 0);
  ship.add(body);

  // Tinted Cockpit Canopy
  const canopyGeo = new THREE.SphereGeometry(0.35, 16, 8);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.scale.set(0.7, 1.6, 0.6);
  canopy.position.set(0, 1.0, 0.5);
  canopy.rotation.x = Math.PI / 8;
  ship.add(canopy);

  // Delta Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.2, -1.2);
  wingShape.lineTo(2.2, -1.8);
  wingShape.lineTo(0, -1.4);
  wingShape.closePath();

  const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  const leftWing = new THREE.Mesh(wingGeo, accentMat);
  leftWing.position.set(0, 0, 0);
  const rightWing = leftWing.clone();
  rightWing.scale.set(-1, 1, 1);
  ship.add(leftWing, rightWing);

  // Twin Plasma Engine Thruster Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 12);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.4 });

  const leftNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  leftNozzle.position.set(-0.35, -1.8, 0);
  const rightNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  rightNozzle.position.set(0.35, -1.8, 0);
  ship.add(leftNozzle, rightNozzle);

  // Luminous Thruster Flame Cones
  const flameGeo = new THREE.ConeGeometry(0.24, 1.2, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85
  });
  const leftFlame = new THREE.Mesh(flameGeo, flameMat);
  leftFlame.position.set(-0.35, -2.5, 0);
  leftFlame.rotation.x = Math.PI;

  const rightFlame = new THREE.Mesh(flameGeo, flameMat);
  rightFlame.position.set(0.35, -2.5, 0);
  rightFlame.rotation.x = Math.PI;
  ship.add(leftFlame, rightFlame);

  return ship;
}

// -----------------------------------------------------------------------------
// 4. REALISTIC 3D BOHR ATOM MODEL (FOR SCIENCE CHALKBOARD)
// -----------------------------------------------------------------------------
export function createRealistic3DAtom(): THREE.Group {
  const atom = new THREE.Group();

  // Nucleus consisting of Protons (Red) & Neutrons (Blue)
  const nucleusGroup = new THREE.Group();
  const protonMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.4 });
  const neutronMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.4 });
  const sphereGeo = new THREE.SphereGeometry(0.22, 12, 12);

  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(sphereGeo, i % 2 === 0 ? protonMat : neutronMat);
    p.position.set(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    nucleusGroup.add(p);
  }
  atom.add(nucleusGroup);

  // Electron Orbit Rings (Torus rings rotated in 3D angles)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55
  });

  const electronMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xeab308,
    emissiveIntensity: 0.8
  });
  const electronGeo = new THREE.SphereGeometry(0.12, 8, 8);

  const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
  angles.forEach((ang) => {
    const ringGeo = new THREE.TorusGeometry(1.8, 0.025, 8, 48);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.rotation.y = ang;

    // Electron orbiting on the ring
    const electron = new THREE.Mesh(electronGeo, electronMat);
    electron.position.set(1.8, 0, 0);
    ringMesh.add(electron);

    atom.add(ringMesh);
  });

  return atom;
}

// -----------------------------------------------------------------------------
// 5. REALISTIC 3D DNA DOUBLE HELIX STRAND
// -----------------------------------------------------------------------------
export function createRealistic3DDnaHelix(): THREE.Group {
  const helix = new THREE.Group();

  const strandMat1 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.6, roughness: 0.2 });
  const strandMat2 = new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.6, roughness: 0.2 });
  const barMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.4, roughness: 0.4 });

  const sphereGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);

  const numPairs = 24;
  for (let i = 0; i < numPairs; i++) {
    const y = (i - numPairs / 2) * 0.4;
    const angle = i * 0.45;
    const x1 = Math.cos(angle) * 0.9;
    const z1 = Math.sin(angle) * 0.9;
    const x2 = -x1;
    const z2 = -z1;

    // Strand Node 1
    const node1 = new THREE.Mesh(sphereGeo, strandMat1);
    node1.position.set(x1, y, z1);
    helix.add(node1);

    // Strand Node 2
    const node2 = new THREE.Mesh(sphereGeo, strandMat2);
    node2.position.set(x2, y, z2);
    helix.add(node2);

    // Base pair rung bridge
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, y, 0);
    bar.rotation.z = Math.PI / 2;
    bar.rotation.y = -angle;
    helix.add(bar);
  }

  return helix;
}

// -----------------------------------------------------------------------------
// 6. REALISTIC 3D BIOLUMINESCENT JELLYFISH (FOR DEEP OCEAN)
// -----------------------------------------------------------------------------
export function createRealistic3DJellyfish(): THREE.Group {
  const jellyfish = new THREE.Group();

  // Translucent glowing umbrella bell
  const bellGeo = new THREE.SphereGeometry(1.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const bell = new THREE.Mesh(bellGeo, bellMat);
  jellyfish.add(bell);

  // Inner organs glowing core
  const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.8 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0.2, 0);
  jellyfish.add(core);

  // Undulating Tentacles
  const tentacleGeo = new THREE.CylinderGeometry(0.03, 0.01, 2.5, 6);
  const tentacleMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.6 });

  for (let t = 0; t < 8; t++) {
    const a = (t / 8) * Math.PI * 2;
    const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
    tentacle.position.set(Math.cos(a) * 0.8, -1.2, Math.sin(a) * 0.8);
    tentacle.rotation.z = (Math.random() - 0.5) * 0.3;
    jellyfish.add(tentacle);
  }

  return jellyfish;
}

// -----------------------------------------------------------------------------
// 7. REALISTIC 3D CYBER HOLOGRAPHIC DATA CRYSTALS & DRONES (CYBER MATRIX)
// -----------------------------------------------------------------------------
export function createRealistic3DCyberDrone(): THREE.Group {
  const drone = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // Central Octagonal Fuselage
  const hubGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8);
  const hub = new THREE.Mesh(hubGeo, frameMat);
  drone.add(hub);

  // Holographic Eye Core
  const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const eye = new THREE.Mesh(eyeGeo, neonCyanMat);
  eye.position.set(0, 0, 0.35);
  drone.add(eye);

  // 4 Quad-Rotor Arms
  const armGeo = new THREE.BoxGeometry(2.4, 0.1, 0.15);
  const arm1 = new THREE.Mesh(armGeo, frameMat);
  arm1.rotation.y = Math.PI / 4;
  const arm2 = new THREE.Mesh(armGeo, frameMat);
  arm2.rotation.y = -Math.PI / 4;
  drone.add(arm1, arm2);

  // 4 Rotor Discs with glowing neon rims
  const rotorGeo = new THREE.TorusGeometry(0.4, 0.03, 6, 24);
  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  angles.forEach((ang) => {
    const rotor = new THREE.Mesh(rotorGeo, neonGreenMat);
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(Math.cos(ang) * 1.2, 0.1, Math.sin(ang) * 1.2);
    drone.add(rotor);
  });

  return drone;
}

// -----------------------------------------------------------------------------
// 8. REALISTIC 3D SACRED GEOMETRY (CELESTIAL ZEN)
// -----------------------------------------------------------------------------
export function createRealistic3DSacredGeometry(): THREE.Group {
  const group = new THREE.Group();

  const goldWireMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0x78350f,
    emissiveIntensity: 0.25
  });

  // Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(1.6, 0);
  const icoWire = new THREE.WireframeGeometry(icoGeo);
  const icoLine = new THREE.LineSegments(icoWire, new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 }));
  group.add(icoLine);

  // Inner Dodecahedron
  const dodecaGeo = new THREE.DodecahedronGeometry(1.0, 0);
  const dodecaMesh = new THREE.Mesh(dodecaGeo, goldWireMat);
  group.add(dodecaMesh);

  return group;
}

// -----------------------------------------------------------------------------
// 9. REALISTIC 3D OBSIDIAN FACETED PRISMS (DEEP OBSIDIAN)
// -----------------------------------------------------------------------------
export function createRealistic3DObsidianCrystal(): THREE.Mesh {
  const geo = new THREE.ConeGeometry(0.8, 2.4, 6);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x020617,
    roughness: 0.05,
    metalness: 0.3,
    transmission: 0.2,
    ior: 1.8,
    reflectivity: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });
  const crystal = new THREE.Mesh(geo, mat);
  return crystal;
}

// -----------------------------------------------------------------------------
// 10. REALISTIC 3D MODULAR SPACE STATION (ISS / ORBITAL OUTPOST)
// -----------------------------------------------------------------------------
export function createRealistic3DSpaceStation(): THREE.Group {
  const station = new THREE.Group();

  const moduleMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.8,
    roughness: 0.3
  });

  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.9,
    roughness: 0.3
  });

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    emissive: 0x0c4a6e,
    metalness: 0.95,
    roughness: 0.1
  });

  // Central Pressurized Habitation Modules (Cross configuration)
  const coreModule = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.2, 12), moduleMat);
  const crossModule = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 12), moduleMat);
  crossModule.rotation.z = Math.PI / 2;
  station.add(coreModule, crossModule);

  // Cupola observation window dome
  const cupola = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 })
  );
  cupola.position.set(0, 1.6, 0);
  station.add(cupola);

  // Integrated Truss Backbone
  const mainTruss = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.15, 0.15), trussMat);
  station.add(mainTruss);

  // 4 Solar Array Wings
  const wingGeo = new THREE.BoxGeometry(2.4, 0.8, 0.04);
  const wingPositions = [
    [-2.6, 0.6, 0],
    [-2.6, -0.6, 0],
    [2.6, 0.6, 0],
    [2.6, -0.6, 0]
  ];

  wingPositions.forEach(([x, y, z]) => {
    const wing = new THREE.Mesh(wingGeo, solarMat);
    wing.position.set(x, y, z);
    station.add(wing);
  });

  // Radiator Panels
  const radGeo = new THREE.BoxGeometry(0.8, 1.2, 0.03);
  const radMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const radLeft = new THREE.Mesh(radGeo, radMat);
  radLeft.position.set(-0.8, 0, 0.6);
  const radRight = new THREE.Mesh(radGeo, radMat);
  radRight.position.set(0.8, 0, 0.6);
  station.add(radLeft, radRight);

  return station;
}

// -----------------------------------------------------------------------------
// 11. REALISTIC 3D DEEP SPACE PROBE (VOYAGER / NEW HORIZONS)
// -----------------------------------------------------------------------------
export function createRealistic3DDeepSpaceProbe(): THREE.Group {
  const probe = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

  // Main High-Gain Parabolic Reflector Dish
  const dishGeo = new THREE.SphereGeometry(1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
  const dish = new THREE.Mesh(dishGeo, metalMat);
  dish.rotation.x = Math.PI / 2;
  probe.add(dish);

  // Sub-reflector Feed tripod
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0), metalMat);
  feed.position.set(0, 0, 0.7);
  feed.rotation.x = Math.PI / 2;
  probe.add(feed);

  // 10-Sided Bus Electronics Bay
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.6, 10), goldMat);
  bus.position.set(0, 0, -0.4);
  probe.add(bus);

  // RTG (Radioisotope Thermoelectric Generator) Booms
  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 }));
  rtg.position.set(1.4, 0, -0.4);
  rtg.rotation.z = Math.PI / 2;
  probe.add(rtg);

  // Magnetometer Boom (Long thin truss)
  const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.8), metalMat);
  magBoom.position.set(-2.0, 0, -0.4);
  magBoom.rotation.z = Math.PI / 2;
  probe.add(magBoom);

  return probe;
}

// -----------------------------------------------------------------------------
// 12. REALISTIC 3D COMET WITH GLOWING DUST & ION TAILS
// -----------------------------------------------------------------------------
export function createRealistic3DComet(): THREE.Group {
  const comet = new THREE.Group();

  // Irregular icy nucleus (Distorted dodecahedron)
  const nucleusGeo = new THREE.DodecahedronGeometry(0.6, 1);
  const nucleusMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.95,
    metalness: 0.1
  });
  const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
  comet.add(nucleus);

  // Coma (Glowing gas envelope around nucleus)
  const comaGeo = new THREE.SphereGeometry(1.1, 16, 16);
  const comaMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });
  const coma = new THREE.Mesh(comaGeo, comaMat);
  comet.add(coma);

  // Long Luminous Dust Tail (Curved translucent cone)
  const tailGeo = new THREE.ConeGeometry(1.6, 7.5, 16, 1, true);
  const tailMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0, -3.8);
  tail.rotation.x = -Math.PI / 2;
  comet.add(tail);

  // Ion Streamer Tail (Narrower electric cyan tail)
  const ionGeo = new THREE.ConeGeometry(0.7, 9.0, 12, 1, true);
  const ionMat = new THREE.MeshBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const ionTail = new THREE.Mesh(ionGeo, ionMat);
  ionTail.position.set(0, 0.2, -4.5);
  ionTail.rotation.x = -Math.PI / 2;
  comet.add(ionTail);

  return comet;
}

// -----------------------------------------------------------------------------
// 13. REALISTIC 3D MINI SCOUT / FIGHTER SHUTTLE
// -----------------------------------------------------------------------------
export function createRealistic3DMiniScout(): THREE.Group {
  const scout = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.4 });
  const engineMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, blending: THREE.AdditiveBlending });

  // Sleek Arrow Hull
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 4), hullMat);
  hull.rotation.x = Math.PI / 2;
  scout.add(hull);

  // Forward Swept Wings
  const wingGeo = new THREE.BoxGeometry(2.4, 0.05, 0.8);
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, -0.4);
  scout.add(wings);

  // Twin Afterburner Glow
  const glowGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const leftGlow = new THREE.Mesh(glowGeo, engineMat);
  leftGlow.position.set(-0.35, 0, -1.1);
  const rightGlow = new THREE.Mesh(glowGeo, engineMat);
  rightGlow.position.set(0.35, 0, -1.1);
  scout.add(leftGlow, rightGlow);

  return scout;
}

// -----------------------------------------------------------------------------
// 14. REALISTIC 3D SPACE CAPSULE / COMMAND MODULE
// -----------------------------------------------------------------------------
export function createRealistic3DSpaceCapsule(): THREE.Group {
  const capsule = new THREE.Group();

  const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.7, roughness: 0.3 });
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.2, roughness: 0.8 });

  // Conical Crew Cabin
  const cabin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.1, 1.4, 16), capsuleMat);
  capsule.add(cabin);

  // Ablative Heat Shield Base
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.1, 0.2, 16), shieldMat);
  shield.position.set(0, -0.8, 0);
  capsule.add(shield);

  // Docking Mechanism Port
  const port = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
  port.position.set(0, 0.85, 0);
  capsule.add(port);

  // Viewport Windows
  const winMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), winMat);
  win.position.set(0, 0.2, 0.78);
  win.rotation.x = -Math.PI / 12;
  capsule.add(win);

  return capsule;
}

// -----------------------------------------------------------------------------
// 15. REALISTIC 3D JAMES WEBB SPACE TELESCOPE (JWST)
// -----------------------------------------------------------------------------
export function createRealistic3DJWST(): THREE.Group {
  const jwst = new THREE.Group();

  // Silver/Purple 5-Layer Kite Sunshield Base
  const shieldGeo = new THREE.BoxGeometry(5.0, 0.05, 3.2);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.9,
    roughness: 0.15
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.y = Math.PI / 4;
  jwst.add(shield);

  // Spacecraft bus below sunshield
  const busMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const bus = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), busMat);
  bus.position.set(0, -0.35, 0);
  jwst.add(bus);

  // Golden Honeycomb Hexagonal Primary Mirror Array
  const mirrorGroup = new THREE.Group();
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.08,
    emissive: 0x78350f,
    emissiveIntensity: 0.2
  });

  const hexGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 6);
  // Place 18 hexagonal segments
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 6 : 12;
    const rad = ring === 0 ? 0.65 : 1.3;
    for (let h = 0; h < count; h++) {
      const angle = (h / count) * Math.PI * 2;
      const hex = new THREE.Mesh(hexGeo, hexMat);
      hex.position.set(Math.cos(angle) * rad, Math.sin(angle) * rad, 0);
      hex.rotation.x = Math.PI / 2;
      mirrorGroup.add(hex);
    }
  }
  mirrorGroup.position.set(0, 0.9, 0);
  mirrorGroup.rotation.x = -Math.PI / 12;
  jwst.add(mirrorGroup);

  // Secondary Mirror Tripod Struts
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.04, 2.0, 3), strutMat);
  tripod.position.set(0, 1.0, 1.0);
  tripod.rotation.x = Math.PI / 2;
  jwst.add(tripod);

  return jwst;
}

// -----------------------------------------------------------------------------
// 16. REALISTIC 3D HUBBLE SPACE TELESCOPE
// -----------------------------------------------------------------------------
export function createRealistic3DHubble(): THREE.Group {
  const hubble = new THREE.Group();

  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });

  // Main Cylindrical Telescope Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 24), silverMat);
  barrel.rotation.x = Math.PI / 2;
  hubble.add(barrel);

  // Aft Shroud (Wider equipment section)
  const aft = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24), silverMat);
  aft.position.set(0, 0, -1.4);
  aft.rotation.x = Math.PI / 2;
  hubble.add(aft);

  // Forward Aperture Door (Open hood)
  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 24), darkMat);
  door.position.set(0, 0.6, 1.6);
  door.rotation.x = Math.PI / 3;
  hubble.add(door);

  // Dual Solar Panel Booms
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1 });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.05), solarMat);
  leftPanel.position.set(-2.2, 0, 0);
  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.05), solarMat);
  rightPanel.position.set(2.2, 0, 0);
  hubble.add(leftPanel, rightPanel);

  return hubble;
}

// -----------------------------------------------------------------------------
// 17. REALISTIC 3D INTERSTELLAR FREIGHTER / EXPLORER
// -----------------------------------------------------------------------------
export function createRealistic3DFreighter(): THREE.Group {
  const freighter = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const podMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.4 });
  const ionMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, blending: THREE.AdditiveBlending });

  // Long Central Spinal Truss
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 6.0), hullMat);
  freighter.add(spine);

  // Forward Bridge / Command Module
  const bridge = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 6), hullMat);
  bridge.position.set(0, 0, 3.4);
  bridge.rotation.x = Math.PI / 2;
  freighter.add(bridge);

  // 6 Spherical Container Cargo Pods
  const podGeo = new THREE.SphereGeometry(0.55, 16, 16);
  const podOffsets = [-1.5, 0, 1.5];
  podOffsets.forEach((pz) => {
    const leftPod = new THREE.Mesh(podGeo, podMat);
    leftPod.position.set(-0.8, 0, pz);
    const rightPod = new THREE.Mesh(podGeo, podMat);
    rightPod.position.set(0.8, 0, pz);
    freighter.add(leftPod, rightPod);
  });

  // Aft Ion Engine Thruster Ring
  const engineRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 12, 24), hullMat);
  engineRing.position.set(0, 0, -3.0);
  freighter.add(engineRing);

  // Glowing Plasma Exhaust Plume
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 16), ionMat);
  plume.position.set(0, 0, -4.2);
  plume.rotation.x = -Math.PI / 2;
  freighter.add(plume);

  return freighter;
}

// -----------------------------------------------------------------------------
// 18. 3D SCIENCE SCHOLAR / PROFESSOR (SCIENCE CHALKBOARD)
// -----------------------------------------------------------------------------
export function createRealistic3DScholar(): THREE.Group {
  const scholar = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });

  // Torso / Lab Coat
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 12), coatMat);
  torso.position.set(0, 0.55, 0);
  scholar.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
  head.position.set(0, 1.35, 0);
  scholar.add(head);

  // Wild Einstein/Professor Hair
  const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), hairMat);
  hair.position.set(0, 1.48, -0.05);
  scholar.add(hair);

  // Spectacles / Glasses
  const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 16), glassesMat);
  glasses.position.set(0.12, 1.38, 0.28);
  const glasses2 = glasses.clone();
  glasses2.position.set(-0.12, 1.38, 0.28);
  scholar.add(glasses, glasses2);

  // Right Arm Holding Chalk / Pointer
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.7, 8);
  const rightArm = new THREE.Mesh(armGeo, coatMat);
  rightArm.position.set(0.48, 0.8, 0.2);
  rightArm.rotation.z = -Math.PI / 3;
  rightArm.rotation.x = Math.PI / 4;
  scholar.add(rightArm);

  // Chalk Stick (White cylinder)
  const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  chalk.position.set(0.78, 1.05, 0.45);
  chalk.rotation.z = Math.PI / 4;
  scholar.add(chalk);

  // Left Arm (Hand on hip or holding book)
  const leftArm = new THREE.Mesh(armGeo, coatMat);
  leftArm.position.set(-0.48, 0.6, 0.05);
  leftArm.rotation.z = Math.PI / 4;
  scholar.add(leftArm);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.18, -0.4, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.18, -0.4, 0);
  scholar.add(leftLeg, rightLeg);

  return scholar;
}

// -----------------------------------------------------------------------------
// 19. 3D BUBBLING CHEMICAL FLASK / BEAKER (SCIENCE CHALKBOARD)
// -----------------------------------------------------------------------------
export function createRealistic3DChemistryFlask(liquidColor = 0x06b6d4): THREE.Group {
  const flask = new THREE.Group();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5,
    clearcoat: 1.0
  });

  const liquidMat = new THREE.MeshStandardMaterial({
    color: liquidColor,
    emissive: liquidColor,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.1
  });

  // Conical Erlenmeyer body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 16, 1, true), glassMat);
  body.position.set(0, 0.6, 0);
  flask.add(body);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16, 1, true), glassMat);
  neck.position.set(0, 1.4, 0);
  flask.add(neck);

  // Liquid volume inside
  const liquid = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.6, 16), liquidMat);
  liquid.position.set(0, 0.32, 0);
  flask.add(liquid);

  // Bubbles rising
  const bubbleGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  for (let b = 0; b < 4; b++) {
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubble.position.set((Math.random() - 0.5) * 0.3, 0.5 + b * 0.28, (Math.random() - 0.5) * 0.3);
    flask.add(bubble);
  }

  return flask;
}

// -----------------------------------------------------------------------------
// 20. 3D PENCIL ROCKET (SCIENCE CHALKBOARD)
// -----------------------------------------------------------------------------
export function createRealistic3DPencilRocket(): THREE.Group {
  const rocket = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }); // Yellow pencil wood
  const graphiteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
  const ferruleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
  const eraserMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 });
  const finMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.4 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, blending: THREE.AdditiveBlending });

  // Hexagonal Pencil Shaft Body
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 6), woodMat);
  rocket.add(shaft);

  // Sharpened Cone Tip (Wood + Graphite Point)
  const tipWood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
  tipWood.position.set(0, 1.3, 0);
  const tipLead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 6), graphiteMat);
  tipLead.position.set(0, 1.5, 0);
  rocket.add(tipWood, tipLead);

  // Metal Ferrule Ring & Pink Eraser at Base
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.25, 16), ferruleMat);
  ferrule.position.set(0, -1.05, 0);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16), eraserMat);
  eraser.position.set(0, -1.3, 0);
  rocket.add(ferrule, eraser);

  // 3 Rocket Stabilizer Fins
  for (let f = 0; f < 3; f++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.4), finMat);
    fin.rotation.y = (f * Math.PI * 2) / 3;
    fin.position.set(Math.sin((f * Math.PI * 2) / 3) * 0.25, -0.8, Math.cos((f * Math.PI * 2) / 3) * 0.25);
    rocket.add(fin);
  }

  // Flame exhaust
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 12), flameMat);
  flame.position.set(0, -1.75, 0);
  flame.rotation.x = Math.PI;
  rocket.add(flame);

  return rocket;
}

// -----------------------------------------------------------------------------
// 21. 3D SOARING FLYING BIRD / EAGLE (EARTH FOREST)
// -----------------------------------------------------------------------------
export function createRealistic3DFlyingBird(color = 0x3b82f6): THREE.Group {
  const bird = new THREE.Group();

  const featherMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });

  // Sleek Aerodynamic Body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 12), featherMat);
  body.rotation.x = Math.PI / 2;
  bird.add(body);

  // Head & Beak
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), featherMat);
  head.position.set(0, 0.08, 0.5);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), beakMat);
  beak.position.set(0, 0.05, 0.68);
  beak.rotation.x = Math.PI / 2;
  bird.add(head, beak);

  // Articulated Left Wing
  const leftWingGroup = new THREE.Group();
  const leftWingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.35), featherMat);
  leftWingMesh.position.set(-0.45, 0, 0);
  leftWingGroup.add(leftWingMesh);
  leftWingGroup.position.set(-0.12, 0.05, 0.1);
  bird.add(leftWingGroup);
  bird.userData.leftWing = leftWingGroup;

  // Articulated Right Wing
  const rightWingGroup = new THREE.Group();
  const rightWingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.35), featherMat);
  rightWingMesh.position.set(0.45, 0, 0);
  rightWingGroup.add(rightWingMesh);
  rightWingGroup.position.set(0.12, 0.05, 0.1);
  bird.add(rightWingGroup);
  bird.userData.rightWing = rightWingGroup;

  // Fan Tail
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.4), featherMat);
  tail.position.set(0, 0.02, -0.55);
  bird.add(tail);

  return bird;
}

// -----------------------------------------------------------------------------
// 22. 3D FLUTTERING BUTTERFLY (EARTH FOREST)
// -----------------------------------------------------------------------------
export function createRealistic3DButterfly(wingColor = 0xf97316): THREE.Group {
  const butterfly = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: wingColor,
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  // Slender Thorax & Abdomen
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  butterfly.add(body);

  // Antennae
  const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.25);
  const leftAnt = new THREE.Mesh(antGeo, bodyMat);
  leftAnt.position.set(-0.04, 0.1, 0.3);
  leftAnt.rotation.z = Math.PI / 6;
  const rightAnt = new THREE.Mesh(antGeo, bodyMat);
  rightAnt.position.set(0.04, 0.1, 0.3);
  rightAnt.rotation.z = -Math.PI / 6;
  butterfly.add(leftAnt, rightAnt);

  // Left Wings Group
  const leftWingGroup = new THREE.Group();
  const forewingGeo = new THREE.CircleGeometry(0.38, 16, 0, Math.PI);
  const leftForewing = new THREE.Mesh(forewingGeo, wingMat);
  leftForewing.rotation.z = Math.PI / 2;
  leftForewing.position.set(-0.18, 0, 0.1);
  const leftHindwing = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16, 0, Math.PI), wingMat);
  leftHindwing.rotation.z = Math.PI / 2.4;
  leftHindwing.position.set(-0.14, 0, -0.15);
  leftWingGroup.add(leftForewing, leftHindwing);
  butterfly.add(leftWingGroup);
  butterfly.userData.leftWing = leftWingGroup;

  // Right Wings Group
  const rightWingGroup = new THREE.Group();
  const rightForewing = new THREE.Mesh(forewingGeo, wingMat);
  rightForewing.rotation.z = -Math.PI / 2;
  rightForewing.position.set(0.18, 0, 0.1);
  const rightHindwing = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16, 0, Math.PI), wingMat);
  rightHindwing.rotation.z = -Math.PI / 2.4;
  rightHindwing.position.set(0.14, 0, -0.15);
  rightWingGroup.add(rightForewing, rightHindwing);
  butterfly.add(rightWingGroup);
  butterfly.userData.rightWing = rightWingGroup;

  return butterfly;
}

// -----------------------------------------------------------------------------
// 23. 3D SWIMMING KOI FISH (EARTH FOREST / NATURE)
// -----------------------------------------------------------------------------
export function createRealistic3DKoiFish(isCalico = false): THREE.Group {
  const koi = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: isCalico ? 0xf97316 : 0xffffff,
    roughness: 0.3,
    metalness: 0.15
  });

  const spotMat = new THREE.MeshStandardMaterial({
    color: isCalico ? 0x1e293b : 0xe11d48,
    roughness: 0.3
  });

  const finMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });

  // Tapered Hydrodynamic Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 1.2, 12), baseMat);
  body.rotation.x = Math.PI / 2;
  koi.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 12), baseMat);
  head.position.set(0, 0, 0.7);
  head.rotation.x = Math.PI / 2;
  koi.add(head);

  // Decorative Scales Spot
  const spot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), spotMat);
  spot.scale.set(1.1, 0.5, 1.5);
  spot.position.set(0, 0.08, 0.15);
  koi.add(spot);

  // Pectoral Flippers
  const leftPec = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.18), finMat);
  leftPec.position.set(-0.25, -0.05, 0.35);
  leftPec.rotation.z = Math.PI / 6;
  const rightPec = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.18), finMat);
  rightPec.position.set(0.25, -0.05, 0.35);
  rightPec.rotation.z = -Math.PI / 6;
  koi.add(leftPec, rightPec);

  // Articulated Caudal Tail Fin Group
  const tailGroup = new THREE.Group();
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.42, 0.35), finMat);
  tailFin.position.set(0, 0, -0.2);
  tailGroup.add(tailFin);
  tailGroup.position.set(0, 0, -0.6);
  koi.add(tailGroup);
  koi.userData.tail = tailGroup;

  return koi;
}

// -----------------------------------------------------------------------------
// 24. 3D AUTUMN MAPLE LEAF (EARTH FOREST)
// -----------------------------------------------------------------------------
export function createRealistic3DAutumnLeaf(leafColor = 0xd97706): THREE.Group {
  const leaf = new THREE.Group();

  const leafMat = new THREE.MeshStandardMaterial({
    color: leafColor,
    side: THREE.DoubleSide,
    roughness: 0.6
  });

  // Multi-lobed faceted leaf structure
  const centerLobe = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), leafMat);
  centerLobe.rotation.x = Math.PI / 2;
  const leftLobe = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), leafMat);
  leftLobe.rotation.x = Math.PI / 2;
  leftLobe.rotation.z = Math.PI / 4;
  leftLobe.position.set(-0.2, 0, -0.1);
  const rightLobe = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), leafMat);
  rightLobe.rotation.x = Math.PI / 2;
  rightLobe.rotation.z = -Math.PI / 4;
  rightLobe.position.set(0.2, 0, -0.1);

  leaf.add(centerLobe, leftLobe, rightLobe);

  // Stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), leafMat);
  stem.position.set(0, 0, -0.45);
  leaf.add(stem);

  return leaf;
}

// -----------------------------------------------------------------------------
// 25. 3D DANDELION SEED (EARTH FOREST)
// -----------------------------------------------------------------------------
export function createRealistic3DDandelionSeed(): THREE.Group {
  const seed = new THREE.Group();

  const seedMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.75 });

  // Achene (Seed grain)
  const grain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.25, 6), seedMat);
  grain.position.set(0, -0.3, 0);
  seed.add(grain);

  // Beak filament
  const filament = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4), plumeMat);
  filament.position.set(0, 0, 0);
  seed.add(filament);

  // Pappus umbrella parachute
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.2, 12, 1, true), plumeMat);
  umbrella.position.set(0, 0.25, 0);
  umbrella.rotation.x = Math.PI;
  seed.add(umbrella);

  return seed;
}

// -----------------------------------------------------------------------------
// 26. 3D BIOLUMINESCENT FIREFLY (EARTH FOREST)
// -----------------------------------------------------------------------------
export function createRealistic3DFirefly(): THREE.Group {
  const firefly = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x84cc16, blending: THREE.AdditiveBlending });

  // Small black insect body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bodyMat);
  firefly.add(body);

  // Bioluminescent Lantern Abdomen
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), glowMat);
  lantern.position.set(0, 0, -0.1);
  firefly.add(lantern);

  // Point light source
  const pLight = new THREE.PointLight(0x84cc16, 0.8, 4);
  firefly.add(pLight);

  return firefly;
}

// -----------------------------------------------------------------------------
// 27. 3D SWIMMING SCUBA DIVER (DEEP OCEAN)
// -----------------------------------------------------------------------------
export function createRealistic3DScubaDiver(): THREE.Group {
  const diver = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
  const maskMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

  // Swimmer Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.9, 10), suitMat);
  torso.rotation.x = Math.PI / 2;
  diver.add(torso);

  // Head with Diving Mask
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), suitMat);
  head.position.set(0, 0, 0.6);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), maskMat);
  mask.position.set(0, 0.05, 0.75);
  diver.add(head, mask);

  // Yellow Scuba Oxygen Tank on back
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 10), tankMat);
  tank.position.set(0, 0.22, 0.05);
  tank.rotation.x = Math.PI / 2;
  diver.add(tank);

  // Arms extended forward
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.3, -0.05, 0.45);
  leftArm.rotation.x = Math.PI / 2.3;
  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.3, -0.05, 0.45);
  rightArm.rotation.x = Math.PI / 2.3;
  diver.add(leftArm, rightArm);

  // Legs with Flippers (Articulated Kicking)
  const legGroupL = new THREE.Group();
  const legMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7), suitMat);
  legMeshL.position.set(0, 0, -0.35);
  legMeshL.rotation.x = Math.PI / 2;
  const finL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.45), finMat);
  finL.position.set(0, -0.02, -0.85);
  legGroupL.add(legMeshL, finL);
  legGroupL.position.set(-0.14, 0, -0.45);

  const legGroupR = new THREE.Group();
  const legMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7), suitMat);
  legMeshR.position.set(0, 0, -0.35);
  legMeshR.rotation.x = Math.PI / 2;
  const finR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.45), finMat);
  finR.position.set(0, -0.02, -0.85);
  legGroupR.add(legMeshR, finR);
  legGroupR.position.set(0.14, 0, -0.45);

  diver.add(legGroupL, legGroupR);
  diver.userData.leftLeg = legGroupL;
  diver.userData.rightLeg = legGroupR;

  return diver;
}

// -----------------------------------------------------------------------------
// 28. 3D PLAYFUL DOLPHIN (DEEP OCEAN)
// -----------------------------------------------------------------------------
export function createRealistic3DDolphin(): THREE.Group {
  const dolphin = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.15
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xf0f9ff,
    roughness: 0.2
  });

  // Curved Streamlined Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.12, 1.8, 16), skinMat);
  body.rotation.x = Math.PI / 2;
  dolphin.add(body);

  // Snout / Rostrum
  const rostrum = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 12), skinMat);
  rostrum.position.set(0, -0.04, 1.1);
  rostrum.rotation.x = Math.PI / 2;
  dolphin.add(rostrum);

  // Lighter Belly Strip
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 1.4), bellyMat);
  belly.position.set(0, -0.15, 0);
  dolphin.add(belly);

  // Dorsal Fin
  const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.35), skinMat);
  dorsal.position.set(0, 0.35, 0);
  dorsal.rotation.x = -Math.PI / 6;
  dolphin.add(dorsal);

  // Pectoral Flippers
  const leftPec = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.2), skinMat);
  leftPec.position.set(-0.35, -0.1, 0.4);
  leftPec.rotation.z = Math.PI / 6;
  const rightPec = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.2), skinMat);
  rightPec.position.set(0.35, -0.1, 0.4);
  rightPec.rotation.z = -Math.PI / 6;
  dolphin.add(leftPec, rightPec);

  // Tail Flukes (Articulated Undulation)
  const tailGroup = new THREE.Group();
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.28), skinMat);
  fluke.position.set(0, 0, -0.3);
  tailGroup.add(fluke);
  tailGroup.position.set(0, 0, -0.9);
  dolphin.add(tailGroup);
  dolphin.userData.tail = tailGroup;

  return dolphin;
}

// -----------------------------------------------------------------------------
// 29. 3D MAJESTIC SEA TURTLE (DEEP OCEAN)
// -----------------------------------------------------------------------------
export function createRealistic3DSeaTurtle(): THREE.Group {
  const turtle = new THREE.Group();

  const shellMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.7, metalness: 0.1 });
  const flipperMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

  // Carapace Shell (Domed Ellipsoid)
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), shellMat);
  shell.scale.set(1.0, 0.45, 1.3);
  turtle.add(shell);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), flipperMat);
  head.scale.set(0.9, 0.7, 1.2);
  head.position.set(0, 0, 0.95);
  turtle.add(head);

  // Long Front Wing-Like Flippers (Articulated paddling)
  const leftFrontGroup = new THREE.Group();
  const leftFront = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.3), flipperMat);
  leftFront.position.set(-0.45, 0, 0);
  leftFrontGroup.add(leftFront);
  leftFrontGroup.position.set(-0.45, -0.05, 0.4);

  const rightFrontGroup = new THREE.Group();
  const rightFront = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.3), flipperMat);
  rightFront.position.set(0.45, 0, 0);
  rightFrontGroup.add(rightFront);
  rightFrontGroup.position.set(0.45, -0.05, 0.4);

  turtle.add(leftFrontGroup, rightFrontGroup);
  turtle.userData.leftFlipper = leftFrontGroup;
  turtle.userData.rightFlipper = rightFrontGroup;

  // Rear Steering Flippers
  const leftRear = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.2), flipperMat);
  leftRear.position.set(-0.35, -0.05, -0.7);
  const rightRear = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.2), flipperMat);
  rightRear.position.set(0.35, -0.05, -0.7);
  turtle.add(leftRear, rightRear);

  return turtle;
}

// -----------------------------------------------------------------------------
// 30. 3D MAJESTIC MANTA RAY (DEEP OCEAN)
// -----------------------------------------------------------------------------
export function createRealistic3DMantaRay(): THREE.Group {
  const manta = new THREE.Group();

  const rayMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.3 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

  // Wide Diamond Body Disk
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 4), rayMat);
  disk.scale.set(1.4, 1.0, 0.9);
  disk.rotation.y = Math.PI / 4;
  manta.add(disk);

  // White Belly Underside
  const belly = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.04, 4), bellyMat);
  belly.scale.set(1.35, 1.0, 0.85);
  belly.position.set(0, -0.05, 0);
  belly.rotation.y = Math.PI / 4;
  manta.add(belly);

  // Cephalic Horn Fins (Head food scoops)
  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), rayMat);
  leftHorn.position.set(-0.3, 0, 1.0);
  leftHorn.rotation.x = Math.PI / 2;
  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), rayMat);
  rightHorn.position.set(0.3, 0, 1.0);
  rightHorn.rotation.x = Math.PI / 2;
  manta.add(leftHorn, rightHorn);

  // Long Whip Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.005, 2.4, 6), rayMat);
  tail.position.set(0, 0, -1.8);
  tail.rotation.x = Math.PI / 2;
  manta.add(tail);

  return manta;
}

// -----------------------------------------------------------------------------
// 31. 3D HUMANOID CYBORG (CYBER MATRIX)
// -----------------------------------------------------------------------------
export function createRealistic3DCyborg(): THREE.Group {
  const cyborg = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // Sculpted Cyber Chassis Torso
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.45), metalMat);
  cyborg.add(chest);

  // Glowing Power Core Arc Reactor
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), neonCyanMat);
  core.position.set(0, 0.15, 0.23);
  core.rotation.x = Math.PI / 2;
  cyborg.add(core);

  // Head with Cybernetic Single Glowing Optical Visor Strip
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.4), chromeMat);
  head.position.set(0, 0.85, 0);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.1), neonGreenMat);
  visor.position.set(0, 0.9, 0.18);
  cyborg.add(head, visor);

  // Arms with Neon Circuit Trackers
  const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8);
  const leftArm = new THREE.Mesh(armGeo, metalMat);
  leftArm.position.set(-0.55, 0.1, 0);
  const rightArm = new THREE.Mesh(armGeo, metalMat);
  rightArm.position.set(0.55, 0.1, 0);
  cyborg.add(leftArm, rightArm);

  // Hover Base / Legs
  const legGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.1, 8);
  const leftLeg = new THREE.Mesh(legGeo, metalMat);
  leftLeg.position.set(-0.22, -1.0, 0);
  const rightLeg = new THREE.Mesh(legGeo, metalMat);
  rightLeg.position.set(0.22, -1.0, 0);
  cyborg.add(leftLeg, rightLeg);

  // Floating Cyber Footplates
  const plateMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
  const footPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 16), plateMat);
  footPlate.position.set(0, -1.65, 0);
  cyborg.add(footPlate);

  return cyborg;
}

// -----------------------------------------------------------------------------
// 32. 3D ROTATING QUANTUM CPU CUBE (CYBER MATRIX)
// -----------------------------------------------------------------------------
export function createRealistic3DQuantumCpuCube(): THREE.Group {
  const quantum = new THREE.Group();

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9
  });

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 });
  const laserCircuitMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // Inner Levitating Silicon Processor Die
  const die = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), coreMat);
  quantum.add(die);

  // Outer Cage Cube Frame
  const cageGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const wireGeo = new THREE.WireframeGeometry(cageGeo);
  const cage = new THREE.LineSegments(wireGeo, laserCircuitMat);
  quantum.add(cage);

  // 6 Heat Sinks / Bus pins
  for (let s = 0; s < 6; s++) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), frameMat);
    const ang = (s * Math.PI) / 3;
    pin.position.set(Math.cos(ang) * 0.9, 0, Math.sin(ang) * 0.9);
    quantum.add(pin);
  }

  return quantum;
}

// -----------------------------------------------------------------------------
// 33. 3D HOLOGRAPHIC DATA CRYSTAL (CYBER MATRIX)
// -----------------------------------------------------------------------------
export function createRealistic3DHoloDataCrystal(): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.8, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.8,
    transmission: 0.5,
    clearcoat: 1.0
  });
  const crystal = new THREE.Mesh(geo, mat);
  group.add(crystal);

  // Orbiting data glyph ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.02, 6, 32),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  );
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  return group;
}

// -----------------------------------------------------------------------------
// 34. 3D 8-BIT VOXEL ARCADE HERO (RETRO ARCADE)
// -----------------------------------------------------------------------------
export function createRealistic3D8BitHero(): THREE.Group {
  const hero = new THREE.Group();

  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.4 });
  const brownMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });

  // Voxel Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
  head.position.set(0, 0.9, 0);
  // Red Cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), redMat);
  cap.position.set(0, 1.25, 0.05);
  hero.add(head, cap);

  // Voxel Torso (Red Shirt & Blue Overalls)
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.45), redMat);
  shirt.position.set(0, 0.35, 0);
  const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.45, 0.46), blueMat);
  overalls.position.set(0, 0.15, 0);
  hero.add(shirt, overalls);

  // Voxel Arms
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), redMat);
  leftArm.position.set(-0.45, 0.35, 0.1);
  leftArm.rotation.x = -Math.PI / 4;
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), redMat);
  rightArm.position.set(0.45, 0.35, -0.1);
  rightArm.rotation.x = Math.PI / 4;
  hero.add(leftArm, rightArm);

  // Voxel Legs & Boots (Jumping animation pose)
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), blueMat);
  leftLeg.position.set(-0.2, -0.3, 0.15);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), blueMat);
  rightLeg.position.set(0.2, -0.3, -0.15);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.35), brownMat);
  leftBoot.position.set(-0.2, -0.55, 0.2);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.35), brownMat);
  rightBoot.position.set(0.2, -0.55, -0.1);
  hero.add(leftLeg, rightLeg, leftBoot, rightBoot);

  return hero;
}

// -----------------------------------------------------------------------------
// 35. 3D 8-BIT UFO SPACE INVADER (RETRO ARCADE)
// -----------------------------------------------------------------------------
export function createRealistic3DUfoSpaceInvader(invaderColor = 0xa855f7): THREE.Group {
  const ufo = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: invaderColor,
    emissive: invaderColor,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.8
  });
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Flying Saucer Disk
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 0.35, 8), bodyMat);
  ufo.add(disk);

  // Glass Cockpit Dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
  dome.position.set(0, 0.18, 0);
  ufo.add(dome);

  // Glowing Eye Pixels
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.1), eyeMat);
  leftEye.position.set(-0.35, 0, 0.7);
  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.1), eyeMat);
  rightEye.position.set(0.35, 0, 0.7);
  ufo.add(leftEye, rightEye);

  // 3 Landing Tentacle Pods
  for (let t = 0; t < 3; t++) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), bodyMat);
    const ang = (t * Math.PI * 2) / 3;
    pod.position.set(Math.cos(ang) * 0.7, -0.3, Math.sin(ang) * 0.7);
    ufo.add(pod);
  }

  return ufo;
}

// -----------------------------------------------------------------------------
// 36. 3D 8-BIT SPINNING GOLD COIN (RETRO ARCADE)
// -----------------------------------------------------------------------------
export function createRealistic3D8BitCoin(): THREE.Group {
  const group = new THREE.Group();

  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.3
  });

  const innerMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });

  // Outer Golden Rim
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16), coinMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Inner Star / Pixel Motif
  const star = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.18), innerMat);
  star.rotation.z = Math.PI / 4;
  group.add(star);

  return group;
}

// -----------------------------------------------------------------------------
// 37. 3D 8-BIT POWER STAR (RETRO ARCADE)
// -----------------------------------------------------------------------------
export function createRealistic3D8BitStar(): THREE.Group {
  const group = new THREE.Group();

  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xeab308,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.7
  });

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // 5-Pointed Star Shape
  const starGeo = new THREE.OctahedronGeometry(0.9, 0);
  const starMesh = new THREE.Mesh(starGeo, starMat);
  group.add(starMesh);

  // Cute Retro Eyes
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.05), eyeMat);
  leftEye.position.set(-0.15, 0.1, 0.55);
  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.05), eyeMat);
  rightEye.position.set(0.15, 0.1, 0.55);
  group.add(leftEye, rightEye);

  return group;
}

// -----------------------------------------------------------------------------
// 38. 3D 8-BIT PIXEL HEART (RETRO ARCADE)
// -----------------------------------------------------------------------------
export function createRealistic3D8BitHeart(): THREE.Group {
  const heart = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.4,
    roughness: 0.3
  });

  // Voxel Heart blocks
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), mat);
  b1.position.set(-0.2, 0.2, 0);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), mat);
  b2.position.set(0.2, 0.2, 0);
  const b3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 4), mat);
  b3.position.set(0, -0.25, 0);
  b3.rotation.x = Math.PI;

  heart.add(b1, b2, b3);
  return heart;
}

// -----------------------------------------------------------------------------
// 39. 3D LEVITATING ZEN MONK (CELESTIAL ZEN / DEEP OBSIDIAN)
// -----------------------------------------------------------------------------
export function createRealistic3DZenMonk(): THREE.Group {
  const monk = new THREE.Group();

  const robeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }); // Saffron / Ochre monk robe
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });

  // Seated Lotus Pose Lower Body (Crossed legs cushion)
  const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.45, 12), robeMat);
  lotusBase.position.set(0, 0.22, 0);
  monk.add(lotusBase);

  // Meditating Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.48, 0.9, 12), robeMat);
  torso.position.set(0, 0.85, 0);
  monk.add(torso);

  // Serene Shaved Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), skinMat);
  head.position.set(0, 1.55, 0);
  monk.add(head);

  // Dhyana Mudra Resting Meditation Hands
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
  handL.position.set(-0.1, 0.5, 0.35);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
  handR.position.set(0.1, 0.5, 0.35);
  monk.add(handL, handR);

  // Glowing Concentric Golden Halo Disk behind head
  const haloRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 8, 32), haloMat);
  haloRing1.position.set(0, 1.55, -0.15);
  const haloRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.02, 8, 32), haloMat);
  haloRing2.position.set(0, 1.55, -0.2);
  monk.add(haloRing1, haloRing2);

  return monk;
}

// -----------------------------------------------------------------------------
// 40. 3D FLAPPING ORIGAMI CRANE (CELESTIAL ZEN)
// -----------------------------------------------------------------------------
export function createRealistic3DOrigamiCrane(paperColor = 0xffffff): THREE.Group {
  const crane = new THREE.Group();

  const paperMat = new THREE.MeshStandardMaterial({
    color: paperColor,
    roughness: 0.5,
    side: THREE.DoubleSide
  });

  // Diamond Body
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), paperMat);
  body.scale.set(0.6, 0.4, 1.2);
  crane.add(body);

  // Neck & Pointed Beak
  const neck = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 3), paperMat);
  neck.position.set(0, 0.3, 0.6);
  neck.rotation.x = Math.PI / 3;
  crane.add(neck);

  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 3), paperMat);
  tail.position.set(0, 0.2, -0.6);
  tail.rotation.x = -Math.PI / 3;
  crane.add(tail);

  // Articulated Left Origami Wing
  const leftWingGroup = new THREE.Group();
  const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 3), paperMat);
  leftWing.rotation.z = Math.PI / 2;
  leftWing.position.set(-0.55, 0, 0);
  leftWingGroup.add(leftWing);
  leftWingGroup.position.set(-0.15, 0.1, 0);

  // Articulated Right Origami Wing
  const rightWingGroup = new THREE.Group();
  const rightWing = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 3), paperMat);
  rightWing.rotation.z = -Math.PI / 2;
  rightWing.position.set(0.55, 0, 0);
  rightWingGroup.add(rightWing);
  rightWingGroup.position.set(0.15, 0.1, 0);

  crane.add(leftWingGroup, rightWingGroup);
  crane.userData.leftWing = leftWingGroup;
  crane.userData.rightWing = rightWingGroup;

  return crane;
}



