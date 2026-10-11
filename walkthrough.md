# Hướng Dẫn Kiểm Thử Toàn Diện Hệ Thống SelfStorage (Flows 3 - 7)

Tài liệu này hướng dẫn chi tiết quy trình kiểm thử từ đầu đến cuối (End-to-End Testing) cho các luồng nghiệp vụ từ **Flow 3 đến Flow 7** trên hệ thống **SelfStorage-FE** (kết nối cùng **SelfStorage-BE** trên nhánh `feature/mongodb-migration`).

---

## 🛠 0. Chuẩn Bị & Khởi Chạy Môi Trường

1. **Khởi chạy Backend (NestJS):**
   ```bash
   cd c:\Users\truon\OneDrive\Desktop\SelfStorage-BE
   npm run start:dev
   ```
   - API Server chạy tại: `http://localhost:5000`
   - Tài liệu Swagger API: `http://localhost:5000/api/docs`

2. **Khởi chạy Frontend (Next.js):**
   ```bash
   cd c:\Users\truon\OneDrive\Desktop\SelfStorage-FE
   npm run dev
   ```
   - Ứng dụng chạy tại: `http://localhost:3000`

3. **Các Cổng Truy Cập (Portals):**
   - **Cổng Khách Hàng (Customer Portal):** `http://localhost:3000/dashboard`
   - **Cổng Nhân Viên Cơ Sở (Staff Portal):** `http://localhost:3000/staff`
   - **Cổng Quản Trị & Vận Hành (Admin Portal):** `http://localhost:3000/admin`

---

## 🔐 Flow 3: Quản Lý Kho Đang Thuê (Rented Storage Unit Management Flow)

### Mục tiêu kiểm thử:
- Kiểm tra quản lý ổ khóa số thông minh (Smart Lock), xem mã PIN, đổi mã PIN cá nhân, cấp mã tạm thời cho khách (Guest Pass).
- Kiểm tra ký số điện tử hợp đồng thuê (`/contracts/:id/sign`) và xem văn bản hợp đồng.
- Quản lý danh mục lưu trữ đồ đạc (Stored Items) và lịch sử ra vào (Access Logs).

### Các bước thực hiện:

#### Bước 3.1: Quản lý Khóa Thông Minh Smart Lock
1. Truy cập: `http://localhost:3000/dashboard`
2. Chọn tab **Truy cập & Khóa thông minh** (Sidebar menu).
3. **Xem mã PIN chính:**
   - Mặc định mã PIN được che `••••••••`.
   - Bấm nút **Hiện mã (Eye icon)** để hiển thị mã PIN (VD: `883921`).
   - Bấm nút **Sao chép (Copy icon)**: Hệ thống hiển thị thông báo toast *Đã sao chép mã PIN vào bộ nhớ tạm*.
4. **Đổi mã PIN cá nhân (Customer Self-Service):**
   - Bấm nút **Đổi Mã PIN Cá Nhân**.
   - Hộp thoại hiện ra: Nhập mã PIN mới (4 - 8 chữ số, ví dụ `654321`) và nhập xác nhận mã PIN.
   - Bấm **Lưu Mã PIN**: Hệ thống gọi API `POST /contracts/:contractId/units/:unitId/smart-lock/change-pin` và hiển thị thông báo cập nhật thành công.
5. **Cấp mã cho khách tạm thời (Guest Pass):**
   - Bấm nút **+ Tạo mã mới** tại mục *Mã Khách Tạm Thời*.
   - Nhập tên người nhận (VD: "Shipper ViettelPost"), thời hạn hiệu lực và mục đích.
   - Bấm **Tạo mã**: Mã PIN ngẫu nhiên kèm thời hạn hiệu lực được sinh ra và đưa vào danh sách.

#### Bước 3.2: Ký số Hợp Đồng Điện Tử (Digital Contract Signing)
1. Trong Dashboard, chọn tab **Tài liệu & Hợp đồng**.
2. Xem danh sách hợp đồng thuê:
   - Hợp đồng chưa ký sẽ có huy hiệu màu vàng **Chờ ký số**.
   - Bấm **Xem nội dung**: Hộp thoại pháp lý hiển thị toàn bộ điều khoản sử dụng kho, quy định khóa số và xử lý quá hạn.
   - Bấm nút **Ký số ngay**: Hệ thống gọi API `PATCH /contracts/:id/sign`, chuyển trạng thái hợp đồng thành **Đã ký số điện tử** màu xanh lá.

---

