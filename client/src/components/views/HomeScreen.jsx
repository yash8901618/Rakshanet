import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  Flame,
  HeartPulse,
  Play,
  Wifi,
  Sparkles,
  Layers,
  ArrowRight,
  Radio,
  CheckCircle2
} from 'lucide-react';
import RakshaLogo from '../shell/RakshaLogo';
import StatCard from '../ui/StatCard';
import SeverityBadge from '../ui/SeverityBadge';
import { useCrisisStore } from '../../store/crisisStore';

const ROLES_LIST = [
  {
    id: 'citizen',
    icon: Users,
    color: 'from-sky-600 to-blue-700',
    borderColor: 'border-sky-500/40',
    accent: 'text-sky-400 light:text-sky-600',
    bgLight: 'bg-sky-50',
    key: 'citizen',
    features: ['1-Tap Offline SOS', 'BLE Mesh Peer Relay', 'Safe Shelter Locator']
  },
  {
    id: 'authority',
    icon: Shield,
    color: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/40',
    accent: 'text-amber-400 light:text-amber-600',
    bgLight: 'bg-amber-50',
    key: 'authority',
    features: ['Macro Risk Heatmap', 'AI Triage NLP Scoring', 'National Emergency 112 Grid']
  },
  {
    id: 'responder',
    icon: Flame,
    color: 'from-red-600 to-rose-700',
    borderColor: 'border-red-500/40',
    accent: 'text-red-400 light:text-red-600',
    bgLight: 'bg-red-50',
    key: 'responder',
    features: ['3D Indoor Digital Twin', 'Room Casualty Pins', 'Live "Rescued -1" Workflow']
  },
  {
    id: 'hospital',
    icon: HeartPulse,
    color: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500/40',
    accent: 'text-emerald-400 light:text-emerald-600',
    bgLight: 'bg-emerald-50',
    key: 'hospital',
    features: ['ER / ICU Bed Telemetry', 'Oxygen & Blood Monitoring', 'Auto-Reroute Ambulances']
  }
];

export const HomeScreen = ({ onSelectRole, onRunDemo }) => {
  const { t } = useTranslation();
  const { buildingState, hospitalState, incidents } = useCrisisStore();

  const totalTrapped = buildingState?.totalTrapped || 0;
  const erPercent = Math.round(
    ((hospitalState?.erOccupied || 0) / Math.max(1, hospitalState?.erCapacity || 1)) * 100
  );

  return (
    <div className="space-y-8 py-2 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl emergency-surface border border-[var(--border-strong)] p-6 sm:p-10 text-center">
        {/* Subtle Background Glow Elements */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-850 light:bg-slate-100 border border-[var(--border-subtle)] text-xs font-mono font-bold text-amber-400 light:text-amber-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{t('app.badge')}</span>
          </div>

          <div className="flex justify-center py-2">
            <RakshaLogo size="xl" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('app.tagline')}
          </h1>

          {/* Primary emergency network capability descriptor */}
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {t('app.subTagline')}
          </p>

          {/* Action Callouts */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRunDemo}
              className="touch-target px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm uppercase tracking-wider shadow-xl shadow-amber-950/40 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('actions.runLiveDemo')}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole('citizen')}
              className="touch-target px-5 py-3.5 rounded-xl bg-navy-850 light:bg-slate-100 hover:bg-navy-800 light:hover:bg-slate-200 border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <span>{t('roles.citizen')} (360px Mobile SOS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Live System Metrics Quick Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="System Metrics">
        <StatCard
          title={t('metrics.trappedSouls')}
          value={totalTrapped}
          unit="victims"
          subtitle="Tower Sector 4"
          severityLevel={totalTrapped > 0 ? 5 : 1}
        />
        <StatCard
          title={t('metrics.erOccupancy')}
          value={`${erPercent}%`}
          subtitle={`${hospitalState?.erOccupied || 0}/${hospitalState?.erCapacity || 16} beds occupied`}
          severityLevel={erPercent >= 80 ? 4 : 2}
        />
        <StatCard
          title={t('metrics.activeResponders')}
          value="8"
          unit="units"
          subtitle="NDRF & Fire Rescue"
          severityLevel={2}
        />
        <StatCard
          title={t('metrics.meshPeers')}
          value="14"
          unit="nodes"
          subtitle="BLE Delay-Tolerant Relay"
          severityLevel={1}
        />
      </section>

      {/* 4 Interactive Role Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {t('actions.switchRole')}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select an operational role to access dedicated telemetry, GIS heatmaps, and rescue workflows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES_LIST.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className={`rounded-2xl emergency-surface border ${role.borderColor} p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-200 group`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${role.color} text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-navy-850 light:bg-slate-100 border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {role.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-amber-400 transition-colors">
                      {t(`roles.${role.key}`)}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {t(`roles.${role.key}Desc`)}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)]">
                    {role.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => onSelectRole(role.id)}
                    className="touch-target w-full rounded-xl bg-navy-850 light:bg-slate-100 hover:bg-amber-500 hover:text-slate-950 light:hover:bg-amber-500 light:hover:text-white border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>{t('actions.enterRole')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Severity Reference Matrix */}
      <section className="rounded-xl emergency-surface border border-[var(--border-subtle)] p-5 space-y-3">
        <h3 className="font-bold text-sm tracking-wide text-[var(--text-primary)]">
          {t('severity.level')} Matrix (AI Triage 1–5 Scoring)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div
              key={lvl}
              className="p-3 rounded-lg bg-navy-850/50 light:bg-slate-50 border border-[var(--border-subtle)] space-y-1.5"
            >
              <SeverityBadge level={lvl} size="sm" />
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                {t(`severity.l${lvl}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
