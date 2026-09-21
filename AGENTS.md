# GIGME - HỒ SƠ DỰ ÁN TOÀN DIỆN & HƯỚNG DẪN HỆ THỐNG (AGENTS.MD)

> **TẬP TIN CHỈ DẪN DUY NHẤT DÀNH CHO AI STUDIO & DEVELOPER (MULTI-ACCOUNT & MULTI-REPO READY)**
> Tập tin này được Google AI Studio tự động nạp vào bộ nhớ hệ thống (System Prompt) cho mọi phiên làm việc mới. Dù bạn chuyển đổi qua tài khoản Google khác, dùng repo/fork khác, hoặc hết token mở session mới, AI sẽ nắm bắt 100% thông tin kỹ thuật, kiến trúc và quy tắc để tiếp tục công việc ngay lập tức mà không bao giờ gặp lỗi hay xung đột.

---

## 1. NGUYÊN TẮC ĐA TÀI KHOẢN (MULTI-ACCOUNT) & ĐA REPO (MULTI-REPO)

1. **Độc lập kho mã nguồn (Repo-Agnostic & Portability)**:
   - Dự án có thể được fork, clone hoặc import dưới nhiều tên repository khác nhau (ví dụ: `vnlandserver-netizen/gigme3`, `gigme4`, `gigme-dev`, `gigme-main`...).
   - **Tuyệt đối không hardcode tên repo hoặc domain cố định** trong mã nguồn xử lý logic. Mọi điều hướng nội bộ, API endpoint và asset download phải sử dụng đường dẫn tương đối (`/api/...`, `/downloads/...`) và `window.location.origin`.
2. **Cơ chế Fallback Cơ sở dữ liệu thông minh (Firestore & Local Hybrid)**:
   - Cấu hình Firebase mặc định nằm tại `/firebase-applet-config.json` (Project: `gen-lang-client-0729535805`, Firestore DB: `ai-studio-gigme1-c6834680-edff-46fb-b8b2-1aeee555726a`).
   - Khi import vào một tài khoản Google mới chưa liên kết Firestore này: Hệ thống tự động fallback mượt mà sang cơ chế LocalStorage + IndexedDB (`data/db.json` và `cloudSync.ts`) mà không làm ứng dụng bị lỗi, crash hay trắng màn hình.
   - Khi tài khoản mới kích hoạt Firebase mới qua `set_up_firebase`, ứng dụng tự động nhận diện cấu hình trong `firebase-applet-config.json`.
3. **Tài khoản Master Quản trị viên (Root Admin) đồng nhất trên mọi Repo / Mọi Account**:
   - Dù ở bất kỳ tài khoản hay repo nào, tài khoản Quản trị viên tối cao luôn cố định và sẵn sàng:
     - **ID 9 số**: `000000000`
     - **Email**: `admin@admin.vn`
     - **Số điện thoại**: `0909120918`
     - **Mật khẩu**: `admin1507`
   - Đảm bảo người dùng luôn có thể đăng nhập ngay vào Trung Tâm Điều Hành Quản Trị trên bất kỳ bản sao/instance nào.
4. **Email Chủ sở hữu (Owner/Developer Email)**:
   - Email chính: `vnlandserver@gmail.com` (và các tài khoản liên kết thuộc quyền sở hữu của user).

---

## 2. THÔNG TIN MÔI TRƯỜNG & HẠ TẦNG KỸ THUẬT

- **Nền tảng**: Full-stack React 18 + Express Server chạy trong môi trường container Cloud Run của AI Studio.
- **Cổng kết nối (PORT)**: Cổng `3000` (Cố định bởi hạ tầng Nginx reverse proxy của AI Studio).
- **Ngôn ngữ & Thư viện UI**: TypeScript, Tailwind CSS, Lucide Icons (`lucide-react`), Leaflet (`leaflet`).
- **Lệnh Build sản xuất**:
  ```bash
  npm run build
  # Thực thi: vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
  ```
- **Lệnh khởi chạy**:
  ```bash
  npm start
  # Thực thi: node dist/server.cjs
  ```

---

## 3. CÁC NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%)

### 3.1. Các tính năng ĐÃ XÓA VĨNH VIỄN (Nghiêm cấm tự ý khôi phục)
1. **Bảng Xếp Hạng Top (Campus Leaderboard)**: Đã xóa hoàn toàn màn hình, nút bấm, tab và liên kết theo yêu cầu chủ dự án.
2. **Tính năng Vay tiền & Xác thực Vay**: Đã xóa hoàn toàn module vay vốn sinh viên, cam kết trả chậm và KYC vay tiền. Ứng dụng chỉ vận hành theo cơ chế nạp tiền làm dịch vụ, nhận thù lao và thanh toán ký quỹ Escrow bảo đảm.

