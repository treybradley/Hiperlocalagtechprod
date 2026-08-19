import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SystemBlock } from '../contexts/FarmConfigContext';
import { SYSTEM_TYPE_LABELS, CROPS } from '../data/crops';
import {
  autoPackModules,
  metersToDisplay,
  type RoomSpec,
  type PlacedModule,
} from '../utils/farmLayout';

type CameraMode = 'iso' | 'overhead';

interface FarmVisualizerProps {
  isActive: boolean;
  systemBlocks: SystemBlock[];
  room: RoomSpec;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

const GRAY = 0xc5c8ce;
const WALL = 0xd8dbe0;
const FLOOR = 0xe8eaee;
const CYAN = 0x22d3ee;
const MAGENTA = 0xd946ef;

function makeStatusTexture(mod: PlacedModule): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(0, 0, 256, 4);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(SYSTEM_TYPE_LABELS[mod.systemType], 16, 40);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText(`${mod.unitCount} units`, 16, 68);
  const cropNames = mod.stripes
    .map((s) => CROPS.find((c) => c.id === s.cropId)?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
  ctx.fillStyle = '#4ade80';
  ctx.font = '14px sans-serif';
  ctx.fillText(cropNames || 'No crops', 16, 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCrops(
  g: THREE.Group,
  mod: PlacedModule,
  x0: number,
  spanX: number,
  y: number,
  z0: number,
  spanZ: number,
  maxH: number,
) {
  if (mod.stripes.length === 0) return;
  const cell = 0.11;
  const nx = Math.max(1, Math.floor(spanX / cell));
  const nz = Math.max(1, Math.floor(spanZ / cell));
  const geom = new THREE.BoxGeometry(cell * 0.78, 1, cell * 0.78);
  const weights = mod.stripes.map((s) => s.weight);
  const totalCells = nx * nz;

  const counts = new Map<number, number>();
  const assignments: number[] = [];
  for (let i = 0; i < totalCells; i++) {
    const t = (i + 0.5) / totalCells;
    let acc = 0;
    let color = mod.stripes[0].color;
    for (let s = 0; s < mod.stripes.length; s++) {
      acc += weights[s];
      if (t <= acc) {
        color = mod.stripes[s].color;
        break;
      }
    }
    assignments.push(color);
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  const mats = new Map<number, THREE.InstancedMesh>();
  for (const [color, count] of counts) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      emissive: color,
      emissiveIntensity: 0.12,
    });
    mats.set(color, new THREE.InstancedMesh(geom, mat, count));
  }

  const dummy = new THREE.Object3D();
  const written = new Map<number, number>();
  let i = 0;
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      const color = assignments[i++];
      const mesh = mats.get(color)!;
      const idx = written.get(color) ?? 0;
      const h = 0.04 + (((ix * 13 + iz * 7) % 10) / 10) * maxH;
      dummy.position.set(
        x0 + (ix + 0.5) * (spanX / nx),
        y + h / 2,
        z0 + (iz + 0.5) * (spanZ / nz),
      );
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      written.set(color, idx + 1);
    }
  }
  for (const mesh of mats.values()) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    g.add(mesh);
  }
}

