export function getDistance(coordsUser, coordsEvent) {
  const { lat: latUser, lng: lngUser } = coordsUser;
  const { lat: latEvent, lng: lngEvent } = coordsEvent;

  const R = 6371; // km
  const dLat = toRad(latEvent - latUser);
  const dLon = toRad(lngEvent - lngUser);
  const lat1 = toRad(latUser);
  const lat2 = toRad(latEvent);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distanceKm = R * c;
  return distanceKm;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

export function convertKmToMeters(km) {
  return km * 1000;
}
