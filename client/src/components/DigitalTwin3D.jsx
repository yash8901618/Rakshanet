import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import { 
  Layers, 
  RotateCcw, 
  Flame, 
  HeartPulse, 
  Crosshair, 
  Building2,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { TacticalFloorBreakdown } from './TacticalFloorBreakdown';

// FloorLevelBuilding: 3D Transparent Multi-Floor Stacking with Dynamic Heatmaps
function FloorLevelBuilding({ building, isExploded, selectedFloor, onSelectFloor }) {
  const floorHeight = 1.35;
  const floorGap = isExploded ? 2.3 : floorHeight;

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Multi-Floor Stacking */}
      {Array.from({ length: building.totalFloors || 6 }).map((_, index) => {
        const floorNum = index + 1;
        const floorKey = String(floorNum);
        const floorInfo = building.floorData?.[floorKey] || { trappedCount: 0, hazardLevel: 'LOW' };
        const isSelected = selectedFloor === floorNum;
        const isSecured = floorInfo.trappedCount === 0;

        // Dynamic Floor Heatmap Colors:
        // Cyan = Normal, Amber = Medium, Pulsing Red = High/Fire, Sky Blue on Selected
        let floorColor = '#0284c7'; // Default cyan/blue wireframe
        let emissiveColor = '#0369a1';
        let emissiveIntensity = 0.1;
        let opacity = 0.25;

        if (isSelected) {
          floorColor = '#38bdf8';
          emissiveColor = '#38bdf8';
          emissiveIntensity = 0.45;
          opacity = 0.85;
        } else if (floorInfo.trappedCount > 0) {
          if (floorInfo.hazardLevel === 'HIGH' || floorInfo.trappedCount >= 3) {
            floorColor = '#ff3344'; // Pulsing Red
            emissiveColor = '#ff1133';
            emissiveIntensity = 0.75;
            opacity = 0.75;
          } else {
            floorColor = '#ff9900'; // Amber
            emissiveColor = '#ff7700';
            emissiveIntensity = 0.5;
            opacity = 0.65;
          }
        }

        const yPos = index * floorGap;

        return (
          <group key={floorNum} position={[0, yPos, 0]}>
            {/* Transparent Wireframe Floor Slab */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectFloor) onSelectFloor(floorNum);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                document.body.style.cursor = 'auto';
              }}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[6.8, 0.95, 5.8]} />
              <meshStandardMaterial
                color={floorColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={opacity}
                wireframe={!floorInfo.trappedCount && !isSelected}
                roughness={0.2}
                metalness={0.2}
              />
            </mesh>

            {/* Floating Trapped Casualty Badge on Floor Edge */}
            {floorInfo.trappedCount > 0 && (
              <Html position={[4.0, 0, 0]} distanceFactor={16} className="select-none pointer-events-none">
                <div className="bg-red-600/95 text-white px-2.5 py-1 rounded-[6px] text-xs font-bold border border-red-400 shadow-2xl animate-pulse flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                  <span className="font-mono bg-black/40 px-1 rounded">F{floorNum}:</span>
                  <span>⚠️ {floorInfo.trappedCount} Trapped</span>
                </div>
              </Html>
            )}

            {/* Floor Level Label */}
            <Html position={[-4.0, 0, 0]} distanceFactor={18} className="select-none pointer-events-none">
              <div className={`px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${
                isSelected ? 'bg-sky-950 text-sky-300 border-sky-400 shadow-md' : 'bg-black/60 text-slate-300 border-slate-700'
              }`}>
                Floor {floorNum}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Floating 3D Spatial Casualty Pins Inside Specific Floors */}
      {(building.markers || []).map((marker) => {
        const floorIdx = Math.max(0, (marker.floorNumber || 1) - 1);
        const yBase = floorIdx * floorGap + 0.3;
        const [ox, , oz] = marker.coordinatesOffset || [0, 0, 0];
        const markerPos = [
          Math.max(-2.5, Math.min(2.5, ox)),
          yBase,
          Math.max(-2, Math.min(2, oz))
        ];

        const isRescued = marker.status === 'RESCUED';
        const isEnRoute = marker.status === 'RESCUE_IN_PROGRESS';
        const pinColor = isRescued ? '#10b981' : (isEnRoute ? '#fbbf24' : '#ff1133');

        return (
          <Float key={marker.id} speed={2} rotationIntensity={0.4} floatIntensity={0.35}>
            <group position={markerPos}>
              {/* 3D Pin Wireframe Sphere */}
              <mesh>
                <sphereGeometry args={[0.26, 16, 16]} />
                <meshBasicMaterial color={pinColor} wireframe={!isRescued} />
              </mesh>

              {/* Pin Label */}
              <Html distanceFactor={13} center className="select-none pointer-events-none">
                <div
                  className={`px-2.5 py-1 rounded text-[10px] font-mono border whitespace-nowrap backdrop-blur-md shadow-xl ${
                    isRescued
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 font-semibold'
                      : isEnRoute
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500 animate-pulse font-semibold'
                      : 'bg-black/90 text-red-400 border-red-500 animate-bounce font-bold'
                  }`}
                >
                  {isRescued ? (
                    <span>✔ Floor {marker.floorNumber} (Rm {marker.roomNumber || 'N/A'}): SECURED</span>
                  ) : (
                    <span>⚠️ Floor {marker.floorNumber} (Rm {marker.roomNumber || 'N/A'}): {marker.trappedCount} Trapped</span>
                  )}
                </div>
              </Html>
            </group>
          </Float>
        );
      })}

      {/* Adjacent Triage Hospital & Emergency Relief Pavilion */}
      <group position={[7.8, 0, -1]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectFloor) onSelectFloor('HOSPITAL');
          }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[4.5, 1.4, 4.5]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#38bdf8"
            emissiveIntensity={0.35}
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>

        {/* Hospital Beacon Cross Top */}
        <group position={[0, 1.1, 0]}>
          <mesh>
            <boxGeometry args={[1.3, 0.35, 0.35]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.35, 1.3, 0.35]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} />
          </mesh>
          <Html position={[0, 1.3, 0]} center distanceFactor={18} className="pointer-events-none select-none">
            <div className="flex items-center gap-1.5 bg-[#0284c7]/95 text-white font-sans font-semibold text-[11px] px-2.5 py-1 rounded-full border border-sky-400/60 shadow-2xl whitespace-nowrap backdrop-blur-md animate-pulse">
              <HeartPulse className="w-3.5 h-3.5 text-white" />
              <span>Hospital & Relief Hub</span>
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

