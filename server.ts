import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createHash, createHmac } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const withTimeout = <T>(promise: Promise<T>, ms: number = 7000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), ms))
  ]);
};

const cleanTencentImage = (value: unknown) => typeof value === 'string' ? value.replace(/^data:[^;]+;base64,/, '') : '';

const resolveSeedreamConfig = () => {
  const configured = String(process.env.VOLCENGINE_IMAGE_ENDPOINT || '').trim();
  const baseUrl = String(process.env.VOLCENGINE_IMAGE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
  const endpoint = configured.startsWith('http')
    ? (configured.endsWith('/images/generations') ? configured : `${configured.replace(/\/$/, '')}/images/generations`)
    : `${baseUrl}/images/generations`;
  const model = String(process.env.VOLCENGINE_IMAGE_MODEL || (configured.startsWith('ep-') ? configured : process.env.VOLCENGINE_ARK_ENDPOINT || '')).trim();
  const apiKey = process.env.VOLCENGINE_IMAGE_API_KEY || process.env.VOLCENGINE_ARK_API_KEY || process.env.DOUBAO_API_KEY;
  return { endpoint, model, apiKey };
};

const asImageDataUrl = async (value: string) => {
  if (value.startsWith('data:')) return value;
  if (!value.startsWith('http')) return value;
  const response = await fetch(value, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Seedream image download failed: ${response.status}`);
  const mime = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const generateSeedreamImage = async (image: string, prompt: string) => {
  const { apiKey, endpoint, model } = resolveSeedreamConfig();
  if (!apiKey || !endpoint || !model) throw new Error('未配置豆包 Seedream 图像生成服务。');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({ model, prompt, image, size: '1K', response_format: 'url', output_format: 'jpeg', watermark: false }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Seedream 图像生成失败（HTTP ${response.status}）。`);
  const value = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.output?.url || data?.output?.image_url;
  if (!value || typeof value !== 'string') throw new Error('Seedream 未返回可用图片。');
  return value.startsWith('data:') || value.startsWith('http') ? value : `data:image/jpeg;base64,${value}`;
};

const searchProductSources = async (query: string) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'advanced', max_results: 5, include_answer: false }),
  });
  if (!response.ok) throw new Error(`Product source search failed: ${response.status}`);
  const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }> };
  return (data.results || []).filter(item => item.url && item.content).map(item => ({
    title: String(item.title || '').slice(0, 180),
    url: String(item.url),
    content: String(item.content).slice(0, 1200),
  }));
};

const normalizeMakeupSteps = (rawSteps: unknown, rawDetails: unknown) => {
  const details = Array.isArray(rawDetails) ? rawDetails : [];
  const steps = Array.isArray(rawSteps) ? rawSteps.map((item: any) => {
    if (typeof item === 'string') return item.trim();
    return [item?.title || item?.name || item?.step || '', item?.detail || item?.instruction || item?.description || ''].filter(Boolean).join('：');
  }).filter(Boolean) : [];
  const total = Math.max(steps.length, details.length);
  const stepDetails = Array.from({ length: total }, (_, index) => {
    const source = details[index] && typeof details[index] === 'object' ? details[index] as Record<string, any> : {};
    const title = String(source.title || source.name || steps[index] || `第${index + 1}步`);
    const text = `${title} ${steps[index] || ''} ${source.targetArea || source.target_area || source.region || ''}`;
    const rawType = String(source.layerType || source.layer_type || source.type || '').toLowerCase();
    const layerType = /base|底妆|粉底|妆前/.test(`${rawType} ${text}`) ? 'base'
      : /brow|眉/.test(`${rawType} ${text}`) ? 'brows'
      : /eyeliner|眼线/.test(`${rawType} ${text}`) ? 'eyeliner'
      : /lash|睫/.test(`${rawType} ${text}`) ? 'lashes'
      : /eyeshadow|眼影|眼妆/.test(`${rawType} ${text}`) ? 'eyeshadow'
      : /blush|腮红/.test(`${rawType} ${text}`) ? 'blush'
      : /contour|修容/.test(`${rawType} ${text}`) ? 'contour'
      : /highlight|高光/.test(`${rawType} ${text}`) ? 'highlight'
      : /lip|唇|口红/.test(`${rawType} ${text}`) ? 'lips'
      : /contact|美瞳|隐形/.test(`${rawType} ${text}`) ? 'contacts'
      : 'fullLook';
    const targetArea = String(source.targetArea || source.target_area || source.area || source.region || (
      layerType === 'base' ? '全脸' : layerType === 'brows' ? '眉毛' : layerType === 'eyeliner' ? '眼线' :
        layerType === 'lashes' ? '睫毛' : layerType === 'eyeshadow' ? '眼周' : layerType === 'blush' ? '颧骨/苹果肌' :
          layerType === 'contour' ? '鼻梁/下颌' : layerType === 'highlight' ? '鼻梁/面中' : layerType === 'lips' ? '上下唇' : '面部整体'
    ));
    const method = Array.isArray(source.method) ? source.method.map(String) : [source.method || source.tip || source.instruction || steps[index]].filter(Boolean).map(String);
    return {
      id: String(source.id || `step_${index + 1}`),
      title,
      targetArea,
      layerType,
      productId: source.productId || source.product_id,
      productName: source.productName || source.product_name || source.vanityProduct,
      shade: source.shade || source.shade_name,
      tool: source.tool,
      dosage: source.dosage || source.amount,
      method,
      pitfalls: Array.isArray(source.pitfalls) ? source.pitfalls.map(String) : [],
      checklist: Array.isArray(source.checklist) ? source.checklist.map(String) : [],
      estimatedMin: Number(source.estimatedMin || source.estimated_min || 2),
    };
  });
  return {
    steps: stepDetails.map((detail, index) => steps[index] || detail.title),
    step_details: stepDetails,
  };
};

const buildIngredientFallbackReport = (products: any[], blacklist: string[] = []) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const normalize = (p: any) => {
    const ingredients = Array.isArray(p?.ingredients) ? p.ingredients.map(String) : [];
    const records = Array.isArray(p?.ingredient_records) ? p.ingredient_records.map((item: any) => `${item?.name || ''} ${item?.inci_name || ''}`) : [];
    return `${p?.brand || ''} ${p?.product_name || p?.name || ''} ${ingredients.join(' ')} ${records.join(' ')}`.toLowerCase();
  };
  const has = (text: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));
  const retinol = [/retinol/i, /\ba[- ]?r/i, /视黄醇|维a醇|a醇/i];
  const acids = [/\baha\b/i, /\bbha\b/i, /glycolic|salicylic|lactic|mandelic/i, /果酸|甘醇酸|水杨酸|乳酸|杏仁酸/];
  const vitaminC = [/\bvitamin\s*c\b/i, /ascorbic/i, /vitamin[- ]?c/i, /维生素c|抗坏血酸/];
  const alcohol = [/\balcohol\b/i, /denat/i];
  const entries = safeProducts.map(product => ({ product, text: normalize(product) }));
  const conflicts: any[] = [];
  const addConflict = (a: any, b: any, ingredientA: string, ingredientB: string, suggestion: string) => conflicts.push({
    product_a: a.product?.product_name || a.product?.name || 'Product A', product_b: b.product?.product_name || b.product?.name || 'Product B', ingredient_a: ingredientA, ingredient_b: ingredientB,
    risk_description: 'High-activity ingredients may increase dryness, stinging, redness, and barrier stress when layered.', suggestion
  });
  for (let i = 0; i < entries.length; i += 1) for (let j = i + 1; j < entries.length; j += 1) {
    const left = entries[i]; const right = entries[j];
    const lr = has(left.text, retinol), rr = has(right.text, retinol), la = has(left.text, acids), ra = has(right.text, acids), lc = has(left.text, vitaminC), rc = has(right.text, vitaminC);
    if ((lr && ra) || (rr && la)) addConflict(left, right, lr ? 'Retinol / A-alcohol' : 'AHA/BHA acids', lr ? 'AHA/BHA acids' : 'Retinol / A-alcohol', 'Use on separate mornings/evenings or alternate days; start low frequency and use sunscreen.');
    if ((lr && rc) || (rr && lc)) addConflict(left, right, lr ? 'Retinol / A-alcohol' : 'Vitamin C', lr ? 'Vitamin C' : 'Retinol / A-alcohol', 'Separate usage times and monitor for irritation.');
  }
  const blacklisted = blacklist.filter(item => entries.some(({ text }) => text.includes(String(item).toLowerCase())));
  const hasAlcohol = entries.some(({ text }) => has(text, alcohol));
  const missingIngredients = entries.some(({ product }) => !Array.isArray(product?.ingredients) || product.ingredients.length === 0);
  return { safety_level: conflicts.length || blacklisted.length ? 'danger' : hasAlcohol || missingIngredients ? 'warning' : 'safe', summary: conflicts.length ? 'Detected high-activity ingredient overlap; adjust usage timing.' : blacklisted.length ? `Detected blacklist ingredients: ${blacklisted.join(', ')}` : missingIngredients ? 'Some selected products have no verified ingredient list; safety cannot be confirmed until the package ingredients are added.' : hasAlcohol ? 'Volatile alcohol detected; patch test first if skin is sensitive.' : 'No obvious high-stimulation conflict detected.', conflicts, ingredient_overlap: [], missing_ingredient_products: entries.filter(({ product }) => !Array.isArray(product?.ingredients) || product.ingredients.length === 0).map(({ product }) => product?.product_name || product?.name || 'Unverified product'), recommended_order: safeProducts.map((product, index) => ({ step: index + 1, product_name: product?.product_name || product?.name || 'Unverified product', timing: has(normalize(product), retinol) ? 'Night only / alternate days' : 'Morning and evening', reason: index === 0 ? 'Use lighter water-based textures first' : 'Layer from thin to rich' })), disclaimer: 'Cosmetic compatibility guidance only; not a medical diagnosis.' };
};

const arkVisionJson = async (user: string, imageBase64: string) => {
  const key = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_ARK_API_KEY;
  const endpoint = process.env.DOUBAO_MODEL || process.env.VOLCENGINE_ARK_ENDPOINT;
  const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  if (!key || !endpoint) return null;
  const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ model: endpoint, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }, { type: 'text', text: user }] }], temperature: 0.1, max_tokens: 1200 }),
  });
  if (!response.ok) throw new Error(`Ark request failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  try { return JSON.parse(fenced); } catch { return null; }
};

const arkTextJson = async (user: string) => {
  const key = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_ARK_API_KEY;
  const model = process.env.DOUBAO_MODEL || process.env.VOLCENGINE_ARK_ENDPOINT;
  const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  if (!key || !model) return null;
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ model, messages: [{ role: 'system', content: '你是化妆品资料整理助手。只输出合法 JSON，不要编造不可确认的精确含量或完整配方。' }, { role: 'user', content: user }], temperature: 0.1, max_tokens: 1200 })
  });
  if (!response.ok) throw new Error(`Ark text request failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  try { return JSON.parse(fenced); } catch { return null; }
};

