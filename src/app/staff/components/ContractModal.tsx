'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
} from 'lucide-react';
import { CheckInAppointment } from '../types';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment;
  assignedUnit: string;
  onPrint: () => void;
}

export default function ContractModal({
  isOpen,
  onClose,
  appointment,
  assignedUnit,
  onPrint,
}: ContractModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const finalUnit = assignedUnit || appointment.assignedUnit;
  const contractNumber = appointment.contractCode || `SS-HĐ-${appointment.id.replace(/[^a-zA-Z0-9]/g, '')}/2026`;

  // Calculate contract dates
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = String(today.getFullYear());

  // Hàm in / xuất file PDF chuẩn A4 văn bản pháp lý (dùng hidden iframe chống chặn pop-up)
  const handlePrintPdf = (asDownload: boolean = false) => {
    const contentHtml = printContentRef.current?.innerHTML || '';
    if (!contentHtml) return;

    let iframe = document.getElementById('contract-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'contract-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hop-Dong-Thue-Kho-${finalUnit}.pdf</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: "Times New Roman", Times, Georgia, serif;
              font-size: 12.5pt;
              line-height: 1.45;
              color: #111;
              background: #fff;
              margin: 0;
              padding: 5px;
            }
            h1, h2, h3 { text-align: center; margin: 5px 0 10px 0; }
            .text-center { text-align: center; }
            .uppercase { text-transform: uppercase; }
            .font-bold, strong { font-weight: bold; }
            .italic { font-style: italic; }
            .border-t { border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
            .border-b { border-bottom: 1px solid #eee; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .signature-block { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; }
            .signature-col { padding: 10px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div style="max-width: 780px; margin: 0 auto; padding: 10px;">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print iframe error:', e);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Hợp Đồng Cho Thuê Kho Bãi & Nhà Xưởng
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-[#4f39f6] border border-indigo-200">
                Mẫu Luật Việt Nam 2026
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mẫu số 01/HĐ-TK • Tuân thủ Luật Kinh doanh Bất động sản và Bộ luật Dân sự
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl text-lg leading-none hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Legal Contract Form (Mẫu Chuẩn Luật Việt Nam) */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 font-sans leading-relaxed bg-slate-100/50">
          {/* Paper Sheet Container (Mô phỏng tài liệu pháp lý A4 trang trọng) */}
          <div
            ref={printContentRef}
            className="bg-white max-w-3xl mx-auto p-8 sm:p-14 rounded-2xl shadow-md border border-slate-200 space-y-7 text-xs sm:text-sm text-slate-800"
          >
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
            <div className="text-center space-y-1.5 pt-2">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-950 tracking-tight uppercase">
                HỢP ĐỒNG CHO THUÊ NHÀ XƯỞNG VÀ KHO BÃI
              </h1>
              <div className="tabular-nums text-xs text-[#4f39f6] font-semibold">
                Số: {contractNumber}
              </div>
              <p className="text-xs text-slate-500 italic pt-1">
                Hôm nay, ngày {dayStr} tháng {monthStr} năm {yearStr}, tại Trụ sở Ban Quản lý Cơ sở Kho Tự Quản SelfStorage:
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Địa điểm ký kết: {appointment.facilityAddress || 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 pt-1">
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Tên tổ chức: </span>
                  <strong className="text-slate-900">CÔNG TY CỔ PHẦN DỊCH VỤ LƯU TRỮ VÀ KHO TỰ QUẢN SELFSTORAGE VIỆT NAM</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Địa chỉ trụ sở chính: </span>
                  <span>Tòa nhà Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh</span>
                </div>
                <div>
                  <span className="text-slate-500">Giấy phép ĐKKD số: </span>
                  <span className="tabular-nums font-bold text-slate-900">0316899988</span> (Sở KH&ĐT cấp)
                </div>
                <div>
                  <span className="text-slate-500">Mã số thuế: </span>
                  <span className="tabular-nums font-bold text-slate-900">0316899988</span>
                </div>
                <div>
                  <span className="text-slate-500">Người đại diện: </span>
                  <strong>Ban Quản Lý Cơ Sở Kho Bãi</strong>
                </div>
                <div>
                  <span className="text-slate-500">Chức vụ: </span>
                  <span>Đại diện vận hành & Bàn giao</span>
                </div>
                <div>
                  <span className="text-slate-500">Điện thoại hotline: </span>
                  <span className="font-semibold text-slate-900">1900 6868</span>
                </div>
                <div>
                  <span className="text-slate-500">Email: </span>
                  <span className="text-[#4f39f6]">contact@selfstorage.vn</span>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Tài khoản thanh toán: </span>
                  <span className="tabular-nums font-bold text-slate-900">0900000000</span> tại Ngân hàng TMCP Quân Đội (MBBank)
                </div>
              </div>
            </div>

            {/* 4. Bên B: Bên Thuê */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="font-extrabold text-slate-900 uppercase">
                BÊN THUÊ NHÀ XƯỞNG VÀ KHO BÃI (Gọi tắt là Bên B):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500">Họ và tên khách hàng: </span>
                  <strong className="text-slate-950 text-sm">{appointment.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Số điện thoại liên hệ: </span>
                  <span className="font-semibold text-slate-900">{appointment.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Thư điện tử (Email): </span>
                  <span className="text-blue-600">{appointment.email}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Địa chỉ liên hệ: </span>
                  <span>{appointment.facilityAddress || 'Việt Nam'}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic">
              Sau khi cùng nhau bàn bạc, thỏa thuận trên tinh thần tự nguyện, bình đẳng và tuân thủ quy định pháp luật, hai Bên thống nhất ký kết Hợp đồng cho thuê nhà xưởng và kho bãi với các điều khoản chi tiết sau đây:
            </p>

            {/* 5. Các điều khoản hợp đồng chuẩn mẫu */}
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Điều 1 */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900">
                  Điều 1. ĐỐI TƯỢNG VÀ NỘI DUNG HỢP ĐỒNG
                </div>
                <p>
                  <strong>1.1.</strong> Bên A đồng ý cho thuê và Bên B đồng ý thuê phần diện tích kho bãi tự quản mang mã định danh duy nhất: <strong>Ô #{finalUnit}</strong>, bố trí tại <strong>{appointment.preferredFloor}</strong>, thuộc cơ sở <strong>{appointment.facilityName}</strong> (Địa chỉ: {appointment.facilityAddress}).
                </p>
                <p>
                  <strong>1.2.</strong> Quy cách ngăn kho: Loại hình {appointment.unitType}, diện tích sử dụng <strong>{appointment.unitSize}</strong>, chiều cao trần 2.8m. Kết cấu ngăn vách tiêu chuẩn chịu lực, bề mặt khô ráo, trang bị hệ thống thông gió/điều hòa nhiệt độ & độ ẩm tự động, hệ thống PCCC đạt chuẩn và camera AI an ninh giám sát 24/7.
                </p>
                <p>
                  <strong>1.3. Mục đích sử dụng:</strong> {appointment.purpose}. Bên B cam kết chỉ sử dụng kho cho mục đích lưu giữ đồ đạc, tài sản và hàng hóa hợp pháp. Tuyệt đối không lưu trữ hàng cấm, vũ khí, chất cháy nổ, hóa chất độc hại, động vật sống hoặc các chất bị cấm theo quy định của pháp luật Việt Nam.
                </p>
              </div>

              {/* Điều 2 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 2. THỜI HẠN CỦA HỢP ĐỒNG VÀ GIA HẠN
                </div>
                <p>
                  <strong>2.1.</strong> Thời hạn thuê kho là <strong>{appointment.durationMonths} tháng</strong>, bắt đầu tính từ ngày <strong>{appointment.startDate}</strong> đến hết ngày kết thúc hợp đồng theo biên lai thanh toán.
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
                  <strong>3.1. Giá thuê kho:</strong> <strong>{appointment.monthlyRent}</strong> (Đã bao gồm thuế GTGT 10%, phí an ninh giám sát 24/7 và phí quản lý bảo trì cơ sở).
                </p>
                <p>
                  <strong>3.2. Tiền đặt cọc bảo đảm:</strong> <strong>{appointment.depositAmount}</strong> (Tương đương 100% tiền đặt cọc quy định). Bên B đã hoàn tất thanh toán khoản tiền cọc này qua cổng thanh toán trực tuyến.
                </p>
                <p>
                  <strong>3.3. Phương thức thanh toán:</strong> Thanh toán chuyển khoản tự động qua hệ thống mã VietQR/SePay hoặc thẻ tín dụng. Kỳ thanh toán vào ngày đầu mỗi chu kỳ thuê. Bên A có trách nhiệm xuất hóa đơn điện tử VAT hợp pháp cho Bên B.
                </p>
              </div>

              {/* Điều 4 */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="font-extrabold text-slate-900">
                  Điều 4. QUẢN LÝ KHÓA THÔNG MINH (SMART LOCK IOT) & TRUY CẬP
                </div>
                <p>
                  <strong>4.1.</strong> Ngăn kho được trang bị khóa điện tử thông minh Keypad Smart Lock. Bên B được quyền ra vào cơ sở và mở khóa kho 24/7 bằng mã số điện tử cá nhân hoặc Thẻ từ RFID.
                </p>
                <p>
                  <strong>4.2. Mã số mở khóa ban đầu:</strong> <span className="tabular-nums font-bold text-base text-[#4f39f6] bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">{appointment.accessPin || '682914'}</span>. Bên B có toàn quyền chủ động tự thay đổi mã số này trên ứng dụng bất kỳ lúc nào.
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
                  <p>• Bàn giao ngăn kho sạch sẽ, hệ thống khóa thông minh và cơ sở vật chất hoạt động tốt ngay sau khi ký hợp đồng (kèm Biên bản bàn giao và hình ảnh hiện trạng đính kèm).</p>
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
                  <strong>6.2.</strong> Trong trường hợp không tự thương lượng giải quyết được, vụ việc sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền. Quyết định của Tòa án là phán quyết cuối cùng mà hai bên có nghĩa vụ chấp hành.
                </p>
                <p>
                  <strong>6.3.</strong> Hợp đồng này được lập thành 02 bản bằng tiếng Việt (hoặc bản điện tử có chữ ký số xác thực), có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để làm căn cứ thực hiện.
                </p>
              </div>
            </div>

            {/* 6. Chữ ký 2 bên (Format chuẩn văn bản) */}
            <div className="pt-8 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="space-y-1">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                    ĐẠI DIỆN BÊN A
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Ký, đóng dấu hoặc Chữ ký số)
                  </div>
                  <div className="pt-6 pb-2">
                    <div className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                      [ĐÃ KÝ SỐ ĐIỆN TỬ]
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    CÔNG TY CP SELFSTORAGE VN
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    MST: 0316899988 • Time: {dayStr}/{monthStr}/{yearStr}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                    ĐẠI DIỆN BÊN B
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="pt-6 pb-2">
                    <div className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-bold">
                      [XÁC THỰC OTP THÀNH CÔNG]
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {appointment.customerName}
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    SĐT: {appointment.phone} • Ngày ký: {dayStr}/{monthStr}/{yearStr}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hợp đồng có hiệu lực pháp lý ngay sau khi bàn giao mã mở khóa kho.</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng xem trước
            </button>
            <button
              onClick={() => handlePrintPdf(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Xuất hợp đồng sang định dạng PDF chuẩn A4"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải PDF Hợp Đồng</span>
            </button>
            <button
              onClick={() => handlePrintPdf(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Hợp Đồng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
