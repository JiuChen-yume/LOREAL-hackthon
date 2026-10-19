export type ProductCategory = 'skincare' | 'base' | 'eye' | 'lip' | 'tool';

export type ProductStatus = 'in_use' | 'idle' | 'expiring_soon' | 'expired' | 'used_up';

export type ColorTone = 'warm' | 'cool' | 'neutral' | 'none';

export type ListRating = 'red' | 'yellow' | 'black' | 'none';

export type TryOnProvider = 'tencent-effect' | 'local-lip-mask' | 'unavailable';
export type TryOnStatus = 'unconfigured' | 'fallback' | 'verified' | 'unavailable';

export type IngredientEnrichmentStatus = 'not_queried' | 'querying' | 'needs_verification' | 'confirmed' | 'failed' | 'not_found';

export interface IngredientRecord {
  name: string;
  inci_name?: string;
  source?: string;
  source_url?: string;
  verified?: boolean;
}

export interface TryOnConfig {
  provider: TryOnProvider;
  effectId?: string;
  assetVersion?: string;
  defaultIntensity?: number;
  status: TryOnStatus;
  finish?: 'matte' | 'dewy' | 'gloss';
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface IdolCompanionProfile {
  enabled: boolean;
  style: 'daily' | 'idol' | 'cos';
  idolName: string;
  cosProjectName: string;
  reminderTimeMorning: string;
  reminderTimeEvening: string;
}

export interface BeautyProduct {
  id: string;
  brand: string;
  product_name: string;
  category: ProductCategory;
  subcategory: string;
  shade_name?: string;
  shade_hex?: string;
  /** SKU-level virtual try-on configuration. Optional for existing products. */
  try_on?: TryOnConfig;
  color_tone?: ColorTone; // 暖调/冷调/中性
  size?: string;
  purchase_date: string;
  opened_date: string;
  pao_months: number; // e.g. 6M, 12M
  expiry_date: string;
  quantity: number; // 支持多件库存管理
  status: ProductStatus;
  is_hidden?: boolean; // 支持隐私隐藏
  ingredients: string[];
  ingredient_records?: IngredientRecord[];
  ingredient_enrichment_status?: IngredientEnrichmentStatus;
  ingredient_enrichment_source?: string;
  ingredient_enrichment_source_url?: string;
  ingredient_enrichment_queried_at?: string;
  ingredient_enrichment_error?: string;
  ingredient_analysis?: {
    benefits?: string[];
    cautions?: string[];
    evidence?: string;
    confidence?: number;
  };
  allergen_tags: string[];
  user_notes?: string;
  shelf_location?: string;
  list_status: ListRating;
  last_used_at?: string;
  usage_count: number;
  image_url?: string;
  barcode?: string;
  barcodeType?: string;
  barcodeVerified?: boolean;
  recognitionSource?: 'product-api' | 'ocr' | 'barcode' | 'ai' | 'manual';
  syncStatus?: 'local' | 'pending' | 'synced' | 'failed';
  price?: number;
  repurpose_ideas?: string[];
}

export interface CareStep {
  step_number: number;
  category: string;
  title: string;
  product_id?: string;
  product_name: string;
  brand?: string;
  dosage: string;
  wait_time: string;
  instruction: string;
  notes?: string;
  is_missing_item?: boolean;
}

export interface RoutinePlan {
  id: string;
  title: string;
  mode: 'routine' | 'special';
  special_scenario?: string;
  time_budget: '3min' | '5min' | 'full';
  only_vanity: boolean;
  skin_status_summary: string;
  morning_steps: CareStep[];
  evening_steps: CareStep[];
  created_at: string;
  selected_product_ids?: string[];
  today_makeup_products?: Array<{
    product_id: string;
    step: string;
    routine_type?: 'morning' | 'evening' | 'both';
    source: 'vanity' | 'makeup-workflow';
    completed: boolean;
  }>;
  sync_status?: 'local' | 'pending' | 'synced' | 'failed';
}

export interface SkinFeedbackLog {
  id: string;
  date: string;
  routine_type: 'morning' | 'evening';
  feelings: string[]; // 舒服, 紧绷, 泛红, 出油, 起痘, 刺痛
  mood: string; // 疲惫, 放松, 犒劳自己, 自在
  notes: string;
  products_used_ids: string[];
  reported_stinging_product_id?: string;
}

export interface BlacklistIngredient {
  name: string;
  risk_level: 'high' | 'medium';
  reason: string;
  associated_products_count: number;
}

export interface MakeupLook {
  id: string;
  title: string;
  type: 'daily' | 'imitation' | 'cos';
  character_name?: string;
  inspiration_image?: string;
  reference_image?: string;
  generated_image?: string;
  render_provider?: 'doubao-seedream' | 'tencent-effect' | 'local' | 'unavailable';
  render_status?: 'pending' | 'ready' | 'failed' | 'unavailable';
  rendered_layers?: GeneratedMakeupLayer[];
  description: string;
  occasion: string;
  matched_products: {
    slot: '底妆' | '眼影' | '腮红' | '唇妆' | '修容/眉笔';
    product_id?: string;
    product_name: string;
    shade?: string;
    is_dupe_alternative?: boolean;
    note: string;
  }[];
  steps: string[];
  lighting_advice?: string;
  minimal_5min_tip: string;
  created_at: string;
  layers?: MakeupLayer[];
}

export interface GeneratedMakeupLayer {
  url?: string;
  base64?: string;
  name?: string;
  description?: string;
  zIndex?: number;
  boundingBox?: { absolute?: number[]; normalized?: number[] };
}

export type MakeupLayerType = 'base' | 'brows' | 'eyeliner' | 'lashes' | 'eyeshadow' | 'blush' | 'contour' | 'highlight' | 'lips' | 'contacts' | 'fullLook';

export interface MakeupLayer {
  id: string;
  type: MakeupLayerType;
  region: string;
  style?: string;
  color?: string;
  opacity: number;
  feather: number;
  productId?: string;
  shade?: string;
  enabled: boolean;
  stepIndex: number;
}

export interface MallItem {
  id: string;
  brand: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  is_commercial: boolean; // 区分“AI建议”和“商业推荐”
  commercial_tag?: string; // e.g. "官方合作品牌"
  recommend_reason: string;
  existing_vanity_count: number;
  existing_vanity_names: string[];
  contains_blacklist_ingredient: boolean;
  blacklist_ingredient_names: string[];
  image_url?: string;
  refill_available: boolean;
}

export interface CircularRecycleRecord {
  id: string;
  date: string;
  station_name: string;
  type: 'glass_bottle' | 'plastic_jar' | 'compact_powder' | 'aluminum_cap';
  item_name: string;
  points: number;
  status: 'completed' | 'in_transit' | 'verified';
}

export interface RoutineReminderSettings {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  webPushGranted: boolean;
  coreAdviceMorning: string;
  coreAdviceEvening: string;
  lastTriggeredType?: 'morning' | 'evening';
}
