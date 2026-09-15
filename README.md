# GigMe - Siêu Nền Tảng Kết Nối Việc Làm Siêu Nhỏ & Smart Escrow

GigMe là ứng dụng kết nối việc làm siêu nhỏ & dịch vụ tức thì dành cho sinh viên và giới trẻ với cơ chế bảo vệ kép Smart Escrow chống bùng tiền, định vị Geofence quét radar thời gian thực, và trợ lý AI phân tích nhiệm vụ tự động.

## Tính Năng Cốt Lõi

1. **Smart Escrow Vault (Bảo Vệ Chống Quỵt Tiền)**
   - Khóa tiền cọc của người thuê vào quỹ ký quỹ an toàn khi tạo công việc.
   - Freelancer nộp bài nghiệm thu kèm Watermark chống đánh cắp trước khi giải ngân.
   - Giải ngân tức thì qua xác thực mã PIN 6 số hoặc sinh trắc học (Fingerprint/FaceID).
   - Cơ chế Trọng tài phân xử khiếu nại (Dispute) bảo vệ quyền lợi hai đầu.

2. **Khám Phá Việc Làm Bằng Radar Geofence Tương Tác**
   - Bản đồ radar canvas tương tác quét công việc trong bán kính 10m đến 10km.
   - Gợi ý công việc thông minh với AI Smart Match (độ tương thích >90%).
   - Tìm kiếm bằng giọng nói tiếng Việt (Voice Search).
   - Bộ lọc chi tiết theo mức thù lao, thời lượng siêu tốc (<15p), kèo ghép nhóm, và kèo định kỳ theo tuần.

3. **Đấu Giá Ngược (Reverse Auction) & Đăng Kèo 3 Bước Siêu Tốc**
   - Đấu giá ngược giúp tối ưu chi phí cho người thuê và tạo cơ hội cạnh tranh cho sinh viên.
   - Trợ lý camera AI tự động nhận diện bài tập, màn hình game, video bản thảo và gợi ý tiêu đề + định giá chuẩn.

4. **Định Danh Nhiều Cấp Độ (KYC Multi-Tier & SSO Sinh Viên)**
   - **Cấp 1 (Newbie):** Đăng nhập với số dư khởi đầu 0đ, trải nghiệm kèo siêu nhỏ.
   - **Cấp 2 (Verified Student):** Quét chip CCCD (NFC) & Xác thực khuôn mặt AI (Face Liveness), liên kết cổng đào tạo trường đại học (SSO ĐH Bách Khoa, ĐHQG...).
   - **Cấp 3 (VIP Pro):** Giảm phí sàn xuống 7%, ưu tiên quét radar hỏa tốc.

5. **Gói Cứu Trợ SOS 0% Lãi Suất Dành Cho Sinh Viên**
   - Hạn mức vay khẩn cấp lên đến 500.000đ giải ngân trong 5 giây vào ví Escrow.
   - Tự động hoàn trả dần từ thù lao các kèo tiếp theo không phụ phí.

6. **Bảo Mật Liên Lạc & Bảng Quản Trị Admin**
   - Cuộc gọi thoại mã hóa VoIP ẩn danh (che số điện thoại thực).
   - Bảng điều khiển Quản trị viên (Master Admin Console) tại `admin@admin.vn` kiểm toán quỹ Escrow và phán quyết tranh chấp.

## Khởi Chạy Ứng Dụng

```bash
# Cài đặt thư viện
npm install

# Khởi chạy dev server (Port 3000)
npm run dev

# Build sản phẩm
npm run build
```
