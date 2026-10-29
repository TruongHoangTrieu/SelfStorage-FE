import { CheckInAppointment, AvailableUnit } from './types';
import { CustomerUnit, CustomerUser } from '../dashboard/types';
import { calculateRentalDates } from '@/lib/dateUtils';

const STORAGE_KEY_PREFIX = 'staff_today_sample_appointments_v1_';

export interface SampleCustomerAccount {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'STORAGE_CUSTOMER';
  slotTime: string;
  assignedUnit: string;
  unitType: string;
}

export const SAMPLE_TODAY_CUSTOMER_ACCOUNTS: SampleCustomerAccount[] = [
  {
    id: 9001,
    fullName: 'Nguyễn Minh Hoàng',
    email: 'hoang.nguyen@gmail.com',
    phone: '0908 345 678',
    password: 'Customer@123456',
    role: 'STORAGE_CUSTOMER',
    slotTime: '13:00 - 14:30',
    assignedUnit: 'A-102',
    unitType: 'Kho Tiêu chuẩn (3m²)',
  },
  {
    id: 9002,
    fullName: 'Trần Thị Thanh Thảo',
    email: 'thaotran.studio@gmail.com',
    phone: '0912 678 899',
    password: 'Customer@123456',
    role: 'STORAGE_CUSTOMER',
    slotTime: '13:15 - 14:30',
    assignedUnit: 'B-205',
    unitType: 'Kho Trung bình (6m²)',
  },
  {
    id: 9003,
    fullName: 'Lê Quốc Bảo',
    email: 'baole.tech@gmail.com',
    phone: '0987 112 233',
    password: 'Customer@123456',
    role: 'STORAGE_CUSTOMER',
    slotTime: '13:45 - 14:30',
    assignedUnit: 'A-108',
    unitType: 'Kho Mini Locker (1.5m²)',
  },
  {
    id: 9004,
    fullName: 'Phạm Ngọc Lan Anh',
    email: 'lananh.pham@outlook.com',
    phone: '0933 889 900',
    password: 'Customer@123456',
    role: 'STORAGE_CUSTOMER',
    slotTime: '14:00 - 14:30',
    assignedUnit: 'C-301',
    unitType: 'Kho Lớn VIP (12m²)',
  },
];

/**
 * Xác thực đăng nhập cho 4 tài khoản khách hàng mẫu của ngày hôm nay
 */
export function authenticateSampleCustomer(
  email: string,
  password?: string,
): CustomerUser | null {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const matched = SAMPLE_TODAY_CUSTOMER_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail,
  );
  if (!matched) return null;

  const validPasswords = [
    matched.password,
    'Customer@123456',
    'Customer@123',
    '123456',
  ];
  if (password && !validPasswords.includes(password.trim())) {
    return null;
  }

  return {
    id: matched.id,
    fullName: matched.fullName,
    email: matched.email,
    phone: matched.phone,
    role: 'STORAGE_CUSTOMER',
  };
}

function getTodayVnParts(): { year: string; month: string; day: string; dateStr: string; isoPrefix: string } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const day = getPart('day') || '29';
  const month = getPart('month') || '10';
  const year = getPart('year') || '2026';

  return {
    year,
    month,
    day,
    dateStr: `${day}/${month}/${year}`,
    isoPrefix: `${year}-${month}-${day}`,
  };
}

/**
 * Tạo danh sách khách hàng mẫu đến nhận kho trong ngày hôm nay (khung giờ 13:00 - 14:30)
 */
