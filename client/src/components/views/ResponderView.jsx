import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flame,
  Layers,
  Building2,
  ShieldAlert,
  HeartPulse,
  CheckCircle,
  Users
} from 'lucide-react';
import Building3DTwin from '../3D/Building3DTwin';
import FloorTacticalPanel from '../Dashboard/FloorTacticalPanel';
import StatCard from '../ui/StatCard';
import SectionCard from '../ui/SectionCard';
import StatusPill from '../ui/StatusPill';
import { useCrisisStore } from '../../store/crisisStore';

export const ResponderView = () => {
  const { t } = useTranslation();
  const { buildingState, rescueFloorStepAction } = useCrisisStore();

  const totalTrapped = buildingState?.totalTrapped || 0;
  const floorData = buildingState?.floorData || {};
  const totalFloors = buildingState?.totalFloors || 6;

  // Dynamically derive hotspots and cleared floors from actual floorData
  const hotspotFloors = [];
  const safeFloors = [];
  const activeHazardsSet = new Set();

  for (let fl = 1; fl <= totalFloors; fl++) {
    const data = floorData[String(fl)] || { trappedCount: 0, hazardLevel: 'LOW', activeHazard: null };
    const hasHazard = data.trappedCount > 0 || data.hazardLevel === 'HIGH' || data.hazardLevel === 'MEDIUM' || Boolean(data.activeHazard);
    if (hasHazard) {
      hotspotFloors.push(fl);
      if (data.activeHazard) activeHazardsSet.add(data.activeHazard);
    } else {
      safeFloors.push(fl);
    }
  }

  const hotspotsValue = hotspotFloors.length > 0
    ? (hotspotFloors.length === 1 ? `Floor ${hotspotFloors[0]}` : `Floors ${hotspotFloors.join(' & ')}`)
    : 'None';

  const hazardsList = Array.from(activeHazardsSet);
  const hotspotsSubtitle = hotspotFloors.length > 0
    ? (hazardsList.length > 0
        ? hazardsList.map(h => (h === 'FIRE' ? 'Fire' : h === 'SMOKE' ? 'Heavy Smoke' : h)).join(' & ')
        : 'Active Threat')
    : 'All Clear';

  const floorClearanceValue = `${safeFloors.length}/${totalFloors}`;
  const floorClearanceSubtitle = safeFloors.length === totalFloors
    ? 'All levels cleared'
    : safeFloors.length > 0
    ? `Levels ${safeFloors.join(', ')} cleared`
    : 'No levels cleared';

  return (
    <div className="space-y-6">
      {/* Top Tactical Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl emergency-surface border border-orange-500/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-orange-500 uppercase tracking-wider">
              {t('roles.responder')} Tactical HUD
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono">
              NDRF DISPATCH ON-SITE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-1">
            Tactical Floor Rescue Matrix
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Floor-by-floor casualty tracking and one-click "Rescued -1" decrement workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={totalTrapped > 0 ? 'critical' : 'resolved'} size="md" />
        </div>
      </div>

      {/* Responder Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('metrics.trappedSouls')}
          value={totalTrapped}
          unit="remaining"
          subtitle="Building: Sector 4 Tower"
          severityLevel={totalTrapped > 0 ? 5 : 1}
        />
        <StatCard
          title="Floor Clearance"
          value={floorClearanceValue}
          unit="floors safe"
          subtitle={floorClearanceSubtitle}
          severityLevel={safeFloors.length === totalFloors ? 1 : 2}
        />
        <StatCard
          title="Active Hotspots"
          value={hotspotsValue}
          subtitle={hotspotsSubtitle}
          severityLevel={hotspotFloors.length > 0 ? 4 : 1}
        />
        <StatCard
          title="Rescue Team Status"
          value="Deployed"
          unit="Team Bravo"
          subtitle="Stairwell B Breached"
          severityLevel={2}
        />
      </div>

      {/* Main Grid: 3D Twin (7 Cols) and Floor Matrix (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <SectionCard
            title={t('nav.digitalTwin')}
            subtitle="3D Spatial HTML Pins & Wireframe View"
            icon={Building2}
          >
            <Building3DTwin />
          </SectionCard>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <FloorTacticalPanel />
        </div>
      </div>
    </div>
  );
};

export default ResponderView;
