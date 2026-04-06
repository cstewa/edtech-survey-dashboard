/**
 * Approximate geographic centroids for all 58 CA counties.
 * [lng, lat] — used to project county bubbles onto the SVG map.
 * Bounding box: lng [${minLng.toFixed(2)}, ${maxLng.toFixed(2)}], lat [${minLat.toFixed(2)}, ${maxLat.toFixed(2)}]
 */
export const CA_COUNTIES = [
${centroids.map(c => `  { name: '${c.name}', lng: ${c.lng}, lat: ${c.lat} },`).join('\n')}
];

// CA bounding box
export const CA_BOUNDS = {
  minLng: ${minLng.toFixed(2)},
  maxLng: ${maxLng.toFixed(2)},
  minLat: ${minLat.toFixed(2)},
  maxLat: ${maxLat.toFixed(2)},
};

/** Project [lng, lat] to SVG [x, y] within a given width/height */
export function project(lng, lat, width, height) {
  const x = ((lng - CA_BOUNDS.minLng) / (CA_BOUNDS.maxLng - CA_BOUNDS.minLng)) * width;
  const y = ((CA_BOUNDS.maxLat - lat) / (CA_BOUNDS.maxLat - CA_BOUNDS.minLat)) * height;
  return { x, y };
}