export function getTodayAfternoonSampleAppointments(
  facilityId?: string | number,
  facilityName?: string,
): CheckInAppointment[] {
  const { year, month, day, dateStr, isoPrefix } = getTodayVnParts();
  const codeDate = `${year}${month}${day}`;
  const facIdNum = facilityId ? Number(facilityId) || 1 : 1;
  const facName = facilityName || 'Cơ sở Landmark 81';

  const baseSamples: CheckInAppointment[] = [
    {
      id: `RSV-${codeDate}-1300A`,
      reservationCode: `RSV-${codeDate}-1300A`,
      facilityId: facIdNum,
      facilityName: facName,
      facilityAddress: 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
      customerName: 'Nguyễn Minh Hoàng',
      phone: '0908 345 678',
      email: 'hoang.nguyen@gmail.com',
      idCard: '079095012345',
      identityType: 'CCCD',
      isIdentityVerified: true,
      identityAddress: '125 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP.HCM',
      slotTime: '13:00 - 14:30',
      dateDisplay: 'Hôm nay',
      appointmentDateRaw: `${isoPrefix}T13:00:00+07:00`,
      timeCategory: 'afternoon',
      unitType: 'Kho Tiêu chuẩn',
      unitSize: '3m² (1.5 x 2.0m)',
      assignedUnit: 'A-102',
      preferredFloor: 'Tầng 1',
      status: 'confirmed',
      depositStatus: 'paid',
      depositAmount: '600.000 đ (100%)',
      rentalStatus: 'unpaid',
      monthlyRent: '1.200.000 đ/tháng',
      startDate: dateStr,
      durationMonths: 3,
      purpose: 'Lưu trữ đồ gia dụng và thùng sách cá nhân trong thời gian sửa chữa căn hộ',
      specialNotes: 'Khách hẹn đến lúc 13:00, cần mượn xe đẩy hàng tại sảnh',
      accessPin: '682419',
      rfidCard: 'RFID-3812',
    },
    {
      id: `RSV-${codeDate}-1315B`,
      reservationCode: `RSV-${codeDate}-1315B`,
      facilityId: facIdNum,
      facilityName: facName,
      facilityAddress: 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
      customerName: 'Trần Thị Thanh Thảo',
      phone: '0912 678 899',
      email: 'thaotran.studio@gmail.com',
      idCard: '079198045678',
      identityType: 'CCCD',
      isIdentityVerified: true,
      identityAddress: '48 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM',
      slotTime: '13:15 - 14:30',
      dateDisplay: 'Hôm nay',
      appointmentDateRaw: `${isoPrefix}T13:15:00+07:00`,
      timeCategory: 'afternoon',
      unitType: 'Kho Trung bình',
      unitSize: '6m² (2.0 x 3.0m)',
      assignedUnit: 'B-205',
      preferredFloor: 'Tầng 2',
      status: 'confirmed',
      depositStatus: 'paid',
      depositAmount: '1.050.000 đ (100%)',
      rentalStatus: 'unpaid',
      monthlyRent: '2.100.000 đ/tháng',
      startDate: dateStr,
      durationMonths: 6,
      purpose: 'Lưu trữ hàng mẫu thời trang, phụ kiện chụp ảnh và thiết bị studio',
      specialNotes: 'Khách đến trong khung giờ 13:00 - 14:30 chiều nay',
      accessPin: '519042',
      rfidCard: 'RFID-4920',
    },
    {
      id: `RSV-${codeDate}-1345C`,
      reservationCode: `RSV-${codeDate}-1345C`,
      facilityId: facIdNum,
      facilityName: facName,
      facilityAddress: 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
      customerName: 'Lê Quốc Bảo',
      phone: '0987 112 233',
      email: 'baole.tech@gmail.com',
      idCard: '079092078901',
      identityType: 'CCCD',
      isIdentityVerified: true,
      identityAddress: '210 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM',
      slotTime: '13:45 - 14:30',
      dateDisplay: 'Hôm nay',
      appointmentDateRaw: `${isoPrefix}T13:45:00+07:00`,
      timeCategory: 'afternoon',
      unitType: 'Kho Mini (Locker)',
      unitSize: '1.5m² (1.0 x 1.5m)',
      assignedUnit: 'A-108',
      preferredFloor: 'Tầng 1',
      status: 'confirmed',
      depositStatus: 'paid',
      depositAmount: '375.000 đ (100%)',
      rentalStatus: 'paid',
      monthlyRent: '750.000 đ/tháng',
      startDate: dateStr,
      durationMonths: 1,
      purpose: 'Cất giữ thiết bị điện tử, vali cá nhân và hồ sơ chứng từ',
      specialNotes: 'Đã thanh toán trước tiền thuê, chỉ cần đối chiếu CCCD và cấp mã PIN',
      accessPin: '834126',
      rfidCard: 'RFID-7105',
    },
    {
      id: `RSV-${codeDate}-1400D`,
      reservationCode: `RSV-${codeDate}-1400D`,
      facilityId: facIdNum,
      facilityName: facName,
      facilityAddress: 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
      customerName: 'Phạm Ngọc Lan Anh',
      phone: '0933 889 900',
      email: 'lananh.pham@outlook.com',
      idCard: '079196034512',
      identityType: 'CCCD',
      isIdentityVerified: false,
      identityAddress: '86 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
      slotTime: '14:00 - 14:30',
      dateDisplay: 'Hôm nay',
      appointmentDateRaw: `${isoPrefix}T14:00:00+07:00`,
      timeCategory: 'afternoon',
      unitType: 'Kho Lớn (VIP)',
      unitSize: '12m² (3.0 x 4.0m)',
      assignedUnit: 'C-301',
      preferredFloor: 'Tầng 3',
      status: 'confirmed',
      depositStatus: 'paid',
      depositAmount: '1.800.000 đ (100%)',
      rentalStatus: 'unpaid',
      monthlyRent: '3.600.000 đ/tháng',
      startDate: dateStr,
      durationMonths: 12,
      purpose: 'Lưu trữ nội thất văn phòng, bàn ghế và thùng hồ sơ doanh nghiệp',
      specialNotes: 'Khách hẹn nhận kho lúc 14:00 (khung 13:00 - 14:30)',
      accessPin: '294750',
      rfidCard: 'RFID-6284',
    },
  ];

  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${isoPrefix}`;
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const savedMap: Record<string, Partial<CheckInAppointment>> = JSON.parse(savedRaw);
        return baseSamples.map((item) => ({
          ...item,
          ...(savedMap[item.id] || {}),
          facilityId: facIdNum,
          facilityName: facName,
        }));
      }
    } catch {
      // ignore storage error
    }
  }

  return baseSamples;
}

/**
 * Lưu trạng thái cập nhật của các đơn mẫu trong ngày vào localStorage
 */
export function saveTodaySampleAppointmentsState(appointments: CheckInAppointment[]): void {
  if (typeof window === 'undefined') return;
  try {
    const { isoPrefix } = getTodayVnParts();
    const storageKey = `${STORAGE_KEY_PREFIX}${isoPrefix}`;
    const savedRaw = localStorage.getItem(storageKey);
    const savedMap: Record<string, Partial<CheckInAppointment>> = savedRaw ? JSON.parse(savedRaw) : {};

    appointments.forEach((apt) => {
      if (!apt.rawId && apt.id.startsWith('RSV-')) {
        savedMap[apt.id] = apt;
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(savedMap));
  } catch {
    // ignore storage error
  }
}

/**
 * Lấy dữ liệu Cổng Khách Hàng (/dashboard) cho tài khoản khách hàng mẫu:
 * - Nếu nhân viên chưa bàn giao xong: Hiển thị ở tab "Đơn đặt giữ chỗ"
 * - Nếu nhân viên đã hoàn tất bàn giao tại /staff: Tự động chuyển sang tab "Ô kho đang thuê" kèm mã PIN Smart Lock!
 */
export function getSampleCustomerDashboardData(email?: string): {
  units: CustomerUnit[];
  reservations: any[];
} {
  if (!email) return { units: [], reservations: [] };
  const normalizedEmail = email.trim().toLowerCase();
  const allSamples = getTodayAfternoonSampleAppointments();
  const matchedApt = allSamples.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (!matchedApt) return { units: [], reservations: [] };

  const monthlyRentNum = parseInt(matchedApt.monthlyRent.replace(/[^\d]/g, ''), 10) || 1200000;
  const depositNum = parseInt(matchedApt.depositAmount.replace(/[^\d]/g, ''), 10) || 600000;
  const calcDates = calculateRentalDates(matchedApt.startDate, matchedApt.durationMonths);
  const startFormatted = calcDates?.startDateFormatted || matchedApt.startDate;
  const endFormatted = calcDates?.endDateFormatted || matchedApt.startDate;
  const dueFormatted = calcDates?.dueDateFormatted || matchedApt.startDate;
  const daysRemaining = matchedApt.durationMonths * 30;

  if (matchedApt.status === 'completed') {
    const totalRent = monthlyRentNum * matchedApt.durationMonths;
    const unitObj: CustomerUnit = {
      id: `sample-unit-${matchedApt.id}`,
      unitNumber: `Ô ${matchedApt.assignedUnit}`,
      unitType: matchedApt.unitType,
      size: `${matchedApt.unitSize} • Có điều hòa nhiệt độ`,
      dimensions: matchedApt.unitSize,
      area: matchedApt.unitSize.split(' ')[0] || '3m²',
      facilityId: matchedApt.facilityId || 1,
      facilityName: matchedApt.facilityName || 'Cơ sở Landmark 81',
      facilityAddress: matchedApt.facilityAddress || 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
      zone: matchedApt.assignedUnit.startsWith('B')
        ? 'Khu B'
        : matchedApt.assignedUnit.startsWith('C')
        ? 'Khu C'
        : 'Khu A',
      floor: matchedApt.preferredFloor,
      status: 'active',
      statusLabel: 'Đang hoạt động',
      daysRemaining,
      nextBillingDate: dueFormatted,
      monthlyRent: matchedApt.monthlyRent,
      monthlyRentNum,
      contractStartDate: startFormatted,
      contractEndDate: endFormatted,
      contractId: matchedApt.contractCode || `CON-${matchedApt.id.replace('RSV-', '')}`,
      totalPaid: `${new Intl.NumberFormat('vi-VN').format(totalRent)} đ`,
      currentBalance: '0 đ (Đã thanh toán đủ)',
      temperature: '23°C (Mát mẻ)',
      humidity: '50% (Tối ưu chống ẩm)',
      mainPin: matchedApt.accessPin || '682419',
      rfidCard: matchedApt.rfidCard || 'RFID-3812',
      isClimateControlled: true,
      guestPasses: [],
      paymentHistory: [
        {
          id: `pay-dep-${matchedApt.id}`,
          invoiceNumber: `DEP-${matchedApt.id.replace('RSV-', '')}`,
          date: startFormatted,
          amount: `${new Intl.NumberFormat('vi-VN').format(depositNum)} đ`,
          period: 'Tiền đặt cọc giữ chỗ',
          method: 'Chuyển khoản VietQR',
          status: 'paid',
        },
        {
          id: `pay-ren-${matchedApt.id}`,
          invoiceNumber: `REN-${matchedApt.id.replace('RSV-', '')}`,
          date: startFormatted,
          amount: `${new Intl.NumberFormat('vi-VN').format(Math.max(0, totalRent - depositNum))} đ`,
          period: `Thanh toán kỳ thuê (${startFormatted} - ${endFormatted})`,
          method: 'Thanh toán tại quầy / VietQR',
          status: 'paid',
        },
      ],
      supportTickets: [],
      storedItems: [],
      accessLogs: [
        {
          id: 1,
          contractItemId: 1,
          accessMethod: 'Bàn giao mã PIN tại quầy',
          status: 'SUCCESS',
          notes: `Nhân viên bàn giao ô kho ${matchedApt.assignedUnit}`,
          accessedAt: new Date().toISOString(),
        },
      ],
      isSigned: true,
      contractStatus: 'ACTIVE',
      terms: 'Điều khoản thuê kho tiêu chuẩn: Tuân thủ quy định PCCC và an toàn kho bãi.',
      smartLockStatus: 'ACTIVE',
      depositAmount: depositNum,
    };

    return { units: [unitObj], reservations: [] };
  }

  if (matchedApt.status === 'cancelled') {
    return { units: [], reservations: [] };
  }

  // Khi chưa bàn giao xong: hiển thị đơn đặt giữ chỗ chờ nhận kho hôm nay (13:00 - 14:30)
  const reservationObj = {
    id: 9000 + SAMPLE_TODAY_CUSTOMER_ACCOUNTS.findIndex((a) => a.email.toLowerCase() === normalizedEmail),
    reservationCode: matchedApt.id,
    status: 'CONFIRMED',
    appointmentDate: matchedApt.appointmentDateRaw,
    rentalPeriod: matchedApt.durationMonths,
    notes: `${matchedApt.purpose} (Khung giờ hẹn: ${matchedApt.slotTime} hôm nay)`,
    facility: {
      id: matchedApt.facilityId || 1,
      name: matchedApt.facilityName || 'Cơ sở Landmark 81',
      address: matchedApt.facilityAddress || 'Khu B, Bình Thạnh, TP. Hồ Chí Minh',
    },
    items: [
      {
        price: monthlyRentNum,
        depositAmount: depositNum,
        unitType: {
          name: matchedApt.unitType,
          size: matchedApt.unitSize,
        },
        unit: {
          unitNumber: matchedApt.assignedUnit,
          floor: matchedApt.preferredFloor,
        },
      },
    ],
  };

  return { units: [], reservations: [reservationObj] };
}

/**
 * Danh sách ô kho khả dụng mẫu tương ứng để phục vụ bàn giao / đổi ô kho tại quầy
 */
export function getSampleAvailableUnits(): AvailableUnit[] {
  return [
    {
      id: 'u-sample-102',
      code: 'A-102',
      type: 'Kho Tiêu chuẩn',
      size: '3m² (1.5 x 2.0m)',
      floor: 'Tầng 1',
      zone: 'Khu A',
      features: 'Khóa Smart Lock IoT, Camera 24/7',
      status: 'vacant',
    },
    {
      id: 'u-sample-105',
      code: 'A-105',
      type: 'Kho Tiêu chuẩn',
      size: '3m² (1.5 x 2.0m)',
      floor: 'Tầng 1',
      zone: 'Khu A',
      features: 'Khóa Smart Lock IoT, Gần thang hàng',
      status: 'vacant',
    },
    {
      id: 'u-sample-108',
      code: 'A-108',
      type: 'Kho Mini (Locker)',
      size: '1.5m² (1.0 x 1.5m)',
      floor: 'Tầng 1',
      zone: 'Khu A',
      features: 'Khóa Smart Lock IoT, Chống ẩm',
      status: 'vacant',
    },
    {
      id: 'u-sample-205',
      code: 'B-205',
      type: 'Kho Trung bình',
      size: '6m² (2.0 x 3.0m)',
      floor: 'Tầng 2',
      zone: 'Khu B',
      features: 'Khóa Smart Lock IoT, Kiểm soát nhiệt độ',
      status: 'vacant',
    },
    {
      id: 'u-sample-208',
      code: 'B-208',
      type: 'Kho Trung bình',
      size: '6m² (2.0 x 3.0m)',
      floor: 'Tầng 2',
      zone: 'Khu B',
      features: 'Khóa Smart Lock IoT, Hành lang rộng',
      status: 'vacant',
    },
    {
      id: 'u-sample-301',
      code: 'C-301',
      type: 'Kho Lớn (VIP)',
      size: '12m² (3.0 x 4.0m)',
      floor: 'Tầng 3',
      zone: 'Khu C',
      features: 'Khóa Smart Lock IoT, Cửa cuốn đôi, Điều hòa 24/7',
      status: 'vacant',
    },
  ];
}
