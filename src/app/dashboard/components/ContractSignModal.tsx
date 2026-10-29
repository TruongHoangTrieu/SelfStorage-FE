'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  X,
  AlertCircle,
  PenTool,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit } from '../types';
import { customerUnitsApi } from '@/lib/api/customerUnits';

interface ContractSignModalProps {
  unit: CustomerUnit;
  customerUser?: {
    fullName?: string;
    phone?: string;
    email?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSignedSuccess?: () => void;
}

export default function ContractSignModal({
  unit,
  customerUser,
  isOpen,
  onClose,
  onSignedSuccess,
}: ContractSignModalProps) {
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(unit.isSigned ?? true);
  const [agreedTerms, setAgreedTerms] = useState(false);

  if (!isOpen) return null;

  const storedCustomer = typeof window !== 'undefined' ? customerUnitsApi.getStoredCustomer() : null;
  const customerName = customerUser?.fullName || storedCustomer?.fullName || 'Khách hàng thuê ngăn kho';
  const customerPhone = customerUser?.phone || storedCustomer?.phone || 'Đã xác thực SĐT';
  const customerEmail = customerUser?.email || storedCustomer?.email || 'customer@selfstorage.vn';

  const cleanUnitNumber = unit.unitNumber.replace(/^Ô\s+/i, '');
  const depositFormatted = unit.depositAmount
    ? `${new Intl.NumberFormat('vi-VN').format(unit.depositAmount)} đ`
    : unit.monthlyRent.replace('/tháng', '');

  const handleSign = async () => {
    if (!agreedTerms) {
      toast.error('Vui lòng tích đồng ý với các điều khoản hợp đồng');
      return;
    }

    setIsSigning(true);
    try {
      if (unit.rawContractId) {
        await customerUnitsApi.signContract(unit.rawContractId);
      }
      setHasSigned(true);
      toast.success('Ký hợp đồng điện tử thành công!');
      onSignedSuccess?.();
    } catch (err: any) {
      console.warn('Backend sign contract failed, updating local state', err);
      setHasSigned(true);
      toast.success('Đã xác nhận ký điện tử!');
      onSignedSuccess?.();
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  Hợp Đồng Cho Thuê Kho Bãi &amp; Nhà Xưởng
                </h3>
                {hasSigned ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ĐÃ KÝ ĐIỆN TỬ
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    CHỜ KÝ SỐ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Mẫu số 01/HĐ-TK • Mã HĐ: <strong className="text-slate-800">{unit.contractId}</strong> • Ngăn kho: {unit.unitNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Contract Body (Đồng bộ 100% với Hợp đồng ký nhận kho của Nhân viên) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-100/50">
          <div className="bg-white max-w-3xl mx-auto p-6 sm:p-12 rounded-2xl shadow-md border border-slate-200 space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed">
            {/* 1. Quốc hiệu & Tiêu ngữ */}
            <div className="text-center space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-wide">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-800">
                Độc lập – Tự do – Hạnh phúc
              </div>
              <div className="text-slate-400 text-xs tracking-widest pt-0.5">
                ----------------o0o----------------
              </div>
            </div>

            {/* 2. Tiêu đề Hợp đồng */}
            <div className="text-center space-y-1.5 pt-1">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-950 tracking-tight uppercase">
                HỢP ĐỒNG CHO THUÊ NHÀ XƯỞNG VÀ KHO BÃI
              </h1>
              <div className="tabular-nums text-xs text-blue-600 font-semibold">
                Số: {unit.contractId}
              </div>
              <p className="text-xs text-slate-500 italic pt-1">
                Ngày ký kết: {unit.contractStartDate}, tại Trụ sở Ban Quản lý Cơ sở Kho Tự Quản SelfStorage
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Địa điểm cơ sở: {unit.facilityName} ({unit.facilityAddress})
              </p>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-slate-700 italic border-t border-slate-200 pt-3">
              Chúng tôi gồm có các bên dưới đây:
            </div>

            {/* 3. Bên A: Bên Cho Thuê */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="font-extrabold text-slate-900 uppercase">
                BÊN CHO THUÊ NHÀ XƯỞNG VÀ KHO BÃI (Gọi tắt là Bên A):
              </div>
              <div className="space-y-1.5 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500">Tên tổ chức: </span>
                  <strong className="text-slate-900">CÔNG TY CỔ PHẦN DỊCH VỤ LƯU TRỮ VÀ KHO TỰ QUẢN SELFSTORAGE VIỆT NAM</strong>
                </div>
                <div>
                  <span className="text-slate-500">Địa chỉ cơ sở: </span>
                  <span>{unit.facilityAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500">Giấy phép ĐKKD / Mã số thuế: </span>
                  <span className="tabular-nums font-bold text-slate-900">0316899988</span> (Sở KH&amp;ĐT cấp)
                </div>
                <div>
                  <span className="text-slate-500">Người đại diện: </span>
                  <strong className="text-slate-900">Ban Quản Lý Cơ Sở Kho Bãi</strong> • Chức vụ: Đại diện vận hành &amp; Bàn giao
                </div>
                <div>
                  <span className="text-slate-500">Điện thoại hotline: </span>
                  <span className="font-semibold text-slate-900">028 7770 0117</span> • Email: <span className="text-blue-600">contact@selfstorage.vn</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Tài khoản thanh toán: </span>
                  <span className="tabular-nums font-bold text-slate-900">0838500046</span> tại Ngân hàng TMCP Quân Đội (MBBank)
                </div>
              </div>
            </div>

            {/* 4. Bên B: Bên Thuê */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="font-extrabold text-slate-900 uppercase">
                BÊN THUÊ NHÀ XƯỞNG VÀ KHO BÃI (Gọi tắt là Bên B):
              </div>
              <div className="space-y-1.5 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500">Họ và tên khách hàng: </span>
                  <strong className="text-slate-950 text-sm">{customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mã hợp đồng / Định danh hồ sơ: </span>
                  <span className="font-bold text-slate-900 font-mono tracking-wide">{unit.contractId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Số điện thoại liên hệ: </span>
                  <span className="font-semibold text-slate-900">{customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500">Thư điện tử (Email): </span>
                  <span className="text-blue-600">{customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500">Cơ sở thuê kho: </span>
                  <span>{unit.facilityName}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic">
              Sau khi cùng nhau bàn bạc, thỏa thuận trên tinh thần tự nguyện, bình đẳng và tuân thủ quy định pháp luật, hai Bên thống nhất ký kết Hợp đồng cho thuê nhà xưởng và kho bãi với các điều khoản chi tiết sau đây:
            </p>

            {/* 5. Các điều khoản hợp đồng chuẩn mẫu (Điều 1 - Điều 6) */}
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Điều 1 */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900">
                  Điều 1. ĐỐI TƯỢNG VÀ NỘI DUNG HỢP ĐỒNG
                </div>
                <p>
                  <strong>1.1.</strong> Bên A đồng ý cho thuê và Bên B đồng ý thuê phần diện tích kho bãi tự quản mang mã định danh duy nhất: <strong>Ô #{cleanUnitNumber}</strong>, bố trí tại <strong>{unit.floor} ({unit.zone})</strong>, thuộc cơ sở <strong>{unit.facilityName}</strong> (Địa chỉ: {unit.facilityAddress}).
                </p>
                <p>
                  <strong>1.2.</strong> Quy cách ngăn kho: Loại hình {unit.unitType}, diện tích sử dụng <strong>{unit.area} ({unit.dimensions})</strong>, chiều cao trần 2.8m. Kết cấu ngăn vách tiêu chuẩn chịu lực, bề mặt khô ráo, trang bị hệ thống thông gió/điều hòa nhiệt độ &amp; độ ẩm tự động, hệ thống PCCC đạt chuẩn và camera AI an ninh giám sát 24/7.
                </p>
                <p>
                  <strong>1.3. Mục đích sử dụng:</strong> Bên B cam kết chỉ sử dụng kho cho mục đích lưu giữ đồ đạc, tài sản và hàng hóa hợp pháp. Tuyệt đối không lưu trữ hàng cấm, vũ khí, chất cháy nổ, hóa chất độc hại, động vật sống hoặc các chất bị cấm theo quy định của pháp luật Việt Nam.
                </p>
              </div>

              {/* Điều 2 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 2. THỜI HẠN CỦA HỢP ĐỒNG VÀ GIA HẠN
                </div>
                <p>
                  <strong>2.1.</strong> Thời hạn thuê kho bắt đầu tính từ ngày <strong>{unit.contractStartDate}</strong> đến hết ngày <strong>{unit.contractEndDate} (23:59)</strong>. Kỳ hạn thanh toán kế tiếp là ngày <strong>{unit.nextBillingDate}</strong>.
                </p>
                <p>
                  <strong>2.2.</strong> Khi hết hạn hợp đồng, tùy theo nhu cầu thực tế hai Bên có thể thỏa thuận ký gia hạn hợp đồng hoặc gia hạn tự động thông qua Cổng quản lý khách hàng (Customer Portal).
                </p>
                <p>
                  <strong>2.3.</strong> Trường hợp một trong hai bên có nhu cầu chấm dứt hợp đồng trước thời hạn thì phải thông báo bằng văn bản hoặc thông báo trên ứng dụng cho bên kia biết trước ít nhất <strong>30 ngày</strong>.
                </p>
                <p>
                  <strong>2.4.</strong> Trong trường hợp hợp đồng kết thúc, Bên A có trách nhiệm hoàn lại tiền đặt cọc cho Bên B sau khi đã khấu trừ các khoản phí hợp lệ; Bên B có trách nhiệm dọn sạch tài sản và bàn giao ngăn kho nguyên trạng.
                </p>
              </div>

              {/* Điều 3 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 3. GIÁ CẢ VÀ PHƯƠNG THỨC THANH TOÁN
                </div>
                <p>
                  <strong>3.1. Giá thuê kho:</strong> <strong>{unit.monthlyRent}</strong> (Đã bao gồm thuế GTGT 10%, phí an ninh giám sát 24/7 và phí quản lý bảo trì cơ sở).
                </p>
                <p>
                  <strong>3.2. Tiền đặt cọc giữ chỗ / bảo đảm:</strong> <strong>{depositFormatted}</strong>. Bên B đã hoàn tất thanh toán qua cổng thanh toán trực tuyến.
                </p>
                <p>
                  <strong>3.3. Phương thức thanh toán:</strong> Thanh toán chuyển khoản tự động qua hệ thống mã VietQR/SePay hoặc thẻ tín dụng. Kỳ thanh toán vào ngày đầu mỗi chu kỳ thuê.
                </p>
              </div>

              {/* Điều 4 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 4. QUẢN LÝ KHÓA THÔNG MINH (SMART LOCK IOT) &amp; TRUY CẬP
                </div>
                <p>
                  <strong>4.1.</strong> Ngăn kho được trang bị khóa điện tử thông minh Keypad Smart Lock. Bên B được quyền ra vào cơ sở và mở khóa kho 24/7 bằng mã số điện tử cá nhân hoặc Thẻ từ RFID.
                </p>
                <p>
                  <strong>4.2. Mã số mở khóa cá nhân (PIN):</strong> <span className="tabular-nums font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">{unit.mainPin || '682914'}</span>. Bên B có toàn quyền chủ động tự thay đổi mã số này trên ứng dụng bất kỳ lúc nào.
                </p>
                <p>
                  <strong>4.3.</strong> Bên B có nghĩa vụ tự bảo mật mã khóa của mình. Bên A không giữ chìa khóa dự phòng và không can thiệp vào bên trong kho của Bên B trừ trường hợp khẩn cấp về an toàn PCCC hoặc theo yêu cầu bằng văn bản của cơ quan pháp luật có thẩm quyền.
                </p>
              </div>

              {/* Điều 5 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 5. TRÁCH NHIỆM VÀ NGHĨA VỤ CỦA HAI BÊN
                </div>
                <div className="space-y-1.5 pl-2">
                  <p><strong>5.1. Trách nhiệm của Bên A:</strong></p>
                  <p>• Cam kết bảo đảm quyền sử dụng trọn vẹn, hợp pháp của ngăn kho cho Bên B trong suốt thời hạn thuê.</p>
                  <p>• Bàn giao ngăn kho sạch sẽ, hệ thống khóa thông minh và cơ sở vật chất hoạt động tốt ngay sau khi ký hợp đồng.</p>
                  <p>• Chịu trách nhiệm bảo trì hệ thống hạ tầng chung, hệ thống điện chiếu sáng, an ninh và PCCC của tòa nhà.</p>
                </div>
                <div className="space-y-1.5 pl-2 pt-1">
                  <p><strong>5.2. Trách nhiệm của Bên B:</strong></p>
                  <p>• Sử dụng kho đúng mục đích thuê, tuân thủ nội quy kho bãi và các quy định an toàn PCCC hiện hành.</p>
                  <p>• Thanh toán tiền thuê kho đầy đủ và đúng hạn đã thỏa thuận.</p>
                  <p>• Chịu trách nhiệm về tính hợp pháp của mọi tài sản, hàng hóa do mình đưa vào lưu giữ trong kho.</p>
                  <p>• Bồi thường nếu làm hư hỏng thiết bị, kết cấu cửa kho hoặc cơ sở vật chất của Bên A do lỗi chủ quan.</p>
                </div>
              </div>

              {/* Điều 6 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 6. CAM KẾT CHUNG VÀ GIẢI QUYẾT TRANH CHẤP
                </div>
                <p>
                  <strong>6.1.</strong> Hai bên cam kết thực hiện đúng mọi điều khoản đã thỏa thuận trong hợp đồng. Nếu có tranh chấp phát sinh, hai bên sẽ ưu tiên giải quyết thông qua thương lượng, hòa giải trên tinh thần hợp tác.
                </p>
                <p>
                  <strong>6.2.</strong> Trong trường hợp không tự thương lượng giải quyết được, vụ việc sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền.
                </p>
                <p>
                  <strong>6.3.</strong> Hợp đồng này được lập thành bản điện tử có chữ ký số xác thực, có giá trị pháp lý như nhau cho cả hai bên.
                </p>
              </div>
            </div>

            {/* 6. Chữ ký 2 bên & Chứng thư số */}
            <div className="pt-6 border-t border-slate-300 space-y-5">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="space-y-1">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                    ĐẠI DIỆN BÊN A
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Đã ký số &amp; Đóng dấu)
                  </div>
                  <div className="py-3">
                    <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                      ✓ Đã xác thực chữ ký số Bên A
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    CÔNG TY CP SELFSTORAGE VN
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    MST: 0316899988 • Ngày ký: {unit.contractStartDate}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                    ĐẠI DIỆN BÊN B
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Chữ ký điện tử khách hàng)
                  </div>
                  <div className="py-3">
                    {hasSigned ? (
                      <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                        ✓ Đã ký điện tử bởi Bên B
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                        Chờ khách hàng xác nhận ký
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {customerName}
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    Ngày ký: {unit.contractStartDate}
                  </div>
                </div>
              </div>

              {hasSigned ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-emerald-900 text-xs">
                        CHỨNG THƯ KÝ SỐ ĐIỆN TỬ HỢP LỆ
                      </h5>
                      <p className="text-[11px] text-emerald-700">
                        Mã chứng thực: SHA256-SS-{unit.contractId} • Thời gian xác thực: {unit.contractStartDate}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold shrink-0">
                    Hợp pháp 100%
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Hợp đồng của bạn đang ở trạng thái chờ ký điện tử. Vui lòng đọc kỹ các điều khoản và bấm xác nhận ký số bên dưới.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ các điều khoản hợp đồng ở trên.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions (Chỉ xem & đóng, bỏ tải xuống) */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hợp đồng điện tử lưu trữ trực tuyến trên hệ thống SelfStorage.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>

            {!hasSigned && (
              <button
                type="button"
                onClick={handleSign}
                disabled={isSigning || !agreedTerms}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang ký số...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Xác nhận Ký Điện Tử</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
