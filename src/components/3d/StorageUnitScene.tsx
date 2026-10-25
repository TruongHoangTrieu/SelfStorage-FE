'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnitDimensions } from './unitDimensions';

interface StorageUnitSceneProps {
  dimensions: UnitDimensions;
  isDoorOpen: boolean;
  onToggleDoor: () => void;
  isLightOn: boolean;
  showItems: boolean;
  showRulers: boolean;
  cameraPreset?: 'front' | 'iso' | 'top' | 'interior' | null;
  onPresetHandled?: () => void;
}

export default function StorageUnitScene({
  dimensions,
  isDoorOpen,
  onToggleDoor,
  isLightOn,
  showItems,
  showRulers,
  cameraPreset,
  onPresetHandled,
}: StorageUnitSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const doorGroupRef = useRef<THREE.Group | null>(null);
  const doorPivotRef = useRef<THREE.Group | null>(null);
  const interiorLightRef = useRef<THREE.PointLight | null>(null);
  const ceilingLampRef = useRef<THREE.Mesh | null>(null);
  const itemsGroupRef = useRef<THREE.Group | null>(null);
  const rulersGroupRef = useRef<THREE.Group | null>(null);

  // Animation values
  const currentDoorProgress = useRef<number>(0); // 0 = closed, 1 = open

  // Helper to create ribbed metal texture for self-storage walls
  const createCorrugatedTexture = (horizontal = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f1f5f9'; // slate-100 base
    ctx.fillRect(0, 0, 128, 128);

    const step = 16;
    for (let i = 0; i < 128; i += step) {
      if (horizontal) {
        const grad = ctx.createLinearGradient(0, i, 0, i + step);
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(0.5, '#cbd5e1');
        grad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, i, 128, step);
      } else {
        const grad = ctx.createLinearGradient(i, 0, i + step, 0);
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.4, '#e2e8f0');
        grad.addColorStop(0.8, '#cbd5e1');
        grad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = grad;
        ctx.fillRect(i, 0, step, 128);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  // Helper to create cardboard box texture
  const createCardboardTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 0, 128, 128);

    // Tape across middle
    ctx.fillStyle = '#b08968';
    ctx.fillRect(48, 0, 32, 128);

    // Fragile / Up arrows icon
    ctx.fillStyle = '#7f4f24';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('↑↑', 12, 40);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('STORAGE', 10, 80);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Build the 3D unit scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0b1120'); // Dark high-tech navy backdrop

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Position camera based on unit size
    const maxDim = Math.max(dimensions.width, dimensions.depth, dimensions.height);
    const camDist = maxDim * 2.5;
    camera.position.set(camDist * 0.9, camDist * 0.7, camDist * 1.3);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't allow flipping under floor
    controls.minDistance = maxDim * 0.8;
    controls.maxDistance = maxDim * 6;
    controls.target.set(0, dimensions.height / 2, 0);

    // 5. Environmental Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 1.4);
    sunLight.position.set(maxDim * 2, maxDim * 3, maxDim * 2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = maxDim * 8;
    const d = maxDim * 2;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#60a5fa', 0.6);
    fillLight.position.set(-maxDim * 2, maxDim, -maxDim * 2);
    scene.add(fillLight);

    // 6. External Platform Floor (Ground beneath locker)
    const groundSize = maxDim * 4;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle grid helper on ground
    const grid = new THREE.GridHelper(groundSize, 24, '#38bdf8', '#1e293b');
    grid.position.y = 0.001;
    scene.add(grid);

    // 7. BUILD STORAGE UNIT BOX
    const { width: W, depth: D, height: H, doorType } = dimensions;
    const wallThick = 0.06;

    // Textures
    const wallTexV = createCorrugatedTexture(false);
    wallTexV.repeat.set(Math.max(1, Math.round(D * 2)), Math.max(1, Math.round(H * 2)));

    const wallTexH = createCorrugatedTexture(false);
    wallTexH.repeat.set(Math.max(1, Math.round(W * 2)), Math.max(1, Math.round(H * 2)));

    const wallMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.45,
      metalness: 0.35,
      map: wallTexV,
      bumpMap: wallTexV,
      bumpScale: 0.04,
      side: THREE.DoubleSide,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: '#ea580c', // SelfStorage energetic orange trim
      roughness: 0.35,
      metalness: 0.5,
    });

    const innerFloorMat = new THREE.MeshStandardMaterial({
      color: '#334155', // Polished concrete epoxy floor
      roughness: 0.25,
      metalness: 0.15,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // --- UNIT FLOOR ---
    const unitFloorGeo = new THREE.BoxGeometry(W, wallThick, D);
    const unitFloor = new THREE.Mesh(unitFloorGeo, innerFloorMat);
    unitFloor.position.set(0, wallThick / 2, 0);
    unitFloor.receiveShadow = true;
    scene.add(unitFloor);

    // Floor yellow perimeter hazard lines
    const hazardGeo = new THREE.BoxGeometry(W + 0.04, 0.01, D + 0.04);
    const hazardMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.6 });
    const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
    hazardMesh.position.set(0, 0.01, 0);
    scene.add(hazardMesh);

    // --- BACK WALL (Z = -D/2) ---
    const backWallGeo = new THREE.BoxGeometry(W, H, wallThick);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, H / 2, -D / 2);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);

    // --- LEFT WALL (X = -W/2) ---
    const leftWallGeo = new THREE.BoxGeometry(wallThick, H, D);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    scene.add(leftWall);

    // --- RIGHT WALL (X = W/2) ---
    const rightWallGeo = new THREE.BoxGeometry(wallThick, H, D);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    scene.add(rightWall);

    // --- CEILING (Y = H) ---
    const ceilingGeo = new THREE.BoxGeometry(W, wallThick, D);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, H + wallThick / 2, 0);
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;
    scene.add(ceiling);

    // --- STEEL FRAME COLUMNS & BEAMS (Orange Trim) ---
    const colSize = 0.08;
    const colGeo = new THREE.BoxGeometry(colSize, H + wallThick, colSize);
    const beamXGeo = new THREE.BoxGeometry(W + colSize, colSize, colSize);
    const beamZGeo = new THREE.BoxGeometry(colSize, colSize, D + colSize);

    // 4 Corner vertical columns
    const corners = [
      [-W / 2, -D / 2],
      [W / 2, -D / 2],
      [-W / 2, D / 2],
      [W / 2, D / 2],
    ];
    corners.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo, frameMat);
      col.position.set(cx, (H + wallThick) / 2, cz);
      col.castShadow = true;
      scene.add(col);
    });

    // Top front beam
    const topFrontBeam = new THREE.Mesh(beamXGeo, frameMat);
    topFrontBeam.position.set(0, H + wallThick / 2, D / 2);
    topFrontBeam.castShadow = true;
    scene.add(topFrontBeam);

    // Top back beam
    const topBackBeam = new THREE.Mesh(beamXGeo, frameMat);
    topBackBeam.position.set(0, H + wallThick / 2, -D / 2);
    scene.add(topBackBeam);

    // Top side beams
    const topSideL = new THREE.Mesh(beamZGeo, frameMat);
    topSideL.position.set(-W / 2, H + wallThick / 2, 0);
    scene.add(topSideL);
    const topSideR = new THREE.Mesh(beamZGeo, frameMat);
    topSideR.position.set(W / 2, H + wallThick / 2, 0);
    scene.add(topSideR);

    // --- CEILING RECESSED LED FIXTURE & LIGHT ---
    const lampGeo = new THREE.BoxGeometry(W * 0.4, 0.03, D * 0.2);
    const lampMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#f8fafc',
      emissiveIntensity: 1.0,
      roughness: 0.1,
    });
    const ceilingLamp = new THREE.Mesh(lampGeo, lampMat);
    ceilingLamp.position.set(0, H - 0.02, 0);
    scene.add(ceilingLamp);
    ceilingLampRef.current = ceilingLamp;

    // Interior Downlight
    const interiorLight = new THREE.PointLight('#f8fafc', 2.0, Math.max(4, maxDim * 2.5), 1.2);
    interiorLight.position.set(0, H - 0.1, 0);
    interiorLight.castShadow = true;
    scene.add(interiorLight);
    interiorLightRef.current = interiorLight;

    // --- INTERACTIVE DOOR ---
    // If doorType === 'HINGED' (Mini locker): swing door with handle & PIN pad
    // If doorType === 'ROLLUP': roller shutter door that scrolls UP
    const doorGroup = new THREE.Group();
    doorGroupRef.current = doorGroup;
    scene.add(doorGroup);

    const doorW = W - 0.08;
    const doorH = H - 0.08;

    if (doorType === 'HINGED') {
      // Swing door
      const doorPivot = new THREE.Group();
      doorPivot.position.set(-doorW / 2, 0, D / 2);
      doorPivotRef.current = doorPivot;
      doorGroup.add(doorPivot);

      const panelGeo = new THREE.BoxGeometry(doorW, doorH, 0.03);
      const panelMat = new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.35,
        metalness: 0.4,
      });
      const doorPanel = new THREE.Mesh(panelGeo, panelMat);
      doorPanel.position.set(doorW / 2, doorH / 2, 0);
      doorPanel.castShadow = true;
      doorPivot.add(doorPanel);

      // Handle & digital keypad on the swing door
      const keypadGeo = new THREE.BoxGeometry(0.1, 0.22, 0.03);
      const keypadMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 });
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(doorW - 0.15, doorH / 2, 0.03);
      doorPivot.add(keypad);

      // Status LED indicator on keypad (Green when open, Red when locked)
      const ledGeo = new THREE.SphereGeometry(0.012, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: isDoorOpen ? '#10b981' : '#ef4444' });
      const statusLed = new THREE.Mesh(ledGeo, ledMat);
      statusLed.position.set(doorW - 0.15, doorH / 2 + 0.08, 0.05);
      doorPivot.add(statusLed);

      // Chrome lever handle
      const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
      const handleMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.9, roughness: 0.2 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(doorW - 0.12, doorH / 2 - 0.05, 0.04);
      doorPivot.add(handle);
    } else {
      // Roll-up shutter door (Cửa cuốn nan nhôm)
      // Overhead canister box (hộp cuốn cửa)
      const canisterGeo = new THREE.CylinderGeometry(0.12, 0.12, W, 24);
      const canisterMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.6, roughness: 0.3 });
      const canister = new THREE.Mesh(canisterGeo, canisterMat);
      canister.rotation.z = Math.PI / 2;
      canister.position.set(0, H - 0.08, D / 2);
      doorGroup.add(canister);

      // Rollup slats panel
      const shutterTex = createCorrugatedTexture(true);
      shutterTex.repeat.set(1, Math.max(1, Math.round(H * 6)));
      const shutterMat = new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        roughness: 0.35,
        metalness: 0.45,
        map: shutterTex,
        bumpMap: shutterTex,
        bumpScale: 0.05,
      });

      const shutterGeo = new THREE.BoxGeometry(doorW, doorH, 0.02);
      const shutterMesh = new THREE.Mesh(shutterGeo, shutterMat);
      shutterMesh.position.set(0, doorH / 2, D / 2);
      shutterMesh.castShadow = true;
      doorGroup.add(shutterMesh);
      doorPivotRef.current = shutterMesh as any;

      // Smart keypad mounted on right column
      const keypadGeo = new THREE.BoxGeometry(0.08, 0.18, 0.04);
      const keypadMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.8 });
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(W / 2 + 0.04, 1.3, D / 2);
      doorGroup.add(keypad);

      // LED light on lock
      const ledGeo = new THREE.SphereGeometry(0.012, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: isDoorOpen ? '#10b981' : '#ef4444' });
      const statusLed = new THREE.Mesh(ledGeo, ledMat);
      statusLed.position.set(W / 2 + 0.04, 1.36, D / 2 + 0.03);
      doorGroup.add(statusLed);
    }

    // --- INTERIOR ITEMS (Xếp đồ bên trong kho) ---
    const itemsGroup = new THREE.Group();
    itemsGroupRef.current = itemsGroup;
    scene.add(itemsGroup);

    buildInteriorItems(itemsGroup, dimensions, createCardboardTexture);

    // --- 3D RULERS (Thước đo kích thước thực tế) ---
    const rulersGroup = new THREE.Group();
    rulersGroupRef.current = rulersGroup;
    scene.add(rulersGroup);

    buildDimensionRulers(rulersGroup, dimensions);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth door animation
      const targetProgress = isDoorOpen ? 1 : 0;
      currentDoorProgress.current += (targetProgress - currentDoorProgress.current) * 0.12;

      if (doorPivotRef.current) {
        if (doorType === 'HINGED') {
          // Swing open around Y axis
          doorPivotRef.current.rotation.y = -currentDoorProgress.current * (Math.PI * 0.62); // ~112 deg
        } else {
          // Roller door scroll UP
          const openH = doorH * 0.95;
          doorPivotRef.current.position.y = doorH / 2 + currentDoorProgress.current * openH;
          doorPivotRef.current.scale.y = Math.max(0.05, 1 - currentDoorProgress.current * 0.9);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (mount) {
        mount.innerHTML = '';
      }
    };
  }, [dimensions]);

  // Handle Light toggle
  useEffect(() => {
    if (interiorLightRef.current) {
      interiorLightRef.current.intensity = isLightOn ? 2.2 : 0.05;
    }
    if (ceilingLampRef.current) {
      const mat = ceilingLampRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = isLightOn ? 1.2 : 0.05;
      }
    }
  }, [isLightOn]);

  // Handle Items toggle
  useEffect(() => {
    if (itemsGroupRef.current) {
      itemsGroupRef.current.visible = showItems;
    }
  }, [showItems]);

  // Handle Rulers toggle
  useEffect(() => {
    if (rulersGroupRef.current) {
      rulersGroupRef.current.visible = showRulers;
    }
  }, [showRulers]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current) return;
    const { width: W, depth: D, height: H } = dimensions;
    const maxDim = Math.max(W, D, H);

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (cameraPreset === 'front') {
      camera.position.set(0, H * 0.5, D * 2.2);
      controls.target.set(0, H * 0.5, 0);
    } else if (cameraPreset === 'iso') {
      camera.position.set(maxDim * 1.8, maxDim * 1.6, maxDim * 2.2);
      controls.target.set(0, H * 0.45, 0);
    } else if (cameraPreset === 'top') {
      camera.position.set(0, maxDim * 3.2, 0.01);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'interior') {
      camera.position.set(0, H * 0.5, D * 0.2);
      controls.target.set(0, H * 0.5, -D * 0.4);
    }

    controls.update();
    if (onPresetHandled) onPresetHandled();
  }, [cameraPreset, dimensions, onPresetHandled]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none outline-none"
    />
  );
}

