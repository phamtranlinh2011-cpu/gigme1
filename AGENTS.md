# GIGME - HỒ SƠ DỰ ÁN TOÀN DIỆN & SỔ TAY KỸ THUẬT HỆ THỐNG (AGENTS.MD)

> **TẬP TIN CHỈ DẪN DUY NHẤT DÀNH CHO AI STUDIO & DEVELOPER (MULTI-ACCOUNT & MULTI-REPO READY)**
> Tập tin này được Google AI Studio tự động nạp vào bộ nhớ hệ thống (System Prompt) cho mọi phiên làm việc mới. Dù bạn chuyển đổi qua tài khoản Google khác, dùng repo/fork khác, hoặc hết token mở session mới, AI sẽ nắm bắt 100% thông tin kỹ thuật, kiến trúc và quy tắc để tiếp tục công việc ngay lập tức mà không cần phải đọc từng file từ đầu và không bao giờ gặp lỗi hay xung đột.

---

## 1. NGUYÊN TẮC CỐT LÕI & CÁC QUY TẮC BẤT KHẢ XÂM PHẠM

### 1.1. Các tính năng ĐÃ XÓA VĨNH VIỄN (Nghiêm cấm tự ý khôi phục)
1. **Bảng Xếp Hạng Top (Campus Leaderboard)**: Đã xóa hoàn toàn màn hình, nút bấm, tab và liên kết theo yêu cầu chủ dự án. Tuyệt đối không khôi phục.
2. **Tính năng Vay tiền & Xác thực Vay**: Đã xóa hoàn toàn module vay vốn sinh viên, cam kết trả chậm và KYC vay tiền. Ứng dụng chỉ vận hành theo cơ chế nạp tiền làm dịch vụ, nhận thù lao và thanh toán ký quỹ Escrow bảo đảm.
3. **Tính năng SOS SafeWalk**: Đã xóa hoàn toàn module SOS SafeWalk (modal, session, âm còi hú báo động, quyền hạn, endpoint server, Firestore rules). Nghiêm cấm tự ý khôi phục.
4. **Tài khoản mẫu giả lập cũ (Mock Data)**: Tuyệt đối không khôi phục tài khoản `user_student_huy` hoặc các tài khoản fake name cũ. Hệ thống khởi tạo người dùng thật hoặc qua đăng ký.

### 1.2. Quy định Nạp tiền & Rút tiền (Deposit & Withdrawal Rules)
- **Hạn mức nạp tiền**:
  - Tối đa mỗi lần nạp: `10.000.000 VNĐ (10 triệu)`.
  - Hạn mức tối đa mỗi ngày: `30.000.000 VNĐ (30 triệu)` / ngày.
  - Quản lý tập trung trong `checkDepositEligibility()` tại `src/context/GigMeContext.tsx`.
- **Hạn mức rút tiền & An toàn tài chính**:
  - Tối đa mỗi lần rút: `3.000.000 VNĐ (3 triệu)` / lần. Tối thiểu `50.000 VNĐ`.
  - Cooldown giữa 2 lần rút: `15 phút`.
  - Chống rửa tiền (AML): Tiền mới nạp phải cách tối thiểu `1 giờ (60 phút)` mới được rút ra.
  - Điều kiện rút: Tài khoản tạo ít nhất `5 ngày`, thời gian online tích lũy tối thiểu `3 giờ`, đã hoàn thành ít nhất `1 công việc`.
  - Giới hạn trần số dư: Tài khoản không vượt quá `200.000.000 VNĐ (200 triệu)`. Nếu vượt sẽ bị yêu cầu rút bớt.
  - **Admin tối cao (`000000000`)** được bypass toàn bộ điều kiện rút/nạp để phục vụ kiểm thử.

### 1.3. Quy tắc Đánh giá Tài khoản Mới
- Tài khoản mới tạo hoặc có **0 lượt đánh giá** thì phải hiển thị **0 sao (0.0 ★ / 0 đánh giá)**. Tuyệt đối không được gán mặc định là 5/5 sao.

---

## 2. THÔNG TIN ĐĂNG NHẬP MASTER ADMIN & MODERATORS

Dù ở bất kỳ tài khoản Google hay repo clone/fork nào, các tài khoản đặc quyền luôn cố định và sẵn sàng:

| Vai trò | ID 9 Số | Email / Contact | Mật khẩu | Số dư khởi tạo | Ghi chú quyền hạn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Root Admin** | `000000000` | `admin@gigme.vn`<br>`admin@admin.vn`<br>`0909120918` | `admin1507` | 0 VNĐ | Toàn quyền quản trị, xóa user, duyệt KYC, phân xử tranh chấp, bảo trì hệ thống (Bypass kiểm tra nạp/rút để kiểm thử). |
| **Mod 1** | `000000001` | `mod1@gigme.vn` | `mod1999` | 500.000 VNĐ | Kiểm duyệt user, duyệt KYC, phân xử tranh chấp, quản lý chợ sinh viên. |
| **Mod 2** | `000000002` | `mod2@gigme.vn` | `mod4444` | 500.000 VNĐ | Kiểm duyệt user, duyệt KYC, phân xử tranh chấp, quản lý chợ sinh viên. |
| **Mod 3** | `000000003` | `mod3@gigme.vn` | `mod0308` | 500.000 VNĐ | Kiểm duyệt user, duyệt KYC, phân xử tranh chấp, quản lý chợ sinh viên. |

