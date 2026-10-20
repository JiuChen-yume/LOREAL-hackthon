interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: R2Bucket;
  AI?: Ai;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  VOLCENGINE_ARK_API_KEY?: string;
  VOLCENGINE_ARK_ENDPOINT?: string;
  DOUBAO_API_KEY?: string;
  DOUBAO_MODEL?: string;
  DOUBAO_BASE_URL?: string;
  VOLCENGINE_IMAGE_API_KEY?: string;
  VOLCENGINE_IMAGE_ENDPOINT?: string;
  VOLCENGINE_IMAGE_BASE_URL?: string;
  VOLCENGINE_IMAGE_MODEL?: string;
  TAVILY_API_KEY?: string;
  WEBAR_APP_ID?: string;
  WEBAR_LICENSE_KEY?: string;
  WEBAR_TOKEN?: string;
  TENCENTCLOUD_SECRET_ID?: string;
  TENCENTCLOUD_SECRET_KEY?: string;
  TENCENTCLOUD_REGION?: string;
  APP_ENV?: string;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

const body = async (request: Request): Promise<Record<string, unknown>> => {
  try { return await request.json() as Record<string, unknown>; } catch { return {}; }
};

const deepseekJson = async (env: Env, system: string, user: string, imageBase64?: string) => {
  if (!env.DEEPSEEK_API_KEY) return null;
  const imageUrl = imageBase64 && !imageBase64.startsWith('data:') ? `data:image/jpeg;base64,${imageBase64}` : imageBase64;
  const userContent = imageBase64
    ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: imageUrl } }]
    : user;
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-flash',
      messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

const arkVisionJson = async (env: Env, user: string, imageBase64: string) => {
  const apiKey = env.DOUBAO_API_KEY || env.VOLCENGINE_ARK_API_KEY;
  const model = env.DOUBAO_MODEL || env.VOLCENGINE_ARK_ENDPOINT;
  const baseUrl = env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  if (!apiKey || !model) return null;
  const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }, { type: 'text', text: user }] }],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });
  if (!response.ok) throw new Error(`Ark request failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  try { return JSON.parse(fenced); } catch { return null; }
};

const arkTextJson = async (env: Env, user: string) => {
  const apiKey = env.DOUBAO_API_KEY || env.VOLCENGINE_ARK_API_KEY;
  const model = env.DOUBAO_MODEL || env.VOLCENGINE_ARK_ENDPOINT;
  const baseUrl = env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  if (!apiKey || !model) return null;
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ model, messages: [{ role: 'system', content: '你是化妆品资料整理助手。只输出合法 JSON，不要编造不可确认的精确含量或完整配方。' }, { role: 'user', content: user }], temperature: 0.1, max_tokens: 1200 }),
  });
  if (!response.ok) throw new Error(`Ark text request failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  try { return JSON.parse(fenced); } catch { return null; }
};

const sha256Hex = async (value: string | ArrayBuffer) => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((v) => v.toString(16).padStart(2, '0')).join('');
};

const hmacHex = async (key: string | ArrayBuffer, value: string) => {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
  return new Uint8Array(signature);
};

const tencentCloudRequest = async (env: Env, options: { service: string; host: string; action: string; version: string; payload: Record<string, unknown> }) => {
  const secretId = env.TENCENTCLOUD_SECRET_ID;
  const secretKey = env.TENCENTCLOUD_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error('TENCENTCLOUD_SECRET_ID/TENCENTCLOUD_SECRET_KEY 未配置');
  const region = env.TENCENTCLOUD_REGION || 'ap-guangzhou';
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  const payload = JSON.stringify(options.payload);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${options.host}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${await sha256Hex(payload)}`;
  const credentialScope = `${date}/${options.service}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const secretDate = await hmacHex(`TC3${secretKey}`, date);
  const secretService = await hmacHex(secretDate.buffer, options.service);
  const secretSigning = await hmacHex(secretService.buffer, 'tc3_request');
  const signatureBytes = await hmacHex(secretSigning.buffer, stringToSign);
  const signature = Array.from(signatureBytes).map((v) => v.toString(16).padStart(2, '0')).join('');
  const response = await fetch(`https://${options.host}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Host: options.host,
      'X-TC-Action': options.action,
      'X-TC-Version': options.version,
      'X-TC-Region': region,
      'X-TC-Timestamp': String(timestamp),
      Authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: payload,
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`Tencent Cloud HTTP ${response.status}`);
  return data;
};

const cleanImageBase64 = (value: unknown) => typeof value === 'string' ? value.replace(/^data:[^;]+;base64,/, '') : '';

const resolveSeedreamConfig = (env: Env) => {
  const configured = String(env.VOLCENGINE_IMAGE_ENDPOINT || '').trim();
  const baseUrl = String(env.VOLCENGINE_IMAGE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
  const endpoint = configured.startsWith('http')
    ? (configured.endsWith('/images/generations') ? configured : `${configured.replace(/\/$/, '')}/images/generations`)
    : `${baseUrl}/images/generations`;
  const model = String(env.VOLCENGINE_IMAGE_MODEL || (configured.startsWith('ep-') ? configured : env.VOLCENGINE_ARK_ENDPOINT || '')).trim();
  const apiKey = env.VOLCENGINE_IMAGE_API_KEY || env.VOLCENGINE_ARK_API_KEY || env.DOUBAO_API_KEY;
  return { endpoint, model, apiKey };
};

const asImageDataUrl = async (value: string) => {
  if (value.startsWith('data:')) return value;
  if (!value.startsWith('http')) return value;
  const response = await fetch(value);
  if (!response.ok) throw new Error(`Seedream image download failed: ${response.status}`);
  const contentType = response.headers.get('content-type') || 'image/png';
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${contentType};base64,${btoa(binary)}`;
};

const generateSeedreamImage = async (env: Env, image: string, prompt: string) => {
  const { apiKey, endpoint, model } = resolveSeedreamConfig(env);
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

const searchProductSources = async (env: Env, query: string) => {
  if (!env.TAVILY_API_KEY) return [];
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ api_key: env.TAVILY_API_KEY, query, search_depth: 'advanced', max_results: 5, include_answer: false }),
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
  const step_details = Array.from({ length: total }, (_, index) => {
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
      id: String(source.id || `step_${index + 1}`), title, targetArea, layerType,
      productId: source.productId || source.product_id,
      productName: source.productName || source.product_name || source.vanityProduct,
      shade: source.shade || source.shade_name, tool: source.tool, dosage: source.dosage || source.amount,
      method, pitfalls: Array.isArray(source.pitfalls) ? source.pitfalls.map(String) : [],
      checklist: Array.isArray(source.checklist) ? source.checklist.map(String) : [],
      estimatedMin: Number(source.estimatedMin || source.estimated_min || 2),
    };
  });
  return { steps: step_details.map((detail, index) => steps[index] || detail.title), step_details };
};

