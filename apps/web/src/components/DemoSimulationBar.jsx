import React from 'react';
import { 
  Flame, 
  AlertTriangle, 
  RotateCcw, 
  Volume2, 
  ShieldAlert,
  Zap,
  Wifi,
  WifiOff,
  CloudUpload,
  HeartPulse
} from 'lucide-react';
import { socket } from '../socket';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from '../utils/hapticEngine';
import { useCrisisStore } from '../store/crisisStore';

export const DemoSimulationBar = () => {
  const { 
    currentNode, 
    isOfflineMode, 
    offlineQueue, 
    toggleOfflineMode, 
    flushOfflineQueue,
    reportIncidentAction 
  } = useCrisisStore();

  const handleTriggerDrill = (zoneId, text, severity, trappedGuess, hazardType = 'FIRE') => {
    audioEngine.init();
    reportIncidentAction({
      zoneId,
      text,
      severity,
      trappedGuess,
      hazardType,
      reporterRole: currentNode.role || 'Staff'
    });
    audioEngine.playAlert(severity);
    triggerHaptic(severity);
  };

  const handleResetDemo = () => {
    socket.emit('admin:reset_demo');
  };

  const handleAudioTest = () => {
    audioEngine.init();
    triggerHaptic(5);
    audioEngine.playAlert(5, [12, 0, -4]);
  };

  return (
    <div className="bg-[#06080B]/95 border-t border-[var(--border)] px-4 sm:px-6 py-2.5 backdrop-blur-md sticky bottom-0 z-40">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        
        {/* Left: Simulation Label & Offline Mode Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-[var(--text-primary)] hidden sm:inline">Simulation Drills:</span>
          </div>

          {/* Network Outage Simulation Toggle */}
          <button
            onClick={toggleOfflineMode}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isOfflineMode 
                ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-md' 
                : 'bg-white/[0.04] border-[var(--border)] text-[var(--text-muted)] hover:text-white'
            }`}
            title="Toggle offline local storage queue buffer simulation"
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Simulate Outage: <strong>OFFLINE ({offlineQueue.length})</strong></span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Network: <strong>ONLINE</strong></span>
              </>
            )}
          </button>

          {/* Manual Flush Sync Button if items queued */}
          {offlineQueue.length > 0 && !isOfflineMode && (
            <button
              onClick={flushOfflineQueue}
              className="btn-secondary text-xs text-emerald-300 border-emerald-500/40 bg-emerald-500/10 py-1 px-2.5"
            >
              <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync {offlineQueue.length} Queued</span>
            </button>
          )}
        </div>

        {/* Drill Action Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level 5 Structural Fire */}
          <button
            onClick={() => handleTriggerDrill('zone-kitchen', 'Level 5 Major Kitchen Blaze & Structural Compromise', 5, 4, 'FIRE')}
            className="btn-secondary text-xs text-red-400 hover:border-red-500/50 hover:bg-red-500/10"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>L5 Kitchen Fire (4 Trapped)</span>
          </button>

          {/* Level 4 Gas Leak */}
          <button
            onClick={() => handleTriggerDrill('zone-fl2', 'Level 4 Toxic Gas Riser Infiltration in Suites Corridor', 4, 2, 'SMOKE')}
            className="btn-secondary text-xs text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>L4 Suite 202 Gas (2 Trapped)</span>
          </button>

          {/* Level 5 Medical Surge in Hospital */}
          <button
            onClick={() => handleTriggerDrill('zone-hospital', 'Level 5 Mass Casualty Intake & Medical Code Blue', 5, 3, 'MEDICAL')}
            className="btn-secondary text-xs text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/10"
          >
            <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
            <span>L5 Medical Code Blue (3 Patients)</span>
          </button>

          {/* Level 3 Penthouse Threat */}
          <button
            onClick={() => handleTriggerDrill('zone-penthouse', 'Active VIP Security Breach & Sky Lounge Threat', 3, 0, 'COLLAPSE')}
            className="btn-secondary text-xs text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/10"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>L3 Penthouse Alert</span>
          </button>

          {/* Audio & Haptics Test */}
          <button
            onClick={handleAudioTest}
            className="btn-secondary text-xs text-[var(--mesh)] hover:border-[var(--mesh)]/40 hover:bg-[var(--mesh)]/10"
            title="Test spatial 3D audio siren & device haptic pulses"
          >
            <Volume2 className="w-3.5 h-3.5 text-[var(--mesh)]" />
            <span>3D Audio Siren</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={handleResetDemo}
            className="btn-secondary text-xs"
            title="Reset simulation to normal baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
