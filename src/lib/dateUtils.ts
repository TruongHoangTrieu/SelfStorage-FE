/**
 * Date Utility for SelfStorage VN
 * Handles rental period, due date, and end date calculations.
 *
 * Core Business Rule:
 * Ngày bắt đầu thuê: Selected move-in / start date.
 * Ngày tới hạn (due date): Ngày cùng kỳ của chu kỳ tiếp theo (Start date + rental months).
 * Ngày kết thúc (end date): Phải là TRƯỚC ngày tới hạn 1 ngày.
 *
 * Ví dụ:
 * - Bắt đầu 15/10/2026 (1 tháng) -> Tới hạn 15/11/2026 -> Ngày kết thúc: 14/11/2026
 * - Bắt đầu 01/10/2026 (1 tháng) -> Tới hạn 01/11/2026 -> Ngày kết thúc: 31/10/2026
 * - Bắt đầu 15/10/2026 (3 tháng) -> Tới hạn 15/01/2027 -> Ngày kết thúc: 14/01/2027
 */

export interface RentalDateCalculation {
  startDateFormatted: string; // DD/MM/YYYY
  dueDateFormatted: string;   // DD/MM/YYYY (Ngày tới hạn chu kỳ tiếp theo)
  endDateFormatted: string;   // DD/MM/YYYY (Ngày kết thúc = trước ngày tới hạn 1 ngày)
  startDateIso: string;       // YYYY-MM-DD
  dueDateIso: string;         // YYYY-MM-DD
  endDateIso: string;         // YYYY-MM-DD
  periodSummary: string;      // "15/10/2026 → 14/11/2026"
}

export function calculateRentalDates(
  startDateInput?: string | Date | null,
  months: number = 1
): RentalDateCalculation | null {
  if (!startDateInput) return null;

  let year: number;
  let month: number; // 1-indexed (1..12)
  let day: number;

  if (typeof startDateInput === 'string') {
    const trimmed = startDateInput.trim();
    if (!trimmed) return null;

    if (trimmed.includes('-')) {
      // Format YYYY-MM-DD or ISO string
      const cleanDate = trimmed.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length < 3) return null;
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (trimmed.includes('/')) {
      // Format DD/MM/YYYY
      const parts = trimmed.split('/');
      if (parts.length < 3) return null;
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return null;
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    }
  } else if (startDateInput instanceof Date) {
    if (isNaN(startDateInput.getTime())) return null;
    year = startDateInput.getFullYear();
    month = startDateInput.getMonth() + 1;
    day = startDateInput.getDate();
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const validMonths = Math.max(1, months || 1);

  // 1. Tính năm & tháng mục tiêu (Target Year & Target Month)
  const targetYear = year + Math.floor((month - 1 + validMonths) / 12);
  const targetMonth = ((month - 1 + validMonths) % 12) + 1; // 1-indexed (1..12)

  // 2. Số ngày tối đa của tháng mục tiêu (tránh tràn ngày ví dụ 31/01 sang tháng 2)
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, maxDaysInTargetMonth);

  // 3. Ngày tới hạn (due date): ngày bắt đầu của kỳ thanh toán tiếp theo
  const dueDate = new Date(targetYear, targetMonth - 1, targetDay);

  // 4. Ngày kết thúc (end date): TRƯỚC ngày tới hạn 1 ngày
  // Nếu targetDay là ngày 1, `targetDay - 1` là 0 => JS Date tự động lùi về ngày cuối tháng trước
  const endDate = new Date(targetYear, targetMonth - 1, targetDay - 1);

  const formatVn = (dt: Date): string => {
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatIso = (dt: Date): string => {
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const startDateObj = new Date(year, month - 1, day);
  const startDateFormatted = formatVn(startDateObj);
  const startDateIso = formatIso(startDateObj);

  const dueDateFormatted = formatVn(dueDate);
  const dueDateIso = formatIso(dueDate);

  const endDateFormatted = formatVn(endDate);
  const endDateIso = formatIso(endDate);

  return {
    startDateFormatted,
    dueDateFormatted,
    endDateFormatted,
    startDateIso,
    dueDateIso,
    endDateIso,
    periodSummary: `${startDateFormatted} → ${endDateFormatted}`,
  };
}