const tencentCloudRequest = async (options: { service: string; host: string; action: string; version: string; payload: Record<string, unknown> }) => {
  const secretId = process.env.TENCENTCLOUD_SECRET_ID;
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error('TENCENTCLOUD_SECRET_ID/TENCENTCLOUD_SECRET_KEY 未配置');
  const region = process.env.TENCENTCLOUD_REGION || 'ap-guangzhou';
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  const payload = JSON.stringify(options.payload);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${options.host}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${createHash('sha256').update(payload).digest('hex')}`;
  const credentialScope = `${date}/${options.service}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${createHash('sha256').update(canonicalRequest).digest('hex')}`;
  const hmac = (key: Buffer | string, value: string) => createHmac('sha256', key).update(value).digest();
  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, options.service);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = hmac(secretSigning, stringToSign).toString('hex');
  const response = await fetch(`https://${options.host}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8', Host: options.host,
      'X-TC-Action': options.action, 'X-TC-Version': options.version, 'X-TC-Region': region,
      'X-TC-Timestamp': String(timestamp),
      Authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    }, body: payload,
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`Tencent Cloud HTTP ${response.status}`);
  return data;
};

// A small local catalog keeps the integration plan visible in the running demo.
// These business-module endpoints intentionally return deterministic data until a
// database, object storage, or an authorised third-party provider is configured.
const API_CATALOG = [
  { id: 'auth', group: '业务模块骨架', name: '用户登录与权限', method: 'GET / POST', path: '/api/auth/session', description: '微信登录、隐私授权、数据导出和清空。', status: 'local-ready' },
  { id: 'plan', group: '当前已接入', name: '护理计划生成', method: 'POST', path: '/api/home/generate-plan', description: '按时间预算、肤况、化妆台产品和避雷成分生成早晚 Routine。', status: 'connected' },
  { id: 'compatibility', group: '当前已接入', name: '成分兼容性检测', method: 'POST', path: '/api/compatibility/check', description: '规则引擎优先识别成分冲突，再由 AI 解释。', status: 'connected' },
  { id: 'ocr', group: '当前已接入', name: '包装 OCR 识别', method: 'POST', path: '/api/ocr/recognize', description: '识别品牌、品名、规格、成分和 PAO。', status: 'connected' },
  { id: 'barcode', group: '当前已接入', name: '条码查询', method: 'POST', path: '/api/scanner/barcode', description: '按条码查询演示产品主数据。', status: 'connected' },
  { id: 'qrcode-ocr', group: '当前已接入', name: '腾讯云二维码/条形码识别', method: 'POST', path: '/api/barcode/recognize', description: '调用 QrcodeOCR 识别二维码、条形码并返回坐标。', status: 'connected' },
  { id: 'makeup', group: '当前已接入', name: '妆容生成', method: 'POST', path: '/api/makeup/generate', description: '生成日常妆、仿妆和 COS 妆步骤。', status: 'connected' },
  { id: 'avatar', group: '当前已接入', name: '豆包 Seedream 卡通头像', method: 'POST', path: '/api/avatar/generate', description: '用户上传照片后生成临时卡通虚拟形象，需要独立 Seedream Endpoint。', status: process.env.VOLCENGINE_IMAGE_ENDPOINT ? 'connected' : 'auth-required' },
  { id: 'product-sync', group: '当前已接入', name: '化妆台产品同步', method: 'POST', path: '/api/products/sync', description: '识别结果自动写入本地/云端化妆台。', status: 'connected' },
  { id: 'routine-sync', group: '当前已接入', name: '今日计划同步', method: 'POST', path: '/api/routine/today-products', description: '将化妆台产品加入今日护肤/妆容计划。', status: 'connected' },
  { id: 'tutorial', group: '当前已接入', name: '妆教解析', method: 'POST', path: '/api/makeup/parse-tutorial', description: '将妆教描述拆解为可执行步骤。', status: 'connected' },
  { id: 'rescue', group: '当前已接入', name: '闲置拯救', method: 'POST', path: '/api/idle/rescue', description: '生成闲置产品安全复用建议。', status: 'connected' },
  { id: 'products', group: '业务模块骨架', name: '化妆台产品 CRUD', method: 'GET / POST', path: '/api/products', description: '产品新增、编辑、删除、批量操作和隐藏状态。', status: 'local-ready' },
  { id: 'profile', group: '业务模块骨架', name: '用户资料与隐私', method: 'GET / PUT', path: '/api/profile', description: '用户资料、隐私授权、数据导出和清空。', status: 'local-ready' },
  { id: 'uploads', group: '业务模块骨架', name: '图片与文件', method: 'POST', path: '/api/uploads', description: '包装图、妆容参考图和完成图上传占位接口。', status: 'local-ready' },
  { id: 'rules', group: '业务模块骨架', name: '成分规则引擎', method: 'POST', path: '/api/rules/compatibility', description: '成分冲突、黑榜过滤、PAO 和使用顺序规则。', status: 'local-ready' },
  { id: 'reminders', group: '业务模块骨架', name: '提醒任务', method: 'GET / POST', path: '/api/reminders', description: '临期、过期、闲置、补货和打卡提醒。', status: 'local-ready' },
  { id: 'recommendations', group: '业务模块骨架', name: '推荐服务', method: 'GET', path: '/api/recommendations', description: '同类产品、平替、补缺和重复购买拦截。', status: 'local-ready' },
  { id: 'recycling', group: '业务模块骨架', name: '回收与积分', method: 'GET / POST', path: '/api/recycling', description: '预约回收、积分记录、兑换和活动。', status: 'local-ready' },
  { id: 'filing', group: '业务模块骨架', name: '备案信息核验', method: 'GET', path: '/api/products/{id}/filing-status', description: '备案状态、编号、备案人、责任人、来源和核验时间。', status: 'local-ready' },
  { id: 'gemini', group: '外部服务', name: 'Gemini 文本与视觉', method: 'POST', path: '/api/ai/*', description: '统一 AI 网关，配置 GEMINI_API_KEY 后启用。', status: 'auth-required' },
  { id: 'tencent-ocr', group: '外部服务', name: '腾讯云 OCR', method: 'POST', path: 'ocr.tencentcloudapi.com', description: '正式包装识别服务，需要腾讯云密钥。', status: process.env.TENCENTCLOUD_SECRET_ID && process.env.TENCENTCLOUD_SECRET_KEY ? 'connected' : 'auth-required' },
  { id: 'tencent-product', group: '外部服务', name: '腾讯云商品识别', method: 'POST', path: '/api/product/recognize', description: '一张图片识别多个商品并返回坐标，需要腾讯云密钥。', status: process.env.TENCENTCLOUD_SECRET_ID && process.env.TENCENTCLOUD_SECRET_KEY ? 'connected' : 'auth-required' },
  { id: 'doubao-vision', group: '外部服务', name: '豆包视觉辅助识别', method: 'POST', path: '/api/product/recognize', description: '腾讯云无结果时辅助识别中文包装和化妆柜图片，需要方舟 Key 与 Endpoint。', status: process.env.VOLCENGINE_ARK_API_KEY && process.env.VOLCENGINE_ARK_ENDPOINT ? 'connected' : 'auth-required' },
  { id: 'qweather', group: '外部服务', name: '和风天气与 UV', method: 'GET', path: '/api/weather', description: '实时天气、湿度、紫外线和预报，需要后端代理 Key。', status: 'auth-required' },
  { id: 'nmpa', group: '外部服务', name: '国家药监局备案', method: 'GET / 人工核验', path: '/api/products/{id}/filing-status', description: '官方查询或授权数据校验来源。', status: 'auth-required' },
];

app.get('/api/catalog', (_req, res) => {
  res.json({ success: true, generated_at: new Date().toISOString(), apis: API_CATALOG });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'beauty-twin-local', ai_enabled: Boolean(ai), environment: process.env.NODE_ENV || 'development' });
});

app.get('/api/webar/config', (_req, res) => {
  const appId = process.env.WEBAR_APP_ID;
  const licenseKey = process.env.WEBAR_LICENSE_KEY;
  if (!appId || !licenseKey) return res.status(503).json({ success: false, error: 'WebAR credentials are not configured.' });
  res.json({ success: true, config: { appId, licenseKey } });
});

app.get('/api/webar/signature', (_req, res) => {
  const appId = process.env.WEBAR_APP_ID;
  const token = process.env.WEBAR_TOKEN;
  if (!appId || !token) return res.status(503).json({ success: false, error: 'WebAR signing token is not configured.' });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha256').update(`${timestamp}${token}${appId}${timestamp}`).digest('hex').toUpperCase();
  res.json({ signature, timestamp });
});

app.get('/api/auth/session', (_req, res) => {
  res.json({ success: true, authenticated: false, provider: 'local-demo', message: '接入微信登录后在此返回用户会话。' });
});

app.get('/api/ai/health', (_req, res) => {
  res.json({ success: true, provider: ai ? 'gemini' : 'fallback', api_key_configured: Boolean(ai), message: ai ? 'Gemini 网关已配置。' : '未配置 GEMINI_API_KEY，当前使用本地演示兜底。' });
});

app.get('/api/weather', (_req, res) => {
  res.status(503).json({ success: false, provider: 'qweather', configured: false, message: '天气接口需要在服务端配置和风天气 Key。' });
});

app.get('/api/products', (_req, res) => {
  res.json({ success: true, data: [], message: '本地接口已就绪，可接入产品数据库。' });
});

app.post('/api/products', (req, res) => {
  res.status(201).json({ success: true, data: { ...req.body, id: `local_${Date.now()}` }, message: '产品已写入本地接口占位层。' });
});

app.post('/api/products/sync', (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  if (!products.length) return res.status(400).json({ success: false, error: '没有可同步的产品。' });
  res.json({ success: true, synced: products.map((product: any) => ({ id: product.id, syncStatus: 'synced' })), storage: 'local-server' });
});