function buildModule(mod: PlacedModule, selected: boolean): THREE.Group {
  const g = new THREE.Group();
  g.name = mod.id;
  g.userData.blockId = mod.id;
  g.position.set(mod.x, 0, mod.z);
  g.rotation.y = mod.rotY;

  const frame = new THREE.MeshStandardMaterial({
    color: selected ? 0xb8e6ff : GRAY,
    roughness: 0.45,
    metalness: 0.15,
  });
  const emissiveCyan = new THREE.MeshStandardMaterial({
    color: CYAN,
    emissive: CYAN,
    emissiveIntensity: 1.4,
    roughness: 0.3,
  });
  const emissiveMag = new THREE.MeshStandardMaterial({
    color: MAGENTA,
    emissive: MAGENTA,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });

  if (mod.kind === 'rack') {
    const post = 0.06;
    const bays = Math.max(1, mod.bays ?? 1);
    const bayRows = Math.max(1, mod.bayRows ?? 1);
    const bayGap = 0.08;
    const baysAlong = Math.max(1, Math.ceil(bays / bayRows));
    const bayW = (mod.w - (baysAlong - 1) * bayGap) / baysAlong;
    const bayD = (mod.d - (bayRows - 1) * bayGap) / bayRows;
    const traysPerShelf = Math.max(1, mod.cols);
    const pitch = mod.tiers > 0 ? (mod.h - 0.12) / mod.tiers : 0.38;
    let trayIndex = 0;

    for (let br = 0; br < bayRows; br++) {
      for (let bc = 0; bc < baysAlong; bc++) {
        const bayIndex = br * baysAlong + bc;
        if (bayIndex >= bays) continue;
        const bx = -mod.w / 2 + bc * (bayW + bayGap) + bayW / 2;
        const bz = -mod.d / 2 + br * (bayD + bayGap) + bayD / 2;
        addBox(g, post, mod.h, post, bx - bayW / 2 + post / 2, mod.h / 2, bz - bayD / 2 + post / 2, frame);
        addBox(g, post, mod.h, post, bx + bayW / 2 - post / 2, mod.h / 2, bz - bayD / 2 + post / 2, frame);
        addBox(g, post, mod.h, post, bx - bayW / 2 + post / 2, mod.h / 2, bz + bayD / 2 - post / 2, frame);
        addBox(g, post, mod.h, post, bx + bayW / 2 - post / 2, mod.h / 2, bz + bayD / 2 - post / 2, frame);
        addBox(g, post * 0.45, mod.h, post * 0.45, bx - bayW / 2, mod.h / 2, bz, emissiveMag);
        addBox(g, post * 0.45, mod.h, post * 0.45, bx + bayW / 2, mod.h / 2, bz, emissiveMag);

        const trayW = (bayW - 0.08) / traysPerShelf;
        for (let t = 0; t < mod.tiers; t++) {
          const y = 0.08 + t * pitch;
          addBox(g, bayW - 0.04, 0.035, bayD - 0.04, bx, y, bz, frame);
          for (let i = 0; i < traysPerShelf; i++) {
            if (trayIndex >= mod.unitCount) break;
            const tx = bx - bayW / 2 + 0.04 + (i + 0.5) * trayW;
            addBox(g, trayW - 0.04, 0.02, bayD - 0.1, tx, y + 0.025, bz, frame);
            addCrops(g, mod, tx - (trayW - 0.08) / 2, trayW - 0.08, y + 0.04, bz - bayD / 2 + 0.08, bayD - 0.16, 0.1);
            const barY = y + pitch - 0.04;
            addBox(g, trayW - 0.06, 0.012, 0.04, tx, barY, bz, emissiveCyan);
            const grow = new THREE.PointLight(CYAN, 0.55, 0.55);
            grow.position.set(tx, barY - 0.02, bz);
            grow.userData.growLight = true;
            grow.userData.baseIntensity = 0.55;
            g.add(grow);
            trayIndex += 1;
          }
        }
      }
    }
  } else {
    addBox(g, mod.w, mod.h, mod.d, 0, mod.h / 2, 0, frame);
    addBox(g, mod.w - 0.08, 0.02, 0.03, 0, mod.h + 0.08, -mod.d / 2 + 0.04, emissiveCyan);
    addBox(g, 0.03, mod.h + 0.1, 0.03, -mod.w / 2, (mod.h + 0.1) / 2, 0, emissiveMag);
    addBox(g, 0.03, mod.h + 0.1, 0.03, mod.w / 2, (mod.h + 0.1) / 2, 0, emissiveMag);
    addCrops(g, mod, -mod.w / 2 + 0.06, mod.w - 0.12, mod.h, -mod.d / 2 + 0.06, mod.d - 0.12, 0.18);
  }

  const screenMat = new THREE.MeshBasicMaterial({ map: makeStatusTexture(mod) });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), screenMat);
  screen.position.set(mod.w / 2 + 0.02, Math.min(mod.h + 0.25, 1.1), 0);
  screen.rotation.y = Math.PI / 2;
  g.add(screen);

  if (selected) {
    const outline = new THREE.Mesh(
      new THREE.BoxGeometry(mod.w + 0.08, mod.h + 0.16, mod.d + 0.08),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.7 }),
    );
    outline.position.y = mod.h / 2 + 0.04;
    g.add(outline);
  }

  return g;
}

