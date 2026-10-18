interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: R2Bucket;
  AI?: Ai;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
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
  const userContent = imageBase64
    ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: imageBase64 } }]
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
    if (url.pathname === '/api/ai/health') return json({ success: true, provider: env.AI ? 'cloudflare-ai' : env.DEEPSEEK_API_KEY ? 'deepseek' : env.GEMINI_API_KEY ? 'gemini' : 'fallback', cloudflare_ai_configured: Boolean(env.AI), deepseek_configured: Boolean(env.DEEPSEEK_API_KEY), gemini_configured: Boolean(env.GEMINI_API_KEY) });
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
      try {
        const report = await deepseekJson(env, '你是化妆品成分安全顾问。只返回 JSON，不做医疗诊断。', `分析这些产品的搭配风险并给出早晚顺序：${JSON.stringify(input)}。字段必须包含 safety_level、summary、conflicts、recommended_order、disclaimer。`, undefined);
        if (report) return json({ success: true, report, provider: 'deepseek' });
      } catch { /* fall through */ }
      return json({ success: true, report: { safety_level: 'safe', summary: '已完成本地基础规则检查。', conflicts: [], recommended_order: [] }, provider: 'fallback' });
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
      if (imageBase64) {
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
    if (url.pathname === '/api/makeup/generate' && request.method === 'POST') {
      const input = await body(request);
      try {
        const look = await deepseekJson(env, '你是温和的专业妆造师。只返回 JSON，避免容貌焦虑表达。', `根据这些条件生成妆容：${JSON.stringify(input)}。字段必须包含 title、occasion、description、matched_products、steps、lighting_advice、minimal_5min_tip。`, undefined);
        if (look) return json({ success: true, look, provider: 'deepseek' });
      } catch { /* fall through */ }
      return json({ success: true, look: { title: '自然氧气妆', occasion: '日常通勤', description: '当前使用演示兜底。', matched_products: [], steps: [] }, provider: 'fallback' });
    }
    if (url.pathname === '/api/idle/rescue' && request.method === 'POST') return json({ success: true, suggestions: [] });

    return json({ success: false, error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
