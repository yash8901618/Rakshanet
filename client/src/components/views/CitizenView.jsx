import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertOctagon,
  FilePlus,
  MapPin,
  Wifi,
  Navigation,
  CheckCircle,
  PhoneCall,
  ShieldAlert,
  Flame,
  Radio,
  Share2,
  Sparkles,
  Languages
} from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';
import StatusPill from '../ui/StatusPill';
import AlertBanner from '../ui/AlertBanner';
import MeshNetwork from '../Mesh/MeshNetwork';
import { useCrisisStore } from '../../store/crisisStore';
import { useToast } from '../../context/ToastContext';

export const CitizenView = ({ onOpenReport }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { isOfflineMode, triggerCrisisEvent, buildingState, activeTab, setActiveTab } = useCrisisStore();
  const [sosSent, setSosSent] = useState(false);
  const totalTrapped = buildingState?.totalTrapped ?? 2;

  const HINGLISH_SOS_MESSAGE =
    'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 2 log andar trapped hain, smoke bohot zyada hai please jaldi rescue team bhejo!';

  const handleBroadcastSos = () => {
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }
    setSosSent(true);

    addToast({
      title: '🚨 EMERGENCY SOS BROADCASTED',
      message: 'Hinglish distress signal decoded by AI Ghost Triage. 2 casualties pinned in Room 304 and relayed across BLE mesh.',
      type: 'critical',
      duration: 7000
    });

    triggerCrisisEvent({
      incidentId: `CITIZEN-SOS-${Date.now()}`,
      severity: 5,
      floorNumber: 3,
      roomNumber: '304',
      hazard: HINGLISH_SOS_MESSAGE,
      hazardType: 'FIRE',
      trapped: 2,
      forcePriority: true,
      timestamp: Date.now()
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20">
      {/* Top Mobile Status Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
            {t('roles.citizen')} Portal
          </span>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
            Emergency Mode
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
              totalTrapped > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {totalTrapped === 1 ? '1 SOUL TRAPPED' : `${totalTrapped} SOULS TRAPPED`}
          </span>
          <StatusPill
            status={isOfflineMode ? 'mesh' : 'online'}
            customLabel={isOfflineMode ? 'BLE Mesh' : 'Grid Link 112'}
            size="sm"
          />
        </div>
      </div>

      {/* Active High-Priority Emergency Banner */}
      <AlertBanner
        severity={5}
        title="EVACUATION PROTOCOL ACTIVE"
        message="Structural stress detected in Sector 4. Proceed to Ground Level Exit C."
        location="Sector 4 · South Wing"
        isDismissible={false}
      />

      {/* Giant 1-Tap SOS Button (Panic Ergonomics) */}
      <div className="rounded-2xl emergency-surface border border-red-500/40 p-6 text-center space-y-4 shadow-2xl shadow-red-950/40">
        <p className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
          Emergency Distress Beacon
        </p>

        <button
          type="button"
          onClick={handleBroadcastSos}
          aria-label={t('actions.submitSos')}
          className={`w-full min-h-[96px] py-6 px-4 rounded-2xl font-mono font-extrabold text-lg uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl ${
            sosSent
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950 animate-pulse-l5'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-8 h-8 animate-ping" />
            <span>{sosSent ? 'BEACON ACTIVE' : t('actions.submitSos')}</span>
          </div>
          <span className="text-xs font-sans font-normal opacity-90 lowercase tracking-normal">
            {sosSent ? 'Relayed across 30 BLE Mesh Nodes to Responders' : 'Transmits via BLE Mesh even with NO CELL SERVICE'}
          </span>
        </button>

        {sosSent && (
          <div className="p-3 rounded-xl bg-emerald-950/60 light:bg-emerald-50 border border-emerald-500 text-emerald-300 light:text-emerald-800 text-xs flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Distress beacon pinned on Responder Tactical Map (Floor 3, Rm 304)</span>
          </div>
        )}
      </div>

      {/* AI EXTRACTED FIELDS & REALISTIC HINGLISH TRANSCRIPT (SHOWN AFTER SOS) */}
      {sosSent && (
        <div className="rounded-2xl emergency-surface border border-amber-500/50 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-mono">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              VOICE / MESH SOS TRANSCRIPT
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              Hinglish
            </span>
          </div>

          <p className="text-xs font-sans italic text-amber-100 light:text-amber-950 bg-black/40 light:bg-amber-50/80 p-3 rounded-xl border border-amber-500/30 leading-relaxed">
            "{HINGLISH_SOS_MESSAGE}"
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                AI Ghost Triage Extracted Fields
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                Confidence: 98.6%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">LOCATION</span>
                <span className="font-bold text-[var(--text-primary)]">Floor 3 · Rm 304</span>
              </div>
              <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">PEOPLE TRAPPED</span>
                <span className="font-bold text-red-400">2 Persons (२ व्यक्ति)</span>
              </div>
              <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">HAZARD CLASS</span>
                <span className="font-bold text-amber-400">FIRE & HEAVY SMOKE</span>
              </div>
              <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">LANGUAGE</span>
                <span className="font-bold text-emerald-400">Hinglish (Detected)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESH ROUTE PREVIEW: CONNECTING SOS AND MESH TOPOLOGY */}
      {(sosSent || activeTab === 'sos') && (
        <div className="space-y-2">
          <MeshNetwork
            inline={true}
            autoStart={true}
            onOpenFullMesh={() => setActiveTab('mesh')}
          />
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Report Hazard */}
        <button
          type="button"
          onClick={onOpenReport}
          className="touch-target p-4 rounded-xl emergency-surface border border-[var(--border-strong)] hover:border-amber-500 text-left flex flex-col justify-between transition-all active:scale-95 group"
        >
          <div className="p-2.5 rounded-lg bg-amber-500/15 light:bg-amber-100 text-amber-400 light:text-amber-700 w-fit mb-2 group-hover:scale-105 transition-transform">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">
              {t('actions.reportHazard')}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              AI NLP hazard scoring & triage
            </p>
          </div>
        </button>

        {/* National 112 Helpline */}
        <a
          href="tel:112"
          className="touch-target p-4 rounded-xl emergency-surface border border-[var(--border-strong)] hover:border-emerald-500 text-left flex flex-col justify-between transition-all active:scale-95 group"
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/15 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 w-fit mb-2 group-hover:scale-105 transition-transform">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">
              Dial ERSS 112
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Direct National Emergency Helpline
            </p>
          </div>
        </a>
      </div>

      {/* Safe Shelters & Evacuation Points */}
      <div className="rounded-xl emergency-surface border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              {t('nav.shelters')} Near You
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            3 OPEN
          </span>
        </div>

        <div className="space-y-2">
          {[
            {
              name: 'Community Relief Pavilion C',
              dist: '250m',
              capacity: '85/200 spaces',
              status: 'Open'
            },
            {
              name: 'Metro Station Underground Concourse',
              dist: '450m',
              capacity: '140/500 spaces',
              status: 'Open'
            },
            {
              name: 'Govt Higher Secondary Gym Hall',
              dist: '800m',
              capacity: '190/200 spaces',
              status: 'Full'
            }
          ].map((shelter, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-navy-850/50 light:bg-slate-50 border border-[var(--border-subtle)] flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-[var(--text-primary)]">
                  {shelter.name}
                </p>
                <div className="flex items-center gap-2 text-[var(--text-muted)] mt-0.5 font-mono text-[11px]">
                  <span>{shelter.dist}</span>
                  <span>•</span>
                  <span>{shelter.capacity}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    shelter.status === 'Open'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-950 text-red-400 border border-red-500/30'
                  }`}
                >
                  {shelter.status}
                </span>
                <button
                  type="button"
                  aria-label={`Navigate to ${shelter.name}`}
                  className="touch-target p-1.5 rounded-lg bg-navy-800 light:bg-slate-200 text-amber-400 hover:text-white"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitizenView;
