// Hệ Thống Phát Hiện Tài Khoản Gian Lận & Cày Đánh Giá Chéo (Sybil & Bot Review Ring Detection)
import { UserEntity, GigEntity } from '../types';

export interface SybilThreatItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH_RISK_SYBIL_RING';
  reasons: string[];
  associatedUserIds: string[];
  detectedAt: number;
  isFlagged: boolean;
  score: number; // 0 - 100 (100 = definitely bot/sybil)
}

export interface SybilAuditSummary {
  totalScannedUsers: number;
  flaggedCount: number;
  highRiskRingsCount: number;
  threats: SybilThreatItem[];
}

/**
 * Quét toàn diện mạng lưới người dùng và lịch sử đơn hàng để nhận diện tấn công Sybil & Buff đánh giá ảo
 */
export function auditSybilAndReviewRings(
  users: UserEntity[],
  gigs: GigEntity[]
): SybilAuditSummary {
  const threats: SybilThreatItem[] = [];

  // Map user gigs
  const userPostedGigs = new Map<string, GigEntity[]>();
  const userWorkedGigs = new Map<string, GigEntity[]>();

  gigs.forEach((gig) => {
    if (!userPostedGigs.has(gig.clientId)) {
      userPostedGigs.set(gig.clientId, []);
    }
    userPostedGigs.get(gig.clientId)!.push(gig);

    if (gig.freelancerId) {
      if (!userWorkedGigs.has(gig.freelancerId)) {
        userWorkedGigs.set(gig.freelancerId, []);
      }
      userWorkedGigs.get(gig.freelancerId)!.push(gig);
    }
  });

  // Track shared device fingerprints or IP simulation
  const deviceMap = new Map<string, string[]>();
  users.forEach((u) => {
    const key = u.deviceFingerprint || u.lastDeviceName || 'dev_default';
    if (!deviceMap.has(key)) {
      deviceMap.set(key, []);
    }
    deviceMap.get(key)!.push(u.id);
  });

  users.forEach((user) => {
    // Admin root is excluded
    if (user.id === 'admin_root' || user.role === 'ADMIN') return;

    let score = 0;
    const reasons: string[] = [];
    const associatedUserIds = new Set<string>();

    // 1. Kiểm tra tài khoản dùng chung thiết bị phần cứng (Same Device / Multi-accounting)
    const deviceKey = user.deviceFingerprint || user.lastDeviceName;
    if (deviceKey && deviceMap.has(deviceKey)) {
      const coUsers = deviceMap.get(deviceKey)!.filter((uid) => uid !== user.id);
      if (coUsers.length >= 2) {
        score += 35;
        reasons.push(
          `Cùng thiết bị phần cứng (${deviceKey}) với ${coUsers.length} tài khoản khác (Dấu hiệu Clone tài khoản)`
        );
        coUsers.forEach((id) => associatedUserIds.add(id));
      }
    }

    // 2. Phát hiện Vòng quay Đánh giá chéo (Reciprocal Review Ring / Chùm tài khoản tự khen)
    const workedList = userWorkedGigs.get(user.id) || [];
    const clientFrequency = new Map<string, number>();

    workedList.forEach((gig) => {
      clientFrequency.set(
        gig.clientId,
        (clientFrequency.get(gig.clientId) || 0) + 1
      );
    });

    clientFrequency.forEach((count, clientId) => {
      // Nếu làm việc với cùng 1 khách từ 3 đơn trở lên mà khách đó cũng nhận việc ngược lại từ user này
      const reverseList = userWorkedGigs.get(clientId) || [];
      const reverseCount = reverseList.filter((g) => g.clientId === user.id).length;

      if (count >= 2 && reverseCount >= 1) {
        score += 45;
        const targetClient = users.find((u) => u.id === clientId);
        reasons.push(
          `Phát hiện vòng tròn tương hỗ (Reciprocal Ring): Đổi đơn và đánh giá 5 sao qua lại với ${
            targetClient?.name || clientId
          } (${count} đơn đi, ${reverseCount} đơn về)`
        );
        associatedUserIds.add(clientId);
      }
    });

    // 3. Tốc độ hoàn thành công việc phi lý (Instant completion anomaly < 1 phút sau khi nhận)
    const abnormallyFastGigs = workedList.filter((g) => {
      if (g.acceptedAt && g.ratedAt) {
        const durationSec = (g.ratedAt - g.acceptedAt) / 1000;
        return durationSec > 0 && durationSec < 90; // Nhận việc và đánh giá xong dưới 90 giây
      }
      return false;
    });

    if (abnormallyFastGigs.length >= 2) {
      score += 30;
      reasons.push(
        `Nghi vấn đơn ảo: Có ${abnormallyFastGigs.length} đơn hoàn thành và nghiệm thu thần tốc dưới 90s`
      );
    }

    // 4. Số điện thoại có định dạng hàng loạt / số ảo
    const phone = user.phone || '';
    if (phone.startsWith('090900') || phone.endsWith('0000') || user.email.includes('tempmail')) {
      score += 20;
      reasons.push('Định dạng liên hệ thuộc dải số/email rác');
    }

    // 5. Trùng lặp họ tên CCCD hoặc Tên hiển thị giống hệt nhau
    const nameClones = users.filter(
      (u) => u.id !== user.id && u.name.trim().toLowerCase() === user.name.trim().toLowerCase()
    );
    if (nameClones.length >= 2) {
      score += 25;
      reasons.push(`Trùng lặp họ tên với ${nameClones.length} tài khoản khác`);
      nameClones.forEach((u) => associatedUserIds.add(u.id));
    }

    if (score >= 30) {
      threats.push({
        id: `sybil_${user.id}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone || 'Chưa cập nhật',
        threatLevel:
          score >= 70
            ? 'HIGH_RISK_SYBIL_RING'
            : score >= 45
            ? 'MEDIUM'
            : 'LOW',
        reasons,
        associatedUserIds: Array.from(associatedUserIds),
        detectedAt: Date.now(),
        isFlagged: user.isFlaggedSybil ?? (score >= 50),
        score: Math.min(100, score),
      });
    }
  });

  return {
    totalScannedUsers: users.length,
    flaggedCount: threats.length,
    highRiskRingsCount: threats.filter((t) => t.threatLevel === 'HIGH_RISK_SYBIL_RING').length,
    threats: threats.sort((a, b) => b.score - a.score),
  };
}