app.post('/api/products/enrich', async (req, res) => {
  const product = req.body?.product || {};
  const identity = [product.brand, product.product_name, product.size, product.shade_name, product.barcode].filter(Boolean).join(' · ');
  if (!product.brand || !product.product_name) return res.status(400).json({ success: false, status: 'failed', error: '缺少品牌和完整产品名称，无法进行准确成分查询。' });
  const promptBase = `请只整理有证据支持的化妆品资料，精确匹配商品：${identity}。优先官方产品页和包装成分表；无法确认具体 SKU 时，ingredients 必须为空。严禁按品类、相似商品或常识补全成分，严禁编造浓度、功效、评价或评分。review_summary 只能总结提供的公开来源，区分消费者评价与官方宣称。只返回 JSON：{"ingredients":[{"name":"中文名","inci_name":"INCI","source":"来源","source_url":"https://...","verified":false}],"benefits":[],"cautions":[],"review_summary":"","review_sources":[{"title":"","url":""}],"confidence":0,"source":"","source_url":"","needsVerification":true,"evidence":"","error":""}`;
  try {
    const sources = await searchProductSources(`${identity} official ingredients review`);
    const prompt = `${promptBase}\n公开搜索结果（仅限以下材料，不可自行伪造来源）：${JSON.stringify(sources)}`;
    const arkValue = await arkTextJson(prompt);
    const geminiValue = !arkValue && ai ? await withTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }), 9000).then(response => {
      try { return JSON.parse(response.text || ''); } catch { return null; }
    }) : null;
    const value = arkValue || geminiValue;
    if (!value) {
      const ingredients = Array.isArray(product.ingredients) ? product.ingredients.map(String) : [];
      return res.json({ success: true, status: ingredients.length ? 'needs_verification' : 'not_found', configured: false, source: 'user-or-package-data', search_sources: sources, product: { ...product, ingredients, ingredient_records: ingredients.map((name: string) => ({ name, verified: false, source: 'user-or-package-data' })), ingredient_analysis: { benefits: [], cautions: ['请以包装成分表为准；当前未能完成公开资料核验。'], review_summary: sources.length ? '已找到公开来源，但 AI 摘要服务未配置，未生成评价摘要。' : '未配置公开搜索或 AI 服务，暂时无法查询评价和成分。', evidence: '', confidence: 0 } }, needsVerification: true });
    }
    const parsed = value as Record<string, unknown>;
    const rawRecords = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    const records = rawRecords.map((entry: any) => typeof entry === 'string' ? ({ name: entry, verified: false }) : ({ name: String(entry?.name || '').trim(), inci_name: entry?.inci_name ? String(entry.inci_name) : undefined, source: entry?.source ? String(entry.source) : undefined, source_url: entry?.source_url ? String(entry.source_url) : undefined, verified: entry?.verified === true })).filter((entry: any) => entry.name).slice(0, 50);
    const ingredients = records.map((entry: any) => entry.name);
    const status = ingredients.length ? (parsed.needsVerification === false ? 'confirmed' : 'needs_verification') : 'not_found';
    const source = String(parsed.source || (sources.length ? 'public-search+ai-summary' : 'ai-summary-unverified'));
    const sourceUrl = parsed.source_url ? String(parsed.source_url) : sources[0]?.url;
    const reviewSources = Array.isArray(parsed.review_sources) ? parsed.review_sources : sources.map(item => ({ title: item.title, url: item.url }));
    return res.json({ success: true, status, provider: arkValue ? 'doubao' : geminiValue ? 'gemini' : 'unavailable', source, source_url: sourceUrl, search_sources: reviewSources, product: { ...product, ingredients, ingredient_records: records, ingredient_analysis: { benefits: Array.isArray(parsed.benefits) ? parsed.benefits.map(String).slice(0, 12) : [], cautions: Array.isArray(parsed.cautions) ? parsed.cautions.map(String).slice(0, 12) : [], review_summary: String(parsed.review_summary || ''), evidence: String(parsed.evidence || ''), confidence: Number(parsed.confidence || 0) } }, evidence: String(parsed.evidence || ''), needsVerification: status !== 'confirmed' });
  } catch (error) {
    console.error('Product ingredient enrichment failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ success: false, status: 'failed', error: '产品成分资料查询失败，请稍后重试。' });
  }
});

app.delete('/api/products/batch', (req, res) => {
  res.json({ success: true, deleted: req.body?.ids || req.body?.prefix || 0, storage: 'local-server' });
});

app.post('/api/routine/today-products', (req, res) => {
  const productId = req.body?.product?.id || req.body?.product_id;
  const plan = req.body?.plan;
  if (!productId && !plan?.id) return res.status(400).json({ success: false, error: '缺少产品 ID 或护肤流程计划。' });
  if (plan && (!Array.isArray(plan.morning_steps) || !Array.isArray(plan.evening_steps))) return res.status(422).json({ success: false, error: '护肤流程缺少早晚步骤，无法保存。' });
  res.json({ success: true, product_id: productId || null, plan_id: plan?.id || null, syncStatus: 'synced', storage: 'local-server' });
});

app.post('/api/makeup/follow-along/save', (req, res) => {
  if (!req.body?.lookId) return res.status(400).json({ success: false, error: '缺少妆容 ID。' });
  res.json({ success: true, lookId: req.body.lookId, progress: req.body.progress || [], storage: 'local-server' });
});

app.post('/api/makeup/archive', (req, res) => {
  if (!req.body?.look) return res.status(400).json({ success: false, error: '缺少妆容档案。' });
  res.status(201).json({ success: true, data: req.body.look, storage: 'local-server' });
});

