import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Stars, Float } from '@react-three/drei';
import FloorSlab from './FloorSlab';
import FloatingCasualtyPin from './FloatingCasualtyPin';
import { useCrisisStore } from '../../store/crisisStore';
import { RotateCcw, Layers, Eye, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * Building Structure Columns & Elevator Shaft Core
 */
function BuildingStructuralFrame({ totalFloors = 6, isIsolated, selectedFloor }) {
  const height = totalFloors * 1.45;
  const centerY = height / 2 - 0.7;

  return (
    <group>
      {/* 4 Outer Corner Structural Columns */}
      {[
        [-3.4, centerY, -2.4],
        [3.4, centerY, -2.4],
        [-3.4, centerY, 2.4],
        [3.4, centerY, 2.4]
      ].map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <boxGeometry args={[0.15, height + 0.5, 0.15]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={isIsolated ? 0.1 : 0.35}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Central Reinforced Elevator & Staircase Shaft Core */}
      <mesh position={[0, centerY, 0]}>
        <boxGeometry args={[1.8, height + 0.4, 1.4]} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={isIsolated ? 0.05 : 0.4}
          roughness={0.6}
        />
      </mesh>
      <lineSegments position={[0, centerY, 0]}>
        <edgesGeometry args={[new THREE_BoxGeometry(1.82, height + 0.42, 1.42)]} />
        <lineBasicMaterial color="#0284c7" transparent opacity={0.3} />
      </lineSegments>

      {/* Ground Tactical Baseplate */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#030712" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Custom Helper Box Geometry for structural outlines
import * as THREE from 'three';
const THREE_BoxGeometry = THREE.BoxGeometry;

/**
 * Building3DTwin Component
 * Master 3D Spatial Digital Twin with multi-story wireframe and casualty overlays.
 */
export default function Building3DTwin() {
  const {
    buildingState,
    markers,
    selectedFloor,
    setSelectedFloor,
    rescueFloorStepAction
  } = useCrisisStore();

  const controlsRef = useRef();
  const [isWireframeMode, setIsWireframeMode] = useState(false);
  const [isIsolated, setIsIsolated] = useState(false);

  const totalFloors = buildingState?.totalFloors || 6;
  const floorData = buildingState?.floorData || {};

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 2.5, 0);
      controlsRef.current.reset();
    }
  };

  // Filter markers based on selected floor if isolated
  const visibleMarkers = markers.filter((m) => {
    if (isIsolated && selectedFloor) {
      return m.floorNumber === selectedFloor;
    }
    return true;
  });

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] rounded-2xl overflow-hidden glass-panel border border-slate-800 bg-[#06080e] shadow-2xl">
      {/* 3D Viewport Controls & HUD Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Title Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            3D Digital Twin // X-Ray Telemetry
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 font-mono text-[10px] border border-sky-800/60">
            {buildingState.totalTrapped} Trapped
          </span>
        </div>

        {/* Tactical Control Bar */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60">
          {/* Floor Selection Quick-Filters */}
          <div className="flex items-center gap-1 mr-2 border-r border-slate-800 pr-2">
            <button
              onClick={() => {
                setSelectedFloor(null);
                setIsIsolated(false);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedFloor === null
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ALL
            </button>
            {[1, 2, 3, 4, 5, 6].map((fl) => {
              const trapped = floorData[String(fl)]?.trappedCount || 0;
              const hasCrisis = floorData[String(fl)]?.hazardLevel === 'HIGH';

              return (
                <button
                  key={fl}
                  onClick={() => {
                    if (selectedFloor === fl) {
                      setSelectedFloor(null);
                      setIsIsolated(false);
                    } else {
                      setSelectedFloor(fl);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold relative transition-all ${
                    selectedFloor === fl
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  L{fl}
                  {trapped > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        hasCrisis ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Isolate Selected Floor Toggle */}
          <button
            onClick={() => setIsIsolated(!isIsolated)}
            disabled={!selectedFloor}
            title={selectedFloor ? 'Isolate Floor View' : 'Select a floor first'}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-mono transition-all ${
              isIsolated
                ? 'bg-indigo-600 text-white'
                : selectedFloor
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Isolate</span>
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            title="Reset Camera Angle"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend & Telemetry Indicators Footer */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#1e293b] border border-sky-400"></span>
            <span>Normal Floor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#ffaa00] border border-amber-300"></span>
            <span>1-3 Trapped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#ff2233] border border-red-300 animate-pulse"></span>
            <span>4+ Trapped / Fire</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[12, 11, 16]} fov={38} />
        <OrbitControls
          ref={controlsRef}
          target={[0, 2.5, 0]}
          enableDamping
          dampingFactor={0.06}
          minDistance={6}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />

        {/* Ambient & Directional Scene Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 15]} intensity={1.4} color="#f8fafc" />
        <directionalLight position={[-10, 15, -10]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#0284c7" distance={15} />

        {/* Starfield Ambient Background */}
        <Stars radius={60} depth={30} count={1200} factor={3} saturation={0.5} fade speed={1} />

        {/* Ground Tactical Grid */}
        <Grid
          position={[0, -0.19, 0]}
          args={[20, 20]}
          cellSize={0.8}
          cellThickness={0.6}
          cellColor="#0284c7"
          sectionSize={3.2}
          sectionThickness={1.2}
          sectionColor="#38bdf8"
          fadeDistance={24}
          fadeStrength={1.5}
        />

        {/* Building Structural Columns & Lift Core */}
        <BuildingStructuralFrame
          totalFloors={totalFloors}
          isIsolated={isIsolated}
          selectedFloor={selectedFloor}
        />

        {/* Multi-story Floor Slabs */}
        {Array.from({ length: totalFloors }, (_, i) => i + 1).map((fl) => {
          const data = floorData[String(fl)] || {};
          const isSelected = selectedFloor === fl;

          return (
            <FloorSlab
              key={fl}
              floorNumber={fl}
              trappedCount={data.trappedCount || 0}
              hazardLevel={data.hazardLevel || 'LOW'}
              activeHazard={data.activeHazard}
              isSelected={isSelected}
              isIsolated={isIsolated}
              onSelectFloor={(num) => {
                if (selectedFloor === num) {
                  setSelectedFloor(null);
                  setIsIsolated(false);
                } else {
                  setSelectedFloor(num);
                }
              }}
            />
          );
        })}

        {/* 3D Spatial Casualty Pins */}
        {visibleMarkers.map((marker) => (
          <FloatingCasualtyPin
            key={marker.id}
            marker={marker}
            onRescueStep={(floorNum) => rescueFloorStepAction(floorNum)}
            onInspect={(m) => {
              setSelectedFloor(m.floorNumber);
            }}
          />
        ))}
      </Canvas>
    </div>
  );
}
