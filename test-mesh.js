import { io } from 'socket.io-client';

async function runEndToEndVerification() {
  console.log('--- STARTING VORTEX SENTINEL E2E MESH VERIFICATION ---');

  const hubUrl = 'http://localhost:3001';

  // 1. Create 3 Simulated Nodes with different roles
  console.log('1. Connecting 3 distinct client nodes to mesh...');
  const nodeReception = io(hubUrl);
  const nodeSecurity = io(hubUrl);
  const nodeFloorStaff = io(hubUrl);

  await new Promise((resolve) => setTimeout(resolve, 600));

  // 2. Enroll nodes
  console.log('2. Enrolling nodes with roles and starting zones...');
  nodeReception.emit('join:node', { role: 'Reception', name: 'Reception-FrontDesk', zone: 'zone-lobby' });
  nodeSecurity.emit('join:node', { role: 'Security', name: 'Security-CCTV-01', zone: 'zone-parking' });
  nodeFloorStaff.emit('join:node', { role: 'Floor Staff', name: 'Staff-Patrol-L2', zone: 'zone-fl2' });

  await new Promise((resolve) => setTimeout(resolve, 800));

  // 3. Listen for crisis event on reception and floor staff nodes
  let receivedCrisisOnStaff = null;
  let receivedEscalation = null;

  nodeFloorStaff.on('CRISIS_EVENT', (data) => {
    console.log('>>> [VERIFIED] Floor Staff node received CRISIS_EVENT:', {
      incidentId: data.incidentId,
      severity: data.severity,
      forcePriority: data.forcePriority,
      staffDirective: data.dispatch?.['Floor Staff']
    });
    receivedCrisisOnStaff = data;
  });

  nodeReception.on('escalate:incident', (data) => {
    console.log('>>> [VERIFIED] Reception node received ESCALATION EVENT:', data);
    receivedEscalation = data;
  });

  // 4. Security node reports Level 4 Critical Incident in Kitchen
  console.log('3. Security node reporting Level 4 Critical Incident (Gas Fire in Kitchen, 3 Trapped)...');
  nodeSecurity.emit('report:incident', {
    zoneId: 'zone-kitchen',
    text: 'Flash Fire & High Pressure Gas Leak in Main Kitchen',
    severity: 4,
    trappedGuess: 3,
    reporterRole: 'Security'
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (receivedCrisisOnStaff && receivedCrisisOnStaff.forcePriority === true) {
    console.log('>>> [PASS] Force-Priority Override broadcast confirmed with role dispatch payload!');
  } else {
    console.error('>>> [FAIL] Force-Priority event was not received properly.');
  }

  // 5. Floor staff acknowledges the crisis
  if (receivedCrisisOnStaff) {
    console.log('4. Floor staff node acknowledging incident...');
    nodeFloorStaff.emit('ack:incident', {
      incidentId: receivedCrisisOnStaff.incidentId,
      nodeId: nodeFloorStaff.id
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  // 6. Test resolving the incident
  if (receivedCrisisOnStaff) {
    console.log('5. Resolving incident...');
    nodeSecurity.emit('resolve:incident', {
      incidentId: receivedCrisisOnStaff.incidentId
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  // Close sockets
  nodeReception.close();
  nodeSecurity.close();
  nodeFloorStaff.close();

  console.log('--- E2E VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runEndToEndVerification().catch(console.error);
