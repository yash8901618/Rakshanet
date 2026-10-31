import React from 'react';
import { 
  Building, 
  Users, 
  Navigation, 
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';

const SEVERITY_STRIP_COLORS = {
  0: 'var(--text-faint)',
  1: 'var(--safe)',
  2: 'var(--warn)',
  3: 'var(--sev-3)',
  4: 'var(--crisis)'
};

export const ZoneMatrix = ({ onSelectZone }) => {
  const { zones, nodes } = useCrisisStore();

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
              ZONE STATUS MATRIX
            </h2>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Live sector occupancy, safe egress & sensor telemetry
            </p>
          </div>
        </div>
        
        <span className="glass-pill font-mono text-[11px] text-[var(--text-muted)]">
          {zones.length} Zones
        </span>
      </div>

      {/* Responsive Card Grid: repeat(auto-fill, minmax(160px, 1fr)) */}
      {zones.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
          <Inbox className="w-8 h-8 text-[var(--text-faint)] mb-2" />
          <span className="font-sans text-xs">0 Zones Active</span>
        </div>
      ) : (
        <div 
          className="flex-1 gap-3 overflow-y-auto pr-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            alignContent: 'start'
          }}
        >
          {zones.map((zone) => {
            const sev = zone.hazardSeverity || 0;
            const staffCount = nodes.filter(n => n.zone === zone.id).length;
            const occPercent = Math.round((zone.currentOccupancy / zone.capacity) * 100);
            const stripColor = SEVERITY_STRIP_COLORS[sev] || SEVERITY_STRIP_COLORS[0];

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className="glass-card p-3.5 border-l-4 cursor-pointer zone-card-transition flex flex-col justify-between"
                style={{ borderLeftColor: stripColor }}
              >
                {/* Zone Floor & Name */}
                <div>
                  <div className="font-sans text-[11px] text-[var(--text-muted)] truncate">
                    {zone.floor}
                  </div>
                  <div className="font-sans font-medium text-xs text-[var(--text-primary)] mt-0.5 leading-snug line-clamp-2">
                    {zone.name}
                  </div>
                </div>

                {/* Occupancy & Capacity */}
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-sans text-[var(--text-muted)]">Occ:</span>
                    <span className="font-display font-bold text-xs text-[var(--text-primary)]">
                      {zone.currentOccupancy} <span className="text-[var(--text-faint)] font-normal text-[10px]">/ {zone.capacity}</span>
                    </span>
                  </div>

                  {/* Thin Progress Bar */}
                  <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, occPercent)}%`,
                        backgroundColor: occPercent > 80 ? 'var(--crisis)' : occPercent > 50 ? 'var(--warn)' : 'var(--safe)'
                      }}
                    />
                  </div>

                  {/* Safe Egress & Staff summary */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--text-faint)] font-sans">
                    <span className="truncate max-w-[95px] flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5 text-[var(--mesh)] flex-shrink-0" />
                      {zone.safeExit.split(' ')[0]}
                    </span>
                    <span className="font-mono text-[var(--text-muted)]">
                      {staffCount} staff
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
