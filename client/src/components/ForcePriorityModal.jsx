import React, { useEffect } from 'react';
import { 
  AlertOctagon, 
  Flame, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';

export function ForcePriorityModal() {
  const { forcePriorityLock, activeCrisisEvent, dismissCrisisLock, activeRole } = useCrisisStore();

  useEffect(() => {
    if (forcePriorityLock && activeCrisisEvent) {
      const sev = activeCrisisEvent.severity || 5;
      audioEngine.playAlert(sev);
      triggerHaptic(sev);
    }
  }, [forcePriorityLock, activeCrisisEvent]);

  if (!forcePriorityLock || !activeCrisisEvent) return null;

  const isCitizen = activeRole === 'citizen';

  const handleAcknowledge = () => {
    audioEngine.stopSiren();
    dismissCrisisLock();
  };

  const sev = activeCrisisEvent.severity || 5;
  const exitDirection = activeCrisisEvent.exitDirection || 'Exit C, 40m ahead';
  const exitDistance = activeCrisisEvent.exitDistance || '40 meters';

  return (
    <div className="fixed inset-0 z-[20000000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel w-full max-w-xl p-6 border-red-500/80 shadow-[0_0_50px_rgba(255,51,68,0.4)] space-y-5 animate-scale-in">
        {/* Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-red-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 animate-bounce">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                LEVEL {sev} // FORCE-PRIORITY OVERRIDE
              </span>
              <h2 className="font-display font-bold text-xl text-white mt-0.5">
                {isCitizen ? 'CIVILIAN EVACUATION ALERT' : 'LIFE-SAFETY EMERGENCY ACTIVE'}
              </h2>
            </div>
          </div>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
        </div>

        {/* Incident Summary Box */}
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between text-[11px] font-mono text-red-300">
            <span>Location: <strong>Floor {activeCrisisEvent.floorNumber || '1'} (Rm {activeCrisisEvent.roomNumber || 'Sector'})</strong></span>
            <span>Trapped: <strong className="text-red-400">{activeCrisisEvent.trapped === 1 ? '1 Soul' : `${activeCrisisEvent.trapped || 0} Souls`}</strong></span>
          </div>
          <p className="text-sm font-semibold text-white">
            "{activeCrisisEvent.hazard || 'Critical emergency reported in sector'}"
          </p>
        </div>

        {/* Citizen Exit Direction & Distance */}
        {isCitizen && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2 text-xs font-sans">
            <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Immediate Evacuation Guidance:
            </div>
            <div className="grid grid-cols-2 gap-2 text-white">
              <div className="p-2 rounded bg-black/40 border border-amber-900/60">
                <span className="text-[10px] text-amber-300 block">EXIT DIRECTION</span>
                <span className="font-bold text-sm">{exitDirection}</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-amber-900/60">
                <span className="text-[10px] text-amber-300 block">DISTANCE TO SAFETY</span>
                <span className="font-bold text-sm text-emerald-400">{exitDistance}</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Ghost Tactical Dispatch Instructions */}
        {!isCitizen && activeCrisisEvent.dispatch && (
          <div className="space-y-2 text-xs font-sans">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Tactical AI Ghost Directives:
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {Object.entries(activeCrisisEvent.dispatch).map(([role, instruction]) => (
                <div key={role} className="p-2.5 rounded-lg bg-black/60 border border-slate-800 flex items-start gap-2">
                  <span className="text-[10px] font-mono bg-white/[0.08] px-1.5 py-0.5 rounded text-sky-300 whitespace-nowrap">
                    {role}
                  </span>
                  <span className="text-[11px] text-slate-300">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledge & Dismiss Action */}
        <div className="pt-3 border-t border-red-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-sans">
            <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Auditory alarm active (Web Audio FM Siren)</span>
          </div>

          <button
            onClick={handleAcknowledge}
            className={`py-2.5 px-5 text-xs font-sans font-bold flex items-center gap-2 rounded-xl shadow-lg transition-all ${
              isCitizen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'btn-crisis'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCitizen ? 'I understand, moving to safety' : 'Acknowledge & Take Command'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