// --------------------------------------------------------------------------
// HELPER: Build realistic items inside the unit based on category
// --------------------------------------------------------------------------
function buildInteriorItems(
  group: THREE.Group,
  dimensions: UnitDimensions,
  createCardboardTexture: () => THREE.Texture
) {
  const { width: W, depth: D, height: H, category } = dimensions;
  const cardTex = createCardboardTexture();
  const boxMat = new THREE.MeshStandardMaterial({
    map: cardTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Helper to add a cardboard box
  const addBox = (bw: number, bh: number, bd: number, x: number, y: number, z: number, ry = 0) => {
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const box = new THREE.Mesh(geo, boxMat);
    box.position.set(x, y + bh / 2, z);
    box.rotation.y = ry;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  };

  // Helper for metal shelf
  const addShelf = (sw: number, sh: number, sd: number, x: number, z: number) => {
    const shelfGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
    // Posts
    const postGeo = new THREE.BoxGeometry(0.03, sh, 0.03);
    const corners = [
      [-sw / 2, -sd / 2],
      [sw / 2, -sd / 2],
      [-sw / 2, sd / 2],
      [sw / 2, sd / 2],
    ];
    corners.forEach(([cx, cz]) => {
      const p = new THREE.Mesh(postGeo, metalMat);
      p.position.set(cx, sh / 2, cz);
      shelfGroup.add(p);
    });
    // 3 Tiers
    const tierGeo = new THREE.BoxGeometry(sw, 0.02, sd);
    [0.1, sh * 0.5, sh * 0.95].forEach((ty) => {
      const tier = new THREE.Mesh(tierGeo, metalMat);
      tier.position.set(0, ty, 0);
      shelfGroup.add(tier);
    });
    shelfGroup.position.set(x, 0, z);
    group.add(shelfGroup);
  };

  // MINI LOCKER ITEMS
  if (category === 'MINI_LOCKER') {
    // 2 luggage bags
    const luggageGeo = new THREE.BoxGeometry(0.35, 0.55, 0.25);
    const luggageMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4, metalness: 0.2 });
    const luggage = new THREE.Mesh(luggageGeo, luggageMat);
    luggage.position.set(-W * 0.2, 0.55 / 2, -D * 0.15);
    luggage.castShadow = true;
    group.add(luggage);

    // 2 Stacked boxes
    addBox(0.4, 0.3, 0.4, W * 0.2, 0, -D * 0.15);
    addBox(0.35, 0.25, 0.35, W * 0.2, 0.3, -D * 0.15, 0.1);

    // Backpack
    const packGeo = new THREE.BoxGeometry(0.25, 0.38, 0.2);
    const packMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.7 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.38 / 2, D * 0.15);
    group.add(pack);
    return;
  }

  // SMALL UNIT ITEMS
  if (category === 'SMALL_UNIT') {
    // Metal shelving on right wall
    addShelf(0.45, H * 0.75, D * 0.6, W * 0.3, -D * 0.1);

    // Stacked boxes on left wall
    addBox(0.5, 0.4, 0.5, -W * 0.25, 0, -D * 0.2);
    addBox(0.5, 0.4, 0.5, -W * 0.25, 0.4, -D * 0.2, 0.05);
    addBox(0.45, 0.35, 0.45, -W * 0.25, 0.8, -D * 0.2, -0.05);

    addBox(0.45, 0.4, 0.45, -W * 0.25, 0, D * 0.15);
    addBox(0.4, 0.35, 0.4, -W * 0.25, 0.4, D * 0.15, 0.1);

    // Standing fan / office chair
    const chairMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), chairMat);
    chairSeat.position.set(W * 0.05, 0.45, D * 0.15);
    group.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.06), chairMat);
    chairBack.position.set(W * 0.05, 0.7, D * 0.35);
    group.add(chairBack);
    return;
  }

  // MEDIUM UNIT ITEMS (6-10 CBM)
  if (category === 'MEDIUM_UNIT') {
    // Refrigerator against back wall
    const fridgeGeo = new THREE.BoxGeometry(0.65, 1.5, 0.65);
    const fridgeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7, roughness: 0.25 });
    const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
    fridge.position.set(-W * 0.25, 1.5 / 2, -D * 0.3);
    fridge.castShadow = true;
    group.add(fridge);

    // Single armchair / sofa
    const sofaMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.6 });
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.75, 0.75), sofaMat);
    sofa.position.set(W * 0.25, 0.75 / 2, -D * 0.2);
    sofa.castShadow = true;
    group.add(sofa);

    // Washing machine
    const wmGeo = new THREE.BoxGeometry(0.6, 0.85, 0.6);
    const wmMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.4, roughness: 0.3 });
    const wm = new THREE.Mesh(wmGeo, wmMat);
    wm.position.set(W * 0.25, 0.85 / 2, D * 0.2);
    group.add(wm);

    // Metal rack
    addShelf(0.4, H * 0.7, D * 0.5, -W * 0.35, D * 0.1);

    // 6-8 Cardboard boxes stacked
    addBox(0.5, 0.4, 0.5, -W * 0.05, 0, -D * 0.1);
    addBox(0.48, 0.38, 0.48, -W * 0.05, 0.4, -D * 0.1, 0.05);
    addBox(0.45, 0.35, 0.45, -W * 0.05, 0.78, -D * 0.1);
    return;
  }

  // LARGE & EXTRA LARGE ITEMS (12 - 35 CBM)
  // Large 2-seater sofa
  const sofaMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 });
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(W * 0.55, 0.75, 0.85), sofaMat);
  sofa.position.set(-W * 0.15, 0.75 / 2, -D * 0.3);
  sofa.castShadow = true;
  group.add(sofa);

  // Big refrigerator
  const fridgeGeo = new THREE.BoxGeometry(0.8, 1.75, 0.75);
  const fridgeMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.2 });
  const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
  fridge.position.set(W * 0.32, 1.75 / 2, -D * 0.28);
  fridge.castShadow = true;
  group.add(fridge);

  // Wardrobe / Cabinet
  const wardGeo = new THREE.BoxGeometry(0.85, H * 0.75, 0.55);
  const wardMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 });
  const ward = new THREE.Mesh(wardGeo, wardMat);
  ward.position.set(-W * 0.35, (H * 0.75) / 2, D * 0.1);
  group.add(ward);

  // If Extra large -> Add Motorbike
  if (category === 'EXTRA_LARGE' || category === 'WAREHOUSE_XXL') {
    const bikeGroup = new THREE.Group();
    const bikeBodyMat = new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.7, roughness: 0.3 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.22, 0.55);
    bikeGroup.add(frontWheel);

    const backWheel = new THREE.Mesh(wheelGeo, wheelMat);
    backWheel.position.set(0, 0.22, -0.55);
    bikeGroup.add(backWheel);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.9), bikeBodyMat);
    body.position.set(0, 0.5, 0);
    bikeGroup.add(body);

    bikeGroup.position.set(W * 0.25, 0, D * 0.2);
    bikeGroup.rotation.y = -Math.PI / 6;
    group.add(bikeGroup);
  }

  // Multi-tier metal rack
  addShelf(0.55, H * 0.8, D * 0.5, W * 0.35, D * 0.15);

  // Massive stacked carton towers (12+ boxes)
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      addBox(
        0.48,
        0.38,
        0.48,
        -W * 0.1 + (col - 1) * 0.5,
        row * 0.38,
        D * 0.25 + (col % 2) * 0.05,
        col * 0.08
      );
    }
  }
}

