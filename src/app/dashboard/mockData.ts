import { CustomerUnit } from './types';

export const INITIAL_CUSTOMER_UNITS: CustomerUnit[] = [
  {
    id: 'unit-a104',
    unitNumber: 'Ô A-104',
    unitType: 'Kho Cá nhân Tiêu chuẩn',
    size: '10x10 Có điều hòa nhiệt độ',
    dimensions: '3.0m x 3.0m x 2.8m',
    area: '9.0 m²',
    facilityName: 'Cơ sở Landmark 81 - Chi nhánh Bình Thạnh',
    facilityAddress: 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh',
    zone: 'Khu A',
    floor: 'Tầng 1 (Kế thang máy)',
    status: 'active',
    statusLabel: 'Đang hoạt động',
    daysRemaining: 185,
    nextBillingDate: '20/10/2026',
    monthlyRent: '1.800.000 đ/tháng',
    monthlyRentNum: 1800000,
    contractStartDate: '20/03/2026',
    contractEndDate: '20/03/2027',
    contractId: 'SS-HĐ-2026-A104',
    totalPaid: '10.800.000 đ (6 tháng)',
    currentBalance: '0 đ (Đã trả đủ)',
    temperature: '22°C (Mát mẻ)',
    humidity: '50% (Tối ưu chống ẩm)',
    mainPin: '682914',
    rfidCard: 'RFID-9921',
    isClimateControlled: true,
    guestPasses: [
      {
        id: 'gp-1',
        guestName: 'Nguyễn Văn Tuấn (Người chuyển nhà Thành Hưng)',
        pin: '839201',
        validFrom: '20/09/2026 08:00',
        validTo: '21/09/2026 18:00',
        status: 'active',
        purpose: 'Vận chuyển thùng sách & đồ nội thất phụ'
      }
    ],
    paymentHistory: [
      {
        id: 'inv-101',
        invoiceNumber: 'HD-2026-09-01',
        date: '20/09/2026',
        amount: '1.800.000 đ',
        period: 'Tháng 09/2026',
        method: 'Thẻ Visa / Master (Auto-pay)',
        status: 'paid'
      },
      {
        id: 'inv-100',
        invoiceNumber: 'HD-2026-08-01',
        date: '20/08/2026',
        amount: '1.800.000 đ',
        period: 'Tháng 08/2026',
        method: 'VNPay QR',
        status: 'paid'
      },
      {
        id: 'inv-099',
        invoiceNumber: 'HD-2026-07-01',
        date: '20/07/2026',
        amount: '1.800.000 đ',
        period: 'Tháng 07/2026',
        method: 'Chuyển khoản Vietcombank',
        status: 'paid'
      }
    ],
    supportTickets: [
      {
        id: 'TK-8821',
        title: 'Yêu cầu mượn xe đẩy pallet tầng 1',
        unitCode: 'Ô A-104',
        category: 'Hỗ trợ thiết bị vận chuyển',
        createdAt: '15/08/2026',
        status: 'resolved',
        lastReply: 'Nhân viên trực ca đã bố trí xe đẩy tại cửa xuất nhập.'
      }
    ],
    isSigned: true,
    contractStatus: 'ACTIVE',
    smartLockStatus: 'ACTIVE',
    storedItems: [
      {
        id: 1,
        contractItemId: 1,
        name: 'Bộ sofa phòng khách bọc nỉ',
        category: 'Nội thất & Gia dụng',
        quantity: 1,
        description: 'Bọc màng PE chống bụi, tình trạng nguyên vẹn',
        photoUrl: '',
        createdAt: '2026-03-22T09:00:00Z',
      },
      {
        id: 2,
        contractItemId: 1,
        name: 'Thùng hồ sơ kế toán & hợp đồng năm 2024-2025',
        category: 'Tài liệu & Hồ sơ',
        quantity: 5,
        description: 'Thùng carton tiêu chuẩn, niêm phong băng dính xanh',
        photoUrl: '',
        createdAt: '2026-03-25T14:30:00Z',
      },
      {
        id: 3,
        contractItemId: 1,
        name: 'Màn hình máy tính Dell UltraSharp 27 inch',
        category: 'Thiết bị điện tử',
        quantity: 2,
        description: 'Có lót xốp chống sốc, kèm dây nguồn cáp HDMI',
        photoUrl: '',
        createdAt: '2026-04-10T11:15:00Z',
      },
      {
        id: 4,
        contractItemId: 1,
        name: 'Vali quần áo mùa đông & áo khoác da',
        category: 'Quần áo & Thời trang',
        quantity: 3,
        description: 'Vali kéo Samsonite khóa số có túi hút chân không',
        photoUrl: '',
        createdAt: '2026-05-02T16:45:00Z',
      }
    ],
    accessLogs: [
      {
        id: 101,
        contractItemId: 1,
        accessMethod: 'Mở từ xa qua App',
        status: 'SUCCESS',
        notes: 'Chủ kho mở cửa tự động qua điện thoại',
        accessedAt: '2026-10-06T15:20:10Z'
      },
      {
        id: 102,
        contractItemId: 1,
        accessMethod: 'Mã PIN cá nhân',
        status: 'SUCCESS',
        notes: 'Khách hàng nhập mã số bàn phím',
        accessedAt: '2026-10-02T09:12:45Z'
      },
      {
        id: 103,
        contractItemId: 1,
        accessMethod: 'Thẻ từ RFID',
        status: 'SUCCESS',
        notes: 'Quẹt thẻ RFID-9921 tại cửa ô kho',
        accessedAt: '2026-09-21T14:05:00Z'
      },
      {
        id: 104,
        contractItemId: 1,
        accessMethod: 'Mã PIN khách tạm',
        status: 'SUCCESS',
        notes: 'Nguyễn Văn Tuấn nhập mã PIN khách 839201',
        accessedAt: '2026-09-20T10:30:22Z'
      }
    ]
  },
  {
    id: 'unit-b205',
    unitNumber: 'Ô B-205',
    unitType: 'Kho Gia đình Tiêu chuẩn',
    size: '6m² Không điều hòa (Thông thoáng tự nhiên)',
    dimensions: '2.0m x 3.0m x 2.8m',
    area: '6.0 m²',
    facilityName: 'Cơ sở Landmark 81 - Chi nhánh Bình Thạnh',
    facilityAddress: 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh',
    zone: 'Khu B',
    floor: 'Tầng 2 (Dãy hành lang rộng)',
    status: 'expiring',
    statusLabel: 'Sắp hết hạn',
    daysRemaining: 4,
    nextBillingDate: '24/09/2026',
    monthlyRent: '2.500.000 đ/tháng',
    monthlyRentNum: 2500000,
    contractStartDate: '24/03/2026',
    contractEndDate: '24/09/2026',
    contractId: 'SS-HĐ-2026-B205',
    totalPaid: '15.000.000 đ',
    currentBalance: '2.500.000 đ (Kỳ gia hạn mới)',
    temperature: '26°C',
    humidity: '62%',
    mainPin: '517392',
    rfidCard: 'RFID-9922',
    isClimateControlled: false,
    guestPasses: [],
    paymentHistory: [
      {
        id: 'inv-201',
        invoiceNumber: 'HD-2026-08-24',
        date: '24/08/2026',
        amount: '2.500.000 đ',
        period: 'Tháng 08/2026',
        method: 'VNPay QR',
        status: 'paid'
      }
    ],
    supportTickets: []
  },
  {
    id: 'unit-c302',
    unitNumber: 'Ô C-302',
    unitType: 'Kho Doanh nghiệp Lớn',
    size: '12m² Cửa cuốn tự động tải nặng',
    dimensions: '3.0m x 4.0m x 3.0m',
    area: '12.0 m²',
    facilityName: 'Cơ sở Landmark 81 - Chi nhánh Bình Thạnh',
    facilityAddress: 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh',
    zone: 'Khu C',
    floor: 'Tầng 3 (Sát thang máy hàng nặng)',
    status: 'overdue',
    statusLabel: 'Quá hạn',
    daysRemaining: -3,
    nextBillingDate: '17/09/2026 (Quá 3 ngày)',
    monthlyRent: '4.800.000 đ/tháng',
    monthlyRentNum: 4800000,
    contractStartDate: '17/06/2026',
    contractEndDate: '17/09/2026',
    contractId: 'SS-HĐ-2026-C302',
    totalPaid: '14.400.000 đ',
    currentBalance: '4.800.000 đ (Chưa thanh toán)',
    temperature: '24°C',
    humidity: '55%',
    mainPin: '409128',
    rfidCard: 'RFID-9923',
    isClimateControlled: true,
    guestPasses: [],
    paymentHistory: [
      {
        id: 'inv-301',
        invoiceNumber: 'HD-2026-09-17',
        date: '17/09/2026',
        amount: '4.800.000 đ',
        period: 'Tháng 09/2026',
        method: 'Chờ thanh toán',
        status: 'overdue'
      }
    ],
    supportTickets: [
      {
        id: 'TK-8790',
        title: 'Cần hướng dẫn mở cửa cuốn tự động khi mất điện',
        unitCode: 'Ô C-302',
        category: 'Kỹ thuật vận hành',
        createdAt: '02/09/2026',
        status: 'resolved',
        lastReply: 'Hệ thống có bộ lưu điện UPS 4 giờ tự động dự phòng.'
      }
    ]
  }
];
