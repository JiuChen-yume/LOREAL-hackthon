# Beauty Twin API 简明技术文档

本文档根据当前项目代码整理，适用于本地 Express 服务和 Cloudflare Worker 部署。

## 1. 基本信息

- **接口前缀**：`/api`
- **本地启动**：`npm run dev`，默认地址 `http://localhost:3000`
- **Cloudflare 部署**：`npm run cf:deploy`
- **请求格式**：JSON；请求头使用 `Content-Type: application/json`
- **图片格式**：多数图片接口接受 Base64 或 `data:image/...;base64,...`。服务端会去掉 data URL 前缀。
- **响应格式**：JSON，成功时通常包含 `success: true`；失败时包含 `success: false` 和 `error`。
- **认证状态**：当前演示版本没有真正的用户鉴权；`/api/auth/session` 返回本地演示会话。

## 2. 前端业务接口

### 2.1 系统与配置

| 方法 | 路径 | 用途 | 主要返回字段 |
|---|---|---|---|
| GET | `/api/health` | 检查服务是否正常 | `service`, `environment`, `ai_enabled` |
| GET | `/api/catalog` | 返回当前接口目录及配置状态 | `generated_at`, `apis[]` |
| GET | `/api/ai/health` | 检查 AI 提供商配置 | `provider`, 各提供商 `*_configured` |
| GET | `/api/auth/session` | 获取登录状态 | `authenticated`, `provider` |
| GET | `/api/weather` | 天气和 UV 数据入口 | 当前未配置时返回 HTTP 503 |

### 2.2 化妆台与产品

#### 获取产品列表

```http
GET /api/products
```

Cloudflare 版本从 D1 的 `products` 表读取最近 100 条；本地 Express 版本返回空列表占位数据。

#### 新增产品

```http
POST /api/products
Content-Type: application/json

{
  "brand": "巴黎欧莱雅",
  "product_name": "第二代黑精华肌底液",
  "category": "skincare",
  "subcategory": "精华",
  "barcode": "6923700941829",
  "shade_name": "",
  "shade_hex": "",
  "ingredients": [],
  "try_on": {
    "provider": "unavailable",
    "effectId": "",
    "defaultIntensity": 75,
    "status": "unconfigured"
  }
}
```

返回 `201` 和 `{ success, data }`，其中 `data.id` 是服务端生成的产品 ID。

#### 批量同步产品

```http
POST /api/products/sync
```

请求体：`{ "products": [产品对象] }`。返回 `{ success, synced: [{ id, syncStatus }], storage }`。Cloudflare 版本写入 D1；本地版本写入本地占位层。

#### 删除产品

```http
DELETE /api/products/batch

{ "ids": ["product-id-1", "product-id-2"] }
```

也可以传 `{ "prefix": "candidate_" }` 按 ID 前缀删除。

#### 产品成分资料补全

```http
POST /api/products/enrich

{ "product": { "brand": "理肤泉", "product_name": "B5 多效保湿修复霜", "size": "40ml" } }
```

必须提供 `brand` 和 `product_name`。返回状态为：

- `confirmed`：找到资料且标记为已确认；
- `needs_verification`：找到候选资料，需要人工核对；
- `not_found`：没有可确认的成分资料；
- `failed`：服务调用失败。

返回中的 `product.ingredient_records[]` 保存成分名、INCI、来源、来源 URL 和 `verified` 状态。

### 2.3 图片上传、识别与条码

#### 上传图片到 R2

```http
POST /api/uploads

{ "imageBase64": "data:image/jpeg;base64,..." }
```

Cloudflare 版本把图片写入 R2，返回 `{ success, key, storage: "cloudflare-r2" }`。本地 Express 版本是占位接口。

#### 包装文字 OCR

```http
POST /api/ocr/recognize

{ "imageBase64": "data:image/jpeg;base64,...", "batch": false }
```

处理顺序：腾讯云 `GeneralAccurateOCR` → 批量商品视觉识别 → 豆包视觉 → Cloudflare AI / DeepSeek / Gemini。常见返回字段：`provider`、`requestId`、`textDetections`、`ocrText`、`product`。

#### 多商品识别

```http
POST /api/product/recognize
```

或使用兼容别名：`POST /api/vision/detect-products`。

请求体支持：

```json
{ "imageBase64": "..." }
```

或：

```json
{ "imageUrl": "https://example.com/photo.jpg" }
```

