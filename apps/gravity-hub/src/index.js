import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { store, initialZones, initialManifest } from './store.js';
import { generateDispatch } from './dispatcher.js';
import { EscalationManager } from './escalation.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Basic health check and building state endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Vortex Sentinel Gravity Hub',
    timestamp: Date.now(),
    activeNodes: store.getAllNodes().length,
    activeIncidents: store.getActiveIncidents().length,
    building: store.getBuildingState()
  });
});

app.get('/api/building', (req, res) => {
  res.json(store.getBuildingState());
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const escalationManager = new EscalationManager(io, store, 35000);

io.on('connection', (socket) => {
  console.log(`[MESH CONNECT] Socket connected: ${socket.id} (IP: ${socket.handshake.address})`);

  // Default register node on connection
  store.addNode(socket.id, {
    role: 'Floor Staff',
    name: `Node-${socket.id.slice(0, 4)}`,
    zone: 'zone-lobby',
    ip: socket.handshake.address
  });

  // 1. Send full initial venue & spatial state to the new client
  socket.emit('init:state', {
    nodeId: socket.id,
    nodes: store.getAllNodes(),
    zones: store.getZones(),
    manifest: store.getManifest(),
    incidents: store.getAllIncidents(),
    markers: store.getAllMarkers(),
    buildingState: store.getBuildingState()
  });

  // Broadcast updated nodes list to all connected clients
  io.emit('nodes:update', store.getAllNodes());

  // --- Socket Contract Implementation ---

  // client -> server: join:node { role, name, zone }
  socket.on('join:node', (data) => {
    const { role, name, zone } = data || {};
    const updated = store.updateNode(socket.id, {
      role: role || 'Floor Staff',
      name: name || `Node-${socket.id.slice(0, 4)}`,
      zone: zone || 'zone-lobby'
    });
    console.log(`[NODE JOINED] ${updated.name} enrolled as [${updated.role}] in [${updated.zone}]`);

    io.emit('nodes:update', store.getAllNodes());
    socket.emit('node:enrolled', updated);
  });

  // Heartbeat / ping
  socket.on('node:heartbeat', () => {
    store.updateNode(socket.id, { lastSeen: Date.now() });
  });

  // client -> server: report:incident { zoneId, text, severity, trappedGuess, hazardType, roomNumber, floorLevel, reporterRole }
  socket.on('report:incident', (data) => {
    console.log(`[INCIDENT REPORTED] by ${socket.id}:`, data);
    const { zoneId, text, severity, trappedGuess, hazardType, roomNumber, floorLevel, reporterRole } = data || {};

    const { incident, marker, buildingState } = store.createIncident({
      zoneId: zoneId || 'zone-lobby',
      text: text || 'Emergency condition declared',
      severity: severity !== undefined ? Number(severity) : 3,
      trappedGuess: trappedGuess !== undefined ? Number(trappedGuess) : 0,
      hazardType: hazardType || 'FIRE',
      roomNumber,
      floorLevel,
      reporterRole: reporterRole || (store.getNode(socket.id)?.role || 'Staff'),
      reporterId: socket.id
    });

    // Generate AI Ghost Dispatcher commands tailored per role
    const dispatchMap = generateDispatch(incident, incident.severity);
    incident.dispatchInstructions = dispatchMap;

    const forcePriority = incident.severity >= 4;

    // 1. Broadcast incident and spatial state updates
    io.emit('incident:update', incident);
    io.emit('markers:update', store.getAllMarkers());
    io.emit('building:update', buildingState);
    io.emit('zones:update', store.getZones());

    // 2. If severity >= 4, broadcast CRISIS_EVENT with forcePriority flag to lock all screens
    if (forcePriority) {
      console.log(`[CRISIS_EVENT TRIGGERED] Severity ${incident.severity} >= 4. Broadcasting Force-Priority Override!`);
      io.emit('CRISIS_EVENT', {
        incidentId: incident.id,
        severity: incident.severity,
        zoneId: incident.zoneId,
        zoneName: incident.zoneName,
        hazard: incident.hazard,
        hazardType: incident.hazardType,
        trapped: incident.trapped,
        safeExit: incident.safeExit,
        safeVector: incident.safeVector,
        dispatch: dispatchMap,
        forcePriority: true,
        timestamp: incident.timestamp
      });

      // Start SLA Escalation timer for High/Critical incidents
      escalationManager.startIncidentSla(incident);
    }
  });

  // client -> server: dispatch:rescue { incidentId, teamName }
  socket.on('dispatch:rescue', (data) => {
    const { incidentId, teamName } = data || {};
    console.log(`[DISPATCH RESCUE] Team dispatched for incident ${incidentId}`);
    const res = store.dispatchRescue(incidentId, teamName);
    if (res) {
      io.emit('incident:update', res.incident);
      io.emit('markers:update', store.getAllMarkers());
      io.emit('building:update', res.buildingState);
    }
  });

  // client -> server: rescue:step { incidentId }
  socket.on('rescue:step', (data) => {
    const { incidentId } = data || {};
    console.log(`[RESCUE STEP] Rescuing occupant for incident ${incidentId}`);
    const res = store.rescueStep(incidentId);
    if (res) {
      io.emit('incident:update', res.incident);
      io.emit('markers:update', store.getAllMarkers());
      io.emit('building:update', res.buildingState);
      io.emit('rescue:saved', {
        incidentId,
        trappedRemaining: res.incident.trapped,
        status: res.incident.status
      });
      if (res.incident.trapped === 0) {
        escalationManager.clearIncidentSla(incidentId);
      }
    }
  });

  // client -> server: rescue:step_floor { buildingId, floorNumber }
  socket.on('rescue:step_floor', (data) => {
    const { floorNumber } = data || {};
    console.log(`[RESCUE STEP FLOOR] Rescuing occupant on Floor ${floorNumber}`);
    const res = store.rescueFloorStep(floorNumber);
    if (res) {
      io.emit('building:update', res.buildingState);
      io.emit('markers:update', res.markers);
      if (res.updatedIncident) {
        io.emit('incident:update', res.updatedIncident);
        if (res.updatedIncident.trapped === 0) {
          escalationManager.clearIncidentSla(res.updatedIncident.id);
        }
      }
      io.emit('rescue:saved', {
        floorNumber: res.floorNumber,
        totalTrapped: res.buildingState.totalTrapped
      });
    }
  });

  // client -> server: sync:offline_batch { batch: [...] }
  socket.on('sync:offline_batch', (data) => {
    const { batch } = data || {};
    console.log(`[OFFLINE SYNC] Reconciling ${batch?.length || 0} offline events from ${socket.id}`);
    if (Array.isArray(batch) && batch.length > 0) {
      const { results, buildingState } = store.syncOfflineBatch(batch);
      io.emit('batch:synced', {
        count: results.length,
        buildingState,
        markers: store.getAllMarkers(),
        incidents: store.getAllIncidents(),
        zones: store.getZones()
      });
      io.emit('building:update', buildingState);
      io.emit('markers:update', store.getAllMarkers());
    }
  });

  // client -> server: ack:incident { incidentId, nodeId }
  socket.on('ack:incident', (data) => {
    const { incidentId } = data || {};
    const nodeId = data?.nodeId || socket.id;
    console.log(`[ACK RECEIVED] Node ${nodeId} acknowledged incident ${incidentId}`);

    const ackResult = store.recordAck(incidentId, nodeId);
    io.emit('ack:update', ackResult);
    escalationManager.checkAcksFulfilled(incidentId);
  });

  // Resolve incident
  socket.on('resolve:incident', ({ incidentId }) => {
    console.log(`[INCIDENT RESOLVED] Incident ${incidentId} marked resolved.`);
    const res = store.resolveIncident(incidentId);
    escalationManager.clearIncidentSla(incidentId);

    io.emit('incident:resolved', {
      incidentId,
      zoneId: res?.incident?.zoneId,
      status: 'RESOLVED'
    });

    if (res?.incident) {
      io.emit('incident:update', res.incident);
      io.emit('markers:update', store.getAllMarkers());
      io.emit('building:update', res.buildingState);
      io.emit('zones:update', store.getZones());
    }
  });

  // Update manifest entry status (e.g. In Room -> Evacuating -> Safe)
  socket.on('manifest:update_status', ({ room, status }) => {
    const entry = store.updateManifestStatus(room, status);
    if (entry) {
      io.emit('manifest:update', store.getManifest());
    }
  });

  // Admin reset demo
  socket.on('admin:reset_demo', () => {
    console.log('[ADMIN RESET] Resetting venue to normal baseline.');
    store.incidents = [];
    store.markers.clear();
    store.zones = JSON.parse(JSON.stringify(initialZones));
    store.manifest = JSON.parse(JSON.stringify(initialManifest));
    store.acknowledgments.clear();

    for (const [id] of escalationManager.timers) {
      escalationManager.clearIncidentSla(id);
    }

    const buildingState = store.getBuildingState();

    io.emit('demo:reset', {
      zones: store.getZones(),
      manifest: store.getManifest(),
      incidents: [],
      markers: [],
      buildingState
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const removed = store.removeNode(socket.id);
    console.log(`[MESH DISCONNECT] Socket disconnected: ${socket.id} (${removed?.name || 'unknown'})`);
    io.emit('nodes:update', store.getAllNodes());
  });
});

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VORTEX SENTINEL GRAVITY HUB - REAL-TIME MESH`);
  console.log(`  Express + Socket.io Server active on port ${PORT}`);
  console.log(`  WebSocket Endpoint: ws://localhost:${PORT}`);
  console.log(`====================================================`);
});
