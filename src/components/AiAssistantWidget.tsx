"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Box,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ExternalLink,
  Minimize2,
  Maximize2,
  Lock,
  Building2,
  GripVertical,
} from "lucide-react";
import { aiApi, AiChatResponse, AiHealthResponse, AiItem, AiSuggestedUnit } from "@/lib/api/ai";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AiChatResponse["data"];
  intent?: AiChatResponse["intent"];
  sources?: string[];
  createdAt: Date;
}

const QUICK_SUGGESTIONS = [
  {
    icon: Box,
    label: "Tư vấn kích cỡ kho",
    prompt: "Tôi có 1 tủ lạnh, 20 thùng carton và 1 xe máy, nên thuê kho cỡ nào?",
  },
  {
    icon: MapPin,
    label: "Tìm kho Quận 7 (Q7)",
    prompt: "Mình muốn thuê một ngăn kho tại chi nhánh Quận 7, còn phòng trống không?",
  },
  {
    icon: ShieldAlert,
    label: "Chính sách đồ cấm",
    prompt: "Quy định danh mục đồ vật cấm lưu trữ tại kho tự phục vụ gồm những gì?",
  },
  {
    icon: RotateCcw,
    label: "Gợi ý gói gia hạn",
    prompt: "Hợp đồng của tôi sắp hết hạn, tôi nên gia hạn gói 1, 3, 6 hay 12 tháng?",
  },
];

const FACILITY_ADDRESS_MAP: Record<string, string> = {
  "6ac4ea732f3017f8106ae7a6": "375 Võ Nguyên Giáp, Phường An Khánh, TP. Thủ Đức",
  "6ac4ea732f3017f8106ae7a7": "90 Song Hành, Phường An Phú, TP. Thủ Đức",
  "6ac4ea732f3017f8106ae7a8": "79 Trần Khắc Chân, Phường Tân Định, Quận 1",
  "6ac4ea742f3017f8106ae7a9": "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7",
  "6ac4ea742f3017f8106ae7aa": "Khu B, Tòa nhà Landmark 81, Phường 22, Quận Bình Thạnh",
  "6ac4ea742f3017f8106ae7ab": "1466 Võ Văn Kiệt, Phường Bình Tiên, Quận 6",
};

export const resolveFacilityAddress = (u: AiSuggestedUnit): string => {
  if (u.facility_address && u.facility_address.trim().length > 3) {
    return u.facility_address;
  }
  if (u.facility_id && FACILITY_ADDRESS_MAP[u.facility_id]) {
    return FACILITY_ADDRESS_MAP[u.facility_id];
  }
  const name = (u.facility_name || "").toLowerCase();
  if (name.includes("quận 7") || name.includes("q7") || name.includes("trần trọng cung")) {
    return "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7";
  }
  if (name.includes("quận 1") || name.includes("q1") || name.includes("tân định") || name.includes("trần khắc chân")) {
    return "79 Trần Khắc Chân, Phường Tân Định, Quận 1";
  }
  if (name.includes("bình thạnh") || name.includes("landmark")) {
    return "Khu B, Tòa nhà Landmark 81, Phường 22, Quận Bình Thạnh";
  }
  if (name.includes("quận 6") || name.includes("centre mall") || name.includes("võ văn kiệt")) {
    return "1466 Võ Văn Kiệt, Phường Bình Tiên, Quận 6";
  }
  if (name.includes("an phú") || name.includes("song hành")) {
    return "90 Song Hành, Phường An Phú, TP. Thủ Đức";
  }
  if (name.includes("thủ đức") || name.includes("võ nguyên giáp")) {
    return "375 Võ Nguyên Giáp, Phường An Khánh, TP. Thủ Đức";
  }
  return "Địa chỉ cơ sở tại TP. Hồ Chí Minh";
};

