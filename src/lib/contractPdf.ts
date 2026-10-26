/**
 * Contract PDF Export Utility
 * Generates an official, beautifully styled A4 legal contract document and triggers print/PDF download
 * Uses an isolated hidden iframe to prevent popup-blockers.
 */

export interface ContractPdfData {
  contractCode: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCitizenId?: string;
  facilityName: string;
  facilityAddress?: string;
  unitNumber: string;
  unitType?: string;
  dimensions?: string;
  area?: string;
  startDate: string;
  endDate: string;
  monthlyRent: string | number;
  depositAmount?: string | number;
  isSigned?: boolean;
  signedAt?: string;
}

export function downloadContractPdf(data: ContractPdfData): void {
  const finalCode = data.contractCode || 'HD-SELFSTORAGE';
  const fileName = `Hop-Dong-Thue-Kho-${finalCode.replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`;

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
  if (!doc) {
    window.print();
    return;
  }

  const rentDisplay = typeof data.monthlyRent === 'number'
    ? `${data.monthlyRent.toLocaleString('vi-VN')} đ/tháng`
    : data.monthlyRent;

  const depositDisplay = typeof data.depositAmount === 'number'
    ? `${data.depositAmount.toLocaleString('vi-VN')} đ`
    : data.depositAmount || rentDisplay;

  const signedDateDisplay = data.signedAt || data.startDate || new Date().toLocaleDateString('vi-VN');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${fileName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #0f172a;
            font-family: "Times New Roman", Times, Georgia, serif;
            font-size: 11pt;
            line-height: 1.5;
          }
          .header-national {
            text-align: center;
            margin-bottom: 18px;
          }
          .header-national h4 {
            margin: 0;
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-national h5 {
            margin: 2px 0 0 0;
            font-size: 11pt;
            font-weight: normal;
          }
          .header-line {
            width: 160px;
            height: 1px;
            background: #333;
            margin: 5px auto 0 auto;
          }
          .doc-title {
            text-align: center;
            margin: 20px 0 6px 0;
          }
          .doc-title h2 {
            margin: 0;
            font-size: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
          }
          .doc-subtitle {
            text-align: center;
            font-style: italic;
            font-size: 10pt;
            color: #475569;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 14px 0 6px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            color: #1e293b;
          }
          .grid-two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 10px;
          }
          .info-row {
            margin-bottom: 4px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            min-width: 140px;
          }
          .box-highlight {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin: 10px 0;
          }
          p {
            text-align: justify;
            margin: 4px 0;
          }
          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .stamp-box {
            display: inline-block;
            border: 2px dashed #0284c7;
            background: #f0f9ff;
            color: #0369a1;
            padding: 8px 16px;
            border-radius: 8px;
            margin-top: 14px;
            font-size: 10pt;
            font-weight: bold;
          }
          .footer-note {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
            font-size: 9pt;
            color: #64748b;
            text-align: center;
            font-style: italic;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-national">
          <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
          <h5>Độc lập – Tự do – Hạnh phúc</h5>
          <div class="header-line"></div>
        </div>

        <div class="doc-title">
          <h2>HỢP ĐỒNG DỊCH VỤ THUÊ KHO TỰ QUẢN THÔNG MINH</h2>
          <div class="doc-subtitle">Mã Hợp Đồng: #${finalCode} • Tỷ lệ lưu kho 1:1</div>
        </div>

        <div class="section-title">I. CÁC BÊN THAM GIA HỢP ĐỒNG</div>
        
        <div class="grid-two">
          <div class="box-highlight">
            <div style="font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #0284c7;">BÊN CHO THUÊ (BÊN A):</div>
            <div class="info-row"><strong>Đơn vị:</strong> HỆ THỐNG KHO TỰ PHỤC VỤ SELFSTORAGE VN</div>
            <div class="info-row"><strong>Chi nhánh:</strong> ${data.facilityName}</div>
            <div class="info-row"><strong>Địa chỉ kho:</strong> ${data.facilityAddress || 'TP. Hồ Chí Minh'}</div>
            <div class="info-row"><strong>Hotline 24/7:</strong> 1900 6868 - 028 7770 0120</div>
            <div class="info-row"><strong>Email:</strong> support@selfstorage.vn</div>
          </div>

          <div class="box-highlight">
            <div style="font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #0284c7;">BÊN THUÊ (BÊN B):</div>
            <div class="info-row"><strong>Họ và tên:</strong> ${data.customerName || 'Quý khách hàng'}</div>
            <div class="info-row"><strong>Số điện thoại:</strong> ${data.customerPhone || 'Theo thông tin đăng ký tài khoản'}</div>
            <div class="info-row"><strong>Email liên hệ:</strong> ${data.customerEmail || 'Theo tài khoản cá nhân'}</div>
            <div class="info-row"><strong>Căn cước / Mã số thuế:</strong> ${data.customerCitizenId || 'Đã xác thực điện tử'}</div>
            <div class="info-row"><strong>Phương thức xác thực:</strong> OTP SMS / Chữ ký số điện tử</div>
          </div>
        </div>

        <div class="section-title">II. THÔNG TIN PHÒNG KHO VÀ ĐƠN GIÁ THUÊ</div>
        <div class="box-highlight">
          <div class="grid-two">
            <div>
              <div class="info-row"><span class="info-label">Mã ngăn kho:</span> <strong>${data.unitNumber}</strong></div>
              <div class="info-row"><span class="info-label">Loại ngăn kho:</span> ${data.unitType || 'Kho tự quản thông minh'}</div>
              <div class="info-row"><span class="info-label">Kích thước (D x R x C):</span> ${data.dimensions || 'Tiêu chuẩn'}</div>
              <div class="info-row"><span class="info-label">Diện tích sàn:</span> ${data.area || 'Tiêu chuẩn'}</div>
            </div>
            <div>
              <div class="info-row"><span class="info-label">Thời hạn thuê:</span> <strong>${data.startDate} đến ${data.endDate}</strong></div>
              <div class="info-row"><span class="info-label">Đơn giá thuê:</span> <strong style="color: #ea580c;">${rentDisplay}</strong></div>
              <div class="info-row"><span class="info-label">Tiền cọc bảo đảm:</span> <strong>${depositDisplay}</strong></div>
              <div class="info-row"><span class="info-label">Quyền truy cập:</span> Khóa thông minh Smart Lock 24/7</div>
            </div>
          </div>
        </div>

        <div class="section-title">III. QUY CHẾ VẬN HÀNH & ĐIỀU KHOẢN CAM KẾT</div>
        <p><strong>Điều 1. Mục đích sử dụng:</strong> Bên B chỉ sử dụng ngăn kho để lưu trữ đồ đạc cá nhân, hàng hóa thương mại hợp pháp. Nghiêm cấm tuyệt đối hàng cấm, chất gây cháy nổ, vũ khí, hóa chất độc hại, sinh vật sống, rác thải hoặc đồ vật vi phạm pháp luật.</p>
        <p><strong>Điều 2. Quản lý an ninh & khóa thông minh:</strong> Ngăn kho được bảo vệ bằng hệ thống khóa điện tử mã PIN độc quyền và kiểm soát cửa tự động 24/7. Bên B có trách nhiệm tự bảo mật mã khóa cá nhân.</p>
        <p><strong>Điều 3. Gia hạn hợp đồng:</strong> Trước ngày hết hạn hợp đồng ít nhất 03 ngày, Bên B có thể thực hiện gia hạn trực tuyến qua hệ thống hoặc đăng ký với Ban Quản Lý.</p>
        <p><strong>Điều 4. Trả kho và hoàn tiền cọc:</strong> Khi kết thúc hợp đồng hoặc có nhu cầu trả kho, Bên B thực hiện quy trình trả kho trực tuyến, bàn giao mặt bằng kho sạch sẽ nguyên vẹn. Tiền cọc sẽ được hoàn trả đầy đủ vào tài khoản ngân hàng của Bên B trong vòng 24 - 48 giờ làm việc sau nghiệm thu.</p>

        <div class="signature-section">
          <div>
            <strong>ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</strong>
            <div style="font-size: 10pt; color: #64748b; margin-top: 2px;">CÔNG TY CP GIẢI PHÁP KHO TỰ PHỤC VỤ</div>
            <div class="stamp-box">
              ✓ ĐÃ XÁC THỰC KÝ DUYỆT<br/>
              <span style="font-size: 8pt; font-weight: normal; color: #0284c7;">HỆ THỐNG TỰ ĐỘNG SELFSTORAGE VN</span>
            </div>
          </div>

          <div>
            <strong>ĐẠI DIỆN BÊN THUÊ (BÊN B)</strong>
            <div style="font-size: 10pt; color: #64748b; margin-top: 2px;">KHÁCH HÀNG THUÊ KHO</div>
            <div class="stamp-box" style="border-color: #16a34a; background: #f0fdf4; color: #15803d;">
              ${data.isSigned !== false ? '✓ ĐÃ KÝ SỐ ĐIỆN TỬ' : 'CHỜ KÝ SỐ'}<br/>
              <span style="font-size: 8pt; font-weight: normal; color: #16a34a;">${data.customerName || 'Khách hàng'} • ${signedDateDisplay}</span>
            </div>
          </div>
        </div>

        <div class="footer-note">
          Văn bản hợp đồng điện tử được tạo tự động từ Hệ thống Quản trị Kho SelfStorage. Có giá trị pháp lý theo Luật Giao dịch điện tử.
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Lỗi khi in hoặc tải PDF:', e);
    }
  }, 300);
}
