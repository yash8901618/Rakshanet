import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  AlertOctagon,
  FilePlus,
  MapPin,
  Radio,
  Layers,
  HeartPulse,
  Building2,
  SlidersHorizontal,
  Wifi
} from 'lucide-react';

export const BottomNav = ({
  activeRole = 'citizen',
  activeTab = 'home',
  onTabChange,
  onOpenReport
}) => {
  const { t } = useTranslation();

  // Navigation items adaptive per role
  const getNavItems = () => {
    switch (activeRole) {
      case 'authority':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'command', label: t('nav.command'), icon: SlidersHorizontal },
          { id: 'twin', label: t('nav.digitalTwin'), icon: Building2 },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'incidents', label: t('nav.incidents'), icon: Radio },
        ];
      case 'responder':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'twin', label: t('nav.digitalTwin'), icon: Building2 },
          { id: 'tactical', label: t('nav.tactical'), icon: Layers },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'hospital', label: t('nav.hospital'), icon: HeartPulse },
        ];
      case 'hospital':
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'telemetry', label: t('nav.hospital'), icon: HeartPulse },
          { id: 'incidents', label: t('nav.incidents'), icon: Radio },
          { id: 'command', label: t('nav.command'), icon: Building2 },
        ];
      case 'citizen':
      default:
        return [
          { id: 'home', label: t('nav.home'), icon: Home },
          { id: 'sos', label: t('nav.sos'), icon: AlertOctagon, isSos: true },
          { id: 'mesh', label: t('nav.mesh'), icon: Wifi },
          { id: 'report', label: t('nav.report'), icon: FilePlus, isAction: true },
          { id: 'shelters', label: t('nav.shelters'), icon: MapPin },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 light:bg-white/95 backdrop-blur-xl border-t border-[var(--border-subtle)] px-2 py-1 shadow-2xl safe-area-pb"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSos) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="touch-target relative -top-3 p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/60 border-2 border-white/20 active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <Icon className="w-6 h-6 animate-pulse" />
                <span className="text-[10px] font-bold tracking-tight uppercase mt-0.5">SOS</span>
              </button>
            );
          }

          if (item.isAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={onOpenReport}
                aria-label={item.label}
                className="touch-target min-w-[64px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center text-amber-400 light:text-amber-600 active:scale-95 transition-all"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1 truncate max-w-[68px]">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`touch-target min-w-[64px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'text-amber-400 light:text-amber-600 font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-1 truncate max-w-[68px]">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 light:bg-amber-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
