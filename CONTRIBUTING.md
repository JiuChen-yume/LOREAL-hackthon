# Contributing to Beauty Twin AI

感谢你愿意改进 Beauty Twin AI。这个仓库同时包含 React/Vite 前端、本地 Express API 和 Cloudflare Worker 版本，提交前请保持三者的接口行为一致。

## 开发流程

1. 从 `main` 创建一个主题分支，例如 `feat/product-enrichment` 或 `fix/makeup-render`。
2. 先阅读 [README.md](README.md) 和 [docs/API-TECHNICAL.md](docs/API-TECHNICAL.md)。
3. 只在服务端读取密钥；不要提交 `.env`、Base64 图片、真实用户照片或控制台 Token。
4. 对接口或数据结构的改动，同时更新对应的类型、Worker 路由和文档。

## 提交前检查

```bash
npm install
npm run lint
npm run build
```

涉及 Cloudflare Worker 时，再执行：

```bash
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM --skipLibCheck cloudflare/worker.ts worker-configuration.d.ts
```

## Pull Request 说明

请描述：

- 改动解决了什么用户问题；
- 修改了哪些 API、页面或数据结构；
- 如何验证；
- 是否需要新增 Cloudflare Secret、D1 migration 或真实 AI 素材。

如果改动涉及识别或生图，请附上脱敏后的请求/响应结构，避免上传真实密钥和用户照片。
