'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnitDimensions } from './unitDimensions';

interface StorageUnitSceneProps {
  dimensions: UnitDimensions;
  isDoorOpen: boolean;
  onToggleDoor?: () => void;
  isLightOn: boolean;
  showItems: boolean;
  showRulers: boolean;
  cameraPreset?: 'front' | 'iso' | 'top' | 'interior';
  resetSignal?: number;
  onUserOrbit?: () => void;
}

export default function StorageUnitScene({
  dimensions,
  isDoorOpen,
  isLightOn,
  showItems,
  showRulers,
  cameraPreset = 'iso',
  resetSignal,
  onUserOrbit,
}: StorageUnitSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const doorPivotRef = useRef<THREE.Group | null>(null);
  const interiorLightRef = useRef<THREE.PointLight | null>(null);
  const ceilingLampRef = useRef<THREE.Mesh | null>(null);
  const itemsGroupRef = useRef<THREE.Group | null>(null);
  const rulersGroupRef = useRef<THREE.Group | null>(null);

  // Door animation state ref to prevent stale closure in animation loop
  const isDoorOpenRef = useRef<boolean>(isDoorOpen);
  useEffect(() => {
    isDoorOpenRef.current = isDoorOpen;
  }, [isDoorOpen]);

  // Animation values
  const currentDoorProgress = useRef<number>(isDoorOpen ? 1 : 0);

  // Helper to create ribbed metal texture for self-storage walls (Light Theme)
  const createCorrugatedTexture = (horizontal = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);

    const step = 16;
    for (let i = 0; i < 128; i += step) {
      if (horizontal) {
        const grad = ctx.createLinearGradient(0, i, 0, i + step);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#f1f5f9');
        grad.addColorStop(0.8, '#e2e8f0');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, i, 128, step);
      } else {
        const grad = ctx.createLinearGradient(i, 0, i + step, 0);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#f1f5f9');
        grad.addColorStop(0.8, '#e2e8f0');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fillRect(i, 0, step, 128);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  // Helper to create cardboard box texture (Light clean finish)
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

    // Up arrows and text
    ctx.fillStyle = '#6b4423';
    ctx.font = 'bold 16px Inter, "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('STORAGE', 16, 75);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Primitive key to ensure rebuild occurs only when actual dimensions change
  const dimKey = `${dimensions.width}_${dimensions.depth}_${dimensions.height}_${dimensions.category}_${dimensions.doorType}`;

  // --------------------------------------------------------------------------
  // 1. Build Scene (Runs only when dimensions truly change)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 450;

    // Scene with Clean Studio Light Gray/White Background
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f8fafc'); // Slate-50 clean background

    // Camera with comfortable field of view
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;

    const maxDim = Math.max(dimensions.width, dimensions.depth, dimensions.height);
    // Camera distance sized so entire unit and rulers are framed in view
    const camDist = maxDim * 2.3;
    camera.position.set(camDist * 0.95, camDist * 0.75, camDist * 1.25);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = maxDim * 0.8;
    controls.maxDistance = maxDim * 5.5;
    controls.target.set(0, dimensions.height * 0.45, 0);

    // Notify parent when user manually orbits
    controls.addEventListener('start', () => {
      if (onUserOrbit) onUserOrbit();
    });

    // Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 1.4);
    sunLight.position.set(maxDim * 2.5, maxDim * 3.5, maxDim * 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = maxDim * 8;
    const d = maxDim * 2.2;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#e0f2fe', 0.5);
    fillLight.position.set(-maxDim * 2, maxDim * 1.5, -maxDim * 2);
    scene.add(fillLight);

    // Studio Ground Platform
    const groundSize = maxDim * 5;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle Architectural Grid
    const grid = new THREE.GridHelper(groundSize, 28, '#cbd5e1', '#e2e8f0');
    grid.position.y = 0.001;
    scene.add(grid);

    // BUILD STORAGE UNIT
    const { width: W, depth: D, height: H, doorType } = dimensions;
    const wallThick = 0.06;

    const wallTexV = createCorrugatedTexture(false);
    wallTexV.repeat.set(Math.max(1, Math.round(D * 2)), Math.max(1, Math.round(H * 2)));

    const wallMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.25,
      map: wallTexV,
      bumpMap: wallTexV,
      bumpScale: 0.03,
      side: THREE.DoubleSide,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: '#ea580c', // Signature SelfStorage energetic orange trim
      roughness: 0.35,
      metalness: 0.45,
    });

    const innerFloorMat = new THREE.MeshStandardMaterial({
      color: '#475569', // Slate epoxy clean polished floor
      roughness: 0.25,
      metalness: 0.2,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Floor
    const unitFloorGeo = new THREE.BoxGeometry(W, wallThick, D);
    const unitFloor = new THREE.Mesh(unitFloorGeo, innerFloorMat);
    unitFloor.position.set(0, wallThick / 2, 0);
    unitFloor.receiveShadow = true;
    scene.add(unitFloor);

    // Perimeter Yellow Safety Line
    const hazardGeo = new THREE.BoxGeometry(W + 0.03, 0.008, D + 0.03);
    const hazardMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 });
    const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
    hazardMesh.position.set(0, 0.008, 0);
    scene.add(hazardMesh);

    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(W, H, wallThick);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, H / 2, -D / 2);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(wallThick, H, D);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    scene.add(leftWall);

    // Right Wall
    const rightWallGeo = new THREE.BoxGeometry(wallThick, H, D);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    scene.add(rightWall);

    // Ceiling
    const ceilingGeo = new THREE.BoxGeometry(W, wallThick, D);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, H + wallThick / 2, 0);
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;
    scene.add(ceiling);

    // Frame Columns & Beams
    const colSize = 0.08;
    const colGeo = new THREE.BoxGeometry(colSize, H + wallThick, colSize);
    const beamXGeo = new THREE.BoxGeometry(W + colSize, colSize, colSize);
    const beamZGeo = new THREE.BoxGeometry(colSize, colSize, D + colSize);

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

    const topFrontBeam = new THREE.Mesh(beamXGeo, frameMat);
    topFrontBeam.position.set(0, H + wallThick / 2, D / 2);
    topFrontBeam.castShadow = true;
    scene.add(topFrontBeam);

    const topBackBeam = new THREE.Mesh(beamXGeo, frameMat);
    topBackBeam.position.set(0, H + wallThick / 2, -D / 2);
    scene.add(topBackBeam);

    const topSideL = new THREE.Mesh(beamZGeo, frameMat);
    topSideL.position.set(-W / 2, H + wallThick / 2, 0);
    scene.add(topSideL);
    const topSideR = new THREE.Mesh(beamZGeo, frameMat);
    topSideR.position.set(W / 2, H + wallThick / 2, 0);
    scene.add(topSideR);

    // Ceiling Recessed LED Light
    const lampGeo = new THREE.BoxGeometry(W * 0.45, 0.03, D * 0.22);
    const lampMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const ceilingLamp = new THREE.Mesh(lampGeo, lampMat);
    ceilingLamp.position.set(0, H - 0.02, 0);
    scene.add(ceilingLamp);
    ceilingLampRef.current = ceilingLamp;

    const interiorLight = new THREE.PointLight('#ffffff', 2.2, Math.max(4, maxDim * 2.8), 1.2);
    interiorLight.position.set(0, H - 0.1, 0);
    interiorLight.castShadow = true;
    scene.add(interiorLight);
    interiorLightRef.current = interiorLight;

    // Door Group
    const doorGroup = new THREE.Group();
    scene.add(doorGroup);

    const doorW = W - 0.08;
    const doorH = H - 0.08;

    if (doorType === 'HINGED') {
      const doorPivot = new THREE.Group();
      doorPivot.position.set(-doorW / 2, 0, D / 2);
      doorPivotRef.current = doorPivot;
      doorGroup.add(doorPivot);

      const panelGeo = new THREE.BoxGeometry(doorW, doorH, 0.03);
      const panelMat = new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.35,
        metalness: 0.3,
      });
      const doorPanel = new THREE.Mesh(panelGeo, panelMat);
      doorPanel.position.set(doorW / 2, doorH / 2, 0);
      doorPanel.castShadow = true;
      doorPivot.add(doorPanel);

      const keypadGeo = new THREE.BoxGeometry(0.1, 0.22, 0.03);
      const keypadMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 });
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(doorW - 0.15, doorH / 2, 0.03);
      doorPivot.add(keypad);

      const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
      const handleMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.9, roughness: 0.2 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(doorW - 0.12, doorH / 2 - 0.05, 0.04);
      doorPivot.add(handle);
    } else {
      const canisterGeo = new THREE.CylinderGeometry(0.12, 0.12, W, 24);
      const canisterMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.6, roughness: 0.3 });
      const canister = new THREE.Mesh(canisterGeo, canisterMat);
      canister.rotation.z = Math.PI / 2;
      canister.position.set(0, H - 0.08, D / 2);
      doorGroup.add(canister);

      const shutterTex = createCorrugatedTexture(true);
      shutterTex.repeat.set(1, Math.max(1, Math.round(H * 6)));
      const shutterMat = new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.35,
        metalness: 0.4,
        map: shutterTex,
        bumpMap: shutterTex,
        bumpScale: 0.04,
      });

      const shutterGeo = new THREE.BoxGeometry(doorW, doorH, 0.02);
      const shutterMesh = new THREE.Mesh(shutterGeo, shutterMat);
      shutterMesh.position.set(0, doorH / 2, D / 2);
      shutterMesh.castShadow = true;
      doorGroup.add(shutterMesh);
      doorPivotRef.current = shutterMesh as any;

      const keypadGeo = new THREE.BoxGeometry(0.08, 0.18, 0.04);
      const keypadMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.8 });
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(W / 2 + 0.04, 1.3, D / 2);
      doorGroup.add(keypad);
    }

    // Interior Items
    const itemsGroup = new THREE.Group();
    itemsGroupRef.current = itemsGroup;
    scene.add(itemsGroup);
    buildInteriorItems(itemsGroup, dimensions, createCardboardTexture);

    // Dimension Rulers with Crisp Architectural Labels (NO EMOJIS)
    const rulersGroup = new THREE.Group();
    rulersGroupRef.current = rulersGroup;
    scene.add(rulersGroup);
    buildDimensionRulers(rulersGroup, dimensions);

    // Apply initial camera preset
    applyCameraPreset(camera, controls, cameraPreset, dimensions);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth door animation
      const targetProgress = isDoorOpenRef.current ? 1 : 0;
      currentDoorProgress.current += (targetProgress - currentDoorProgress.current) * 0.14;

      if (doorPivotRef.current) {
        if (doorType === 'HINGED') {
          doorPivotRef.current.rotation.y = -currentDoorProgress.current * (Math.PI * 0.62);
        } else {
          const openH = doorH * 0.95;
          doorPivotRef.current.position.y = doorH / 2 + currentDoorProgress.current * openH;
          doorPivotRef.current.scale.y = Math.max(0.05, 1 - currentDoorProgress.current * 0.9);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      if (mount) mount.innerHTML = '';
    };
  }, [dimKey]);

  // --------------------------------------------------------------------------
  // 2. Camera Preset Change Effect (Updates smoothly without rebuilding scene)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    applyCameraPreset(cameraRef.current, controlsRef.current, cameraPreset, dimensions);
  }, [cameraPreset, resetSignal, dimKey]);

  // --------------------------------------------------------------------------
  // 3. Toggle States Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (interiorLightRef.current) {
      interiorLightRef.current.intensity = isLightOn ? 2.2 : 0.15;
    }
    if (ceilingLampRef.current) {
      const mat = ceilingLampRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = isLightOn ? 1.2 : 0.05;
    }
  }, [isLightOn]);

  useEffect(() => {
    if (itemsGroupRef.current) itemsGroupRef.current.visible = showItems;
  }, [showItems]);

  useEffect(() => {
    if (rulersGroupRef.current) rulersGroupRef.current.visible = showRulers;
  }, [showRulers]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none outline-none"
    />
  );
}

