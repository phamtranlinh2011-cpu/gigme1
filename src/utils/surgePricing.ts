/**
 * Hệ Thống Điều Phối & Giá Linh Hoạt Theo Cung - Cầu (Dynamic Surge Pricing Engine)
 * Tự động điều chỉnh hệ số thù lao từ 1.02x đến 1.25x dựa trên:
 * - Khung giờ cao điểm sinh viên (Trưa đói cơm KTX, Tối tan học, Đêm khuya đồ án)
 * - Mật độ đơn chờ và tỷ lệ thợ/người nhận việc khả dụng quanh Campus
 * - Điều kiện thời tiết bất lợi (mưa rào, nắng gắt, bão)
 */

export interface SurgeFactor {
  id: string;
  label: string;
  detail: string;
  multiplierBoost: number; // ví dụ +0.08 (+8%)
  icon: string;
  active: boolean;
}

export interface SurgeCalculationResult {
  multiplier: number; // 1.02 - 1.25
  isSurging: boolean;
  basePrice: number;
  surgePrice: number;
  bonusAmount: number;
  primaryReason: string;
  factors: SurgeFactor[];
  campusDemandLevel: 'NORMAL' | 'HIGH' | 'PEAK' | 'CRITICAL';
}

/**
 * Tính toán hệ số giá linh hoạt theo thời gian thực
 */
export function calculateSurgePricing(
  basePrice: number,
  options?: {
    openGigsCount?: number;
    availableWorkersCount?: number;
    isRainyWeather?: boolean;
    customHour?: number;
  }
): SurgeCalculationResult {
  const now = new Date();
  const currentHour = options?.customHour !== undefined ? options.customHour : now.getHours() + now.getMinutes() / 60;
  const factors: SurgeFactor[] = [];

  // Baseline minimum surge: 1.02x (bù trượt giá điều phối cơ bản 2%)
  let totalMultiplier = 1.02;

  // 1. Khung giờ sinh viên cao điểm
  // - Trưa đói KTX (11:15 - 13:30): sinh viên ùa về ký túc xá ăn trưa, nhu cầu mua cơm ship hộ tăng vọt
  if (currentHour >= 11.25 && currentHour <= 13.5) {
    factors.push({
      id: 'lunch_rush',
      label: 'Cao điểm cơm trưa KTX (11h30 - 13h30)',
      detail: 'Nhu cầu mua đồ ăn, ship trà sữa tận phòng tăng đột biến',
      multiplierBoost: 0.08,
      icon: '🍜',
      active: true,
    });
    totalMultiplier += 0.08;
  }
  // - Chiều tối tan học / tan ca (17:30 - 19:45): sinh viên cần chở xe, lấy đồ giặt
  else if (currentHour >= 17.5 && currentHour <= 19.75) {
    factors.push({
      id: 'dinner_rush',
      label: 'Cao điểm tan học & cơm tối (17h30 - 19h45)',
      detail: 'Lượng đơn giao đồ, xe ôm campus và giặt ủi tăng cao',
      multiplierBoost: 0.06,
      icon: '🛵',
      active: true,
    });
    totalMultiplier += 0.06;
  }
  // - Đêm khuya đồ án / cứu hộ (22:00 - 05:00): ít người thức, nhu cầu in ấn, fix bug, cứu hộ đêm
  else if (currentHour >= 22 || currentHour < 5) {
    factors.push({
      id: 'late_night_rush',
      label: 'Kèo trực đêm & Hỏa tốc (22h00 - 05h00)',
      detail: 'Số lượng trợ thủ trực đêm khan hiếm, ưu tiên giá cao gấp',
      multiplierBoost: 0.12,
      icon: '🌙',
      active: true,
    });
    totalMultiplier += 0.12;
  } else {
    factors.push({
      id: 'standard_hour',
      label: 'Khung giờ tiêu chuẩn',
      detail: 'Cung cầu cân bằng, phụ phí điều phối sàn 2%',
      multiplierBoost: 0.02,
      icon: '⚡',
      active: true,
    });
  }

  // 2. Mật độ cung cầu (Cung vs Cầu trong bán kính 2km)
  const openGigs = options?.openGigsCount ?? 12;
  const workers = options?.availableWorkersCount ?? 6;
  const demandRatio = openGigs / Math.max(workers, 1);

  let demandLevel: 'NORMAL' | 'HIGH' | 'PEAK' | 'CRITICAL' = 'NORMAL';

  if (demandRatio > 2.5) {
    demandLevel = 'CRITICAL';
    factors.push({
      id: 'high_campus_demand',
      label: 'Cầu vượt cung quanh Campus (Tỷ lệ 2.5 : 1)',
      detail: 'Nhiều đơn chờ hơn số lượng trợ thủ đang rảnh rỗi',
      multiplierBoost: 0.07,
      icon: '🔥',
      active: true,
    });
    totalMultiplier += 0.07;
  } else if (demandRatio > 1.5) {
    demandLevel = 'HIGH';
    factors.push({
      id: 'moderate_demand',
      label: 'Nhu cầu cao điểm cục bộ',
      detail: 'Đơn chờ nhận việc đang tăng dần quanh khu ký túc xá',
      multiplierBoost: 0.04,
      icon: '📈',
      active: true,
    });
    totalMultiplier += 0.04;
  }

  // 3. Thời tiết bất lợi
  if (options?.isRainyWeather) {
    factors.push({
      id: 'rainy_weather',
      label: 'Thời tiết mưa gió campus',
      detail: 'Hỗ trợ trợ thủ chạy ngoài trời và đi lại khó khăn',
      multiplierBoost: 0.08,
      icon: '🌧️',
      active: true,
    });
    totalMultiplier += 0.08;
  }

  // Giới hạn tuyệt đối theo yêu cầu người dùng: MIN 1.02x, MAX 1.25x
  const clampedMultiplier = Math.min(1.25, Math.max(1.02, Number(totalMultiplier.toFixed(2))));
  
  // Làm tròn giá mới theo bội số 1.000đ (chuẩn tiền tệ VNĐ)
  const rawSurgePrice = basePrice * clampedMultiplier;
  const roundedSurgePrice = Math.round(rawSurgePrice / 1000) * 1000;
  const bonusAmount = Math.max(0, roundedSurgePrice - basePrice);

  const primaryReason =
    factors.find((f) => f.multiplierBoost > 0.03)?.label ||
    'Hệ số điều phối theo cung - cầu Campus';

  return {
    multiplier: clampedMultiplier,
    isSurging: clampedMultiplier > 1.02,
    basePrice,
    surgePrice: roundedSurgePrice,
    bonusAmount,
    primaryReason,
    factors,
    campusDemandLevel: demandLevel,
  };
}