- **Duy trì phiên đăng nhập**: Khi Root Admin hoặc Mod đăng nhập, hệ thống lưu:
  - `sessionStorage.setItem('gigme_admin_active_session', 'true')`
  - `localStorage.setItem('gigme_current_user_id', userId)`
  - Khi F5/Refresh trang không bao giờ bị mất phiên Admin/Mod.

---

## 3. THÔNG TIN HẠ TẦNG KỸ THUẬT & MÔI TRƯỜNG BUILD

- **Container Environment**: Full-stack React 18 + Node Express trên Google Cloud Run container.
- **Port**: Cố định cổng `3000` (Nginx reverse proxy của AI Studio).
- **Lệnh Build sản xuất**:
  ```bash
  npm run build
  # Chạy: vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
  ```
- **Lệnh kiểm tra cú pháp (Lint)**:
  ```bash
  npm run lint
  # Chạy: tsc --noEmit
  ```
- **Lệnh chạy server**:
  ```bash
  npm start
  # Chạy: node dist/server.cjs
  ```
- **Cơ chế Fallback Cloud/Local**:
  - Khi Firebase chưa cấu hình hoặc mạng offline: Hệ thống tự động fallback mượt mà sang `LocalStorage` + `IndexedDB` (`cloudSync.ts`) mà không làm ứng dụng crash hay trắng trang.
  - Khi Firebase kích hoạt: Đồng bộ tức thì qua Cloud Firestore `/calls`, `/gigs`, `/messages`, `/users`, `/transactions`.

---

## 4. HỆ THỐNG GỌI THOẠI & GỌI VIDEO WEBRTC (VOIP & VIDEO CALL)

Hệ thống Call & Video Call được đồng bộ đa thiết bị, hỗ trợ WebRTC P2P mã hóa DTLS-SRTP:

### 4.1. Chu kỳ Tín Hiệu (Signaling Architecture)
- **Signaling Server kép**:
  1. **Firebase Firestore**: Collection `/calls/{callId}` lưu trữ trạng thái call (`RINGING` -> `ACCEPTED` / `REJECTED` / `ENDED`), SDP Offer, SDP Answer, và ICE Candidates mảng `callerCandidates`, `calleeCandidates`.
  2. **BroadcastChannel**: `gigme_voip_channel` phát sóng nội bộ giữa các tab trình duyệt cùng máy, giúp kiểm thử 2 tài khoản trên 2 tab lập tức bắt máy mà không trễ mạng.
- **Ringtone & Haptic liên tục**:
  - Cuộc gọi đến: `startRingtone('INCOMING')` phát chuỗi chuông giai điệu melodic lặp lại liên tục kết hợp rung `navigator.vibrate([350, 150, 350, 800])`.
  - Cuộc gọi đi: `startRingtone('OUTGOING')` phát hồi chuông ringback tone lặp lại.
  - Ngay khi nhấc máy, hủy hoặc kết thúc: Tự động gọi `stopRingtone()` ngắt chuông sạch sẽ.

### 4.2. Các Tính Năng Đàm Thoại Nâng Cao Đã Tích Hợp
1. **Thu nhỏ cuộc gọi (Floating Call Bubble - Minimize)**:
   - Trong `VoipCallOverlay.tsx`: Nút `Minimize2` thu gọn cuộc gọi thành Widget nổi ở góc dưới màn hình (`bottom-20 right-4`).
   - Widget hiển thị thời lượng đàm thoại thời gian thực, avatar đối tác, phím tắt Mute, Cam, Cúp máy, và nút `Maximize2` để phóng to trở lại. Người dùng có thể vừa nói chuyện vừa nhắn tin, xem gigs, nạp tiền.
2. **Lật Camera Trước / Sau (Front / Rear Camera Flip)**:
   - Nút `SwitchCamera` gọi `flipCameraVoip()`: Dùng `navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing } })` và thay thế track trên `RTCPeerConnection` bằng `sender.replaceTrack(newTrack)` mà không cần ngắt kết nối.
3. **Nâng cấp Thoại sang Video trực tiếp (Voice to Video Upgrade)**:
   - Trong cuộc gọi thoại, người dùng bấm nút Camera sẽ kích hoạt camera, thêm video track vào WebRTC và gửi tín hiệu `UPGRADE_TO_VIDEO` sang đối phương.
4. **Đồng bộ trạng thái Tắt Mic / Tắt Cam hai chiều (Remote Media Sync)**:
   - Trạng thái `isMuted` và `isVideoOff` được gửi lên Firestore (`callerMuted`, `calleeMuted`, `callerVideoOff`, `calleeVideoOff`) và BroadcastChannel.
   - Khi đối phương tắt camera, màn hình hiển thị Avatar kèm thông báo: *"Đối phương đã tạm tắt camera"*.
   - Khi đối phương tắt mic, hiển thị huy hiệu: *"Đối phương đang tắt micro"*.
5. **Đổi Màn hình Chính / Phụ (PiP Swap)**:
   - Trong video call, chạm vào ô video thu nhỏ góc trên để tráo đổi vị trí hiển thị giữa camera của mình và camera đối tác.
   - Video camera trước được phản chiếu gương tự nhiên bằng class CSS `-scale-x-100`.
6. **Lịch sử Cuộc gọi trong Khung Chat (Call Log in Chat)**:
   - Khi cúp máy, hệ thống tự động ghi một tin nhắn loại `attachmentType: 'CALL_LOG'` vào phòng chat:
     - Cuộc gọi thành công: `📞 Cuộc gọi thoại đã kết thúc (02:45)` hoặc `📹 Cuộc gọi video đã kết thúc (05:12)`.
     - Cuộc gọi nhỡ: `⚠️ Cuộc gọi nhỡ` màu đỏ nổi bật kèm nút bấm **"Gọi lại ngay"** hoặc **"Gọi lại bằng video"** 1-chạm.
