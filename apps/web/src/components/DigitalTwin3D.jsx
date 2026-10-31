import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import { 
  Layers, 
  RotateCcw, 
  Flame, 
  HeartPulse, 
  Crosshair,
  Building2,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { TacticalFloorBreakdown } from './TacticalFloorBreakdown';

// FloorLevelBuilding Component with Dynamic Stacking, Glassmorphic Slices & 3D Spatial Pins
export function FloorLevelBuilding({ building, isExploded, activeFilter, selectedFloor, onSelectFloor }) {
  const floorHeight = 1.35;
  const floorGap = isExploded ? 2.3 : floorHeight;

  return (
    <group position={[0, 0, 0]}>
      {/* Dynamic Multi-Floor Stacking */}
      {Array.from({ length: building.totalFloors || 6 }).map((_, index) => {
        const floorNum = index + 1; // Floors 1 to N
        const floorKey = String(floorNum);
        const floorInfo = building.floorData?.[floorKey] || building.floorData?.[floorNum] || { trappedCount: 0, hazardLevel: 'LOW' };
        const isSelected = selectedFloor === floorNum;

        // Filter isolation check
        if (activeFilter !== 'ALL' && activeFilter !== 'HOSPITAL' && activeFilter !== `L${floorNum}`) {
          return null;
        }

        // Color coding floor heat based on hazard and trapped count
        const floorColor = floorInfo.trappedCount > 0 
          ? (floorInfo.hazardLevel === 'HIGH' ? '#ff3344' : '#ff9900')
          : (isSelected ? '#38bdf8' : '#2a3b5c');

        const yPos = index * floorGap;

        return (
          <group key={floorNum} position={[0, yPos, 0]}>
            {/* Glassmorphic Floor Slice */}
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
              <boxGeometry args={[6.5, 0.95, 5.5]} />
              <meshStandardMaterial 
                color={floorColor} 
                emissive={floorInfo.trappedCount > 0 ? (floorInfo.hazardLevel === 'HIGH' ? '#ff1133' : '#ff7700') : (isSelected ? '#0284c7' : '#0f172a')}
                emissiveIntensity={floorInfo.trappedCount > 0 ? 0.65 : (isSelected ? 0.4 : 0.05)}
                transparent 
                opacity={isSelected ? 0.85 : (floorInfo.trappedCount > 0 ? 0.75 : 0.3)} 
                wireframe={!floorInfo.trappedCount && !isSelected}
                roughness={0.2}
                metalness={0.15}
              />
            </mesh>

            {/* Floor Badge Label */}
            {floorInfo.trappedCount > 0 && (
              <Html position={[3.8, 0, 0]} distanceFactor={16} className="select-none pointer-events-none">
                <div className="bg-red-600/95 text-white px-2.5 py-1 rounded-[6px] text-xs font-bold border border-red-400 shadow-2xl animate-pulse flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                  <span className="font-mono bg-black/40 px-1 rounded">F{floorNum}:</span>
                  <span>⚠️ {floorInfo.trappedCount} Trapped</span>
                </div>
              </Html>
            )}

            {/* Floor Level Label */}
            <Html position={[-3.8, 0, 0]} distanceFactor={18} className="select-none pointer-events-none">
              <div className={`px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${
                isSelected ? 'bg-sky-950 text-sky-300 border-sky-500' : 'bg-black/60 text-slate-300 border-slate-700'
              }`}>
                Level {floorNum}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Render 3D Spatial Pins inside the floors */}
      {(building.markers || []).map((marker) => {
        const floorIdx = Math.max(0, (marker.floorNumber || 1) - 1);
        const yBase = floorIdx * floorGap + 0.3;
        const [ox, , oz] = marker.coordinatesOffset || [0, 0, 0];
        const markerPos = [
          Math.max(-2.5, Math.min(2.5, ox * 0.2)),
          yBase,
          Math.max(-2, Math.min(2, oz * 0.2))
        ];

        const isRescued = marker.status === 'RESCUED';
        const isEnRoute = marker.status === 'RESCUE_IN_PROGRESS';

        const pinColor = isRescued ? '#34d399' : (isEnRoute ? '#fbbf24' : '#ff1133');

        return (
          <Float key={marker.id} speed={2} rotationIntensity={0.5} floatIntensity={0.4}>
            <group position={markerPos}>
              <mesh>
                <sphereGeometry args={[0.28, 16, 16]} />
                <meshBasicMaterial color={pinColor} wireframe={!isRescued} />
              </mesh>
              <Html distanceFactor={13} center className="select-none pointer-events-none">
                <div 
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap backdrop-blur-md shadow-lg ${
                    isRescued 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500' 
                      : isEnRoute 
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse'
                      : 'bg-black/85 text-red-400 border-red-500 animate-bounce'
                  }`}
                >
                  {isRescued ? (
                    <span>✔ Floor {marker.floorNumber}, Rm {marker.roomNumber || 'N/A'}: Secured</span>
                  ) : (
                    <span>⚠️ Floor {marker.floorNumber}, Rm {marker.roomNumber || 'N/A'}: {marker.trappedCount} trapped</span>
                  )}
                </div>
              </Html>
            </group>
          </Float>
        );
      })}

      {/* Adjacent Triage Hospital & Emergency Relief Pavilion */}
      <group position={[7.5, 0, -1]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectFloor) onSelectFloor('zone-hospital');
          }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[4.5, 1.4, 4.5]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#38bdf8"
            emissiveIntensity={0.25}
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>
        
        {/* Hospital Beacon Top */}
        <group position={[0, 1.1, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.35, 0.35]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.35, 1.2, 0.35]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
          <Html position={[0, 1.2, 0]} center distanceFactor={18} className="pointer-events-none select-none">
            <div className="flex items-center gap-1.5 bg-[#0284c7]/95 text-white font-sans font-semibold text-[11px] px-2.5 py-1 rounded-full border border-sky-400/60 shadow-xl whitespace-nowrap backdrop-blur-md animate-pulse">
              <HeartPulse className="w-3.5 h-3.5 text-white" />
              <span>Hospital & Relief Hub</span>
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

export const DigitalTwin3D = ({ onSelectZone }) => {
  const { buildingState, setSelectedZoneId, zones } = useCrisisStore();
  const [activeFloorFilter, setActiveFloorFilter] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [isExploded, setIsExploded] = useState(false);
  const [showTacticalOverlay, setShowTacticalOverlay] = useState(true);
  const controlsRef = useRef();

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(2, 3, 0);
    }
    setSelectedFloor(null);
    setActiveFloorFilter('ALL');
  };

  const handleFloorSelect = (floorNum) => {
    setSelectedFloor(floorNum);
    if (floorNum === 'zone-hospital') {
      setSelectedZoneId('zone-hospital');
      return;
    }
    const matchingZone = zones.find(z => z.level === floorNum || z.level === floorNum - 1);
    if (matchingZone) {
      setSelectedZoneId(matchingZone.id);
      if (onSelectZone) onSelectZone(matchingZone);
    }
  };

  const totalTrapped = buildingState?.totalTrapped || 0;

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in relative">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
                3D DIGITAL TWIN // INDOOR CASUALTY HEATMAP
              </h2>
              {totalTrapped > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-red-400" />
                  {totalTrapped} TRAPPED SOULS
                </span>
              )}
            </div>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Floor-by-floor spatial x-ray & precision rescue telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tactical Breakdown Toggle */}
          <button
            onClick={() => setShowTacticalOverlay(!showTacticalOverlay)}
            className={`btn-secondary text-xs px-2.5 py-1 ${showTacticalOverlay ? 'bg-red-500/10 border-red-500/40 text-red-300' : ''}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showTacticalOverlay ? 'Floor Panel: ON' : 'Floor Panel: OFF'}</span>
          </button>

          {/* Exploded View Toggle */}
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

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {[
          { key: 'ALL', label: 'All Levels' },
          { key: 'HOSPITAL', label: '🏥 Relief Hub' },
          { key: 'L6', label: 'Floor 6' },
          { key: 'L5', label: 'Floor 5' },
          { key: 'L4', label: 'Floor 4' },
          { key: 'L3', label: 'Floor 3' },
          { key: 'L2', label: 'Floor 2' },
          { key: 'L1', label: 'Floor 1' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => {
              setActiveFloorFilter(item.key);
              if (item.key.startsWith('L')) {
                setSelectedFloor(Number(item.key.slice(1)));
              } else if (item.key === 'HOSPITAL') {
                setSelectedFloor('zone-hospital');
              } else {
                setSelectedFloor(null);
              }
            }}
            className={`px-2.5 py-1 rounded-[6px] text-[11px] font-sans font-medium transition-all whitespace-nowrap ${
              activeFloorFilter === item.key
                ? 'bg-white/[0.08] text-[var(--text-primary)] border border-[var(--border-bright)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas Framed Viewport Container */}
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
            maxDistance={65}
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
          <pointLight position={[7.5, 6, -1]} intensity={1.5} color="#38bdf8" distance={20} />

          {/* Grid Floor */}
          <gridHelper args={[40, 20, '#1e293b', '#0f172a']} position={[2, -1, 0]} />

          {/* FloorLevelBuilding Structure */}
          <FloorLevelBuilding
            building={buildingState}
            isExploded={isExploded}
            activeFilter={activeFloorFilter}
            selectedFloor={selectedFloor}
            onSelectFloor={handleFloorSelect}
          />
        </Canvas>

        {/* Legend */}
        <div className="absolute top-3 left-3 z-10 glass-pill text-[10px] font-sans text-[var(--text-muted)] flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2a3b5c]"></span> Nominal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Hospital/Relief</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff9900]"></span> Medium Alert</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff3344]"></span> Critical Trapped</span>
        </div>

        {/* Floating Tactical Floor Breakdown Overlay (Desktop top-right / Mobile bottom sheet) */}
        {showTacticalOverlay && (
          <div className="absolute top-3 right-3 z-20 w-80 max-w-[calc(100%-24px)] pointer-events-auto">
            <TacticalFloorBreakdown
              onSelectFloor={(floor) => {
                setSelectedFloor(floor);
                setActiveFloorFilter(`L${floor}`);
              }}
            />
          </div>
        )}

        {/* Click hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 glass-pill text-[11px] font-sans text-[var(--text-muted)] pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[var(--mesh)]" />
          <span>Click floor slice to isolate casualty details</span>
        </div>
      </div>
    </div>
  );
};
