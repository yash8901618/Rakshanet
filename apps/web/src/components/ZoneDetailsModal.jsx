import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Users, 
  Shield, 
  Flame, 
  Navigation, 
  Camera
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';

export const ZoneDetailsModal = ({ zoneId, onClose }) => {
  const { zones, nodes, currentNode } = useCrisisStore();
  const [cctvFilter, setCctvFilter] = useState('optical');
  const [quickHazardText, setQuickHazardText] = useState('');
  const [quickSeverity, setQuickSeverity] = useState(3);

  const zone = zones.find(z => z.id === zoneId);
  if (!zone) return null;

  const staffInZone = nodes.filter(n => n.zone === zone.id);
  const maxSev = zone.hazardSeverity || 0;

  const handleQuickReport = (e) => {
    e.preventDefault();
    if (!quickHazardText.trim()) return;

    socket.emit('report:incident', {
      zoneId: zone.id,
      text: quickHazardText,
      severity: Number(quickSeverity),
      trappedGuess: 0,
      reporterRole: currentNode.role
    });

    setQuickHazardText('');
  };

  const occPercent = Math.round((zone.currentOccupancy / zone.capacity) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl border border-[var(--border-bright)] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  {zone.name}
                </h3>
                <span className="glass-pill font-mono text-[10px] text-[var(--text-muted)] py-0.5 px-2">
                  {maxSev >= 3 ? `SEV ${maxSev} HAZARD` : maxSev > 0 ? `SEV ${maxSev} ALERT` : 'NOMINAL'}
                </span>
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                {zone.floor} • Sector ID: {zone.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto font-sans text-xs">
          {/* CCTV Camera Simulation Container */}
          <div className="rounded-[14px] overflow-hidden border border-[var(--border)] bg-[#040608] relative">
            <div className={`h-44 w-full flex items-center justify-center relative ${
              cctvFilter === 'thermal' 
                ? 'bg-gradient-to-tr from-purple-950 via-red-900 to-amber-600' 
                : cctvFilter === 'night'
                ? 'bg-gradient-to-b from-emerald-950 via-green-900 to-black text-emerald-300'
                : 'bg-gradient-to-br from-slate-900 via-[#0a0e17] to-black text-slate-300'
            }`}>
              <div className="z-10 text-center p-4">
                <Video className="w-7 h-7 mx-auto mb-2 opacity-50" />
                <div className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">
                  FEED // {zone.cameraSnapshot}
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)] mt-1">
                  EST. OCCUPANCY: {zone.currentOccupancy} • {cctvFilter.toUpperCase()} SENSOR
                </div>
              </div>

              {/* Feed timestamp badge */}
              <div className="absolute top-2.5 right-3 z-10 font-mono text-[10px] bg-black/60 px-2 py-0.5 rounded text-[var(--text-muted)]">
                {new Date().toLocaleTimeString()}
              </div>

              {/* Safe Egress Overlay */}
              <div className="absolute bottom-2.5 left-3 z-10 glass-pill text-[10px] font-sans text-[var(--safe)]">
                <Navigation className="w-3 h-3 text-[var(--safe)]" />
                <span>Egress: {zone.safeExit}</span>
              </div>
            </div>

            {/* Sensor mode switcher */}
            <div className="p-2.5 bg-white/[0.02] border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[var(--mesh)]" />
                Sensor Filter:
              </span>
              <div className="segmented-control">
                {['optical', 'thermal', 'night'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCctvFilter(mode)}
                    className={`segmented-control-item text-xs py-0.5 px-2.5 uppercase ${
                      cctvFilter === mode ? 'active' : ''
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Occupancy & Staff Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[var(--mesh)]" />
                  Capacity Utilization
                </span>
                <span className="font-display font-bold text-xs text-[var(--text-primary)]">
                  {zone.currentOccupancy} / {zone.capacity} ({occPercent}%)
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, occPercent)}%`,
                    backgroundColor: occPercent > 80 ? 'var(--crisis)' : occPercent > 50 ? 'var(--warn)' : 'var(--safe)'
                  }}
                />
              </div>
            </div>

            <div className="glass-card p-3.5">
              <div className="text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[var(--mesh)]" />
                Staff in Sector ({staffInZone.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {staffInZone.length > 0 ? (
                  staffInZone.map((n) => (
                    <span key={n.id} className="glass-pill text-[10px] py-0.5 px-2 font-mono text-[var(--text-primary)]">
                      {n.name} ({n.role})
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[var(--text-faint)]">No active staff stationed</span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Incident Reporting for this Zone */}
          <div className="glass-card p-4 space-y-3">
            <div className="text-xs font-sans font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[var(--crisis)]" />
              Declare Hazard in {zone.name}
            </div>

            <form onSubmit={handleQuickReport} className="space-y-3">
              <input
                type="text"
                value={quickHazardText}
                onChange={(e) => setQuickHazardText(e.target.value)}
                placeholder="e.g. Smoke detected in electrical riser..."
                className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--mesh)]"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="segmented-control">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuickSeverity(s)}
                      className={`segmented-control-item text-xs py-0.5 px-2 font-mono ${
                        quickSeverity === s ? 'active' : ''
                      }`}
                    >
                      L{s}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!quickHazardText.trim()}
                  className="btn-crisis text-xs"
                >
                  Dispatch Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