7. **Hiển thị Chất lượng Kết nối (Signal Bars) & Nút Mute Trực quan**:
   - Vạch sóng kết nối động 4 mức (`renderSignalBars`): Đánh giá theo độ trễ ms (Xuất sắc / Tốt / Trung bình / Yếu) hiển thị trực quan ở thanh tiêu đề, chế độ video, chế độ thoại và cả widget thu nhỏ.
   - Nút **Mute / Unmute** trực quan (`#voip-mute-btn`, `#mini-voip-mute-btn`): Nhãn chữ rõ ràng, hiệu ứng ring viền đỏ khi tắt tiếng và đồng bộ tức thời hai chiều.
8. **Đồng hồ Đếm Giờ Cuộc Gọi Thời Gian Thực (Real-Time Call Timer)**:
   - Sử dụng `callStartTimeRef` bám sát thời gian thực (wall-clock time) với chu kỳ cập nhật `1000ms`, định dạng tự động `MM:SS` (hoặc `HH:MM:SS` khi cuộc gọi kéo dài hơn 1 giờ).
   - Hiển thị đồng bộ ở: Thanh tiêu đề cuộc gọi (`#voip-call-timer-top`), badge nổi trên màn hình video (`#voip-video-floating-timer`), thanh trạng thái video (`#voip-video-call-timer`), trung tâm cuộc gọi thoại (`#voip-call-timer`, `#voip-audio-call-timer`), và widget thu nhỏ (`#mini-voip-call-timer`).
9. **Thu nhỏ Picture-in-Picture (PiP) & Tự Do Điều Hướng Chuyển Tab**:
   - **In-App PiP (Floating Widget)**: Nút `Minimize2` / `PictureInPicture2` thu nhỏ cuộc gọi thành Mini Widget góc dưới (`bottom-20 right-3 z-50`). Nhờ `VoipCallOverlay` đặt ở root `App.tsx`, người dùng thoải mái chuyển sang mọi tab trong app (Trang chủ, Chợ đồ cũ, Nhắn tin, Ví tiền, Hồ sơ) mà không gián đoạn kết nối.
   - **Native Browser PiP**: Nút `#voip-pip-btn` và `#voip-action-pip-btn` gọi `requestPictureInPicture()` trên thẻ `<video>`, tách cửa sổ nổi ra ngoài trình duyệt để người dùng chuyển sang tab trình duyệt khác hoặc phần mềm khác mà vẫn xem và trò chuyện được.

---

## 5. HỆ THỐNG TIN NHẮN & AN TOÀN CHAT 1-1

### 5.1. Cô lập Luồng Chat 1-1 (Rule 3.4)
- Mọi cuộc trò chuyện cá nhân giữa 2 người dùng bắt buộc tạo threadId xác định bằng:
  ```ts
  const getDirectThreadId = (userA: string, userB: string): string => {
    const sorted = [userA, userB].sort();
    return `direct_${sorted[0]}_${sorted[1]}`;
  };
  ```
  Ngăn chặn triệt để tình trạng tin nhắn người này lẫn sang người khác.

### 5.2. Modal "Thêm Bạn" & Tìm Kiếm ID 9 Số
- Khung tìm kiếm ID 9 số, sao lưu danh bạ và điều khoản hoàn tiền nằm trong modal `showAddFriendModal` kích hoạt qua nút "Thêm bạn" trên header chat, không để lộ tràn lan làm rối giao diện.
- Bấm vào bất kỳ liên hệ nào trong danh bạ luôn mở đúng thread 1-1 của người đó.

### 5.3. Bộ Lọc Chống Lách Sàn (Anti-Leakage) & Kiểm Duyệt Hình Ảnh
- `detectAndFilterOffPlatformLeakage(text)`: Quét và che tự động các thông tin liên hệ nhạy cảm ngoài sàn (Zalo, SĐT, số tài khoản cá nhân ngoài luồng) để bảo vệ quỹ ký quỹ Escrow.
- `checkImageWithSightengine(dataUrl)`: Gọi `/api/moderation/check-image` kiểm tra nội dung bạo lực/18+ trước khi gửi ảnh.
- **Thu hồi tin nhắn trong 24h**: Chỉ cho phép người gửi thu hồi tin nhắn do chính mình gửi (`recallChatMessage()`).

---

## 6. QUY TRÌNH SMART ESCROW & TÀI CHÍNH TỰ ĐỘNG

1. **Khóa Ký Quỹ Escrow (Escrow Lock)**:
   - Khi khách đăng việc hoặc nhận việc: Tiền thù lao được khóa an toàn vào `escrowLockedBalance`.
2. **Nghiệm Thu & Chống Gian Lận Tọa Độ (Anti-Fake GPS)**:
   - Thợ hoàn thành công việc nộp minh chứng có Watermark GPS và thời gian thực qua `submitProofOfWork()`.
   - `validateGpsAuthenticity()`: So sánh tọa độ hiện tại với địa điểm đơn việc, chặn đứng các ứng dụng giả lập Mock Location.
3. **Giải Ngân Thông Minh (`releaseEscrowPayout`)**:
   - Khách duyệt nghiệm thu: Tiền Escrow tự động chuyển về ví thợ (sau khi trừ phí sàn 7%-10% theo Tier và thuế TNCN 10% nếu đơn >= 2 triệu VNĐ).
   - Ảnh nghiệm thu được tự động gỡ Watermark bản gốc cho khách.