const buildIngredientFallbackReport = (products: any[], blacklist: string[] = []) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const normalize = (p: any) => {
    const ingredients = Array.isArray(p?.ingredients) ? p.ingredients.map(String) : [];
    const records = Array.isArray(p?.ingredient_records) ? p.ingredient_records.map((item: any) => `${item?.name || ''} ${item?.inci_name || ''}`) : [];
    return `${p?.brand || ''} ${p?.product_name || p?.name || ''} ${ingredients.join(' ')} ${records.join(' ')}`.toLowerCase();
  };
  const entries = safeProducts.map(product => ({ product, text: normalize(product) }));
  const has = (text: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));
  const retinol = [/retinol/i, /\ba[- ]?r/i, /视黄醇|维a醇|a醇/i];
  const acids = [/\baha\b/i, /\bbha\b/i, /glycolic|salicylic|lactic|mandelic/i, /果酸|甘醇酸|水杨酸|乳酸|杏仁酸/];
  const vitaminC = [/\bvitamin\s*c\b/i, /ascorbic/i, /vitamin[- ]?c/i, /维生素c|抗坏血酸/];
  const conflicts: any[] = [];
  const addConflict = (a: any, b: any, ingredientA: string, ingredientB: string, suggestion: string) => conflicts.push({ product_a: a.product?.product_name || 'Product A', product_b: b.product?.product_name || 'Product B', ingredient_a: ingredientA, ingredient_b: ingredientB, risk_description: 'High-activity ingredients may increase dryness, stinging, redness, and barrier stress when layered.', suggestion });
  for (let i = 0; i < entries.length; i += 1) for (let j = i + 1; j < entries.length; j += 1) {
    const a = entries[i]; const b = entries[j]; const ar = has(a.text, retinol); const br = has(b.text, retinol); const aa = has(a.text, acids); const ba = has(b.text, acids); const ac = has(a.text, vitaminC); const bc = has(b.text, vitaminC);
    if ((ar && ba) || (br && aa)) addConflict(a, b, ar ? 'Retinol / A-alcohol' : 'AHA/BHA acids', ar ? 'AHA/BHA acids' : 'Retinol / A-alcohol', 'Use on separate mornings/evenings or alternate days and wear sunscreen.');
    if ((ar && bc) || (br && ac)) addConflict(a, b, ar ? 'Retinol / A-alcohol' : 'Vitamin C', ar ? 'Vitamin C' : 'Retinol / A-alcohol', 'Separate usage times and monitor for irritation.');
  }
  const blacklisted = blacklist.filter(item => entries.some(({ text }) => text.includes(String(item).toLowerCase())));
  const missing = entries.filter(({ product }) => !Array.isArray(product?.ingredients) || !product.ingredients.length);
  return { safety_level: conflicts.length || blacklisted.length ? 'danger' : missing.length ? 'warning' : 'safe', summary: conflicts.length ? 'Detected high-activity ingredient overlap; adjust usage timing.' : blacklisted.length ? `Detected blacklist ingredients: ${blacklisted.join(', ')}` : missing.length ? 'Some selected products have no verified ingredient list; safety cannot be confirmed until package ingredients are added.' : 'No obvious high-stimulation conflict detected.', missing_ingredient_products: missing.map(({ product }) => product?.product_name || product?.name || 'Unverified product'), conflicts, ingredient_overlap: [], recommended_order: safeProducts.map((product, index) => ({ step: index + 1, product_name: product?.product_name || 'Unverified product', timing: has(normalize(product), retinol) ? 'Night only / alternate days' : 'Morning and evening', reason: index === 0 ? 'Use lighter textures first' : 'Layer from thin to rich' })), disclaimer: 'Cosmetic compatibility guidance only; not a medical diagnosis.' };
};

