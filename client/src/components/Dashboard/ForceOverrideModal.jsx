import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCrisisStore } from '../../store/crisisStore';
import { audioHaptics } from '../../services/audioHaptics';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  Flame,
  UserX,
  Check,
  Radio,
  Building2,
  ArrowRight,
  Sparkles,
  Languages
} from 'lucide-react';

/**
 * ForceOverrideModal Component
 * Full-screen tactical override popup triggered on Level 5 Critical Emergency events.
 * Role-adaptive:
 * - Citizen role: Clean & simple evacuation screen. Big button "I understand, moving to safety".
 *   Shows hazard type, exit direction ("Exit C, 40m ahead"), and localized message.
 *   Hides "Take Command" and tactical orders.
 * - Authority/Responder roles: Tactical emergency screen lock with full command telemetry and "ACKNOWLEDGE & TAKE COMMAND" button.
 */
export default function ForceOverrideModal() {
  const { t, i18n } = useTranslation();
  const {
    forcePriorityLock,
    activeCrisisEvent,
    dismissCrisisLock,
    setSelectedFloor,
    activeRole
  } = useCrisisStore();

  const [isMuted, setIsMuted] = useState(false);

  if (!forcePriorityLock || !activeCrisisEvent) {
    return null;
  }

  const {
    floorNumber = 3,
    roomNumber = '304',
    trapped = 2,
    hazard = 'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 2 log andar trapped hain, smoke bohot zyada hai please jaldi rescue team bhejo!',
    hazardType = 'FIRE',
    languageDetected = 'Hinglish (Hindi + English)',
    confidenceScore = '98.6%'
  } = activeCrisisEvent;

  const isCitizen = activeRole === 'citizen';

  const toggleAlarmSound = () => {
    if (isMuted) {
      audioHaptics.startSiren();
      setIsMuted(false);
    } else {
      audioHaptics.stopSiren();
      setIsMuted(true);
    }
  };

  const handleAcknowledge = () => {
    audioHaptics.stopSiren();
    if (floorNumber) {
      setSelectedFloor(floorNumber);
    }
    dismissCrisisLock();
  };

  // Localized message for Citizen based on current language
  const citizenMessage = i18n.language === 'hi'
    ? (hazard || 'तीसरी मंजिल पर आग और भारी धुआं फैला है! तुरंत सीढ़ियों से निकास C की ओर जाएं।')
    : (hazard || 'Critical fire and heavy smoke on Floor 3. Evacuate immediately using Exit C via stairwells.');

  return (
    <div className="fixed inset-0 z-[20000000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Flashing Red Warning Border Frame */}
      <div className="absolute inset-0 border-4 border-red-600/60 pointer-events-none animate-pulse" />

      {/* CITIZEN ROLE: SIMPLE, CLEAN EMERGENCY EVACUATION SCREEN */}
      {isCitizen ? (
        <div className="relative w-full max-w-lg rounded-3xl bg-slate-950/98 border-2 border-red-500 shadow-[0_0_80px_rgba(255,34,51,0.6)] p-6 sm:p-8 flex flex-col gap-5 text-slate-100 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-900/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white animate-bounce shadow-lg shadow-red-600/50 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-xs font-black tracking-widest animate-pulse">
                  LEVEL 5 // EVACUATION
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-1">
                  {i18n.language === 'hi' ? 'आपातकालीन निकासी आदेश' : 'EMERGENCY EVACUATION ORDER'}
                </h2>
              </div>
            </div>

            {/* Siren Mute Toggle */}
            <button
              type="button"
              onClick={toggleAlarmSound}
              className="touch-target p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-700/60 transition-all flex items-center gap-1.5 text-xs font-mono shrink-0"
              title={isMuted ? 'Unmute Siren' : 'Mute Siren'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse text-red-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Siren'}</span>
            </button>
          </div>

          {/* Hazard Type Card */}
          <div className="p-4 rounded-2xl bg-red-950/50 border border-red-600/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-red-300 uppercase tracking-wider block">
                {i18n.language === 'hi' ? 'खतरे का प्रकार' : 'HAZARD TYPE'}
              </span>
              <span className="text-lg font-black font-mono text-amber-300 flex items-center gap-2 mt-0.5">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                {hazardType || 'FIRE & HEAVY SMOKE'}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600/80 text-white font-mono text-xs font-bold uppercase animate-pulse">
              Critical
            </span>
          </div>

          {/* Arrow with Exit Direction & Distance */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border-2 border-emerald-500/80 space-y-2">
            <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider block">
              {i18n.language === 'hi' ? 'सुरक्षित निकास दिशा' : 'EXIT DIRECTION & DISTANCE'}
            </span>
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-900/60">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-wide">
                  Exit C, 40m ahead
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {i18n.language === 'hi'
                    ? 'कॉरिडोर 3 से दक्षिण की ओर मुड़ें → सीढ़ियों का उपयोग करें'
                    : 'Turn South down Corridor 3 → Use Stairwell B'}
                </div>
              </div>
            </div>
          </div>

          {/* Message in Selected Language */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              {i18n.language === 'hi' ? 'आपातकालीन संदेश' : 'EMERGENCY MESSAGE'}
            </span>
            <p className="text-sm font-sans text-amber-100 italic leading-relaxed">
              "{citizenMessage}"
            </p>
          </div>

          {/* Big Button: I understand, moving to safety */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAcknowledge}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-950/80 transition-all border border-emerald-400 touch-target"
            >
              <Check className="w-6 h-6 shrink-0" />
              <span>I understand, moving to safety</span>
            </button>
          </div>
        </div>
      ) : (
        /* AUTHORITY & FIRST RESPONDER: FULL TACTICAL COMMAND SCREEN (UNCHANGED) */
        <div className="relative w-full max-w-2xl rounded-3xl bg-slate-950/95 border-2 border-red-500 shadow-[0_0_80px_rgba(255,34,51,0.5)] p-5 sm:p-8 flex flex-col gap-5 text-slate-100 max-h-[92vh] overflow-y-auto">
          {/* Header Alert Ribbon */}
          <div className="flex items-start justify-between gap-4 border-b border-red-900/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white animate-bounce shadow-lg shadow-red-600/50 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-xs font-black tracking-widest animate-pulse">
                    LEVEL 5 // FORCE PRIORITY
                  </span>
                  <span className="font-mono text-xs text-red-400 font-semibold">
                    TACTICAL COMMAND LOCK
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white mt-1">
                  TACTICAL EMERGENCY SCREEN LOCK
                </h2>
              </div>
            </div>

            {/* Siren Audio Toggle */}
            <button
              type="button"
              onClick={toggleAlarmSound}
              className="touch-target p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-700/60 transition-all flex items-center gap-1.5 text-xs font-mono shrink-0"
              title={isMuted ? 'Unmute Siren' : 'Mute Siren'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse text-red-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Siren Active'}</span>
            </button>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60">
              <div className="text-[11px] font-mono text-red-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> LOCATION
              </div>
              <div className="text-xl font-mono font-black text-white">
                Floor {floorNumber}
              </div>
              <div className="text-xs font-mono text-slate-400">Room {roomNumber}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60">
              <div className="text-[11px] font-mono text-red-300 mb-1 flex items-center gap-1">
                <UserX className="w-3.5 h-3.5" /> TRAPPED CASUALTIES
              </div>
              <div className="text-xl font-mono font-black text-red-400">
                {trapped === 1 ? '1 SOUL' : `${trapped} SOULS`}
              </div>
              <div className="text-xs font-mono text-slate-400">
                Extraction Needed
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60">
              <div className="text-[11px] font-mono text-red-300 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> HAZARD CLASS
              </div>
              <div className="text-xl font-mono font-black text-amber-300">
                {hazardType}
              </div>
              <div className="text-xs font-mono text-slate-400">Immediate Hazard</div>
            </div>
          </div>

          {/* Realistic Hinglish Emergency Voice/Text Transcript & AI Extracted Fields */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                SOS VOICE / MESH TRANSCRIPT (HINGLISH):
              </span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <Languages className="w-3.5 h-3.5" />
                <span>{languageDetected}</span>
              </div>
            </div>

            <p className="text-sm font-sans text-amber-100 italic leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800">
              "{hazard}"
            </p>

            {/* AI Extracted Fields Grid */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  AI Ghost Triage Extracted Entities:
                </span>
                <span className="text-[11px] font-mono font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                  Confidence: {confidenceScore}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-navy-850/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">FLOOR</span>
                  <span className="font-bold text-white">Floor {floorNumber}</span>
                </div>
                <div className="p-2 rounded-lg bg-navy-850/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ROOM</span>
                  <span className="font-bold text-white">Room {roomNumber}</span>
                </div>
                <div className="p-2 rounded-lg bg-navy-850/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PEOPLE COUNT</span>
                  <span className="font-bold text-red-400">{trapped === 1 ? '1 Person' : `${trapped} Persons`}</span>
                </div>
                <div className="p-2 rounded-lg bg-navy-850/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">HAZARD TYPE</span>
                  <span className="font-bold text-amber-300">{hazardType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Directives */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" /> IMMEDIATE TACTICAL ORDERS:
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <div>
                • <strong>Floor Staff:</strong> Initiate stairwell evacuation for Floor {floorNumber}. Elevators locked down.
              </div>
              <div>
                • <strong>Tactical Breach:</strong> Deploy suppression team with oxygen masks & entry cutters to Room {roomNumber}.
              </div>
              <div>
                • <strong>ICU/ER:</strong> Ready 3 trauma bays at Ground Relief Hub for {trapped === 1 ? '1 casualty' : `${trapped} casualties`}.
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-red-900/40">
            <div className="font-mono text-xs text-slate-400">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Priority 112 override active • Multi-node broadcast
              </span>
            </div>

            <button
              type="button"
              onClick={handleAcknowledge}
              className="touch-target px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-sm flex items-center gap-2 shadow-xl shadow-red-600/40 transition-all border border-red-400"
            >
              <Check className="w-5 h-5 shrink-0" />
              <span>ACKNOWLEDGE & TAKE COMMAND</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