## 💰 Flow 4: Quy Tắc Nghiệp Vụ, Quản Lý Biểu Phí & Doanh Thu (Business Rules & Revenue Monitoring Flow)

### Mục tiêu kiểm thử:
- Cấu hình chính sách giá, thời gian ân hạn, tiền cọc, chính sách hủy & hoàn tiền (`/operations/policies`).
- Cấu hình danh mục loại phí phụ thu (`/operations/fee-types`) và ghi nhận phụ thu phát sinh (`/operations/extra-charges`).
- Quản lý mã voucher/khuyến mãi (`/operations/discounts`).
- Theo dõi giao dịch thanh toán và đối soát Webhook SePay/VietQR tự động.

### Các bước thực hiện:

#### Bước 4.1: Kiểm tra Cổng Quản Lý Vận Hành (Business Operations)
1. Truy cập: `http://localhost:3000/admin?role=OPS` (hoặc mở `http://localhost:3000/admin` và chọn vai trò **Quản Lý Chuỗi Vận Hành - OPS** trên thanh header).
2. Kiểm tra 4 tab chức năng:
   - **Chính sách vận hành (Policies):**
     - Thay đổi thông số: Thời gian ân hạn trễ hạn (Grace Period), % Phạt trễ hạn mỗi ngày, % Tiền đặt cọc giữ chỗ.
     - Bấm **Lưu thay đổi chính sách** để đồng bộ với backend.
   - **Biểu phí & Phụ thu (Fee Types & Extra Charges):**
     - Xem danh mục phí: Phí vệ sinh kho, Phí quá giờ truy cập, Phí cấp lại thẻ từ RFID, Phí bảo hiểm.
     - Bấm **+ Thêm phụ phí mới** để ghi nhận khoản phát sinh cho một hợp đồng cụ thể.
   - **Mã voucher & Chiết khấu (Discounts):**
     - Xem danh sách mã khuyến mãi đang áp dụng (VD: `SUMMER2026`, `WELCOME10`).
     - Bấm **+ Tạo mã ưu đãi mới** để thêm chiến dịch giảm giá.
   - **Doanh thu & Cổng thanh toán (Revenue & Webhook):**
     - Xem tổng doanh thu hệ thống, doanh thu tiền thuê, tiền cọc và phụ phí.
     - Kiểm tra trạng thái kết nối Webhook SePay (Đối soát tự động giao dịch ngân hàng theo mã thanh toán).

#### Bước 4.2: Kiểm tra Phía Khách Hàng (Customer Billing)
1. Truy cập `http://localhost:3000/dashboard` → Chọn tab **Thanh toán & Hóa đơn**.
2. Kiểm tra bảng kê hóa đơn: Xem mã hóa đơn, nội dung tiền cọc giữ chỗ (Flow 1), tiền thuê bàn giao (Flow 2) và trạng thái thành công.

---

## 🏢 Flow 5: Quản Lý Cơ Sở Kho & Nhân Viên (Facility & Staff Management Flow)

### Mục tiêu kiểm thử:
- Sơ đồ mặt bằng ô kho 24/7 trực quan theo tầng & zone (`/facilities/:id/storage-layout`).
- Tỷ lệ lấp đầy (Occupancy Rate) thời gian thực và phân loại màu sắc trạng thái.
- Phân công công việc nhân viên cơ sở và tiếp nhận yêu cầu.

### Các bước thực hiện:

#### Bước 5.1: Sơ Đồ Mặt Bằng Kho Trực Quan (Storage Layout)
1. Truy cập: `http://localhost:3000/staff`
2. Chọn tab **Sơ đồ mặt bằng** trên Sidebar (hoặc truy cập `http://localhost:3000/admin?role=MANAGER` → chọn **Storage Layout**).
3. **Kiểm tra thông số tổng quan cơ sở:**
   - Xem tổng số ô kho, tỷ lệ lấp đầy (VD: 69.4%), số ô khả dụng, số ô đã giữ chỗ, số ô đang bảo trì.
4. **Tương tác chuyển tầng (Floor Switcher):**
   - Bấm chuyển giữa **Tầng 1** và **Tầng 2**.
   - Lưới ô kho thay đổi tức thì theo tầng được chọn.
5. **Bộ lọc trạng thái (Status Filter):**
   - Chọn lọc: *Trống khả dụng*, *Đang thuê*, *Đã đặt*, *Đang bảo trì*.
