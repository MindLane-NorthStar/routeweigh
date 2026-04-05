// Toll rates between WeighPoint pairs
// Users can add custom toll rates via settings (future feature)
// Format: "fromId->toId": costInDollars

const TOLL_RATES = {};

export function getToll(fromId, toId) {
  return TOLL_RATES[`${fromId}->${toId}`] || 0;
}

export function setToll(fromId, toId, cost) {
  TOLL_RATES[`${fromId}->${toId}`] = cost;
}