### 3.2. Quy định Nạp tiền (Deposit Rules)
- **Tối đa mỗi lần nạp**: `10.000.000 VNĐ (10 triệu)`.
- **Thời gian giãn cách (Cooldown)**: Sau mỗi lần nạp, phải chờ **tối thiểu 1 giờ** (60 phút) mới được thực hiện lần nạp tiếp theo.
- **Hạn mức tối đa mỗi ngày**: Không quá `30.000.000 VNĐ (30 triệu)` / ngày.
- Quản lý tập trung trong `checkDepositEligibility()` tại `src/context/GigMeContext.tsx`.

### 3.3. Quy tắc Đánh giá Tài khoản Mới
- Tài khoản mới tạo hoặc có **0 lượt đánh giá** thì phải hiển thị **0 sao (0.0 ★ / 0 đánh giá)**. Tuyệt đối không được gán mặc định là 5/5 sao.

### 3.4. Hệ thống Chat & Bảo mật Tin nhắn 1-1
- **Cô lập luồng chat 1-1**: Bắt buộc tạo `threadId` xác định bằng hàm:
  ```ts
  const getDirectThreadId = (idA: string, idB: string) => ['direct', ...[idA, idB].sort()].join('_');
  ```
  Ngăn chặn triệt để tình trạng người khác thấy tin nhắn của nhau.
- **Nút "Thêm bạn" (Add Friend)**:
  - Nút "Thêm bạn" nằm trực tiếp trên Header của `ChatSupportScreen.tsx`.
  - Khung **"ID 9 Số Của Bạn"**, ô tìm kiếm ID 9 số, sao lưu danh bạ và điều khoản hoàn tiền **chỉ hiển thị khi bấm nút "Thêm bạn"** (qua modal `showAddFriendModal`), không để lộ tràn lan làm rối giao diện.
  - Khi click vào bất kỳ người dùng nào trong danh bạ / danh sách Đang Online, hàm `handleSelectContact()` luôn kích hoạt mở chính xác phòng chat riêng của người đó.

### 3.5. Cơ chế Xác thực & Giữ Phiên Đăng nhập (Session Persistence)
- Quản trị viên (`000000000`) khi đăng nhập được lưu cờ trong cả `sessionStorage` (`gigme_admin_active_session = 'true'`) và `localStorage` (`CURRENT_USER_ID = '000000000'`). Khi tải lại trang (F5/Refresh) không được tự động xóa quyền Admin.
- Người dùng thật được tự động duy trì đăng nhập qua `localStorage`. Hệ thống chỉ lọc bỏ các tài khoản mẫu mock/demo cũ không có thật.

### 3.6. Cử chỉ Cảm ứng Di động & Co giãn Đa Màn hình (Mobile & Responsive)
- **Bản đồ Leaflet (`InteractiveRadar.tsx`)**:
  - Luôn khởi tạo với `tap: false` (loại bỏ cơ chế mô phỏng tap 300ms gây lỗi vuốt trên màn hình cảm ứng điện thoại).
  - Tích hợp `ResizeObserver` trên container bản đồ để tự động gọi `map.invalidateSize()` khi xoay màn hình hoặc co giãn viewport.
  - Cấu hình `touchZoom: true`, `scrollWheelZoom: false` để người dùng vuốt cuộn dọc trang mượt mà không bị "kẹt" tay vào bản đồ.
- **Cuộn ngang (Horizontal Carousels)**: Áp dụng `touch-pan-x`, `overscroll-x-contain` và thanh trượt quán tính.
- **Vùng an toàn (Safe Area Insets)**: Thanh điều hướng dưới (`BottomNav.tsx`) hỗ trợ `pb-safe` và `max(0.5rem, env(safe-area-inset-bottom, 0px))` để không bị cấn phím điều hướng Home trên iPhone và điện thoại Android tràn viền.

### 3.7. Tải File Cài đặt Ứng dụng (APK Download)
- Backend Express hỗ trợ đa endpoint:
  - `/api/download/gigme.apk`
  - `/downloads/Gigme.apk`
  - `/downloads/GigMe-Student-v1.0.apk`
- Header: `Content-Type: application/vnd.android.package-archive`, `Content-Disposition: attachment; filename="Gigme.apk"`.
- Giao diện `DownloadAppDialog.tsx`:
  - Nút tải trực tiếp qua thẻ `<a download>` kết hợp `window.location.assign`.
  - Link dự phòng (Mirror).
  - Hướng dẫn rõ ràng cách xử lý khi mở link trong trình duyệt nhúng của **Zalo / Facebook / Messenger** (hướng dẫn bấm 3 chấm `⋮` chọn "Mở bằng trình duyệt Chrome/Safari" để không bị chặn tải APK).

