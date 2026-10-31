// AI Ghost Triage & NLP Dispatcher Engine
// Analyzes raw natural language text/voice input into structured spatial casualty telemetry

/**
 * AI Triage Parser
 * Extracts floorNumber, roomNumber, trappedCount, hazardType, and calculated severity
 * @param {string} text - Raw natural language input from voice/text
 * @returns {Object} Extracted JSON telemetry
 */
export function extractAiTriage(text = '') {
  const result = {
    floorNumber: 1,
    roomNumber: '101',
    trappedCount: 0,
    hazardType: 'FIRE',
    severity: 3,
    confidence: 0.95
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
    result.floorNumber = 6;
  }

  // 2. Extract Room / Suite Number (e.g. "Room 402", "Rm 304", "Suite 201", "PH-01", "Unit 102")
  const roomMatch = text.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) {
    result.roomNumber = roomMatch[1].toUpperCase();
    // If floor wasn't explicit, infer from room number (e.g. Room 402 -> Floor 4)
    if (!floorMatch && /^[1-6][0-9]{2}$/.test(result.roomNumber)) {
      result.floorNumber = parseInt(result.roomNumber[0], 10);
    }
  } else {
    // Generate standard room label based on floor
    result.roomNumber = result.floorNumber > 0 ? `${result.floorNumber}0${Math.floor(Math.random() * 8 + 1)}` : 'Lobby';
  }

  // 3. Extract Trapped Count (e.g. "3 trapped", "4 people trapped", "2 persons", "5 souls", "count: 4")
  const trappedMatch = text.match(/([0-9]+)\s*(?:trapped|people|persons|souls|guests|victims|casualties|patients)/i)
    || text.match(/(?:trapped|count)\s*[:#\-]?\s*([0-9]+)/i);
  if (trappedMatch) {
    result.trappedCount = parseInt(trappedMatch[1], 10);
  }

  // 4. Hazard Classification
  if (/smoke|gas|fumes|toxic|chemical|leak/i.test(text)) {
    result.hazardType = 'SMOKE';
  } else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue|stroke/i.test(text)) {
    result.hazardType = 'MEDICAL';
  } else if (/collapse|structural|crack|quake|debris|breach|fall/i.test(text)) {
    result.hazardType = 'COLLAPSE';
  } else {
    result.hazardType = 'FIRE';
  }

  // 5. Automatic Severity Calculation (Level 1 to 5)
  if (result.trappedCount >= 3 || /critical|massive|explosion|trapped|flash fire|code red/i.test(text)) {
    result.severity = 5;
  } else if (result.trappedCount >= 1 || /severe|heavy smoke|uncontrolled/i.test(text)) {
    result.severity = 4;
  } else if (/warning|contained|moderate/i.test(text)) {
    result.severity = 3;
  } else if (/caution|minor/i.test(text)) {
    result.severity = 2;
  } else {
    result.severity = 1;
  }

  return result;
}

/**
 * Generate Role-Specific AI Ghost Dispatcher Commands
 */
export function generateRoleDispatch(incident, role) {
  const floor = incident.floorNumber || 1;
  const room = incident.roomNumber || 'Sector';
  const trapped = incident.trappedCount || 0;
  const sev = incident.severity || 3;

  if (sev >= 5) {
    switch (role) {
      case 'Responder':
        return `CRITICAL LEVEL 5: Breach Floor ${floor} (Room ${room}). ${trapped} souls trapped. Deploy suppression & trauma extraction immediately.`;
      case 'Floor Staff':
        return `CRITICAL LEVEL 5: Evacuate Floor ${floor} immediately via Stairwell A. Clear all corridors; do not use elevators.`;
      case 'Medical':
        return `CRITICAL LEVEL 5: Emergency Relief Hub on standby. Prepare 3 ICU/ER trauma bays for incoming Floor ${floor} casualties.`;
      default:
        return `CRITICAL LEVEL 5: Emergency override active for Floor ${floor} (Room ${room}).`;
    }
  }

  if (sev === 4) {
    switch (role) {
      case 'Responder':
        return `HIGH LEVEL 4: Advance to Floor ${floor} staging area. Prepare breach kit for Room ${room} (${trapped} trapped).`;
      case 'Floor Staff':
        return `HIGH LEVEL 4: Sweep corridors on Floor ${floor}. Guide guests toward nearest emergency stairwell.`;
      default:
        return `HIGH LEVEL 4: Containment units deployed to Floor ${floor}.`;
    }
  }

  return `LEVEL ${sev}: Standby and monitor Floor ${floor} (Room ${room}). Confirm containment.`;
}
