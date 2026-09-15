// Geolocation, Distance Calculation, and Route Utilities for GigMe

export interface GeoLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

// Real Campus & Hub Anchor Coordinates in Vietnam
export const VIETNAM_HUBS: Record<string, GeoLocation> = {
  TDTU_Q7: {
    latitude: 10.7327,
    longitude: 106.6992,
    label: 'ĐH Tôn Đức Thắng (Quận 7, TP.HCM)',
  },
  BK_TPHCM: {
    latitude: 10.7725,
    longitude: 106.6578,
    label: 'ĐH Bách Khoa TP.HCM (Quận 10)',
  },
  KTX_DHQG: {
    latitude: 10.8808,
    longitude: 106.7825,
    label: 'KTX ĐHQG Khu B (Dĩ An / Thủ Đức)',
  },
  Q1_NGUYEN_HUE: {
    latitude: 10.7743,
    longitude: 106.7032,
    label: 'Phố đi bộ Nguyễn Huệ (Quận 1, TP.HCM)',
  },
  HUST_HANOI: {
    latitude: 21.0053,
    longitude: 105.8433,
    label: 'ĐH Bách Khoa Hà Nội (Hai Bà Trưng)',
  },
  FTU_HANOI: {
    latitude: 21.0263,
    longitude: 105.8016,
    label: 'ĐH Ngoại Thương Hà Nội (Đống Đa)',
  },
  BK_DANANG: {
    latitude: 16.0739,
    longitude: 108.1498,
    label: 'ĐH Bách Khoa Đà Nẵng (Liên Chiểu)',
  },
  DH_CANTHO: {
    latitude: 10.0299,
    longitude: 105.7684,
    label: 'ĐH Cần Thơ (Ninh Kiều)',
  },
};

export const DEFAULT_USER_LOCATION: GeoLocation = VIETNAM_HUBS.TDTU_Q7;

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters to readable string (e.g. 250m or 1.8km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimate travel time for walking (~4.5 km/h) and motorbike (~28 km/h in VN city)
 */
export function estimateTravelTime(meters: number): {
  walkMinutes: number;
  motoMinutes: number;
} {
  // Walking: 75 meters / minute
  const walkMinutes = Math.max(1, Math.ceil(meters / 75));
  // Motorbike: 450 meters / minute
  const motoMinutes = Math.max(1, Math.ceil(meters / 450));
  return { walkMinutes, motoMinutes };
}

/**
 * Generate native Google Maps route navigation link
 */
export function getGoogleMapsDirUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  travelMode: 'driving' | 'walking' | 'two-wheeler' = 'two-wheeler'
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${travelMode}`;
}

/**
 * Generate intermediate route points simulating city road navigation
 */
export function generateRoutePoints(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): [number, number][] {
  // Direct line if extremely close
  const dist = calculateDistanceMeters(fromLat, fromLng, toLat, toLng);
  if (dist < 100) {
    return [
      [fromLat, fromLng],
      [toLat, toLng],
    ];
  }

  // Create an authentic road-like manhattan / curved route
  const points: [number, number][] = [[fromLat, fromLng]];

  // 1st intersection waypoint
  const midLat = fromLat + (toLat - fromLat) * 0.45;
  const midLng = fromLng + (toLng - fromLng) * 0.05;
  points.push([midLat, midLng]);

  // 2nd turn waypoint
  const midLat2 = fromLat + (toLat - fromLat) * 0.55;
  const midLng2 = fromLng + (toLng - fromLng) * 0.85;
  points.push([midLat2, midLng2]);

  points.push([toLat, toLng]);
  return points;
}
