// Giám Sát & Phát Hiện Giả Lập Vị Trí (Anti-Fake GPS / Mock Location Detector)
import { calculateDistanceMeters } from './geo';

export interface GpsIntegrityReport {
  isMock: boolean;
  threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'CRITICAL_MOCK';
  reason?: string;
  accuracyMeters: number;
  apparentSpeedKmh: number;
  jitterVariance: number;
  satellitesEstimated: number;
  timestamp: number;
}

let lastRecordedLocation: { lat: number; lng: number; time: number } | null = null;
const positionHistory: Array<{ lat: number; lng: number; time: number }> = [];

export function inspectGpsIntegrity(
  position: GeolocationPosition
): GpsIntegrityReport {
  const coords = position.coords;
  const now = Date.now();
  const accuracy = coords.accuracy ?? 10;
  let threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'CRITICAL_MOCK' = 'CLEAN';
  let reason: string | undefined = undefined;
  let apparentSpeedKmh = 0;

  // 1. Kiểm tra cờ Mock Provider (hệ điều hành Android / Chromium expose mock)
  const rawCoords = coords as any;
  if (rawCoords.mock === true || rawCoords.isFromMockProvider === true) {
    threatLevel = 'CRITICAL_MOCK';
    reason = 'Phát hiện cờ Mock Provider (Phần mềm Fake GPS đang kích hoạt)';
  }

  // 2. Độ chính xác bất thường (Fake GPS thường set accuracy = 0.000m hoặc giá trị tĩnh bất biến)
  if (accuracy <= 0.001) {
    threatLevel = 'CRITICAL_MOCK';
    reason = 'Độ chính xác tọa độ bất thường (0.000m không có nhiễu sóng vệ tinh)';
  }

  // 3. Kiểm tra nhảy vọt vị trí bất thường (Teleportation check)
  if (lastRecordedLocation) {
    const elapsedSeconds = Math.max(0.5, (now - lastRecordedLocation.time) / 1000);
    const distMeters = calculateDistanceMeters(
      lastRecordedLocation.lat,
      lastRecordedLocation.lng,
      coords.latitude,
      coords.longitude
    );
    apparentSpeedKmh = (distMeters / 1000) / (elapsedSeconds / 3600);

    // Tốc độ di chuyển > 250km/h trong thành phố là bất khả thi với người đi xe máy/đi bộ
    if (distMeters > 3000 && apparentSpeedKmh > 250) {
      threatLevel = 'CRITICAL_MOCK';
      reason = `Phát hiện nhảy cóc vị trí bất thường (${Math.round(distMeters / 1000)}km trong ${Math.round(elapsedSeconds)}s, ~${Math.round(apparentSpeedKmh)} km/h)`;
    }
  }

  // Cập nhật lịch sử
  lastRecordedLocation = { lat: coords.latitude, lng: coords.longitude, time: now };
  positionHistory.push({ lat: coords.latitude, lng: coords.longitude, time: now });
  if (positionHistory.length > 10) positionHistory.shift();

  // 4. Kiểm tra độ rung lắc vệ tinh tự nhiên (GPS Jitter)
  // Thiết bị thật luôn có micro-jitter (sai số 0.5m - 3m do khí quyển). Fake GPS thường trả số cố định chính xác tuyệt đối.
  let jitterVariance = 0;
  if (positionHistory.length >= 4) {
    const lats = positionHistory.map((p) => p.lat);
    const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    jitterVariance = lats.reduce((sum, val) => sum + Math.pow(val - meanLat, 2), 0) / lats.length;
  }

  // Ước tính số vệ tinh thu nhận dựa trên độ chính xác
  const satellitesEstimated = accuracy < 5 ? 12 : accuracy < 15 ? 9 : accuracy < 30 ? 6 : 4;

  return {
    isMock: threatLevel === 'CRITICAL_MOCK',
    threatLevel,
    reason,
    accuracyMeters: Math.round(accuracy * 10) / 10,
    apparentSpeedKmh: Math.round(apparentSpeedKmh),
    jitterVariance,
    satellitesEstimated,
    timestamp: now,
  };
}
