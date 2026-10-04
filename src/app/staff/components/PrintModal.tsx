'use client';

import React from 'react';
import { Printer, Boxes, Download, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment;
  assignedUnit: string;
  customPin: string;
  onConfirmPrint?: () => void;
}

export default function PrintModal({
  isOpen,
  onClose,
  appointment,
  assignedUnit,
  customPin,
  onConfirmPrint,
}: PrintModalProps) {
  if (!isOpen) return null;

  const finalUnit = assignedUnit || appointment.assignedUnit;
  const finalPin = customPin || appointment.accessPin;
  const currentDate = new Date().toLocaleDateString('vi-VN');

  // Hàm xuất bản in / Lưu PDF chuẩn A4
  const handlePrintDocument = (isPdfSave: boolean = false) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Trình duyệt đã chặn cửa sổ in pop-up. Vui lòng cho phép pop-up để in hoặc tải PDF.');
      return;
    }

    const docTitle = isPdfSave
      ? `Phieu-Ban-Giao-Kho-${finalUnit}.pdf`
      : `In-Phieu-Ban-Giao-${finalUnit}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 18mm 20mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #111827;
              line-height: 1.5;
              font-size: 13pt;
              margin: 0;
              padding: 20px;
              background: #fff;
            }
            .header-national {
              text-align: center;
              margin-bottom: 20px;
            }
            .header-national h4 {
              margin: 0;
              font-size: 13pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            .header-national h5 {
              margin: 4px 0 0 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .header-national .divider {
              width: 160px;
              height: 1.5px;
              background: #000;
              margin: 8px auto 0 auto;
            }
            .doc-title {
              text-align: center;
              margin: 25px 0 15px 0;
            }
            .doc-title h2 {
              margin: 0;
              font-size: 17pt;
              font-weight: bold;
              text-transform: uppercase;
              color: #0f172a;
            }
            .doc-title p {
              margin: 4px 0 0 0;
              font-size: 11pt;
              font-style: italic;
              color: #475569;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .info-table td {
              padding: 6px 4px;
              vertical-align: top;
            }
            .info-table .label {
              width: 32%;
              font-weight: bold;
              color: #334155;
            }
            .pin-box {
              border: 2px dashed #0284c7;
              background-color: #f0f9ff;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              margin: 20px 0;
            }
            .pin-code {
              font-size: 26pt;
              font-weight: bold;
              letter-spacing: 6px;
              color: #0369a1;
              font-family: monospace;
              margin: 6px 0;
            }
            .rules {
              font-size: 11pt;
              color: #334155;
              margin: 15px 0;
            }
            .rules li {
              margin-bottom: 4px;
            }
            .signature-block {
              margin-top: 35px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              text-align: center;
            }
            .signature-col {
              padding: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div style="max-width: 750px; margin: 0 auto;">
            <div class="header-national">
              <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <h5>Độc lập - Tự do - Hạnh phúc</h5>
              <div class="divider"></div>
            </div>

            <div class="doc-title">
              <h2>BIÊN BẢN BÀN GIAO Ô KHO &amp; THẺ TRUY CẬP</h2>
              <p>Mã đặt chỗ: #${appointment.id} • Ngày lập: ${currentDate}</p>
            </div>

            <table class="info-table">
              <tr>
                <td class="label">Bên Giao (SelfStorage VN):</td>
                <td>Chi nhánh Quầy Dịch vụ Khách hàng</td>
              </tr>
              <tr>
                <td class="label">Khách hàng (Bên Nhận):</td>
                <td><strong>${appointment.customerName}</strong></td>
              </tr>
              <tr>
                <td class="label">Số điện thoại:</td>
                <td>${appointment.phone}</td>
              </tr>
              <tr>
                <td class="label">Email liên hệ:</td>
                <td>${appointment.email}</td>
              </tr>
              <tr>
                <td class="label">Mã số ô kho bàn giao:</td>
                <td><strong style="font-size: 15pt; color: #1d4ed8;">#${finalUnit}</strong> (${appointment.unitType} - ${appointment.unitSize})</td>
              </tr>
              <tr>
                <td class="label">Ngày bắt đầu thuê:</td>
                <td>${appointment.startDate}</td>
              </tr>
              <tr>
                <td class="label">Thời hạn thuê:</td>
                <td>${appointment.durationMonths || 1} tháng</td>
              </tr>
            </table>

            <div class="pin-box">
              <div style="font-size: 11pt; text-transform: uppercase; font-weight: bold; color: #0284c7;">
                MÃ PIN BẢO MẬT MỞ KHÓA Ô KHO #${finalUnit}
              </div>
              <div class="pin-code">${finalPin}</div>
              <div style="font-size: 10.5pt; color: #475569;">
                Nhập 6 chữ số này trên bàn phím số gắn tại cửa kho và nhấn nút <strong>#</strong> để mở khóa.
              </div>
            </div>

            <div class="rules">
              <strong>* Hướng dẫn &amp; Quy định lưu kho:</strong>
              <ul>
                <li>Không lưu trữ hàng cấm, vũ khí, hóa chất dễ cháy nổ, đồ tươi sống.</li>
                <li>Khách hàng bảo mật tuyệt đối mã PIN, không chia sẻ cho người không có thẩm quyền.</li>
                <li>Kho được bảo vệ 24/7 bằng camera an ninh và cảm biến môi trường.</li>
                <li>Mọi hỗ trợ khẩn cấp vui lòng liên hệ hotline ban quản lý: <strong>1900 6868</strong>.</li>
              </ul>
            </div>

            <div class="signature-block">
              <div class="signature-col">
                <strong>ĐẠI DIỆN BÊN GIAO</strong><br />
                <span style="font-size: 10.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
                <div style="height: 70px;"></div>
                <strong>Nhân Viên Lễ Tân</strong>
              </div>
              <div class="signature-col">
                <strong>KHÁCH HÀNG (BÊN NHẬN)</strong><br />
                <span style="font-size: 10.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
                <div style="height: 70px;"></div>
                <strong>${appointment.customerName}</strong>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);

    if (onConfirmPrint) {
      onConfirmPrint();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Xuất Phiếu Bàn Giao &amp; Cấp Mã Truy Cập
              </h3>
              <p className="text-[11px] text-slate-500">Định dạng chuẩn A4 hoặc tải file PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Preview Sheet */}
        <div className="p-6 space-y-4">
          <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase">
                <Boxes className="w-4 h-4 text-blue-600" />
                PHIẾU BÀN GIAO &amp; TRUY CẬP KHO
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                A4 Chuẩn PDF
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Khách hàng:</span>
                <div className="font-bold text-slate-900">{appointment.customerName}</div>
                <div className="text-[11px] text-slate-500">{appointment.phone}</div>
              </div>
              <div>
                <span className="text-slate-400">Số ô kho:</span>
                <div className="font-bold text-blue-600 text-base">
                  #{finalUnit}
                </div>
                <div className="text-[11px] text-slate-500">{appointment.unitSize}</div>
              </div>
            </div>

            {/* Big PIN for Customer */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Mã PIN mở khóa ô kho (Smart Lock)
              </div>
              <div className="text-2xl tabular-nums font-extrabold tracking-widest text-slate-900 mt-1">
                {finalPin}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dùng nhập tại bàn phím số gắn trên cửa kho</div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Phiếu có giá trị bàn giao &amp; lưu trữ pháp lý
              </span>
              <span className="text-emerald-600 font-semibold">Sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {/* Tải PDF */}
          <button
            onClick={() => handlePrintDocument(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Tải về định dạng PDF"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tải File PDF</span>
          </button>

          {/* In trực tiếp */}
          <button
            onClick={() => handlePrintDocument(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Tài Liệu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
