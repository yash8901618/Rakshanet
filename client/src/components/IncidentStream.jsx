import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Bot
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';

const SEVERITY_META = [
  { level: 1, label: 'Low (1)', color: '#34d399', desc: 'Localized minor note; monitor' },
  { level: 2, label: 'Caution (2)', color: '#fbbf24', desc: 'Precautionary alert; standby' },
  { level: 3, label: 'Warning (3)', color: '#fb923c', desc: 'Active hazard; tactical dispatch' },
  { level: 4, label: 'High (4)', color: '#f87171', desc: 'Severe hazard; screen override lock' },
  { level: 5, label: 'Critical (5)', color: '#ef4444', desc: 'Life-safety emergency; evacuation' }
];

// Client quick AI NLP triage parser
function parseAiReportText(text) {
  if (!text) return null;
  const res = {};

  const floorMatch = text.match(/(?:floor|level|fl|lvl)\s*[:#\-]?\s*([0-9]+|-1)/i) 
    || text.match(/([0-9]+)(?:st|nd|rd|th)\s*floor/i)
    || text.match(/\bL([0-9]+)\b/i);
  if (floorMatch) res.floorNumber = parseInt(floorMatch[1], 10);

  const roomMatch = text.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) res.roomNumber = roomMatch[1].toUpperCase();

  const trappedMatch = text.match(/([0-9]+)\s*(?:trapped|people|persons|souls|guests|victims|casualties|patients)/i)
    || text.match(/(?:trapped|count)\s*[:#\-]?\s*([0-9]+)/i);
  if (trappedMatch) res.trappedCount = parseInt(trappedMatch[1], 10);

  if (/smoke|gas|fumes|chemical/i.test(text)) res.hazardType = 'SMOKE';
  else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue/i.test(text)) res.hazardType = 'MEDICAL';
  else if (/collapse|structural|crack|quake|debris|breach/i.test(text)) res.hazardType = 'COLLAPSE';
  else if (/fire|blaze|flame|combustion/i.test(text)) res.hazardType = 'FIRE';

  return Object.keys(res).length > 0 ? res : null;
}

export function IncidentStream() {
  const { 
    incidents, 
    isReportModalOpen, 
    setIsReportModalOpen,
    reportIncidentAction,
    rescueFloorStepAction 
  } = useCrisisStore();

  const [hazardText, setHazardText] = useState('');
  const [floorNumber, setFloorNumber] = useState(2);
  const [roomNumber, setRoomNumber] = useState('204');
  const [trappedCount, setTrappedCount] = useState(2);
  const [severity, setSeverity] = useState(4);
  const [hazardType, setHazardType] = useState('FIRE');

  // Real-time AI NLP extraction
  const aiExtracted = useMemo(() => parseAiReportText(hazardText), [hazardText]);

  const applyAiTelemetry = () => {
    if (!aiExtracted) return;
    if (aiExtracted.floorNumber !== undefined) setFloorNumber(aiExtracted.floorNumber);
    if (aiExtracted.roomNumber) setRoomNumber(aiExtracted.roomNumber);
    if (aiExtracted.trappedCount !== undefined) setTrappedCount(aiExtracted.trappedCount);
    if (aiExtracted.hazardType) setHazardType(aiExtracted.hazardType);
  };

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      if ((b.severity || 0) !== (a.severity || 0)) {
        return (b.severity || 0) - (a.severity || 0);
      }
      return (b.trappedCount || 0) - (a.trappedCount || 0);
    });
  }, [incidents]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hazardText.trim()) return;

    reportIncidentAction({
      rawText: hazardText,
      floorNumber: Number(floorNumber),
      roomNumber: roomNumber.trim() || undefined,
      trappedCount: Number(trappedCount),
      hazardType,
      severity: Number(severity)
    });

    audioEngine.playAlert(Number(severity));
    triggerHaptic(Number(severity));

    setHazardText('');
    setIsReportModalOpen(false);
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-white">
              INCIDENT TRIAGE & TELEMETRY STREAM
            </h2>
            <p className="font-sans text-xs text-[var(--text-muted)]">
              Prioritized by Life-Safety Severity & Trapped Occupants
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

      {/* Incidents List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 min-h-[220px]">
        {sortedIncidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
            <CheckCircle className="w-8 h-8 text-[var(--safe)]/40 mb-2" />
            <div className="font-sans font-medium text-xs text-white">
              All sectors nominal
            </div>
            <div className="font-sans text-[11px] text-[var(--text-faint)] mt-1 max-w-[240px]">
              No active emergency declared. Use Declare Incident to test triage.
            </div>
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const sev = incident.severity || 3;
            const isSecured = incident.trappedCount === 0 || incident.status === 'SECURED';
            const trapped = incident.trappedCount || 0;

            const borderColor = 
              sev === 5 ? '#ef4444' : 
              sev === 4 ? '#f87171' : 
              sev === 3 ? '#fb923c' : '#34d399';

            return (
              <div
                key={incident.id}
                className="glass-card p-3.5 border-l-4 space-y-2 relative overflow-hidden"
                style={{ borderLeftColor: borderColor }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${borderColor}22`,
                          color: borderColor,
                          border: `1px solid ${borderColor}55`
                        }}
                      >
                        LEVEL {sev} // {sev === 5 ? 'CRITICAL' : sev === 4 ? 'SEVERE' : 'WARNING'}
                      </span>
                      <span className="font-display font-bold text-xs text-white">
                        Floor {incident.floorNumber} (Rm {incident.roomNumber || 'Sector'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-sans">
                      {incident.rawText}
                    </p>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isSecured 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                  }`}>
                    {isSecured ? 'SECURED' : `${trapped} TRAPPED`}
                  </span>
                </div>

                {/* Quick Rescue Step */}
                {!isSecured && (
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end">
                    <button
                      onClick={() => rescueFloorStepAction(incident.floorNumber)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 shadow-sm"
                    >
                      <LifeBuoy className="w-3 h-3" />
                      <span>Rescued -1</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Incident Reporting Modal with AI NLP Triage */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg overflow-hidden border border-[var(--border-bright)] shadow-2xl">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    DECLARE EMERGENCY INCIDENT
                  </h3>
                  <p className="font-sans text-xs text-[var(--text-muted)]">
                    AI Auto-extracts floor, room number, and trapped casualties
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
                <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                  Hazard Description (Voice or Text)
                </label>
                <input
                  type="text"
                  value={hazardText}
                  onChange={(e) => setHazardText(e.target.value)}
                  placeholder="e.g. Active fire on Floor 4 in Room 402 with 3 people trapped..."
                  className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              {/* AI Auto-Extraction Chip Preview */}
              {aiExtracted && (
                <div 
                  onClick={applyAiTelemetry}
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
                    Apply ⚡
                  </span>
                </div>
              )}

              {/* Floor & Room Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                    Floor Level (1 - 6)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                    Room / Unit #
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Severity & Trapped Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                    Severity Level (1 - 5)
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs text-white"
                  >
                    {SEVERITY_META.map(m => (
                      <option key={m.level} value={m.level}>
                        Level {m.level} — {m.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                    Trapped Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={trappedCount}
                    onChange={(e) => setTrappedCount(e.target.value)}
                    className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  Broadcast to Mesh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
