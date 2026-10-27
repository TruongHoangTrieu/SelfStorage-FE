import { api } from '../api';

export interface AiItem {
  item: string;
  catalog_name?: string;
  quantity: number;
  unit_volume_m3?: number;
  total_volume_m3?: number;
  estimated?: boolean;
  stackable?: boolean;
  note?: string | null;
}

export interface AiSuggestedUnit {
  unit_id: string;
  unit_number: string;
  unit_type_id?: string;
  unit_type_name?: string;
  facility_id?: string;
  facility_name?: string;
  size_m2?: number;
  volume_m3?: number;
  price_per_month?: number;
  deposit_amount?: number;
}

export interface AiChatData {
  items?: AiItem[];
  total_raw_volume_m3?: number;
  required_volume_m3?: number;
  suggested_units?: AiSuggestedUnit[];
  method?: string;
  confidence?: number;
  out_of_scope?: boolean;
  facility_id?: string;
  facility_name?: string;
  [key: string]: unknown;
}

export interface AiChatResponse {
  conversation_id: string;
  intent:
    | 'size_advice'
    | 'search_policy'
    | 'recommend_package'
    | 'get_live_data'
    | 'prohibited_items'
    | 'emergency_support'
    | 'out_of_scope'
    | 'fallback';
  reply: string;
  data?: AiChatData;
  sources?: string[];
  model_version?: string;
}

export interface AiHealthResponse {
  status: string;
  service?: string;
  llm_provider?: string;
  llm_available?: boolean;
  database_connected?: boolean;
  catalog_items_count?: number;
  models_version?: string;
}

export interface AiRenewalPredictionResult {
  contract_id: string;
  renewal_probability: number;
  probability_tier: 'CAO' | 'TRUNG_BINH' | 'THAP';
  recommended_package: number;
  action: 'REMIND_NORMAL' | 'REMIND_EARLY_DISCOUNT' | 'FLAG_STAFF_CONTACT';
  personalized_message?: string;
  features_used?: Record<string, unknown>;
  model_version?: string;
}

export interface AiRenewalBatchResponse {
  total_processed: number;
  saved_to_db: number;
  predictions: AiRenewalPredictionResult[];
}

export const aiApi = {
  /**
   * Gửi tin nhắn tới Trợ lý AI (hỗ trợ cả khách vãng lai và người đã đăng nhập)
   */
  chat: async (
    message: string,
    options?: {
      conversationId?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      facilityId?: string;
    }
  ): Promise<AiChatResponse> => {
    return api.post<AiChatResponse>('/ai/chat', {
      message,
      conversationId: options?.conversationId,
      history: options?.history,
      facilityId: options?.facilityId,
    });
  },

  /**
   * Kiểm tra tình trạng kết nối tới AI Service (FastAPI)
   */
  getHealth: async (): Promise<AiHealthResponse> => {
    return api.get<AiHealthResponse>('/ai/health');
  },

  /**
   * Quét và chấm điểm dự đoán gia hạn hợp đồng (Model A: XGBoost, Model B: RandomForest)
   * Yêu cầu quyền Staff hoặc Manager
   */
  predictRenewals: async (daysThreshold = 14): Promise<AiRenewalBatchResponse> => {
    return api.post<AiRenewalBatchResponse>(`/ai/predict-renewals?days=${daysThreshold}`);
  },
};
