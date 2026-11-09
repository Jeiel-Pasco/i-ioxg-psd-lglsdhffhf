import type { Entry } from '../../data/schema';

export interface MarkerPoint {
  /** `<entryId>:<location index>` */
  key: string;
  entryId: string;
  index: number;
  x: number;
  y: number;
}

export interface Cluster {
  /** Position of the first member (the anchor). */
  x: number;
  y: number;
  members: MarkerPoint[];
}

/** Equirectangular projection (GDD 5.2): lat +N, lon +E in -180..180. */
export function project(lat: number, lon: number, w: number, h: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

export function markerPoints(entries: readonly Entry[], w: number, h: number): MarkerPoint[] {
  return entries.flatMap((e) =>
    e.locations.map((loc, index) => ({ key: `${e.id}:${index}`, entryId: e.id, index, ...project(loc.lat, loc.lon, w, h) })),
  );
}

/**
 * Greedy clustering: a point joins the first cluster whose anchor is within `radius`,
 * otherwise it anchors a new one. Anchors therefore stay at least `radius` apart,
 * and no marker moves: a cluster sits on its anchor's true position.
 */
export function clusterMarkers(points: readonly MarkerPoint[], radius: number): Cluster[] {
  const clusters: Cluster[] = [];
  for (const p of points) {
    const near = clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < radius);
    if (near) near.members.push(p);
    else clusters.push({ x: p.x, y: p.y, members: [p] });
  }
  return clusters;
}
