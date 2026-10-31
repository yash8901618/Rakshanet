import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  AlertOctagon,
  FilePlus,
  MapPin,
  Building2,
  Layers,
  HeartPulse,
  Radio,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wifi,
  Sparkles
} from 'lucide-react';
import RakshaLogo from '../shell/RakshaLogo';
import { useCrisisStore } from '../../store/crisisStore';

export const Sidebar = ({
  activeRole = 'authority',
  activeTab = 'home',
  onTabChange,
  onOpenReport,
  onRunDemo
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { buildingState, hospitalState, isOfflineMode, isSocketConnected } = useCrisisStore();

  const totalTrapped = buildingState?.totalTrapped || 0;
  const erPercent = Math.round(
    ((hospitalState?.erOccupied || 0) / Math.max(1, hospitalState?.erCapacity || 1)) * 100
  );

  const getNavLinks = () => {
    switch (activeRole) {
      case 'citizen':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'sos', label: t('nav.sos'), icon: AlertOctagon, isSos: true },
          { id: 'report', label: t('nav.report'), icon: FilePlus, isAction: true },
          { id: 'shelters', label: t('nav.shelters'), icon: MapPin },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
        ];
      case 'responder':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'twin', label: t('nav.digitalTwin'), icon: Building2 },
          { id: 'tactical', label: t('nav.tactical'), icon: Layers },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'hospital', label: t('nav.hospital'), icon: HeartPulse },
          { id: 'incidents', label: t('nav.incidents'), icon: Radio },
        ];
      case 'hospital':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'telemetry', label: t('nav.hospital'), icon: HeartPulse },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'incidents', label: t('nav.incidents'), icon: Radio },
          { id: 'twin', label: t('nav.digitalTwin'), icon: Building2 },
        ];
      case 'authority':
      default:
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'command', label: t('nav.command'), icon: SlidersHorizontal },
          { id: 'twin', label: t('nav.digitalTwin'), icon: Building2 },
          { id: 'tactical', label: t('nav.tactical'), icon: Layers },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'hospital', label: t('nav.hospital'), icon: HeartPulse },
          { id: 'incidents', label: t('nav.incidents'), icon: Radio },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--border-subtle)] emergency-surface transition-all duration-300 relative z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between min-h-[72px]">
        {!isCollapsed ? (
          <RakshaLogo size="sm" />
        ) : (
          <div className="mx-auto">
            <RakshaLogo size="sm" showText={false} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`touch-target p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" role="navigation">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;

          if (link.isAction) {
            return (
              <button
                key={link.id}
                type="button"
                onClick={onOpenReport}
                className={`touch-target w-full rounded-xl flex items-center gap-3 px-3 py-2.5 transition-all text-amber-400 light:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title={link.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="font-semibold text-xs tracking-wide truncate">
                    {link.label}
                  </span>
                )}
              </button>
            );
          }

          if (link.isSos) {
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onTabChange(link.id)}
                className={`touch-target w-full rounded-xl flex items-center gap-3 px-3 py-2.5 transition-all text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-950/50 ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title={link.label}
              >
                <Icon className="w-5 h-5 shrink-0 animate-pulse" />
                {!isCollapsed && (
                  <span className="font-bold text-xs uppercase tracking-wider truncate">
                    {link.label}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onTabChange(link.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`touch-target w-full rounded-xl flex items-center gap-3 px-3 py-2.5 transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-amber-500/15 light:bg-amber-50 text-amber-400 light:text-amber-700 font-bold border border-amber-500/40 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              }`}
              title={link.label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="text-xs font-semibold tracking-wide truncate">
                  {link.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Launch Scenario Button */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={onRunDemo}
          className={`touch-target w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isCollapsed ? 'p-2' : 'px-3 py-2.5'
          }`}
          title={t('actions.runLiveDemo')}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{t('actions.runLiveDemo')}</span>}
        </button>
      </div>

      {/* System Telemetry Teaser (Bottom of Sidebar) */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-navy-950/40 light:bg-slate-50 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span>Trapped</span>
            <span className={`font-bold ${totalTrapped > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {totalTrapped === 1 ? '1 soul' : `${totalTrapped} souls`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span>ER Load</span>
            <span className={`font-bold ${erPercent >= 80 ? 'text-amber-400' : 'text-sky-400'}`}>
              {erPercent}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span>Grid Link</span>
            <span className="font-bold text-emerald-400">
              {isOfflineMode ? 'BLE Mesh' : isSocketConnected ? 'Online 112' : 'Local'}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle for Collapsed State */}
      {isCollapsed && (
        <div className="p-2 border-t border-[var(--border-subtle)] flex justify-center">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
            className="touch-target p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