4. **Đơn Nhóm & Điểm Danh QR (`MultiWorker`)**:
   - `joinMultiWorkerGig()`: Thành viên tham gia ca làm việc.
   - `checkInMultiWorker()`: Quét mã QR / Token xác thực điểm danh tại hiện trường.
   - `payoutMultiWorkers()`: Hệ thống chia đều thù lao tự động (Split Payout) về thẳng ví cá nhân từng người, hoàn tiền suất trống về ví chủ việc.
5. **Chính Sách Hủy Đơn & Bồi Thường**:
   - Trong 10 phút đầu nhận việc: Hủy miễn phí, hoàn 100% tiền cọc.
   - Sau 10 phút: Trừ phí bồi thường thợ công di chuyển và trừ điểm Trust Score của người hủy đơn.

---

## 7. BẢNG TRA CỨU NHANH CÁC HÀM CỐT LÕI TRONG `GigMeContext.tsx`

Khi thực hiện tính năng mới, AI **không cần đọc 7000 dòng file `GigMeContext.tsx`**, chỉ cần tham chiếu bảng sau:

| Tên Hàm / State | Tham số chính | Mô tả chức năng |
| :--- | :--- | :--- |
| `startVoipCall` | `(partnerName, role?, gigId?, isVideo?, partnerAvatarUrl?, partnerId?)` | Khởi tạo cuộc gọi thoại hoặc video WebRTC, kích hoạt chuông đi. |
| `acceptIncomingCall` | `()` | Nhấc máy cuộc gọi đến, kết nối luồng đàm thoại WebRTC. |
| `endVoipCall` | `()` | Cúp máy, dừng chuông, tự động ghi thẻ `CALL_LOG` vào khung chat. |
| `toggleMuteVoip` | `()` | Bật / tắt micro và đồng bộ sang đối phương. |
| `toggleVideoVoip` | `()` | Bật / tắt camera và đồng bộ sang đối phương. |
| `toggleMinimizeVoip` | `()` | Thu nhỏ cuộc gọi thành Floating Mini Bubble / Phóng to toàn màn hình. |
| `flipCameraVoip` | `()` | Lật camera trước / sau thời gian thực qua `replaceTrack`. |
| `switchVoipToVideo` | `()` | Nâng cấp cuộc gọi thoại thành Video HD trực tiếp. |
| `sendChat` | `(text, attachmentType?, data?, duration?, fileName?, threadId?, partnerId?, partnerName?)` | Gửi tin nhắn chat, hỗ trợ Text, Ảnh, Voice, Video, Call Log. |
| `reactToChatMessage` | `(messageId, emoji)` | Thả cảm xúc Messenger (👍, ❤️, 😂, 😮, 😢, 😡) toggle 2 chiều. |
| `recallChatMessage` | `(messageId)` | Thu hồi tin nhắn trong vòng 24h. |
| `togglePinChatMessage` | `(messageId)` | Ghim / Bỏ ghim tin nhắn quan trọng trong cuộc trò chuyện. |
| `depositVietQr` | `(amount, bankName)` | Nạp tiền vào ví qua VietQR Động kèm kiểm tra hạn mức & cooldown. |
| `withdrawToBank` | `(bankName, accNum, holderName, amount, pin?, useBiometrics?)` | Rút tiền ngân hàng Napas 24/7 kèm kiểm tra điều kiện an toàn & KYC. |
| `releaseEscrowPayout` | `(gigId, pin?, tipAmount?, useBiometrics?)` | Duyệt nghiệm thu, giải ngân tiền cọc Escrow cho thợ. |
| `submitProofOfWork` | `(gigId, note, isWatermarked?, proofData?)` | Thợ nộp ảnh nghiệm thu Watermark GPS & giờ giấc. |
| `showNotification` | `(title, message, isDingSound?, isCelebration?, titleEn?, messageEn?)` | Bật banner thông báo trong app (kèm âm thanh / pháo hoa). |

---

## 8. HỆ THỐNG THIẾT KẾ & BẢNG MÀU THƯƠNG HIỆU (DESIGN SYSTEM)

- **Quy Tắc Tỉ Lệ Màu Thương Hiệu (Brand Palette Ratios)**:
  - **60% Dominant (Màu chủ đạo)**: Cobalt Blue (`#3064AE`) - Header, nút hành động chính, card viền neon.
  - **30% Secondary (Màu bổ trợ)**: Crystal Blue (`#C5E5EC`) - Text phụ, border nhạt, icon phụ, badge.
  - **10% Accent (Màu điểm nhấn)**: Ethereal Green (`#E0FAEB`) - Trạng thái online, nạp tiền thành công, điểm uy tín.
- **Giao Diện Tối Mặc Định (Default Cyber Dark)**:
  - Nền trang web: `#0C1728` hoặc `#0E1B2E`.
  - Mọi thành phần hiển thị ở chế độ Dark Mode chuẩn Cyber Campus.
- **Thiết Kế Di Động & Vùng An Toàn**:
  - Bản đồ Leaflet luôn có `tap: false`, `touchZoom: true`, `scrollWheelZoom: false`.
  - Thanh BottomNav chân trang hỗ trợ `pb-safe` và `env(safe-area-inset-bottom)` cho iPhone và Android tràn viền.
  - Anti-slop: Không dùng pill button lố bịch, tuân thủ độ phân cấp thị giác rõ ràng.