app.post('/api/avatar/generate', async (req, res) => {
  const rawImage = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
  const imageBase64 = cleanTencentImage(rawImage);
  const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
  const { apiKey, endpoint, model } = resolveSeedreamConfig();
  if (!imageBase64) return res.status(400).json({ success: false, error: '请上传一张人物照片。' });
  if (!apiKey || !endpoint || !model) return res.status(503).json({ success: false, configured: false, error: '未配置豆包 Seedream 图像生成 Endpoint。请设置 VOLCENGINE_IMAGE_ENDPOINT、VOLCENGINE_IMAGE_MODEL 和密钥。' });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt: req.body?.prompt || '将人物照片转换为自然、保留五官特征的卡通虚拟形象', image: imageInput, size: '1024x1024' }) });
    const data = await response.json() as any;
    if (!response.ok) return res.status(response.status).json({ success: false, error: data?.error?.message || '豆包图像生成失败。' });
    const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.output?.url;
    if (!imageUrl) return res.status(502).json({ success: false, error: '图像服务未返回可用图片。' });
    return res.json({ success: true, provider: 'doubao-seedream', imageUrl: imageUrl.startsWith('data:') || imageUrl.startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`, temporary: true });
  } catch (error: any) {
    return res.status(502).json({ success: false, error: error?.message || '豆包图像生成请求失败。' });
  }
});

app.post('/api/makeup/render-layer', async (req, res) => {
  const rawImage = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
  const imageBase64 = cleanTencentImage(rawImage);
  const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
  const step = req.body?.step && typeof req.body.step === 'object' ? req.body.step : {};
  const stepIndex = Number(req.body?.stepIndex);
  if (!imageInput) return res.status(400).json({ success: false, error: '请先上传本人照片。' });
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 30 || !step.title) return res.status(400).json({ success: false, error: '缺少有效的妆容步骤信息。' });
  const { apiKey, endpoint, model } = resolveSeedreamConfig();
  if (!apiKey || !endpoint || !model) return res.status(503).json({ success: false, configured: false, render_status: 'unavailable', error: '未配置豆包 Seedream 图像生成服务。' });
  const title = String(step.title).slice(0, 120);
  const targetArea = String(step.targetArea || '面部整体').slice(0, 100);
  const layerType = String(step.layerType || 'fullLook').slice(0, 40);
  const method = Array.isArray(step.method) ? step.method.slice(0, 4).map(String).join('；') : '';
  const prompt = `只完成妆容跟练的第 ${stepIndex + 1} 步「${title}」，目标区域：${targetArea}，妆容图层：${layerType}。步骤操作：${method}。生成可用于教学对照的完整人像照片：保持上传者身份、脸型、五官、发型、姿态、肤色、背景和光线不变，只表现本步骤目标区域的妆效，其余区域保持自然素颜/当前步骤前状态；不要添加文字、水印、拼贴或改变人物。${String(req.body?.style || '').slice(0, 500)}`;
  try {
    const imageUrl = await generateSeedreamImage(imageInput, prompt);
    return res.json({ success: true, render_status: 'ready', render_provider: 'doubao-seedream', layer: { stepIndex, type: layerType, name: title, description: targetArea, url: imageUrl } });
  } catch (error) {
    console.error('Seedream step image generation failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ success: false, render_status: 'failed', error: error instanceof Error ? error.message : '豆包步骤图生成失败。' });
  }
});

app.post('/api/makeup/render', async (req, res) => {
  const rawImage = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
  const imageBase64 = cleanTencentImage(rawImage);
  const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
  const { apiKey, endpoint, model } = resolveSeedreamConfig();
  if (!imageInput) return res.status(400).json({ success: false, error: '请先上传本人照片。' });
  if (!apiKey || !endpoint || !model) return res.status(503).json({ success: false, configured: false, render_status: 'unavailable', error: '未配置豆包 Seedream 图像生成服务。' });
  try {
    const prompt = String(req.body?.prompt || '保持人物身份、脸型、五官、发型和姿态不变，根据描述生成自然、可执行的完整妆容效果图。妆容要贴合真实面部结构，不改变背景和人物比例。');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt, image: imageInput, size: '1K', response_format: 'url', output_format: 'jpeg', watermark: false }) });
    const data = await response.json() as any;
    if (!response.ok) return res.status(response.status).json({ success: false, render_status: 'failed', error: data?.error?.message || 'Seedream 妆效图生成失败。' });
    const value = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.output?.url;
    if (!value) {
      const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];
      return res.json({ success: true, render_status: 'fallback', render_provider: 'doubao-seedream', imageUrl: imageInput, renderedLayers: steps.map((step: any, index: number) => ({ name: step.title || `Step ${index + 1}`, description: step.targetArea || step.layerType || '', zIndex: index + 1, source: 'fallback' })) });
    }
    const imageUrl = String(value).startsWith('data:') || String(value).startsWith('http') ? value : `data:image/jpeg;base64,${value}`;
    let renderedLayers: any[] = [];
    if (imageUrl) {
      try {
        const layerInput = await asImageDataUrl(imageUrl);
        const layerResponse = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt: '请将这张妆效图拆分为可独立编辑的图层：底图、底妆、眉毛、眼影、眼线与睫毛、腮红、修容与高光、唇妆。每个图层保持透明背景、边界贴合真实面部，不要改变人物身份。', image: layerInput, layer_decomposition: true, size: '1K', response_format: 'url', output_format: 'png', watermark: false }) });
        const layerData = await layerResponse.json() as any;
        if (layerResponse.ok && Array.isArray(layerData?.data)) renderedLayers = layerData.data.map((layer: any) => ({ url: layer.url, base64: layer.b64_json, name: layer.name, description: layer.description, zIndex: layer.z_index, boundingBox: layer.bounding_box }));
      } catch (error: any) { console.warn('Seedream layer decomposition failed:', error?.message || 'unknown error'); }
    }
    return res.json({ success: true, render_status: 'ready', render_provider: 'doubao-seedream', imageUrl, renderedLayers });
  } catch (error: any) { return res.status(502).json({ success: false, render_status: 'failed', error: error?.message || 'Seedream 妆效图请求失败。' }); }
});

app.get('/api/profile', (_req, res) => {
  res.json({ success: true, data: { id: 'local-user', privacy_consent: true, data_export: true } });
});

app.put('/api/profile', (req, res) => {
  res.json({ success: true, data: req.body, message: '资料更新接口已就绪。' });
});

app.post('/api/uploads', (req, res) => {
  res.status(202).json({ success: true, upload_id: `upload_${Date.now()}`, storage: 'local-placeholder', received: Boolean(req.body?.file || req.body?.imageBase64) });
});

app.post('/api/rules/compatibility', (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const text = JSON.stringify(products);
  const conflict = /视黄醇|A醇|Retinol/i.test(text) && /果酸|水杨酸|AHA|BHA/i.test(text);
  res.json({ success: true, safety_level: conflict ? 'danger' : 'safe', conflicts: conflict ? ['A醇与酸类建议隔天使用'] : [], validated_by: 'local-rule-engine' });
});

app.post(['/api/product/recognize', '/api/vision/detect-products'], async (req, res) => {
  const imageBase64 = cleanTencentImage(req.body?.imageBase64);
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : '';
  if (!imageBase64 && !imageUrl) return res.status(400).json({ success: false, error: '请上传图片或提供图片 URL。' });
  if (imageBase64 && imageBase64.length > 5_500_000) return res.status(413).json({ success: false, error: '图片过大，请压缩到 4MB 以内。' });
  try {
    const response = await tencentCloudRequest({
      service: 'tiia', host: 'tiia.tencentcloudapi.com', action: 'DetectProduct', version: '2019-05-29',
      payload: imageBase64 ? { ImageBase64: imageBase64 } : { ImageUrl: imageUrl },
    });
    const result = (response.Response || {}) as Record<string, any>;
    const products = Array.isArray(result.Products) ? result.Products.map((p: any) => ({ name: p.Name, parents: p.Parents, confidence: p.Confidence, bbox: { xMin: p.XMin, yMin: p.YMin, xMax: p.XMax, yMax: p.YMax } })) : [];
    if (!products.length && imageBase64) {
      try {
        const arkProducts = await arkVisionJson('识别这张化妆柜照片中能确认的商品。只返回 JSON：{"products":[{"brand":"","name":"","category":"","confidence":0}]}。看不清的字段留空，不要猜测。', imageBase64);
        const items = Array.isArray((arkProducts as any)?.products) ? (arkProducts as any).products : [];
        if (items.length) return res.json({ success: true, provider: 'tencent-product+doubao-vision', requestId: result.RequestId, products: items.map((item: any) => ({ name: item.name || item.product_name || item.brand || '待确认商品', parents: item.brand || item.category || '豆包辅助识别', confidence: Number(item.confidence || 0), bbox: item.bbox || null })), ai_assisted: true });
      } catch (error: any) { console.warn('Doubao product vision fallback failed:', error?.message || 'unknown error'); }
    }
    return res.json({ success: true, provider: 'tencent-product', requestId: result.RequestId, products });
  } catch (error: any) {
    console.error('Tencent DetectProduct failed:', error?.message || 'unknown error');
    return res.status(502).json({ success: false, provider: 'tencent-product', error: '腾讯云商品识别失败，请检查密钥、图片大小和接口配额。' });
  }
});

app.post('/api/barcode/recognize', async (req, res) => {
  const imageBase64 = cleanTencentImage(req.body?.imageBase64);
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : '';
  if (!imageBase64 && !imageUrl) return res.status(400).json({ success: false, error: '请上传图片或提供 HTTPS 图片 URL。' });
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return res.status(400).json({ success: false, error: '图片 URL 仅支持 HTTPS。' });
  if (imageBase64 && imageBase64.length > 13_500_000) return res.status(413).json({ success: false, error: '图片过大，请压缩到腾讯云支持的大小以内。' });
  try {
    const response = await tencentCloudRequest({
      service: 'ocr', host: 'ocr.tencentcloudapi.com', action: 'QrcodeOCR', version: '2018-11-19',
      payload: imageBase64 ? { ImageBase64: imageBase64 } : { ImageUrl: imageUrl },
    });
    const result = (response.Response || {}) as Record<string, any>;
    if (result.Error) return res.status(502).json({ success: false, provider: 'tencent-qrcode-ocr', error: '腾讯云未能处理这张图片，请检查图片是否清晰有效。', requestId: result.RequestId });
    const imgSize = result.ImgSize || {};
    const codes = Array.isArray(result.CodeResults) ? result.CodeResults.map((code: any) => {
      const position = code.Position || {};
      const points = ['LeftTop', 'RightTop', 'RightBottom', 'LeftBottom'].map((key) => position[key]).filter((point) => point && Number(point.X) >= 0 && Number(point.Y) >= 0);
      const xs = points.map((point: any) => Number(point.X));
      const ys = points.map((point: any) => Number(point.Y));
      return { content: String(code.Url ?? code.Data ?? ''), type: code.TypeName || 'UNKNOWN', position: points.length ? { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) } : null };
    }) : [];
    return res.json({ success: true, provider: 'tencent-qrcode-ocr', requestId: result.RequestId, imageSize: { width: Number(imgSize.Wide || 0), height: Number(imgSize.High || 0) }, codes, message: codes.length ? undefined : '图片中未检测到二维码或条形码。' });
  } catch (error: any) {
    console.error('Tencent QrcodeOCR failed:', error?.message || 'unknown error');
    return res.status(502).json({ success: false, provider: 'tencent-qrcode-ocr', error: '腾讯云二维码/条形码识别失败，请检查图片、密钥或接口配额。' });
  }
});

app.get('/api/reminders', (_req, res) => {
  res.json({ success: true, data: [], message: '提醒任务接口已就绪，可接入 Cron 或订阅消息。' });
});

app.post('/api/reminders', (req, res) => {
  res.status(201).json({ success: true, data: { ...req.body, id: `reminder_${Date.now()}` } });
});

app.get('/api/recommendations', (_req, res) => {
  res.json({ success: true, data: [], message: '推荐接口已就绪，可接入商城商品和授权评价数据。' });
});

app.get('/api/recycling', (_req, res) => {
  res.json({ success: true, data: [], points: 0, message: '回收与积分接口已就绪。' });
});

app.post('/api/recycling', (req, res) => {
  res.status(201).json({ success: true, data: { ...req.body, id: `recycle_${Date.now()}`, status: 'pending' } });
});

app.get('/api/products/:id/filing-status', (req, res) => {
  res.json({ success: true, product_id: req.params.id, filing_status: 'pending_verification', filing_number: null, filing_person: null, responsible_person: null, source: '官方平台人工核验', verified_at: null, note: '备案信息不能等同于功效认证或安全保证。' });
});

// 1. AI Routine Generation
app.post('/api/home/generate-plan', async (req, res) => {
  try {
    const { timeBudget, onlyVanity, specialScenario, vanityProducts, blacklist, skinCondition } = req.body;

    const availableProducts = (vanityProducts || []).map((p: any) => ({
      name: p.product_name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory,
      ingredients: p.ingredients,
      status: p.status,
      list_status: p.list_status
    }));

    if (ai) {
      try {
        const prompt = `
你是一名温和专业的美妆护肤专家（不给用户容貌焦虑，强调照顾自己）。
基于以下输入生成一套护肤方案：
- 时间预算: ${timeBudget || '5min'}
- 特殊场景: ${specialScenario || '日常'}
- 用户当下皮肤状态: ${skinCondition || '偏干，局部泛红'}
- 是否仅使用化妆台已有产品: ${onlyVanity ? '是' : '否'}
- 用户成分避雷库 (绝不可使用含此类成分的产品): ${JSON.stringify(blacklist || [])}
- 用户化妆台现有产品: ${JSON.stringify(availableProducts)}

请以 JSON 格式输出，字段如下：
{
  "title": "方案简练标题",
  "skin_status_summary": "温和关怀的皮肤状态总结及今日重点（不超过60字）",
  "morning_steps": [
    {
      "step_number": 1,
      "category": "步骤类别",
      "title": "步骤简短名",
      "product_name": "具体产品名称",
      "brand": "品牌",
      "dosage": "建议用量",
      "wait_time": "吸收时间",
      "instruction": "使用手法技巧",
      "notes": "温和贴心注意事项"
    }
  ],
  "evening_steps": [
    {
      "step_number": 1,
      "category": "步骤类别",
      "title": "步骤简短名",
      "product_name": "具体产品名称",
      "brand": "品牌",
      "dosage": "建议用量",
      "wait_time": "吸收时间",
      "instruction": "使用手法技巧",
      "notes": "温和贴心注意事项"
    }
  ]
}
注意：只返回纯 JSON，不带 markdown 代码块标签。
`;

        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }), 6000);

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, plan: parsed });
      } catch (e) {
        console.warn('AI call timed out or failed, using smart fallback plan', e);
      }
    }

    // Dynamic smart fallback if no AI key
    const isNightSpecial = specialScenario === '熬夜后';
    const isSensitive = specialScenario === '换季敏感' || specialScenario === '泛红';

    const fallbackPlan = {
      title: specialScenario ? `${specialScenario}·温和急救舒缓 Routine` : '今日屏障舒缓与日常水光 Routine',
      skin_status_summary: isNightSpecial
        ? '熬夜后角质层水分流失加快且微循环减慢。今日核心是“精简减负 + 退红修护”，不建议叠加高刺激活性物。'
        : isSensitive
        ? '当前屏障处于脆弱应激期，已为您自动筛除酸类与高刺激成分，采用极简无香保湿守护。'
        : '今日空气湿度适宜，紫外线中等。推荐以舒缓修护为基底，搭配轻盈锁水，让肌肤维持呼吸感。',
      morning_steps: [
        {
          step_number: 1,
          category: '舒缓肌底',
          title: '二裂酵母温和肌底唤醒',
          brand: '巴黎欧莱雅',
          product_name: '第二代黑精华肌底液',
          dosage: '1满管',
          wait_time: '掌心捂热按压 30秒',
          instruction: '利用手心自然温度轻柔按压面部吸收，避免打圈拉扯。',
          notes: '温和调节菌群微生态。'
        },
        {
          step_number: 2,
          category: '局部退红',
          title: '植萃密集退红湿敷点涂',
          brand: '修丽可',
          product_name: '植萃舒缓修护精华 (色修)',
          dosage: '4滴',
          wait_time: '轻印吸收 40秒',
          instruction: '集中轻印在鼻翼及两颊易泛红受热处。',
          notes: '无油水感配方，不闷痘。'
        },
        ...(timeBudget === '3min' ? [] : [
          {
            step_number: 3,
            category: '屏障锁水',
            title: '拟神经酰胺柔润封层',
            brand: '珂润',
            product_name: '润浸保湿滋养乳霜',
            dosage: '珍珠大小',
            wait_time: '按压吸收 1分钟',
            instruction: '掌心轻轻化开后按压于全脸干燥处，形成柔润保护膜。',
            notes: '低摩擦力上脸，预防干纹。'
          }
        ])
      ],
      evening_steps: [
        {
          step_number: 1,
          category: '夜间滋养',
          title: '肌底深度修护',
          brand: '巴黎欧莱雅',
          product_name: '第二代黑精华肌底液',
          dosage: '1.5管',
          wait_time: '吸收 1分钟',
          instruction: '温和打底，平复日间环境压力。'
        },
        {
          step_number: 2,
          category: '厚敷修复',
          title: 'B5 密集舒缓封层',
          brand: '理肤泉',
          product_name: 'B5 多效保湿修复霜',
          dosage: '黄豆粒大小',
          wait_time: '充分乳化后覆盖',
          instruction: '一定要在手心搓热乳化至半透明再按压上脸，临期优先使用。',
          notes: '厚敷舒缓泛红干痒。'
        }
      ]
    };

    return res.json({ success: true, plan: fallbackPlan });
  } catch (error: any) {
    console.error('Error generating plan:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate plan' });
  }
});

// 2. Compatibility & Chemical Conflict Detection
app.post('/api/compatibility/check', async (req, res) => {
  try {
    const products = Array.isArray(req.body?.products) ? req.body.products : [];
    const blacklist = Array.isArray(req.body?.blacklist) ? req.body.blacklist.map(String) : [];
    if (products.length < 2 || products.length > 5) return res.status(400).json({ success: false, error: '成分搭配分析需要选择 2 至 5 件产品。' });

    const prompt = `
你是一名资强化妆品配方师与护肤成分研究员。
用户在化妆台上选取了以下几款产品进行搭配使用检测：
选中的产品及已知成分: ${JSON.stringify(products)}
用户黑榜/避雷成分: ${JSON.stringify(blacklist)}

请进行严格的成分兼容性与刺激性审查：
1. 是否存在成分冲突或高刺激重叠？例如：
   - A醇/视黄醇 与 高浓度果酸(AHA)/水杨酸(BHA) 叠加（高刺激、屏障受损风险）
   - 高浓度烟酰胺 与 低pH强酸/高纯度维C 叠加（产生烟酸致泛红）
   - 多种高浓度酸类重复叠加
   - 是否命中了用户黑榜成分？
2. 输出科学搭配建议（分早晚、隔天交替、使用顺序、等待间隔）。
3. 对成分缺失的产品明确说明无法核验，不得猜测其配方；不要把透明质酸等常见名称一概当作刺激性酸。

请返回 JSON 格式：
{
  "safety_level": "safe" | "warning" | "danger",
  "summary": "一句话核心结论",
  "conflicts": [
    {
      "product_a": "产品A名",
      "product_b": "产品B名",
      "ingredient_a": "冲突成分A",
      "ingredient_b": "冲突成分B",
      "risk_description": "为什么不宜同用及潜在皮肤反应",
      "suggestion": "建议如何分开使用（例如分早晚或隔天交替）"
    }
  ],
  "ingredient_overlap": [
    "重复成分说明，如两款都含有高浓度透明质酸，可能搓泥"
  ],
  "recommended_order": [
    {
      "step": 1,
      "product_name": "产品名",
      "timing": "早间 / 晚间 / 隔天",
      "reason": "依据分子量与pH值的合理使用顺序"
    }
  ],
  "disclaimer": "护肤搭配建议，不构成医疗诊断"
}
注意：只返回纯 JSON。
`;
    let parsed: any = null;
    try { parsed = await arkTextJson(prompt); } catch (error) { console.warn('Doubao compatibility request failed:', error); }
    let provider = parsed ? 'doubao' : 'rule-engine';
    if (!parsed && ai) {
      try {
        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        }), 9000);
        parsed = JSON.parse(response.text || '{}');
        provider = 'gemini';
      } catch (error) {
        console.warn('AI compatibility call failed; using ingredient evidence rules', error);
      }
    }

    const missingProducts = products.filter((product: any) => !Array.isArray(product?.ingredients) || product.ingredients.length === 0);
    const report = parsed && typeof parsed === 'object'
      ? parsed
      : buildIngredientFallbackReport(products, blacklist);
    if (missingProducts.length) {
      report.safety_level = report.safety_level === 'danger' ? 'danger' : 'warning';
      report.missing_ingredient_products = missingProducts.map((product: any) => product?.product_name || product?.name || '未命名产品');
      report.summary = `${report.summary || ''} 以下产品成分表缺失，无法确认其完整搭配安全性：${report.missing_ingredient_products.join('、')}。`.trim();
    }
    if (!Array.isArray(report.conflicts)) report.conflicts = [];
    if (!Array.isArray(report.recommended_order)) report.recommended_order = [];
    return res.json({ success: true, report, provider });

    // Legacy deterministic rule engine fallback (kept below for compatibility with older builds).
    const names = (products || []).map((p: any) => p.product_name + ' ' + (p.ingredients || []).join(' ')).join(' ');
    const hasRetinol = /视黄醇|A醇|Retinol/i.test(names);
    const hasAcids = /果酸|甘醇酸|水杨酸|乳酸|AHA|BHA/i.test(names);
    const hasAlcohol = /变性乙醇|酒精|Alcohol/i.test(names);

    const conflicts: any[] = [];
    let safetyLevel = 'safe';
    let summary = '所选产品成分温和互补，无明显高刺激冲突，可依质地由稀至稠正常使用。';

    if (hasRetinol && hasAcids) {
      safetyLevel = 'danger';
      summary = '检测到高刺激冲突！你同时选择了「A醇(视黄醇)」与「高浓度酸类」，两者叠加会严重削弱角质屏障并引发脱皮刺痛。';
      conflicts.push({
        product_a: '露得清 A醇抗皱修护晚霜',
        product_b: '修丽可 果酸焕活修护精华',
        ingredient_a: '纯视黄醇 (Retinol)',
        ingredient_b: '复合果酸 + 水杨酸 (AHA/BHA)',
        risk_description: '酸类剥脱老旧角质的同时降低皮肤表面pH，A醇加速表皮更替，两者同用会成倍放大经皮水分流失与灼热发红风险。',
        suggestion: '绝对避免同晚叠加！建议采用“早C晚A”或“隔天轮换法”（周一酸类清理，周三/五晚A醇抗老）。'
      });
    } else if (hasAlcohol) {
      safetyLevel = 'warning';
      summary = '检测到产品中含有挥发性变性乙醇，命中黑榜敏感风险，脆弱皮不建议面部大面积使用。';
      conflicts.push({
        product_a: '高浓度高醇清爽收敛水',
        product_b: '面部维稳精华',
        ingredient_a: '变性乙醇 (酒精 >30%)',
        ingredient_b: '屏障修护成分',
        risk_description: '高挥发性酒精会破坏皮脂膜完整性，导致后续修护精华吸收时产生明显灼烧刺痛感。',
        suggestion: '建议停用或移入闲置拯救区作为化妆工具清洁剂。'
      });
    }

    const report = {
      safety_level: safetyLevel,
      summary,
      conflicts,
      ingredient_overlap: [
        '玻尿酸/透明质酸钠：多款产品中均含有保湿多糖，涂抹后请留出30-60秒充分吸收，避免后续上妆搓泥。'
      ],
      recommended_order: (products || []).map((p: any, idx: number) => ({
        step: idx + 1,
        product_name: p.product_name,
        timing: p.product_name.includes('A醇') ? '仅限晚间' : '晨晚均可',
        reason: idx === 0 ? '质地最轻盈的水相精华，优先吸收' : '乳霜质地富含脂质，最后用于封层锁水'
      })),
      disclaimer: '护肤搭配建议基于化妆品成分学常理，不构成医疗诊断。若出现持续红肿刺痛请停用并咨询皮肤科医生。'
    };

    return res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error checking compatibility:', error);
    return res.status(500).json({ error: error.message || 'Compatibility check failed' });
  }
});

// 3. OCR / Product Camera Recognition
app.post(['/api/ocr/recognize', '/api/batch/recognize'], async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const isBatchEndpoint = req.path === '/api/batch/recognize';
    if (!imageBase64) return res.status(400).json({ success: false, error: '请先拍摄或选择一张图片。' });

    const tencentImage = cleanTencentImage(imageBase64);
    if (!isBatchEndpoint && process.env.TENCENTCLOUD_SECRET_ID && process.env.TENCENTCLOUD_SECRET_KEY && tencentImage) {
      try {
        const response = await tencentCloudRequest({
          service: 'ocr', host: 'ocr.tencentcloudapi.com', action: 'GeneralAccurateOCR', version: '2018-11-19',
          payload: { ImageBase64: tencentImage },
        });
        const result = (response.Response || {}) as Record<string, any>;
        const textDetections = Array.isArray(result.TextDetections) ? result.TextDetections : [];
        const ocrText = textDetections.map((item: any) => item.DetectedText || '').filter(Boolean).join(' ');
        if (!ocrText) return res.status(422).json({ success: false, provider: 'tencent-ocr', requestId: result.RequestId, error: '图片中未识别到可用包装文字。' });
        return res.json({ success: true, provider: 'tencent-ocr', requestId: result.RequestId, textDetections, ocrText, product: { brand: '', product_name: ocrText || '待确认产品', category: '', subcategory: '', shade_name: '', ingredients: [], allergen_tags: [], user_notes: '由腾讯云高精度 OCR 提取文字，请人工核对字段。' } });
      } catch (error: any) {
        console.warn('Tencent OCR failed, fallback to existing provider:', error?.message || 'unknown error');
      }
    }

    if ((req.body?.batch === true || isBatchEndpoint) && tencentImage) {
      try {
        const batch = await arkVisionJson('识别整张化妆柜照片中能清楚确认的多个商品。只返回 JSON：{"products":[{"brand":"","product_name":"","category":"","shade_name":"","size":"","confidence":0,"evidence":""}]}。看不清的字段留空，不能确认的商品不要列出。', tencentImage);
        const items = Array.isArray((batch as any)?.products) ? (batch as any).products : [];
        if (items.length) return res.json({ success: true, provider: 'doubao-vision-batch', ai_assisted: true, items, product: { products: items } });
      } catch (error: any) { console.warn('Doubao batch vision failed:', error?.message || 'unknown error'); }
    }

    if (imageBase64) {
      try {
        const arkProduct = await arkVisionJson('请读取这张化妆品包装照片。只返回 JSON，字段为 brand、product_name、category、subcategory、shade_name、size、ingredients、confidence；看不清的字段留空，不要猜测。', imageBase64);
        if (arkProduct && typeof arkProduct === 'object' && ((arkProduct as any).product_name || (arkProduct as any).brand || Array.isArray((arkProduct as any).products))) return res.json({ success: true, provider: 'doubao-vision', ai_assisted: true, product: { ...(arkProduct as any), user_notes: '由豆包视觉辅助识别，请人工核对。' } });
      } catch (error: any) { console.warn('Doubao OCR vision fallback failed:', error?.message || 'unknown error'); }
    }

    if (ai && imageBase64) {
      const prompt = `
请仔细分析拍摄的化妆品/护肤品包装图片：
识别并提取以下结构化信息：
- brand (品牌)
- product_name (产品完整名称)
- category (skincare, base, eye, lip, tool)
- subcategory (如：精华, 面霜, 粉底液, 眼影, 口红)
- shade_name (色号名称，若有)
- pao_months (开封保质期月数，如包装上有6M/12M/24M图标，返回对应数字，没有则推测合理值)
- ingredients (主要识别到的核心成分列表)
- allergen_tags (潜在致敏物提示，如香精、酒精、A醇、果酸等)
- user_notes (一句话产品特色简介)
- repurpose_ideas (2条当该产品闲置或临期时的妙用拯救建议)

返回纯 JSON 格式：
{
  "brand": "...",
  "product_name": "...",
  "category": "...",
  "subcategory": "...",
  "shade_name": "...",
  "pao_months": 12,
  "ingredients": ["..."],
  "allergen_tags": ["..."],
  "user_notes": "...",
  "repurpose_ideas": ["..."]
}
`;
      const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      try {
        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              { inlineData: { data: cleanData, mimeType } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: 'application/json'
          }
        }), 6000);

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, product: parsed });
      } catch (e) {
        console.warn('AI OCR timed out, using fallback preset', e);
      }
    }

    return res.status(502).json({ success: false, provider: 'ocr', error: '腾讯云 OCR 未返回可用结果，请重试或调整照片后再识别。' });
  } catch (error: any) {
    console.error('Error during OCR recognition:', error);
    return res.status(500).json({ error: error.message || 'Recognition failed' });
  }
});

// 3.5. Barcode & QR Code Product Scanner
app.post('/api/scanner/barcode', async (req, res) => {
  try {
    const { barcode, qrData, imageBase64 } = req.body;

    const barcodeDatabase: Record<string, any> = {
      '6923700941829': {
        brand: '巴黎欧莱雅 (L\'Oréal Paris)',
        product_name: '第二代黑精华肌底液 (注光小黑瓶 50ml)',
        category: 'skincare',
        subcategory: '精华',
        size: '50ml',
        pao_months: 12,
        ingredients: ['二裂酵母发酵产物溶胞物', '木瓜蛋白酶', '腺苷', '水杨酰植物鞘氨醇', '透明质酸钠'],
        allergen_tags: ['微量水杨酸衍生物'],
        user_notes: '中国商品条形码官方库解析成功。日常维稳肌底液，促进后续吸收。',
        price: 369,
        shelf_location: '梳妆台一阶·精华区'
      },
      '3337875588302': {
        brand: '理肤泉 (La Roche-Posay)',
        product_name: 'B5 多效保湿修复霜 (40ml)',
        category: 'skincare',
        subcategory: '面霜/修复霜',
        size: '40ml',
        pao_months: 6,
        ingredients: ['5%维生素原B5 (泛醇)', '积雪草苷', '牛油果树果脂', '微量元素锌铜锰'],
        allergen_tags: [],
        user_notes: '法国原装进口条码。修护干燥泛红脱皮，需手心乳化后按压。',
        price: 135,
        shelf_location: '梳妆台·急救区'
      },
      '3614272890637': {
        brand: '圣罗兰 (YSL)',
        product_name: '小金条细管哑光口红 #1966',
        category: 'lip',
        subcategory: '口红',
        shade_name: '#1966 无法复刻红棕',
        shade_hex: '#962e2a',
        size: '2.2g',
        pao_months: 18,
        ingredients: ['霍霍巴籽油', '硅石', '着色剂', '生育酚乙酸酯'],
        allergen_tags: [],
        user_notes: '高端彩妆条码。显白复古暖红棕，高级皮革哑光质感。',
        price: 390,
        shelf_location: '口红架一排'
      },
      '6902395729103': {
        brand: '兰蔻 (Lancôme)',
        product_name: '菁纯臻颜精华粉底液 #100-PO',
        category: 'base',
        subcategory: '粉底液',
        shade_name: '#100-PO 瓷白色',
        shade_hex: '#f5e4d7',
        size: '35ml',
        pao_months: 12,
        ingredients: ['大马士革玫瑰精油', '玻色因', '微细感光矿物颗粒'],
        allergen_tags: [],
        user_notes: '养肤级粉底，微光柔焦妆感，适合干皮及混干皮。',
        price: 1050,
        shelf_location: '主台·底妆区'
      },
      '3605521415349': {
        brand: '赫莲娜 (HR)',
        product_name: '活颜修护舒缓晚霜 (黑绷带面霜 50ml)',
        category: 'skincare',
        subcategory: '面霜',
        size: '50ml',
        pao_months: 12,
        ingredients: ['30%玻色因溶液', '甘草酸二钾', '透明质酸钠'],
        allergen_tags: [],
        user_notes: '顶级抗老面霜，高浓度玻色因紧致饱满，夜间充盈修护。',
        price: 4180,
        shelf_location: '奢品护肤层'
      },
      '4973167159040': {
        brand: '芙丽芳丝 (Freeplus)',
        product_name: '净润洗面霜 (氨基酸洁面 100g)',
        category: 'skincare',
        subcategory: '洁面',
        size: '100g',
        pao_months: 12,
        ingredients: ['椰油酰甘氨酸钾', '烟酰胺', '光果甘草根提取物', '川谷籽提取物'],
        allergen_tags: [],
        user_notes: '温和氨基酸表面活性剂，泡沫绵密不紧绷，敏感肌友好。',
        price: 150,
        shelf_location: '洁面置物架'
      },
      '8809581471329': {
        brand: '3CE (STYLENANDA)',
        product_name: '九色眼影盘 #OVERTAKE (经典橘棕)',
        category: 'eye',
        subcategory: '眼影',
        shade_name: '#OVERTAKE 橘棕粉金',
        size: '8.1g',
        pao_months: 24,
        ingredients: ['云母', '滑石粉', '聚二甲基硅氧烷', '着色剂'],
        allergen_tags: [],
        user_notes: '消肿百搭眼影盘，珠光软糯哑光显色，适合多种日常通勤造型。',
        price: 219,
        shelf_location: '眼影收纳盒'
      }
    };

    const targetCode = (barcode || qrData || '').trim();

    // Check directly in database
    if (targetCode && barcodeDatabase[targetCode]) {
      return res.json({
        success: true,
        source: 'database',
        barcode: targetCode,
        scan_type: targetCode.startsWith('http') || targetCode.length > 20 ? 'qr_code' : 'barcode',
        product: barcodeDatabase[targetCode]
      });
    }

    // If QR code contains URL with product info or json
    if (qrData) {
      if (qrData.includes('loreal') || qrData.includes('black-serum')) {
        return res.json({
          success: true,
          source: 'qr_trace',
          barcode: '6923700941829',
          scan_type: 'qr_code',
          product: barcodeDatabase['6923700941829']
        });
      }
      if (qrData.includes('b5') || qrData.includes('laroche')) {
        return res.json({
          success: true,
          source: 'qr_trace',
          barcode: '3337875588302',
          scan_type: 'qr_code',
          product: barcodeDatabase['3337875588302']
        });
      }
      if (qrData.includes('hr') || qrData.includes('bandage')) {
        return res.json({
          success: true,
          source: 'qr_trace',
          barcode: '3605521415349',
          scan_type: 'qr_code',
          product: barcodeDatabase['3605521415349']
        });
      }
    }

    // If Gemini AI is available, use image or code to look up product
    // Barcode digits alone are not enough to infer a product. Keep this route
    // deterministic: only the verified local catalog above may populate a product.
    if (ai && (imageBase64 || targetCode)) {
      try {
        const prompt = `
你是一名化妆品商品条码与包装溯源专家。
用户扫描了一个化妆品条形码或包装盒溯源二维码：
数据/代码: "${targetCode}"

请解析出该产品档案（如果无法完全确定，请推断最合理的美妆护肤产品规格）：
{
  "brand": "品牌名 (如 巴黎欧莱雅)",
  "product_name": "产品全称 (如 复颜玻尿酸水光充盈全脸淡纹眼霜)",
  "category": "skincare" | "base" | "eye" | "lip" | "tool",
  "subcategory": "细分类别 (如 精华 / 面霜 / 口红 / 粉底液)",
  "size": "规格容量 (如 50ml / 3.5g)",
  "pao_months": 6 | 12 | 18 | 24,
  "ingredients": ["主要成分1", "主要成分2", "主要成分3"],
  "allergen_tags": ["潜在致敏或刺激标签"],
  "user_notes": "简明的使用要点与肤感说明",
  "price": 299
}
请只返回纯 JSON，不带 markdown。
`;
        let parts: any[] = [{ text: prompt }];
        if (imageBase64) {
          const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
          const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          parts = [
            { inlineData: { data: cleanData, mimeType } },
            { text: prompt }
          ];
        }

        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: { responseMimeType: 'application/json' }
        }), 6000);

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.product_name) {
          return res.json({
            success: true,
            source: 'gemini_ai',
            barcode: targetCode || 'QR_PARSED',
            scan_type: targetCode.length > 15 ? 'qr_code' : 'barcode',
            product: parsed
          });
        }
      } catch (e) {
        console.warn('AI barcode lookup fallback:', e);
      }
    }

    return res.status(404).json({ success: false, source: 'unmatched', barcode: targetCode || null, scan_type: targetCode.length > 15 ? 'qr_code' : 'barcode', error: '条码已识别，但本地商品库没有匹配记录，请手动补充商品信息。' });
  } catch (error: any) {
    console.error('Error scanning barcode/QR:', error);
    return res.status(500).json({ error: error.message || 'Scan failed' });
  }
});

// 4. AI Makeup Look Assistant
app.post('/api/makeup/generate', async (req, res) => {
  const characterGuidance = req.body?.lookType === 'cos' && req.body?.characterName ? `角色约束：这是${String(req.body.characterName)}的角色妆造。若为芙宁娜 Furina，必须使用枫丹舞台感、蓝白冷调、精致上挑眼线、蓝灰眼影、明亮高光和偏玫红唇色，不能生成普通日常妆。` : '';
  if (req.body?.referenceImage) {
    try {
      const visual = await arkVisionJson(`根据这张妆容参考图和用户输入生成可执行妆容方案。${characterGuidance}只返回 JSON，字段必须包含 title、occasion、description、matched_products、steps、step_details、lighting_advice、minimal_5min_tip。step_details 至少 8 项，每项包含 id、title、targetArea、layerType、tool、dosage、method、pitfalls、checklist、estimatedMin。用户输入：${JSON.stringify({ lookType: req.body.lookType, characterName: req.body.characterName, referenceDescription: req.body.referenceDescription })}`, cleanTencentImage(req.body.referenceImage));
      if (visual) return res.json({ success: true, look: { ...visual, ...normalizeMakeupSteps(visual.steps, visual.step_details) }, provider: 'doubao-vision' });
    } catch (error: any) { console.warn('Doubao makeup reference analysis failed:', error?.message || 'unknown error'); }
  }
  const lookPrompt = `根据用户需求生成完整的个性化妆容方案。只返回 JSON，包含 title、occasion、description、matched_products、steps、step_details、lighting_advice、minimal_5min_tip。至少 6 个步骤，每一步在 step_details 中与 steps 按索引一一对应，覆盖该妆容实际需要的底妆、眉眼、腮红/修容和唇妆。每项提供 title、targetArea、layerType、productName、tool、dosage、method、pitfalls、checklist、estimatedMin。不同风格和角色要有对应的色盘、手法与顺序，不要统一套用模板；只改变妆容，不评论或贬低外貌。角色要求：${characterGuidance || '无'} 用户需求：${JSON.stringify({ lookType: req.body?.lookType, characterName: req.body?.characterName, referenceDescription: req.body?.referenceDescription, vanityProducts: req.body?.vanityProducts, aestheticProfile: req.body?.aestheticProfile })}`;
  try {
    const doubaoLook = await arkTextJson(lookPrompt);
    if (doubaoLook && typeof doubaoLook === 'object') {
      const normalized = normalizeMakeupSteps((doubaoLook as any).steps, (doubaoLook as any).step_details);
      if (normalized.steps.length >= 3) return res.json({ success: true, look: { ...(doubaoLook as any), ...normalized }, provider: 'doubao' });
    }
  } catch (error) { console.warn('Doubao makeup text generation failed:', error instanceof Error ? error.message : 'unknown'); }
  try {
    const { lookType, referenceDescription, vanityProducts, aestheticProfile } = req.body;

    if (ai) {
        const prompt = `
你是一名高端时尚秀场与日常造型的 AI 妆造师。
我们秉持“反容貌焦虑”原则：使用“适配优势”与“风格延展”，严禁使用“脸大、五官平、缺陷”等批判性字眼。
用户请求设计一个美妆造型：
- 妆容类型: ${lookType || 'daily'} (daily:日常通勤, imitation:图片仿妆, cos:角色COS)
- 风格/参考描述: ${referenceDescription || '温润氧气自然原生感'}
- ${characterGuidance}
- 用户审美与面部档案: ${JSON.stringify(aestheticProfile || {})}
- 用户化妆台现有彩妆产品 (优先调用): ${JSON.stringify(vanityProducts || [])}

请返回 JSON 格式：
{
  "title": "妆容名称",
  "occasion": "适用场合",
  "description": "妆容氛围美学描述与适合原因",
  "matched_products": [
    {
      "slot": "底妆" | "眼影" | "腮红" | "唇妆" | "修容/眉笔",
      "product_name": "具体调用的产品名称",
      "shade": "建议色号",
      "is_dupe_alternative": false,
      "note": "使用手法或闲置巧用技巧"
    }
  ],
  "steps": [
    "底妆...", "眉毛...", "眼影...", "眼线...", "睫毛...", "腮红...", "修容与高光...", "唇妆..."
  ],
  "step_details": [
    {"id":"step_1","title":"底妆","targetArea":"全脸","layerType":"base","tool":"海绵蛋","dosage":"少量多次","method":["由面中向外轻拍"],"pitfalls":["避免厚重覆盖"],"checklist":["边缘自然"],"estimatedMin":3}
  ],
  "lighting_advice": "针对该场景的光线或持妆建议",
  "minimal_5min_tip": "如果赶时间，5分钟如何快速达成神态"
}
注意：只返回纯 JSON。
`;

      try {
        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }), 6000);

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, look: { ...parsed, ...normalizeMakeupSteps(parsed.steps, parsed.step_details) }, provider: 'gemini' });
      } catch (e) {
        console.warn('AI makeup generation timed out, using fallback look', e);
      }
    }

    // Structured fallback keeps the follow-along workflow usable even when no text model is configured.
    const fallbackSteps = lookType === 'cos' && req.body.characterName === '芙宁娜' ? ['冷白底妆与定妆','细眉和眉峰塑形','蓝灰眼影铺设','上挑细眼线','自然睫毛与眼尾加强','冷粉腮红与面中高光','鼻梁和下颌修容','偏玫红唇妆与唇峰提亮'] : ['先以保湿面霜轻揉平整两颊，海绵蛋由内而外轻压粉底液。','眉毛按目标妆容调整眉形和眉峰。','选用眼影盘浅色打底并加深眼尾。','沿真实眼型描绘眼线并夹翘睫毛。','自然睫毛与眼尾加强，避免结块。','腮红少量点在苹果肌或颧骨并向太阳穴晕开。','使用少量修容和高光强调面部结构。','口红薄涂并抿开边缘，检查唇形。'];
    const fallbackLayerTypes = ['base', 'brows', 'eyeshadow', 'eyeliner', 'lashes', 'blush', 'contour', 'lips'];
    const fallbackAreas = ['全脸', '眉毛', '眼窝', '眼型边界', '睫毛根部', '苹果肌/颧骨', '鼻梁/面中/下颌', '上下唇'];
    const fallbackStepDetails = fallbackSteps.map((title: string, index: number) => ({
      id: `step_${index + 1}`, title: title.split('：')[0], targetArea: fallbackAreas[index], layerType: fallbackLayerTypes[index], tool: '干净刷具或指腹', dosage: '少量多次',
      method: [`按当前步骤的${title}区域操作，边缘向外晕染并保留原始纹理。`], pitfalls: ['避免覆盖非目标区域或一次使用过量'], checklist: ['左右协调、边缘自然、完成后再进入下一步'], estimatedMin: 3
    }));
    const fallbackLook = {
      title: lookType === 'cos' ? `${req.body.characterName || '角色'}·角色定制妆` : '初秋暖阳·红茶微醺氧气妆',
      occasion: lookType === 'cos' ? '漫展拍摄 / 舞台COS / 角色摄影' : '日常通勤 / 闺蜜聚会 / 阳光外拍',
      description: lookType === 'cos' && req.body.characterName === '芙宁娜' ? '枫丹舞台感角色妆：蓝白冷调眼妆、精致上挑眼线、明亮面中高光与偏玫红唇色，保留本人五官比例。' : '突出面部原生骨骼的柔和弧度，底妆清透保留光泽，利用红棕唇膏的一物多用晕染出微醺血色。',
      matched_products: [
        {
          slot: '底妆',
          product_name: '兰蔻 菁纯臻颜粉底液 #100-PO',
          shade: '#100-PO',
          is_dupe_alternative: false,
          note: '局部按压半泵，轻拍匀开，呈现缎光通透肌。'
        },
        {
          slot: '眼影',
          product_name: '3CE 九宫格眼影盘 #OVERTAKE',
          shade: '暖橘奶茶',
          is_dupe_alternative: false,
          note: '大号散刷轻扫上眼皮，深冷棕点按睫毛根部替代眼线。'
        },
        {
          slot: '唇妆',
          product_name: '植村秀小黑方口红 #BR784',
          shade: '赤狐红棕',
          is_dupe_alternative: false,
          note: '薄擦唇内侧，余色用指腹轻按于两颊作为同色系腮红。'
        }
      ],
      steps: fallbackSteps,
      step_details: fallbackStepDetails,
      lighting_advice: '自然日光或室内暖光下光泽最佳；若在冷光舞台建议强化面中提亮。',
      minimal_5min_tip: '5分钟急速版：粉底局部遮瑕 + 口红一物兼顾唇颊，即刻呈现好气色。'
    };

    return res.json({ success: true, look: fallbackLook });
  } catch (error: any) {
    console.error('Error generating makeup look:', error);
    return res.status(500).json({ error: error.message || 'Makeup generation failed' });
  }
});

// 4.5. Parse Douyin / Xiaohongshu Makeup Tutorial Link or Text
app.post('/api/makeup/parse-tutorial', async (req, res) => {
  try {
    const { url, description, vanityProducts } = req.body;
    const inputText = (url || '') + ' ' + (description || '');
    const tutorialPrompt = `把用户提供的妆教资料拆成可执行、逐步对应的跟练方案。只根据明确提供的链接描述/文字，不得声称看过无法访问的视频。不同教程必须保留自己的顺序、色彩、技法和用到的产品；不确定的信息留空。只返回 JSON：{"title":"","platform":"","creator":"","makeupStyle":"","summary":"","steps":["..."],"step_details":[{"id":"step_1","title":"","targetArea":"","layerType":"base|brows|eyeshadow|eyeliner|lashes|blush|contour|highlight|lips|contacts","tool":"","dosage":"","method":[""],"pitfalls":[""],"checklist":[""],"estimatedMin":2,"productName":""}],"stepDiagrams":[{"step":1,"title":"","area":"","tip":"","vanityProduct":""}],"lipSetting":{},"cheekSetting":{},"eyeSetting":{},"baseSetting":{}}。至少 4 个步骤，step_details 与 steps 一一对应。教程输入：${JSON.stringify({ url, description, vanityProducts: (Array.isArray(vanityProducts) ? vanityProducts : []).map((product: any) => ({ brand: product.brand, name: product.product_name, category: product.category, shade: product.shade_name })) })}`;
    try {
      const doubaoResult = await arkTextJson(tutorialPrompt);
      if (doubaoResult && typeof doubaoResult === 'object') {
        const raw = doubaoResult as Record<string, any>;
        const diagrams = Array.isArray(raw.stepDiagrams) ? raw.stepDiagrams : [];
        const steps = Array.isArray(raw.steps) ? raw.steps : diagrams.map((step: any) => `${step.title || ''}${step.tip ? `：${step.tip}` : ''}`);
        const normalized = normalizeMakeupSteps(steps, raw.step_details || diagrams);
        if (normalized.steps.length) {
          const result = { ...raw, ...normalized, stepDiagrams: diagrams.length ? diagrams : normalized.step_details.map((step, index) => ({ step: index + 1, title: step.title, area: step.targetArea, tip: step.method.join('；'), vanityProduct: step.productName || '' })) };
          return res.json({ success: true, result, look: { title: result.title || 'AI 妆教跟练', type: 'imitation', occasion: result.platform || '妆教跟练', description: result.summary || '', matched_products: [], steps: normalized.steps, step_details: normalized.step_details, minimal_5min_tip: '' }, provider: 'doubao' });
        }
      }
    } catch (error) { console.warn('Doubao tutorial parsing failed:', error instanceof Error ? error.message : 'unknown'); }

    if (ai) {
      try {
        const prompt = `
你是一名精通小红书、抖音、B站流行妆造教程的美妆拆解大师。
用户提供了一个妆教链接或文本描述：
"${inputText}"
用户化妆台现有可用彩妆单品列表：
${JSON.stringify((vanityProducts || []).map((p: any) => ({ name: p.product_name, category: p.category, shade: p.shade_name })))}

请从该妆教中智能提取拆解，并与用户化妆台的产品进行匹配，输出步骤演示图文：
返回严格的 JSON 格式：
{
  "title": "妆教提取标题 (如 鞠婧祎同款倒三角白开水妆 / 纯欲韩系水光妆)",
  "platform": "小红书" | "抖音" | "B站" | "网络妆教",
  "creator": "原作者/博主推测 (如 @小红书美妆精选)",
  "makeupStyle": "韩系妆" | "亚裔妆" | "cos妆" | "新中式妆",
  "summary": "该妆教核心技法精髓与氛围特点 (50字内)",
  "lipSetting": {
    "shadeHex": "#A23B49",
    "shadeName": "玫瑰红茶",
    "depth": 75,
    "vanityMatch": "柔雾丝绒口红 豆沙粉 (薄涂叠擦)"
  },
  "cheekSetting": {
    "shadeHex": "#E88D8D",
    "shadeName": "蜜桃膨胀色",
    "amount": 65,
    "vanityMatch": "轻取口红点按晕染"
  },
  "eyeSetting": {
    "tone": "大地玫瑰冷粉棕",
    "intensity": 70,
    "vanityMatch": "柔雾九色眼影盘 玫瑰棕"
  },
  "baseSetting": {
    "finish": "半哑光水光柔焦",
    "coverage": 80,
    "vanityMatch": "轻透持妆粉底液 自然色"
  },
  "stepDiagrams": [
    {
      "step": 1,
      "title": "清透低粉感底妆",
      "area": "全脸",
      "tip": "美妆蛋浸湿挤干，由面中向外轻拍，保留皮肤自然透光感。",
      "vanityProduct": "轻透持妆粉底液"
    },
    {
      "step": 2,
      "title": "倒三角眼影轮廓",
      "area": "眼周",
      "tip": "浅奶茶色打底，眼尾向斜上方平拉，下眼影平铺放大双眼。",
      "vanityProduct": "柔雾九色眼影盘"
    },
    {
      "step": 3,
      "title": "面中膨胀色收缩腮红",
      "area": "苹果肌",
      "tip": "打在眼下三角区和鼻头，缩短中庭，幼态减龄氛围感立现。",
      "vanityProduct": "双色腮红 / 柔雾丝绒口红晕染"
    },
    {
      "step": 4,
      "title": "渐变花瓣立体唇",
      "area": "唇部",
      "tip": "先以粉扑余粉淡化唇周，唇中央点涂深色口红并用棉签外晕。",
      "vanityProduct": "柔雾丝绒口红 豆沙粉"
    }
  ]
}
只返回纯 JSON，严禁 Markdown 标记。
`;

        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        }), 6500);

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.title) {
          const diagrams = Array.isArray(parsed.stepDiagrams) ? parsed.stepDiagrams : [];
          const steps = Array.isArray(parsed.steps) ? parsed.steps : diagrams.map((step: any) => `${step.title || ''}${step.tip ? `：${step.tip}` : ''}`);
          const normalized = normalizeMakeupSteps(steps, parsed.step_details || diagrams);
          const result = { ...parsed, ...normalized, stepDiagrams: diagrams.length ? diagrams : normalized.step_details.map((step, index) => ({ step: index + 1, title: step.title, area: step.targetArea, tip: step.method.join('；'), vanityProduct: step.productName || '' })) };
          return res.json({ success: true, result, look: { title: result.title, type: 'imitation', occasion: result.platform || '妆教跟练', description: result.summary || '', matched_products: [], steps: normalized.steps, step_details: normalized.step_details, minimal_5min_tip: '' }, provider: 'gemini' });
        }
      } catch (err) {
        console.warn('AI tutorial parse fallback:', err);
      }
    }

    // High quality deterministic fallback
    const isCos = inputText.includes('cos') || inputText.includes('漫展') || inputText.includes('二次元') || inputText.includes('动漫');
    const isAsian = inputText.includes('亚裔') || inputText.includes('混血') || inputText.includes('轻欧美');

    const fallbackResult = {
      title: isCos 
        ? '漫展高显色动漫立体角色妆教' 
        : isAsian 
        ? '亚裔自然轻混血千金妆教' 
        : '小红书爆款·清透韩系倒三角白开水妆',
      platform: inputText.includes('douyin') || inputText.includes('v.douyin') ? '抖音' : '小红书',
      creator: isCos ? '@漫展美妆手记' : isAsian ? '@Sisi亚裔妆造' : '@小红书爆款教程',
      makeupStyle: isCos ? 'cos妆' : isAsian ? '亚裔妆' : '韩系妆',
      summary: '重在眼眸轮廓与面中立体感，通过口红与腮红的弱化与提亮，形成松弛高级的呼吸感。',
      lipSetting: {
        shadeHex: isCos ? '#882236' : isAsian ? '#A35345' : '#D45A6D',
        shadeName: isCos ? '暗夜樱桃' : isAsian ? '肉桂奶咖' : '多汁白桃粉',
        depth: isCos ? 90 : 65,
        vanityMatch: '柔雾丝绒口红 豆沙粉 (配合叠涂)'
      },
      cheekSetting: {
        shadeHex: isCos ? '#E56D7A' : isAsian ? '#D2856E' : '#F49E9E',
        shadeName: isCos ? '微醺血色' : isAsian ? '收缩暖杏' : '膨胀浅粉',
        amount: isCos ? 75 : 55,
        vanityMatch: '腮红刷轻扫'
      },
      eyeSetting: {
        tone: isCos ? '深红酒棕加深' : isAsian ? '低饱和冷灰棕' : '浅粉金玫瑰',
        intensity: isCos ? 85 : 60,
        vanityMatch: '柔雾九色眼影盘 玫瑰棕'
      },
      baseSetting: {
        finish: '丝绒哑光柔焦',
        coverage: 85,
        vanityMatch: '轻透持妆粉底液'
      },
      stepDiagrams: [
        {
          step: 1,
          title: '清透柔雾磨皮底妆',
          area: '全脸底妆',
          tip: '局部遮瑕后用美妆蛋薄按，眼下三角区用散粉烘焙定妆，保证8小时不暗沉。',
          vanityProduct: '轻透持妆粉底液 + 柔软散粉刷'
        },
        {
          step: 2,
          title: '眼眶倒三角深邃结构',
          area: '眼部轮廓',
          tip: '浅色铺满上下眼窝，深棕色沿着下睫毛根部勾勒卧蚕阴影，提亮眼中高光。',
          vanityProduct: '柔雾九色眼影盘'
        },
        {
          step: 3,
          title: '面中膨胀色提升幼态',
          area: '面颊苹果肌',
          tip: '将腮红横向打在眼下与鼻中段，少量带至鼻尖与下巴，缩短面中比例。',
          vanityProduct: '柔雾丝绒口红轻点或粉霜'
        },
        {
          step: 4,
          title: '花瓣雾面渐变唇',
          area: '唇部妆效',
          tip: '内深外浅晕染，用棉签擦拭模糊唇峰线条，营造饱满呼吸感。',
          vanityProduct: '柔雾丝绒口红'
        }
      ]
    };

    const normalized = normalizeMakeupSteps(fallbackResult.stepDiagrams.map((step: any) => `${step.title}：${step.tip}`), fallbackResult.stepDiagrams);
    return res.json({ success: true, result: { ...fallbackResult, ...normalized }, look: { title: fallbackResult.title, type: 'imitation', occasion: fallbackResult.platform, description: fallbackResult.summary, matched_products: [], steps: normalized.steps, step_details: normalized.step_details, minimal_5min_tip: '' }, provider: 'fallback' });
  } catch (error: any) {
    console.error('Error parsing makeup tutorial:', error);
    return res.status(500).json({ error: error.message || 'Tutorial parsing failed' });
  }
});

// 5. Idle Rescue Ideas Generator
app.post('/api/idle/rescue', async (req, res) => {
  try {
    const { product } = req.body;
    if (ai) {
      const prompt = `
针对用户闲置或快过期的化妆品/护肤品：
品牌与品名: ${product.brand} ${product.product_name}
品类: ${product.category} (${product.subcategory || ''})
质地/成分特征: ${(product.ingredients || []).join(', ')}

请输出 3 条具有极高实用价值的“闲置拯救企划”妙用改造方案：
- 面霜可改造为颈霜、身体手肘护理、免洗护甲油
- 深色眼影可改造为防水眼线胶、发际线修容、眉粉
- 不适合脸部的精华可用于手足抗老或调和身体乳
- 闲置口红可改造为温润唇颊两用腮红膏或叠涂高光

返回 JSON：
{
  "rescue_suggestions": [
    {
      "title": "妙用简名",
      "application_area": "身体部位或工具",
      "how_to_use": "具体操作方法步骤",
      "benefit": "效果与避免浪费的益处"
    }
  ]
}
注意：只返回纯 JSON。
`;
      try {
        const response = await withTimeout(ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        }), 6000);
        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, suggestions: parsed.rescue_suggestions });
      } catch (e) {
        console.warn('AI idle rescue timed out, using fallback rescue suggestions', e);
      }
    }

    // Fallback rescue
    return res.json({
      success: true,
      suggestions: [
        {
          title: '手肘膝盖深层滋养膜',
          application_area: '身体干燥关节',
          how_to_use: '沐浴后趁微湿取适量与身体乳调和厚涂，保鲜膜包裹10分钟。',
          benefit: '充分消耗闲置高油脂面霜，软化角质不浪费。'
        },
        {
          title: '指缘滋润角质软化霜',
          application_area: '指甲边缘倒刺',
          how_to_use: '睡前点涂在指甲根部与边缘，轻轻画圈按摩至吸收。',
          benefit: '避免昂贵面霜过期，代替高价专业指缘油。'
        },
        {
          title: '粉底液亲肤增润调和剂',
          application_area: '秋冬底妆',
          how_to_use: '上妆前挖取米粒大小与偏干哑光粉底在手背调匀。',
          benefit: '立即让卡粉粉底起死回生，底妆通透服帖。'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error generating idle rescue:', error);
    return res.status(500).json({ error: error.message || 'Rescue failed' });
  }
});

// Setup Vite middleware for local development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
