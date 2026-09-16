# Self-Storage Frontend Web Client
**Hệ thống Quản lý và Cho thuê Kho Lưu trữ Tự phục vụ (Web Client)**

Repository này chứa mã nguồn **Frontend Web Application** cho **Hệ thống Quản lý và Cho thuê Kho Lưu trữ Tự phục vụ (Self-Storage Facility Rental and Management System)**, được xây dựng trên nền tảng **Next.js (App Router)**, **TypeScript** và **Tailwind CSS**.

---

## 1. Tổng quan dự án

Self-Storage Web Platform cung cấp giao diện quản trị và tương tác đa vai trò, phục vụ toàn diện các quy trình vận hành và kinh doanh dịch vụ cho thuê kho lưu trữ tự phục vụ:

* **Storage Customer (Khách thuê kho):**
  * Tra cứu, tìm kiếm cơ sở kho, loại kho, kích thước và bảng giá trực quan.
  * Đặt chỗ thuê kho trực tuyến linh hoạt theo thời gian bắt đầu và thời hạn thuê.
  * Thanh toán phí đặt cọc, tiền thuê, gia hạn và các phụ phí qua cổng thanh toán điện tử.
  * Quản lý hợp đồng kho đã thuê, xem thông tin truy cập và gửi ticket yêu cầu hỗ trợ.

* **Facility Staff (Nhân viên cơ sở):**
  * Tra cứu thông tin đặt chỗ khi khách hàng đến cơ sở để check-in nhận kho.
  * Bàn giao ngăn kho, khóa thông minh, thẻ từ hoặc mã truy cập (Access Code).
  * Kiểm tra hiện trạng, xác nhận tình trạng ngăn kho lúc khách trả kho.
  * Tiếp nhận và xử lý các sự cố tại chỗ (mất chìa, lỗi mã vào cửa, hư hỏng vật chất).
  * Theo dõi lịch làm việc, danh sách đón tiếp khách nhận kho/trả kho hàng ngày.

* **Facility Manager (Quản lý cơ sở):**
  * Quản lý danh mục ngăn kho tại cơ sở (loại kho, kích thước, vị trí, giá thuê, trạng thái).
  * Phân bổ ngăn kho phù hợp cho khách hàng dựa trên nhu cầu và tình trạng sẵn sàng.
  * Giám sát hợp đồng thuê, hạn thuê, tình trạng thanh toán và xử lý quá hạn tại cơ sở.
  * Phân công công việc cho nhân viên hỗ trợ bàn giao, kiểm tra và bảo trì.
  * Báo cáo thống kê hiệu suất: tỷ lệ lấp đầy (*occupancy rate*), doanh thu và tình trạng kho.

* **Business Operations Manager (Quản lý vận hành kinh doanh):**
  * Quản lý danh mục tất cả các cơ sở kho trên toàn hệ thống.
  * Thiết lập chính sách thuê chung: đặt cọc, gia hạn, hủy hợp đồng, hoàn trả và xử lý quá hạn.
  * Quản lý khung giá thuê, biểu phí dịch vụ, phí phạt quá hạn và chính sách khuyến mãi.
  * Theo dõi tổng thể doanh thu, tỷ lệ khai thác và hiệu suất vận hành toàn hệ thống.
  * Xuất báo cáo tổng hợp đa chiều theo cơ sở, loại kho và trạng thái hợp đồng.

* **System Administrator (Quản trị hệ thống):**
  * Quản lý danh sách tài khoản người dùng và phân quyền vai trò người dùng (RBAC).
  * Cấu hình phân quyền truy cập dữ liệu theo vai trò và cơ sở được chỉ định.
  * Giám sát lịch sử đăng nhập và nhật ký hoạt động (Audit Logs) của hệ thống.

---

## 2. Công nghệ sử dụng

