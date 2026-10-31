import React from 'react';
import { 
  Flame, 
  LifeBuoy, 
  CheckCircle, 
  ShieldCheck,
  ChevronDown,
  Building,
  Users
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';

export function TacticalFloorBreakdown({ onSelectFloor }) {
  const { buildingState, rescueFloorStepAction } = useCrisisStore();

  const handleRescueStep = (buildingId, floorNum) => {
    audioEngine.playRescueChime();
    triggerHaptic(1);
    rescueFloorStepAction(floorNum);
  };

  const floorEntries = Object.entries(buildingState?.floorData || {})
    .sort(([aFloor, aData], [bFloor, bData]) => {
      // Sort highest trapped count first, then floor number
      if (bData.trappedCount !== aData.trappedCount) {
        return bData.trappedCount - aData.trappedCount;
      }
      return Number(bFloor) - Number(aFloor);
    });

  const activeFloors = floorEntries.filter(([_, data]) => data.trappedCount > 0);
  const securedFloors = floorEntries.filter(([_, data]) => data.trappedCount === 0);

  return (
    <div className="w-full bg-slate-950/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 text-white shadow-2xl animate-fade-in flex flex-col max-h-[380px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-700/70">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${buildingState.totalTrapped > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
          <h3 className="font-display font-bold text-sm text-red-400 tracking-wide flex items-center gap-1.5">
            FLOOR TACTICAL BREAKDOWN
          </h3>
        </div>
        <span className="text-xs bg-red-950/90 text-red-300 px-2.5 py-0.5 rounded-full font-mono border border-red-800/80 font-bold">
          Total: {buildingState.totalTrapped} 👥
        </span>
      </div>

      {/* Floor Breakdown List */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-thin">
        {activeFloors.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-1.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400/70 mb-1" />
            <p className="text-xs font-semibold text-white">All Floors Secured</p>
            <p className="text-[11px] text-slate-500 max-w-[200px]">
              No active trapped casualties reported across facility slabs.
            </p>
          </div>
        ) : (
          activeFloors.map(([floor, data]) => {
            const isHigh = data.hazardLevel === 'HIGH';

            return (
              <div 
                key={floor} 
                onClick={() => onSelectFloor && onSelectFloor(Number(floor))}
                className="flex justify-between items-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 hover:border-red-500/60 transition-all cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition-colors" />
                    <p className="font-display font-bold text-xs text-white">
                      Floor {floor}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Priority: <span className={isHigh ? 'text-red-400 font-bold' : 'text-amber-400 font-semibold'}>{data.hazardLevel}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded font-mono ${
                    isHigh 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    ⚠️ {data.trappedCount} trapped
                  </span>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRescueStep(buildingState.id, Number(floor));
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all shadow-md active:scale-95 flex items-center gap-1"
                    title="Rescue 1 person from this floor"
                  >
                    <LifeBuoy className="w-3 h-3 text-emerald-200" />
                    <span>Rescued -1</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Secured Slabs section */}
        {securedFloors.length > 0 && activeFloors.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
              Secured Slabs ({securedFloors.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {securedFloors.map(([floor]) => (
                <span 
                  key={floor}
                  onClick={() => onSelectFloor && onSelectFloor(Number(floor))}
                  className="text-[10px] bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 px-2 py-0.5 rounded font-mono flex items-center gap-1 cursor-pointer hover:bg-emerald-950/70"
                >
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Floor {floor}: Clear</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