### 3.8. Thông Báo Đẩy Màn Hình Khóa (Lock Screen Web Push Notification)
- Tận dụng chuẩn PWA Service Worker (`/public/sw.js`) và `navigator.serviceWorker.ready -> showNotification(...)`:
  - Cho phép đẩy thông báo kèm rung chuông haptic (`vibrate: [200, 100, 200, 100, 200]`) ra trực tiếp **Màn hình khóa (Lock Screen)** trên điện thoại Android, iOS (PWA), và PC ngay cả khi màn hình đang tắt hoặc ứng dụng đang ở dưới nền.
  - Tích hợp tính năng đếm ngược 3 giây trong `FcmPushNotificationModal.tsx` để người dùng kiểm thử khóa máy thực tế.
  - Khi người dùng chạm vào thông báo trên màn hình khóa: Service Worker tự động kích hoạt chuyển hướng vào đúng giao diện công việc hoặc chat.

### 3.9. Tối Ưu Tốc Độ Mở Ứng Dụng (Code-Splitting & Lazy Loading)
- Phân mảnh bundle siêu tốc qua Rollup `manualChunks` (`vendor-react`, `vendor-leaflet`, `vendor-lucide`...).
- Lazy loading toàn bộ các màn hình thứ cấp (`CreateGigScreen`, `WalletScreen`, `ProfileScreen`, `CampusMarketplaceScreen`, `ChatSupportScreen`, `AdminDashboardScreen`) và toàn bộ các hộp thoại modal qua `React.lazy` và `Suspense`.
- Tách riêng thư viện bản đồ Leaflet nặng ký (`InteractiveRadar`) ra khỏi luồng tải chính của `HomeScreen`, giúp thời gian phản hồi giao diện đầu tiên (FCP) giảm xuống chỉ còn vài mili-giây.

---


## 4. BẢN ĐỒ CÁC TỆP TIN TRỌNG YẾU TRONG DỰ ÁN

| Đường dẫn tệp tin | Vai trò chính |
| :--- | :--- |
| `/src/context/GigMeContext.tsx` | State Provider toàn cục: Auth, nạp rút tiền, quy tắc hạn mức, chat, thông báo, KYC, bảo trì hệ thống. |
| `/src/screens/ChatSupportScreen.tsx` | Màn hình tin nhắn thời gian thực, danh bạ Campus, modal "Thêm bạn", tìm kiếm ID 9 số. |
| `/src/screens/HomeScreen.tsx` | Trang chủ: Thanh tiện ích nhanh, danh mục công việc, danh sách Gig nhận việc, bộ lọc. |
| `/src/screens/WalletScreen.tsx` | Ví điện tử sinh viên: Nạp VietQR, Cooldown 1h, rút tiền ngân hàng, biến động số dư. |
| `/src/screens/AdminMasterDashboard.tsx` | Trung tâm điều hành tối cao của Admin `000000000`: Quản lý người dùng, duyệt KYC, phân xử tranh chấp. |
| `/src/components/InteractiveRadar.tsx` | Bản đồ Radar định vị GPS thực tế Leaflet, bắt việc lân cận, chống bắt nhầm cử chỉ vuốt. |
| `/src/components/DownloadAppDialog.tsx` | Hộp thoại tải tệp cài đặt `Gigme.apk`, link dự phòng và hướng dẫn vượt chặn webview Zalo. |
| `/src/components/BottomNav.tsx` | Thanh điều hướng tab chân trang, tối ưu cho màn hình cảm ứng di động và safe area. |
| `/server.ts` | Máy chủ Express: Endpoint tải APK, xác thực bảo mật, webhook MO SMS xác thực số điện thoại. |
| `/AGENTS.md` | Tập tin chỉ dẫn duy nhất cho toàn bộ hệ thống AI Studio và các session tiếp nối. |

---

## 5. QUY TRÌNH TIẾP NHẬN CÔNG VIỆC DÀNH CHO AI MỚI

Khi bạn (AI Studio Agent) nhận được yêu cầu mới từ người dùng:
1. **Kiểm tra quy tắc bất di bất dịch**: Tuyệt đối không phục hồi BXH Top, không phục hồi Vay tiền. Tuân thủ hạn mức nạp 10m/1h/30m, tài khoản 0 đánh giá là 0 sao.
2. **Không phá vỡ tính tương thích đa repo**: Giữ nguyên tính năng hoạt động offline/local song song với cloud Firestore.
3. **Thực hiện chỉnh sửa tối giản & chính xác**: Sử dụng `view_file` trước khi `edit_file`.
4. **Kiểm thử bắt buộc trước khi bàn giao**:
   - Chạy `lint_applet` để kiểm tra lỗi cú pháp TypeScript.
   - Chạy `compile_applet` để đảm bảo hệ thống build thành công.
   - Không xuất hiện bất kỳ cảnh báo đỏ hay lỗi build nào.
