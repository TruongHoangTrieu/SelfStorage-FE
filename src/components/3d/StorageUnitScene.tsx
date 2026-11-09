'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnitDimensions } from './unitDimensions';
import {
  Plus,
  RotateCw,
  Trash2,
  Layers,
  Move,
  Box,
  Sparkles,
} from 'lucide-react';

export type PlaceableItemType =
  | 'box'
  | 'luggage'
  | 'bin'
  | 'shelf'
  | 'chair'
  | 'fridge'
  | 'sofa'
  | 'washer'
  | 'bike';

export interface InteractiveItemMeta {
  id: string;
  type: PlaceableItemType;
  label: string;
  w: number;
  h: number;
  d: number;
  canPlaceOnShelf: boolean;
  shelfTier: number; // 0 = floor, 1 = tier 1, 2 = tier 2, 3 = tier 3
}

interface ShelfZone {
  id: string;
  meshGroup: THREE.Object3D;
  sw: number;
  sh: number;
  sd: number;
  tierHeights: number[];
}

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

const ITEM_CATALOG: {
  type: PlaceableItemType;
  label: string;
  shortLabel: string;
  minCategory?: string;
}[] = [
  { type: 'shelf', label: 'Kệ sắt nhỏ 3 tầng', shortLabel: '+ Kệ nhỏ' },
  { type: 'box', label: 'Thùng carton', shortLabel: '+ Thùng carton' },
  { type: 'luggage', label: 'Vali du lịch', shortLabel: '+ Vali' },
  { type: 'bin', label: 'Thùng hồ sơ nhựa', shortLabel: '+ Hộp hồ sơ' },
  { type: 'fridge', label: 'Tủ lạnh gia đình', shortLabel: '+ Tủ lạnh' },
  { type: 'sofa', label: 'Ghế Sofa / Nệm', shortLabel: '+ Sofa' },
  { type: 'bike', label: 'Xe đạp / Xe máy', shortLabel: '+ Xe máy' },
];

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
  const selectionRingRef = useRef<THREE.Mesh | null>(null);

  // Interactive items & shelves registries
  const draggableObjectsRef = useRef<THREE.Object3D[]>([]);
  const shelfZonesRef = useRef<ShelfZone[]>([]);
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const cardTexRef = useRef<THREE.Texture | null>(null);

  const [selectedItemMeta, setSelectedItemMeta] = useState<InteractiveItemMeta | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);

  // Door animation state ref
  const isDoorOpenRef = useRef<boolean>(isDoorOpen);
  useEffect(() => {
    isDoorOpenRef.current = isDoorOpen;
  }, [isDoorOpen]);

  const currentDoorProgress = useRef<number>(isDoorOpen ? 1 : 0);

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

  const createCardboardTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#b08968';
    ctx.fillRect(48, 0, 32, 128);

    ctx.fillStyle = '#6b4423';
    ctx.font = 'bold 16px Inter, "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('STORAGE', 16, 75);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Helper to update selection highlight ring position
  const syncSelectionHighlight = useCallback((obj: THREE.Object3D | null) => {
    const ring = selectionRingRef.current;
    if (!ring) return;
    if (!obj) {
      ring.visible = false;
      setSelectedItemMeta(null);
      return;
    }
    const meta = obj.userData?.meta as InteractiveItemMeta | undefined;
    if (!meta) {
      ring.visible = false;
      setSelectedItemMeta(null);
      return;
    }
    ring.visible = true;
    const radius = Math.max(meta.w, meta.d) * 0.68;
    ring.scale.set(radius, radius, 1);
    ring.position.set(obj.position.x, obj.position.y + 0.015, obj.position.z);
    setSelectedItemMeta({ ...meta });
  }, []);

  // Helper to create a 3D draggable item mesh group and register it
  const spawnDraggableItem = useCallback(
    (
      type: PlaceableItemType,
      x: number,
      z: number,
      ry = 0,
      initialShelfTier = 0
    ): THREE.Object3D | null => {
      const itemsGroup = itemsGroupRef.current;
      if (!itemsGroup) return null;

      const { width: W, depth: D, height: H } = dimensions;
      const itemGroup = new THREE.Group();
      const id = `item_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      let w = 0.42;
      let h = 0.34;
      let d = 0.42;
      let label = 'Thùng carton';
      let canPlaceOnShelf = true;

      if (type === 'box') {
        w = 0.42;
        h = 0.34;
        d = 0.42;
        label = 'Thùng carton';
        canPlaceOnShelf = true;
        const boxMat = new THREE.MeshStandardMaterial({
          map: cardTexRef.current || undefined,
          color: '#d4a373',
          roughness: 0.82,
          metalness: 0.05,
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        itemGroup.add(mesh);
      } else if (type === 'luggage') {
        w = 0.36;
        h = 0.54;
        d = 0.24;
        label = 'Vali du lịch';
        canPlaceOnShelf = true;
        const mat = new THREE.MeshStandardMaterial({
          color: '#0284c7',
          roughness: 0.35,
          metalness: 0.25,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        body.position.y = h / 2;
        body.castShadow = true;
        itemGroup.add(body);

        const handleMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8 });
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.03), handleMat);
        handle.position.set(0, h + 0.05, 0);
        itemGroup.add(handle);
      } else if (type === 'bin') {
        w = 0.44;
        h = 0.28;
        d = 0.34;
        label = 'Hộp hồ sơ nhựa';
        canPlaceOnShelf = true;
        const bodyMat = new THREE.MeshStandardMaterial({
          color: '#3b82f6',
          roughness: 0.3,
          metalness: 0.1,
        });
        const lidMat = new THREE.MeshStandardMaterial({
          color: '#f8fafc',
          roughness: 0.25,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.04, d), bodyMat);
        body.position.y = (h - 0.04) / 2;
        body.castShadow = true;
        itemGroup.add(body);

        const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.04, d + 0.02), lidMat);
        lid.position.y = h - 0.02;
        itemGroup.add(lid);
      } else if (type === 'shelf') {
        w = Math.min(0.95, Math.max(0.55, W * 0.42));
        h = Math.min(1.65, H * 0.72);
        d = Math.min(0.52, Math.max(0.36, D * 0.28));
        label = 'Kệ nhỏ 3 tầng';
        canPlaceOnShelf = false;

        const metalMat = new THREE.MeshStandardMaterial({
          color: '#1e293b',
          metalness: 0.75,
          roughness: 0.28,
        });
        const woodMat = new THREE.MeshStandardMaterial({
          color: '#e2e8f0',
          metalness: 0.2,
          roughness: 0.5,
        });
        const postGeo = new THREE.BoxGeometry(0.035, h, 0.035);
        const corners = [
          [-w / 2 + 0.02, -d / 2 + 0.02],
          [w / 2 - 0.02, -d / 2 + 0.02],
          [-w / 2 + 0.02, d / 2 - 0.02],
          [w / 2 - 0.02, d / 2 - 0.02],
        ];
        corners.forEach(([cx, cz]) => {
          const post = new THREE.Mesh(postGeo, metalMat);
          post.position.set(cx, h / 2, cz);
          post.castShadow = true;
          itemGroup.add(post);
        });

        const tierHeights = [0.12, h * 0.5, h * 0.88];
        const tierGeo = new THREE.BoxGeometry(w, 0.028, d);
        tierHeights.forEach((ty) => {
          const tier = new THREE.Mesh(tierGeo, woodMat);
          tier.position.set(0, ty, 0);
          tier.receiveShadow = true;
          tier.castShadow = true;
          itemGroup.add(tier);
        });

        shelfZonesRef.current.push({
          id,
          meshGroup: itemGroup,
          sw: w,
          sh: h,
          sd: d,
          tierHeights,
        });
      } else if (type === 'chair') {
        w = 0.46;
        h = 0.78;
        d = 0.46;
        label = 'Ghế làm việc';
        canPlaceOnShelf = false;
        const chairMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.45), chairMat);
        seat.position.set(0, 0.42, 0);
        seat.castShadow = true;
        itemGroup.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.06), chairMat);
        back.position.set(0, 0.64, -0.2);
        back.castShadow = true;
        itemGroup.add(back);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.18, 0.42, 12), chairMat);
        leg.position.set(0, 0.21, 0);
        itemGroup.add(leg);
      } else if (type === 'fridge') {
        w = Math.min(0.7, W * 0.35);
        h = Math.min(1.55, H * 0.72);
        d = Math.min(0.65, D * 0.35);
        label = 'Tủ lạnh';
        canPlaceOnShelf = false;
        const fridgeMat = new THREE.MeshStandardMaterial({
          color: '#94a3b8',
          metalness: 0.7,
          roughness: 0.25,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fridgeMat);
        body.position.y = h / 2;
        body.castShadow = true;
        itemGroup.add(body);
      } else if (type === 'sofa') {
        w = Math.min(1.25, W * 0.55);
        h = 0.72;
        d = Math.min(0.75, D * 0.38);
        label = 'Ghế Sofa';
        canPlaceOnShelf = false;
        const sofaMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.65 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.38, d), sofaMat);
        base.position.y = 0.19;
        base.castShadow = true;
        itemGroup.add(base);
        const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.36, 0.2), sofaMat);
        back.position.set(0, 0.54, -d / 2 + 0.1);
        back.castShadow = true;
        itemGroup.add(back);
      } else if (type === 'washer') {
        w = 0.58;
        h = 0.82;
        d = 0.58;
        label = 'Máy giặt';
        canPlaceOnShelf = false;
        const wmMat = new THREE.MeshStandardMaterial({
          color: '#f1f5f9',
          metalness: 0.35,
          roughness: 0.3,
        });
        const wm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wmMat);
        wm.position.y = h / 2;
        wm.castShadow = true;
        itemGroup.add(wm);
      } else if (type === 'bike') {
        w = 0.45;
        h = 0.95;
        d = Math.min(1.35, D * 0.55);
        label = 'Xe máy / Xe đạp';
        canPlaceOnShelf = false;
        const bikeBodyMat = new THREE.MeshStandardMaterial({
          color: '#dc2626',
          metalness: 0.7,
          roughness: 0.3,
        });
        const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
        const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16);
        wheelGeo.rotateZ(Math.PI / 2);

        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.position.set(0, 0.22, d * 0.35);
        itemGroup.add(frontWheel);

        const backWheel = new THREE.Mesh(wheelGeo, wheelMat);
        backWheel.position.set(0, 0.22, -d * 0.35);
        itemGroup.add(backWheel);

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, d * 0.68), bikeBodyMat);
        body.position.set(0, 0.5, 0);
        body.castShadow = true;
        itemGroup.add(body);
      }

      // Compute Y position (either on floor or on a shelf tier)
      let yPos = 0.03;
      let activeTier = 0;
      if (canPlaceOnShelf && initialShelfTier > 0 && shelfZonesRef.current.length > 0) {
        const shelf = shelfZonesRef.current[0];
        const tierIdx = Math.min(shelf.tierHeights.length - 1, initialShelfTier - 1);
        yPos = 0.03 + shelf.tierHeights[tierIdx] + 0.015;
        activeTier = tierIdx + 1;
      }

      // Clamp X and Z inside the room walls
      const margin = 0.06;
      const clampedX = Math.max(-W / 2 + w / 2 + margin, Math.min(W / 2 - w / 2 - margin, x));
      const clampedZ = Math.max(-D / 2 + d / 2 + margin, Math.min(D / 2 - d / 2 - margin, z));

      itemGroup.position.set(clampedX, yPos, clampedZ);
      itemGroup.rotation.y = ry;

      const meta: InteractiveItemMeta = {
        id,
        type,
        label,
        w,
        h,
        d,
        canPlaceOnShelf,
        shelfTier: activeTier,
      };
      itemGroup.userData = {
        isDraggableRoot: true,
        meta,
      };

      // Tag all child meshes with a reference to their draggable root group
      itemGroup.traverse((child) => {
        child.userData.draggableRoot = itemGroup;
      });

      itemsGroup.add(itemGroup);
      draggableObjectsRef.current.push(itemGroup);
      setItemCount(draggableObjectsRef.current.length);
      return itemGroup;
    },
    [dimensions]
  );

  // Action: Add new item from toolbar
  const handleAddItem = (type: PlaceableItemType) => {
    const { width: W, depth: D } = dimensions;
    // If adding a small item and a shelf exists, try placing on shelf or near center
    const jitterX = (Math.random() - 0.5) * (W * 0.35);
    const jitterZ = (Math.random() - 0.5) * (D * 0.35);
    const newObj = spawnDraggableItem(type, jitterX, jitterZ, 0, 0);
    if (newObj) {
      selectedObjectRef.current = newObj;
      syncSelectionHighlight(newObj);
    }
  };

  // Action: Place selected small item onto a shelf tier (Kệ nhỏ: Sàn -> Tầng 1 -> Tầng 2 -> Tầng 3)
  const handleCycleShelfTier = () => {
    const obj = selectedObjectRef.current;
    if (!obj) return;
    const meta = obj.userData?.meta as InteractiveItemMeta | undefined;
    if (!meta || !meta.canPlaceOnShelf) return;

    // Ensure there is at least one shelf in the unit; if not, create one automatically!
    if (shelfZonesRef.current.length === 0) {
      spawnDraggableItem('shelf', -dimensions.width * 0.22, -dimensions.depth * 0.25, 0, 0);
    }
    const targetShelf = shelfZonesRef.current[0];
    if (!targetShelf) return;

    const nextTier = (meta.shelfTier + 1) % (targetShelf.tierHeights.length + 1);
    meta.shelfTier = nextTier;

    if (nextTier === 0) {
      // Back to floor in front of shelf
      obj.position.y = 0.03;
      obj.position.x = Math.min(dimensions.width * 0.25, targetShelf.meshGroup.position.x + 0.35);
      obj.position.z = Math.min(dimensions.depth * 0.25, targetShelf.meshGroup.position.z + 0.35);
    } else {
      const tierY = targetShelf.tierHeights[nextTier - 1];
      const offsetWithinShelf = ((nextTier - 1) % 2 === 0 ? -1 : 1) * (targetShelf.sw * 0.18);
      obj.position.x = targetShelf.meshGroup.position.x + offsetWithinShelf;
      obj.position.z = targetShelf.meshGroup.position.z;
      obj.position.y = 0.03 + tierY + 0.015;
    }
    syncSelectionHighlight(obj);
  };

  // Action: Rotate selected item 90 degrees
  const handleRotateSelected = () => {
    const obj = selectedObjectRef.current;
    if (!obj) return;
    obj.rotation.y += Math.PI / 2;
    syncSelectionHighlight(obj);
  };

  // Action: Delete selected item
  const handleDeleteSelected = () => {
    const obj = selectedObjectRef.current;
    const itemsGroup = itemsGroupRef.current;
    if (!obj || !itemsGroup) return;

    const meta = obj.userData?.meta as InteractiveItemMeta | undefined;
    if (meta?.type === 'shelf') {
      shelfZonesRef.current = shelfZonesRef.current.filter((s) => s.id !== meta.id);
    }

    itemsGroup.remove(obj);
    draggableObjectsRef.current = draggableObjectsRef.current.filter((o) => o !== obj);
    selectedObjectRef.current = null;
    syncSelectionHighlight(null);
    setItemCount(draggableObjectsRef.current.length);
  };

  const dimKey = `${dimensions.width}_${dimensions.depth}_${dimensions.height}_${dimensions.category}_${dimensions.doorType}`;

  // --------------------------------------------------------------------------
  // 1. Build Scene & Interactive Drag-and-Drop Raycaster
  // --------------------------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f8fafc');

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;

    const maxDim = Math.max(dimensions.width, dimensions.depth, dimensions.height);
    const camDist = maxDim * 2.3;
    camera.position.set(camDist * 0.95, camDist * 0.75, camDist * 1.25);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = maxDim * 0.8;
    controls.maxDistance = maxDim * 5.5;
    controls.target.set(0, dimensions.height * 0.45, 0);

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

    const grid = new THREE.GridHelper(groundSize, 28, '#cbd5e1', '#e2e8f0');
    grid.position.y = 0.001;
    scene.add(grid);

    // BUILD STORAGE UNIT
    const { width: W, depth: D, height: H, doorType, category } = dimensions;
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
      color: '#ea580c',
      roughness: 0.35,
      metalness: 0.45,
    });

    const innerFloorMat = new THREE.MeshStandardMaterial({
      color: '#475569',
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

    // Walls & Ceiling
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, wallThick), wallMat);
    backWall.position.set(0, H / 2, -D / 2);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), wallMat);
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    scene.add(rightWall);

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W, wallThick, D), ceilingMat);
    ceiling.position.set(0, H + wallThick / 2, 0);
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;
    scene.add(ceiling);

    // Frame Columns & Beams
    const colSize = 0.08;
    const colGeo = new THREE.BoxGeometry(colSize, H + wallThick, colSize);
    const beamXGeo = new THREE.BoxGeometry(W + colSize, colSize, colSize);
    const beamZGeo = new THREE.BoxGeometry(colSize, colSize, D + colSize);

    [
      [-W / 2, -D / 2],
      [W / 2, -D / 2],
      [-W / 2, D / 2],
      [W / 2, D / 2],
    ].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo, frameMat);
      col.position.set(cx, (H + wallThick) / 2, cz);
      col.castShadow = true;
      scene.add(col);
    });

    const topFrontBeam = new THREE.Mesh(beamXGeo, frameMat);
    topFrontBeam.position.set(0, H + wallThick / 2, D / 2);
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

    // Selection Highlight Ring on Floor / Shelf
    const ringGeo = new THREE.RingGeometry(0.32, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#2563eb',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // Initialize Interior Items Group & Default Shelving + Draggable Items
    const itemsGroup = new THREE.Group();
    itemsGroupRef.current = itemsGroup;
    scene.add(itemsGroup);

    draggableObjectsRef.current = [];
    shelfZonesRef.current = [];
    selectedObjectRef.current = null;
    cardTexRef.current = createCardboardTexture();

    // Populate default interactive shelves (`kệ nhỏ ở trong`) & items by unit category
    if (category === 'MINI_LOCKER') {
      spawnDraggableItem('shelf', -W * 0.18, -D * 0.22, 0, 0);
      spawnDraggableItem('box', -W * 0.18, -D * 0.22, 0, 2);
      spawnDraggableItem('bin', -W * 0.18, -D * 0.22, 0, 3);
      spawnDraggableItem('luggage', W * 0.22, 0.05, 0, 0);
    } else if (category === 'SMALL_UNIT') {
      spawnDraggableItem('shelf', -W * 0.22, -D * 0.26, 0, 0);
      spawnDraggableItem('box', -W * 0.22, -D * 0.26, 0, 1);
      spawnDraggableItem('box', -W * 0.22, -D * 0.26, 0.08, 2);
      spawnDraggableItem('bin', -W * 0.22, -D * 0.26, 0, 3);
      spawnDraggableItem('luggage', W * 0.22, -D * 0.18, 0, 0);
      spawnDraggableItem('box', W * 0.22, D * 0.18, 0, 0);
      spawnDraggableItem('chair', -W * 0.15, D * 0.2, 0.3, 0);
    } else if (category === 'MEDIUM_UNIT') {
      spawnDraggableItem('shelf', -W * 0.26, -D * 0.32, 0, 0);
      spawnDraggableItem('box', -W * 0.26, -D * 0.32, 0, 1);
      spawnDraggableItem('bin', -W * 0.26, -D * 0.32, 0, 2);
      spawnDraggableItem('luggage', -W * 0.26, -D * 0.32, 0, 3);
      spawnDraggableItem('fridge', W * 0.26, -D * 0.28, 0, 0);
      spawnDraggableItem('sofa', -W * 0.15, D * 0.15, 0, 0);
      spawnDraggableItem('washer', W * 0.25, D * 0.2, 0, 0);
    } else {
      // LARGE / EXTRA LARGE
      spawnDraggableItem('shelf', -W * 0.28, -D * 0.34, 0, 0);
      spawnDraggableItem('shelf', W * 0.28, -D * 0.34, 0, 0);
      spawnDraggableItem('box', -W * 0.28, -D * 0.34, 0, 1);
      spawnDraggableItem('box', -W * 0.28, -D * 0.34, 0, 2);
      spawnDraggableItem('bin', -W * 0.28, -D * 0.34, 0, 3);
      spawnDraggableItem('fridge', W * 0.28, -D * 0.02, 0, 0);
      spawnDraggableItem('sofa', -W * 0.2, 0.05, 0, 0);
      spawnDraggableItem('bike', 0.15, D * 0.22, -Math.PI / 6, 0);
    }

    // Select first item by default so user immediately sees interactive controls
    if (draggableObjectsRef.current.length > 1) {
      const firstBox = draggableObjectsRef.current[1];
      selectedObjectRef.current = firstBox;
      syncSelectionHighlight(firstBox);
    }

    // Dimension Rulers
    const rulersGroup = new THREE.Group();
    rulersGroupRef.current = rulersGroup;
    scene.add(rulersGroup);
    buildDimensionRulers(rulersGroup, dimensions);

    applyCameraPreset(camera, controls, cameraPreset, dimensions);

    // ------------------------------------------------------------------------
    // RAYCAST DRAG-AND-DROP INTERACTION ON FLOOR & SHELVES
    // ------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.03);
    const intersectPoint = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();
    let isDraggingItem = false;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getHitDraggableRoot = (): THREE.Object3D | null => {
      if (!itemsGroupRef.current || !itemsGroupRef.current.visible) return null;
      const intersects = raycaster.intersectObjects(draggableObjectsRef.current, true);
      if (intersects.length === 0) return null;
      return intersects[0].object.userData?.draggableRoot || null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);

      const hitRoot = getHitDraggableRoot();
      if (hitRoot) {
        selectedObjectRef.current = hitRoot;
        syncSelectionHighlight(hitRoot);
        isDraggingItem = true;
        controls.enabled = false; // Freeze camera orbit while dragging item

        dragPlane.constant = -hitRoot.position.y;
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
          dragOffset.subVectors(hitRoot.position, intersectPoint);
        } else {
          dragOffset.set(0, 0, 0);
        }
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);

      if (isDraggingItem && selectedObjectRef.current) {
        const activeObj = selectedObjectRef.current;
        const meta = activeObj.userData?.meta as InteractiveItemMeta;
        if (!meta) return;

        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
          const rawX = intersectPoint.x + dragOffset.x;
          const rawZ = intersectPoint.z + dragOffset.z;

          const margin = 0.06;
          const halfW = meta.w / 2;
          const halfD = meta.d / 2;
          const clampedX = Math.max(-W / 2 + halfW + margin, Math.min(W / 2 - halfW - margin, rawX));
          const clampedZ = Math.max(-D / 2 + halfD + margin, Math.min(D / 2 - halfD - margin, rawZ));

          activeObj.position.x = clampedX;
          activeObj.position.z = clampedZ;

          // Check if small item is dragged inside any shelf zone (`kệ nhỏ`)
          if (meta.canPlaceOnShelf && shelfZonesRef.current.length > 0) {
            let snappedToShelf = false;
            for (const shelf of shelfZonesRef.current) {
              const sx = shelf.meshGroup.position.x;
              const sz = shelf.meshGroup.position.z;
              const inX = Math.abs(clampedX - sx) <= shelf.sw / 2 + 0.08;
              const inZ = Math.abs(clampedZ - sz) <= shelf.sd / 2 + 0.08;
              if (inX && inZ) {
                const tierIdx = meta.shelfTier > 0 ? meta.shelfTier - 1 : 1;
                const safeIdx = Math.min(shelf.tierHeights.length - 1, tierIdx);
                activeObj.position.y = 0.03 + shelf.tierHeights[safeIdx] + 0.015;
                meta.shelfTier = safeIdx + 1;
                snappedToShelf = true;
                break;
              }
            }
            if (!snappedToShelf) {
              activeObj.position.y = 0.03;
              meta.shelfTier = 0;
            }
          }

          syncSelectionHighlight(activeObj);
        }
        return;
      }

      // Hover cursor feedback
      const hoverRoot = getHitDraggableRoot();
      renderer.domElement.style.cursor = hoverRoot ? 'grab' : 'default';
    };

    const onPointerUp = () => {
      if (isDraggingItem) {
        isDraggingItem = false;
        controls.enabled = true;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

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
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      if (mount) mount.innerHTML = '';
    };
  }, [dimKey, spawnDraggableItem, syncSelectionHighlight]);

  // 2. Camera Preset Change Effect
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    applyCameraPreset(cameraRef.current, controlsRef.current, cameraPreset, dimensions);
  }, [cameraPreset, resetSignal, dimKey]);

  // 3. Toggle States Effects
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
    if (selectionRingRef.current) {
      selectionRingRef.current.visible = showItems && Boolean(selectedObjectRef.current);
    }
  }, [showItems]);

  useEffect(() => {
    if (rulersGroupRef.current) rulersGroupRef.current.visible = showRulers;
  }, [showRulers]);

  return (
    <div className="w-full h-full relative select-none outline-none">
      {/* THREE.JS MOUNT CONTAINER */}
      <div
        ref={mountRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none outline-none"
      />

      {/* INTERACTIVE SHELF & DRAG-AND-DROP ITEM PALETTE OVERLAY */}
      {showItems && (
        <div className="absolute top-3 inset-x-3 z-10 flex flex-col gap-2 pointer-events-none">
          {/* Row 1: Add Items / Shelves Palette */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-200/90 shadow-md flex items-center gap-1.5 flex-wrap pointer-events-auto">
              <span className="text-[11px] font-black text-slate-700 px-1.5 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-orange-500" />
                <span>Kéo thả &amp; Thêm đồ ({itemCount}):</span>
              </span>
              {ITEM_CATALOG.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddItem(item.type)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 transition cursor-pointer flex items-center gap-1"
                  title={`Thêm ${item.label} vào kho`}
                >
                  <span>{item.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Row 2: Selected Item Manipulation Controls (Shelf Tier / Rotate / Delete) */}
            {selectedItemMeta && (
              <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-2 flex-wrap pointer-events-auto">
                <span className="text-[11px] font-bold text-orange-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{selectedItemMeta.label}</span>
                  {selectedItemMeta.shelfTier > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 text-[10px]">
                      Kệ tầng {selectedItemMeta.shelfTier}
                    </span>
                  )}
                </span>

                {selectedItemMeta.canPlaceOnShelf && (
                  <button
                    type="button"
                    onClick={handleCycleShelfTier}
                    className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Đặt đồ vật lên kệ sắt nhỏ (Tầng 1 / 2 / 3) hoặc hạ xuống sàn"
                  >
                    <Layers className="w-3 h-3" />
                    <span>
                      {selectedItemMeta.shelfTier === 0
                        ? 'Đặt lên kệ nhỏ'
                        : `Đổi tầng kệ (${selectedItemMeta.shelfTier}/3)`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRotateSelected}
                  className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Xoay đồ vật 90 độ"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Xoay 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Xóa đồ vật đang chọn khỏi kho"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
    camera.position.set(0, H * 0.48, maxDim * 2.3);
    controls.target.set(0, H * 0.48, 0);
  } else if (preset === 'top') {
    camera.position.set(0, maxDim * 3.0, 0.001);
    controls.target.set(0, 0, 0);
  } else if (preset === 'interior') {
    camera.position.set(0, H * 0.45, D * 0.15);
    controls.target.set(0, H * 0.45, -D * 0.38);
  } else {
    camera.position.set(maxDim * 1.8, maxDim * 1.45, maxDim * 2.0);
    controls.target.set(0, H * 0.45, 0);
  }
  controls.update();
}

// --------------------------------------------------------------------------
// HELPER: Architectural Dimension Label
// --------------------------------------------------------------------------
function createDimensionLabelSprite(text: string, accentColor = '#2563eb'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

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
// HELPER: Build 3D Dimension Rulers
// --------------------------------------------------------------------------
function buildDimensionRulers(group: THREE.Group, dimensions: UnitDimensions) {
  const { width: W, depth: D, height: H } = dimensions;
  const lineMat = new THREE.LineBasicMaterial({ color: '#2563eb', linewidth: 2 });
  const tickMat = new THREE.MeshBasicMaterial({ color: '#2563eb' });

  const wOffsetZ = D / 2 + 0.22;
  const wPoints = [
    new THREE.Vector3(-W / 2, 0.03, wOffsetZ),
    new THREE.Vector3(W / 2, 0.03, wOffsetZ),
  ];
  const wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
  group.add(new THREE.Line(wGeo, lineMat));

  const tickGeoZ = new THREE.BoxGeometry(0.02, 0.02, 0.12);
  const wTick1 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick1.position.set(-W / 2, 0.03, wOffsetZ);
  group.add(wTick1);
  const wTick2 = new THREE.Mesh(tickGeoZ, tickMat);
  wTick2.position.set(W / 2, 0.03, wOffsetZ);
  group.add(wTick2);

  const widthLabel = createDimensionLabelSprite(`Rộng: ${W}m`, '#2563eb');
  widthLabel.position.set(0, 0.15, wOffsetZ + 0.15);
  group.add(widthLabel);

  const dOffsetX = W / 2 + 0.22;
  const dPoints = [
    new THREE.Vector3(dOffsetX, 0.03, -D / 2),
    new THREE.Vector3(dOffsetX, 0.03, D / 2),
  ];
  const dGeo = new THREE.BufferGeometry().setFromPoints(dPoints);
  group.add(new THREE.Line(dGeo, lineMat));

  const tickGeoX = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const dTick1 = new THREE.Mesh(tickGeoX, tickMat);
  dTick1.position.set(dOffsetX, 0.03, -D / 2);
  group.add(dTick1);
  const dTick2 = new THREE.Mesh(tickGeoX, tickMat);
  dTick2.position.set(dOffsetX, 0.03, D / 2);
  group.add(dTick2);

  const depthLabel = createDimensionLabelSprite(`Sâu: ${D}m`, '#ea580c');
  depthLabel.position.set(dOffsetX + 0.26, 0.15, 0);
  group.add(depthLabel);

  const hOffsetX = -W / 2 - 0.22;
  const hOffsetZ = D / 2 + 0.05;
  const hPoints = [
    new THREE.Vector3(hOffsetX, 0, hOffsetZ),
    new THREE.Vector3(hOffsetX, H, hOffsetZ),
  ];
  const hGeo = new THREE.BufferGeometry().setFromPoints(hPoints);
  group.add(new THREE.Line(hGeo, lineMat));

  const hTickGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const hTick1 = new THREE.Mesh(hTickGeo, tickMat);
  hTick1.position.set(hOffsetX, 0, hOffsetZ);
  group.add(hTick1);
  const hTick2 = new THREE.Mesh(hTickGeo, tickMat);
  hTick2.position.set(hOffsetX, H, hOffsetZ);
  group.add(hTick2);

  const heightLabel = createDimensionLabelSprite(`Cao: ${H}m`, '#16a34a');
  heightLabel.position.set(hOffsetX - 0.3, H / 2, hOffsetZ);
  group.add(heightLabel);
}