// --------------------------------------------------------------------------
// HELPER: Build 3D Dimension Rulers (Thước đo không gian)
// --------------------------------------------------------------------------
function createDimensionLabelSprite(text: string, accentColor = '#38bdf8'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;

  // Dark sleek pill badge with glowing cyan border
  ctx.fillStyle = 'rgba(11, 17, 32, 0.94)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;

  const x = 5, y = 5, w = 430, h = 90, r = 24;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle interior glow line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw crisp bold text
  ctx.font = 'bold 36px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 220, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  // Real world meter scale for the badge in 3D
  sprite.scale.set(0.85, 0.22, 1);
  return sprite;
}

function buildDimensionRulers(group: THREE.Group, dimensions: UnitDimensions) {
  const { width: W, depth: D, height: H } = dimensions;
  const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });
  const tickMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

  // 1. Width Dimension Line (Front floor, along X)
  const wOffsetZ = D / 2 + 0.22;
  const wPoints = [
    new THREE.Vector3(-W / 2, 0.03, wOffsetZ),
    new THREE.Vector3(W / 2, 0.03, wOffsetZ),
  ];
  const wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
  const wLine = new THREE.Line(wGeo, lineMat);
  group.add(wLine);

  // Ticks for width
  const tickGeoZ = new THREE.BoxGeometry(0.02, 0.02, 0.12);
  const wTick1 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick1.position.set(-W / 2, 0.03, wOffsetZ);
  group.add(wTick1);
  const wTick2 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick2.position.set(W / 2, 0.03, wOffsetZ);
  group.add(wTick2);

  // WIDTH TEXT SPRITE LABEL
  const widthLabel = createDimensionLabelSprite(`↔ Rộng: ${W}m`, '#38bdf8');
  widthLabel.position.set(0, 0.16, wOffsetZ + 0.16);
  group.add(widthLabel);

  // 2. Depth Dimension Line (Right floor, along Z)
  const dOffsetX = W / 2 + 0.22;
  const dPoints = [
    new THREE.Vector3(dOffsetX, 0.03, -D / 2),
    new THREE.Vector3(dOffsetX, 0.03, D / 2),
  ];
  const dGeo = new THREE.BufferGeometry().setFromPoints(dPoints);
  const dLine = new THREE.Line(dGeo, lineMat);
  group.add(dLine);

  const tickGeoX = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const dTick1 = new THREE.Mesh(tickGeoX, tickMat);
  dTick1.position.set(dOffsetX, 0.03, -D / 2);
  group.add(dTick1);
  const dTick2 = new THREE.Mesh(tickGeoX, tickMat);
  dTick2.position.set(dOffsetX, 0.03, D / 2);
  group.add(dTick2);

  // DEPTH TEXT SPRITE LABEL
  const depthLabel = createDimensionLabelSprite(`↗ Sâu: ${D}m`, '#f59e0b');
  depthLabel.position.set(dOffsetX + 0.28, 0.16, 0);
  group.add(depthLabel);

  // 3. Height Dimension Line (Left vertical, along Y)
  const hOffsetX = -W / 2 - 0.22;
  const hOffsetZ = D / 2 + 0.05;
  const hPoints = [
    new THREE.Vector3(hOffsetX, 0, hOffsetZ),
    new THREE.Vector3(hOffsetX, H, hOffsetZ),
  ];
  const hGeo = new THREE.BufferGeometry().setFromPoints(hPoints);
  const hLine = new THREE.Line(hGeo, lineMat);
  group.add(hLine);

  const hTickGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const hTick1 = new THREE.Mesh(hTickGeo, tickMat);
  hTick1.position.set(hOffsetX, 0, hOffsetZ);
  group.add(hTick1);
  const hTick2 = new THREE.Mesh(hTickGeo, tickMat);
  hTick2.position.set(hOffsetX, H, hOffsetZ);
  group.add(hTick2);

  // HEIGHT TEXT SPRITE LABEL
  const heightLabel = createDimensionLabelSprite(`↕ Cao: ${H}m`, '#10b981');
  heightLabel.position.set(hOffsetX - 0.32, H / 2, hOffsetZ);
  group.add(heightLabel);
}
