import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Face3DViewerProps {
  lipColor: string;
  lipDepth: number; // 0 to 100
  lipEnabled: boolean;
  cheekColor: string;
  cheekAmount: number; // 0 to 100
  cheekEnabled: boolean;
  eyeColor: string;
  eyeIntensity: number; // 0 to 100
  eyeEnabled: boolean;
  baseFinish: 'dewy' | 'matte';
  baseCoverage: number;
}

export const Face3DViewer: React.FC<Face3DViewerProps> = ({
  lipColor,
  lipDepth,
  lipEnabled,
  cheekColor,
  cheekAmount,
  cheekEnabled,
  eyeColor,
  eyeIntensity,
  eyeEnabled,
  baseFinish,
  baseCoverage
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const lipMeshRef = useRef<THREE.Mesh | null>(null);
  const leftCheekRef = useRef<THREE.Mesh | null>(null);
  const rightCheekRef = useRef<THREE.Mesh | null>(null);
  const leftEyeShadeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeShadeRef = useRef<THREE.Mesh | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Rotation interaction
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 400;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xFAF6F3);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xfff5ee, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfceae6, 1.0);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffe4e1, 0.9);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);

    // 5. Procedural Anatomical 3D Head Group
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // 5.1 Head base (oval egg shape)
    const headGeo = new THREE.SphereGeometry(1, 48, 48);
    headGeo.scale(0.88, 1.15, 0.92);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xF7D8CC,
      roughness: baseFinish === 'dewy' ? 0.35 : 0.65,
      metalness: 0.04,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);
    headMeshRef.current = headMesh;

    // 5.2 Hair volume
    const hairGeo = new THREE.SphereGeometry(1.02, 32, 32);
    hairGeo.scale(0.92, 1.18, 0.94);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1E1A18,
      roughness: 0.8,
      metalness: 0.1
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.12, -0.08);
    headGroup.add(hairMesh);

    // 5.3 Nose bridge
    const noseGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
    noseGeo.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xF5CFC0,
      roughness: 0.4
    });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.position.set(0, -0.05, 0.9);
    headGroup.add(noseMesh);

    // 5.4 Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221A15 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), eyeMat);
    leftEye.position.set(-0.32, 0.15, 0.78);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), eyeMat);
    rightEye.position.set(0.32, 0.15, 0.78);
    headGroup.add(leftEye, rightEye);

    // 5.5 Eye shadow layers (left & right)
    const eyeShadeGeo = new THREE.RingGeometry(0.06, 0.16, 24);
    const eyeShadeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(eyeColor),
      transparent: true,
      opacity: eyeEnabled ? (eyeIntensity / 100) * 0.75 : 0,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const leftEyeShade = new THREE.Mesh(eyeShadeGeo, eyeShadeMat);
    leftEyeShade.position.set(-0.32, 0.17, 0.84);
    const rightEyeShade = new THREE.Mesh(eyeShadeGeo, eyeShadeMat.clone());
    rightEyeShade.position.set(0.32, 0.17, 0.84);
    headGroup.add(leftEyeShade, rightEyeShade);
    leftEyeShadeRef.current = leftEyeShade;
    rightEyeShadeRef.current = rightEyeShade;

    // 5.6 Cheek Blush layers (soft circular gradient patches)
    const cheekGeo = new THREE.CircleGeometry(0.24, 32);
    const cheekMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cheekColor),
      transparent: true,
      opacity: cheekEnabled ? (cheekAmount / 100) * 0.55 : 0,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.46, -0.15, 0.73);
    leftCheek.rotation.y = -0.35;
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat.clone());
    rightCheek.position.set(0.46, -0.15, 0.73);
    rightCheek.rotation.y = 0.35;
    headGroup.add(leftCheek, rightCheek);
    leftCheekRef.current = leftCheek;
    rightCheekRef.current = rightCheek;

    // 5.7 Realistic Lip mesh (lips contour)
    const lipGeo = new THREE.TorusGeometry(0.18, 0.055, 16, 32, Math.PI);
    lipGeo.rotateZ(Math.PI);
    const lipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(lipColor),
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: lipEnabled ? Math.min(1, (lipDepth / 100) * 0.95 + 0.15) : 0.35
    });
    const lipMesh = new THREE.Mesh(lipGeo, lipMat);
    lipMesh.position.set(0, -0.42, 0.82);
    headGroup.add(lipMesh);
    lipMeshRef.current = lipMesh;

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Gentle breathing idle rotation if not dragging
      if (!isDraggingRef.current) {
        headGroup.rotation.y += (rotRef.current.y - headGroup.rotation.y) * 0.1;
        headGroup.rotation.x += (rotRef.current.x - headGroup.rotation.x) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Mouse / Touch Drag Rotation Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(-0.4, Math.min(0.4, rotRef.current.x + dy * 0.008));
      headGroup.rotation.y = rotRef.current.y;
      headGroup.rotation.x = rotRef.current.x;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseRef.current.x;
      const dy = e.touches[0].clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(-0.4, Math.min(0.4, rotRef.current.x + dy * 0.008));
      headGroup.rotation.y = rotRef.current.y;
      headGroup.rotation.x = rotRef.current.x;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(2.4, Math.min(5.2, camera.position.z + e.deltaY * 0.002));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);

      // Dispose geometries and materials
      headGeo.dispose();
      headMat.dispose();
      hairGeo.dispose();
      hairMat.dispose();
      noseGeo.dispose();
      noseMat.dispose();
      eyeMat.dispose();
      eyeShadeGeo.dispose();
      eyeShadeMat.dispose();
      cheekGeo.dispose();
      cheekMat.dispose();
      lipGeo.dispose();
      lipMat.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update dynamic colors and opacities when props change
  useEffect(() => {
    if (lipMeshRef.current) {
      const mat = lipMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(lipColor);
      mat.opacity = lipEnabled ? Math.min(1, (lipDepth / 100) * 0.95 + 0.15) : 0.35;
      mat.needsUpdate = true;
    }

    if (leftCheekRef.current && rightCheekRef.current) {
      const lMat = leftCheekRef.current.material as THREE.MeshStandardMaterial;
      const rMat = rightCheekRef.current.material as THREE.MeshStandardMaterial;
      lMat.color.set(cheekColor);
      rMat.color.set(cheekColor);
      const op = cheekEnabled ? (cheekAmount / 100) * 0.55 : 0;
      lMat.opacity = op;
      rMat.opacity = op;
      lMat.needsUpdate = true;
      rMat.needsUpdate = true;
    }

    if (leftEyeShadeRef.current && rightEyeShadeRef.current) {
      const leMat = leftEyeShadeRef.current.material as THREE.MeshStandardMaterial;
      const reMat = rightEyeShadeRef.current.material as THREE.MeshStandardMaterial;
      leMat.color.set(eyeColor);
      reMat.color.set(eyeColor);
      const eOp = eyeEnabled ? (eyeIntensity / 100) * 0.75 : 0;
      leMat.opacity = eOp;
      reMat.opacity = eOp;
      leMat.needsUpdate = true;
      reMat.needsUpdate = true;
    }

    if (headMeshRef.current) {
      const hMat = headMeshRef.current.material as THREE.MeshStandardMaterial;
      hMat.roughness = baseFinish === 'dewy' ? 0.35 : 0.65;
      hMat.needsUpdate = true;
    }
  }, [lipColor, lipDepth, lipEnabled, cheekColor, cheekAmount, cheekEnabled, eyeColor, eyeIntensity, eyeEnabled, baseFinish, baseCoverage]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#FAF6F3] rounded-3xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* 3D Model Floating Tips */}
      <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-stone-600 border border-stone-200 shadow-2xs pointer-events-none flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>3D 实时光影交互 · 按住拖拽旋转 · 滚轮放大缩小</span>
      </div>

      <button
        onClick={() => {
          rotRef.current = { x: 0, y: 0 };
          if (cameraRef.current) cameraRef.current.position.set(0, 0, 3.8);
        }}
        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-stone-200 shadow-xs transition-colors"
      >
        重置视角
      </button>
    </div>
  );
};
