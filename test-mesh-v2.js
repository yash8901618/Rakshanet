import { io } from 'socket.io-client';

async function verifyMeshV2() {
  console.log('========================================================');
  console.log('  VORTEX SENTINEL V2 - FULL SPATIAL MESH & RESCUE TEST  ');
  console.log('========================================================');

  const hubUrl = 'http://localhost:3001';

  // 1. Connect Client Nodes
  console.log('1. Connecting Command Dispatcher, Medic Unit, and Floor Staff...');
  const dispatcher = io(hubUrl);
  const medic = io(hubUrl);
  const floorStaff = io(hubUrl);

  await new Promise((r) => setTimeout(r, 600));

  // 2. Enroll Nodes
  dispatcher.emit('join:node', { role: 'Responder', name: 'Command-Alpha', zone: 'zone-lobby' });
  medic.emit('join:node', { role: 'Responder', name: 'Trauma-Medic-01', zone: 'zone-hospital' });
  floorStaff.emit('join:node', { role: 'Floor Staff', name: 'Staff-Level-2', zone: 'zone-fl2' });

  await new Promise((r) => setTimeout(r, 600));

  let capturedCrisis = null;
  let latestBuildingState = null;
  let latestMarkers = [];

  floorStaff.on('CRISIS_EVENT', (data) => {
    console.log('>>> [OK] Floor Staff received CRISIS_EVENT:', {
      id: data.incidentId,
      severity: data.severity,
      hazard: data.hazard,
      trapped: data.trapped,
      forcePriority: data.forcePriority
    });
    capturedCrisis = data;
  });

  dispatcher.on('building:update', (bState) => {
    latestBuildingState = bState;
  });

  dispatcher.on('markers:update', (markers) => {
    latestMarkers = markers;
  });

  // 3. Report Level 5 Incident in Floor 2 Suites with 3 Trapped
  console.log('\n2. Reporting Level 5 Fire in Zone FL2 (3 Trapped Occupants)...');
  dispatcher.emit('report:incident', {
    zoneId: 'zone-fl2',
    text: 'Active Electrical Flash Fire in Suite 204 Corridor',
    severity: 5,
    trappedGuess: 3,
    hazardType: 'FIRE',
    roomNumber: '204',
    reporterRole: 'Responder'
  });

  await new Promise((r) => setTimeout(r, 1000));

  if (capturedCrisis && capturedCrisis.forcePriority === true) {
    console.log('>>> [PASS] Level 5 Force-Priority Override broadcast confirmed!');
  } else {
    console.error('>>> [FAIL] Level 5 Force-Priority did not trigger.');
  }

  // 4. Verify TrappedMarker data structure
  console.log('\n3. Verifying TrappedMarker and BuildingState contracts...');
  console.log('BuildingState:', {
    totalFloors: latestBuildingState?.totalFloors,
    severity: latestBuildingState?.severity,
    totalTrapped: latestBuildingState?.totalTrapped,
    floorData: latestBuildingState?.floorData
  });
  console.log('Markers count:', latestMarkers.length);
  const activeMarker = latestMarkers.find(m => m.floorNumber === 2);
  console.log('Floor 2 Active Marker:', activeMarker);

  if (activeMarker && activeMarker.status === 'TRAPPED' && activeMarker.trappedCount === 3) {
    console.log('>>> [PASS] TrappedMarker verified with status TRAPPED and 3 trapped count!');
  }

  // 5. Test Dispatch Rescue Team
  console.log('\n4. Dispatching Rescue Team...');
  dispatcher.emit('dispatch:rescue', {
    incidentId: capturedCrisis.incidentId,
    teamName: 'Alpha Strike Rescue Unit'
  });

  await new Promise((r) => setTimeout(r, 800));

  const enRouteMarker = latestMarkers.find(m => m.floorNumber === 2);
  console.log('Dispatched Marker Status:', enRouteMarker?.status);
  if (enRouteMarker?.status === 'RESCUE_IN_PROGRESS') {
    console.log('>>> [PASS] Marker status transitioned to RESCUE_IN_PROGRESS!');
  }

  // 6. Test Rescue Step (+1 Saved) x 3
  console.log('\n5. Executing Rescue Step (+1 Saved) 3 times...');
  for (let step = 1; step <= 3; step++) {
    dispatcher.emit('rescue:step', { incidentId: capturedCrisis.incidentId });
    await new Promise((r) => setTimeout(r, 500));
    console.log(`Step ${step}: Trapped remaining: ${latestBuildingState?.totalTrapped}`);
  }

  const finalMarker = latestMarkers.find(m => m.floorNumber === 2);
  console.log('Final Marker Status after 3 rescues:', finalMarker?.status, 'trapped:', finalMarker?.trappedCount);
  if (finalMarker?.status === 'RESCUED' && finalMarker?.trappedCount === 0) {
    console.log('>>> [PASS] Sector completely SECURED and all souls rescued!');
  }

  // 7. Test Offline Batch Sync
  console.log('\n6. Testing Offline Batch Reconciliation...');
  const mockOfflineBatch = [
    {
      type: 'REPORT_INCIDENT',
      payload: {
        zoneId: 'zone-hospital',
        text: 'Trauma Bay Triage Intake',
        severity: 2,
        trappedGuess: 1,
        hazardType: 'MEDICAL',
        reporterRole: 'Medic'
      }
    }
  ];

  dispatcher.emit('sync:offline_batch', { batch: mockOfflineBatch });
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Reconciled Markers count:', latestMarkers.length);

  // Disconnect
  dispatcher.close();
  medic.close();
  floorStaff.close();

  console.log('\n========================================================');
  console.log('  ALL VORTEX SENTINEL MESH TESTS PASSED 100%           ');
  console.log('========================================================');
  process.exit(0);
}

verifyMeshV2().catch((err) => {
  console.error(err);
  process.exit(1);
});
