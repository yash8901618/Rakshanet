import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wifi,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  AlertOctagon,
  Languages
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';
import RakshaLogo from './RakshaLogo';
import { useTheme } from '../../context/ThemeContext';
import { useCrisisStore } from '../../store/crisisStore';

export const TopStatusBar = ({
  activeRole = 'authority',
  onSelectRole,
  onOpenReport,
  onTriggerSos
}) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const {
    isSocketConnected,
    isOfflineMode,
    offlineQueue,
    flushOfflineQueue,
    isAudioMuted,
    toggleMute
  } = useCrisisStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const queueCount = offlineQueue?.length || 0;

  return (
    <header
      className="sticky top-0 z-40 bg-navy-950/90 light:bg-white/90 backdrop-blur-xl border-b border-[var(--border-subtle)] px-3 py-2.5 shadow-md"
      role="banner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo (visible on mobile too) */}
        <div className="flex items-center gap-3">
          <RakshaLogo size="sm" showText={false} className="sm:hidden" />
          <RakshaLogo size="sm" className="hidden sm:flex md:hidden" />
          
          {/* Mobile Role Switcher */}
          <div className="md:hidden">
            <RoleSwitcher currentRole={activeRole} onSelectRole={onSelectRole} />
          </div>

          {/* Desktop Network & Node Telemetry */}
          <div className="hidden lg:flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-xl border flex items-center gap-2 text-xs font-mono font-semibold transition-all ${
                isOfflineMode
                  ? 'bg-amber-950/60 light:bg-amber-50 border-amber-500/50 text-amber-300 light:text-amber-800'
                  : isSocketConnected
                  ? 'bg-emerald-950/60 light:bg-emerald-50 border-emerald-500/50 text-emerald-300 light:text-emerald-800'
                  : 'bg-red-950/60 light:bg-red-50 border-red-500/50 text-red-300 light:text-red-800'
              }`}
              title={isOfflineMode ? t('status.mesh') : t('status.online')}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOfflineMode
                    ? 'bg-amber-400 animate-pulse'
                    : isSocketConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-red-400'
                }`}
              />
              <span>
                {isOfflineMode
                  ? 'BLE MESH ACTIVE (3 NODES)'
                  : isSocketConnected
                  ? 'COMMAND HUB (ONLINE)'
                  : 'RECONNECTING...'}
              </span>
            </div>

            {/* Offline Queue Badge with Quick Flush */}
            {queueCount > 0 && (
              <button
                type="button"
                onClick={flushOfflineQueue}
                title={t('actions.syncNow')}
                className="px-2.5 py-1 rounded-xl bg-sky-950/70 light:bg-sky-50 border border-sky-500/50 text-sky-300 light:text-sky-800 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-sky-900/60 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{queueCount} {t('status.buffered')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Role Switcher (Desktop), Language, Theme, Mute, SOS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Role Switcher */}
          <div className="hidden md:block">
            <RoleSwitcher currentRole={activeRole} onSelectRole={onSelectRole} />
          </div>

          {/* Language Toggle: English / हिन्दी */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={`${t('actions.toggleLanguage')}: ${i18n.language === 'en' ? 'हिन्दी' : 'English'}`}
            className="touch-target px-2.5 py-1.5 rounded-xl bg-navy-850/80 light:bg-slate-100 hover:bg-navy-800 light:hover:bg-slate-200 border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-4 h-4 text-amber-500" />
            <span className="font-mono">
              {i18n.language === 'en' ? 'हिन्दी' : 'ENG'}
            </span>
          </button>

          {/* Theme Toggle: Dark Command / Crisp Light */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('actions.toggleTheme')}
            className="touch-target p-2 rounded-xl bg-navy-850/80 light:bg-slate-100 hover:bg-navy-800 light:hover:bg-slate-200 border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Command Dark'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Sound / Siren Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isAudioMuted ? t('actions.unmute') : t('actions.mute')}
            className="touch-target p-2 rounded-xl bg-navy-850/80 light:bg-slate-100 hover:bg-navy-800 light:hover:bg-slate-200 border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all"
            title={isAudioMuted ? t('actions.unmute') : t('actions.mute')}
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400 light:text-amber-600" />
            )}
          </button>

          {/* Emergency SOS Button (Instant Trigger) */}
          <button
            type="button"
            onClick={onTriggerSos}
            aria-label={t('actions.submitSos')}
            className="touch-target px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 light:bg-red-700 light:hover:bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopStatusBar;