---

## 9. BẢN ĐỒ TOÀN BỘ CÁC TỆP TIN DỰ ÁN (FULL ARCHITECTURE REPOSITORY MAP)

Dưới đây là mục lục tra cứu toàn diện 100% tất cả các tệp tin trong hệ thống GigMe. Mọi phiên AI Studio tiếp theo chỉ cần đối chiếu phần này để nắm rõ chức năng, luồng nghiệp vụ và mối quan hệ giữa các file mà không cần mở đọc từng file:

### 9.1. Kiến Trúc Lõi, Khởi Động & Kiểu Dữ Liệu
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/App.tsx` | Khung điều phối trung tâm của Single Page Application: Quản lý tab navigation (`BottomNav` 5 tab: 'home', 'campus_market', 'chat', 'wallet', 'profile'), lazy loading (Code-Splitting) các màn hình và modal, xử lý modal bảo trì hệ thống toàn cục, gắn `VoipCallOverlay` thường trực trên cùng. |
| `/src/main.tsx` | Điểm khởi chạy (Entry point) React 18, mount component `App` vào `#root` DOM, thiết lập Dark Mode mặc định và đăng ký PWA Service Worker. |
| `/src/types.ts` | Trung tâm định nghĩa kiểu dữ liệu TypeScript toàn ứng dụng: Model `User`, `Gig`, `Transaction`, `VoipCallSession`, `VoipCallEntity`, `ChatMessage`, `DisputeTicket`, các Enums trạng thái Escrow, KYC và quyền hạn. |
| `/src/index.css` | Tệp CSS toàn cục (Tailwind CSS v4): Khai báo bảng màu Cyber Dark, biến CSS phong cách neon, cấu hình animation sóng âm, ringtone, thanh cuộn tùy chỉnh và vùng an toàn `env(safe-area-inset-bottom)`. |

### 9.2. Bộ Quản Lý Trạng Thái Toàn Cục (Contexts)
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/context/GigMeContext.tsx` | "Trái tim" Provider toàn cục của ứng dụng: Quản trị phiên Auth, nạp rút tiền Napas/VietQR, khóa/giải ngân Escrow, logic báo hiệu cuộc gọi VoIP WebRTC P2P, tin nhắn chat 1-1, kiểm duyệt KYC, chống gian lận Mock GPS và đồng bộ offline. |
| `/src/context/LanguageContext.tsx` | Quản lý đa ngôn ngữ Song ngữ Việt - Anh (`vi` / `en`), lưu lựa chọn ngôn ngữ vào `localStorage('gigme_lang')`, cung cấp hook `useLanguage` cho toàn bộ giao diện. |

### 9.3. Toàn Bộ Các Màn Hình Ứng Dụng (`/src/screens/`)
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/screens/HomeScreen.tsx` | Trang chủ chính: Thanh tìm kiếm việc làm Campus, phân loại danh mục dịch vụ, danh sách Gig nhận việc có bộ lọc giá/khoảng cách, nút chuyển đổi sang bản đồ Radar định vị GPS. |
| `/src/screens/ChatSupportScreen.tsx` | Khung nhắn tin thời gian thực 1-1: Phân tách thread ID chuẩn `direct_userA_userB`, bộ lọc chống lách sàn `detectAndFilterOffPlatformLeakage`, gọi điện thoại & video 1-chạm từ header, hiển thị thẻ Call Log lịch sử cuộc gọi. |
| `/src/screens/WalletScreen.tsx` | Ví điện tử sinh viên: Nạp tiền VietQR động, rút tiền ngân hàng Napas 24/7 (kiểm tra AML 1h, cooldown 15p, hạn mức rút 3 triệu/lần), thống kê thu nhập và lịch sử biến động số dư. |
| `/src/screens/CampusMarketplaceScreen.tsx` | Chợ sinh viên Campus: Đăng bán, mua lại giáo trình cũ, xe đạp, đồ dùng ký túc xá, trao đổi đồ giữa các sinh viên cùng trường. |
| `/src/screens/CreateGigScreen.tsx` | Giao diện đăng việc mới: Nhập tiêu đề, thù lao, hạn chót, địa chỉ khuôn viên trường, phân loại đơn cá nhân hoặc tuyển đội ngũ làm chung (MultiWorker), khóa ký quỹ Escrow. |
| `/src/screens/GigDetailScreen.tsx` | Màn hình chi tiết công việc: Nhận đơn việc, thợ nộp ảnh minh chứng có tọa độ GPS & thời gian, khách duyệt nghiệm thu giải ngân, chấm sao đánh giá và mở tranh chấp. |
| `/src/screens/ProfileScreen.tsx` | Trang cá nhân người dùng: Thông tin MSSV, trường đại học, thẻ sinh viên, điểm tín nhiệm Trust Score, huy hiệu KYC CCCD & Edu Email, quản lý công việc đã đăng và đã làm. |
| `/src/screens/AdminDashboardScreen.tsx` | Trung tâm điều hành tối cao của Root Admin (`000000000`) và Moderators: Quản lý người dùng, duyệt/từ chối KYC căn cước, phân xử khiếu nại tranh chấp cọc Escrow, điều khiển bảo trì hệ thống. |
| `/src/screens/AuthScreen.tsx` | Đăng nhập & Đăng ký tài khoản sinh viên bằng ID 9 số hoặc Email, chọn trường đại học, xác thực mật khẩu. |
| `/src/screens/AccountLockedScreen.tsx` | Màn hình chặn khi tài khoản bị khóa do vi phạm điều khoản, hành vi gian lận Sybil hoặc spam, cung cấp kênh khiếu nại tới Admin. |
| `/src/screens/EmailVerificationScreen.tsx` | Màn hình nhập mã xác thực OTP gửi qua hòm thư sinh viên `.edu.vn` để nhận huy hiệu sinh viên xác thực. |
| `/src/screens/CampusLawScreen.tsx` | Cẩm nang pháp lý sinh viên: Hướng dẫn quyền lợi lao động, mẫu hợp đồng thời vụ, quy tắc an toàn và cảnh báo bẫy lừa đảo việc làm ngoài trường. |
| `/src/screens/SettingsScreen.tsx` | Cài đặt tài khoản: Đổi mật khẩu, đổi mã PIN giao dịch, kích hoạt sinh trắc học, cài đặt thông báo đẩy FCM, chuyển đổi ngôn ngữ. |