6. **Xem chi tiết ô kho (Unit Inspector):**
   - Bấm vào một ô kho bất kỳ (VD: `A-104` hoặc `A-101`).
   - Cột bên phải hiển thị đầy đủ: Kích thước, diện tích quy chuẩn, loại kho mát/tiêu chuẩn, trạng thái khóa thông minh, tên khách hàng đang thuê, số điện thoại và mã hợp đồng.

---

## ⏳ Flow 6: Gia Hạn Hợp Đồng & Xử Lý Quá Hạn (Storage Renewal & Overdue Handling Flow)

### Mục tiêu kiểm thử:
- Khách hàng yêu cầu gia hạn hợp đồng trực tuyến với chiết khấu kỳ hạn (`/renewals/request`).
- Nhân viên / Quản lý duyệt hoặc từ chối yêu cầu gia hạn (`/renewals/:id/approve`, `/reject`).
- Tự động quét hạn hợp đồng Cron Job (`/renewals/overdue/scan`).
- Tính phí phạt trễ hạn, khóa quyền truy cập mã PIN khi vi phạm và quy trình thu tiền phạt để khôi phục quyền truy cập (`/renewals/overdue/records/:id/resolve`, `/waive`).

### Các bước thực hiện:

#### Bước 6.1: Khách hàng gửi yêu cầu gia hạn
1. Tại `http://localhost:3000/dashboard`, chọn tab **Ô kho của tôi**.
2. Trên thẻ kho đang thuê, bấm nút **Gia hạn hợp đồng**.
3. Hộp thoại hiện ra:
   - Chọn kỳ hạn: **1 tháng** (chuẩn), **3 tháng** (-5%), **6 tháng** (-10%), **12 tháng** (-15%).
   - Kiểm tra tiền chiết khấu và tổng thanh toán mới tự động tính toán.
   - Chọn phương thức thanh toán (VietQR/VNPAY/Momo) và bấm **Xác nhận gia hạn**.
   - Hệ thống gọi API `POST /renewals/request` tạo yêu cầu gia hạn `PENDING`.

#### Bước 6.2: Nhân viên duyệt gia hạn hợp đồng
1. Truy cập `http://localhost:3000/staff` → Chọn tab **Gia hạn & Quá hạn** (hoặc `http://localhost:3000/admin?role=MANAGER` → chọn **Renewals & Quá hạn**).
2. Tại tab con **Yêu Cầu Gia Hạn**:
   - Xem danh sách các yêu cầu đang chờ duyệt kèm số tháng, ngày kết thúc đề xuất và số tiền.
   - Bấm nút **Duyệt**: Backend tự động cập nhật ngày kết thúc mới cho hợp đồng và mở lại mã PIN nếu trước đó bị quá hạn.
   - Hoặc bấm **Từ chối**: Nhập lý do từ chối (VD: ô kho có lịch bảo trì hệ thống điều hòa).

#### Bước 6.3: Quản lý Quá Hạn & Giả Lập Cron Job Scan
1. Tại trang **Gia hạn & Quá hạn**, chuyển sang tab con **Xử Lý Quá Hạn & Khóa PIN**.
2. **Kích hoạt quét quá hạn tức thì (Manual Cron Scan):**
   - Bấm nút **Chạy Quét Hạn Tức Thì (Play icon)**.
   - Hệ thống gọi `POST /renewals/overdue/scan`, quét các hợp đồng đã hết hạn, chuyển sang `OVERDUE`, khóa quyền truy cập mã PIN Smart Lock và tính tiền phạt lũy tiến.
3. **Danh sách vi phạm quá hạn:**
   - Xem số ngày trễ hạn (VD: *Quá 7 ngày*), số tiền phạt trễ hạn tính tự động (VD: *315.000 đ*), trạng thái khóa Smart Lock (*Đã khóa PIN*).
4. **Xử lý nợ & Mở khóa:**
   - Bấm nút **Thu Phạt & Mở Khóa**: Hệ thống gọi `PATCH /renewals/overdue/records/:id/resolve`, ghi nhận tiền phạt đã thanh toán và tự động khôi phục quyền mở cửa mã PIN.
   - Bấm nút **Miễn giảm**: Hệ thống gọi `PATCH /renewals/overdue/records/:id/waive` miễn giảm phí phạt cho khách hàng.

---

## 🛠 Flow 7: Tiếp Nhận & Xử Lý Yêu Cầu Sự Cố (Support Request & Issue Handling Flow)

### Mục tiêu kiểm thử:
- Khách hàng tạo ticket sự cố (mất chìa/thẻ, lỗi mã khóa PIN, hư hỏng thiết bị, sự cố thanh toán).
- Nhân viên tiếp nhận, phân loại mức độ ưu tiên, cập nhật tiến độ xử lý và phản hồi trao đổi 2 chiều.

