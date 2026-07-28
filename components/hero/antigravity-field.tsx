"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";

/**
 * Antigravity — a subtle field of small violet spheres. They rest invisibly
 * scattered across the hero and only fade in where they sit on a soft ring
 * around the cursor, so the effect reads as a gentle shimmer trailing the mouse
 * rather than a busy confetti field. Adapted from the react-bits Antigravity
 * recipe (kept faithful to its scale logic), tuned to the "minimal" settings.
 *
 * Pointer tracking is bound to `sourceRef` (the hero <section>) so the ring
 * follows the mouse even over the headline and buttons layered on top. Touch /
 * reduced-motion users get a faint static scatter instead (no cursor to chase).
 */

const COLOR = "#7d69ed";

type FieldProps = {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  color?: string;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  fieldStrength?: number;
  /** Base opacity of each dot (bump it up on dark backgrounds). */
  opacity?: number;
  /** When true, particles sit still (touch devices / reduced motion). */
  reduced?: boolean;
};

function AntigravityInner({
  count = 400,
  magnetRadius = 8,
  ringRadius = 12,
  waveSpeed = 0.4,
  waveAmplitude = 1.5,
  particleSize = 0.8,
  lerpSpeed = 0.07,
  color = COLOR,
  particleVariance = 0.5,
  rotationSpeed = 0,
  depthFactor = 0.8,
  pulseSpeed = 3.4,
  fieldStrength = 5.4,
  opacity = 0.45,
  reduced = false,
}: FieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const virtualMouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  const particles = useMemo(() => {
    const temp = [];
    const width = viewport.width || 100;
    const height = viewport.height || 100;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      temp.push({
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
      });
    }
    return temp;
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Static fallback: a faint scatter, laid out once.
    if (reduced) {
      if (initialized.current) return;
      particles.forEach((p, i) => {
        dummy.position.set(p.mx, p.my, p.mz * depthFactor);
        dummy.scale.setScalar(0.6 * particleSize);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
      return;
    }
    initialized.current = false;

    const { viewport: v, pointer: m } = state;
    const destX = (m.x * v.width) / 2;
    const destY = (m.y * v.height) / 2;

    const smoothFactor = 0.05;
    virtualMouse.current.x += (destX - virtualMouse.current.x) * smoothFactor;
    virtualMouse.current.y += (destY - virtualMouse.current.y) * smoothFactor;

    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed;

    particles.forEach((particle, i) => {
      particle.t += particle.speed / 2;
      const t = particle.t;
      const { mx, my, mz, cz, randomRadiusOffset } = particle;

      const projectionFactor = 1 - cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;

      const dx = mx - projectedTargetX;
      const dy = my - projectedTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const targetPos = { x: mx, y: my, z: mz * depthFactor };

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude);
        const deviation = randomRadiusOffset * (5 / (fieldStrength + 0.1));
        const currentRingRadius = ringRadius + wave + deviation;
        targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
        targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
        targetPos.z =
          mz * depthFactor + Math.sin(t) * (waveAmplitude * depthFactor);
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);

      const currentDistToMouse = Math.sqrt(
        Math.pow(particle.cx - projectedTargetX, 2) +
          Math.pow(particle.cy - projectedTargetY, 2),
      );
      const distFromRing = Math.abs(currentDistToMouse - ringRadius);
      // Only particles sitting on the ring are visible — everything else fades
      // to scale 0. This is what keeps the effect subtle.
      const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));

      const finalScale =
        scaleFactor *
        (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) *
        particleSize;
      dummy.scale.setScalar(finalScale);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

export default function AntigravityField({
  sourceRef,
  color = COLOR,
  opacity = 0.45,
}: {
  sourceRef: RefObject<HTMLElement | null>;
  /** Dot color (defaults to brand violet). */
  color?: string;
  /** Dot opacity — bump up on dark backgrounds. */
  opacity?: number;
}) {
  const [reduced, setReduced] = useState(true);
  // Fewer spheres on smaller screens (density + mobile GPU headroom).
  const [count, setCount] = useState(200);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none)");
    const compute = () => {
      setReduced(motion.matches || coarse.matches);
      const w = window.innerWidth;
      setCount(w < 640 ? 150 : w < 1024 ? 250 : 400);
    };
    compute();
    motion.addEventListener("change", compute);
    coarse.addEventListener("change", compute);
    window.addEventListener("resize", compute);
    return () => {
      motion.removeEventListener("change", compute);
      coarse.removeEventListener("change", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <Canvas
      className="!absolute inset-0 -z-10"
      style={{ pointerEvents: "none" }}
      camera={{ position: [0, 0, 50], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      eventSource={sourceRef as RefObject<HTMLElement>}
      eventPrefix="client"
    >
      <AntigravityInner
        reduced={reduced}
        count={count}
        color={color}
        opacity={opacity}
      />
    </Canvas>
  );
}
