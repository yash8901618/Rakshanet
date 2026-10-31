// Escalation and SLA timer engine for Vortex Sentinel

export class EscalationManager {
  constructor(io, store, slaDurationMs = 35000) {
    this.io = io;
    this.store = store;
    this.slaDurationMs = slaDurationMs; // 35 seconds default SLA
    this.timers = new Map(); // incidentId -> { timeoutId, intervalId, expiresAt, incident }
  }

  startIncidentSla(incident) {
    // Only monitor SLA for High (3) and Critical (4) incidents
    if (incident.severity < 3) return;

    // Clear any existing SLA for this incident
    this.clearIncidentSla(incident.id);

    const expiresAt = Date.now() + this.slaDurationMs;

    // Tick every 1 second to broadcast SLA countdown to all nodes
    const intervalId = setInterval(() => {
      const remainingMs = Math.max(0, expiresAt - Date.now());
      const acks = this.store.getAcks(incident.id);
      const totalNodes = this.store.getAllNodes().length;

      this.io.emit('sla:tick', {
        incidentId: incident.id,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        totalAcks: acks.length,
        totalNodes
      });

      if (remainingMs <= 0) {
        clearInterval(intervalId);
      }
    }, 1000);

    const timeoutId = setTimeout(() => {
      this.handleSlaBreach(incident.id);
    }, this.slaDurationMs);

    this.timers.set(incident.id, {
      timeoutId,
      intervalId,
      expiresAt,
      incidentId: incident.id
    });
  }

  handleSlaBreach(incidentId) {
    const incident = this.store.getIncident(incidentId);
    if (!incident || incident.status !== 'ACTIVE') {
      this.clearIncidentSla(incidentId);
      return;
    }

    const acks = this.store.getAcks(incidentId);
    const nodes = this.store.getAllNodes();

    // If not all critical nodes acknowledged, escalate!
    const escalatedIncident = this.store.escalateIncident(incidentId, Math.min(4, incident.severity + 1));

    console.log(`[ESCALATION ENGINE] SLA Breached for ${incidentId}. Escalating incident urgency to ${escalatedIncident.urgencyLevel}. Unacknowledged nodes: ${nodes.length - acks.length}`);

    // Emit exact contract event: escalate:incident { incidentId, newUrgency }
    this.io.emit('escalate:incident', {
      incidentId,
      newUrgency: escalatedIncident.urgencyLevel,
      unacknowledgedCount: Math.max(0, nodes.length - acks.length),
      reason: `SLA of ${this.slaDurationMs / 1000}s expired without full node acknowledgment.`
    });

    this.clearIncidentSla(incidentId);
  }

  clearIncidentSla(incidentId) {
    const existing = this.timers.get(incidentId);
    if (existing) {
      if (existing.timeoutId) clearTimeout(existing.timeoutId);
      if (existing.intervalId) clearInterval(existing.intervalId);
      this.timers.delete(incidentId);
    }
  }

  checkAcksFulfilled(incidentId) {
    const acks = this.store.getAcks(incidentId);
    const nodes = this.store.getAllNodes();
    // If all currently connected nodes have acknowledged, we can cancel the escalation timer
    if (nodes.length > 0 && acks.length >= nodes.length) {
      console.log(`[ESCALATION ENGINE] All ${nodes.length} connected nodes have acknowledged ${incidentId}. SLA timer disarmed.`);
      this.clearIncidentSla(incidentId);
      this.io.emit('sla:disarmed', { incidentId, reason: 'All active nodes acknowledged' });
    }
  }
}
