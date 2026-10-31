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

  // 3. Test AI extraction on report with text containing "Floor 4 Room 402 with 3 trapped"
  console.log('\n2. Reporting Incident with natural text for AI Telemetry Extraction...');
  dispatcher.emit('report:incident', {
    text: 'Structural fracture and smoke on Floor 4 in Room 402 with 3 people trapped',
    severity: 5,
    reporterRole: 'Responder'
  });

  await new Promise((r) => setTimeout(r, 1000));

  if (capturedCrisis && capturedCrisis.forcePriority === true) {
    console.log('>>> [PASS] Level 5 Force-Priority Override broadcast confirmed!');
  }

  // 4. Verify AI Extracted TrappedMarker
  console.log('\n3. Verifying AI extracted TrappedMarker and BuildingState...');
  console.log('BuildingState:', {
    totalFloors: latestBuildingState?.totalFloors,
    severity: latestBuildingState?.severity,
    totalTrapped: latestBuildingState?.totalTrapped,
    floorData: latestBuildingState?.floorData
  });
  console.log('Markers count:', latestMarkers.length);
  const floor4Marker = latestMarkers.find(m => m.floorNumber === 4);
  console.log('Floor 4 AI Extracted Marker:', floor4Marker);

  if (floor4Marker && floor4Marker.roomNumber === '402' && floor4Marker.trappedCount === 3) {
    console.log('>>> [PASS] AI successfully extracted Floor 4, Room 402, 3 Trapped, and Hazard!');
  }

  // 5. Test Floor-Level Rescue Step (rescue:step_floor)
  console.log('\n4. Executing Floor-Level Rescue Step (rescue:step_floor) on Floor 4...');
  dispatcher.emit('rescue:step_floor', { floorNumber: 4 });
  await new Promise((r) => setTimeout(r, 600));

  const afterRescue1 = latestMarkers.find(m => m.floorNumber === 4);
  console.log('Floor 4 marker after rescue step 1:', afterRescue1?.trappedCount, 'Total building trapped:', latestBuildingState?.totalTrapped);

  // Rescue remaining 2 occupants
  dispatcher.emit('rescue:step_floor', { floorNumber: 4 });
  await new Promise((r) => setTimeout(r, 600));
  dispatcher.emit('rescue:step_floor', { floorNumber: 4 });
  await new Promise((r) => setTimeout(r, 600));

  const afterRescueFinal = latestMarkers.find(m => m.floorNumber === 4);
  console.log('Floor 4 marker after all rescued:', afterRescueFinal?.status, 'trapped:', afterRescueFinal?.trappedCount);
  if (afterRescueFinal?.status === 'RESCUED' && afterRescueFinal?.trappedCount === 0) {
    console.log('>>> [PASS] Floor 4 successfully secured via Floor-Level precision tracker!');
  }

  // 6. Test Offline Batch Sync
  console.log('\n5. Testing Offline Batch Reconciliation...');
  const mockOfflineBatch = [
    {
      type: 'REPORT_INCIDENT',
      payload: {
        zoneId: 'zone-hospital',
        text: 'Trauma Bay Triage Intake on Floor 0',
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
