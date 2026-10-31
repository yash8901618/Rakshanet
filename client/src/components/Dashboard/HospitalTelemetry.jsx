import React from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import {
  Activity,
  Bed,
  HeartPulse,
  Syringe,
  Boxes,
  AlertOctagon,
  Users,
  ShieldCheck,
  Zap
} from 'lucide-react';

/**
 * HospitalTelemetry Component
 * Real-time hospital bed telemetry, ER/ICU occupancy meters, critical medical supplies,
 * and auto-rerouting badge when ER capacity reaches 100%.
 */
export default function HospitalTelemetry() {
  const { hospitalState } = useCrisisStore();

  const {
    name = 'General Medical Relief Pavilion & ICU Core',
    totalBeds = 40,
    occupiedBeds = 14,
    erCapacity = 16,
    erOccupied = 6,
    icuCapacity = 8,
    icuOccupied = 3,
    oxygenLevelPercent = 94,
    bloodUnitsAvailable = 65,
    traumaKitsAvailable = 28,
    traumaTeamsActive = 2
  } = hospitalState || {};

  // Calculations
  const erPercent = Math.round((erOccupied / Math.max(1, erCapacity)) * 100);
  const icuPercent = Math.round((icuOccupied / Math.max(1, icuCapacity)) * 100);
  const totalPercent = Math.round((occupiedBeds / Math.max(1, totalBeds)) * 100);

  const isErCritical = erPercent >= 100;
  const isErWarning = erPercent >= 80 && !isErCritical;
  const isIcuCritical = icuPercent >= 90;

  return (
    <div className="glass-panel p-4 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wide">
              HOSPITAL TELEMETRY & ICU
            </h3>
            <p className="text-xs text-slate-400">{name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-xs text-emerald-300 font-semibold">LIVE FEED</span>
        </div>
      </div>

      {/* Auto-Rerouting Critical Alert Banner */}
      {isErCritical ? (
        <div className="p-3 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-200 animate-bounce shadow-xl shadow-red-950">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-black tracking-wider text-red-100">
                🔴 CRITICAL CAPACITY (100%): AUTO-REROUTING ACTIVE
              </div>
              <p className="text-[11px] text-red-300 mt-0.5 leading-snug">
                Emergency Room bays saturated. Automatic diversion protocol engaged. Diverting incoming trauma casualties to St. Jude Regional Hospital Hub.
              </p>
            </div>
          </div>
        </div>
      ) : isErWarning ? (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="font-mono text-xs font-bold">
              ⚠️ HIGH LOAD WARNING ({erPercent}%): ER Surge Protocol Ready
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs text-slate-300">
              Trauma Triage Intake: <strong className="text-emerald-400">OPERATIONAL</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {totalBeds - occupiedBeds} Beds Free
          </span>
        </div>
      )}

      {/* Real-time Occupancy Progress Meters */}
      <div className="space-y-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
        {/* ER Occupancy Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-sky-400" />
              Emergency Room (ER) Bays
            </span>
            <span
              className={`font-bold ${
                isErCritical ? 'text-red-400' : isErWarning ? 'text-amber-400' : 'text-sky-300'
              }`}
            >
              {erOccupied} / {erCapacity} ({erPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isErCritical
                  ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                  : isErWarning
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600'
              }`}
              style={{ width: `${Math.min(100, erPercent)}%` }}
            />
          </div>
        </div>

        {/* ICU Occupancy Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Intensive Care Unit (ICU)
            </span>
            <span
              className={`font-bold ${
                isIcuCritical ? 'text-red-400' : 'text-purple-300'
              }`}
            >
              {icuOccupied} / {icuCapacity} ({icuPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isIcuCritical
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, icuPercent)}%` }}
            />
          </div>
        </div>

        {/* Overall Facility Bed Load */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Total Facility Bed Occupancy
            </span>
            <span className="text-emerald-300 font-bold">
              {occupiedBeds} / {totalBeds} ({totalPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.min(100, totalPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Critical Medical Supplies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Oxygen Cylinders */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-sky-400 text-xs font-mono mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Oxygen Reserve</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-white">
            {oxygenLevelPercent}%
          </div>
          <span className="text-[10px] text-slate-400">Cryo-manifold</span>
        </div>

        {/* Blood Units */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono mb-1">
            <Syringe className="w-3.5 h-3.5" />
            <span>Blood Units (O-)</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-white">
            {bloodUnitsAvailable} <span className="text-xs text-slate-400">units</span>
          </div>
          <span className="text-[10px] text-slate-400">Cryo-bank</span>
        </div>

        {/* Trauma Kits */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono mb-1">
            <Boxes className="w-3.5 h-3.5" />
            <span>Trauma Kits</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-white">
            {traumaKitsAvailable} <span className="text-xs text-slate-400">kits</span>
          </div>
          <span className="text-[10px] text-slate-400">Field-deployable</span>
        </div>

        {/* Active Medical Teams */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Trauma Teams</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-white">
            {traumaTeamsActive} <span className="text-xs text-slate-400">on duty</span>
          </div>
          <span className="text-[10px] text-emerald-400">Ready for intake</span>
        </div>
      </div>
    </div>
  );
}
