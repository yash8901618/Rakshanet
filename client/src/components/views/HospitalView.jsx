import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  Activity,
  Bed,
  Ambulance,
  Wind,
  Droplet,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import HospitalTelemetry from '../Dashboard/HospitalTelemetry';
import StatCard from '../ui/StatCard';
import SectionCard from '../ui/SectionCard';
import StatusPill from '../ui/StatusPill';
import { useCrisisStore } from '../../store/crisisStore';

export const HospitalView = () => {
  const { t } = useTranslation();
  const { hospitalState } = useCrisisStore();

  const erPercent = Math.round(
    ((hospitalState?.erOccupied || 0) / Math.max(1, hospitalState?.erCapacity || 1)) * 100
  );
  const icuPercent = Math.round(
    ((hospitalState?.icuOccupied || 0) / Math.max(1, hospitalState?.icuCapacity || 1)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Top Hospital Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl emergency-surface border border-emerald-500/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-500 uppercase tracking-wider">
              {t('roles.hospital')} Telemetry Core
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              TRAUMA CENTER LEVEL 1
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-1">
            Emergency Care & Bed Capacity
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Real-time ER/ICU capacity telemetry with auto-rerouting when facilities reach saturation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill
            status={erPercent >= 90 ? 'critical' : erPercent >= 75 ? 'mesh' : 'online'}
            customLabel={
              erPercent >= 90
                ? t('status.erCritical')
                : erPercent >= 75
                ? t('status.erCaution')
                : t('status.erNormal')
            }
            size="md"
          />
        </div>
      </div>

      {/* Hospital Telemetry Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('metrics.erOccupancy')}
          value={`${erPercent}%`}
          subtitle={`${hospitalState?.erOccupied || 0}/${hospitalState?.erCapacity || 16} beds`}
          severityLevel={erPercent >= 90 ? 5 : erPercent >= 75 ? 3 : 1}
        />
        <StatCard
          title={t('metrics.icuOccupancy')}
          value={`${icuPercent}%`}
          subtitle={`${hospitalState?.icuOccupied || 0}/${hospitalState?.icuCapacity || 8} bays`}
          severityLevel={icuPercent >= 85 ? 4 : 2}
        />
        <StatCard
          title={t('metrics.oxygenLevel')}
          value={`${hospitalState?.oxygenLevelPercent || 94}%`}
          subtitle="Main Liquid Reserve"
          severityLevel={1}
        />
        <StatCard
          title={t('metrics.bloodReserve')}
          value={hospitalState?.bloodUnitsAvailable || 65}
          unit="units"
          subtitle="O- & A+ Universal"
          severityLevel={2}
        />
      </div>

      {/* Main Hospital Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <HospitalTelemetry />
        </div>

        {/* Inbound Triage Queue & Rerouting Info */}
        <div className="lg:col-span-4 space-y-4">
          <SectionCard
            title="Inbound Ambulance Fleet"
            subtitle="Fleet Radar Telemetry"
            icon={Ambulance}
          >
            <div className="space-y-3">
              {[
                { unit: 'MED-04', eta: '3 mins', triage: 'L4 Cardiac / Smoke', rerouted: false },
                { unit: 'MED-11', eta: '7 mins', triage: 'L3 Fracture', rerouted: false },
                { unit: 'MED-08', eta: '12 mins', triage: 'L2 Minor Burns', rerouted: true, rerouteTo: 'City South Annex' },
              ].map((amb, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-navy-850/50 light:bg-slate-50 border border-[var(--border-subtle)] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">
                      {amb.unit}
                    </span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      ETA {amb.eta}
                    </span>
                  </div>

                  <p className="text-[var(--text-secondary)] font-mono text-[11px]">
                    {amb.triage}
                  </p>

                  {amb.rerouted && (
                    <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[10px] uppercase">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>REROUTED TO {amb.rerouteTo} (CAPACITY FULL)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default HospitalView;