// --------------------------------------------------------------------------
// HELPER: Camera Presets Handler
// --------------------------------------------------------------------------
function applyCameraPreset(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  preset: 'front' | 'iso' | 'top' | 'interior' = 'iso',
  dimensions: UnitDimensions
) {
  const { width: W, depth: D, height: H } = dimensions;
  const maxDim = Math.max(W, D, H);

  if (preset === 'front') {
    // Directly in front of the door, framing the entire height and width
    camera.position.set(0, H * 0.48, maxDim * 2.3);
    controls.target.set(0, H * 0.48, 0);
  } else if (preset === 'top') {
    // Top-down architectural bird's eye view
    camera.position.set(0, maxDim * 3.0, 0.001); // 0.001 on Z prevents collinear gimbal lock
    controls.target.set(0, 0, 0);
  } else if (preset === 'interior') {
    // Camera inside looking towards back wall
    camera.position.set(0, H * 0.45, D * 0.15);
    controls.target.set(0, H * 0.45, -D * 0.38);
  } else {
    // Default Isometric 3D angle
    camera.position.set(maxDim * 1.8, maxDim * 1.45, maxDim * 2.0);
    controls.target.set(0, H * 0.45, 0);
  }
  controls.update();
}

// --------------------------------------------------------------------------
// HELPER: Architectural Dimension Label (Crisp Light Badge - NO EMOJIS)
// --------------------------------------------------------------------------
function createDimensionLabelSprite(text: string, accentColor = '#2563eb'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // Clean White Studio Badge with Vibrant Border
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;

  const x = 5, y = 5, w = 430, h = 86, r = 20;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crisp Dark Slate Typography with Project Inter Font
  ctx.font = 'bold 38px Inter, "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 220, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.85, 0.22, 1);
  return sprite;
}

