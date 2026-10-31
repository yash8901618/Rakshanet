import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Radio, 
  CheckSquare, 
  Square, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';

export const GhostDispatcher = () => {
  const { incidents, currentNode } = useCrisisStore();
  const [filterRole, setFilterRole] = useState(currentNode.role || 'ALL');
  const [customOrder, setCustomOrder] = useState('');
  const [checklistState, setChecklistState] = useState({});

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');

  const toggleChecklist = (key) => {
    setChecklistState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleBroadcastCustom = (e) => {
    e.preventDefault();
    if (!customOrder.trim()) return;

    socket.emit('report:incident', {
      zoneId: currentNode.zone || 'zone-lobby',
      text: customOrder,
      severity: 2,
      trappedGuess: 0,
      reporterRole: currentNode.role
    });

    setCustomOrder('');
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in">
      {/* Chat Card Header */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {/* Circular Bot Badge */}
          <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)] flex-shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
                AI GHOST DISPATCHER
              </h2>
              <span className="glass-pill text-[10px] py-0.5 px-2 text-[var(--safe)] border-[var(--safe)]/30 font-medium">
                ACTIVE
              </span>
            </div>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Autonomous role-adaptive tactical directive stream
            </p>
          </div>
        </div>

        {/* Role Filter Controls */}
        <div className="segmented-control">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`segmented-control-item text-xs py-1 px-2.5 ${filterRole === 'ALL' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRole(currentNode.role)}
            className={`segmented-control-item text-xs py-1 px-2.5 ${filterRole === currentNode.role ? 'active' : ''}`}
          >
            My Role
          </button>
        </div>
      </div>

      {/* Directives Stream Area */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[220px] max-h-[460px]">
        {activeIncidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-[var(--border)] flex items-center justify-center text-[var(--text-faint)] mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-sans font-medium text-xs text-[var(--text-muted)]">
              All sectors nominal
            </div>
            <div className="font-sans text-[11px] text-[var(--text-faint)] mt-1 max-w-[220px] leading-relaxed">
              Dispatcher is monitoring mesh telemetry. Directives generate immediately on incident report.
            </div>
          </div>
        ) : (
          activeIncidents.map((incident) => {
            const sev = incident.severity || 0;
            const dispatchMap = incident.dispatchInstructions || {};
            const displayRoles = filterRole === 'ALL' 
              ? ['Floor Staff', 'Security', 'Reception', 'Responder', 'Admin']
              : [filterRole];

            const severityBorderColor = 
              sev >= 4 ? 'var(--crisis)' : 
              sev === 3 ? 'var(--sev-3)' : 
              sev === 2 ? 'var(--warn)' : 
              sev === 1 ? 'var(--safe)' : 'var(--text-faint)';

            return (
              <div 
                key={incident.id} 
                className="glass-card p-3.5 border-l-4 zone-card-transition space-y-2.5"
                style={{ borderLeftColor: severityBorderColor }}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-xs text-[var(--text-primary)]">
                      {incident.zoneName || incident.zoneId}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      [{incident.hazard}]
                    </span>
                  </div>

                  <span 
                    className="font-mono font-bold text-[10px] uppercase px-1.5 py-0.5 rounded"
                    style={{ color: severityBorderColor, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                  >
                    SEV {sev}
                  </span>
                </div>

                {/* Directives per role */}
                <div className="space-y-2">
                  {displayRoles.map((role) => {
                    const instruction = dispatchMap[role] || `Maintain standby status for ${role}.`;
                    const checkKey = `${incident.id}-${role}`;
                    const isChecked = !!checklistState[checkKey];
                    const isMyRole = role === currentNode.role;

                    return (
                      <div 
                        key={role}
                        className={`rounded-[8px] p-2.5 border transition-all ${
                          isMyRole 
                            ? 'bg-white/[0.04] border-[var(--mesh)]/40 shadow-sm' 
                            : 'bg-white/[0.015] border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-sans font-medium text-[11px] text-[var(--mesh)] flex items-center gap-1.5">
                            <Radio className="w-3 h-3" />
                            {role} Directive
                          </span>

                          <button
                            onClick={() => toggleChecklist(checkKey)}
                            className="flex items-center gap-1 text-[11px] font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[var(--safe)]" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            )}
                            <span className="text-[10px]">{isChecked ? 'Acknowledged' : 'Mark done'}</span>
                          </button>
                        </div>

                        <p className={`font-sans text-xs text-[var(--text-primary)] leading-[1.6] ${
                          isChecked ? 'line-through text-[var(--text-muted)] opacity-60' : ''
                        }`}>
                          "{instruction}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Composer Input Field at Bottom */}
      <form onSubmit={handleBroadcastCustom} className="mt-4 pt-3 border-t border-[var(--border)]">
        <div className="relative flex items-center bg-white/[0.035] border border-[var(--border)] rounded-full p-1.5 focus-within:border-[var(--mesh)]/60 focus-within:bg-white/[0.05] transition-all">
          <input
            type="text"
            value={customOrder}
            onChange={(e) => setCustomOrder(e.target.value)}
            placeholder={`Transmit directive as ${currentNode.role}...`}
            className="flex-1 bg-transparent border-none px-3.5 py-1 text-xs font-sans text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customOrder.trim()}
            className="w-8 h-8 rounded-full bg-[var(--mesh)] text-[#06080B] flex items-center justify-center hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
            title="Broadcast directive"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
