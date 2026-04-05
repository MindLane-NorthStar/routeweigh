// Route rules — currently no hardcoded waypoint enforcement
// Users can set toll overrides via the Toll Editor

// I-80/I-77 interchange area (Ohio Turnpike)
const I80_WAYPOINT = { lat: 41.1808, lng: -81.5175 };

export function getWaypoints(fromId, toId) {
  // No automatic waypoint injection for user-created WeighPoints
  // Users control their routes via stop ordering
  return [];
}

export function isTurnpikeLeg(fromId, toId) {
  // No automatic turnpike detection for user-created WeighPoints
  // Tolls are detected via Google Routes API or user overrides
  return false;
}