// --------------------------------------------------------------------------
// HELPER: Build 3D Dimension Rulers (NO EMOJIS)
// --------------------------------------------------------------------------
function buildDimensionRulers(group: THREE.Group, dimensions: UnitDimensions) {
  const { width: W, depth: D, height: H } = dimensions;
  const lineMat = new THREE.LineBasicMaterial({ color: '#2563eb', linewidth: 2 });
  const tickMat = new THREE.MeshBasicMaterial({ color: '#2563eb' });

  // 1. Width Dimension Line (Front floor, along X)
  const wOffsetZ = D / 2 + 0.22;
  const wPoints = [
    new THREE.Vector3(-W / 2, 0.03, wOffsetZ),
    new THREE.Vector3(W / 2, 0.03, wOffsetZ),
  ];
  const wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
  const wLine = new THREE.Line(wGeo, lineMat);
  group.add(wLine);

  const tickGeoZ = new THREE.BoxGeometry(0.02, 0.02, 0.12);
  const wTick1 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick1.position.set(-W / 2, 0.03, wOffsetZ);
  group.add(wTick1);
  const wTick2 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick2.position.set(W / 2, 0.03, wOffsetZ);
  group.add(wTick2);

  // WIDTH LABEL (NO EMOJIS)
  const widthLabel = createDimensionLabelSprite(`Rộng: ${W}m`, '#2563eb');
  widthLabel.position.set(0, 0.15, wOffsetZ + 0.15);
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

  // DEPTH LABEL (NO EMOJIS)
  const depthLabel = createDimensionLabelSprite(`Sâu: ${D}m`, '#ea580c');
  depthLabel.position.set(dOffsetX + 0.26, 0.15, 0);
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

  // HEIGHT LABEL (NO EMOJIS)
  const heightLabel = createDimensionLabelSprite(`Cao: ${H}m`, '#16a34a');
  heightLabel.position.set(hOffsetX - 0.3, H / 2, hOffsetZ);
  group.add(heightLabel);
}

