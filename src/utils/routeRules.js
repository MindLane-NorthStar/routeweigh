// I-80/I-77 interchange area — forces Home ↔ Mom & Dad's onto the Turnpike
const I80_WAYPOINT = { lat: 41.1808, lng: -81.5175 };

export function getWaypoints(fromId, toId) {
  if (isTurnpikeLeg(fromId, toId)) {
    return [I80_WAYPOINT];
  }
  return [];
}

export function isTurnpikeLeg(fromId, toId) {
  return (
    (fromId === "home" && toId === "parents") ||
    (fromId === "parents" && toId === "home")
  );
}
