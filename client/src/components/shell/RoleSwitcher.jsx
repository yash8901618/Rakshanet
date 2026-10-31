import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  Flame,
  HeartPulse,
  ChevronDown,
  Check
} from 'lucide-react';

const ROLES = [
  { id: 'citizen', key: 'citizen', icon: Users, color: 'text-sky-400' },
  { id: 'authority', key: 'authority', icon: Shield, color: 'text-amber-400' },
  { id: 'responder', key: 'responder', icon: Flame, color: 'text-orange-400' },
  { id: 'hospital', key: 'hospital', icon: HeartPulse, color: 'text-emerald-400' },
];

export const RoleSwitcher = ({ currentRole = 'authority', onSelectRole }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeRoleConfig = ROLES.find((r) => r.id === currentRole) || ROLES[1];
  const ActiveIcon = activeRoleConfig.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t('actions.switchRole')}: ${t(`roles.${activeRoleConfig.key}`)}`}
        className="touch-target px-3 py-1.5 rounded-xl bg-navy-850/90 light:bg-slate-100 hover:bg-navy-800 light:hover:bg-slate-200 border border-[var(--border-subtle)] flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--text-primary)] transition-all shadow-sm"
      >
        <ActiveIcon className={`w-4 h-4 ${activeRoleConfig.color}`} aria-hidden="true" />
        <span className="hidden sm:inline font-bold">
          {t(`roles.${activeRoleConfig.key}`)}
        </span>
        <span className="sm:hidden font-bold uppercase text-[10px]">
          {activeRoleConfig.id.slice(0, 4)}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('accessibility.roleSelector')}
          className="absolute right-0 mt-2 w-64 rounded-xl emergency-surface border border-[var(--border-strong)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
            {t('actions.switchRole')}
          </div>

          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = role.id === currentRole;

            return (
              <button
                key={role.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectRole(role.id);
                  setIsOpen(false);
                }}
                className={`touch-target w-full rounded-lg px-3 py-2 text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 light:bg-amber-50 text-[var(--text-primary)] font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                }`}
              >
                <div className={`p-1.5 rounded-lg bg-navy-800/80 light:bg-slate-200 ${role.color} mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">
                      {t(`roles.${role.key}`)}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                    {t(`roles.${role.key}Desc`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