function setCamera(camera: THREE.PerspectiveCamera, room: RoomSpec, mode: CameraMode) {
  const cx = room.width / 2;
  const cz = room.depth / 2;
  if (mode === 'overhead') {
    camera.position.set(cx, Math.max(8, Math.max(room.width, room.depth) * 1.4), cz + 0.01);
    camera.lookAt(cx, 0, cz);
  } else {
    const dist = Math.max(room.width, room.depth) * 1.15;
    camera.position.set(cx + dist * 0.55, dist * 0.72, cz + dist * 0.55);
    camera.lookAt(cx, 0.4, cz);
  }
}

export function FarmVisualizer({
  isActive,
  systemBlocks,
  room,
  selectedBlockId,
  onSelectBlock,
}: FarmVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraModeRef = useRef<CameraMode>('iso');
  const selectedRef = useRef(selectedBlockId);
  const onSelectRef = useRef(onSelectBlock);
  const blocksRef = useRef(systemBlocks);
  const roomRef = useRef(room);
  const runningRef = useRef(false);
  const apiRef = useRef<{
    rebuild: () => void;
    setMode: (m: CameraMode) => void;
    exportPng: () => void;
  } | null>(null);

  selectedRef.current = selectedBlockId;
  onSelectRef.current = onSelectBlock;
  blocksRef.current = systemBlocks;
  roomRef.current = room;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12141a);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 2;
    controls.maxDistance = 28;

    scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x2a2430, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(6, 10, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);

    const farmRoot = new THREE.Group();
    scene.add(farmRoot);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    let raf = 0;

    const resize = () => {
      const w = mount.clientWidth;
      const h = Math.max(200, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let lastRoomSig = '';
    const rebuild = () => {
      while (farmRoot.children.length) {
        const child = farmRoot.children[0];
        farmRoot.remove(child);
        child.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              if ('map' in m && m.map) (m.map as THREE.Texture).dispose();
              m.dispose();
            });
          }
        });
      }

      const r = roomRef.current;
      const packed = autoPackModules(blocksRef.current, r);
      const wallH = Math.max(2.4, ...packed.map((m) => m.h + 0.5));
      const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR, roughness: 0.9 });
      const wallMat = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.85 });
      if (packed.some((m) => m.overflow)) floorMat.color.set(0xf4d4d4);

      const floor = new THREE.Mesh(new THREE.BoxGeometry(r.width, 0.08, r.depth), floorMat);
      floor.position.set(r.width / 2, -0.04, r.depth / 2);
      floor.receiveShadow = true;
      farmRoot.add(floor);

      const back = new THREE.Mesh(new THREE.BoxGeometry(r.width, wallH, 0.08), wallMat);
      back.position.set(r.width / 2, wallH / 2, r.depth);
      farmRoot.add(back);

      const left = new THREE.Mesh(new THREE.BoxGeometry(0.08, wallH, r.depth), wallMat);
      left.position.set(0, wallH / 2, r.depth / 2);
      farmRoot.add(left);

      for (const mod of packed) {
        farmRoot.add(buildModule(mod, mod.id === selectedRef.current));
      }

      const roomSig = `${r.width}:${r.depth}`;
      if (roomSig !== lastRoomSig) {
        lastRoomSig = roomSig;
        controls.target.set(r.width / 2, 0.35, r.depth / 2);
        setCamera(camera, r, cameraModeRef.current);
      }
      controls.update();
    };

    const setMode = (m: CameraMode) => {
      cameraModeRef.current = m;
      setCamera(camera, roomRef.current, m);
      controls.target.set(roomRef.current.width / 2, 0.35, roomRef.current.depth / 2);
      controls.update();
    };

    const exportPng = () => {
      const prev = cameraModeRef.current;
      setMode('iso');
      renderer.render(scene, camera);
      const gl = renderer.domElement;
      const out = document.createElement('canvas');
      out.width = gl.width;
      out.height = gl.height + 72;
      const ctx = out.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(gl, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      const unit = roomRef.current.displayUnit;
      const w = metersToDisplay(roomRef.current.width, unit);
      const d = metersToDisplay(roomRef.current.depth, unit);
      ctx.fillText(
        `Hiperlocal  ·  ${w} × ${d} ${unit}  ·  ${blocksRef.current.length} systems`,
        16,
        gl.height + 28,
      );
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        blocksRef.current.map((b) => SYSTEM_TYPE_LABELS[b.systemType]).join('  ·  '),
        16,
        gl.height + 52,
      );
      const a = document.createElement('a');
      a.download = 'hiperlocal-farm.png';
      a.href = out.toDataURL('image/png');
      a.click();
      setMode(prev);
    };

    apiRef.current = { rebuild, setMode, exportPng };
    rebuild();
    resize();

    const onPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(farmRoot.children, true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData.blockId) {
            onSelectRef.current(o.userData.blockId);
            return;
          }
          o = o.parent;
        }
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!runningRef.current) return;
      const t = clock.getElapsedTime();
      farmRoot.traverse((obj) => {
        if (obj instanceof THREE.PointLight && obj.userData.growLight) {
          const base = obj.userData.baseIntensity ?? 0.55;
          obj.intensity = base * (1 + Math.sin(t * 2.4) * 0.12);
        }
      });
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    renderer.domElement.addEventListener('pointerdown', onPointer);
    renderer.domElement.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.rebuild();
  }, [systemBlocks, room, selectedBlockId]);

  useEffect(() => {
    const sync = () => {
      runningRef.current = isActive && document.visibilityState === 'visible';
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [isActive]);

  return (
    <div className="relative w-full h-full min-h-[280px]">
      <div
        ref={mountRef}
        className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-[#12141a]"
      />
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          type="button"
          onClick={() => apiRef.current?.setMode('iso')}
          className="px-2 py-1 rounded-md text-[10px] bg-black/50 border border-white/15 text-white/80 hover:text-white"
        >
          3/4
        </button>
        <button
          type="button"
          onClick={() => apiRef.current?.setMode('overhead')}
          className="px-2 py-1 rounded-md text-[10px] bg-black/50 border border-white/15 text-white/80 hover:text-white"
        >
          Top
        </button>
        <button
          type="button"
          onClick={() => apiRef.current?.exportPng()}
          className="px-2 py-1 rounded-md text-[10px] bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30"
        >
          Export
        </button>
      </div>
    </div>
  );
}

export function RoomControls({
  room,
  onChange,
  overflow,
}: {
  room: RoomSpec;
  onChange: (room: RoomSpec) => void;
  overflow: boolean;
}) {
  const unit = room.displayUnit;
  const w = metersToDisplay(room.width, unit);
  const d = metersToDisplay(room.depth, unit);

  const setDim = (key: 'width' | 'depth', displayVal: number) => {
    const meters = unit === 'ft' ? displayVal / 3.28084 : displayVal;
    onChange({ ...room, [key]: Math.max(1, meters) });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-white/35 uppercase tracking-wider">Room</span>
      <input
        type="number"
        min={1}
        step={0.5}
        value={w}
        onChange={(e) => setDim('width', Number(e.target.value))}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-16 bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-center text-xs text-white"
        aria-label="Room width"
      />
      <span className="text-white/30 text-xs">×</span>
      <input
        type="number"
        min={1}
        step={0.5}
        value={d}
        onChange={(e) => setDim('depth', Number(e.target.value))}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-16 bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-center text-xs text-white"
        aria-label="Room depth"
      />
      <button
        type="button"
        onClick={() => onChange({ ...room, displayUnit: unit === 'm' ? 'ft' : 'm' })}
        className="px-2 py-1 rounded-full text-[10px] border border-white/15 text-white/70 hover:text-white"
      >
        {unit === 'm' ? 'm' : 'ft'}
      </button>
      {overflow && (
        <span className="text-[10px] text-amber-400/90">Systems extend past the room</span>
      )}
    </div>
  );
}

export function roomHasOverflow(blocks: SystemBlock[], room: RoomSpec) {
  return autoPackModules(blocks, room).some((m) => m.overflow);
}