### 9.4. Toàn Bộ Các Thành Phần Giao Diện & Modal (`/src/components/`)
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/components/VoipCallOverlay.tsx` | Lớp phủ đàm thoại WebRTC P2P thoại & video: Picture-in-Picture 2 cấp độ (thu nhỏ floating bubble & native PiP trình duyệt để tự do chuyển tab), lật camera trước/sau, visualizer sóng âm, đo vạch sóng tín hiệu, đồng hồ đếm giờ thời gian thực. |
| `/src/components/Header.tsx` | Header cố định đầu trang: Logo thương hiệu GigMe, chuông thông báo, số dư ví xem nhanh, avatar profile và nút chuyển đổi ngôn ngữ Việt - Anh. |
| `/src/components/BottomNav.tsx` | Thanh điều hướng chân trang 5 tab chính, tối ưu hóa vùng cảm ứng và hỗ trợ vùng an toàn cho màn hình di động tràn viền. |
| `/src/components/InteractiveRadar.tsx` | Bản đồ Radar GPS Leaflet: Định vị người dùng và vẽ các điểm công việc lân cận khuôn viên trường đại học, chống bắt nhầm cử chỉ vuốt bản đồ. |
| `/src/components/AdvancedDialogs.tsx` | Bộ ba modal xác thực nâng cao: Quét NFC thẻ CCCD gắn chip giả lập, nhận diện khuôn mặt sinh trắc học Liveness Detection, và SSO trường đại học. |
| `/src/components/AdminMaintenanceModal.tsx` | Modal điều khiển bảo trì dành riêng cho Admin: Cấu hình thông điệp bảo trì, thời gian dự kiến hoàn thành và mật mã mở khóa khẩn cấp. |
| `/src/components/AppleGooglePayModal.tsx` | Modal nạp tiền siêu tốc tích hợp giao thức Apple Pay và Google Pay. |
| `/src/components/AvatarPickerModal.tsx` | Modal chọn avatar sinh viên từ bộ sưu tập hoạt họa Cyber Campus hoặc tải ảnh từ thư viện thiết bị. |
| `/src/components/BirthDatePickerModal.tsx` | Bộ chọn ngày/tháng/năm sinh tối ưu giao diện di động cho biểu mẫu đăng ký và KYC CCCD. |
| `/src/components/BlockchainProofModal.tsx` | Modal kiểm tra mã băm SHA-256 xác thực hợp đồng lao động và chứng từ thanh toán Escrow trên sổ cái minh bạch. |
| `/src/components/DoubleBlindReviewModal.tsx` | Modal đánh giá chất lượng hai chiều ẩn danh (Double-Blind Review) giữa người thuê và người làm. |
| `/src/components/DownloadAppDialog.tsx` | Dialog tải trực tiếp tệp cài đặt Android APK (`GigMe-Student-v1.0.apk`) từ máy chủ `/downloads/`. |
| `/src/components/EduEmailVerificationModal.tsx` | Modal nhập mã OTP xác thực email đại học `.edu.vn`. |
| `/src/components/ErrorBoundary.tsx` | Vỏ bọc chặn lỗi React Runtime, bảo vệ ứng dụng không bị trắng trang khi gặp exception bất ngờ. |
| `/src/components/FcmPushNotificationModal.tsx` | Modal kích hoạt thông báo đẩy Web Push FCM trên trình duyệt và thiết bị di động. |
| `/src/components/FriendBackupRestoreModal.tsx` | Modal sao lưu và khôi phục danh bạ liên hệ thông qua chuỗi token mã hóa JSON. |
| `/src/components/GamificationBanner.tsx` | Banner thông báo chúc mừng nổi trong app (toast banner) kèm hiệu ứng pháo hoa confetti khi nhận tiền hoặc lên cấp. |
| `/src/components/GeminiTaskEstimatorModal.tsx` | Modal AI Gemini tự động ước tính khối lượng công việc và gợi ý mức thù lao hợp lý theo giờ làm. |
| `/src/components/GeminiVisionStudentIdModal.tsx` | Modal AI Gemini Vision OCR nhận diện tự động thẻ sinh viên (trích xuất họ tên, MSSV, khóa học). |
| `/src/components/GigCardSkeleton.tsx` | Khung xương placeholder skeleton hiển thị trong thời gian tải danh sách công việc. |
| `/src/components/JobCompletionVerificationModal.tsx` | Modal kiểm tra minh chứng hoàn thành công việc kèm đóng dấu tọa độ GPS và giờ chụp. |
| `/src/components/LateCancellationModal.tsx` | Modal xử lý hủy đơn muộn sau 10 phút, tự động trích tiền bồi thường di chuyển cho đối tác. |
| `/src/components/MoMoZaloPayGatewayModal.tsx` | Modal liên kết cổng thanh toán ví điện tử MoMo và ZaloPay. |
| `/src/components/MultiWorkerCheckInModal.tsx` | Modal quét mã QR / Token điểm danh thợ tại hiện trường cho các đơn việc nhóm đông người. |
| `/src/components/NotificationCenter.tsx` | Ngăn kéo trung tâm thông báo: Danh sách lịch sử thông báo hệ thống, thông báo đơn việc, biến động số dư. |
| `/src/components/OfflineGigsModal.tsx` | Modal danh sách các công việc đã được lưu vào bộ nhớ offline trên máy để thợ xem khi mất mạng. |
| `/src/components/OfflineIndicator.tsx` | Dải ruy-băng thông báo thiết bị đang ở chế độ ngoại tuyến (Offline Mode). |
| `/src/components/PullToRefresh.tsx` | Thành phần hỗ trợ cử chỉ vuốt kéo xuống từ đầu trang để tải lại dữ liệu mới nhất. |
| `/src/components/PWAInstallButton.tsx` | Nút bấm kích hoạt tiến trình cài đặt ứng dụng web PWA vào màn hình chính điện thoại. |
| `/src/components/ShareStoryModal.tsx` | Modal tạo thiệp thành tích công việc để chia sẻ lên Facebook, Zalo, Story. |
| `/src/components/SmartInstallBanner.tsx` | Banner thông minh gợi ý người dùng cài đặt PWA hoặc tải file APK cài đặt cho Android. |
| `/src/components/StudentEloModal.tsx` | Modal chi tiết hệ thống điểm Elo uy tín: Công thức tính điểm, danh hiệu thợ và quyền lợi cấp bậc. |
| `/src/components/SystemMaintenanceOverlay.tsx` | Lớp phủ khóa toàn bộ app hiển thị đồng hồ đếm ngược khi hệ thống đang trong phiên bảo trì kỹ thuật. |
| `/src/components/TermsAndRefundPolicyModal.tsx` | Modal chính sách bảo vệ quyền lợi sinh viên, điều khoản hoàn tiền ký quỹ Escrow và giải quyết tranh chấp. |
| `/src/components/TransactionHistoryTable.tsx` | Bảng kê chi tiết lịch sử giao dịch tiền vào, tiền ra, tiền giữ cọc và phí sàn. |
| `/src/components/VerifiedEduBadge.tsx` | Huy hiệu tích xanh chứng nhận sinh viên chính quy đã xác thực email trường. |
| `/src/components/VerifiedIdentityBadge.tsx` | Huy hiệu xác thực danh tính Căn cước công dân (KYC CCCD). |
| `/src/components/VietQrOpenApiAutoScanner.tsx` | Bộ quét QR tự động nhận diện mã VietQR chuẩn chuyển tiền liên ngân hàng Napas 24/7. |

### 9.5. Dịch Vụ Đám Mây & Kết Nối Backend (`/src/services/`, `/src/lib/`)
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/lib/firebase.ts` | Kết nối Cloud Firestore: Thiết lập cấu hình Firestore, các listeners thời gian thực cho `/calls`, `/gigs`, `/messages`, `/users`, `/transactions`. |
| `/src/services/firebase.ts` | Tầng dịch vụ giao tiếp cơ sở dữ liệu Firebase Firestore: Thao tác CRUD, đồng bộ realtime và xử lý lỗi mạng. |
| `/src/services/cloudSync.ts` | Bộ đồng bộ dữ liệu đám mây đa tầng: Đồng bộ 2 chiều giữa LocalStorage, IndexedDB và Cloud Firestore khi online/offline. |
| `/src/services/napasDisbursementService.ts` | Dịch vụ mô phỏng giải ngân Napas 24/7: Chuyển khoản tức thì về số tài khoản ngân hàng sinh viên khi duyệt lệnh rút tiền. |

