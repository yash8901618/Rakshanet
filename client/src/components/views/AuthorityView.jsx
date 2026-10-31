import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Flame,
  Radio,
  SlidersHorizontal,
  Zap,
  Map,
  Users,
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import StatCard from '../ui/StatCard';
import SectionCard from '../ui/SectionCard';
import SeverityBadge from '../ui/SeverityBadge';
import StatusPill from '../ui/StatusPill';
import IncidentFeed from '../Dashboard/IncidentFeed';
import Building3DTwin from '../3D/Building3DTwin';
import { useCrisisStore } from '../../store/crisisStore';
import { useToast } from '../../context/ToastContext';
import { deduplicateIncidents } from '../../services/incidentDeduplication';

export const AuthorityView = ({ onOpenReport }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    buildingState,
    hospitalState,
    incidents,
    triggerCrisisEvent
  } = useCrisisStore();

  const deduplicated = useMemo(() => deduplicateIncidents(incidents || []), [incidents]);
  const activeDeduplicated = deduplicated.filter(i => i.status === 'ACTIVE' || i.status === 'EN_ROUTE');
  const visibleCardsCount = activeDeduplicated.length;
  const rawReportsCount = (incidents || []).filter(i => i.status === 'ACTIVE' || i.status === 'EN_ROUTE').length;

  const totalTrapped = buildingState?.totalTrapped || 0;
  const erPercent = Math.round(
    ((hospitalState?.erOccupied || 0) / Math.max(1, hospitalState?.erCapacity || 1)) * 100
  );

  const handleTriggerPriorityOverride = () => {
    triggerCrisisEvent({
      incidentId: `AUTH-FORCE5-${Date.now()}`,
      severity: 5,
      floorNumber: 4,
      roomNumber: '402',
      hazard: 'MANDATORY LEVEL 5 FORCE PRIORITY: Severe structural risk in Tower Sector 4. Immediate high-rise evacuation ordered.',
      hazardType: 'FIRE',
      trapped: 5,
      forcePriority: true,
      timestamp: Date.now()
    });

    addToast({
      title: '🚨 PRIORITY OVERRIDE DISPATCHED',
      message: 'All mobile handsets within 1km radius received directional audio and screen lockdown override.',
      type: 'critical',
      duration: 6000
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Emergency Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl emergency-surface border border-[var(--border-strong)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
              {t('roles.authority')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
              NDMA DISASTER GRID
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-1">
            Command & Control Matrix
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            AI Triage deduplication, citywide resource dispatch, and national emergency broadcast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerPriorityOverride}
            className="touch-target px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 light:bg-red-700 light:hover:bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950 flex items-center gap-2 transition-all active:scale-95"
            title="Trigger Level 5 Lock-Screen Priority Override"
          >
            <Zap className="w-4 h-4" />
            <span>{t('actions.forcePriority')}</span>
          </button>
        </div>
      </div>

      {/* Citywide Telemetry Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('metrics.trappedSouls')}
          value={totalTrapped}
          unit="persons"
          subtitle="Sector 4 Sky-Rise"
          severityLevel={totalTrapped > 0 ? 5 : 1}
          trend={{ value: totalTrapped > 0 ? 'Active' : 'Clear', direction: totalTrapped > 0 ? 'up' : 'down' }}
        />
        <StatCard
          title={t('metrics.erOccupancy')}
          value={`${erPercent}%`}
          subtitle={`${hospitalState?.erOccupied || 0}/${hospitalState?.erCapacity || 16} beds`}
          severityLevel={erPercent >= 80 ? 4 : 2}
          trend={{ value: `${hospitalState?.icuOccupied || 0} ICU bays active`, direction: 'neutral' }}
        />
        <StatCard
          title={t('metrics.activeResponders')}
          value="8"
          unit="teams"
          subtitle="NDRF & Fire Services"
          severityLevel={2}
          trend={{ value: '4 en route', direction: 'down' }}
        />
        <StatCard
          title={t('metrics.resolvedIncidents')}
          value="18"
          unit="cleared"
          subtitle="Past 6 Hours"
          severityLevel={1}
          trend={{ value: '+4', direction: 'down' }}
        />
      </div>

      {/* Main Dual Grid: 3D Twin & Incident Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Twin & GIS Overview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <SectionCard
            title={t('nav.digitalTwin')}
            subtitle="Multi-Story Wireframe & Live Floor Heatmap"
            icon={Building2}
            badge={<StatusPill status="online" size="sm" />}
          >
            <Building3DTwin />
          </SectionCard>
        </div>

        {/* Right Column: AI Triage Incident Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <SectionCard
            title={t('nav.incidents')}
            subtitle="AI Ghost Triage Deduplication & Severity (1–5)"
            icon={Radio}
            badge={
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 flex items-center gap-1.5">
                <span>{visibleCardsCount} Active</span>
                {rawReportsCount > visibleCardsCount && (
                  <span className="text-[10px] text-purple-400 font-mono">
                    ({rawReportsCount} merged)
                  </span>
                )}
              </span>
            }
          >
            <IncidentFeed />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AuthorityView;