export const DigitalTwin3D = () => {
  const { buildingState, selectedFloor, setSelectedFloor, setActiveTab } = useCrisisStore();
  const [isExploded, setIsExploded] = useState(false);
  const [showTacticalOverlay, setShowTacticalOverlay] = useState(true);
  const controlsRef = useRef();

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(2, 3, 0);
    }
    setSelectedFloor(null);
  };

  const handleFloorSelect = (floor) => {
    if (floor === 'HOSPITAL') {
      setActiveTab('hospital');
      return;
    }
    setSelectedFloor(floor);
  };

  const totalTrapped = buildingState?.totalTrapped || 0;

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in relative">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
                3D INDOOR DIGITAL TWIN // CASUALTY HEATMAP
              </h2>
              {totalTrapped > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-red-400" />
                  {totalTrapped === 1 ? '1 TRAPPED SOUL' : `${totalTrapped} TRAPPED SOULS`}
                </span>
              )}
            </div>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Floor-by-floor wireframe X-Ray with live spatial pin coordinates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Floor Panel Overlay Toggle */}
          <button
            onClick={() => setShowTacticalOverlay(!showTacticalOverlay)}
            className={`btn-secondary text-xs px-2.5 py-1 ${showTacticalOverlay ? 'bg-red-500/10 border-red-500/40 text-red-300' : ''}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showTacticalOverlay ? 'Floor Panel: ON' : 'Floor Panel: OFF'}</span>
          </button>

          {/* Exploded Slices Toggle */}
          <button
            onClick={() => setIsExploded(!isExploded)}
            className={`btn-secondary text-xs px-2.5 py-1 ${isExploded ? 'bg-white/[0.1] border-[var(--mesh)] text-[var(--mesh)]' : ''}`}
          >
            {isExploded ? 'Exploded: ON' : 'Exploded: OFF'}
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="btn-secondary p-2"
            title="Reset Perspective"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floor Filter Quick Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {[
          { key: null, label: 'All Levels' },
          { key: 6, label: 'Floor 6' },
          { key: 5, label: 'Floor 5' },
          { key: 4, label: 'Floor 4' },
          { key: 3, label: 'Floor 3' },
          { key: 2, label: 'Floor 2' },
          { key: 1, label: 'Floor 1' }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setSelectedFloor(item.key)}
            className={`px-2.5 py-1 rounded-[6px] text-[11px] font-sans font-medium transition-all whitespace-nowrap ${
              selectedFloor === item.key
                ? 'bg-white/[0.12] text-white border border-sky-400/50 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white bg-white/[0.02] border border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[460px] rounded-[20px] overflow-hidden border border-[var(--border)] bg-[#06080B]">
        <Canvas
          camera={{ position: [18, 14, 18], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={6}
            maxDistance={60}
            maxPolarAngle={Math.PI / 2 + 0.05}
            target={[2, 3, 0]}
          />

          <ambientLight intensity={0.75} />
          <directionalLight
            position={[20, 30, 20]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-15, 20, -15]} intensity={0.5} />
          <pointLight position={[7.8, 6, -1]} intensity={1.5} color="#38bdf8" distance={20} />

          {/* Grid Floor */}
          <gridHelper args={[40, 20, '#1e293b', '#0f172a']} position={[2, -1, 0]} />

          {/* FloorLevelBuilding Structure */}
          <FloorLevelBuilding
            building={buildingState}
            isExploded={isExploded}
            selectedFloor={selectedFloor}
            onSelectFloor={handleFloorSelect}
          />
        </Canvas>

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 z-10 glass-pill text-[10px] font-sans text-[var(--text-muted)] flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0284c7]"></span> Nominal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff9900]"></span> Medium Alert</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff3344] animate-pulse"></span> Critical / Fire</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Secured</span>
        </div>

        {/* Floating Tactical Floor Breakdown Overlay */}
        {showTacticalOverlay && (
          <div className="absolute top-3 right-3 z-20 w-80 max-w-[calc(100%-24px)] pointer-events-auto">
            <TacticalFloorBreakdown
              onSelectFloor={(floor) => setSelectedFloor(floor)}
            />
          </div>
        )}

        {/* Viewport Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 glass-pill text-[11px] font-sans text-[var(--text-muted)] pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[var(--mesh)]" />
          <span>Click floor slab to isolate casualties</span>
        </div>
      </div>
    </div>
  );
};