返回 `{ success, provider, requestId, products[] }`。每个商品包含 `name`、`parents`、`confidence` 和 `bbox`。腾讯云没有结果时，会依次尝试豆包、DeepSeek 或 Cloudflare AI 辅助识别。

#### 二维码 / 条形码识别

```http
POST /api/barcode/recognize

{ "imageBase64": "..." }
```

也支持 HTTPS 图片 URL。返回 `{ success, provider, requestId, imageSize, codes[] }`，`codes[]` 包含 `content`、`type` 和二维码位置 `position`。

#### 演示条码查询

```http
POST /api/scanner/barcode

{ "barcode": "6923700941829" }
```

当前包含本地演示商品库，也支持 `qrData` 和 `imageBase64`。匹配成功返回 `source`、`barcode`、`scan_type` 和 `product`。

### 2.4 AI 护理、妆容与成分分析

#### 生成护理计划

```http
POST /api/home/generate-plan

{
  "timeBudget": "5min",
  "onlyVanity": true,
  "specialScenario": "换季敏感",
  "skinCondition": "偏干，局部泛红",
  "blacklist": ["高浓度酒精"],
  "vanityProducts": []
}
```

返回 `{ success, plan, provider? }`。`plan` 至少包含 `title`、`skin_status_summary`、`morning_steps`、`evening_steps`。

#### 成分兼容性检查

```http
POST /api/compatibility/check

{ "products": [产品对象], "blacklist": ["成分名"] }
```

返回 `{ success, report, provider? }`。`report` 包含 `safety_level`（`safe` / `warning` / `danger`）、`summary`、`conflicts`、`ingredient_overlap`、`recommended_order` 和 `disclaimer`。

#### 生成妆容方案

```http
POST /api/makeup/generate

{
  "lookType": "daily",
  "characterName": "",
  "referenceDescription": "温润氧气自然感",
  "referenceImage": "",
  "vanityProducts": [],
  "aestheticProfile": {}
}
```

返回 `{ success, look, provider? }`。`look` 包含 `title`、`occasion`、`description`、`matched_products`、`steps`、`lighting_advice` 和 `minimal_5min_tip`。

#### 解析妆教

```http
POST /api/makeup/parse-tutorial

{
  "url": "https://www.xiaohongshu.com/...",
  "description": "清透韩系倒三角妆",
  "vanityProducts": []
}
```

返回 `{ success, result }`，包含平台、妆容风格、唇颊眼底妆参数和 `stepDiagrams[]`。

#### 闲置产品拯救建议

```http
POST /api/idle/rescue

{ "product": { "brand": "", "product_name": "", "category": "", "ingredients": [] } }
```

返回 `{ success, suggestions[] }`。

### 2.5 妆容记录、计划与头像

| 方法 | 路径 | 请求体 | 说明 |
|---|---|---|---|
| POST | `/api/routine/today-products` | `{ product?, plan? }` | 把产品或当天护理计划写入今日计划 |
| POST | `/api/makeup/follow-along/save` | `{ lookId, progress[] }` | 保存跟练进度 |
| POST | `/api/makeup/archive` | `{ look }` | 保存妆容档案 |
| POST | `/api/avatar/generate` | `{ imageBase64, prompt? }` | 使用豆包 Seedream 生成临时卡通头像 |
| POST | `/api/makeup/render` | `{ imageBase64, prompt? }` | 使用 Seedream 生成妆效图，可返回分层结果 `renderedLayers[]` |

头像和妆效图接口返回的图片可能是临时 URL 或 Base64，字段为 `imageUrl`。未配置 Seedream 时返回 HTTP 503。

