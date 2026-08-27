"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Evenly distribute N points across a sphere (Fibonacci lattice). */
function fibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

/** Random points in a spherical shell — lightweight background starfield. */
function starShell(count: number, inner: number, outer: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const radius = inner + Math.random() * (outer - inner);
    positions[i * 3] = s * Math.cos(theta) * radius;
    positions[i * 3 + 1] = u * radius;
    positions[i * 3 + 2] = s * Math.sin(theta) * radius;
  }
  return positions;
}

function NetworkOrb({ detail }: { detail: "high" | "low" }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const nodeCount = detail === "high" ? 640 : 260;
  const accentCount = detail === "high" ? 80 : 36;

  const nodePositions = useMemo(() => fibonacciSphere(nodeCount, 2), [nodeCount]);
  const accentPositions = useMemo(() => fibonacciSphere(accentCount, 2.02), [accentCount]);

  // Window-level tracking: the copy/scrim sit above the canvas, so
  // canvas-local R3F pointer events would never fire.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    // slow autonomous rotation
    group.current.rotation.y += delta * 0.08;

    // gentle pointer parallax
    pointer.current.x += (target.current.x * 0.25 - pointer.current.x) * 0.04;
    pointer.current.y += (-target.current.y * 0.18 - pointer.current.y) * 0.04;
    group.current.rotation.x = pointer.current.y;
    group.current.rotation.z = pointer.current.x * 0.3;
  });

  return (
    <group ref={group}>
      {/* Primary node field */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#8fd6ff"
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>

      {/* Sparse accent nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[accentPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ff6a1a"
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {/* Equatorial wireframe to suggest a surface */}
      <mesh>
        <icosahedronGeometry args={[2, detail === "high" ? 2 : 1]} />
        <meshBasicMaterial color="#2a3a5e" wireframe transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {/* Orbital rings */}
      <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
        <torusGeometry args={[2.7, 0.004, 6, 96]} />
        <meshBasicMaterial color="#41c7ff" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 1.9, -0.5, 0.3]}>
        <torusGeometry args={[3.1, 0.003, 6, 96]} />
        <meshBasicMaterial color="#ff6a1a" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Luminous core */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#ffd9bf" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function StarField({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => starShell(count, 16, 40), [count]);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y -= delta * 0.006;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#c9d8f2"
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

export default function HeroScene({
  detail = "high",
  active = true,
}: {
  detail?: "high" | "low";
  /** When false the render loop stops entirely (hero offscreen or tab hidden). */
  active?: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <NetworkOrb detail={detail} />
      <StarField count={detail === "high" ? 900 : 420} />
    </Canvas>
  );
}
