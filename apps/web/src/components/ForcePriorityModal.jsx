import React from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Navigation,
  ArrowUpRight
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';

export const ForcePriorityModal = () => {
  const { 
    forcePriorityLock, 
    activeCrisisEvent, 
    currentNode, 
    nodes, 
    slaCountdown, 
    escalationNotice,
    acknowledgeCrisis 
  } = useCrisisStore();

  if (!forcePriorityLock || !activeCrisisEvent) return null;

  const { 
    incidentId, 
    severity, 
    zoneName, 
    hazard, 
    trapped, 
    safeExit, 
    dispatch 
  } = activeCrisisEvent;

  const isCritical = severity >= 4;
  const roleInstruction = dispatch?.[currentNode.role] || dispatch?.['Floor Staff'] || 'Follow emergency protocols and evacuate area.';

  const handleAcknowledge = () => {
    audioEngine.playAckChime();
    triggerHaptic(1);
    acknowledgeCrisis(incidentId);

    socket.emit('ack:incident', {
      incidentId,
      nodeId: socket.id
    });
  };

  const totalConnected = nodes.length || 1;
  const currentAcks = slaCountdown?.totalAcks || 1;
  const ackPercentage = Math.min(100, Math.round((currentAcks / totalConnected) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div 
        className="w-full max-w-2xl glass-panel overflow-hidden border-2 shadow-2xl transition-all"
        style={{ borderColor: isCritical ? 'var(--crisis)' : 'var(--sev-3)' }}
      >
        {/* Top Emergency Banner */}
        <div 
          className="p-5 flex items-center justify-between text-white"
          style={{
            background: isCritical 
              ? 'linear-gradient(135deg, rgba(255,59,48,0.25) 0%, rgba(6,8,11,0.85) 100%)' 
              : 'linear-gradient(135deg, rgba(255,138,61,0.25) 0%, rgba(6,8,11,0.85) 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: isCritical ? 'var(--crisis)' : 'var(--sev-3)', color: '#FFFFFF' }}
            >
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg uppercase tracking-tight">
                  FORCE-PRIORITY OVERRIDE
                </h1>
                <span 
                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                  style={{ backgroundColor: isCritical ? 'var(--crisis)' : 'var(--sev-3)', color: '#FFFFFF' }}
                >
                  LVL {severity} // {isCritical ? 'CRITICAL' : 'HIGH'}
                </span>
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                All connected screens locked with tactical imperatives
              </p>
            </div>
          </div>

          {/* SLA Countdown Timer */}
          {slaCountdown && slaCountdown.remainingSeconds > 0 && (
            <div className="glass-card px-3 py-1.5 flex flex-col items-end">
              <span className="font-sans text-[10px] text-[var(--warn)] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--warn)]" />
                SLA Timer
              </span>
              <span className="font-mono font-bold text-base text-[var(--warn)]">
                {slaCountdown.remainingSeconds}s
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 font-sans">
          {/* Location & Hazard Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass-card p-3">
              <div className="text-[10px] font-sans text-[var(--text-muted)]">Impacted Sector</div>
              <div className="font-display font-bold text-sm text-[var(--text-primary)] mt-0.5">{zoneName}</div>
            </div>
            <div className="glass-card p-3">
              <div className="text-[10px] font-sans text-[var(--text-muted)]">Hazard Reported</div>
              <div className="font-sans font-semibold text-xs text-[var(--crisis)] mt-0.5">{hazard}</div>
            </div>
            <div className="glass-card p-3">
              <div className="text-[10px] font-sans text-[var(--text-muted)]">Trapped Occupants</div>
              <div className={`font-display font-bold text-sm mt-0.5 ${trapped > 0 ? 'text-[var(--crisis)]' : 'text-[var(--safe)]'}`}>
                {trapped > 0 ? `${trapped} Souls Reported` : 'Zero Reported'}
              </div>
            </div>
          </div>

          {/* AI Ghost Dispatcher Imperative Directive */}
          <div className="glass-card p-4 border border-[var(--mesh)]/40 bg-white/[0.03]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans font-semibold text-xs text-[var(--mesh)]">
                DIRECTIVE FOR [{currentNode.role.toUpperCase()}]
              </span>
              <span className="glass-pill text-[10px] py-0.5 text-[var(--mesh)] font-mono">
                IMPERATIVE
              </span>
            </div>
            <p className="font-sans font-medium text-sm sm:text-base text-[var(--text-primary)] leading-[1.6]">
              "{roleInstruction}"
            </p>
          </div>

          {/* Safe Exit Vector */}
          <div className="glass-card p-3.5 border-l-4 border-l-[var(--safe)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--safe)]/10 text-[var(--safe)] flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-sans text-[var(--safe)] uppercase font-semibold">
                  Safe Egress Route
                </div>
                <div className="font-sans font-medium text-xs text-[var(--text-primary)]">
                  {safeExit || 'Main Portico Egress & North Stairwell A'}
                </div>
              </div>
            </div>
            <div className="glass-pill text-[10px] text-[var(--safe)] font-sans">
              <span>Follow Vector</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

          {/* Live Acknowledgment Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-sans text-[var(--text-muted)]">
              <span>Mesh Acknowledgment Status:</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                {currentAcks} / {totalConnected} Nodes ({ackPercentage}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(8, ackPercentage)}%`, backgroundColor: 'var(--safe)' }}
              />
            </div>
          </div>

          {/* Acknowledge Button */}
          <div className="pt-2">
            <button
              onClick={handleAcknowledge}
              className="w-full btn-crisis py-3.5 text-base font-display font-bold shadow-2xl"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Acknowledge & Execute Directive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
