"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Theme palettes — muted, editorial tones that support the content
 * instead of competing with it. Light mode reads steel-blue on white;
 * dark mode reads luminous blue-gray on near-black.
 */
const PALETTES = {
  light: {
    nodes: "#4a6b96",
    accentNodes: "#171717",
    wireframe: "#8fa6c4",
    ringA: "#0d74ce",
    ringB: "#9aa8bc",
    core: "#171717",
    stars: "#93a7c4",
    arcA: "#0d74ce",
    arcB: "#a5b3c8",
    pulse: "#171717",
  },
  dark: {
    nodes: "#9db8dd",
    accentNodes: "#ffffff",
    wireframe: "#33415e",
    ringA: "#47c2ff",
    ringB: "#8195b5",
    core: "#f5f5f6",
    stars: "#c9d8f2",
    arcA: "#47c2ff",
    arcB: "#7286a5",
    pulse: "#ffffff",
  },
} as const;

export type ScenePalette = keyof typeof PALETTES;
type Palette = (typeof PALETTES)[ScenePalette];

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

function NetworkOrb({ detail, palette }: { detail: "high" | "low"; palette: Palette }) {
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
          color={palette.nodes}
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
          color={palette.accentNodes}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {/* Funding flows between nodes */}
      <ConnectionArcs detail={detail} palette={palette} />

      {/* Equatorial wireframe to suggest a surface */}
      <mesh>
        <icosahedronGeometry args={[2, detail === "high" ? 2 : 1]} />
        <meshBasicMaterial color={palette.wireframe} wireframe transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {/* Orbital rings */}
      <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
        <torusGeometry args={[2.7, 0.004, 6, 96]} />
        <meshBasicMaterial color={palette.ringA} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 1.9, -0.5, 0.3]}>
        <torusGeometry args={[3.1, 0.003, 6, 96]} />
        <meshBasicMaterial color={palette.ringB} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Luminous core */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={palette.core} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function StarField({ count, color }: { count: number; color: string }) {
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
        color={color}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Funding flows: raised arcs connecting network nodes, each pulsing on
 * its own phase while a bright pulse travels backer → campaign along
 * the curve. The visual thesis of the whole hero.
 */
function ConnectionArcs({ detail, palette }: { detail: "high" | "low"; palette: Palette }) {
  const arcCount = detail === "high" ? 22 : 10;
  const pulsePoints = useRef<THREE.Points>(null);

  const { lines, curves, pulsePositions } = useMemo(() => {
    const nodeField = fibonacciSphere(180, 2.01);
    const nodeTotal = nodeField.length / 3;
    const pickNode = () => {
      const i = Math.floor(Math.random() * nodeTotal);
      return new THREE.Vector3(nodeField[i * 3], nodeField[i * 3 + 1], nodeField[i * 3 + 2]);
    };

    const curves: THREE.QuadraticBezierCurve3[] = [];
    const lines: THREE.Line[] = [];
    for (let i = 0; i < arcCount; i++) {
      const a = pickNode();
      let b = pickNode();
      let guard = 0;
      while (a.distanceTo(b) < 1.4 && guard++ < 8) b = pickNode();

      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(2 + a.distanceTo(b) * 0.42);

      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? palette.arcA : palette.arcB,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
      lines.push(new THREE.Line(geometry, material));
      curves.push(curve);
    }

    return { lines, curves, pulsePositions: new Float32Array(arcCount * 3) };
  }, [arcCount, palette]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    lines.forEach((line, i) => {
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = 0.08 + 0.42 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 0.7));
    });

    const geometry = pulsePoints.current?.geometry;
    if (!geometry) return;
    const attr = geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < curves.length; i++) {
      const u = (t * 0.085 + i / curves.length) % 1;
      const p = curves[i].getPoint(u);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
  });

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      <points ref={pulsePoints}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={palette.pulse}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function HeroScene({
  detail = "high",
  active = true,
  palette = "dark",
}: {
  detail?: "high" | "low";
  /** When false the render loop stops entirely (hero offscreen or tab hidden). */
  active?: boolean;
  palette?: ScenePalette;
}) {
  const colors = PALETTES[palette];
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <NetworkOrb detail={detail} palette={colors} />
      <StarField count={detail === "high" ? 900 : 420} color={colors.stars} />
    </Canvas>
  );
}
