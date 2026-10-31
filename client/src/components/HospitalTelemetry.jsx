import React from 'react';
import { 
  HeartPulse, 
  Bed, 
  Activity, 
  Wind, 
  Droplet, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';

export function HospitalTelemetry() {
  const { hospitalState, buildingState } = useCrisisStore();

  const totalBeds = hospitalState.totalBeds || 40;
  const occupied = hospitalState.occupiedBeds || 0;
  const availableBeds = Math.max(0, totalBeds - occupied);
  const bedPercentage = Math.round((occupied / totalBeds) * 100);

  const erCap = hospitalState.erCapacity || 15;
  const erOccupied = hospitalState.erOccupied || 0;
  const erPercent = Math.round((erOccupied / erCap) * 100);

  const icuCap = hospitalState.icuCapacity || 8;
  const icuOccupied = hospitalState.icuOccupied || 0;
  const icuPercent = Math.round((icuOccupied / icuCap) * 100);

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-white">
              HOSPITAL & RELIEF HUB TELEMETRY
            </h2>
            <p className="font-sans text-xs text-[var(--text-muted)]">
              {hospitalState.name}
            </p>
          </div>
        </div>

        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          TRAUMA INTAKE ACTIVE
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Beds */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-sky-400" /> Total Capacity</span>
            <span className="font-mono text-white font-bold">{availableBeds} Avail</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white">{occupied}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">/ {totalBeds} Beds</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-sky-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${bedPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* ER Trauma Bays */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-400" /> ER Trauma Bays</span>
            <span className="font-mono text-amber-300 font-bold">{erCap - erOccupied} Free</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white">{erOccupied}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">/ {erCap} Bays</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${erPercent}%` }}
            ></div>
          </div>
        </div>

        {/* ICU Critical Care */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /> ICU Core</span>
            <span className="font-mono text-red-300 font-bold">{icuCap - icuOccupied} Free</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white">{icuOccupied}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">/ {icuCap} ICU</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-red-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${icuPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Oxygen & Supplies */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-emerald-400" /> O2 Reserves</span>
            <span className="font-mono text-emerald-300 font-bold">{hospitalState.oxygenLevelPercent}%</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-red-400" /> Blood Supply:
            </span>
            <strong className="font-mono text-white">{hospitalState.bloodUnitsAvailable} Units (O-, A+)</strong>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${hospitalState.oxygenLevelPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Emergency Triage Intake Pipeline */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Live Casualty Intake & Triage Priority
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Auto-synchronized with 3D Facility Twin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 space-y-1">
            <div className="text-[10px] font-mono text-red-400 uppercase font-bold">Red / Immediate (T1)</div>
            <div className="text-lg font-bold font-display text-white">{buildingState.totalTrapped} Patients Incoming</div>
            <div className="text-[11px] text-slate-400">Direct ER breach corridor extraction</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
            <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">Yellow / Delayed (T2)</div>
            <div className="text-lg font-bold font-display text-white">{erOccupied} Stabilizing</div>
            <div className="text-[11px] text-slate-400">Smoke inhalation & minor burns</div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Green / Minor (T3)</div>
            <div className="text-lg font-bold font-display text-white">18 Discharged</div>
            <div className="text-[11px] text-slate-400">Outpatient perimeter shelter</div>
          </div>
        </div>
      </div>
    </div>
  );
}
