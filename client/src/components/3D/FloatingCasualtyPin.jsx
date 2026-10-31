import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * FloatingCasualtyPin Component
 * Renders 3D spatial room pins using @react-three/drei <Html> displaying:
 * ⚠️ Floor N (Rm XXX): X Trapped
 */
export default function FloatingCasualtyPin({
  marker,
  onRescueStep,
  onInspect
}) {
  const groupRef = useRef();
  const ringRef = useRef();

  const {
    floorNumber = 1,
    roomNumber = '101',
    trappedCount = 1,
    hazardType = 'FIRE',
    coordinatesOffset = [0, 0, 0],
    status = 'TRAPPED'
  } = marker || {};

  const floorSpacing = 1.45;
  const baseY = (floorNumber - 1) * floorSpacing + 0.15;
  const posX = coordinatesOffset[0] || 0;
  const posY = baseY + 0.65;
  const posZ = coordinatesOffset[2] || 0;

  const isRescued = status === 'RESCUED' || trappedCount === 0;
  const isFire = hazardType === 'FIRE';

  // Animate floating bob and rotating ring
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = 0.25 + Math.sin(t * 3 + floorNumber) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
      const s = 1 + Math.sin(t * 4) * 0.15;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  if (isRescued) {
    return null;
  }

  return (
    <group position={[posX, posY, posZ]}>
      {/* 3D Vertical Beacon Line to Floor */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshBasicMaterial
          color={isFire ? '#ff2233' : '#ffaa00'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 3D Spatial Ground Target Ring */}
      <mesh ref={ringRef} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.28, 16]} />
        <meshBasicMaterial
          color={isFire ? '#ff2233' : '#ffaa00'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Spatial HTML Badge - 40% larger and fully visible */}
      <group ref={groupRef}>
        <Html position={[0, 0.25, 0]} center distanceFactor={7.8} zIndexRange={[100, 0]}>
          <div className="relative group select-none pointer-events-auto">
            {/* Pulsing Radar Aura */}
            <div
              className={`absolute -inset-2 rounded-2xl opacity-80 blur-md animate-ping ${
                isFire ? 'bg-red-500' : 'bg-amber-500'
              }`}
            />

            {/* Main Spatial Card (Enlarged ~40%) */}
            <div
              onClick={() => onInspect?.(marker)}
              className={`relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-xl font-mono shadow-2xl border-2 backdrop-blur-xl cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                isFire
                  ? 'bg-slate-950/98 border-red-500 text-red-100 shadow-red-950/90'
                  : 'bg-slate-950/98 border-amber-500 text-amber-100 shadow-amber-950/90'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-tight whitespace-nowrap">
                <span className="text-base">⚠️</span>
                <span className="text-[13px]">
                  Floor {floorNumber} (Rm {roomNumber})
                </span>
              </div>

              {/* Trapped Casualty Count & Quick Action */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/15 text-xs">
                <span className="font-extrabold text-white bg-red-600 px-2 py-0.5 rounded-md shadow-sm">
                  {trappedCount} Trapped
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRescueStep?.(floorNumber);
                  }}
                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] flex items-center gap-1 shadow-md transition-all hover:scale-105 active:scale-95"
                  title="Rescue 1 occupant"
                >
                  <span>Rescued -1</span>
                </button>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