### Các bước thực hiện:

#### Bước 7.1: Khách hàng gửi Ticket hỗ trợ
1. Tại `http://localhost:3000/dashboard`, chọn tab **Trung tâm hỗ trợ**.
2. Bấm nút **+ Tạo Yêu Cầu Mới**.
3. Điền thông tin sự cố:
   - Chọn ngăn kho liên quan (VD: Ô `A-104`).
   - Chọn danh mục sự cố: *Khóa thông minh (Smart Lock)*, *Mã truy cập / PIN*, *Mất thẻ từ*, *Hư hỏng thiết bị*, *Thanh toán*.
   - Chọn mức độ ưu tiên: *Khẩn cấp*, *Ưu tiên cao*, *Trung bình*, *Thấp*.
   - Nhập tiêu đề và mô tả chi tiết sự cố.
   - (Tùy chọn) Nhập link ảnh đính kèm.
4. Bấm **Gửi Yêu Cầu**: Hệ thống tạo mã ticket duy nhất dạng `TK-2026-XXXX`.
5. **Trao đổi trực tiếp trên Ticket:**
   - Chọn ticket vừa tạo trong danh sách bên trái.
   - Nhập tin nhắn vào ô phản hồi bên dưới và bấm **Gửi**.
   - Tin nhắn hiển thị ngay trong nhật ký trao đổi thời gian thực.

#### Bước 7.2: Nhân viên tiếp nhận và cập nhật tiến độ xử lý
1. Truy cập `http://localhost:3000/staff` → Chọn tab **Yêu cầu sự cố**.
2. Hàng đợi bên trái hiển thị danh sách ticket:
   - Lọc theo: *Tất cả*, *Chờ tiếp nhận*, *Đang xử lý*, *Đã xong*.
3. Chọn ticket cần xử lý:
   - Xem nội dung mô tả của khách, ảnh đính kèm và thông tin liên hệ.
4. **Cập nhật tiến độ kỹ thuật:**
   - Bấm nút **Cập Nhật Tiến Độ**.
   - Chuyển trạng thái sang **Đang xử lý** hoặc **Đã giải quyết**.
   - Nhập ghi chú phương án khắc phục (VD: *"Kỹ thuật viên đã thay pin ổ khóa và reset mã PIN tại chỗ cho khách"*).
   - Bấm **Lưu Thay Đổi**.
5. Gửi tin nhắn phản hồi trực tiếp cho khách hàng qua khung chat nội bộ.

---

## ✅ Bảng Tổng Hợp Kiểm Thử Nhanh (Cheat Sheet)

| Luồng | Thao tác chính | URL Giao diện | Endpoint Backend liên quan |
| :--- | :--- | :--- | :--- |
| **Flow 3** | Đổi mã PIN Smart Lock | `/dashboard` (Tab Truy cập) | `POST /contracts/:id/units/:id/smart-lock/change-pin` |
| **Flow 3** | Ký số hợp đồng | `/dashboard` (Tab Tài liệu) | `PATCH /contracts/:id/sign` |
| **Flow 4** | Cấu hình chính sách & phụ phí | `/admin?role=OPS` | `GET/POST /operations/policies`, `/fee-types` |
| **Flow 4** | Lịch sử hóa đơn & VietQR | `/dashboard` (Tab Thanh toán) | `GET /payments`, `POST /payments/sepay/webhook` |
| **Flow 5** | Sơ đồ mặt bằng kho 24/7 | `/staff` (Tab Sơ đồ mặt bằng) | `GET /facilities/:id/storage-layout` |
| **Flow 6** | Yêu cầu gia hạn hợp đồng | `/dashboard` (Nút Gia hạn) | `POST /renewals/request` |
| **Flow 6** | Duyệt gia hạn & Quét Cron Job | `/staff` (Tab Gia hạn & Quá hạn) | `PATCH /renewals/:id/approve`, `POST /renewals/overdue/scan` |
| **Flow 6** | Thu phạt quá hạn & mở khóa PIN | `/staff` (Tab Gia hạn & Quá hạn) | `PATCH /renewals/overdue/records/:id/resolve` |
| **Flow 7** | Tạo ticket hỗ trợ sự cố | `/dashboard` (Tab Hỗ trợ) | `POST /support/requests` |
| **Flow 7** | Xử lý ticket & Phản hồi | `/staff` (Tab Yêu cầu sự cố) | `PATCH /support/requests/:id/progress`, `POST /notes` |
