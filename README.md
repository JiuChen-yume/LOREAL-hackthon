# 我的化妆台 AI（本地网站版）

当前项目已切换为压缩包中的 React/Vite 网站版本，入口位于 `src/`，本地服务同时提供页面和 AI 相关接口。

## 本地运行

前置条件：Node.js 18+

```bash
npm install
npm run dev
```

打开 <http://localhost:3000> 即可访问。

项目未配置 `GEMINI_API_KEY` 时会自动使用内置演示数据，因此无需密钥也能完整体验页面；如需启用 Gemini，再复制 `.env.example` 为 `.env` 并填写密钥。

## 生产构建

```bash
npm run build
$env:NODE_ENV="production"  # PowerShell
npm start
```

生产服务仍使用 3000 端口，并从 `dist/` 提供构建后的页面。

## 部署到 Cloudflare

本项目可以使用 Cloudflare Workers 同时托管前端静态资源和后端 API，D1 负责产品、资料、提醒和回收记录。图片后续接入 R2，Gemini、腾讯云 OCR、和风天气等密钥只放在 Worker Secret 中。

首次部署只需要 Cloudflare 账号，不需要另外购买阿里云服务器：

```bash
npm install
npx wrangler login
npx wrangler d1 create beauty-twin-db
```

把 `d1 create` 输出的 `database_id` 填入 `wrangler.jsonc`，再执行：

```bash
npx wrangler d1 migrations apply beauty-twin-db --remote
npx wrangler secret put GEMINI_API_KEY
npm run cf:deploy
```

部署前可以在本地模拟 Workers：

```bash
npm run cf:dev
```

`wrangler.jsonc`、`cloudflare/worker.ts` 和 `migrations/0001_initial.sql` 是 Cloudflare 部署入口。当前本地 Express 服务仍保留，便于继续开发；Cloudflare 版本使用同域名 API，不需要在前端额外配置后端地址。

图片通过 `POST /api/uploads` 写入 R2 的 `beauty-twin-images` bucket；生产环境建议再增加登录态和文件大小校验。

Cloudflare Worker 已接入 DeepSeek Flash：护理计划、兼容性解释、妆容生成和图片理解会优先调用 DeepSeek，调用失败时回退到本地演示数据。密钥使用 `wrangler secret put DEEPSEEK_API_KEY` 保存，不写入前端。

妆造工作室已接入 `tencentcloud-webar`：打开详细试妆镜即可使用实时摄像头画布、美白、磨皮、瘦脸、大眼和腾讯特效 ID。启用线上 WebAR 前配置：

```bash
wrangler secret put WEBAR_APP_ID
wrangler secret put WEBAR_LICENSE_KEY
wrangler secret put WEBAR_TOKEN
wrangler deploy
```

腾讯 Web License 需要在控制台登记实际访问域名；本地 `localhost` 可直接用于调试，线上自定义域名需要加入 License 的域名配置。
