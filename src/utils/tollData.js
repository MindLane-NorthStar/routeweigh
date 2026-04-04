// Ohio Turnpike E-ZPass rates for passenger vehicles
// Home (Cuyahoga Falls area, Exit 180) ↔ Strongsville area (Exit 161)
const TOLL_RATES = {
  "home->parents": 1.75,
  "parents->home": 1.75,
};

export function getToll(fromId, toId) {
  return TOLL_RATES[`${fromId}->${toId}`] || 0;
}
