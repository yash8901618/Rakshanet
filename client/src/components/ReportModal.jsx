import React, { useState, useMemo } from 'react';
import { useCrisisStore } from '../store/crisisStore';
import {
  AlertTriangle,
  Flame,
  Mic,
  Send,
  X,
  Sparkles,
  Shield,
  Building2,
  Users,
  Radio,
  Volume2
} from 'lucide-react';

// Local AI Triage NLP Parser
function parseLocalTriage(text = '') {
  const result = {
    floorNumber: 1,
    roomNumber: '101',
    trappedCount: 0,
    hazardType: 'FIRE',
    severity: 3,
    confidence: 0.95
  };

  if (!text || typeof text !== 'string') return result;

  const cleanText = text.trim();

  // 1. Floor extraction
  const floorMatch =
    cleanText.match(/(?:floor|level|fl|lvl)\s*[:#\-]?\s*([0-9]+|-1)/i) ||
    cleanText.match(/([0-9]+)(?:st|nd|rd|th)\s*floor/i) ||
    cleanText.match(/\bL([0-9]+)\b/i);

  if (floorMatch) {
    result.floorNumber = Math.max(1, Math.min(6, parseInt(floorMatch[1], 10)));
  } else if (/basement/i.test(cleanText)) {
    result.floorNumber = 1;
  } else if (/lobby|ground/i.test(cleanText)) {
    result.floorNumber = 1;
  } else if (/penthouse|rooftop/i.test(cleanText)) {
    result.floorNumber = 6;
  }

  // 2. Room extraction
  const roomMatch = cleanText.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) {
    result.roomNumber = roomMatch[1].toUpperCase();
    if (!floorMatch && /^[1-6][0-9]{2}$/.test(result.roomNumber)) {
      result.floorNumber = parseInt(result.roomNumber[0], 10);
    }
  } else {
    const standaloneRoom = cleanText.match(/\b([1-6][0-9]{2})\b/);
    if (standaloneRoom) {
      result.roomNumber = standaloneRoom[1];
      if (!floorMatch) {
        result.floorNumber = parseInt(result.roomNumber[0], 10);
      }
    } else {
      result.roomNumber = `${result.floorNumber}02`;
    }
  }

  // 3. Trapped count extraction
  const trappedMatch =
    cleanText.match(/([0-9]+)\s*(?:people|person|persons|souls|guests|victims|casualties|patients|occupants)?\s*trapped/i) ||
    cleanText.match(/([0-9]+)\s*(?:people|person|persons|souls|guests|victims|casualties|patients|occupants)\b/i) ||
    cleanText.match(/(?:trapped|count|casualties|victims)\s*[:#\-]?\s*([0-9]+)/i);

  if (trappedMatch) {
    result.trappedCount = parseInt(trappedMatch[1], 10);
  } else if (/trapped/i.test(cleanText)) {
    if (/one\s+trapped/i.test(cleanText)) result.trappedCount = 1;
    else if (/two\s+trapped/i.test(cleanText)) result.trappedCount = 2;
    else if (/three\s+trapped/i.test(cleanText)) result.trappedCount = 3;
    else if (/four\s+trapped/i.test(cleanText)) result.trappedCount = 4;
    else if (/five\s+trapped/i.test(cleanText)) result.trappedCount = 5;
    else result.trappedCount = 1;
  }

  // 4. Hazard Classification
  if (/smoke|gas|fumes|toxic|chemical|leak/i.test(cleanText)) {
    result.hazardType = 'SMOKE';
  } else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue/i.test(cleanText)) {
    result.hazardType = 'MEDICAL';
  } else if (/collapse|structural|crack|quake|debris|breach/i.test(cleanText)) {
    result.hazardType = 'COLLAPSE';
  } else {
    result.hazardType = 'FIRE';
  }

  // 5. Severity
  if (result.trappedCount >= 4 || /critical|massive|explosion|code red|flash fire/i.test(cleanText)) {
    result.severity = 5;
  } else if (result.trappedCount >= 2 || /severe|heavy smoke|urgent/i.test(cleanText)) {
    result.severity = 4;
  } else if (result.trappedCount === 1 || /warning|active|contained/i.test(cleanText)) {
    result.severity = 3;
  } else if (/caution|minor/i.test(cleanText)) {
    result.severity = 2;
  } else {
    result.severity = 1;
  }

  return result;
}

const PRESET_SCENARIOS = [
  {
    label: '🔥 Level 5 Fire Breach (402)',
    text: 'Fire broke out on 4th floor room 402, 5 people trapped'
  },
  {
    label: '💨 Level 4 Toxic Smoke (208)',
    text: 'Heavy toxic smoke detected on 2nd floor room 208 with 2 people trapped'
  },
  {
    label: '⚠️ Level 4 Wall Breach (501)',
    text: 'Structural wall collapse in 5th floor room 501, 3 trapped'
  },
  {
    label: '🩺 Level 3 Medical Blue (101)',
    text: 'Medical code blue cardiac emergency in 1st floor lobby 1 person'
  }
];

export default function ReportModal() {
  const { isReportModalOpen, setIsReportModalOpen, reportIncidentAction } = useCrisisStore();
  const [reportText, setReportText] = useState('Fire broke out on 4th floor room 402, 5 people trapped');
  const [reporterRole, setReporterRole] = useState('Tactical Node');
  const [isRecording, setIsRecording] = useState(false);

  // Live AI extraction preview
  const triagePreview = useMemo(() => {
    return parseLocalTriage(reportText);
  }, [reportText]);

  if (!isReportModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    reportIncidentAction({
      rawText: reportText.trim(),
      floorNumber: triagePreview.floorNumber,
      roomNumber: triagePreview.roomNumber,
      trappedCount: triagePreview.trappedCount,
      hazardType: triagePreview.hazardType,
      severity: triagePreview.severity,
      reporterRole
    });

    setIsReportModalOpen(false);
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setReportText('Fire broke out on 4th floor room 402, 5 people trapped');
      setIsRecording(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel bg-slate-950/95 border border-sky-500/30 shadow-[0_0_60px_rgba(56,189,248,0.25)] p-6 md:p-8 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/60">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white tracking-wide">
                SUBMIT EMERGENCY INCIDENT REPORT
              </h2>
              <p className="text-xs text-slate-400">
                Natural Language AI Ghost Triage & Telemetry Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Quick Scenario Chips */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Quick Preset Scenarios:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SCENARIOS.map((scenario, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReportText(scenario.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-slate-300 transition-all active:scale-95"
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area & Voice Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300 font-semibold">
                Natural Language Emergency Report:
              </label>
              <button
                type="button"
                onClick={handleSimulateVoice}
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-900 text-sky-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Listening...' : 'Simulate Voice Input'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="e.g. Fire broke out on 4th floor room 402, 5 people trapped"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-sm text-slate-100 font-sans outline-none resize-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* AI Ghost Triage Real-Time Breakdown Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-sky-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Sparkles className="w-4 h-4" /> AI Ghost Triage Extraction Preview:
              </span>
              <span className="text-[10px] text-slate-400">
                Confidence: {(triagePreview.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">FLOOR</div>
                <div className="text-sm font-mono font-bold text-sky-300">
                  Level {triagePreview.floorNumber}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">ROOM / SUITE</div>
                <div className="text-sm font-mono font-bold text-slate-200">
                  {triagePreview.roomNumber}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">TRAPPED SOULS</div>
                <div className="text-sm font-mono font-bold text-red-400">
                  {triagePreview.trappedCount}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">SEVERITY</div>
                <div
                  className={`text-sm font-mono font-black ${
                    triagePreview.severity >= 5
                      ? 'text-red-500'
                      : triagePreview.severity === 4
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }`}
                >
                  LEVEL {triagePreview.severity} / 5
                </div>
              </div>
            </div>
          </div>

          {/* Reporter Role Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">Reporting Node:</label>
              <select
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 outline-none"
              >
                <option value="Tactical Node">Tactical Command Node</option>
                <option value="Floor Staff">Floor Staff Node</option>
                <option value="Medical Unit">Ground Medical Unit</option>
                <option value="Facility Security">Facility Security Core</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95 border border-sky-400/40"
              >
                <Send className="w-4 h-4" />
                <span>Submit & Broadcast</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