### 2.6 账户、提醒、回收与备案

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/profile` | 获取用户资料 |
| PUT | `/api/profile` | 更新 `display_name`、`privacy_consent` |
| GET | `/api/reminders` | 查询提醒 |
| POST | `/api/reminders` | 新增提醒，字段包括 `type`、`title`、`due_at` |
| GET | `/api/recycling` | 查询回收记录 |
| POST | `/api/recycling` | 新增回收记录，字段包括 `item_name`、`points` |
| GET | `/api/products/{id}/filing-status` | 查询产品备案状态 |

Cloudflare 版本将这些数据写入 D1；备案接口当前返回 `pending_verification`，来源为“官方平台人工核验”。

## 3. WebAR 静态图片试妆接口

前端 `TencentStaticPhotoAdapter` 使用两个服务端接口获取腾讯 WebAR 配置：

```http
GET /api/webar/config
GET /api/webar/signature
```

`/api/webar/config` 返回 `{ success, config: { appId, licenseKey } }`；`/api/webar/signature` 返回 `{ signature, timestamp }`。密钥只在服务端环境变量中读取，前端不会直接保存签名 Token。

## 4. 外部 API 清单

### Google Gemini

- SDK：`@google/genai`
- 服务端模型：`gemini-3.8-flash`
- 调用位置：护理计划、兼容性分析、包装 OCR、条码补充查询、妆容生成、妆教解析、闲置拯救。
- 认证变量：`GEMINI_API_KEY`
- 输出约束：通过 `responseMimeType: application/json` 要求 JSON。

### DeepSeek

- 地址：`https://api.deepseek.com/chat/completions`
- Cloudflare 模型：`deepseek-flash`
- 认证变量：`DEEPSEEK_API_KEY`
- 用途：Cloudflare 部署下的护理计划、兼容性分析、OCR / 商品识别和妆容生成兜底。

### 豆包 / 火山方舟

- 地址：`${DOUBAO_BASE_URL}/chat/completions`，默认 `https://ark.cn-beijing.volces.com/api/v3`
- 认证变量：`DOUBAO_API_KEY` 或 `VOLCENGINE_ARK_API_KEY`
- 模型变量：`DOUBAO_MODEL` 或 `VOLCENGINE_ARK_ENDPOINT`
- 用途：图片视觉识别、批量商品识别、成分资料结构化和参考图妆容分析。

### 豆包 Seedream 图像生成

- 地址：`VOLCENGINE_IMAGE_ENDPOINT`
- 认证变量：`VOLCENGINE_IMAGE_API_KEY`，也可回退使用 `VOLCENGINE_ARK_API_KEY`
- 模型变量：`VOLCENGINE_IMAGE_MODEL`
- 用途：卡通头像 `/api/avatar/generate`、妆效图 `/api/makeup/render` 和可选妆容分层。

### 腾讯云 API

服务端使用 TC3-HMAC-SHA256 签名，密钥变量为 `TENCENTCLOUD_SECRET_ID`、`TENCENTCLOUD_SECRET_KEY`，区域默认 `ap-guangzhou`。

| 腾讯云服务 | Action | 项目用途 |
|---|---|---|
| OCR | `GeneralAccurateOCR`，版本 `2018-11-19` | 包装文字识别 |
| OCR | `QrcodeOCR`，版本 `2018-11-19` | 二维码、条形码和坐标识别 |
| TIIA | `DetectProduct`，版本 `2019-05-29` | 一张图片中的多商品识别和定位 |

对应域名分别是 `ocr.tencentcloudapi.com` 和 `tiia.tencentcloudapi.com`。

### Cloudflare 服务

- **D1**：产品、资料、跟练进度、提醒、回收记录和用户资料。
- **R2**：`POST /api/uploads` 的图片对象存储。
- **Workers AI**：绑定名 `AI`，使用 `@cf/llava-hf/llava-1.5-7b-hf` 做视觉辅助识别。
- **WebAR**：腾讯 WebAR 的 `appId`、`licenseKey` 和签名 Token 只通过 Worker 代理。

## 5. AI 降级顺序

项目按“有配置就调用，失败后继续降级”的方式运行：

1. 视觉识别优先腾讯云；无结果时尝试豆包、DeepSeek 或 Workers AI。
2. 成分资料优先豆包文本模型，Cloudflare 版本随后尝试 DeepSeek。
3. 本地 Express 的文本能力优先 Gemini；超时或未配置时使用规则化演示数据。
4. 未配置任何外部服务时，接口仍返回结构完整的本地演示结果，便于前端联调。

## 6. 环境变量配置

复制 `.env.example` 配置本地服务；Cloudflare 部署使用 Wrangler Secrets / Variables。密钥只放服务端，不能写入 `src/` 前端代码。

最常用的变量：

```text
GEMINI_API_KEY
DEEPSEEK_API_KEY
TENCENTCLOUD_SECRET_ID
TENCENTCLOUD_SECRET_KEY
TENCENTCLOUD_REGION
VOLCENGINE_ARK_API_KEY
VOLCENGINE_ARK_ENDPOINT
VOLCENGINE_IMAGE_API_KEY
VOLCENGINE_IMAGE_ENDPOINT
VOLCENGINE_IMAGE_MODEL
WEBAR_APP_ID
WEBAR_LICENSE_KEY
WEBAR_TOKEN
```

