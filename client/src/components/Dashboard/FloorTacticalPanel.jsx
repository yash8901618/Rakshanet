import React from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { ShieldAlert, Flame, Wind, HeartPulse, Building2, UserCheck, ChevronRight, AlertTriangle } from 'lucide-react';

/**
 * FloorTacticalPanel Component
 * Displays real-time breakdown of trapped individuals per floor with "Rescued -1" quick-action.
 */
export default function FloorTacticalPanel() {
  const {
    buildingState,
    selectedFloor,
    setSelectedFloor,
    rescueFloorStepAction,
    isOfflineMode
  } = useCrisisStore();

  const floorData = buildingState?.floorData || {};
  const totalTrapped = buildingState?.totalTrapped || 0;

  const getHazardIcon = (hazard) => {
    switch (hazard) {
      case 'FIRE':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'SMOKE':
        return <Wind className="w-4 h-4 text-amber-400" />;
      case 'MEDICAL':
        return <HeartPulse className="w-4 h-4 text-pink-400" />;
      case 'COLLAPSE':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Building2 className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wide">
              FLOOR CASUALTY MATRIX
            </h3>
            <p className="text-xs text-slate-400">Tactical Floor-by-Floor Breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400">Total Trapped:</span>
          <span
            className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
              totalTrapped > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {totalTrapped === 1 ? '1 SOUL' : `${totalTrapped} SOULS`}
          </span>
        </div>
      </div>

      {/* Floor Grid / List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {[6, 5, 4, 3, 2, 1].map((floorNum) => {
          const data = floorData[String(floorNum)] || { trappedCount: 0, hazardLevel: 'LOW', activeHazard: null };
          const trapped = data.trappedCount || 0;
          const isHigh = data.hazardLevel === 'HIGH' || trapped >= 4 || data.activeHazard === 'FIRE';
          const isMed = data.hazardLevel === 'MEDIUM' || (trapped > 0 && !isHigh);
          const isSelected = selectedFloor === floorNum;

          return (
            <div
              key={floorNum}
              onClick={() => setSelectedFloor(isSelected ? null : floorNum)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-500/40 shadow-lg shadow-sky-950/50'
                  : isHigh
                  ? 'bg-red-950/30 border-red-700/50 hover:border-red-500/80 shadow-md shadow-red-950/30'
                  : isMed
                  ? 'bg-amber-950/20 border-amber-700/40 hover:border-amber-500/70'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Floor Info */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                      isHigh
                        ? 'bg-red-600 text-white animate-pulse'
                        : isMed
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    L{floorNum}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        Level {floorNum} Tier
                      </span>
                      {data.activeHazard && (
                        <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-800/80 text-[10px] font-mono text-slate-300 border border-slate-700">
                          {getHazardIcon(data.activeHazard)}
                          {data.activeHazard}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Status:{' '}
                      <span
                        className={
                          isHigh
                            ? 'text-red-400 font-bold'
                            : isMed
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400'
                        }
                      >
                        {isHigh ? 'CRITICAL RISK' : isMed ? 'ACTIVE THREAT' : 'SECURE / CLEAR'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trapped Count & Rescued -1 Button */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <span
                      className={`font-mono text-base font-extrabold ${
                        trapped > 0 ? (isHigh ? 'text-red-400' : 'text-amber-300') : 'text-slate-500'
                      }`}
                    >
                      {trapped}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">trapped</span>
                  </div>

                  {trapped > 0 ? (
                    <button
                      type="button"
                      onClick={() => rescueFloorStepAction(floorNum)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950 transition-all border border-emerald-400/40"
                      title={`Rescue 1 person from Floor ${floorNum}`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Rescued -1</span>
                    </button>
                  ) : (
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/40 text-slate-600 font-mono text-xs font-semibold border border-slate-800 flex items-center gap-1">
                      <span>Clear</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isOfflineMode && (
        <div className="mt-3 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode: "Rescued -1" actions buffer to IndexedDB and sync automatically.</span>
        </div>
      )}
    </div>
  );
}
