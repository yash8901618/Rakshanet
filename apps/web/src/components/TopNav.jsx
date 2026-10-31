import React from 'react';
import { 
  ShieldAlert, 
  Users, 
  Flame, 
  Volume2, 
  VolumeX, 
  UserCheck
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';
import { audioEngine } from '../utils/audioEngine';

export const TopNav = ({ onOpenRoleModal }) => {
  const { 
    currentNode, 
    nodes, 
    incidents, 
    isAudioMuted, 
    toggleAudioMute, 
    setIsReportModalOpen,
    setCurrentNode
  } = useCrisisStore();

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
  const maxSeverity = activeIncidents.reduce((max, i) => Math.max(max, i.severity), 0);
  const isCrisis = maxSeverity >= 3;
  const isWarning = maxSeverity > 0 && maxSeverity < 3;

  const handleAudioToggle = () => {
    audioEngine.init();
    audioEngine.toggleMute();
    toggleAudioMute();
  };

  const handleRoleChange = (role) => {
    setCurrentNode({ role });
    socket.emit('join:node', {
      role,
      name: currentNode.name,
      zone: currentNode.zone
    });
  };

  const roles = ['Floor Staff', 'Reception', 'Security', 'Responder', 'Admin'];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#06080B]/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Status Pills */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base tracking-tight text-[var(--text-primary)]">
                VORTEX <span className="text-[var(--mesh)]">SENTINEL</span>
              </h1>
              <span className="text-[11px] font-sans text-[var(--text-muted)] block">
                Hospitality Crisis Mesh
              </span>
            </div>
          </div>

          {/* Status Pill Row with 12px gap */}
          <div className="hidden md:flex items-center gap-3">
            {/* Status Pill */}
            <div className="glass-pill">
              <span className={`status-indicator ${isCrisis ? 'crisis' : isWarning ? 'warn' : ''}`} />
              <span className="font-sans font-medium text-xs text-[var(--text-primary)]">
                {isCrisis ? 'CRISIS OVERRIDE' : isWarning ? 'ELEVATED ALERT' : 'MESH STABLE'}
              </span>
            </div>

            {/* Port Pair Pill in JetBrains Mono */}
            <div className="glass-pill font-mono text-[11px] text-[var(--text-muted)]">
              <span>Port 5173 ↔ 3001</span>
            </div>
          </div>
        </div>

        {/* Role Selector Segmented Control (Horizontally scrollable on mobile) */}
        <div className="order-last sm:order-none w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="segmented-control min-w-max">
            {roles.map((role) => {
              const isActive = currentNode.role === role;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`segmented-control-item touch-target ${isActive ? 'active' : ''}`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Metric Card & Action Area */}
        <div className="flex items-center gap-3">
          {/* Connected Nodes Card */}
          <div 
            onClick={onOpenRoleModal}
            className="cursor-pointer glass-card px-3 py-1.5 flex items-center gap-2.5 hover:border-[var(--border-bright)]"
            title="Active nodes on mesh"
          >
            <Users className="w-4 h-4 text-[var(--mesh)]" />
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-sm text-[var(--text-primary)]">
                {nodes.length}
              </span>
              <span className="font-sans text-[11px] text-[var(--text-muted)]">
                Connected
              </span>
            </div>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleAudioToggle}
            className="btn-secondary p-2"
            title={isAudioMuted ? 'Unmute Spatial Audio' : 'Mute Spatial Audio'}
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[var(--mesh)]" />
            )}
          </button>

          {/* Node Call-Sign Badge */}
          <button
            onClick={onOpenRoleModal}
            className="btn-secondary hidden lg:inline-flex text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <UserCheck className="w-3.5 h-3.5 text-[var(--mesh)]" />
            <span>{currentNode.name}</span>
          </button>

          {/* Prominent Report Crisis CTA (Desktop view, sticky on mobile) */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn-crisis hidden sm:inline-flex"
          >
            <Flame className="w-4 h-4" />
            <span>Report Crisis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
