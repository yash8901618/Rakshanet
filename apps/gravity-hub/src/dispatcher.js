// AI Ghost Dispatcher Engine
// Pluggable role-specific tactical command generator & AI spatial telemetry extractor.

/**
 * AI Text & Spatial Telemetry Extractor
 * Automatically extracts floorNumber, roomNumber, estimatedTrappedCount, and hazardType from raw incident report text
 */
export function extractTelemetryFromReport(text = '') {
  const result = {
    floorNumber: null,
    roomNumber: null,
    trappedCount: 0,
    hazardType: 'FIRE'
  };

  if (!text || typeof text !== 'string') return result;

  // 1. Extract Floor Number (e.g. "Floor 4", "4th floor", "Level 3", "L2", "Basement", "Floor-1")
  const floorMatch = text.match(/(?:floor|level|fl|lvl)\s*[:#\-]?\s*([0-9]+|-1)/i) 
    || text.match(/([0-9]+)(?:st|nd|rd|th)\s*floor/i)
    || text.match(/\bL([0-9]+)\b/i);
  if (floorMatch) {
    result.floorNumber = parseInt(floorMatch[1], 10);
  } else if (/basement/i.test(text)) {
    result.floorNumber = -1;
  } else if (/lobby|ground/i.test(text)) {
    result.floorNumber = 0;
  } else if (/penthouse|rooftop/i.test(text)) {
    result.floorNumber = 4;
  }

  // 2. Extract Room Number (e.g. "Room 402", "Rm 104", "Suite 204", "PH-01", "Unit 301")
  const roomMatch = text.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) {
    result.roomNumber = roomMatch[1].toUpperCase();
    if (result.floorNumber === null && /^[1-9][0-9]{2}$/.test(result.roomNumber)) {
      result.floorNumber = parseInt(result.roomNumber[0], 10);
    }
  }

  // 3. Extract Trapped Count (e.g. "3 trapped", "4 people trapped", "2 persons", "5 souls", "trapped: 3")
  const trappedMatch = text.match(/([0-9]+)\s*(?:trapped|people|persons|souls|guests|victims|casualties|patients)/i)
    || text.match(/(?:trapped|count)\s*[:#\-]?\s*([0-9]+)/i);
  if (trappedMatch) {
    result.trappedCount = parseInt(trappedMatch[1], 10);
  }

  // 4. Hazard Classification
  if (/smoke|gas|fumes|chemical/i.test(text)) {
    result.hazardType = 'SMOKE';
  } else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue/i.test(text)) {
    result.hazardType = 'MEDICAL';
  } else if (/collapse|structural|crack|quake|debris|breach/i.test(text)) {
    result.hazardType = 'COLLAPSE';
  } else {
    result.hazardType = 'FIRE';
  }

  return result;
}

/**
 * Generate dispatch instructions for all roles or a specific role
 * @param {Object} incident - Incident object { id, zoneId, zoneName, text, severity, trapped, safeExit }
 * @param {string} role - Target role (Reception, Security, Floor Staff, Responder, Admin)
 * @param {number} severity - Severity level (1 to 5)
 * @returns {string} - Tailored tactical instruction
 */
export function generateRoleDispatch(incident, role, severity) {
  const zoneName = incident.zoneName || incident.zoneId || 'Target Zone';
  const hazard = incident.text || 'Hazard Alert';
  const trapped = incident.trapped || 0;
  const safeExit = incident.safeExit || 'nearest designated emergency route';

  // Severity 1: Low / Advisory & Verification
  if (severity <= 1) {
    switch (role) {
      case 'Reception':
        return `Low Alert: Verify incoming guest queries regarding ${zoneName}. Keep radio frequency 1 open.`;
      case 'Security':
        return `Low Alert: Dispatch patrol unit to inspect ${zoneName}. Confirm if ${hazard} is contained.`;
      case 'Floor Staff':
        return `Low Alert: Check nearby guest suites adjacent to ${zoneName}. Ensure corridors and exit paths remain unobstructed.`;
      case 'Responder':
        return `Low Alert: Standby on regional channel. Incident logged as localized minor condition in ${zoneName}.`;
      case 'Admin':
        return `Low Alert: Incident recorded in ${zoneName}. Review security patrol dispatch log.`;
      default:
        return `Check and verify conditions in ${zoneName}.`;
    }
  }

  // Severity 2: Moderate / Precautionary Action
  if (severity === 2) {
    switch (role) {
      case 'Reception':
        return `Moderate Alert: Pause non-urgent elevator traffic toward ${zoneName}. Prepare guest manifest for adjacent levels.`;
      case 'Security':
        return `Moderate Alert: Establish a 15-meter cordon around ${zoneName}. Isolate service elevator banks and monitor CCTV.`;
      case 'Floor Staff':
        return `Moderate Alert: Knock on doors in ${zoneName} corridors. Inform guests of maintenance advisory; guide toward ${safeExit}.`;
      case 'Responder':
        return `Moderate Alert: Prepare medical/first-aid and suppression kits. Awaiting verification of ${trapped > 0 ? `${trapped} potentially trapped` : 'area status'}.`;
      case 'Admin':
        return `Moderate Alert: Incident escalated to Level 2. Authorize security cordon in ${zoneName} and monitor staff ACK grid.`;
      default:
        return `Caution: Implement localized containment in ${zoneName}.`;
    }
  }

  // Severity 3: Warning / Tactical Action
  if (severity === 3) {
    switch (role) {
      case 'Reception':
        return `WARNING: Soft-hold guest check-ins. Prepare guest manifest for ${zoneName}. Open dedicated emergency channel.`;
      case 'Security':
        return `WARNING: Clear all primary corridors adjacent to ${zoneName}. Dispatch rapid response team with fire suppression & PPE.`;
      case 'Floor Staff':
        return `WARNING: Guide guests away from ${zoneName} towards ${safeExit}. Check all corridor exits are unblocked.`;
      case 'Responder':
        return `WARNING: Stage emergency extraction equipment at ${safeExit}. Prepare for casualty intake (${trapped} souls reported).`;
      case 'Admin':
        return `WARNING: Active hazard in ${zoneName}. Monitor node mesh heartbeats and SLA escalation timer.`;
      default:
        return `Warning: Deploy containment units to ${zoneName}.`;
    }
  }

  // Severity 4: High / Screen Override Lock
  if (severity === 4) {
    switch (role) {
      case 'Reception':
        return `HIGH PRIORITY: Freeze all hotel check-ins immediately. Lock down front manifest and prepare VIP extraction list. Broadcast soft evacuation chime.`;
      case 'Security':
        return `HIGH PRIORITY: Seal ${zoneName} access corridors immediately. Force stairwell fire doors closed. Secure ${safeExit} for priority evacuation.`;
      case 'Floor Staff':
        return `HIGH PRIORITY: Initiate immediate floor sweep in ${zoneName}. Guide all occupants toward ${safeExit}. ${trapped > 0 ? `Reported trapped: ${trapped} persons — locate and report!` : 'Ensure no guests remain inside rooms.'}`;
      case 'Responder':
        return `HIGH PRIORITY: Proceed to staging point at ${safeExit}. Equipping rapid breach & extraction gear for ${zoneName}.`;
      case 'Admin':
        return `HIGH PRIORITY: Override all digital signage to EVACUATION PATH. Stand by for auto-escalation timer; coordinate with Municipal 911 dispatch.`;
      default:
        return `HIGH PRIORITY: Evacuate ${zoneName} immediately via ${safeExit}.`;
    }
  }

  // Severity 5: Critical / Life-Safety Imperative Lockout
  if (severity >= 5) {
    switch (role) {
      case 'Reception':
        return `ALL UNITS CRITICAL: LIFE-SAFETY THREAT IN ${zoneName.toUpperCase()}. Transmit full guest manifest to First Responders. Sound venue-wide alarm. Abandon front desk via North Portico!`;
      case 'Security':
        return `ALL UNITS CRITICAL: LOCKDOWN & ISOLATE ${zoneName.toUpperCase()}. Drop HVAC fire dampers. Override all elevators to Ground Floor lock. Secure primary evacuation route: ${safeExit}.`;
      case 'Floor Staff':
        return `ALL UNITS CRITICAL: ACTIVE EMERGENCY IN ${zoneName.toUpperCase()}. Force all occupants into ${safeExit} NOW. Do NOT use elevators. ${trapped > 0 ? `ATTENTION: ${trapped} GUESTS TRAPPED IN ${zoneName} — DIRECT RESCUE TEAMS!` : 'Sweep and clear immediately!'}`;
      case 'Responder':
        return `ALL UNITS CRITICAL: BREACH ${zoneName.toUpperCase()} VIA ${safeExit}. Primary mission: Search & Rescue (${trapped} souls reported). Deploy tactical suppression & trauma triaging immediately.`;
      case 'Admin':
        return `ALL UNITS CRITICAL: CRISIS STATE 5 ACTIVE. Full venue emergency override engaged. Coordinate with Municipal Incident Commander. Monitor real-time mesh acknowledgments.`;
      default:
        return `CRITICAL: EVACUATE ${zoneName.toUpperCase()} IMMEDIATELY VIA ${safeExit.toUpperCase()}!`;
    }
  }

  return `Tactical alert in ${zoneName}.`;
}

/**
 * Generate a complete dispatch package for all recognized roles
 */
export function generateDispatch(incident, severity) {
  const roles = ['Reception', 'Security', 'Floor Staff', 'Responder', 'Admin'];
  const dispatchMap = {};

  for (const role of roles) {
    dispatchMap[role] = generateRoleDispatch(incident, role, severity);
  }

  return dispatchMap;
}