* **Framework:** Next.js (App Router)
* **Ngôn ngữ:** TypeScript
* **UI & Styling:** React, Tailwind CSS, Shadcn UI / Radix UI components
* **State Management:** Zustand / React Context
* **Data Fetching & Caching:** TanStack Query (React Query) & Axios Client
* **Icons:** Lucide React
* **Code Quality & Formatting:** ESLint, Prettier

---

## 3. Cấu trúc thư mục

Dự án áp dụng kiến trúc module hóa kết hợp hướng **Feature-Sliced Design** nhằm phân tách rõ ràng trách nhiệm giữa routing, logic nghiệp vụ từng phân hệ và tài nguyên dùng chung:

```text
SelfStorage-FE/
├── public/               # Tài nguyên tĩnh (images, logo, icons, fonts)
├── src/
│   ├── app/              # Routing, layouts và page entry points của Next.js (App Router)
│   │   ├── (auth)/       # Luồng xác thực: login, register, forgot-password
│   │   ├── (customer)/   # Giao diện dành cho khách hàng thuê kho
│   │   ├── (staff)/      # Phân hệ vận hành của nhân viên cơ sở
│   │   ├── (manager)/    # Phân hệ quản lý cơ sở và phân bổ kho
│   │   ├── (operations)/ # Phân hệ quản lý vận hành kinh doanh & chính sách
│   │   ├── (admin)/      # Phân hệ quản trị hệ thống, tài khoản và phân quyền
│   │   ├── api/          # Route Handlers nội bộ (Next.js API Routes nếu cần)
│   │   ├── layout.tsx    # Root Layout toàn hệ thống
│   │   └── page.tsx      # Landing page / Trang chủ
│   ├── core/             # Logic lõi của ứng dụng
│   │   ├── api/          # Cấu hình Axios Client, API Interceptors, Error Handling
│   │   ├── auth/         # Auth provider, Session management, Role-based guard
│   │   ├── config/       # Biến cấu hình hệ thống, constants
│   │   └── store/        # Zustand global stores
│   ├── features/         # Đóng gói logic theo từng tính năng và phân hệ nghiệp vụ
│   │   ├── auth/         # Login form, OTP verification, register form
│   │   ├── facilities/   # Quản lý danh sách cơ sở, bản đồ vị trí, chi tiết cơ sở
│   │   ├── units/        # Danh mục ngăn kho, loại kho, kích thước, trạng thái
│   │   ├── reservations/ # Quy trình đặt chỗ, tính giá, chọn thời hạn thuê
│   │   ├── contracts/    # Quản lý hợp đồng thuê, bàn giao, gia hạn, trả kho
│   │   ├── billing/      # Quản lý hóa đơn, đặt cọc, thanh toán trực tuyến
│   │   ├── support/      # Quản lý ticket hỗ trợ, báo cáo sự cố kho
│   │   ├── operations/   # Cấu hình giá, biểu phí phụ thu, chính sách thuê
│   │   ├── reports/      # Biểu đồ doanh thu, tỷ lệ lấp đầy kho, xuất báo cáo
│   │   └── users/        # Quản lý tài khoản, phân vai trò và quyền truy cập
│   └── shared/           # Thành phần dùng chung toàn dự án
│       ├── components/   # UI components (Button, Modal, DataTable, Badge, Dropdown,...)
│       ├── hooks/        # Custom React hooks dùng chung (useDebounce, useMediaQuery,...)
│       ├── types/        # Type definitions & Interfaces TypeScript chung
│       └── utils/        # Helper functions (formatCurrency, formatDate, validate,...)
├── .eslintrc.json        # Cấu hình ESLint
├── .gitignore            # Danh sách tệp bỏ qua khi commit Git
├── next.config.mjs       # Cấu hình Next.js
├── package.json          # Danh sách dependencies và scripts
├── postcss.config.mjs    # Cấu hình PostCSS
├── tailwind.config.ts    # Cấu hình Tailwind CSS
└── tsconfig.json         # Cấu hình TypeScript compiler
```

---