// --------------------------------------------------------------------------
// HELPER: Build realistic items inside the unit
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

  const addBox = (bw: number, bh: number, bd: number, x: number, y: number, z: number, ry = 0) => {
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const box = new THREE.Mesh(geo, boxMat);
    box.position.set(x, y + bh / 2, z);
    box.rotation.y = ry;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  };

  const addShelf = (sw: number, sh: number, sd: number, x: number, z: number) => {
    const shelfGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
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
    const tierGeo = new THREE.BoxGeometry(sw, 0.02, sd);
    [0.1, sh * 0.5, sh * 0.95].forEach((ty) => {
      const tier = new THREE.Mesh(tierGeo, metalMat);
      tier.position.set(0, ty, 0);
      shelfGroup.add(tier);
    });
    shelfGroup.position.set(x, 0, z);
    group.add(shelfGroup);
  };

  if (category === 'MINI_LOCKER') {
    const luggageGeo = new THREE.BoxGeometry(0.35, 0.55, 0.25);
    const luggageMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4, metalness: 0.2 });
    const luggage = new THREE.Mesh(luggageGeo, luggageMat);
    luggage.position.set(-W * 0.2, 0.55 / 2, -D * 0.15);
    luggage.castShadow = true;
    group.add(luggage);

    addBox(0.4, 0.3, 0.4, W * 0.2, 0, -D * 0.15);
    addBox(0.35, 0.25, 0.35, W * 0.2, 0.3, -D * 0.15, 0.1);

    const packGeo = new THREE.BoxGeometry(0.25, 0.38, 0.2);
    const packMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.7 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.38 / 2, D * 0.15);
    group.add(pack);
    return;
  }

  if (category === 'SMALL_UNIT') {
    addShelf(0.45, H * 0.75, D * 0.6, W * 0.3, -D * 0.1);

    addBox(0.5, 0.4, 0.5, -W * 0.25, 0, -D * 0.2);
    addBox(0.5, 0.4, 0.5, -W * 0.25, 0.4, -D * 0.2, 0.05);
    addBox(0.45, 0.35, 0.45, -W * 0.25, 0.8, -D * 0.2, -0.05);

    addBox(0.45, 0.4, 0.45, -W * 0.25, 0, D * 0.15);
    addBox(0.4, 0.35, 0.4, -W * 0.25, 0.4, D * 0.15, 0.1);

    const chairMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), chairMat);
    chairSeat.position.set(W * 0.05, 0.45, D * 0.15);
    group.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.06), chairMat);
    chairBack.position.set(W * 0.05, 0.7, D * 0.35);
    group.add(chairBack);
    return;
  }

  if (category === 'MEDIUM_UNIT') {
    const fridgeGeo = new THREE.BoxGeometry(0.65, 1.5, 0.65);
    const fridgeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7, roughness: 0.25 });
    const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
    fridge.position.set(-W * 0.25, 1.5 / 2, -D * 0.3);
    fridge.castShadow = true;
    group.add(fridge);

    const sofaMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.6 });
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.75, 0.75), sofaMat);
    sofa.position.set(W * 0.25, 0.75 / 2, -D * 0.2);
    sofa.castShadow = true;
    group.add(sofa);

    const wmGeo = new THREE.BoxGeometry(0.6, 0.85, 0.6);
    const wmMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.4, roughness: 0.3 });
    const wm = new THREE.Mesh(wmGeo, wmMat);
    wm.position.set(W * 0.25, 0.85 / 2, D * 0.2);
    group.add(wm);

    addShelf(0.4, H * 0.7, D * 0.5, -W * 0.35, D * 0.1);

    addBox(0.5, 0.4, 0.5, -W * 0.05, 0, -D * 0.1);
    addBox(0.48, 0.38, 0.48, -W * 0.05, 0.4, -D * 0.1, 0.05);
    addBox(0.45, 0.35, 0.45, -W * 0.05, 0.78, -D * 0.1);
    return;
  }

  // Large & Extra Large
  const sofaMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 });
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(W * 0.55, 0.75, 0.85), sofaMat);
  sofa.position.set(-W * 0.15, 0.75 / 2, -D * 0.3);
  sofa.castShadow = true;
  group.add(sofa);

  const fridgeGeo = new THREE.BoxGeometry(0.8, 1.75, 0.75);
  const fridgeMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.2 });
  const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
  fridge.position.set(W * 0.32, 1.75 / 2, -D * 0.28);
  fridge.castShadow = true;
  group.add(fridge);

  const wardGeo = new THREE.BoxGeometry(0.85, H * 0.75, 0.55);
  const wardMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 });
  const ward = new THREE.Mesh(wardGeo, wardMat);
  ward.position.set(-W * 0.35, (H * 0.75) / 2, D * 0.1);
  group.add(ward);

  if (category === 'EXTRA_LARGE' || category === 'WAREHOUSE_XXL') {
    const bikeGroup = new THREE.Group();
    const bikeBodyMat = new THREE.MeshStandardMaterial({ color: '#dc2626', metalness: 0.7, roughness: 0.3 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });

    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.22, 0.55);
    bikeGroup.add(frontWheel);

    const backWheel = new THREE.Mesh(wheelGeo, wheelMat);
    backWheel.position.set(0, 0.22, -0.55);
    bikeGroup.add(backWheel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.9), bikeBodyMat);
    body.position.set(0, 0.5, 0);
    bikeGroup.add(body);

    bikeGroup.position.set(W * 0.25, 0, D * 0.2);
    bikeGroup.rotation.y = -Math.PI / 6;
    group.add(bikeGroup);
  }

  addShelf(0.55, H * 0.8, D * 0.5, W * 0.35, D * 0.15);

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
