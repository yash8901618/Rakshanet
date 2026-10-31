import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * FloorSlab Component
 * Renders an interactive, semi-transparent tactical floor slab with dynamic casualty heatmapping:
 * - Normal: Cool Cyan #1e293b (0.2 opacity)
 * - Medium Risk (1-3 trapped): Amber #ffaa00 (0.6 opacity)
 * - High Risk (Fire / 4+ trapped): Pulsing Red #ff2233 (0.85 opacity)
 */
export default function FloorSlab({
  floorNumber,
  trappedCount = 0,
  hazardLevel = 'LOW',
  activeHazard = null,
  isSelected = false,
  isIsolated = false,
  onSelectFloor
}) {
  const meshRef = useRef();
  const wireframeRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Height and Y elevation calculation (Floor 1 at y=0, Floor 6 at y=7.5)
  const floorHeight = 0.22;
  const floorSpacing = 1.45;
  const yPos = (floorNumber - 1) * floorSpacing;

  // Determine floor status color and risk
  const isHighRisk = hazardLevel === 'HIGH' || trappedCount >= 4 || activeHazard === 'FIRE';
  const isMedRisk = hazardLevel === 'MEDIUM' || (trappedCount > 0 && !isHighRisk);

  // Base color logic
  const targetColor = useMemo(() => {
    if (isHighRisk) return new THREE.Color('#ff2233');
    if (isMedRisk) return new THREE.Color('#ffaa00');
    return new THREE.Color('#1e293b');
  }, [isHighRisk, isMedRisk]);

  const targetEdgeColor = useMemo(() => {
    if (isHighRisk) return new THREE.Color('#ff4d5a');
    if (isMedRisk) return new THREE.Color('#fbbf24');
    return new THREE.Color('#0ea5e9');
  }, [isHighRisk, isMedRisk]);

  const baseOpacity = useMemo(() => {
    if (isHighRisk) return 0.85;
    if (isMedRisk) return 0.6;
    return 0.22;
  }, [isHighRisk, isMedRisk]);

  // Pulse animation for high risk floors and hover states
  useFrame(({ clock }) => {
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material;
      if (isHighRisk) {
        // Dynamic breathing pulse
        const t = clock.getElapsedTime() * 4;
        const pulse = 0.75 + Math.sin(t) * 0.15;
        mat.opacity = pulse;
        mat.emissiveIntensity = 0.4 + Math.sin(t) * 0.3;
      } else if (hovered || isSelected) {
        mat.opacity = Math.min(0.9, baseOpacity + 0.25);
        mat.emissiveIntensity = 0.2;
      } else {
        mat.opacity = isIsolated && !isSelected ? 0.08 : baseOpacity;
        mat.emissiveIntensity = 0.05;
      }
    }
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Main Floor Slab Solid Surface */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFloor?.(floorNumber);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[7, floorHeight, 5]} />
        <meshStandardMaterial
          color={targetColor}
          emissive={targetColor}
          emissiveIntensity={0.1}
          transparent={true}
          opacity={baseOpacity}
          roughness={0.2}
          metalness={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Perimeter Glow Edge Line */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(7.02, floorHeight + 0.02, 5.02)]} />
        <lineBasicMaterial
          color={hovered || isSelected ? '#ffffff' : targetEdgeColor}
          linewidth={2}
          transparent={true}
          opacity={isHighRisk ? 0.95 : 0.65}
        />
      </lineSegments>

      {/* Internal Room Partition Guides (Architectural X-Ray) */}
      <group position={[0, floorHeight / 2 + 0.01, 0]}>
        {/* Hallway divider */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.6, 0.4]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} depthWrite={false} />
        </mesh>

        {/* Room partitions */}
        {[-2.2, -0.7, 0.7, 2.2].map((xOffset, idx) => (
          <mesh key={idx} position={[xOffset, 0.01, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 2.0]} />
            <meshBasicMaterial
              color={isHighRisk ? '#ff2233' : isMedRisk ? '#ffaa00' : '#0284c7'}
              transparent
              opacity={0.08}
              depthWrite={false}
            />
          </mesh>
        ))}
        {[-2.2, -0.7, 0.7, 2.2].map((xOffset, idx) => (
          <mesh key={`b-${idx}`} position={[xOffset, 0.01, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 2.0]} />
            <meshBasicMaterial
              color={isHighRisk ? '#ff2233' : isMedRisk ? '#ffaa00' : '#0284c7'}
              transparent
              opacity={0.08}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* 3D Floating Floor Designation Tag */}
      <Html position={[-3.8, 0.1, 2.4]} center distanceFactor={14}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectFloor?.(floorNumber);
          }}
          className={`cursor-pointer px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider transition-all duration-300 border select-none whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
            isSelected
              ? 'bg-sky-500 text-white border-sky-300 scale-110 shadow-sky-500/50'
              : isHighRisk
              ? 'bg-red-950/90 text-red-300 border-red-500/60 animate-pulse shadow-red-900/50'
              : isMedRisk
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-900/40'
              : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:border-sky-400 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          <span>LEVEL {floorNumber}</span>
          {trappedCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                isHighRisk ? 'bg-red-600 text-white' : 'bg-amber-600 text-black'
              }`}
            >
              {trappedCount} TRAPPED
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