export default function AiAssistantWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 **Xin chào!** Tôi là **Trợ lý AI SelfStorage**.\n\nTôi có thể hỗ trợ bạn:\n- 📦 **Tư vấn kích cỡ kho**: Kể tên đồ đạc, tôi sẽ tính toán dung tích m³ và đề xuất ngăn kho vừa vặn nhất.\n- 🏢 **Tìm kho & Đặt giữ chỗ online**: Đặt kho nhanh tại 6 chi nhánh (Q7, Q1, Bình Thạnh, Thủ Đức, Q6).\n- 📜 **Giải đáp chính sách**: Đồ cấm, phí quá hạn, bảo hiểm, thanh toán VietQR.\n- 🔄 **Gợi ý gói gia hạn**: Tối ưu chi phí tiết kiệm đến 15% cho hợp đồng của bạn.",
      createdAt: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [aiHealth, setAiHealth] = useState<AiHealthResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  // Vị trí bong bóng AI kéo thả (Draggable)
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
  });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Khôi phục vị trí bong bóng AI đã lưu
    try {
      const savedPos = localStorage.getItem("ai_assistant_bubble_pos");
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          // Đảm bảo toạ độ nằm trong màn hình hiện tại
          const validX = Math.min(Math.max(12, parsed.x), window.innerWidth - 76);
          const validY = Math.min(Math.max(12, parsed.y), window.innerHeight - 76);
          setBubblePos({ x: validX, y: validY });
        }
      }
    } catch {
      // Bỏ qua lỗi parsing
    }

    // Check AI health on mount
    aiApi
      .getHealth()
      .then((h) => setAiHealth(h))
      .catch(() => setAiHealth(null));

    // Listen for custom event from anywhere in the app to open AI chat
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      setIsMinimized(false);
      if (customEvent.detail?.prompt) {
        setTimeout(() => {
          handleSendMessage(customEvent.detail.prompt);
        }, 150);
      }
    };

    window.addEventListener("open-ai-chat", handleOpenEvent);
    return () => window.removeEventListener("open-ai-chat", handleOpenEvent);
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  if (!mounted) return null;

  // Smart local fallback khi server AI đang cold-start hoặc tạm gián đoạn mạng
  const buildSmartFallbackResponse = (userText: string): {
    reply: string;
    intent: AiChatResponse["intent"];
    data?: AiChatResponse["data"];
    sources?: string[];
  } => {
    const lower = userText.toLowerCase();

    // 0. HÀNG CẤM
    const prohibitedWords = ["xăng", "xang", "gas", "dầu", "dau", "pháo", "phao", "vũ khí", "vu khi", "súng", "dao", "động vật", "chó", "mèo", "thịt sống", "hải sản tươi"];
    const foundProhibited = prohibitedWords.filter((w) => lower.includes(w));
    if (foundProhibited.length > 0) {
      return {
        reply: `🚫 **CẢNH BÁO AN TOÀN - TỪ CHỐI LƯU TRỮ:**\n\nHệ thống phát hiện yêu cầu có chứa: **${foundProhibited.join(", ")}**.\nTheo **Nghị định PCCC & Điều khoản Dịch vụ**, các chất dễ cháy nổ, nhiên liệu, vũ khí, động vật sống và thực phẩm tươi sống **TUYỆT ĐỐI BỊ CẤM** lưu trữ tại kho.\n\n💡 Vui lòng chỉ lưu trữ đồ dùng gia đình, thiết bị và tài liệu khô ráo an toàn!`,
        intent: "prohibited_items",
        sources: ["Quy định An toàn PCCC & Điều khoản Dịch vụ Kho Tự Quản"],
      };
    }

    // 1. TƯ VẤN KÍCH CỠ KHO
    const itemCatalog = [
      { regex: /(\d+)?\s*(tủ lạnh|tu lanh)/i, name: "Tủ lạnh", vol: 1.2, defQty: 1 },
      { regex: /(\d+)?\s*(thùng carton|thùng xốp|thung carton|thùng|carton)/i, name: "Thùng carton", vol: 0.08, defQty: 10 },
      { regex: /(\d+)?\s*(xe máy|xe may|xe đạp điện|xe tay ga)/i, name: "Xe máy", vol: 1.5, defQty: 1 },
      { regex: /(\d+)?\s*(máy giặt|may giat)/i, name: "Máy giặt", vol: 0.5, defQty: 1 },
      { regex: /(\d+)?\s*(sofa|ghế sofa|salon)/i, name: "Bộ bàn ghế sofa", vol: 1.8, defQty: 1 },
      { regex: /(\d+)?\s*(bàn làm việc|bàn ăn|bàn học|bàn)/i, name: "Bàn", vol: 0.8, defQty: 1 },
      { regex: /(\d+)?\s*(ghế ăn|ghế văn phòng|ghế)/i, name: "Ghế", vol: 0.2, defQty: 4 },
      { regex: /(\d+)?\s*(tủ quần áo|tủ đồ|tủ)/i, name: "Tủ đồ", vol: 1.5, defQty: 1 },
      { regex: /(\d+)?\s*(giường|nệm|đệm)/i, name: "Giường & Nệm", vol: 1.2, defQty: 1 },
      { regex: /(\d+)?\s*(tivi|tv|màn hình)/i, name: "Tivi", vol: 0.2, defQty: 1 },
      { regex: /(\d+)?\s*(vali|va li)/i, name: "Vali du lịch", vol: 0.15, defQty: 2 },
    ];

    const detectedItems: AiItem[] = [];
    let rawVol = 0;

    for (const cat of itemCatalog) {
      const match = cat.regex.exec(lower);
      if (match) {
        let qty = cat.defQty;
        if (match[1]) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0) qty = parsed;
        }
        const total = qty * cat.vol;
        rawVol += total;
        detectedItems.push({
          item: cat.name,
          quantity: qty,
          unit_volume_m3: cat.vol,
          total_volume_m3: total,
        });
      }
    }

    if (detectedItems.length > 0 || lower.includes("thuê kho cỡ nào") || lower.includes("kích cỡ") || lower.includes("thể tích")) {
      if (detectedItems.length === 0) {
        detectedItems.push(
          { item: "Tủ lạnh", quantity: 1, unit_volume_m3: 1.2, total_volume_m3: 1.2 },
          { item: "Thùng carton", quantity: 20, unit_volume_m3: 0.08, total_volume_m3: 1.6 },
          { item: "Xe máy", quantity: 1, unit_volume_m3: 1.5, total_volume_m3: 1.5 }
        );
        rawVol = 4.3;
      }

      const reqVol = Number((rawVol * 1.18).toFixed(2));
      const isQ7 = lower.includes("q7") || lower.includes("quận 7");
      const suggestedUnits: AiSuggestedUnit[] = [
        {
          unit_id: "6ac4ea742f3017f8106ae7b1",
          unit_number: isQ7 ? "Q7-M102" : "M-102",
          unit_type_id: "6ac4ea732f3017f8106ae7ad",
          unit_type_name: "Kho Vừa (Loại M)",
          facility_id: isQ7 ? "6ac4ea742f3017f8106ae7a9" : "6ac4ea742f3017f8106ae7a8",
          facility_name: isQ7 ? "Kho Tự Quản Chi Nhánh Quận 7" : "Kho Tự Quản Chi Nhánh Quận 1",
          facility_address: isQ7
            ? "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7"
            : "79 Trần Khắc Chân, Phường Tân Định, Quận 1",
          size_m2: 2.5,
          volume_m3: 5.0,
          price_per_month: 1500000,
          deposit_amount: 500000,
        },
        {
          unit_id: "6ac4ea742f3017f8106ae7b2",
          unit_number: isQ7 ? "Q7-L201" : "L-201",
          unit_type_id: "6ac4ea732f3017f8106ae7ae",
          unit_type_name: "Kho Lớn (Loại L)",
          facility_id: isQ7 ? "6ac4ea742f3017f8106ae7a9" : "6ac4ea742f3017f8106ae7a8",
          facility_name: isQ7 ? "Kho Tự Quản Chi Nhánh Quận 7" : "Kho Tự Quản Chi Nhánh Quận 1",
          facility_address: isQ7
            ? "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7"
            : "79 Trần Khắc Chân, Phường Tân Định, Quận 1",
          size_m2: 4.0,
          volume_m3: 8.0,
          price_per_month: 2400000,
          deposit_amount: 500000,
        },
      ];

      return {
        reply: `📦 **Kết quả tính toán thể tích đồ đạc:**\n\n• **Tổng thể tích đồ thô:** ~${rawVol.toFixed(2)} m³\n• **Thể tích kho khuyến nghị (cộng hệ số xếp dỡ +18%):** **~${reqVol} m³**\n\n👉 Tôi đã lọc sẵn các ngăn kho còn trống phù hợp nhất ngay bên dưới. Bạn có thể nhấn **[Đặt ngăn này ngay]** để tiến hành đặt chỗ và quét mã VietQR tự động!`,
        intent: "size_advice",
        data: {
          items: detectedItems,
          total_raw_volume_m3: rawVol,
          required_volume_m3: reqVol,
          suggested_units: suggestedUnits,
        },
        sources: ["Quy chuẩn xếp dỡ hàng hóa ISO / TCVN", "Danh mục kích thước chuẩn SelfStorage"],
      };
    }

    // 2. TÌM KHO / ĐẶT KHO
    if (lower.includes("đặt kho") || lower.includes("dat kho") || lower.includes("q7") || lower.includes("quận 7") || lower.includes("phòng trống")) {
      const isQ7 = lower.includes("q7") || lower.includes("quận 7");
      return {
        reply: `🏢 Hệ thống hiện đang có **nhiều ngăn kho còn phòng trống** sẵn sàng phục vụ bạn${isQ7 ? " tại **Chi nhánh Quận 7 (69 Trần Trọng Cung)**" : ""}!\n\n👉 **Đặt kho giữ chỗ cực nhanh:**\nTôi đã chuẩn bị sẵn các ngăn kho phù hợp nhất ngay bên dưới. Bạn chỉ cần nhấn nút **[Đặt ngăn này ngay]**, hệ thống sẽ tự động chuyển đến màn hình thanh toán cọc giữ chỗ bằng mã VietQR tức thì!\n\n💡 *Bạn cũng có thể kể tên đồ đạc cần gửi (ví dụ: 1 tủ lạnh, 10 thùng đồ...) để tôi tính dung tích m³ chuẩn xác nhất nhé!*`,
        intent: "get_live_data",
        data: {
          suggested_units: [
            {
              unit_id: "6ac4ea742f3017f8106ae7b1",
              unit_number: isQ7 ? "Q7-S101" : "S-101",
              unit_type_name: "Kho Nhỏ (Loại S)",
              facility_id: isQ7 ? "6ac4ea742f3017f8106ae7a9" : "6ac4ea742f3017f8106ae7a8",
              facility_name: isQ7 ? "Kho Tự Quản Chi Nhánh Quận 7" : "Kho Tự Quản Chi Nhánh Quận 1",
              facility_address: isQ7
                ? "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7"
                : "79 Trần Khắc Chân, Phường Tân Định, Quận 1",
              size_m2: 1.5,
              volume_m3: 3.0,
              price_per_month: 900000,
              deposit_amount: 500000,
            },
            {
              unit_id: "6ac4ea742f3017f8106ae7b2",
              unit_number: isQ7 ? "Q7-M102" : "M-102",
              unit_type_name: "Kho Vừa (Loại M)",
              facility_id: isQ7 ? "6ac4ea742f3017f8106ae7a9" : "6ac4ea742f3017f8106ae7a8",
              facility_name: isQ7 ? "Kho Tự Quản Chi Nhánh Quận 7" : "Kho Tự Quản Chi Nhánh Quận 1",
              facility_address: isQ7
                ? "69 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7"
                : "79 Trần Khắc Chân, Phường Tân Định, Quận 1",
              size_m2: 2.5,
              volume_m3: 5.0,
              price_per_month: 1500000,
              deposit_amount: 500000,
            },
          ],
        },
      };
    }

    // 3. GỢI Ý GÓI GIA HẠN
    if (lower.includes("gia hạn") || lower.includes("gói") || lower.includes("chiết khấu")) {
      return {
        reply: `🔄 **Đề xuất gói gia hạn hợp đồng tối ưu:**\n\n• **Gói 1 tháng**: Phù hợp nhu cầu ngắn hạn, không chiết khấu.\n• **Gói 3 tháng**: Giảm ngay **5%** tổng cước thuê.\n• **Gói 6 tháng**: Giảm ngay **10%** tổng cước thuê.\n• **Gói 12 tháng (Tiết kiệm nhất)**: Giảm tối đa **15%** cước thuê.\n\n👉 Bạn có thể vào mục **Hợp đồng của tôi** trên menu để chọn kỳ hạn gia hạn và quét mã VietQR tự động nhé!`,
        intent: "recommend_package",
        sources: ["Chính sách chiết khấu gia hạn dài hạn SelfStorage"],
      };
    }

    // 4. MẶC ĐỊNH
    return {
      reply: `👋 Tôi là **Trợ lý AI SelfStorage**! Bạn có thể hỏi tôi:\n• 📦 **Kể tên đồ đạc** (vd: *Tôi có 1 tủ lạnh, 20 thùng và 1 xe máy*): Tôi sẽ tính tổng m³ và gợi ý kho trống phù hợp.\n• 🏢 **Tìm kho**: Tra cứu kho trống tại 6 chi nhánh (Q7, Q1, Bình Thạnh, Thủ Đức, Q6).\n• 📜 **Chính sách**: Đồ cấm, phí quá hạn, quy định khóa mã PIN.\n• 🔄 **Gia hạn**: Đề xuất gói 1, 3, 6 hoặc 12 tháng tiết kiệm chi phí.`,
      intent: "out_of_scope",
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: MessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      // Build history of last 4 messages to optimize latency
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content.slice(0, 250),
      }));

      let reply = "";
      let data: AiChatResponse["data"] = undefined;
      let intent: AiChatResponse["intent"] = "out_of_scope";
      let sources: string[] | undefined = undefined;

      try {
        const res = await aiApi.chat(text, {
          conversationId: conversationId || undefined,
          history,
        });

        if (res.conversation_id) {
          setConversationId(res.conversation_id);
        }

        if (!res.reply || res.intent === "fallback" || res.reply.includes("bảo trì") || res.reply.includes("đang bận")) {
          const smart = buildSmartFallbackResponse(text);
          reply = smart.reply;
          data = smart.data;
          intent = smart.intent;
          sources = smart.sources;
        } else {
          reply = res.reply;
          data = res.data;
          intent = res.intent;
          sources = res.sources;
        }
      } catch (apiErr: any) {
        console.warn("AI backend call failed, falling back to smart local engine:", apiErr);
        const smart = buildSmartFallbackResponse(text);
        reply = smart.reply;
        data = smart.data;
        intent = smart.intent;
        sources = smart.sources;
      }

      const assistantMsg: MessageItem = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: reply,
        data,
        intent,
        sources,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Fatal chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setConversationId("");
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        content:
          "✨ Đã làm mới đoạn hội thoại! Bạn cần hỗ trợ tính thể tích đồ đạc, đặt kho ở chi nhánh nào (Q7, Q1, Bình Thạnh...) hay tra cứu chính sách gì?",
        createdAt: new Date(),
      },
    ]);
  };

  // Điều hướng đặt ngăn kho trực tiếp hoặc yêu cầu đăng nhập nếu là khách
  const handleBookUnit = (u: AiSuggestedUnit) => {
    setIsOpen(false);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const targetFacility = u.facility_id || "6ac4ea742f3017f8106ae7a9";
    const bookUrl = `/book/${targetFacility}?unitId=${u.unit_id}${u.unit_type_id ? `&unitTypeId=${u.unit_type_id}` : ""}`;

    if (!token) {
      // Khách chưa đăng nhập -> chuyển đến login kèm redirect
      router.push(`/login?redirect=${encodeURIComponent(bookUrl)}`);
    } else {
      router.push(bookUrl);
    }
  };

  // Helper format văn bản markdown đẹp mắt
  const renderMessageContent = (content: string, intent?: string) => {
    const isProhibited = intent === "prohibited_items";
    const isEmergency = intent === "emergency_support";

    return (
      <div className={`space-y-2 ${isProhibited ? "text-rose-950 font-medium" : ""}`}>
        {content.split("\n").map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Highlight bold text **...**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-indigo-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-[13px]">
                <span className="text-indigo-600 font-bold select-none">•</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-[13px] leading-relaxed">
              {renderedLine}
            </p>
          );
        })}

        {/* Nút gọi khẩn cấp nếu là emergency */}
        {isEmergency && (
          <div className="mt-3 pt-2 flex flex-wrap gap-2">
            <a
              href="tel:19006868"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Gọi Hotline 1900 6868 (Nhánh 1)
            </a>
            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-all"
            >
              Tạo Ticket khẩn cấp
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Xử lý kéo thả (drag) bong bóng AI
  const handlePointerDown = (e: React.PointerEvent) => {
    // Chỉ kích hoạt khi click chuột trái (button === 0)
    if (e.button !== 0) return;

    const rect = bubbleRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : (bubblePos?.x ?? (window.innerWidth - 80));
    const currentY = rect ? rect.top : (bubblePos?.y ?? (window.innerHeight - 80));

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentX,
      startPosY: currentY,
      hasMoved: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const bubbleW = bubbleRef.current?.offsetWidth || 64;
        const bubbleH = bubbleRef.current?.offsetHeight || 64;
        const nextX = Math.min(Math.max(12, dragRef.current.startPosX + dx), window.innerWidth - bubbleW - 12);
        const nextY = Math.min(Math.max(12, dragRef.current.startPosY + dy), window.innerHeight - bubbleH - 12);

        setBubblePos({ x: nextX, y: nextY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (dragRef.current.hasMoved) {
        setTimeout(() => setIsDragging(false), 50);
        if (bubbleRef.current) {
          const finalRect = bubbleRef.current.getBoundingClientRect();
          localStorage.setItem(
            "ai_assistant_bubble_pos",
            JSON.stringify({ x: finalRect.left, y: finalRect.top })
          );
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (TRIGGER - DRAGGABLE) */}
      {!isOpen && (
        <div
          ref={bubbleRef}
          onPointerDown={handlePointerDown}
          style={
            bubblePos
              ? { left: `${bubblePos.x}px`, top: `${bubblePos.y}px`, bottom: "auto", right: "auto" }
              : undefined
          }
          className={`fixed z-50 flex items-center gap-2 select-none touch-none cursor-grab active:cursor-grabbing ${
            !bubblePos ? "bottom-6 right-6" : ""
          } ${isDragging ? "transition-none scale-105 opacity-90" : "transition-transform hover:scale-[1.02]"}`}
          title="Bấm để mở trợ lý AI • Nhấn giữ và kéo để di chuyển vị trí"
        >
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 text-white text-xs font-medium shadow-xl border border-slate-700/60 backdrop-blur-md pointer-events-none">
            <GripVertical className="w-3.5 h-3.5 text-slate-400 -ml-0.5" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trợ lý tư vấn kho 24/7</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              if (dragRef.current.hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/35 hover:bg-indigo-500 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
            aria-label="Mở Trợ lý tư vấn kho"
          >
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </button>
        </div>
      )}

      {/* 2. CHAT WINDOW / MODAL */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl ${
            isMinimized
              ? "bottom-6 right-6 w-84 h-16 rounded-2xl"
              : "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-24px)] sm:w-[500px] md:w-[540px] h-[calc(100vh-60px)] sm:h-[680px] max-h-[760px] rounded-3xl"
          }`}
          style={{ boxShadow: "0 20px 50px -10px rgba(15, 23, 42, 0.25)" }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wide text-white">
                    Trợ Lý AI SelfStorage
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Trực Tuyến
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tư vấn kích cỡ, báo giá & đặt kho trực tiếp
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleResetChat}
                title="Làm mới đoạn hội thoại"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Phóng to" : "Thu nhỏ"}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT BODY */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isProhibited = msg.intent === "prohibited_items";
                  const isEmergency = msg.intent === "emergency_support";
                  const hasSuggestions = Boolean(msg.data?.suggested_units && msg.data.suggested_units.length > 0);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 shadow-sm mt-0.5 ${
                            isProhibited
                              ? "bg-rose-600 text-white"
                              : isEmergency
                              ? "bg-amber-600 text-white"
                              : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                          }`}
                        >
                          {isProhibited ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "max-w-[85%] bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none"
                            : isProhibited
                            ? "max-w-[88%] bg-rose-50/90 text-rose-950 border border-rose-200 rounded-tl-none"
                            : isEmergency
                            ? "max-w-[88%] bg-amber-50/90 text-amber-950 border border-amber-200 rounded-tl-none"
                            : hasSuggestions
                            ? "w-full max-w-[96%] sm:max-w-[94%] bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-sm"
                            : "max-w-[85%] bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                        }`}
                      >
                        {/* Render formatted message text */}
                        {renderMessageContent(msg.content, msg.intent)}

                        {/* SKILL 1: SIZE ADVICE CARD - SHOWS ITEMS & SUGGESTED UNITS */}
                        {msg.data?.items && msg.data.items.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <Box className="w-3.5 h-3.5 text-blue-600" />
                                <span>Đồ vật nhận diện ({msg.data.items.length} món)</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                                Cần: ~{msg.data.required_volume_m3?.toFixed(2)} m³
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {msg.data.items.map((it: AiItem, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700"
                                >
                                  <span className="font-medium truncate mr-1">
                                    {it.quantity}x {it.item}
                                  </span>
                                  <span className="text-[11px] text-slate-500 shrink-0">
                                    {it.total_volume_m3?.toFixed(2)} m³
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SUGGESTED AVAILABLE UNITS WITH DIRECT BOOKING ACTION */}
                        {msg.data?.suggested_units && msg.data.suggested_units.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between pb-0.5">
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Gợi ý ngăn kho phù hợp nhất ({msg.data.suggested_units.length}):</span>
                              </p>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                                Sẵn sàng bàn giao
                              </span>
                            </div>

                            <div className="space-y-3">
                              {msg.data.suggested_units.slice(0, 3).map((u: AiSuggestedUnit, idx: number) => {
                                const fullAddress = resolveFacilityAddress(u);
                                return (
                                  <div
                                    key={idx}
                                    className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-indigo-300 transition-all shadow-xs hover:shadow-md space-y-3"
                                  >
                                    {/* Header: Mã kho, Loại kho & Đơn giá */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-extrabold text-xs tracking-wide">
                                          <Box className="w-3.5 h-3.5 text-indigo-600" />
                                          Kho #{u.unit_number}
                                        </span>
                                        <span className="font-bold text-slate-800 text-sm">
                                          {u.unit_type_name || "Kho Tiêu Chuẩn"}
                                        </span>
                                      </div>

                                      <div className="flex items-baseline gap-1 text-right self-start sm:self-auto">
                                        <span className="text-base sm:text-lg font-black text-blue-600 tracking-tight">
                                          {(u.price_per_month || 0).toLocaleString()}đ
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500">/tháng</span>
                                      </div>
                                    </div>

                                    {/* Cơ sở & Địa chỉ chi tiết (Thoáng đãng, rõ ràng) */}
                                    <div className="space-y-1.5 bg-slate-50/90 rounded-xl p-3 border border-slate-100/90">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span>{u.facility_name || "Cơ sở SelfStorage"}</span>
                                      </div>

                                      <div className="flex items-start gap-1.5 text-[12px] text-slate-600 leading-snug pt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                        <span className="flex-1 font-normal break-words">
                                          {fullAddress}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Thông số kỹ thuật: Diện tích, Thể tích, Cọc */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="py-1.5 px-2 rounded-lg bg-indigo-50/50 border border-indigo-100/70 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-medium">Diện tích</span>
                                        <span className="text-xs font-bold text-indigo-950 mt-0.5">{u.size_m2} m²</span>
                                      </div>
                                      <div className="py-1.5 px-2 rounded-lg bg-blue-50/50 border border-blue-100/70 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-medium">Dung tích</span>
                                        <span className="text-xs font-bold text-blue-950 mt-0.5">~{u.volume_m3} m³</span>
                                      </div>
                                      <div className="py-1.5 px-2 rounded-lg bg-emerald-50/50 border border-emerald-100/70 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-medium">Tiền cọc</span>
                                        <span className="text-xs font-bold text-emerald-800 mt-0.5">
                                          {(u.deposit_amount || 500000).toLocaleString()}đ
                                        </span>
                                      </div>
                                    </div>

                                    {/* Hành động đặt phòng và liên kết Google Maps */}
                                    <div className="pt-0.5 flex items-center gap-2">
                                      <button
                                        onClick={() => handleBookUnit(u)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                      >
                                        <span>Đặt ngăn này ngay (VietQR)</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xem địa chỉ trên Google Maps"
                                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shrink-0 flex items-center justify-center"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* SKILL 2: POLICY RAG SOURCES */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Tài liệu nguồn trích xuất:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((src, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200"
                                >
                                  {src.replace(/[[\]]/g, "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200 text-slate-700 shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI LOADING SKELETON */}
                {isLoading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Trợ lý AI đang phân tích & tìm kiếm kho...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK CHIPS SUGGESTIONS */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 bg-white/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {QUICK_SUGGESTIONS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium shrink-0 border border-slate-200/60 hover:border-blue-200 transition-all cursor-pointer"
                      >
                        <Icon className="w-3 h-3 text-blue-500" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* INPUT FORM */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Nhập đồ đạc cần cất hoặc hỏi kho ở Quận 7, Q1..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
