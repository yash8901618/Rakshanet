// Comprehensive E2E Test Suite for Vortex Sentinel / CrisisMesh Enterprise
import { extractAiTriage } from './server/aiTriage.js';
import { GravityStore } from './server/store.js';

console.log('=======================================================');
console.log('  RUNNING VORTEX SENTINEL E2E VERIFICATION SUITE       ');
console.log('=======================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. AI Triage NLP Parser Tests
console.log('[TEST GROUP 1] AI Ghost Triage Entity Extraction');
{
  const t1 = extractAiTriage('Fire broke out on 4th floor room 402, 5 people trapped');
  assert(t1.floorNumber === 4, `Floor extracted correctly (Expected 4, got ${t1.floorNumber})`);
  assert(t1.roomNumber === '402', `Room extracted correctly (Expected 402, got ${t1.roomNumber})`);
  assert(t1.trappedCount === 5, `Trapped count extracted correctly (Expected 5, got ${t1.trappedCount})`);
  assert(t1.hazardType === 'FIRE', `Hazard classified correctly (Expected FIRE, got ${t1.hazardType})`);
  assert(t1.severity === 5, `Severity calculated correctly (Expected 5, got ${t1.severity})`);

  const t2 = extractAiTriage('Heavy toxic smoke fumes in Room 204 with 2 persons trapped');
  assert(t2.floorNumber === 2, `Floor inferred from Room 204 (Expected 2, got ${t2.floorNumber})`);
  assert(t2.roomNumber === '204', `Room extracted (Expected 204, got ${t2.roomNumber})`);
  assert(t2.trappedCount === 2, `Trapped count extracted (Expected 2, got ${t2.trappedCount})`);
  assert(t2.hazardType === 'SMOKE', `Hazard classified (Expected SMOKE, got ${t2.hazardType})`);
  assert(t2.severity === 4, `Severity calculated (Expected 4, got ${t2.severity})`);

  const t3 = extractAiTriage('Medical code blue cardiac emergency in 1st floor lobby 1 person');
  assert(t3.floorNumber === 1, `Floor extracted (Expected 1, got ${t3.floorNumber})`);
  assert(t3.hazardType === 'MEDICAL', `Hazard classified (Expected MEDICAL, got ${t3.hazardType})`);
  assert(t3.trappedCount === 1, `Trapped count (Expected 1, got ${t3.trappedCount})`);
}

// 2. State Store & Casualty Step Operations
console.log('\n[TEST GROUP 2] Gravity Facility Store & Rescue Step Telemetry');
{
  const store = new GravityStore();
  const initialTrapped = store.getBuildingState().totalTrapped;
  const initialHospitalBeds = store.getHospitalTelemetry().occupiedBeds;

  // Create Level 5 incident on Floor 4 with 5 trapped
  const { incident, buildingState } = store.createIncident({
    rawText: 'Fire broke out on 4th floor room 402, 5 people trapped',
    floorNumber: 4,
    roomNumber: '402',
    trappedCount: 5,
    hazardType: 'FIRE',
    severity: 5
  });

  assert(incident.floorNumber === 4, 'Incident registered on Floor 4');
  assert(incident.trappedCount === 5, 'Incident has 5 trapped');
  assert(buildingState.floorData['4'].trappedCount === 5, 'Floor 4 total trapped equals 5');
  assert(buildingState.floorData['4'].hazardLevel === 'HIGH', 'Floor 4 hazard level is HIGH');

  // Trigger "Rescued -1" step on Floor 4
  const rescueRes1 = store.rescueFloorStep(4);
  assert(rescueRes1.buildingState.floorData['4'].trappedCount === 4, 'Rescued -1 decrements Floor 4 to 4');
  assert(rescueRes1.hospital.occupiedBeds === initialHospitalBeds + 1, 'Hospital occupied beds incremented by 1');

  // Trigger another rescue step
  const rescueRes2 = store.rescueFloorStep(4);
  assert(rescueRes2.buildingState.floorData['4'].trappedCount === 3, 'Second rescue step decrements Floor 4 to 3');
}

// 3. Offline Batch Synchronization Test
console.log('\n[TEST GROUP 3] Offline Mesh Batch Reconciliation');
{
  const store = new GravityStore();
  const offlineBatch = [
    {
      id: 'off-1',
      type: 'REPORT_SUBMITTED',
      payload: {
        rawText: 'Chemical smoke leak on Floor 5 room 502 with 2 trapped',
        floorNumber: 5,
        roomNumber: '502',
        trappedCount: 2,
        hazardType: 'SMOKE',
        severity: 4
      }
    },
    {
      id: 'off-2',
      type: 'RESCUE_STEP',
      payload: { floorNumber: 5 }
    }
  ];

  const syncResult = store.syncOfflineBatch(offlineBatch);
  assert(syncResult.count === 1, 'Batch synced 1 new incident');
  assert(syncResult.buildingState.floorData['5'].trappedCount === 1, 'Offline rescue step applied, leaving 1 trapped on Floor 5');
}

console.log('\n=======================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} ASSERTIONS PASSED`);
console.log('=======================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL VORTEX SENTINEL / CRISISMESH SYSTEMS OPERATIONAL!');
  process.exit(0);
} else {
  process.exit(1);
}
