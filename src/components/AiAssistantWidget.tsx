"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Box,
  ShieldCheck,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Minimize2,
  Maximize2
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
    icon: FileText,
    label: "Chính sách đồ cấm",
    prompt: "Quy định danh mục đồ vật cấm lưu trữ tại kho tự phục vụ gồm những gì?",
  },
  {
    icon: HelpCircle,
    label: "Phí quá hạn hợp đồng",
    prompt: "Phí phạt quá hạn hợp đồng và quy định khóa mã PIN được tính thế nào?",
  },
  {
    icon: RotateCcw,
    label: "Gợi ý gói gia hạn",
    prompt: "Hợp đồng của tôi sắp hết hạn, tôi nên gia hạn gói 1, 3, 6 hay 12 tháng?",
  },
];

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là **Trợ lý AI SelfStorage**.\n\nTôi có thể giúp bạn:\n- 📦 **Tư vấn kích cỡ kho**: Kể tên đồ đạc của bạn, tôi sẽ tính thể tích và tìm kho trống phù hợp.\n- 📜 **Giải đáp chính sách**: Đồ cấm, phí phạt quá hạn, hoàn cọc, thanh toán VietQR.\n- 🔄 **Gợi ý gói gia hạn**: Đề xuất kỳ hạn tối ưu chi phí cho hợp đồng của bạn.",
      createdAt: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [aiHealth, setAiHealth] = useState<AiHealthResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
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
      // Build history of last 6 messages
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.chat(text, {
        conversationId: conversationId || undefined,
        history,
      });

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const assistantMsg: MessageItem = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: res.reply,
        data: res.data,
        intent: res.intent,
        sources: res.sources,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "Hệ thống đang bận hoặc gặp sự cố kết nối tới máy chủ AI. Bạn vui lòng thử lại sau giây lát hoặc gửi Yêu Cầu Hỗ Trợ (Support Ticket) để nhân viên trực tiếp hỗ trợ nhé!",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
          "Đã bắt đầu hội thoại mới! Bạn cần hỗ trợ tính thể tích đồ đạc, tra cứu chính sách kho hay gợi ý gói thuê nào?",
        createdAt: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (TRIGGER) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Subtle Attention Tooltip */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 text-white text-xs font-medium shadow-xl border border-slate-700/60 backdrop-blur-md animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trợ lý tư vấn kho 24/7</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none"
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
              ? "bottom-6 right-6 w-80 h-16 rounded-2xl"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[calc(100vh-100px)] sm:h-[650px] max-h-[720px] rounded-3xl"
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
                    Trợ Lý Tư Vấn Kho
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Trực Tuyến
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {aiHealth?.status === "ok"
                    ? "Tư vấn kích cỡ, báo giá & chính sách kho"
                    : "Hỗ trợ khách hàng trực tuyến"}
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
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                      }`}
                    >
                      {/* Render formatted message text */}
                      <div className="whitespace-pre-line break-words space-y-2">
                        {msg.content}
                      </div>

                      {/* SKILL 1: SIZE ADVICE CARD - SHOWS ITEMS & SUGGESTED UNITS */}
                      {msg.data?.items && msg.data.items.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <Box className="w-3.5 h-3.5 text-blue-600" />
                              Đồ vật nhận diện ({msg.data.items.length})
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                              Tổng: ~{msg.data.required_volume_m3?.toFixed(2)} m³
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

                      {/* SUGGESTED AVAILABLE UNITS */}
                      {msg.data?.suggested_units && msg.data.suggested_units.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Gợi ý ngăn kho trống phù hợp:
                          </p>
                          <div className="space-y-2">
                            {msg.data.suggested_units.slice(0, 3).map((u: AiSuggestedUnit, idx: number) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-blue-900">
                                    Mã: {u.unit_number} ({u.unit_type_name})
                                  </span>
                                  <span className="text-xs font-bold text-indigo-700">
                                    {(u.price_per_month || 0).toLocaleString()}đ/tháng
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>{u.facility_name}</span>
                                  <span>
                                    {u.size_m2}m² · ~{u.volume_m3}m³
                                  </span>
                                </div>
                                <Link
                                  href={`/book?unitId=${u.unit_id}${u.unit_type_id ? `&unitTypeId=${u.unit_type_id}` : ""}`}
                                  onClick={() => setIsOpen(false)}
                                  className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                                >
                                  Đặt ngăn này ngay
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            ))}
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

                    {msg.role === "user" && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200 text-slate-700 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* AI LOADING SKELETON */}
                {isLoading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Trợ lý AI đang suy luận và phân tích dữ liệu...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK CHIPS SUGGESTIONS */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 bg-white/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {QUICK_SUGGESTIONS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium shrink-0 border border-slate-200/60 hover:border-blue-200 transition-all"
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
                  placeholder="Nhập đồ đạc cần cất hoặc câu hỏi chính sách..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
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
