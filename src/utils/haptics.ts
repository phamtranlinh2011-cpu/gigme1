// GigMe Tactile Haptic Feedback Utility
// Phản hồi rung nhẹ trên điện thoại thông minh (Android / iOS PWA) tạo cảm giác chắc chắn

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'escrow'
  | 'nfc'
  | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined') return;

  // Check if Vibration API is supported
  if ('navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'light':
          // Rung cực nhẹ khi chạm nút hoặc tương tác thông thường
          navigator.vibrate(15);
          break;
        case 'medium':
          // Rung vừa khi chuyển trạng thái, lọc dữ liệu
          navigator.vibrate(35);
          break;
        case 'heavy':
          // Rung mạnh khi thao tác hủy đơn hoặc báo động
          navigator.vibrate(70);
          break;
        case 'success':
          // Nhịp điệu đôi vui vẻ khi nhận việc thành công
          navigator.vibrate([25, 40, 30]);
          break;
        case 'escrow':
          // Nhịp điệu bảo chứng Smart Escrow (Chốt cọc, khóa quỹ an toàn)
          navigator.vibrate([35, 30, 45, 30, 60]);
          break;
        case 'nfc':
          // Nhịp cảm ứng NFC khi đối soát Chip CCCD hoặc thẻ sinh viên
          navigator.vibrate([50, 40, 50, 40, 70]);
          break;
        case 'error':
          // Báo lỗi thao tác
          navigator.vibrate([60, 50, 60, 50, 80]);
          break;
      }
    } catch {
      // Ignore vibration errors on restricted devices
    }
  }
}
