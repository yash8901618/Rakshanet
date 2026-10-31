// AI Triage & Parsing Engine (Gravity Hub AI Core)
// Extracts structured spatial casualty telemetry from natural language voice/text emergency inputs.

/**
 * Parses raw text or voice transcript into structured emergency telemetry.
 * Example input: "Fire broke out on 4th floor room 402, 5 people trapped"
 * Output: { floorNumber: 4, roomNumber: "402", trappedCount: 5, hazardType: "FIRE", severity: 5, confidence: 0.95 }
 *
 * @param {string} text - Raw natural language report
 * @returns {Object} Structured triage JSON
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

  const cleanText = text.trim();

  // 1. Extract Floor Number (e.g. "Floor 4", "4th floor", "Level 3", "L2", "Basement", "Floor-1")
  const floorMatch = cleanText.match(/(?:floor|level|fl|lvl)\s*[:#\-]?\s*([0-9]+|-1)/i)
    || cleanText.match(/([0-9]+)(?:st|nd|rd|th)\s*floor/i)
    || cleanText.match(/\bL([0-9]+)\b/i);

  if (floorMatch) {
    result.floorNumber = Math.max(1, Math.min(6, parseInt(floorMatch[1], 10)));
  } else if (/basement/i.test(cleanText)) {
    result.floorNumber = 1;
  } else if (/lobby|ground/i.test(cleanText)) {
    result.floorNumber = 1;
  } else if (/penthouse|rooftop/i.test(cleanText)) {
    result.floorNumber = 6;
  }

  // 2. Extract Room / Unit Number (e.g. "Room 402", "Rm 304", "Suite 201", "PH-01", "Unit 102", "402")
  const roomMatch = cleanText.match(/(?:room|rm|suite|unit)\s*[:#\-]?\s*([a-z0-9\-]+)/i);
  if (roomMatch) {
    result.roomNumber = roomMatch[1].toUpperCase();
    // If floor wasn't explicit, infer from first digit of room number (e.g. 402 -> Floor 4)
    if (!floorMatch && /^[1-6][0-9]{2}$/.test(result.roomNumber)) {
      result.floorNumber = parseInt(result.roomNumber[0], 10);
    }
  } else {
    // Check if a 3-digit room number exists alone (e.g. "at 402")
    const standaloneRoom = cleanText.match(/\b([1-6][0-9]{2})\b/);
    if (standaloneRoom) {
      result.roomNumber = standaloneRoom[1];
      if (!floorMatch) {
        result.floorNumber = parseInt(result.roomNumber[0], 10);
      }
    } else {
      result.roomNumber = `${result.floorNumber}0${Math.floor(Math.random() * 8 + 1)}`;
    }
  }

  // 3. Extract Trapped Count (e.g. "5 people trapped", "3 trapped", "2 casualties", "4 souls", "1 person", "count: 5")
  const trappedMatch = cleanText.match(/([0-9]+)\s*(?:people|person|persons|souls|guests|victims|casualties|patients|occupants)?\s*trapped/i)
    || cleanText.match(/([0-9]+)\s*(?:people|person|persons|souls|guests|victims|casualties|patients|occupants)\b/i)
    || cleanText.match(/(?:trapped|count|casualties|victims)\s*[:#\-]?\s*([0-9]+)/i);

  if (trappedMatch) {
    result.trappedCount = parseInt(trappedMatch[1], 10);
  } else if (/trapped/i.test(cleanText)) {
    // Word numbers fallback
    if (/one\s+trapped/i.test(cleanText)) result.trappedCount = 1;
    else if (/two\s+trapped/i.test(cleanText)) result.trappedCount = 2;
    else if (/three\s+trapped/i.test(cleanText)) result.trappedCount = 3;
    else if (/four\s+trapped/i.test(cleanText)) result.trappedCount = 4;
    else if (/five\s+trapped/i.test(cleanText)) result.trappedCount = 5;
    else result.trappedCount = 1;
  }

  // 4. Hazard Classification
  if (/smoke|gas|fumes|toxic|chemical|leak|suffocation/i.test(cleanText)) {
    result.hazardType = 'SMOKE';
  } else if (/medical|casualty|injury|injured|cardiac|unconscious|code blue|stroke|bleeding/i.test(cleanText)) {
    result.hazardType = 'MEDICAL';
  } else if (/collapse|structural|crack|quake|debris|breach|fall|wall/i.test(cleanText)) {
    result.hazardType = 'COLLAPSE';
  } else if (/flood|water|pipe|leak/i.test(cleanText)) {
    result.hazardType = 'FLOOD';
  } else {
    result.hazardType = 'FIRE';
  }

  // 5. Automatic Severity Calculation (Level 1 to 5)
  if (result.trappedCount >= 4 || /critical|massive|explosion|code red|flash fire|life-threatening/i.test(cleanText)) {
    result.severity = 5;
  } else if (result.trappedCount >= 2 || /severe|heavy smoke|uncontrolled|urgent/i.test(cleanText)) {
    result.severity = 4;
  } else if (result.trappedCount === 1 || /warning|contained|moderate|active/i.test(cleanText)) {
    result.severity = 3;
  } else if (/caution|minor|smolder/i.test(cleanText)) {
    result.severity = 2;
  } else {
    result.severity = 1;
  }

  return result;
}

/**
 * Generates tailored operational directives per tactical role.
 */
export function generateRoleDispatch(incident, role) {
  const floor = incident.floorNumber || 1;
  const room = incident.roomNumber || 'Sector';
  const trapped = incident.trappedCount || 0;
  const sev = incident.severity || 3;
  const hazard = incident.hazardType || 'FIRE';

  if (sev >= 5) {
    switch (role) {
      case 'Responder':
        return `CRITICAL LEVEL 5: Immediate tactical breach required at Floor ${floor} (Room ${room}). ${trapped} souls trapped in ${hazard} zone. Deploy suppression & hydraulic extraction gear.`;
      case 'Floor Staff':
        return `CRITICAL LEVEL 5: Execute emergency floor evacuation on Floor ${floor}. Direct all occupants to Stairwell A/B. Elevators locked down.`;
      case 'Medical':
        return `CRITICAL LEVEL 5: Mass casualty protocol active. Standby 3 ER trauma bays & 2 ICU beds for incoming Floor ${floor} victims.`;
      default:
        return `CRITICAL LEVEL 5: Emergency override active for Floor ${floor} (Room ${room}). Total containment required.`;
    }
  }

  if (sev === 4) {
    switch (role) {
      case 'Responder':
        return `HIGH LEVEL 4: Advance to Floor ${floor} staging corridor. Prepare thermal imaging & entry tools for Room ${room} (${trapped} trapped).`;
      case 'Floor Staff':
        return `HIGH LEVEL 4: Sweep adjacent rooms on Floor ${floor}. Escort individuals to emergency exits.`;
      case 'Medical':
        return `HIGH LEVEL 4: Prepare triage area at Ground Hub for Floor ${floor} evacuees.`;
      default:
        return `HIGH LEVEL 4: Fast-response unit en route to Floor ${floor}.`;
    }
  }

  return `LEVEL ${sev}: Monitored tactical response on Floor ${floor} (Room ${room}). Confirm ${hazard} containment.`;
}