## 4. Quy ước quan trọng

* **Không đặt business logic phức tạp trực tiếp trong `src/app/`**: Thư mục `app/` chỉ chịu trách nhiệm cấu hình Layout, Routing và kết nối component từ `features/`.
* **Đóng gói theo tính năng**: Mỗi nghiệp vụ logic, components, API calls liên quan nên được đặt tại `src/features/[feature-name]/`.
* **Giao tiếp giữa các feature**: Hạn chế import chéo sâu giữa các feature. Nếu cần chia sẻ dữ liệu hoặc component, hãy export qua `index.ts` của feature đó hoặc đưa vào `src/shared/`.
* **Tái sử dụng tại `src/shared/`**: Các UI component nguyên tử (Atomic components), helper functions và kiểu dữ liệu chung nên đặt tại `src/shared/`.
* **Chuẩn hóa TypeScript**: Khai báo type/interface rõ ràng cho mọi request/response DTO và props, tránh dùng `any`.

---

## 5. Cài đặt môi trường

### Yêu cầu:
* **Node.js:** Phiên bản khuyến nghị LTS `>= 20.x` (tương thích tốt với Next.js).
* **Package Manager:** `npm` hoặc `yarn` / `pnpm`.

### Các bước cài đặt:

1. **Clone mã nguồn dự án:**
   ```bash
   git clone <URL_DỰ_ÁN>
   cd SelfStorage-FE
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   * Tạo tệp `.env.local` tại thư mục gốc nếu chưa có.
   * Định nghĩa các khóa cần thiết (ví dụ: `NEXT_PUBLIC_API_URL`, cấu hình xác thực, cổng thanh toán...).

4. **Chạy môi trường phát triển (Development):**
   ```bash
   npm run dev
   ```

5. **Mở trình duyệt tại:**
   ```text
   http://localhost:3000
   ```

---

## 6. Scripts hữu ích

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển (Development Server) |
| `npm run build` | Build tối ưu ứng dụng cho môi trường Production |
| `npm run start` | Chạy ứng dụng đã build ở môi trường Production |
| `npm run lint` | Kiểm tra chất lượng và định dạng mã nguồn bằng ESLint |

---

## 7. Quy trình phát triển đề xuất

1. **Cập nhật mã nguồn mới nhất:**
   ```bash
   git pull origin main
   ```

2. **Tạo nhánh làm việc theo chuẩn:**
   ```bash
   git checkout -b feature/ten-tinh-nang
   # hoặc
   git checkout -b bugfix/ten-loi
   ```

3. **Kiểm tra chất lượng mã nguồn trước khi commit:**
   ```bash
   npm run lint
   ```

4. **Commit với thông điệp rõ ràng theo chuẩn Conventional Commits:**
   ```bash
   git add .
   git commit -m "feat: mo ta ngan gon thay doi"
   ```

5. **Đẩy nhánh lên remote và tạo Pull Request (PR):**
   ```bash
   git push origin feature/ten-tinh-nang
   ```

---

## 8. Ghi chú cho thành viên dự án

* Luôn kiểm tra kỹ các luồng phân quyền người dùng (*RBAC*) khi xây dựng giao diện các phân hệ Staff, Manager, Operations và Admin.
* Giữ Pull Request nhỏ, tập trung giải quyết đúng phạm vi tính năng.
* Không tự ý thay đổi cấu trúc cốt lõi (`src/core/`) nếu chưa thống nhất với nhóm phát triển.
* Khi gặp xung đột mã nguồn (*conflict*), ưu tiên trao đổi trực tiếp với thành viên liên quan trước khi giải quyết.

---

## 9. License

Dự án phục vụ nội bộ cho **Hệ thống Quản lý và Cho thuê Kho Lưu trữ Tự phục vụ (Self-Storage)**. Vui lòng không sao chép hoặc phân phối lại mã nguồn ngoài phạm vi được cho phép bởi nhóm phát triển.