const runVisionAssist = async (env: Env, imageBase64: string, prompt: string) => {
  if (!env.AI) return null;
  try {
    const bytes = Uint8Array.from(atob(imageBase64), (char) => char.charCodeAt(0));
    const result = await (env.AI as any).run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: bytes,
      prompt,
      max_tokens: 1200,
    });
    const text = String(result?.description ?? result?.response ?? result?.result ?? '').trim();
    if (!text) return null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
    try { return JSON.parse(fenced); } catch { return { description: text }; }
  } catch (error) {
    console.error('Cloudflare Vision AI failed:', error instanceof Error ? error.message : 'unknown error');
    return null;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (url.pathname === '/api/health') {
      return json({ success: true, service: 'beauty-twin-cloudflare', environment: env.APP_ENV ?? 'production', ai_enabled: Boolean(env.GEMINI_API_KEY) });
    }

    if (url.pathname === '/api/catalog') {
      return json({ success: true, apis: [
        { name: '护理计划生成', method: 'POST', path: '/api/home/generate-plan', status: 'connected' },
        { name: '成分兼容性检测', method: 'POST', path: '/api/compatibility/check', status: 'connected' },
        { name: '包装 OCR', method: 'POST', path: '/api/ocr/recognize', status: 'connected' },
        { name: '腾讯云商品识别', method: 'POST', path: '/api/product/recognize', status: env.TENCENTCLOUD_SECRET_ID && env.TENCENTCLOUD_SECRET_KEY ? 'connected' : 'auth-required' },
        { name: '腾讯云高精度 OCR', method: 'POST', path: '/api/ocr/tencent', status: env.TENCENTCLOUD_SECRET_ID && env.TENCENTCLOUD_SECRET_KEY ? 'connected' : 'auth-required' },
        { name: '腾讯云二维码/条形码识别', method: 'POST', path: '/api/barcode/recognize', status: env.TENCENTCLOUD_SECRET_ID && env.TENCENTCLOUD_SECRET_KEY ? 'connected' : 'auth-required' },
        { name: '化妆台产品 CRUD', method: 'GET / POST', path: '/api/products', status: 'local-ready' },
        { name: '备案核验', method: 'GET', path: '/api/products/{id}/filing-status', status: 'local-ready' },
        { name: '用户资料', method: 'GET / PUT', path: '/api/profile', status: 'local-ready' },
        { name: '提醒任务', method: 'GET / POST', path: '/api/reminders', status: 'local-ready' },
        { name: '回收与积分', method: 'GET / POST', path: '/api/recycling', status: 'local-ready' },
        { name: 'Gemini / OCR / 天气', method: 'POST / GET', path: '/api/ai/*', status: 'auth-required' },
      ] });
    }

    if (url.pathname === '/api/auth/session') return json({ success: true, authenticated: false, provider: 'cloudflare-demo' });
    if (url.pathname === '/api/ai/health') return json({ success: true, provider: env.VOLCENGINE_ARK_API_KEY && env.VOLCENGINE_ARK_ENDPOINT ? 'doubao' : env.AI ? 'cloudflare-ai' : env.DEEPSEEK_API_KEY ? 'deepseek' : env.GEMINI_API_KEY ? 'gemini' : 'fallback', doubao_configured: Boolean(env.VOLCENGINE_ARK_API_KEY), doubao_endpoint_configured: Boolean(env.VOLCENGINE_ARK_ENDPOINT), cloudflare_ai_configured: Boolean(env.AI), deepseek_configured: Boolean(env.DEEPSEEK_API_KEY), gemini_configured: Boolean(env.GEMINI_API_KEY) });
    if (url.pathname === '/api/webar/config') {
      if (!env.WEBAR_APP_ID || !env.WEBAR_LICENSE_KEY) return json({ success: false, error: 'WebAR credentials are not configured.' }, 503);
      return json({ success: true, config: { appId: env.WEBAR_APP_ID, licenseKey: env.WEBAR_LICENSE_KEY } });
    }
    if (url.pathname === '/api/webar/signature') {
      if (!env.WEBAR_APP_ID || !env.WEBAR_TOKEN) return json({ success: false, error: 'WebAR signing token is not configured.' }, 503);
      const timestamp = Math.floor(Date.now() / 1000);
      const encoded = new TextEncoder().encode(`${timestamp}${env.WEBAR_TOKEN}${env.WEBAR_APP_ID}${timestamp}`);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      const signature = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
      return json({ signature, timestamp });
    }
    if (url.pathname === '/api/weather') return json({ success: false, configured: false, message: '请先配置和风天气服务端密钥。' }, 503);

    if (url.pathname === '/api/uploads' && request.method === 'POST') {
      const input = await body(request);
      const dataUrl = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return json({ success: false, error: '请传入 data URL 格式的 imageBase64。' }, 400);
      const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
      const key = `uploads/${crypto.randomUUID()}`;
      await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: match[1] } });
      return json({ success: true, key, storage: 'cloudflare-r2', message: '图片已存入 R2。' }, 201);
    }

    if (url.pathname === '/api/products' && request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 100').all();
      return json({ success: true, data: result.results });
    }

    if (url.pathname === '/api/products' && request.method === 'POST') {
      const input = await body(request);
      const tryOn = (input.try_on && typeof input.try_on === 'object') ? input.try_on as Record<string, unknown> : {};
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO products (id, brand, product_name, category, subcategory, barcode, shade_name, shade_hex, ingredients_json, try_on_provider, try_on_effect_id, try_on_asset_version, try_on_default_intensity, try_on_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, String(input.brand ?? ''), String(input.product_name ?? ''), String(input.category ?? ''), String(input.subcategory ?? ''), String(input.barcode ?? ''), String(input.shade_name ?? ''), String(input.shade_hex ?? ''), JSON.stringify(input.ingredients ?? []), String(tryOn.provider ?? 'unavailable'), String(tryOn.effectId ?? ''), String(tryOn.assetVersion ?? ''), Number(tryOn.defaultIntensity ?? 75), String(tryOn.status ?? 'unconfigured')).run();
      return json({ success: true, data: { ...input, id } }, 201);
    }

    if (url.pathname === '/api/products/enrich' && request.method === 'POST') {
      const input = await body(request);
      const product = (input.product || {}) as Record<string, unknown>;
      const identity = [product.brand, product.product_name, product.size, product.shade_name, product.barcode].filter(Boolean).join(' · ');
      if (!product.brand || !product.product_name) return json({ success: false, status: 'failed', error: '缺少品牌和完整产品名称，无法进行准确成分查询。' }, 400);
      const promptBase = `请只整理有证据支持的化妆品资料，精确匹配商品：${identity}。优先官方产品页和包装成分表；无法确认具体 SKU 时，ingredients 必须为空。严禁按品类、相似商品或常识补全成分，严禁编造浓度、功效、评价或评分。review_summary 只能总结提供的公开来源，区分消费者评价与官方宣称。只返回 JSON：{"ingredients":[{"name":"中文名","inci_name":"INCI","source":"来源","source_url":"","verified":false}],"benefits":[],"cautions":[],"review_summary":"","review_sources":[{"title":"","url":""}],"confidence":0,"source":"","source_url":"","needsVerification":true,"evidence":"","error":""}`;
      try {
        const sources = await searchProductSources(env, `${identity} official ingredients review`);
        const prompt = `${promptBase}\n公开搜索结果（仅限以下材料，不可自行伪造来源）：${JSON.stringify(sources)}`;
        const value = await arkTextJson(env, prompt) || await deepseekJson(env, '你是化妆品资料整理助手。只输出 JSON，不要编造配方。', prompt);
        if (!value) {
          const ingredients = Array.isArray(product.ingredients) ? product.ingredients.map(String) : [];
          return json({ success: true, status: ingredients.length ? 'needs_verification' : 'not_found', configured: false, source: 'user-or-package-data', search_sources: sources, product: { ...product, ingredients, ingredient_records: ingredients.map((name: string) => ({ name, verified: false, source: 'user-or-package-data' })), ingredient_analysis: { benefits: [], cautions: ['请以包装成分表为准；当前未能完成公开资料核验。'], review_summary: sources.length ? '已找到公开来源，但 AI 摘要服务未配置，未生成评价摘要。' : '未配置公开搜索或 AI 服务，暂时无法查询评价和成分。', evidence: '', confidence: 0 } }, needsVerification: true });
        }
        const parsed = value as Record<string, unknown>;
        const rawRecords = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
        const records = rawRecords.map((entry: any) => typeof entry === 'string' ? ({ name: entry, verified: false }) : ({ name: String(entry?.name || '').trim(), inci_name: entry?.inci_name ? String(entry.inci_name) : undefined, source: entry?.source ? String(entry.source) : undefined, source_url: entry?.source_url ? String(entry.source_url) : undefined, verified: entry?.verified === true })).filter((entry: any) => entry.name).slice(0, 50);
        const ingredients = records.map((entry: any) => entry.name);
        const status = ingredients.length ? (parsed.needsVerification === false ? 'confirmed' : 'needs_verification') : 'not_found';
        const reviewSources = Array.isArray(parsed.review_sources) ? parsed.review_sources : sources.map((item: any) => ({ title: item.title, url: item.url }));
        return json({ success: true, status, provider: env.DOUBAO_API_KEY || env.VOLCENGINE_ARK_API_KEY ? 'doubao' : 'deepseek', source: String(parsed.source || (sources.length ? 'public-search+ai-summary' : 'ai-summary-unverified')), source_url: parsed.source_url ? String(parsed.source_url) : sources[0]?.url, search_sources: reviewSources, product: { ...product, ingredients, ingredient_records: records, ingredient_analysis: { benefits: Array.isArray(parsed.benefits) ? parsed.benefits.map(String).slice(0, 12) : [], cautions: Array.isArray(parsed.cautions) ? parsed.cautions.map(String).slice(0, 12) : [], review_summary: String(parsed.review_summary || ''), evidence: String(parsed.evidence || ''), confidence: Number(parsed.confidence || 0) } }, evidence: String(parsed.evidence || ''), needsVerification: status !== 'confirmed' });
      } catch (error) {
        console.error('Product ingredient enrichment failed:', error instanceof Error ? error.message : 'unknown');
        return json({ success: false, status: 'failed', error: '产品成分资料查询失败，请稍后重试。' }, 502);
      }
    }

    if (url.pathname === '/api/products/sync' && request.method === 'POST') {
      const input = await body(request);
      const products = Array.isArray(input.products) ? input.products : [];
      if (!products.length) return json({ success: false, error: '没有可同步的产品。' }, 400);
      const synced: Array<{ id: string; syncStatus: string }> = [];
      for (const raw of products) {
        const product = raw as Record<string, unknown>;
        const id = String(product.id || crypto.randomUUID());
        try {
          await env.DB.prepare('INSERT OR REPLACE INTO products (id, brand, product_name, category, subcategory, barcode, shade_name, shade_hex, ingredients_json, ingredient_records_json, ingredient_enrichment_status, ingredient_enrichment_source, ingredient_enrichment_source_url, ingredient_enrichment_queried_at, ingredient_enrichment_error, ingredient_analysis_json, try_on_provider, try_on_effect_id, try_on_asset_version, try_on_default_intensity, try_on_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(id, String(product.brand || ''), String(product.product_name || '待确认商品'), String(product.category || ''), String(product.subcategory || ''), String(product.barcode || ''), String(product.shade_name || ''), String(product.shade_hex || ''), JSON.stringify(product.ingredients || []), JSON.stringify(product.ingredient_records || []), String(product.ingredient_enrichment_status || 'not_queried'), String(product.ingredient_enrichment_source || ''), String(product.ingredient_enrichment_source_url || ''), String(product.ingredient_enrichment_queried_at || ''), String(product.ingredient_enrichment_error || ''), JSON.stringify(product.ingredient_analysis || {}), 'unavailable', '', '', 75, 'unconfigured').run();
          synced.push({ id, syncStatus: 'synced' });
        } catch { synced.push({ id, syncStatus: 'failed' }); }
      }
      return json({ success: true, synced, storage: 'cloudflare-d1' });
    }

    if (url.pathname === '/api/products/batch' && request.method === 'DELETE') {
      const input = await body(request);
      const prefix = String(input.prefix || '');
      const ids = Array.isArray(input.ids) ? input.ids.map(String).filter(Boolean) : [];
      if (!prefix && !ids.length) return json({ success: false, error: '缺少删除范围。' }, 400);
      if (prefix) {
        await env.DB.prepare('DELETE FROM products WHERE id LIKE ?').bind(`${prefix}%`).run();
      } else {
        for (const id of ids) await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      }
      return json({ success: true, deleted: ids.length || prefix, storage: 'cloudflare-d1' });
    }

    if (url.pathname === '/api/routine/today-products' && request.method === 'POST') {
      const input = await body(request);
      const product = (input.product || {}) as Record<string, unknown>;
      const plan = (input.plan || {}) as Record<string, unknown>;
      const planId = String(plan.id || 'today');
      const items = Array.isArray(plan.today_makeup_products) ? plan.today_makeup_products as Array<Record<string, unknown>> : [];
      if (!product.id && !items.length) return json({ success: false, error: '缺少产品 ID 或护肤流程计划。' }, 400);
      const toSave = items.length ? items : [{ product_id: product.id, step: '今日妆容/护理', source: 'vanity', completed: false }];
      for (const item of toSave) {
        const productId = String(item.product_id || '');
        if (!productId) continue;
        const itemId = `${planId}:${productId}`;
        await env.DB.prepare('INSERT OR REPLACE INTO routine_plan_items (id, plan_id, product_id, step, source, completed) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(itemId, planId, productId, String(item.step || '护肤'), String(item.source || 'vanity'), item.completed ? 1 : 0).run();
      }
      return json({ success: true, product_id: product.id ? String(product.id) : null, plan_id: planId, syncStatus: 'synced', storage: 'cloudflare-d1' });
    }

    if (url.pathname === '/api/makeup/follow-along/save' && request.method === 'POST') {
      const input = await body(request);
      if (!input.lookId) return json({ success: false, error: '缺少妆容 ID。' }, 400);
      await env.DB.prepare('INSERT OR REPLACE INTO makeup_follow_progress (look_id, progress_json, updated_at) VALUES (?, ?, datetime(\'now\'))')
        .bind(String(input.lookId), JSON.stringify(input.progress || [])).run();
      return json({ success: true, lookId: String(input.lookId), progress: input.progress || [], storage: 'cloudflare-d1' });
    }

    if (url.pathname === '/api/makeup/archive' && request.method === 'POST') {
      const input = await body(request);
      if (!input.look) return json({ success: false, error: '缺少妆容档案。' }, 400);
      return json({ success: true, data: input.look, storage: 'cloudflare-d1' }, 201);
    }

    if (url.pathname === '/api/avatar/generate' && request.method === 'POST') {
      const input = await body(request);
      const rawImage = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
      const imageBase64 = cleanImageBase64(rawImage);
      const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
      const { apiKey, endpoint, model } = resolveSeedreamConfig(env);
      if (!imageBase64) return json({ success: false, error: '请上传一张人物照片。' }, 400);
      if (!apiKey || !endpoint || !model) return json({ success: false, configured: false, error: '未配置豆包 Seedream 图像生成 Endpoint。' }, 503);
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt: String(input.prompt || '将人物照片转换为自然、保留五官特征的卡通虚拟形象'), image: imageInput, size: '1024x1024' }) });
        const data = await response.json() as Record<string, any>;
        if (!response.ok) return json({ success: false, error: data?.error?.message || '豆包图像生成失败。' }, response.status);
        const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.output?.url;
        if (!imageUrl) return json({ success: false, error: '图像服务未返回可用图片。' }, 502);
        return json({ success: true, provider: 'doubao-seedream', imageUrl: String(imageUrl).startsWith('data:') || String(imageUrl).startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`, temporary: true });
      } catch { return json({ success: false, error: '豆包图像生成请求失败。' }, 502); }
    }

    if (url.pathname === '/api/makeup/render' && request.method === 'POST') {
      const input = await body(request);
      const rawImage = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
      const imageBase64 = cleanImageBase64(rawImage);
      const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
      const { apiKey, endpoint, model } = resolveSeedreamConfig(env);
      if (!imageInput) return json({ success: false, error: '请先上传本人照片。' }, 400);
      if (!apiKey || !endpoint || !model) return json({ success: false, configured: false, render_status: 'unavailable', error: '未配置豆包 Seedream 图像生成服务。' }, 503);
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt: String(input.prompt || '保持人物身份、脸型、五官、发型和姿态不变，根据描述生成自然、可执行的完整妆容效果图。妆容要贴合真实面部结构，不改变背景和人物比例。'), image: imageInput, size: '1K', response_format: 'url', output_format: 'jpeg', watermark: false }) });
        const data = await response.json() as Record<string, any>;
        if (!response.ok) return json({ success: false, render_status: 'failed', error: data?.error?.message || 'Seedream 妆效图生成失败。' }, response.status);
        const value = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.output?.url;
        if (!value) {
          const steps = Array.isArray(input.steps) ? input.steps : [];
          return json({ success: true, render_status: 'fallback', render_provider: 'doubao-seedream', imageUrl: imageInput, renderedLayers: steps.map((step: any, index: number) => ({ name: step.title || `Step ${index + 1}`, description: step.targetArea || step.layerType || '', zIndex: index + 1, source: 'fallback' })) });
        }
        const imageUrl = String(value).startsWith('data:') || String(value).startsWith('http') ? value : `data:image/jpeg;base64,${value}`;
        return json({ success: true, render_status: 'ready', render_provider: 'doubao-seedream', imageUrl, renderedLayers: [] });
        let renderedLayers: any[] = [];
        if (imageUrl) {
          try {
            const layerInput = await asImageDataUrl(String(imageUrl));
            const layerResponse = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, prompt: '请将这张妆效图拆分为可独立编辑的图层：底图、底妆、眉毛、眼影、眼线与睫毛、腮红、修容与高光、唇妆。每个图层保持透明背景、边界贴合真实面部，不要改变人物身份。', image: layerInput, layer_decomposition: true, size: '1K', response_format: 'url', output_format: 'png', watermark: false }) });
            const layerData = await layerResponse.json() as Record<string, any>;
            if (layerResponse.ok && Array.isArray(layerData?.data)) renderedLayers = layerData.data.map((layer: any) => ({ url: layer.url, base64: layer.b64_json, name: layer.name, description: layer.description, zIndex: layer.z_index, boundingBox: layer.bounding_box }));
          } catch { /* final image remains usable when layer splitting is unavailable */ }
        }
        return json({ success: true, render_status: 'ready', render_provider: 'doubao-seedream', imageUrl, renderedLayers });
      } catch { return json({ success: false, render_status: 'failed', error: 'Seedream 妆效图请求失败。' }, 502); }
    }

    if (url.pathname === '/api/makeup/render-layer' && request.method === 'POST') {
      const input = await body(request);
      const rawImage = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
      const imageBase64 = cleanImageBase64(rawImage);
      const imageInput = rawImage.startsWith('data:') ? rawImage : imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
      const step = input.step && typeof input.step === 'object' ? input.step as Record<string, any> : {};
      const stepIndex = Number(input.stepIndex);
      if (!imageInput) return json({ success: false, error: '请先上传本人照片。' }, 400);
      if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 30 || !step.title) return json({ success: false, error: '缺少有效的妆容步骤信息。' }, 400);
      const { apiKey, endpoint, model } = resolveSeedreamConfig(env);
      if (!apiKey || !endpoint || !model) return json({ success: false, configured: false, render_status: 'unavailable', error: '未配置豆包 Seedream 图像生成服务。' }, 503);
      const title = String(step.title).slice(0, 120);
      const targetArea = String(step.targetArea || '面部整体').slice(0, 100);
      const layerType = String(step.layerType || 'fullLook').slice(0, 40);
      const method = Array.isArray(step.method) ? step.method.slice(0, 4).map(String).join('；') : '';
      const prompt = `只完成妆容跟练的第 ${stepIndex + 1} 步「${title}」，目标区域：${targetArea}，妆容图层：${layerType}。步骤操作：${method}。生成可用于教学对照的完整人像照片：保持上传者身份、脸型、五官、发型、姿态、肤色、背景和光线不变，只表现本步骤目标区域的妆效，其余区域保持自然素颜/当前步骤前状态；不要添加文字、水印、拼贴或改变人物。${String(input.style || '').slice(0, 500)}`;
      try {
        const imageUrl = await generateSeedreamImage(env, imageInput, prompt);
        return json({ success: true, render_status: 'ready', render_provider: 'doubao-seedream', layer: { stepIndex, type: layerType, name: title, description: targetArea, url: imageUrl } });
      } catch (error) {
        console.error('Seedream step image generation failed:', error instanceof Error ? error.message : 'unknown');
        return json({ success: false, render_status: 'failed', error: error instanceof Error ? error.message : '豆包步骤图生成失败。' }, 502);
      }
    }

    if (url.pathname === '/api/profile' && request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind('local-user').first();
      return json({ success: true, data: result ?? { id: 'local-user', privacy_consent: 0 } });
    }

    if (url.pathname === '/api/profile' && request.method === 'PUT') {
      const input = await body(request);
      await env.DB.prepare('INSERT INTO profiles (id, display_name, privacy_consent) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, privacy_consent = excluded.privacy_consent, updated_at = datetime(\'now\')')
        .bind('local-user', String(input.display_name ?? ''), input.privacy_consent ? 1 : 0).run();
      return json({ success: true, data: input });
    }

    if (url.pathname === '/api/reminders' && request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM reminders ORDER BY due_at ASC LIMIT 100').all();
      return json({ success: true, data: result.results });
    }

    if (url.pathname === '/api/reminders' && request.method === 'POST') {
      const input = await body(request); const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO reminders (id, type, title, due_at) VALUES (?, ?, ?, ?)').bind(id, String(input.type ?? 'custom'), String(input.title ?? ''), String(input.due_at ?? '')).run();
      return json({ success: true, data: { ...input, id } }, 201);
    }

    if (url.pathname === '/api/recycling' && request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM recycling_records ORDER BY created_at DESC LIMIT 100').all();
      return json({ success: true, data: result.results });
    }

    if (url.pathname === '/api/recycling' && request.method === 'POST') {
      const input = await body(request); const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO recycling_records (id, item_name, points) VALUES (?, ?, ?)').bind(id, String(input.item_name ?? ''), Number(input.points ?? 0)).run();
      return json({ success: true, data: { ...input, id, status: 'pending' } }, 201);
    }

    const filingMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/filing-status$/);
    if (filingMatch) return json({ success: true, product_id: filingMatch[1], filing_status: 'pending_verification', filing_number: null, filing_person: null, responsible_person: null, source: '官方平台人工核验', verified_at: null });

    if (url.pathname === '/api/home/generate-plan' && request.method === 'POST') {
      const input = await body(request);
      try {
        const plan = await deepseekJson(env, '你是温和专业的美妆护肤顾问。只返回 JSON，不制造容貌焦虑。', `根据以下输入生成早晚护理计划：${JSON.stringify(input)}。字段必须包含 title、skin_status_summary、morning_steps、evening_steps。`, undefined);
        if (plan) return json({ success: true, plan, provider: 'deepseek' });
      } catch { /* fall through to deterministic demo response */ }
      return json({ success: true, plan: { title: '屏障舒缓与日常水光 Routine', skin_status_summary: '当前使用本地规则兜底。', morning_steps: [], evening_steps: [] }, provider: 'fallback' });
    }
    if (url.pathname === '/api/compatibility/check' && request.method === 'POST') {
      const input = await body(request);
      const products = Array.isArray(input.products) ? input.products : [];
      const blacklist = Array.isArray(input.blacklist) ? input.blacklist.map(String) : [];
      if (products.length < 2 || products.length > 5) return json({ success: false, error: '成分搭配分析需要选择 2 至 5 件产品。' }, 400);
      const prompt = `你是化妆品成分安全顾问，只依据输入中的成分分析，不做医疗诊断。分析以下 ${products.length} 件产品的活性成分冲突、重复刺激、黑名单命中及使用顺序：${JSON.stringify(products)}。用户黑名单：${JSON.stringify(blacklist)}。如果有产品成分缺失，明确指出无法核验，不得猜配方；透明质酸等名称不能仅凭包含“酸”字就判为刺激性酸。只返回 JSON，字段 safety_level(safe|warning|danger)、summary、conflicts(含 product_a/product_b/ingredient_a/ingredient_b/risk_description/suggestion)、ingredient_overlap、recommended_order、disclaimer。`;
      let report: any = null;
      let provider = 'fallback';
      try {
        report = await arkTextJson(env, prompt);
        if (report) provider = 'doubao';
      } catch { /* fall through */ }
      if (!report) {
        try {
          report = await deepseekJson(env, '你是化妆品成分安全顾问。只返回 JSON，不做医疗诊断。', prompt, undefined);
          if (report) provider = 'deepseek';
        } catch { /* fall through to ingredient evidence rules */ }
      }
      report = report && typeof report === 'object' ? report : buildIngredientFallbackReport(products, blacklist);
      const missingProducts = products.filter((product: any) => !Array.isArray(product?.ingredients) || product.ingredients.length === 0);
      if (missingProducts.length) {
        report.safety_level = report.safety_level === 'danger' ? 'danger' : 'warning';
        report.missing_ingredient_products = missingProducts.map((product: any) => product?.product_name || product?.name || '未命名产品');
        report.summary = `${report.summary || ''} 以下产品成分表缺失，无法确认其完整搭配安全性：${report.missing_ingredient_products.join('、')}。`.trim();
      }
      if (!Array.isArray(report.conflicts)) report.conflicts = [];
      if (!Array.isArray(report.recommended_order)) report.recommended_order = [];
      return json({ success: true, report, provider });
    }
    if ((url.pathname === '/api/product/recognize' || url.pathname === '/api/vision/detect-products') && request.method === 'POST') {
      const input = await body(request);
      const imageBase64 = cleanImageBase64(input.imageBase64);
      const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl : '';
      if (!imageBase64 && !imageUrl) return json({ success: false, error: '请上传图片或提供图片 URL。' }, 400);
      if (imageBase64 && imageBase64.length > 5_500_000) return json({ success: false, error: '图片过大，请压缩到 4MB 以内。' }, 413);
      try {
        const response = await tencentCloudRequest(env, {
          service: 'tiia', host: 'tiia.tencentcloudapi.com', action: 'DetectProduct', version: '2019-05-29',
          payload: imageBase64 ? { ImageBase64: imageBase64 } : { ImageUrl: imageUrl },
        });
        const result = (response.Response || {}) as Record<string, unknown>;
        const products = Array.isArray(result.Products) ? result.Products.map((item) => {
          const p = item as Record<string, unknown>;
          return { name: p.Name, parents: p.Parents, confidence: p.Confidence, bbox: { xMin: p.XMin, yMin: p.YMin, xMax: p.XMax, yMax: p.YMax } };
        }) : [];
        if (!products.length && imageBase64) {
          try {
            const arkProducts = await arkVisionJson(env, '识别这张化妆柜照片中能确认的商品。只返回 JSON：{"products":[{"brand":"","name":"","category":"","confidence":0}]}。看不清的字段留空，不要猜测。', imageBase64);
            const items = Array.isArray((arkProducts as any)?.products) ? (arkProducts as any).products : [];
            if (items.length) return json({ success: true, provider: 'tencent-product+doubao-vision', requestId: result.RequestId, products: items.map((item: any) => ({ name: item.name || item.product_name || item.brand || '待确认商品', parents: item.brand || item.category || '豆包辅助识别', confidence: Number(item.confidence || 0), bbox: item.bbox || null })), ai_assisted: true });
          } catch (error) { console.error('Doubao product vision fallback failed:', error instanceof Error ? error.message : 'unknown error'); }
          try {
            const deepseekProducts = await deepseekJson(env, '你是化妆品货架识别助手。只返回 JSON。只能列出图片中能清楚确认的商品或品牌，不要猜测型号。', '识别这张化妆柜照片中可见的商品，返回 {"products":[{"brand":"","name":"","category":"","confidence":0}]}。看不清名称时保留品牌并将 name 留空。', imageBase64);
            const items = Array.isArray((deepseekProducts as any)?.products) ? (deepseekProducts as any).products : (deepseekProducts && typeof deepseekProducts === 'object' && ((deepseekProducts as any).brand || (deepseekProducts as any).product_name || (deepseekProducts as any).complete_product_name) ? [deepseekProducts] : []);
            if (items.length) return json({ success: true, provider: 'tencent-product+deepseek-vision', requestId: result.RequestId, products: items.map((item: any) => ({ name: item.name || item.product_name || item.brand || '待确认商品', parents: item.brand || item.category || 'AI 辅助识别', confidence: Number(item.confidence || 0), bbox: item.bbox || null })), ai_assisted: true });
          } catch (error) { console.error('DeepSeek product vision fallback failed:', error instanceof Error ? error.message : 'unknown error'); }
          const assist = await runVisionAssist(env, imageBase64, '请识别这张化妆柜照片中的可见化妆品和护肤品。只返回 JSON 数组，字段为 name、brand、category、confidence；看不清或无法确认的商品不要猜测。不要返回 Markdown，不要把同一商品重复列出。');
          const aiProducts = Array.isArray(assist) ? assist : Array.isArray((assist as any)?.products) ? (assist as any).products : [];
          if (aiProducts.length) return json({ success: true, provider: 'tencent-product+cloudflare-ai', requestId: result.RequestId, products: aiProducts.map((item: any) => ({ name: item.name || item.product_name || '待确认商品', parents: item.brand || item.category || 'AI 辅助识别', confidence: Number(item.confidence || 0), bbox: item.bbox || null })), ai_assisted: true });
          if ((assist as any)?.description) return json({ success: true, provider: 'cloudflare-ai-vision', requestId: result.RequestId, products: [{ name: String((assist as any).description).slice(0, 180), parents: 'AI 辅助识别摘要', confidence: 0, bbox: null }], ai_assisted: true });
        }
        return json({ success: true, provider: 'tencent-product', requestId: result.RequestId, products });
      } catch (error) {
        console.error('Tencent DetectProduct failed:', error instanceof Error ? error.message : 'unknown error');
        return json({ success: false, provider: 'tencent-product', error: '腾讯云商品识别失败，请检查密钥、图片大小和接口配额。' }, 502);
      }
    }
    if (url.pathname === '/api/barcode/recognize' && request.method === 'POST') {
      const input = await body(request);
      const imageBase64 = cleanImageBase64(input.imageBase64);
      const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl : '';
      if (!imageBase64 && !imageUrl) return json({ success: false, error: '请上传图片或提供 HTTPS 图片 URL。' }, 400);
      if (imageUrl && !/^https:\/\//i.test(imageUrl)) return json({ success: false, error: '图片 URL 仅支持 HTTPS。' }, 400);
      if (imageBase64 && imageBase64.length > 13_500_000) return json({ success: false, error: '图片过大，请压缩到腾讯云支持的大小以内。' }, 413);
      try {
        const response = await tencentCloudRequest(env, {
          service: 'ocr', host: 'ocr.tencentcloudapi.com', action: 'QrcodeOCR', version: '2018-11-19',
          payload: imageBase64 ? { ImageBase64: imageBase64 } : { ImageUrl: imageUrl },
        });
        const result = (response.Response || {}) as Record<string, any>;
        if (result.Error) return json({ success: false, provider: 'tencent-qrcode-ocr', error: '腾讯云未能处理这张图片，请检查图片是否清晰有效。', requestId: result.RequestId }, 502);
        const imgSize = result.ImgSize || {};
        const codes = Array.isArray(result.CodeResults) ? result.CodeResults.map((code: any) => {
          const position = code.Position || {};
          const points = ['LeftTop', 'RightTop', 'RightBottom', 'LeftBottom'].map((key) => position[key]).filter((point) => point && Number(point.X) >= 0 && Number(point.Y) >= 0);
          const xs = points.map((point) => Number(point.X));
          const ys = points.map((point) => Number(point.Y));
          return {
            content: String(code.Url ?? code.Data ?? ''), type: code.TypeName || 'UNKNOWN',
            position: points.length ? { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) } : null,
          };
        }) : [];
        return json({ success: true, provider: 'tencent-qrcode-ocr', requestId: result.RequestId, imageSize: { width: Number(imgSize.Wide || 0), height: Number(imgSize.High || 0) }, codes, message: codes.length ? undefined : '图片中未检测到二维码或条形码。' });
      } catch (error) {
        console.error('Tencent QrcodeOCR failed:', error instanceof Error ? error.message : 'unknown error');
        return json({ success: false, provider: 'tencent-qrcode-ocr', error: '腾讯云二维码/条形码识别失败，请检查图片、密钥或接口配额。' }, 502);
      }
    }
    if (url.pathname === '/api/ocr/recognize' && request.method === 'POST') {
      const input = await body(request);
      const imageBase64 = cleanImageBase64(input.imageBase64);
      if (!imageBase64 && typeof input.imageUrl !== 'string') return json({ success: false, error: '请先拍摄或选择一张图片。' }, 400);
      if (env.TENCENTCLOUD_SECRET_ID && env.TENCENTCLOUD_SECRET_KEY && imageBase64) {
        try {
          const response = await tencentCloudRequest(env, {
            service: 'ocr', host: 'ocr.tencentcloudapi.com', action: 'GeneralAccurateOCR', version: '2018-11-19',
            payload: { ImageBase64: imageBase64 },
          });
          const result = (response.Response || {}) as Record<string, unknown>;
          const detections = Array.isArray(result.TextDetections) ? result.TextDetections : [];
          const text = detections.map((item) => String((item as Record<string, unknown>).DetectedText || '')).filter(Boolean).join(' ');
          if (text) {
            const product = { brand: '', product_name: text, category: '', subcategory: '', shade_name: '', ingredients: [], allergen_tags: [], user_notes: '由腾讯云高精度 OCR 提取文字，请人工核对字段。', ocr_text: text };
            return json({ success: true, product, provider: 'tencent-ocr', requestId: result.RequestId, textDetections: detections });
          }
        } catch (error) {
          console.error('Tencent GeneralAccurateOCR failed:', error instanceof Error ? error.message : 'unknown error');
        }
      }
      if (input.batch === true && imageBase64) {
        try {
          const batch = await deepseekJson(env, '你是化妆柜商品识别助手。只返回 JSON，不要猜测。', '识别整张化妆柜照片中能清楚确认的多个商品，返回 {"products":[{"brand":"","product_name":"","category":"","shade_name":"","size":"","confidence":0,"evidence":""}]}。看不清的字段留空，不能确认的商品不要列出。', imageBase64);
          const items = Array.isArray((batch as any)?.products) ? (batch as any).products : [];
          if (items.length) return json({ success: true, provider: 'deepseek-vision-batch', ai_assisted: true, product: { products: items } });
        } catch { /* continue to single-product providers */ }
      }
      if (imageBase64) {
        try {
          const arkProduct = await arkVisionJson(env, '请读取这张化妆品包装照片。只返回 JSON，字段为 brand、product_name、category、subcategory、shade_name、size、ingredients、confidence；看不清的字段留空，不要猜测。', imageBase64);
          if (arkProduct && typeof arkProduct === 'object' && ((arkProduct as any).product_name || (arkProduct as any).brand || Array.isArray((arkProduct as any).products) || Array.isArray((arkProduct as any).brands))) {
            const normalized = Array.isArray((arkProduct as any).brands) ? { products: (arkProduct as any).brands.map((brand: unknown) => ({ brand: String(brand), complete_product_name: '', category: '' })) } : arkProduct;
            return json({ success: true, provider: 'doubao-vision', ai_assisted: true, product: { ...(normalized as any), user_notes: '由豆包视觉辅助识别，请人工核对。' } });
          }
        } catch (error) { console.error('Doubao OCR vision fallback failed:', error instanceof Error ? error.message : 'unknown error'); }
        const assist = await runVisionAssist(env, imageBase64, '请阅读这张化妆品包装照片并提取可确认的信息。只返回 JSON，字段为 brand、product_name、category、subcategory、shade_name、size、ingredients、confidence；看不清的字段用空字符串或空数组，不要猜测。');
        if (assist && typeof assist === 'object' && !Array.isArray(assist) && ((assist as any).product_name || (assist as any).brand || (assist as any).description)) {
          const value = assist as any;
          return json({ success: true, provider: 'cloudflare-ai-vision', ai_assisted: true, product: { brand: value.brand || '', product_name: value.product_name || value.description || '待人工确认', category: value.category || '', subcategory: value.subcategory || '', shade_name: value.shade_name || '', size: value.size || '', ingredients: Array.isArray(value.ingredients) ? value.ingredients : [], allergen_tags: [], user_notes: '由 Cloudflare AI 辅助识别，请人工核对。', confidence: value.confidence } });
        }
      }
      try {
        const product = await deepseekJson(env, '你是化妆品包装识别助手。只返回 JSON；看不清的字段填 null，不要猜测备案或成分。', '从这张包装图中提取品牌、完整品名、品类、规格、色号和可见成分。', typeof input.imageBase64 === 'string' ? input.imageBase64 : undefined);
        if (product && typeof product === 'object' && Object.values(product as Record<string, unknown>).some((value) => value !== null && value !== '' && !(Array.isArray(value) && value.length === 0))) return json({ success: true, product, provider: 'deepseek' });
      } catch { /* fall through */ }
      return json({ success: false, provider: 'ocr', error: '腾讯云 OCR 未返回可用结果，请重试或调整照片后再识别。' }, 502);
    }
    if (url.pathname === '/api/makeup/parse-tutorial' && request.method === 'POST') {
      const input = await body(request);
      const tutorialUrl = String(input.url || '');
      const description = String(input.description || '');
      if (!tutorialUrl && !description) return json({ success: false, error: '请提供妆教链接或步骤描述。' }, 400);
      try {
        const sources = tutorialUrl ? await searchProductSources(env, `${tutorialUrl} makeup tutorial steps`) : [];
        const prompt = `把用户提供的妆教资料拆成可执行、逐步对应的跟练方案。只根据明确提供的链接摘要/文字，不得声称看过无法访问的视频。不同教程必须保留自己的顺序、色彩、技法和产品；不确定的信息留空。只返回 JSON：{"title":"","platform":"","creator":"","makeupStyle":"","summary":"","steps":["..."],"step_details":[{"id":"step_1","title":"","targetArea":"","layerType":"base|brows|eyeshadow|eyeliner|lashes|blush|contour|highlight|lips|contacts","tool":"","dosage":"","method":[""],"pitfalls":[""],"checklist":[""],"estimatedMin":2,"productName":""}],"stepDiagrams":[{"step":1,"title":"","area":"","tip":"","vanityProduct":""}],"lipSetting":{},"cheekSetting":{},"eyeSetting":{},"baseSetting":{}}。至少 4 步，step_details 与 steps 按索引一一对应。妆教输入：${JSON.stringify({ url: tutorialUrl, description, searchSources: sources, vanityProducts: input.vanityProducts })}`;
        let parsed: any = await arkTextJson(env, prompt);
        let provider = parsed ? 'doubao' : 'fallback';
        if (!parsed) {
          try {
            parsed = await deepseekJson(env, '你是妆教步骤拆解助手。只返回 JSON，不编造无法看到的内容。', prompt, undefined);
            if (parsed) provider = 'deepseek';
          } catch (error) { console.warn('DeepSeek tutorial parsing failed:', error instanceof Error ? error.message : 'unknown'); }
        }
        if (parsed && typeof parsed === 'object') {
          const diagrams = Array.isArray(parsed.stepDiagrams) ? parsed.stepDiagrams : [];
          const steps = Array.isArray(parsed.steps) ? parsed.steps : diagrams.map((step: any) => `${step.title || ''}${step.tip ? `：${step.tip}` : ''}`);
          const normalized = normalizeMakeupSteps(steps, parsed.step_details || diagrams);
          if (normalized.steps.length) {
            const result = { ...parsed, ...normalized, stepDiagrams: diagrams.length ? diagrams : normalized.step_details.map((step, index) => ({ step: index + 1, title: step.title, area: step.targetArea, tip: step.method.join('；'), vanityProduct: step.productName || '' })) };
            return json({ success: true, result, look: { title: result.title || 'AI 妆教跟练', type: 'imitation', occasion: result.platform || '妆教跟练', description: result.summary || '', matched_products: [], steps: normalized.steps, step_details: normalized.step_details, minimal_5min_tip: '' }, provider });
          }
        }
      } catch (error) { console.warn('Tutorial parse provider failed:', error instanceof Error ? error.message : 'unknown'); }
      const steps = ['妆前与底妆：薄涂均匀并保留皮肤纹理', '眼妆：按参考妆容铺色并逐层晕染', '腮红与修容：根据参考位置少量叠加', '唇妆：按参考色彩和边缘效果完成'];
      const normalized = normalizeMakeupSteps(steps, []);
      const result = { title: '妆教分步跟练', platform: '妆教', summary: description || '链接内容无法读取，请按可见教程核对步骤。', ...normalized, stepDiagrams: normalized.step_details.map((step, index) => ({ step: index + 1, title: step.title, area: step.targetArea, tip: step.method.join('；'), vanityProduct: '' })) };
      return json({ success: true, result, look: { title: result.title, type: 'imitation', occasion: '妆教跟练', description: result.summary, matched_products: [], steps: normalized.steps, step_details: normalized.step_details, minimal_5min_tip: '' }, provider: 'fallback' });
    }
    if (url.pathname === '/api/makeup/generate' && request.method === 'POST') {
      const input = await body(request);
      const characterGuidance = input.lookType === 'cos' && input.characterName ? `角色妆造必须严格遵循${String(input.characterName)}的视觉设定。若为芙宁娜 Furina，使用枫丹舞台感、蓝白冷调、精致上挑眼线、蓝灰眼影、明亮高光和偏玫红唇色，避免生成普通日常妆。` : '';
      if (typeof input.referenceImage === 'string' && input.referenceImage) {
        try {
          const visual = await arkVisionJson(env, `根据这张妆容参考图和用户输入生成可执行妆容方案。${characterGuidance}只返回 JSON，字段必须包含 title、occasion、description、matched_products、steps、step_details、lighting_advice、minimal_5min_tip。step_details 至少 8 项，每项包含 id、title、targetArea、layerType、tool、dosage、method、pitfalls、checklist、estimatedMin。用户输入：${JSON.stringify({ lookType: input.lookType, characterName: input.characterName, referenceDescription: input.referenceDescription })}`, cleanImageBase64(input.referenceImage));
          if (visual) return json({ success: true, look: { ...visual, ...normalizeMakeupSteps(visual.steps, visual.step_details) }, provider: 'doubao-vision' });
        } catch { /* fall through to text generation */ }
      }
      const prompt = `根据用户需求生成完整的个性化妆容方案。只返回 JSON，包含 title、occasion、description、matched_products、steps、step_details、lighting_advice、minimal_5min_tip。至少 6 个步骤，每一步在 step_details 中与 steps 按索引一一对应，覆盖该妆容实际需要的底妆、眉眼、腮红/修容和唇妆。每项提供 title、targetArea、layerType、productName、tool、dosage、method、pitfalls、checklist、estimatedMin。不同风格和角色要有对应的色盘、手法与顺序，不要统一套用模板；只改变妆容，不评论或贬低外貌。角色要求：${characterGuidance || '无'} 用户需求：${JSON.stringify({ lookType: input.lookType, characterName: input.characterName, referenceDescription: input.referenceDescription, vanityProducts: input.vanityProducts })}`;
      try {
        const doubaoLook = await arkTextJson(env, prompt);
        if (doubaoLook && typeof doubaoLook === 'object') {
          const normalized = normalizeMakeupSteps((doubaoLook as any).steps, (doubaoLook as any).step_details);
          if (normalized.steps.length >= 3) return json({ success: true, look: { ...(doubaoLook as any), ...normalized }, provider: 'doubao' });
        }
      } catch (error) { console.warn('Doubao makeup text generation failed:', error instanceof Error ? error.message : 'unknown'); }
      try {
        const look = await deepseekJson(env, '你是温和的专业妆造师。只返回 JSON，避免容貌焦虑表达。', prompt, undefined);
        if (look) return json({ success: true, look: { ...look as any, ...normalizeMakeupSteps((look as any).steps, (look as any).step_details) }, provider: 'deepseek' });
      } catch { /* fall through */ }
      const cosFallback = input.lookType === 'cos' && input.characterName ? `${String(input.characterName)}·角色定制妆` : '自然氧气妆';
      const stepsFallback = input.lookType === 'cos' && input.characterName === '芙宁娜' ? ['冷白底妆与定妆','细眉和眉峰塑形','蓝灰眼影铺设','上挑细眼线','自然睫毛与眼尾加强','冷粉腮红与面中高光','鼻梁和下颌修容','偏玫红唇妆与唇峰提亮'] : ['底妆','眉毛','眼影','眼线','睫毛','腮红','修容与高光','唇妆'];
      const layerTypes = ['base', 'brows', 'eyeshadow', 'eyeliner', 'lashes', 'blush', 'contour', 'lips'];
      const stepDetails = stepsFallback.map((title, index) => ({ id: `step_${index + 1}`, title, targetArea: ['全脸', '眉毛', '眼窝', '眼型边界', '睫毛根部', '苹果肌/颧骨', '鼻梁/面中/下颌', '上下唇'][index], layerType: layerTypes[index], tool: '干净刷具或指腹', dosage: '少量多次', method: [`按当前步骤的${title}区域操作，边缘向外晕染并保留原始纹理。`], pitfalls: ['避免覆盖非目标区域或一次使用过量'], checklist: ['左右协调、边缘自然、完成后再进入下一步'], estimatedMin: 3 }));
      const normalized = normalizeMakeupSteps(stepsFallback, stepDetails);
      return json({ success: true, look: { title: cosFallback, occasion: input.lookType === 'cos' ? '角色摄影 / 漫展妆造' : '日常通勤', description: characterGuidance || '当前使用规则化妆容方案。', matched_products: [], ...normalized }, provider: 'fallback' });
    }
    if (url.pathname === '/api/idle/rescue' && request.method === 'POST') return json({ success: true, suggestions: [] });

    return json({ success: false, error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