### 9.6. Tiện Ích Thuật Toán, Dữ Liệu & Hooks (`/src/utils/`, `/src/hooks/`, `/src/data/`)
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/src/utils/audio.ts` | Bộ tổng hợp Web Audio API: Phát chuông melodic lặp cuộc gọi đến/đi (`startRingtone`, `stopRingtone`), tiếng Ting Ting nạp tiền Napas, tiếng cúp máy. |
| `/src/utils/antiFakeGps.ts` | Thuật toán đối chiếu khoảng cách và phát hiện tọa độ GPS giả mạo (Fake GPS) khi thợ gửi minh chứng hoàn thành. |
| `/src/utils/checksumC06.ts` | Thuật toán kiểm tra tính hợp lệ và cấu trúc số Căn cước công dân (CCCD 12 số) theo chuẩn C06 Bộ Công An. |
| `/src/utils/geo.ts` | Công thức lượng giác Haversine tính toán khoảng cách km giữa người tìm việc và địa điểm làm việc. |
| `/src/utils/haptics.ts` | Kích hoạt hiệu ứng rung phản hồi xúc giác (`navigator.vibrate`) trên điện thoại di động khi chuông reo hoặc thao tác thành công. |
| `/src/utils/i18n.ts` | Bộ từ điển chuyển đổi ngôn ngữ Anh - Việt cho toàn bộ từ khóa và câu thông báo trong ứng dụng. |
| `/src/utils/imageCompressor.ts` | Thuật toán nén ảnh Canvas phía client trước khi tải lên, giảm 80% dung lượng ảnh mà vẫn giữ rõ nét văn bản. |
| `/src/utils/mockGpsDetector.ts` | Bổ trợ phát hiện dấu hiệu ứng dụng Mock Provider can thiệp vị trí trên thiết bị Android. |
| `/src/utils/offlineCache.ts` | Bộ nhớ đệm ngoại tuyến sử dụng IndexedDB và LocalStorage lưu trữ danh sách việc làm và tin nhắn. |
| `/src/utils/offlineSync.ts` | Tiến trình chạy nền tự động gửi các hành động chờ lên máy chủ ngay khi phát hiện có mạng trở lại. |
| `/src/utils/rateLimiter.ts` | Bộ đệm kiểm soát tần suất gửi tin nhắn chat, nhập mã PIN và yêu cầu rút tiền để ngăn chặn spam/brute-force. |
| `/src/utils/securityTokens.ts` | Tiện ích sinh mã bảo mật một lần TOTP, mã hóa token điểm danh đơn việc nhóm MultiWorker. |
| `/src/utils/shareUtils.ts` | Tiện ích chia sẻ liên kết công việc qua Web Share API hoặc sao chép nhanh vào khay nhớ tạm. |
| `/src/utils/surgePricing.ts` | Thuật toán tính hệ số phụ cấp thù lao tăng thêm khi công việc rơi vào khung giờ đêm muộn, thời tiết xấu hoặc khẩn cấp. |
| `/src/utils/sybilDetector.ts` | Thuật toán phát hiện tấn công Sybil: Phát hiện đăng ký hàng loạt hoặc một người tự tạo đơn rồi tự nhận để gian lận tiền thưởng. |
| `/src/hooks/usePWAInstall.ts` | Custom React Hook bắt sự kiện `beforeinstallprompt` để kích hoạt popup mời người dùng cài app PWA. |
| `/src/data/campusLawData.ts` | Cơ sở dữ liệu tĩnh chứa các bài viết cẩm nang pháp lý sinh viên, quy định làm thêm và mẫu hợp đồng thời vụ. |

### 9.7. Tệp Tin Cấu Hình Hạ Tầng & Máy Chủ Gốc
| Tệp tin | Vai trò chi tiết & Nhiệm vụ trong hệ thống |
| :--- | :--- |
| `/server.ts` | Máy chủ Express Node.js: Phục vụ ứng dụng SPA trên cổng 3000, cung cấp endpoint tải APK (`/downloads/`), proxy kiểm duyệt ảnh Sightengine, webhook MO SMS xác thực số điện thoại. |
| `/firestore.rules` | Bộ quy tắc bảo mật Cloud Firestore: Phân quyền vai trò người dùng, bảo vệ an toàn tuyệt đối các collection tài chính, cuộc gọi và tin nhắn. |
| `/firebase-applet-config.json` | Cấu hình định danh dự án Firebase Cloud Firestore kết nối với AI Studio. |
| `/firebase-blueprint.json` | Sơ đồ cấu trúc lược đồ Firestore cho các collection `/users`, `/gigs`, `/calls`, `/messages`, `/transactions`. |
| `/index.html` | Entry point HTML: Chứa script vá an toàn fetch property, cô lập lỗi Vite HMR websocket, ép buộc giao diện Dark Mode Cyber 100%. |
| `/package.json` | Khai báo các gói thư viện npm và các lệnh thực thi hệ thống (`build`, `lint`, `dev`, `start`). |
| `/vite.config.ts` | Cấu hình Vite bundler: Cấu hình plugin React, PWA, Tailwind CSS và port 3000. |
| `/public/manifest.json` | Cấu hình Web App Manifest chuẩn PWA: Khai báo icon, tên ứng dụng GigMe, màu chủ đề và chế độ hiển thị standalone. |
| `/public/sw.js` | Service Worker quản lý bộ nhớ đệm cache PWA và hỗ trợ vận hành offline. |
| `/AGENTS.md` | Sổ tay kỹ thuật duy nhất cho toàn bộ hệ sinh thái AI Studio: Chứa toàn bộ thông tin đăng nhập admin, quy tắc bất biến, hướng dẫn VoIP, và bản đồ toàn bộ dự án. |

---

## 10. CHECKLIST TIẾP NHẬN CÔNG VIỆC DÀNH CHO AI MỚI

Khi bạn (AI Studio Agent) nhận được bất kỳ yêu cầu mới nào từ người dùng:
1. **Đọc AGENTS.md này trước tiên**: Bạn đã có đầy đủ danh sách credentials, hàm tiện ích, cấu trúc dữ liệu, và quy tắc nghiệp vụ mà không cần mở đọc từng file lớn.
2. **Tuyệt đối tuân thủ quy tắc bất biến**: Không phục hồi BXH Top, Vay tiền, SafeWalk. Giữ nguyên hạn mức nạp/rút tiền. Giữ tài khoản 0 đánh giá là 0 sao.
3. **Thực hiện chỉnh sửa tập trung & tối giản**: Không làm hỏng tính năng hoạt động offline/local song song với cloud Firestore.
4. **Kiểm thử bắt buộc trước khi trả lời**:
   - Chạy `lint_applet` để xác nhận không có lỗi cú pháp TypeScript (`tsc --noEmit`).
   - Chạy `compile_applet` để xác nhận build thành công.
   - Bàn giao kết quả ngắn gọn, rõ ràng, tập trung vào giá trị mang lại cho người dùng.
