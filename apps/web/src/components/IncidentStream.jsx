import React, { useState, useMemo, useEffect } from 'react';
import { 
  Flame, 
  CheckCircle, 
  Plus, 
  ShieldAlert, 
  X,
  AlertOctagon,
  Users,
  Send,
  LifeBuoy,
  WifiOff,
  CloudUpload,
  HeartPulse,
  Wind,
  Layers,
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';

const SEVERITY_META = [
  { level: 1, label: 'Low (1)', color: '#34d399', desc: 'Localized condition; monitor' },
  { level: 2, label: 'Caution (2)', color: '#fbbf24', desc: 'Precautionary alert; standby units' },
  { level: 3, label: 'Warning (3)', color: '#fb923c', desc: 'Active hazard; tactical dispatch' },
  { level: 4, label: 'High (4)', color: '#f87171', desc: 'Severe hazard; screen override lock' },
  { level: 5, label: 'Critical (5)', color: '#ef4444', desc: 'Life-safety emergency; immediate evacuation' }
];

// Client-side quick AI telemetry extractor
function parseReportText(text) {
  if (!text) return null;
  const result = {};

  const floorMatch = text.match(/(?:floor|level|fl|lvl)\s*[:#\-]?\s*([0-9]+|-1)/i) 
    || text.match(/([0-9]+)(?:st|nd|rd|th)\s*floor/i)
    || text.match(/\bL([0-9]+)\b/i);
  if (floorMatch) result.floorNumber = parseInt(floorMatch[1], 10);

  const roomMatch = text.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) result.roomNumber = roomMatch[1].toUpperCase();

  const trappedMatch = text.match(/([0-9]+)\s*(?:trapped|people|persons|souls|guests|victims|casualties|patients)/i)
    || text.match(/(?:trapped|count)\s*[:#\-]?\s*([0-9]+)/i);
  if (trappedMatch) result.trappedCount = parseInt(trappedMatch[1], 10);

  if (/smoke|gas|fumes|chemical/i.test(text)) result.hazardType = 'SMOKE';
  else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue/i.test(text)) result.hazardType = 'MEDICAL';
  else if (/collapse|structural|crack|quake|debris|breach/i.test(text)) result.hazardType = 'COLLAPSE';
  else if (/fire|blaze|flame|combustion/i.test(text)) result.hazardType = 'FIRE';

  return Object.keys(result).length > 0 ? result : null;
}

export const IncidentStream = () => {
  const { 
    incidents, 
    zones, 
    currentNode, 
    isReportModalOpen, 
    setIsReportModalOpen,
    isOfflineMode,
    offlineQueue,
    isSyncing,
    lastSyncNotice,
    dispatchRescueAction,
    rescueStepAction,
    reportIncidentAction,
    resolveIncidentInStore 
  } = useCrisisStore();

  const [selectedZone, setSelectedZone] = useState(zones[0]?.id || 'zone-kitchen');
  const [hazardText, setHazardText] = useState('');
  const [severity, setSeverity] = useState(4);
  const [trappedGuess, setTrappedGuess] = useState(2);
  const [hazardType, setHazardType] = useState('FIRE');
  const [roomNumber, setRoomNumber] = useState('');

  // Real-time AI extraction suggestion
  const aiExtracted = useMemo(() => parseReportText(hazardText), [hazardText]);

  const applyAiExtraction = () => {
    if (!aiExtracted) return;
    if (aiExtracted.trappedCount !== undefined) setTrappedGuess(aiExtracted.trappedCount);
    if (aiExtracted.roomNumber) setRoomNumber(aiExtracted.roomNumber);
    if (aiExtracted.hazardType) setHazardType(aiExtracted.hazardType);
    if (aiExtracted.floorNumber !== undefined) {
      const matchZ = zones.find(z => z.level === aiExtracted.floorNumber);
      if (matchZ) setSelectedZone(matchZ.id);
    }
  };

  // Sorted incidents: Severity (High->Low) then Trapped Count (High->Low)
  const sortedActiveIncidents = useMemo(() => {
    return incidents
      .filter(i => i.status !== 'RESOLVED')
      .sort((a, b) => {
        if ((b.severity || 0) !== (a.severity || 0)) {
          return (b.severity || 0) - (a.severity || 0);
        }
        if ((b.trapped || 0) !== (a.trapped || 0)) {
          return (b.trapped || 0) - (a.trapped || 0);
        }
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
  }, [incidents]);

  const pastIncidents = useMemo(() => {
    return incidents.filter(i => i.status === 'RESOLVED');
  }, [incidents]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hazardText.trim()) return;

    const zoneObj = zones.find(z => z.id === selectedZone);

    reportIncidentAction({
      zoneId: selectedZone,
      zoneName: zoneObj?.name || 'Sector Alert',
      floorLevel: zoneObj?.level !== undefined ? zoneObj.level : 0,
      text: hazardText,
      severity: Number(severity),
      trappedGuess: Number(trappedGuess),
      hazardType,
      roomNumber: roomNumber.trim() || undefined
    });

    audioEngine.playAlert(Number(severity));
    triggerHaptic(Number(severity));

    setHazardText('');
    setTrappedGuess(0);
    setRoomNumber('');
    setIsReportModalOpen(false);
  };

  const handleDispatch = (incidentId) => {
    audioEngine.playAckChime();
    triggerHaptic(2);
    dispatchRescueAction(incidentId, 'Tactical Extraction Unit 1');
  };

  const handleRescueStep = (incidentId) => {
    audioEngine.playRescueChime();
    triggerHaptic(1);
    rescueStepAction(incidentId);
  };

  const handleResolve = (incidentId, zoneId) => {
    resolveIncidentInStore(incidentId, zoneId);
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--crisis)]">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
                INCIDENT CONTROL & TRIAGE
              </h2>
              {sortedActiveIncidents.length > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {sortedActiveIncidents.length} ACTIVE
                </span>
              )}
            </div>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Prioritized by Severity (High→Low) & Trapped Occupants
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="btn-crisis text-xs py-1.5 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Offline Status Notice */}
      {isOfflineMode && (
        <div className="mb-3 px-3 py-2 rounded-[10px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs font-sans text-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span><strong>Offline Simulation Active:</strong> {offlineQueue.length} events buffered in IndexedDB/Storage</span>
          </div>
          <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded font-mono">LOCAL QUEUE</span>
        </div>
      )}

      {lastSyncNotice && (
        <div className="mb-3 px-3 py-2 rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-sans text-emerald-300 animate-fade-in">
          <CloudUpload className="w-4 h-4 text-emerald-400" />
          <span>{lastSyncNotice}</span>
        </div>
      )}

      {/* Incidents List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[200px]">
        {sortedActiveIncidents.length === 0 && pastIncidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
            <CheckCircle className="w-8 h-8 text-[var(--safe)]/40 mb-2" />
            <div className="font-sans font-medium text-xs text-[var(--text-primary)]">
              All facility sectors nominal
            </div>
            <div className="font-sans text-[11px] text-[var(--text-faint)] mt-1 max-w-[240px]">
              No active crisis reported. Use Declare Incident or Simulation Controls to trigger drills.
            </div>
          </div>
        ) : (
          <>
            {sortedActiveIncidents.map((incident) => {
              const sev = incident.severity || 1;
              const isEnRoute = incident.status === 'EN_ROUTE';
              const isSecured = incident.status === 'SECURED' || (incident.trapped === 0 && incident.initialTrapped > 0);
              const trappedCount = incident.trapped || 0;

              const borderColor = 
                sev === 5 ? '#ef4444' : 
                sev === 4 ? '#f87171' : 
                sev === 3 ? '#fb923c' : 
                sev === 2 ? '#fbbf24' : '#34d399';

              return (
                <div
                  key={incident.id}
                  className="glass-card p-4 border-l-4 zone-card-transition space-y-3 relative overflow-hidden"
                  style={{ borderLeftColor: borderColor }}
                >
                  {/* Top Bar: Severity Level + Zone Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm"
                          style={{ 
                            backgroundColor: `${borderColor}22`,
                            color: borderColor,
                            border: `1px solid ${borderColor}55`
                          }}
                        >
                          LEVEL {sev} // {sev === 5 ? 'CRITICAL' : sev === 4 ? 'SEVERE' : sev === 3 ? 'WARNING' : 'CAUTION'}
                        </span>

                        <span className="font-display font-bold text-xs text-[var(--text-primary)]">
                          {incident.zoneName || incident.zoneId}
                        </span>

                        {incident.floorLevel !== undefined && (
                          <span className="font-sans text-[10px] text-[var(--text-muted)] bg-white/[0.04] px-1.5 py-0.5 rounded">
                            {incident.floorLevel === 0 ? 'L0 Ground' : incident.floorLevel === -1 ? '-L1 Basement' : `L${incident.floorLevel}`}
                          </span>
                        )}

                        {incident.roomNumber && (
                          <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            Rm {incident.roomNumber}
                          </span>
                        )}
                      </div>

                      <div className="font-sans text-xs text-white/90 font-medium">
                        {incident.hazard || incident.text}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isSecured ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          SECURED
                        </span>
                      ) : isEnRoute ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                          <LifeBuoy className="w-3 h-3 text-amber-400" />
                          TEAM EN ROUTE
                        </span>
                      ) : (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-400" />
                          ACTIVE CRISIS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-sans pt-2 border-t border-[var(--border-subtle)] bg-white/[0.015] p-2 rounded-[8px]">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Trapped Occupants:</span>
                      <strong className={trappedCount > 0 ? 'text-red-400 font-mono text-sm' : 'text-emerald-400 font-mono text-sm'}>
                        {trappedCount > 0 ? `⚠️ ${trappedCount} Souls` : '0 (Clear)'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Hazard Class:</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold uppercase">
                        {incident.hazardType || 'FIRE'}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[var(--text-muted)] block text-[10px]">Reporter:</span>
                      <span className="text-[var(--text-primary)] truncate block">
                        {incident.reporterRole}
                      </span>
                    </div>
                  </div>

                  {/* Mitigation Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Dispatch Rescue Team */}
                      {!isEnRoute && !isSecured && (
                        <button
                          onClick={() => handleDispatch(incident.id)}
                          className="btn-secondary text-xs text-amber-300 hover:border-amber-400/50 hover:bg-amber-400/10 py-1 px-2.5"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dispatch Rescue Team</span>
                        </button>
                      )}

                      {/* Rescue Step (+1 Saved) */}
                      {trappedCount > 0 && (
                        <button
                          onClick={() => handleRescueStep(incident.id)}
                          className="btn-secondary text-xs text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-400/10 py-1 px-2.5 shadow-sm"
                          title="Save 1 trapped occupant and update 3D twin"
                        >
                          <LifeBuoy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Rescue Step (+1 Saved)</span>
                        </button>
                      )}
                    </div>

                    {/* Resolve Button */}
                    <button
                      onClick={() => handleResolve(incident.id, incident.zoneId)}
                      className="btn-secondary text-[11px] py-1 px-2 text-[var(--text-muted)] hover:text-white"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Resolved Archive */}
            {pastIncidents.length > 0 && (
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                <div className="text-[10px] font-mono text-[var(--text-faint)] uppercase tracking-wider">
                  Resolved History ({pastIncidents.length})
                </div>
                {pastIncidents.map((incident) => (
                  <div key={incident.id} className="glass-card p-2 opacity-50 text-xs flex items-center justify-between">
                    <span className="font-sans text-[var(--text-muted)] line-through">
                      {incident.hazard} ({incident.zoneName})
                    </span>
                    <span className="font-mono text-[10px] text-[var(--safe)] font-semibold">
                      RESOLVED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Incident Reporting Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg overflow-hidden border border-[var(--border-bright)] shadow-2xl">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--crisis)]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    DECLARE FACILITY CRISIS
                  </h3>
                  <p className="font-sans text-xs text-[var(--text-muted)]">
                    AI Auto-extracts spatial floors, room numbers, and trapped casualties
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="btn-secondary p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1.5">
                  Hazard Description (Voice or Text)
                </label>
                <input
                  type="text"
                  value={hazardText}
                  onChange={(e) => setHazardText(e.target.value)}
                  placeholder="e.g. Active fire on Floor 4 in Room 402 with 3 people trapped..."
                  className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--mesh)]"
                  required
                />
              </div>

              {/* AI Auto-Extraction Chip Preview */}
              {aiExtracted && (
                <div 
                  onClick={applyAiExtraction}
                  className="p-2.5 rounded-[10px] bg-sky-950/40 border border-sky-500/40 flex items-center justify-between text-xs cursor-pointer hover:bg-sky-950/70 transition-all text-sky-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400 animate-pulse flex-shrink-0" />
                    <span>
                      <strong>AI Extracted:</strong>{' '}
                      {aiExtracted.floorNumber !== undefined && `Floor ${aiExtracted.floorNumber} • `}
                      {aiExtracted.roomNumber && `Rm ${aiExtracted.roomNumber} • `}
                      {aiExtracted.trappedCount !== undefined && `${aiExtracted.trappedCount} Trapped • `}
                      {aiExtracted.hazardType}
                    </span>
                  </div>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-400/30 whitespace-nowrap">
                    Click to Apply ⚡
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[var(--text-muted)] mb-1.5">
                  Affected Venue Zone & Floor
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--mesh)]"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.floor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hazard Classification */}
              <div>
                <label className="block text-[var(--text-muted)] mb-1.5">
                  Hazard Classification Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'FIRE', label: 'Fire Hazard', icon: Flame },
                    { type: 'SMOKE', label: 'Smoke / Gas', icon: Wind },
                    { type: 'COLLAPSE', label: 'Structural', icon: Layers },
                    { type: 'MEDICAL', label: 'Medical', icon: HeartPulse }
                  ].map(h => {
                    const Icon = h.icon;
                    return (
                      <button
                        key={h.type}
                        type="button"
                        onClick={() => setHazardType(h.type)}
                        className={`p-2 rounded-[8px] border text-center font-sans transition-all flex flex-col items-center gap-1 ${
                          hazardType === h.type
                            ? 'bg-white/[0.08] border-[var(--mesh)] text-white font-semibold'
                            : 'bg-white/[0.02] border-[var(--border)] text-[var(--text-muted)] hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-[var(--mesh)]" />
                        <span className="text-[10px]">{h.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Level (1 - 5) */}
              <div>
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span>Severity Level (1-5):</span>
                  <span className="font-display font-bold text-xs text-white">
                    Level {severity} — {SEVERITY_META[severity - 1]?.desc}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SEVERITY_META.map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setSeverity(item.level)}
                      className={`p-2.5 rounded-[8px] text-center border font-sans text-xs transition-all ${
                        severity === item.level
                          ? 'bg-white/[0.08] border-white text-white font-semibold shadow-md'
                          : 'bg-white/[0.02] border-[var(--border)] text-[var(--text-muted)] hover:text-white'
                      }`}
                      style={{
                        borderColor: severity === item.level ? item.color : undefined
                      }}
                    >
                      <div className="font-display font-bold text-sm" style={{ color: item.color }}>{item.level}</div>
                      <div className="text-[9px] text-[var(--text-faint)] truncate">{item.label.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
                {severity >= 4 && (
                  <p className="text-[11px] font-sans text-red-400 mt-2 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                    Severity Level {severity} will immediately engage the Force-Priority Screen Lock on all connected mesh devices.
                  </p>
                )}
              </div>

              {/* Estimated Trapped & Room Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5">
                    Trapped Occupants Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={trappedGuess}
                    onChange={(e) => setTrappedGuess(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--mesh)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5">
                    Room / Unit # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 402 or 204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--mesh)] font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hazardText.trim()}
                  className="btn-crisis"
                >
                  Transmit to Mesh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
