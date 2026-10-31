import React from 'react';
import { 
  Users, 
  Smartphone, 
  Hotel, 
  Shield, 
  Crosshair, 
  Sliders, 
  Radio,
  MapPin
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';

const ROLE_ICONS = {
  'Floor Staff': Smartphone,
  'Reception': Hotel,
  'Security': Shield,
  'Responder': Crosshair,
  'Admin': Sliders
};

export const ActiveMeshNodes = () => {
  const { nodes, zones } = useCrisisStore();

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
              ACTIVE MESH NODES
            </h2>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Live zero-login connected hardware terminals
            </p>
          </div>
        </div>

        <span className="glass-pill font-mono text-[11px] text-[var(--safe)] flex items-center gap-1.5">
          <span className="status-indicator" />
          {nodes.length} Online
        </span>
      </div>

      {/* Nodes List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {nodes.map((node) => {
          const Icon = ROLE_ICONS[node.role] || Users;
          const isCurrent = node.id === socket.id;
          const assignedZone = zones.find(z => z.id === node.zone);

          return (
            <div
              key={node.id}
              className={`glass-card p-3 transition-all ${
                isCurrent
                  ? 'border-[var(--mesh)]/40 bg-white/[0.05] shadow-sm'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                    isCurrent ? 'bg-[var(--mesh)]/20 text-[var(--mesh)]' : 'bg-white/[0.04] text-[var(--text-muted)]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-sans font-medium text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      {node.name}
                      {isCurrent && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[var(--mesh)]/20 text-[var(--mesh)] font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="font-sans text-[11px] text-[var(--mesh)]">
                      {node.role}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[10px] text-[var(--safe)] font-medium">
                  CONNECTED
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-sans text-[var(--text-muted)]">
                <span className="flex items-center gap-1 truncate max-w-[170px]">
                  <MapPin className="w-3 h-3 text-[var(--mesh)]" />
                  {assignedZone?.name || node.zone || 'Lobby'}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-faint)]">
                  ID: {node.id.slice(0, 6)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
