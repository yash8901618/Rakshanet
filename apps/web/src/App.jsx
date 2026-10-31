import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import { useCrisisStore } from './store/crisisStore';
import { audioEngine } from './utils/audioEngine';
import { triggerHaptic } from './utils/hapticEngine';

// Components
import { TopNav } from './components/TopNav';
import { RoleSelectorModal } from './components/RoleSelectorModal';
import { ForcePriorityModal } from './components/ForcePriorityModal';
import { DigitalTwin3D } from './components/DigitalTwin3D';
import { ZoneDetailsModal } from './components/ZoneDetailsModal';
import { GhostDispatcher } from './components/GhostDispatcher';
import { IncidentStream } from './components/IncidentStream';
import { ZoneMatrix } from './components/ZoneMatrix';
import { ManifestHub } from './components/ManifestHub';
import { ActiveMeshNodes } from './components/ActiveMeshNodes';
import { DemoSimulationBar } from './components/DemoSimulationBar';

import { Flame } from 'lucide-react';

export default function App() {
  const {
    currentNode,
    selectedZoneId,
    setNodes,
    setZones,
    setManifest,
    setIncidents,
    setMarkers,
    setBuildingState,
    addOrUpdateIncident,
    triggerCrisisEvent,
    setSlaCountdown,
    setEscalationNotice,
    setSelectedZoneId,
    setIsReportModalOpen
  } = useCrisisStore();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    socket.on('init:state', (data) => {
      if (data.nodes) setNodes(data.nodes);
      if (data.zones) setZones(data.zones);
      if (data.manifest) setManifest(data.manifest);
      if (data.incidents) setIncidents(data.incidents);
      if (data.markers) setMarkers(data.markers);
      if (data.buildingState) setBuildingState(data.buildingState);
    });

    socket.on('nodes:update', (nodesList) => {
      setNodes(nodesList);
    });

    socket.on('zones:update', (zonesList) => {
      setZones(zonesList);
    });

    socket.on('markers:update', (markersList) => {
      setMarkers(markersList);
    });

    socket.on('building:update', (buildingState) => {
      setBuildingState(buildingState);
    });

    socket.on('incident:update', (incident) => {
      addOrUpdateIncident(incident);
    });

    socket.on('rescue:saved', (data) => {
      audioEngine.playRescueChime();
      triggerHaptic(1);
    });

    socket.on('batch:synced', (data) => {
      if (data.zones) setZones(data.zones);
      if (data.manifest) setManifest(data.manifest);
      if (data.incidents) setIncidents(data.incidents);
      if (data.markers) setMarkers(data.markers);
      if (data.buildingState) setBuildingState(data.buildingState);
    });

    socket.on('CRISIS_EVENT', (crisisPayload) => {
      triggerCrisisEvent(crisisPayload);
      triggerHaptic(crisisPayload.severity);
      audioEngine.playAlert(crisisPayload.severity, crisisPayload.safeVector);
    });

    socket.on('sla:tick', (sla) => {
      setSlaCountdown(sla);
    });

    socket.on('escalate:incident', (notice) => {
      setEscalationNotice(notice);
      triggerHaptic(5);
      audioEngine.playAlert(5);
    });

    socket.on('manifest:update', (manifest) => {
      setManifest(manifest);
    });

    socket.on('demo:reset', (data) => {
      if (data.zones) setZones(data.zones);
      if (data.manifest) setManifest(data.manifest);
      if (data.incidents) setIncidents(data.incidents);
      if (data.markers) setMarkers(data.markers);
      if (data.buildingState) setBuildingState(data.buildingState);
      setSlaCountdown(null);
      setEscalationNotice(null);
    });

    return () => {
      socket.off('init:state');
      socket.off('nodes:update');
      socket.off('zones:update');
      socket.off('markers:update');
      socket.off('building:update');
      socket.off('incident:update');
      socket.off('rescue:saved');
      socket.off('batch:synced');
      socket.off('CRISIS_EVENT');
      socket.off('sla:tick');
      socket.off('escalate:incident');
      socket.off('manifest:update');
      socket.off('demo:reset');
    };
  }, []);

  useEffect(() => {
    if (!currentNode.isEnrolled) {
      setIsRoleModalOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] relative pb-20 sm:pb-0">
      {/* Top Status Bar & Role Selector */}
      <TopNav onOpenRoleModal={() => setIsRoleModalOpen(true)} />

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Desktop Layout: ≥1280px 3-Column Side-by-Side */}
        <div className="hidden xl:grid xl:grid-cols-12 gap-6 flex-1">
          {/* Column 1 (Left): AI Ghost Dispatcher & Zone Matrix */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="flex-1 min-h-[360px]">
              <GhostDispatcher />
            </div>
            <div className="flex-1 min-h-[340px]">
              <ZoneMatrix onSelectZone={(z) => setSelectedZoneId(z.id)} />
            </div>
          </div>

          {/* Column 2 (Center): Digital Twin 3D & Live Incident Stream */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="flex-1 min-h-[460px]">
              <DigitalTwin3D onSelectZone={(z) => setSelectedZoneId(z.id)} />
            </div>
            <div className="min-h-[280px]">
              <IncidentStream />
            </div>
          </div>

          {/* Column 3 (Right): Manifest Hub & Active Mesh Nodes */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="flex-1 min-h-[360px]">
              <ManifestHub />
            </div>
            <div className="flex-1 min-h-[340px]">
              <ActiveMeshNodes />
            </div>
          </div>
        </div>

        {/* Tablet Layout: 768px – 1279px (2 Columns, 3D Twin below dashboard) */}
        <div className="hidden md:flex xl:hidden flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <GhostDispatcher />
              <ZoneMatrix onSelectZone={(z) => setSelectedZoneId(z.id)} />
            </div>
            <div className="flex flex-col gap-6">
              <IncidentStream />
              <ManifestHub />
            </div>
          </div>

          {/* Full Width 3D Twin */}
          <div className="min-h-[440px]">
            <DigitalTwin3D onSelectZone={(z) => setSelectedZoneId(z.id)} />
          </div>

          <ActiveMeshNodes />
        </div>

        {/* Mobile Layout: ≤767px Single Column */}
        <div className="flex md:hidden flex-col gap-6">
          <div>
            <GhostDispatcher />
          </div>

          <div>
            <ZoneMatrix onSelectZone={(z) => setSelectedZoneId(z.id)} />
          </div>

          <div className="h-[360px]">
            <DigitalTwin3D onSelectZone={(z) => setSelectedZoneId(z.id)} />
          </div>

          <div>
            <IncidentStream />
          </div>

          <div>
            <ManifestHub />
          </div>

          <div>
            <ActiveMeshNodes />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Full-Width Report Crisis CTA for Mobile View */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#06080B]/95 border-t border-[var(--border)] backdrop-blur-md">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-full btn-crisis py-3 text-sm font-display font-bold uppercase tracking-wider touch-target shadow-xl"
        >
          <Flame className="w-4 h-4" />
          <span>Report Crisis</span>
        </button>
      </div>

      {/* Interactive Simulation Controls */}
      <DemoSimulationBar />

      {/* Onboarding & Telemetry Modals */}
      <RoleSelectorModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Force-Priority Emergency Screen Lockout (Severity >= 4) */}
      <ForcePriorityModal />

      {/* Zone Details & CCTV Inspector */}
      {selectedZoneId && (
        <ZoneDetailsModal
          zoneId={selectedZoneId}
          onClose={() => setSelectedZoneId(null)}
        />
      )}
    </div>
  );
}
